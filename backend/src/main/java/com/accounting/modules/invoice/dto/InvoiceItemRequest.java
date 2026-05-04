package com.accounting.modules.invoice.dto;

import com.accounting.modules.invoice.entity.InvoiceItem;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class InvoiceItemRequest {

    @NotBlank
    @Size(max = 500)
    private String descriptionAr;

    @Size(max = 500)
    private String descriptionEn;

    @NotNull
    @DecimalMin("0.0001")
    @Digits(integer = 14, fraction = 4)
    private BigDecimal quantity;

    @NotNull
    @DecimalMin("0.00")
    @Digits(integer = 16, fraction = 2)
    private BigDecimal unitPrice;

    @Size(max = 20)
    private String unitOfMeasure;

    @DecimalMin("0.00")
    @DecimalMax("100.00")
    @Digits(integer = 3, fraction = 2)
    private BigDecimal discountPercent;

    @NotNull
    private InvoiceItem.TaxCategory taxCategory;
}
