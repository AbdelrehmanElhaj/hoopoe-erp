package com.accounting.modules.reports.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class IncomeStatementDto {
    private LocalDate from;
    private LocalDate to;
    private List<AccountLineDto> revenueLines;
    private List<AccountLineDto> expenseLines;
    private BigDecimal totalRevenue;
    private BigDecimal totalExpenses;
    private BigDecimal netIncome;
}
