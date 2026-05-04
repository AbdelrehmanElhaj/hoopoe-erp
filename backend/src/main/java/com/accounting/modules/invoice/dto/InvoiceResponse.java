package com.accounting.modules.invoice.dto;

import com.accounting.modules.invoice.entity.Invoice;
import com.accounting.modules.invoice.entity.InvoiceItem;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class InvoiceResponse {

    private UUID id;
    private String invoiceNumber;
    private UUID uuid;
    private String invoiceType;
    private String sellerNameAr;
    private String sellerVatNumber;
    private String buyerName;
    private String buyerVatNumber;
    private Instant issueDatetime;
    private LocalDate supplyDate;
    private LocalDate dueDate;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxableAmount;
    private BigDecimal vatAmount;
    private BigDecimal totalAmount;
    private String currency;
    private String status;
    private String zatcaStatus;
    private String qrCodeBase64;
    private boolean creditNote;
    private UUID originalInvoiceId;
    private UUID journalEntryId;
    private List<ItemResponse> items;
    private Instant createdAt;

    @Data
    @Builder
    public static class ItemResponse {
        private int lineNumber;
        private String descriptionAr;
        private BigDecimal quantity;
        private BigDecimal unitPrice;
        private BigDecimal discountPercent;
        private BigDecimal taxableAmount;
        private String taxCategory;
        private BigDecimal taxRate;
        private BigDecimal vatAmount;
        private BigDecimal totalAmount;
    }

    public static InvoiceResponse from(Invoice invoice) {
        List<ItemResponse> items = invoice.getItems().stream()
                .map(i -> ItemResponse.builder()
                        .lineNumber(i.getLineNumber())
                        .descriptionAr(i.getDescriptionAr())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .discountPercent(i.getDiscountPercent())
                        .taxableAmount(i.getTaxableAmount())
                        .taxCategory(i.getTaxCategory().name())
                        .taxRate(i.getTaxRate())
                        .vatAmount(i.getVatAmount())
                        .totalAmount(i.getTotalAmount())
                        .build())
                .toList();

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .uuid(invoice.getUuid())
                .invoiceType(invoice.getInvoiceType().name())
                .sellerNameAr(invoice.getSellerNameAr())
                .sellerVatNumber(invoice.getSellerVatNumber())
                .buyerName(invoice.getBuyerName())
                .buyerVatNumber(invoice.getBuyerVatNumber())
                .issueDatetime(invoice.getIssueDatetime())
                .supplyDate(invoice.getSupplyDate())
                .dueDate(invoice.getDueDate())
                .subtotal(invoice.getSubtotal())
                .discountAmount(invoice.getDiscountAmount())
                .taxableAmount(invoice.getTaxableAmount())
                .vatAmount(invoice.getVatAmount())
                .totalAmount(invoice.getTotalAmount())
                .currency(invoice.getCurrency())
                .status(invoice.getStatus().name())
                .zatcaStatus(invoice.getZatcaStatus().name())
                .qrCodeBase64(invoice.getQrCodeBase64())
                .creditNote(invoice.isCreditNote())
                .originalInvoiceId(invoice.getOriginalInvoiceId())
                .journalEntryId(invoice.getJournalEntryId())
                .items(items)
                .createdAt(invoice.getCreatedAt())
                .build();
    }
}
