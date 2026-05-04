package com.accounting.modules.reports.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class BalanceSheetDto {
    private LocalDate asOf;
    private List<AccountLineDto> assetLines;
    private List<AccountLineDto> liabilityLines;
    private List<AccountLineDto> equityLines;
    private BigDecimal totalAssets;
    private BigDecimal totalLiabilities;
    private BigDecimal totalEquity;
    private BigDecimal totalLiabilitiesAndEquity;
}
