package com.accounting.modules.reports.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class VatReportDto {
    private LocalDate from;
    private LocalDate to;

    // Output VAT — standard-rated sales
    private BigDecimal standardRatedSales;
    private BigDecimal standardRatedVat;

    // Output VAT — other categories
    private BigDecimal zeroRatedSales;
    private BigDecimal exemptSales;

    // Credit notes issued (reduce output VAT)
    private BigDecimal creditNotesSales;
    private BigDecimal creditNotesVat;

    // Net output VAT = standardRatedVat - creditNotesVat
    private BigDecimal totalOutputVat;

    // Input VAT from posted journal entries on account 1103
    private BigDecimal inputVat;

    // Net VAT payable to ZATCA
    private BigDecimal netVatPayable;

    // Invoice counts for the period
    private long standardInvoiceCount;
    private long simplifiedInvoiceCount;
}
