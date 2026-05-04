package com.accounting.modules.invoice.dto;

import com.accounting.modules.invoice.entity.Invoice;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateInvoiceRequest {

    @NotNull
    private Invoice.InvoiceType invoiceType;

    @NotBlank
    @Size(max = 200)
    private String sellerNameAr;

    @NotBlank
    @Pattern(regexp = "^3\\d{14}$", message = "VAT must be 15 digits starting with 3")
    private String sellerVatNumber;

    @Size(max = 20)
    private String sellerCrNumber;

    private String sellerAddress;

    @Size(max = 200)
    private String buyerName;

    @Pattern(regexp = "^3\\d{14}$", message = "VAT must be 15 digits starting with 3")
    private String buyerVatNumber;

    private String buyerAddress;

    private Instant issueDatetime;
    private LocalDate supplyDate;
    private LocalDate dueDate;

    @NotEmpty
    @Valid
    private List<InvoiceItemRequest> items;
}
