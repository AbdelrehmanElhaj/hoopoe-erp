package com.accounting.modules.reports.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class TrialBalanceLineDto {
    private UUID id;
    private String code;
    private String nameAr;
    private String nameEn;
    private String accountType;
    private String normalBalance;
    private int level;
    private boolean leaf;
    private BigDecimal debitTotal;
    private BigDecimal creditTotal;
    private BigDecimal balance; // debitTotal - creditTotal (positive = debit balance)
}
