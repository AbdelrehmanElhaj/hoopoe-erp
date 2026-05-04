package com.accounting.modules.invoice.entity;

import com.accounting.shared.entity.AuditEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "invoices")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Invoice extends AuditEntity {

    @Column(name = "invoice_number", unique = true, nullable = false, length = 50)
    private String invoiceNumber;

    @Column(nullable = false)
    @Builder.Default
    private UUID uuid = UUID.randomUUID();

    @Column(name = "invoice_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InvoiceType invoiceType = InvoiceType.STANDARD;

    @Column(name = "invoice_subtype", nullable = false, length = 10)
    @Builder.Default
    private String invoiceSubtype = "0100000";

    // Seller info
    @Column(name = "seller_name_ar", nullable = false, length = 200)
    private String sellerNameAr;

    @Column(name = "seller_vat_number", nullable = false, length = 15)
    private String sellerVatNumber;

    @Column(name = "seller_cr_number", length = 20)
    private String sellerCrNumber;

    @Column(name = "seller_address")
    private String sellerAddress;

    // Buyer info
    @Column(name = "buyer_name", length = 200)
    private String buyerName;

    @Column(name = "buyer_vat_number", length = 15)
    private String buyerVatNumber;

    @Column(name = "buyer_address")
    private String buyerAddress;

    // Dates
    @Column(name = "issue_datetime", nullable = false)
    private Instant issueDatetime;

    @Column(name = "supply_date")
    private LocalDate supplyDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    // Amounts - BigDecimal only, never double/float
    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "discount_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "taxable_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal taxableAmount;

    @Column(name = "vat_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal vatAmount;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(length = 3)
    @Builder.Default
    private String currency = "SAR";

    // Status
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    // ZATCA Phase 1
    @Column(name = "qr_code_base64", columnDefinition = "TEXT")
    private String qrCodeBase64;

    // ZATCA Phase 2
    @Column(name = "xml_content", columnDefinition = "TEXT")
    private String xmlContent;

    @Column(name = "xml_hash", length = 64)
    private String xmlHash;

    @Column(name = "digital_signature", columnDefinition = "TEXT")
    private String digitalSignature;

    @Column(name = "certificate_hash", length = 64)
    private String certificateHash;

    @Column(name = "zatca_status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ZatcaStatus zatcaStatus = ZatcaStatus.NOT_SUBMITTED;

    @Column(name = "zatca_submission_id", length = 100)
    private String zatcaSubmissionId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "zatca_response", columnDefinition = "jsonb")
    private Map<String, Object> zatcaResponse;

    @Column(name = "zatca_submitted_at")
    private Instant zatcaSubmittedAt;

    @Column(name = "zatca_cleared_at")
    private Instant zatcaClearedAt;

    // Credit note
    @Column(name = "original_invoice_id")
    private UUID originalInvoiceId;

    @Column(name = "is_credit_note")
    @Builder.Default
    private boolean creditNote = false;

    @Column(name = "journal_entry_id")
    private UUID journalEntryId;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @OrderBy("lineNumber ASC")
    private List<InvoiceItem> items = new ArrayList<>();

    public enum InvoiceType { STANDARD, SIMPLIFIED }

    public enum InvoiceStatus { DRAFT, CONFIRMED, CANCELLED }

    public enum ZatcaStatus {
        NOT_SUBMITTED, PENDING, REPORTED, CLEARED, REJECTED
    }

    public boolean isEditable() {
        return status == InvoiceStatus.DRAFT;
    }
}
