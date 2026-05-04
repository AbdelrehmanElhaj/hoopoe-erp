package com.accounting.modules.invoice.service;

import com.accounting.modules.invoice.dto.InvoiceItemRequest;
import com.accounting.modules.invoice.dto.InvoiceTotals;
import com.accounting.modules.invoice.entity.InvoiceItem;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class VatCalculationService {

    // ZATCA mandates HALF_UP rounding, scale 2
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;
    private static final int SCALE = 2;
    private static final BigDecimal VAT_RATE = new BigDecimal("0.15");

    public InvoiceTotals calculate(List<InvoiceItemRequest> items) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalVat = BigDecimal.ZERO;

        for (InvoiceItemRequest item : items) {
            BigDecimal lineTotal = item.getUnitPrice()
                    .multiply(item.getQuantity())
                    .setScale(SCALE, ROUNDING);

            BigDecimal discountPercent = item.getDiscountPercent() != null
                    ? item.getDiscountPercent() : BigDecimal.ZERO;

            BigDecimal lineDiscount = lineTotal
                    .multiply(discountPercent)
                    .divide(BigDecimal.valueOf(100), SCALE, ROUNDING);

            BigDecimal taxableAmount = lineTotal.subtract(lineDiscount);

            BigDecimal lineVat = switch (item.getTaxCategory()) {
                case STANDARD -> taxableAmount.multiply(VAT_RATE).setScale(SCALE, ROUNDING);
                case ZERO_RATED, EXEMPT -> BigDecimal.ZERO;
            };

            subtotal = subtotal.add(lineTotal);
            totalDiscount = totalDiscount.add(lineDiscount);
            totalVat = totalVat.add(lineVat);
        }

        BigDecimal taxableAmount = subtotal.subtract(totalDiscount);
        BigDecimal total = taxableAmount.add(totalVat);

        return InvoiceTotals.builder()
                .subtotal(subtotal.setScale(SCALE, ROUNDING))
                .discountAmount(totalDiscount.setScale(SCALE, ROUNDING))
                .taxableAmount(taxableAmount.setScale(SCALE, ROUNDING))
                .vatAmount(totalVat.setScale(SCALE, ROUNDING))
                .totalAmount(total.setScale(SCALE, ROUNDING))
                .build();
    }

    public InvoiceItem buildItem(InvoiceItemRequest req, int lineNumber) {
        BigDecimal lineTotal = req.getUnitPrice()
                .multiply(req.getQuantity())
                .setScale(SCALE, ROUNDING);

        BigDecimal discountPercent = req.getDiscountPercent() != null
                ? req.getDiscountPercent() : BigDecimal.ZERO;

        BigDecimal discountAmount = lineTotal
                .multiply(discountPercent)
                .divide(BigDecimal.valueOf(100), SCALE, ROUNDING);

        BigDecimal taxableAmount = lineTotal.subtract(discountAmount);

        BigDecimal vatAmount = switch (req.getTaxCategory()) {
            case STANDARD -> taxableAmount.multiply(VAT_RATE).setScale(SCALE, ROUNDING);
            case ZERO_RATED, EXEMPT -> BigDecimal.ZERO;
        };

        BigDecimal taxRate = req.getTaxCategory() == InvoiceItem.TaxCategory.STANDARD
                ? new BigDecimal("15.00") : BigDecimal.ZERO;

        return InvoiceItem.builder()
                .lineNumber(lineNumber)
                .descriptionAr(req.getDescriptionAr())
                .descriptionEn(req.getDescriptionEn())
                .quantity(req.getQuantity())
                .unitPrice(req.getUnitPrice())
                .unitOfMeasure(req.getUnitOfMeasure() != null ? req.getUnitOfMeasure() : "PCE")
                .discountPercent(discountPercent)
                .discountAmount(discountAmount)
                .taxableAmount(taxableAmount)
                .taxCategory(req.getTaxCategory())
                .taxRate(taxRate)
                .vatAmount(vatAmount)
                .totalAmount(taxableAmount.add(vatAmount))
                .build();
    }
}
