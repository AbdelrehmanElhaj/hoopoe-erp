package com.accounting.modules.invoice.service;

import com.accounting.modules.invoice.dto.CreateInvoiceRequest;
import com.accounting.modules.invoice.dto.InvoiceResponse;
import com.accounting.modules.invoice.dto.InvoiceTotals;
import com.accounting.modules.invoice.entity.Invoice;
import com.accounting.modules.invoice.entity.InvoiceItem;
import com.accounting.modules.invoice.repository.InvoiceRepository;
import com.accounting.modules.zatca.service.ZatcaApiClient;
import com.accounting.modules.zatca.service.ZatcaQrCodeService;
import com.accounting.modules.zatca.service.ZatcaSignatureService;
import com.accounting.modules.zatca.service.ZatcaXmlService;
import com.accounting.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final VatCalculationService vatCalculationService;
    private final InvoiceJournalService invoiceJournalService;
    private final ZatcaXmlService xmlService;
    private final ZatcaQrCodeService qrService;
    private final ZatcaSignatureService signatureService;
    private final ZatcaApiClient zatcaApiClient;

    @Transactional
    public Invoice create(CreateInvoiceRequest request) {
        InvoiceTotals totals = vatCalculationService.calculate(request.getItems());

        Invoice invoice = Invoice.builder()
                .invoiceNumber(generateInvoiceNumber())
                .invoiceType(request.getInvoiceType())
                .invoiceSubtype(request.getInvoiceType() == Invoice.InvoiceType.STANDARD ? "0100000" : "0200000")
                .sellerNameAr(request.getSellerNameAr())
                .sellerVatNumber(request.getSellerVatNumber())
                .sellerCrNumber(request.getSellerCrNumber())
                .sellerAddress(request.getSellerAddress())
                .buyerName(request.getBuyerName())
                .buyerVatNumber(request.getBuyerVatNumber())
                .buyerAddress(request.getBuyerAddress())
                .issueDatetime(request.getIssueDatetime() != null ? request.getIssueDatetime() : Instant.now())
                .supplyDate(request.getSupplyDate())
                .dueDate(request.getDueDate())
                .subtotal(totals.getSubtotal())
                .discountAmount(totals.getDiscountAmount())
                .taxableAmount(totals.getTaxableAmount())
                .vatAmount(totals.getVatAmount())
                .totalAmount(totals.getTotalAmount())
                .status(Invoice.InvoiceStatus.DRAFT)
                .zatcaStatus(Invoice.ZatcaStatus.NOT_SUBMITTED)
                .build();

        AtomicInteger lineNum = new AtomicInteger(1);
        for (var itemReq : request.getItems()) {
            InvoiceItem item = vatCalculationService.buildItem(itemReq, lineNum.getAndIncrement());
            item.setInvoice(invoice);
            invoice.getItems().add(item);
        }

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice confirm(UUID invoiceId, String subdomain) throws Exception {
        Invoice invoice = findById(invoiceId);

        if (!invoice.isEditable()) {
            throw new BusinessException("Invoice cannot be modified after confirmation");
        }

        String xmlContent = xmlService.generateXml(invoice);
        String xmlHash = signatureService.computeHash(xmlContent);
        String digitalSignature = signatureService.sign(subdomain, xmlContent.getBytes());

        // Phase 2 QR code
        String publicKeyBase64 = ""; // loaded from cert
        String qrCode = qrService.generatePhase2Qr(
                invoice, xmlHash, digitalSignature, publicKeyBase64, null);

        invoice.setXmlContent(xmlContent);
        invoice.setXmlHash(xmlHash);
        invoice.setDigitalSignature(digitalSignature);
        invoice.setQrCodeBase64(qrCode);
        invoice.setStatus(Invoice.InvoiceStatus.CONFIRMED);

        invoice = invoiceRepository.save(invoice);

        // Auto-post accounting journal entry
        var journalEntry = invoiceJournalService.createForInvoice(invoice);
        invoice.setJournalEntryId(journalEntry.getId());
        invoice = invoiceRepository.save(invoice);

        submitToZatca(invoice);

        return invoice;
    }

    @Transactional
    public Invoice submitToZatca(Invoice invoice) {
        try {
            String xmlBase64 = Base64.getEncoder().encodeToString(
                    invoice.getXmlContent().getBytes());

            Map<String, Object> response;
            if (invoice.getInvoiceType() == Invoice.InvoiceType.STANDARD) {
                response = zatcaApiClient.clearInvoice(
                        xmlBase64, invoice.getXmlHash(), invoice.getUuid().toString(),
                        "", "");  // cert and secret loaded from tenant in production
            } else {
                response = zatcaApiClient.reportInvoice(
                        xmlBase64, invoice.getXmlHash(), invoice.getUuid().toString(),
                        "", "");
            }

            invoice.setZatcaResponse(response);
            invoice.setZatcaSubmittedAt(Instant.now());

            String statusStr = (String) response.getOrDefault("status", "PENDING");
            invoice.setZatcaStatus(
                    "CLEARED".equals(statusStr) ? Invoice.ZatcaStatus.CLEARED :
                    "REPORTED".equals(statusStr) ? Invoice.ZatcaStatus.REPORTED :
                    Invoice.ZatcaStatus.PENDING
            );

            if (invoice.getZatcaStatus() == Invoice.ZatcaStatus.CLEARED) {
                invoice.setZatcaClearedAt(Instant.now());
            }

            log.info("Invoice {} submitted to ZATCA: {}", invoice.getInvoiceNumber(), statusStr);
        } catch (Exception e) {
            log.error("ZATCA submission failed for invoice {}: {}", invoice.getInvoiceNumber(), e.getMessage());
            invoice.setZatcaStatus(Invoice.ZatcaStatus.PENDING);
        }

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice cancel(UUID invoiceId, String reason) {
        Invoice invoice = findById(invoiceId);
        if (invoice.getStatus() == Invoice.InvoiceStatus.CANCELLED) {
            throw new BusinessException("Invoice is already cancelled");
        }
        if (invoice.getStatus() == Invoice.InvoiceStatus.CONFIRMED) {
            throw new BusinessException("Confirmed invoices must be cancelled via Credit Note");
        }
        invoice.setStatus(Invoice.InvoiceStatus.CANCELLED);
        return invoiceRepository.save(invoice);
    }

    @Transactional(readOnly = true)
    public Page<InvoiceResponse> findAll(Pageable pageable) {
        return invoiceRepository.findAll(pageable).map(InvoiceResponse::from);
    }

    @Transactional(readOnly = true)
    public Invoice findById(UUID id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Invoice not found", HttpStatus.NOT_FOUND));
    }

    private String generateInvoiceNumber() {
        int year = Year.now().getValue();
        long count = invoiceRepository.countByCurrentYear(year) + 1;
        return String.format("INV-%d-%06d", year, count);
    }
}
