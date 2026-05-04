package com.accounting.modules.journal.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class JournalLineRequest {

    @NotNull
    private UUID accountId;

    @DecimalMin(value = "0.00")
    @Digits(integer = 16, fraction = 2)
    private BigDecimal debit;

    @DecimalMin(value = "0.00")
    @Digits(integer = 16, fraction = 2)
    private BigDecimal credit;

    @Size(max = 200)
    private String description;
}
