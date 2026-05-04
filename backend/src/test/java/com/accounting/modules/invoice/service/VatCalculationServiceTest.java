package com.accounting.modules.invoice.service;

import com.accounting.modules.invoice.dto.InvoiceItemRequest;
import com.accounting.modules.invoice.dto.InvoiceTotals;
import com.accounting.modules.invoice.entity.InvoiceItem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("VatCalculationService — ZATCA Phase 2 Compliance")
class VatCalculationServiceTest {

    private VatCalculationService svc;

    @BeforeEach
    void setUp() {
        svc = new VatCalculationService();
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private InvoiceItemRequest item(String qty, String price, InvoiceItem.TaxCategory cat) {
        return item(qty, price, null, cat);
    }

    private InvoiceItemRequest item(String qty, String price, String discountPct,
                                    InvoiceItem.TaxCategory cat) {
        InvoiceItemRequest r = new InvoiceItemRequest();
        r.setDescriptionAr("خدمة اختبارية");
        r.setQuantity(new BigDecimal(qty));
        r.setUnitPrice(new BigDecimal(price));
        r.setDiscountPercent(discountPct != null ? new BigDecimal(discountPct) : null);
        r.setTaxCategory(cat);
        return r;
    }

    private void assertTotals(InvoiceTotals t,
                              String subtotal, String discount,
                              String taxable, String vat, String total) {
        assertThat(t.getSubtotal())      .isEqualByComparingTo(subtotal);
        assertThat(t.getDiscountAmount()).isEqualByComparingTo(discount);
        assertThat(t.getTaxableAmount()) .isEqualByComparingTo(taxable);
        assertThat(t.getVatAmount())     .isEqualByComparingTo(vat);
        assertThat(t.getTotalAmount())   .isEqualByComparingTo(total);
    }

    // -----------------------------------------------------------------------
    // Standard-rated (15%)
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("Standard-rated items (15%)")
    class StandardRated {

        @Test
        @DisplayName("Simple whole numbers — 100 SAR × 1 qty")
        void simpleWhole() {
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "100.00", InvoiceItem.TaxCategory.STANDARD)));
            assertTotals(t, "100.00", "0.00", "100.00", "15.00", "115.00");
        }

        @Test
        @DisplayName("Multiple quantity — 3 × 33.33")
        void multipleQty() {
            // lineTotal = 99.99, VAT = 99.99 × 0.15 = 14.9985 → HALF_UP → 15.00
            InvoiceTotals t = svc.calculate(List.of(
                    item("3", "33.33", InvoiceItem.TaxCategory.STANDARD)));
            assertTotals(t, "99.99", "0.00", "99.99", "15.00", "114.99");
        }

        @Test
        @DisplayName("Fractional qty — 1.5 × 200.00")
        void fractionalQty() {
            // lineTotal = 300.00, VAT = 45.00
            InvoiceTotals t = svc.calculate(List.of(
                    item("1.5", "200.00", InvoiceItem.TaxCategory.STANDARD)));
            assertTotals(t, "300.00", "0.00", "300.00", "45.00", "345.00");
        }

        @Test
        @DisplayName("Very small amount — 0.01 SAR (VAT rounds to 0.00)")
        void verySmallAmount() {
            // VAT = 0.01 × 0.15 = 0.0015 → HALF_UP scale 2 → 0.00
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "0.01", InvoiceItem.TaxCategory.STANDARD)));
            assertTotals(t, "0.01", "0.00", "0.01", "0.00", "0.01");
        }

        @Test
        @DisplayName("Rounding HALF_UP — 0.05 SAR (VAT = 0.0075 → 0.01)")
        void roundingHalfUp() {
            // VAT = 0.05 × 0.15 = 0.0075 → HALF_UP → 0.01
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "0.05", InvoiceItem.TaxCategory.STANDARD)));
            assertTotals(t, "0.05", "0.00", "0.05", "0.01", "0.06");
        }

        @Test
        @DisplayName("Rounding HALF_UP — 3 × 33.34 (VAT from 100.02)")
        void roundingHalfUpMulti() {
            // lineTotal = 100.02, VAT = 100.02 × 0.15 = 15.003 → HALF_UP → 15.00
            InvoiceTotals t = svc.calculate(List.of(
                    item("3", "33.34", InvoiceItem.TaxCategory.STANDARD)));
            assertTotals(t, "100.02", "0.00", "100.02", "15.00", "115.02");
        }

        @Test
        @DisplayName("Large invoice — 1000 × 499.99")
        void largeInvoice() {
            // lineTotal = 499990.00, VAT = 74998.50
            InvoiceTotals t = svc.calculate(List.of(
                    item("1000", "499.99", InvoiceItem.TaxCategory.STANDARD)));
            assertTotals(t, "499990.00", "0.00", "499990.00", "74998.50", "574988.50");
        }
    }

    // -----------------------------------------------------------------------
    // Discounts
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("Discount calculations")
    class Discounts {

        @Test
        @DisplayName("10% discount on standard-rated item")
        void tenPercentDiscount() {
            // lineTotal=100.00, discount=10.00, taxable=90.00, VAT=13.50
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "100.00", "10", InvoiceItem.TaxCategory.STANDARD)));
            assertTotals(t, "100.00", "10.00", "90.00", "13.50", "103.50");
        }

        @Test
        @DisplayName("50% discount")
        void fiftyPercentDiscount() {
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "200.00", "50", InvoiceItem.TaxCategory.STANDARD)));
            assertTotals(t, "200.00", "100.00", "100.00", "15.00", "115.00");
        }

        @Test
        @DisplayName("100% discount — VAT must be zero")
        void fullDiscount() {
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "500.00", "100", InvoiceItem.TaxCategory.STANDARD)));
            assertTotals(t, "500.00", "500.00", "0.00", "0.00", "0.00");
        }

        @Test
        @DisplayName("Fractional discount — 5.5% on 1000 SAR")
        void fractionalDiscount() {
            // discount = 1000 × 5.5% = 55.00, taxable = 945.00, VAT = 141.75
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "1000.00", "5.5", InvoiceItem.TaxCategory.STANDARD)));
            assertTotals(t, "1000.00", "55.00", "945.00", "141.75", "1086.75");
        }

        @Test
        @DisplayName("No discount (null) treated as zero")
        void nullDiscountTreatedAsZero() {
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "100.00", null, InvoiceItem.TaxCategory.STANDARD)));
            assertTotals(t, "100.00", "0.00", "100.00", "15.00", "115.00");
        }
    }

    // -----------------------------------------------------------------------
    // Zero-rated and Exempt
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("Zero-rated and Exempt items")
    class NonStandard {

        @Test
        @DisplayName("Zero-rated item — no VAT, full amount passes through")
        void zeroRated() {
            InvoiceTotals t = svc.calculate(List.of(
                    item("2", "50.00", InvoiceItem.TaxCategory.ZERO_RATED)));
            assertTotals(t, "100.00", "0.00", "100.00", "0.00", "100.00");
        }

        @Test
        @DisplayName("Exempt item — no VAT")
        void exempt() {
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "200.00", InvoiceItem.TaxCategory.EXEMPT)));
            assertTotals(t, "200.00", "0.00", "200.00", "0.00", "200.00");
        }

        @Test
        @DisplayName("Zero-rated with discount — VAT stays zero")
        void zeroRatedWithDiscount() {
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "100.00", "20", InvoiceItem.TaxCategory.ZERO_RATED)));
            assertTotals(t, "100.00", "20.00", "80.00", "0.00", "80.00");
        }
    }

    // -----------------------------------------------------------------------
    // Mixed items (ZATCA real-world scenario)
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("Mixed item invoices")
    class Mixed {

        @Test
        @DisplayName("Standard + Zero-rated lines on same invoice")
        void standardAndZeroRated() {
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "100.00", InvoiceItem.TaxCategory.STANDARD),   // VAT 15
                    item("1", "50.00",  InvoiceItem.TaxCategory.ZERO_RATED)  // VAT 0
            ));
            // subtotal=150, discount=0, taxable=150, vat=15, total=165
            assertTotals(t, "150.00", "0.00", "150.00", "15.00", "165.00");
        }

        @Test
        @DisplayName("Three mixed lines — standard, zero-rated, exempt")
        void threeMixedLines() {
            InvoiceTotals t = svc.calculate(List.of(
                    item("2", "100.00", InvoiceItem.TaxCategory.STANDARD),   // 200 + 30 VAT
                    item("1", "300.00", InvoiceItem.TaxCategory.ZERO_RATED), // 300 + 0 VAT
                    item("1", "50.00",  InvoiceItem.TaxCategory.EXEMPT)      // 50  + 0 VAT
            ));
            assertTotals(t, "550.00", "0.00", "550.00", "30.00", "580.00");
        }

        @Test
        @DisplayName("Mixed with discounts per line")
        void mixedWithDiscounts() {
            // Line 1: standard 200 × 10% disc → taxable=180, VAT=27
            // Line 2: zero-rated 100 × 0% disc → taxable=100, VAT=0
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "200.00", "10", InvoiceItem.TaxCategory.STANDARD),
                    item("1", "100.00", "0",  InvoiceItem.TaxCategory.ZERO_RATED)
            ));
            assertTotals(t, "300.00", "20.00", "280.00", "27.00", "307.00");
        }

        @Test
        @DisplayName("Multiple standard lines — VAT accumulated correctly")
        void multipleStandardLines() {
            // Each 33.33 → VAT each 4.9995 → 5.00, total VAT = 15.00
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "33.33", InvoiceItem.TaxCategory.STANDARD),
                    item("1", "33.33", InvoiceItem.TaxCategory.STANDARD),
                    item("1", "33.33", InvoiceItem.TaxCategory.STANDARD)
            ));
            // subtotal=99.99, each VAT: 33.33×0.15=4.9995→5.00, total VAT=15.00
            assertTotals(t, "99.99", "0.00", "99.99", "15.00", "114.99");
        }
    }

    // -----------------------------------------------------------------------
    // buildItem
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("buildItem — entity field mapping")
    class BuildItem {

        @Test
        @DisplayName("Standard item fields are set correctly")
        void standardItemFields() {
            InvoiceItemRequest req = item("2", "100.00", "10", InvoiceItem.TaxCategory.STANDARD);
            req.setDescriptionEn("Test service");
            req.setUnitOfMeasure("SRV");

            InvoiceItem built = svc.buildItem(req, 1);

            assertThat(built.getLineNumber())    .isEqualTo(1);
            assertThat(built.getDescriptionAr()) .isEqualTo("خدمة اختبارية");
            assertThat(built.getDescriptionEn()) .isEqualTo("Test service");
            assertThat(built.getQuantity())      .isEqualByComparingTo("2");
            assertThat(built.getUnitPrice())     .isEqualByComparingTo("100.00");
            assertThat(built.getUnitOfMeasure()) .isEqualTo("SRV");
            assertThat(built.getDiscountPercent()).isEqualByComparingTo("10");
            assertThat(built.getDiscountAmount()) .isEqualByComparingTo("20.00");
            assertThat(built.getTaxableAmount())  .isEqualByComparingTo("180.00");
            assertThat(built.getTaxCategory())    .isEqualTo(InvoiceItem.TaxCategory.STANDARD);
            assertThat(built.getTaxRate())        .isEqualByComparingTo("15.00");
            assertThat(built.getVatAmount())      .isEqualByComparingTo("27.00");
            assertThat(built.getTotalAmount())    .isEqualByComparingTo("207.00");
        }

        @Test
        @DisplayName("Zero-rated item — tax rate is 0.00")
        void zeroRatedItemTaxRate() {
            InvoiceItem built = svc.buildItem(item("1", "100.00", InvoiceItem.TaxCategory.ZERO_RATED), 1);
            assertThat(built.getTaxRate())   .isEqualByComparingTo("0.00");
            assertThat(built.getVatAmount()) .isEqualByComparingTo("0.00");
            assertThat(built.getTotalAmount()).isEqualByComparingTo("100.00");
        }

        @Test
        @DisplayName("Null unit-of-measure defaults to PCE")
        void defaultUnitOfMeasure() {
            InvoiceItem built = svc.buildItem(item("1", "10.00", InvoiceItem.TaxCategory.STANDARD), 1);
            assertThat(built.getUnitOfMeasure()).isEqualTo("PCE");
        }

        @Test
        @DisplayName("Line number is preserved")
        void lineNumberPreserved() {
            assertThat(svc.buildItem(item("1", "10.00", InvoiceItem.TaxCategory.STANDARD), 5).getLineNumber()).isEqualTo(5);
            assertThat(svc.buildItem(item("1", "10.00", InvoiceItem.TaxCategory.STANDARD), 42).getLineNumber()).isEqualTo(42);
        }
    }

    // -----------------------------------------------------------------------
    // ZATCA-specific rounding invariants
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("ZATCA rounding invariants")
    class ZatcaRounding {

        @Test
        @DisplayName("Scale is always 2 — no more, no less")
        void scaleIsAlwaysTwo() {
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "100.00", InvoiceItem.TaxCategory.STANDARD)));
            assertThat(t.getSubtotal().scale())      .isEqualTo(2);
            assertThat(t.getDiscountAmount().scale()) .isEqualTo(2);
            assertThat(t.getTaxableAmount().scale())  .isEqualTo(2);
            assertThat(t.getVatAmount().scale())      .isEqualTo(2);
            assertThat(t.getTotalAmount().scale())    .isEqualTo(2);
        }

        @Test
        @DisplayName("total = taxableAmount + vatAmount always holds")
        void totalIsConsistent() {
            List<InvoiceItemRequest> items = List.of(
                    item("3", "33.33", "7.5", InvoiceItem.TaxCategory.STANDARD),
                    item("2", "17.77", InvoiceItem.TaxCategory.ZERO_RATED)
            );
            InvoiceTotals t = svc.calculate(items);
            assertThat(t.getTotalAmount())
                    .isEqualByComparingTo(t.getTaxableAmount().add(t.getVatAmount()));
        }

        @Test
        @DisplayName("taxableAmount = subtotal - discountAmount always holds")
        void taxableAmountIsConsistent() {
            InvoiceTotals t = svc.calculate(List.of(
                    item("5", "99.99", "12.5", InvoiceItem.TaxCategory.STANDARD)));
            assertThat(t.getTaxableAmount())
                    .isEqualByComparingTo(t.getSubtotal().subtract(t.getDiscountAmount()));
        }

        @Test
        @DisplayName("HALF_UP: 0.005 rounds up to 0.01")
        void halfUpRoundsUp() {
            // 1/3 SAR × 15% = 0.05 × 0.15 = 0.0075 → HALF_UP → 0.01
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "0.05", InvoiceItem.TaxCategory.STANDARD)));
            assertThat(t.getVatAmount()).isEqualByComparingTo("0.01");
        }

        @Test
        @DisplayName("HALF_UP: 0.004 rounds down to 0.00")
        void halfUpRoundsDown() {
            // 0.04 × 0.15 = 0.006 → HALF_UP → 0.01? no: 0.006 rounds up to 0.01
            // Use 0.03: 0.03 × 0.15 = 0.0045 → HALF_UP → 0.00 (digit is 4 < 5)
            InvoiceTotals t = svc.calculate(List.of(
                    item("1", "0.03", InvoiceItem.TaxCategory.STANDARD)));
            assertThat(t.getVatAmount()).isEqualByComparingTo("0.00");
        }
    }
}
