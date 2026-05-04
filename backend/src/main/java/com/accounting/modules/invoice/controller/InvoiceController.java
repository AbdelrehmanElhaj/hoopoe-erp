package com.accounting.modules.invoice.controller;

import com.accounting.modules.invoice.dto.CreateCreditNoteRequest;
import com.accounting.modules.invoice.dto.CreateInvoiceRequest;
import com.accounting.modules.invoice.dto.InvoiceResponse;
import com.accounting.modules.invoice.entity.Invoice;
import com.accounting.modules.invoice.service.InvoicePdfService;
import com.accounting.modules.invoice.service.InvoiceService;
import com.accounting.multitenancy.TenantContext;
import com.accounting.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoicePdfService invoicePdfService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<InvoiceResponse>>> findAll(
            @PageableDefault(size = 20, sort = "issueDatetime") Pageable pageable) {
        Page<InvoiceResponse> page = invoiceService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(
                InvoiceResponse.from(invoiceService.findById(id))));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> create(
            @Valid @RequestBody CreateInvoiceRequest request) {
        Invoice invoice = invoiceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(InvoiceResponse.from(invoice), "Invoice created"));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> confirm(@PathVariable UUID id) throws Exception {
        String subdomain = TenantContext.getCurrentTenant();
        Invoice invoice = invoiceService.confirm(id, subdomain);
        return ResponseEntity.ok(ApiResponse.ok(InvoiceResponse.from(invoice),
                "Invoice confirmed and submitted to ZATCA"));
    }

    @PostMapping("/{id}/credit-note")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createCreditNote(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCreditNoteRequest request) {
        Invoice creditNote = invoiceService.createCreditNote(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(InvoiceResponse.from(creditNote), "تم إنشاء الإشعار الدائن"));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> cancel(
            @PathVariable UUID id,
            @RequestParam String reason) {
        Invoice invoice = invoiceService.cancel(id, reason);
        return ResponseEntity.ok(ApiResponse.ok(InvoiceResponse.from(invoice), "Invoice cancelled"));
    }

    @PostMapping("/{id}/submit-zatca")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> submitToZatca(@PathVariable UUID id) {
        Invoice invoice = invoiceService.findById(id);
        invoice = invoiceService.submitToZatca(invoice);
        return ResponseEntity.ok(ApiResponse.ok(InvoiceResponse.from(invoice), "Submitted to ZATCA"));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable UUID id) {
        Invoice invoice = invoiceService.findById(id);
        byte[] pdfBytes = invoicePdfService.generate(invoice);
        String filename = "invoice-" + invoice.getInvoiceNumber() + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(pdfBytes);
    }
}
