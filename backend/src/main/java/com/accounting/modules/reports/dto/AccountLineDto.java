package com.accounting.modules.reports.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AccountLineDto {
    private String code;
    private String nameAr;
    private String nameEn;
    private int level;
    private boolean leaf;
    private BigDecimal balance;
}
