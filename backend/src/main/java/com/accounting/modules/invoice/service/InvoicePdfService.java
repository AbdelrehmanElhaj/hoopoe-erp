package com.accounting.modules.invoice.service;

import com.accounting.modules.invoice.entity.Invoice;
import com.accounting.modules.invoice.entity.InvoiceItem;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Slf4j
@Service
public class InvoicePdfService {

    // Page dimensions (A4)
    private static final float W   = PDRectangle.A4.getWidth();   // 595
    private static final float H   = PDRectangle.A4.getHeight();  // 842
    private static final float MAR = 45f;  // margin
    private static final float CW  = W - 2 * MAR;  // content width = 505

    // Brand colours
    private static final Color BRAND      = new Color(26, 35, 126);   // #1a237e
    private static final Color BRAND_LITE = new Color(232, 234, 246); // #e8eaf6
    private static final Color GREY       = new Color(80, 80, 80);
    private static final Color LIGHT_GREY = new Color(245, 245, 245);

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneId.of("Asia/Riyadh"));

    public byte[] generate(Invoice invoice) {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            PDFont regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDFont bold    = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDFont mono    = new PDType1Font(Standard14Fonts.FontName.COURIER);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float y = H - MAR;

                // ── Header band ──────────────────────────────────────────
                fillRect(cs, MAR, y - 58, CW, 62, BRAND);
                y = drawText(cs, bold, 16, invoice.getSellerNameAr(), MAR + 10, y - 22, Color.WHITE);
                drawText(cs, regular, 9, "VAT: " + invoice.getSellerVatNumber(), MAR + 10, y - 2, new Color(180, 190, 230));
                if (invoice.getSellerAddress() != null) {
                    drawText(cs, regular, 8, invoice.getSellerAddress(), MAR + 10, y - 12, new Color(180, 190, 230));
                }

                // Invoice type badge (top-right)
                String typeLabel = invoice.isCreditNote()  ? "CREDIT NOTE / اشعار دائن" :
                                   invoice.getInvoiceType() == Invoice.InvoiceType.STANDARD
                                           ? "TAX INVOICE / فاتورة ضريبية"
                                           : "SIMPLIFIED / مبسطة";
                float badgeW = 150f;
                fillRect(cs, W - MAR - badgeW, H - MAR - 46, badgeW, 30, new Color(255, 215, 64));
                drawTextCentered(cs, bold, 9, typeLabel, W - MAR - badgeW, H - MAR - 34, badgeW, Color.BLACK);

                y = H - MAR - 68;

                // ── Invoice meta row ─────────────────────────────────────
                fillRect(cs, MAR, y - 28, CW, 30, BRAND_LITE);
                drawText(cs, bold, 9, "Invoice No:", MAR + 8, y - 8, BRAND);
                drawText(cs, mono, 10, invoice.getInvoiceNumber(), MAR + 68, y - 8, BRAND);
                drawText(cs, bold, 9, "Date:", MAR + 8, y - 20, GREY);
                drawText(cs, regular, 9, DATE_FMT.format(invoice.getIssueDatetime()), MAR + 38, y - 20, GREY);
                // UUID (right side)
                String uuidShort = invoice.getUuid().toString().substring(0, 18) + "...";
                drawText(cs, bold, 9, "ZATCA UUID:", W - MAR - 180, y - 8, BRAND);
                drawText(cs, mono, 8, uuidShort, W - MAR - 105, y - 8, GREY);
                drawText(cs, bold, 9, "Status:", W - MAR - 180, y - 20, GREY);
                drawText(cs, regular, 9, invoice.getStatus().name()
                        + " | " + invoice.getZatcaStatus().name(), W - MAR - 145, y - 20, GREY);

                y -= 38;

                // ── Parties ──────────────────────────────────────────────
                float halfW = (CW - 8) / 2;
                drawPartyBox(cs, regular, bold, MAR, y, halfW,
                        "SELLER / البائع", invoice.getSellerNameAr(),
                        invoice.getSellerVatNumber(), invoice.getSellerCrNumber(), invoice.getSellerAddress());
                drawPartyBox(cs, regular, bold, MAR + halfW + 8, y, halfW,
                        "BUYER / المشتري", invoice.getBuyerName(),
                        invoice.getBuyerVatNumber(), null, invoice.getBuyerAddress());

                y -= 72;

                // ── Items table ───────────────────────────────────────────
                float[] colX = { MAR, MAR+22, MAR+192, MAR+242, MAR+292, MAR+330, MAR+380, MAR+435 };
                String[] colH = { "#", "Description", "Qty", "Unit Price", "Disc%", "Tax Cat", "VAT", "Total" };
                float rowH = 16f;

                // Header row
                fillRect(cs, MAR, y - rowH, CW, rowH, BRAND);
                for (int c = 0; c < colH.length; c++) {
                    drawText(cs, bold, 8, colH[c], colX[c] + 2, y - 11, Color.WHITE);
                }
                y -= rowH;

                // Item rows
                boolean shaded = false;
                for (InvoiceItem item : invoice.getItems()) {
                    if (shaded) fillRect(cs, MAR, y - rowH, CW, rowH, LIGHT_GREY);
                    shaded = !shaded;
                    drawText(cs, regular, 8, String.valueOf(item.getLineNumber()), colX[0]+2, y-11, Color.BLACK);
                    drawText(cs, regular, 8, truncate(item.getDescriptionAr(), 28), colX[1]+2, y-11, Color.BLACK);
                    drawText(cs, regular, 8, fmt(item.getQuantity()),   colX[2]+2, y-11, Color.BLACK);
                    drawText(cs, regular, 8, fmt(item.getUnitPrice()),  colX[3]+2, y-11, Color.BLACK);
                    drawText(cs, regular, 8, fmt(item.getDiscountPercent()) + "%", colX[4]+2, y-11, Color.BLACK);
                    drawText(cs, regular, 8, item.getTaxCategory().name(), colX[5]+2, y-11, Color.BLACK);
                    drawText(cs, regular, 8, fmt(item.getVatAmount()),  colX[6]+2, y-11, Color.BLACK);
                    drawText(cs, regular, 8, fmt(item.getTotalAmount()), colX[7]+2, y-11, Color.BLACK);
                    y -= rowH;
                }

                // Table border
                strokeRect(cs, MAR, y, CW, H - MAR - 68 - 38 - 72 - rowH - y, BRAND_LITE);

                y -= 8;

                // ── Totals block ─────────────────────────────────────────
                float totX  = W - MAR - 200;
                float totLW = 120f;
                float totVW = 80f;

                y = drawTotalRow(cs, regular, bold, totX, y, totLW, totVW,
                        "Subtotal / المجموع", invoice.getSubtotal(), false, LIGHT_GREY);
                if (invoice.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                    y = drawTotalRow(cs, regular, bold, totX, y, totLW, totVW,
                            "Discount / الخصم", invoice.getDiscountAmount().negate(), false, Color.WHITE);
                }
                y = drawTotalRow(cs, regular, bold, totX, y, totLW, totVW,
                        "Taxable / الخاضع", invoice.getTaxableAmount(), false, LIGHT_GREY);
                y = drawTotalRow(cs, regular, bold, totX, y, totLW, totVW,
                        "VAT 15% / الضريبة", invoice.getVatAmount(), false, Color.WHITE);

                // Total row with brand bg
                fillRect(cs, totX, y - 20, totLW + totVW, 20, BRAND);
                drawText(cs, bold, 10, "TOTAL / الإجمالي", totX + 4, y - 13, Color.WHITE);
                drawText(cs, bold, 11, fmt(invoice.getTotalAmount()) + " SAR",
                        totX + totLW, y - 13, new Color(255, 215, 64));
                y -= 22;

                // ── QR Code ───────────────────────────────────────────────
                if (invoice.getQrCodeBase64() != null && !invoice.getQrCodeBase64().isBlank()) {
                    try {
                        byte[] qrBytes = Base64.getDecoder().decode(invoice.getQrCodeBase64());
                        PDImageXObject qrImg = PDImageXObject.createFromByteArray(doc, qrBytes, "qr");
                        float qrSize = 80f;
                        float qrY = Math.min(y - 10, 130f);
                        cs.drawImage(qrImg, MAR, qrY - qrSize, qrSize, qrSize);
                        drawText(cs, regular, 7, "Scan for ZATCA verification", MAR, qrY - qrSize - 10, GREY);
                    } catch (Exception e) {
                        log.debug("QR code rendering skipped: {}", e.getMessage());
                    }
                }

                // ── Footer ────────────────────────────────────────────────
                line(cs, MAR, 50, W - MAR, 50, BRAND);
                drawText(cs, regular, 7,
                        "Generated by Saudi Accounting System | " + invoice.getInvoiceNumber()
                        + " | " + invoice.getUuid(),
                        MAR, 40, GREY);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("PDF generation failed: " + e.getMessage(), e);
        }
    }

    // ── Drawing helpers ──────────────────────────────────────────────────────

    private float drawText(PDPageContentStream cs, PDFont font, float size,
                           String text, float x, float y, Color color) {
        try {
            cs.setNonStrokingColor(color);
            cs.beginText();
            cs.setFont(font, size);
            cs.newLineAtOffset(x, y);
            cs.showText(safe(text));
            cs.endText();
        } catch (Exception e) {
            log.debug("drawText skipped: {}", e.getMessage());
        }
        return y;
    }

    private void drawTextCentered(PDPageContentStream cs, PDFont font, float size,
                                  String text, float boxX, float y, float boxW, Color color) {
        try {
            float tw = font.getStringWidth(safe(text)) / 1000 * size;
            drawText(cs, font, size, text, boxX + (boxW - tw) / 2, y, color);
        } catch (Exception e) {
            drawText(cs, font, size, text, boxX + 4, y, color);
        }
    }

    private void fillRect(PDPageContentStream cs, float x, float y, float w, float h, Color c) {
        try {
            cs.setNonStrokingColor(c);
            cs.addRect(x, y, w, h);
            cs.fill();
        } catch (Exception e) {
            log.debug("fillRect skipped: {}", e.getMessage());
        }
    }

    private void strokeRect(PDPageContentStream cs, float x, float y, float w, float h, Color c) {
        try {
            cs.setStrokingColor(c);
            cs.addRect(x, y, w, h);
            cs.stroke();
        } catch (Exception e) {
            log.debug("strokeRect skipped: {}", e.getMessage());
        }
    }

    private void line(PDPageContentStream cs, float x1, float y1, float x2, float y2, Color c) {
        try {
            cs.setStrokingColor(c);
            cs.moveTo(x1, y1);
            cs.lineTo(x2, y2);
            cs.stroke();
        } catch (Exception e) {
            log.debug("line skipped: {}", e.getMessage());
        }
    }

    private void drawPartyBox(PDPageContentStream cs, PDFont regular, PDFont bold,
                               float x, float y, float w,
                               String label, String name, String vat,
                               String cr, String address) {
        fillRect(cs, x, y - 64, w, 66, BRAND_LITE);
        drawText(cs, bold, 8, label, x + 4, y - 12, BRAND);
        drawText(cs, bold, 9, safe(name), x + 4, y - 26, Color.BLACK);
        if (vat != null) drawText(cs, regular, 8, "VAT: " + vat, x + 4, y - 38, GREY);
        if (cr  != null) drawText(cs, regular, 8, "CR: "  + cr,  x + 4, y - 48, GREY);
        if (address != null) drawText(cs, regular, 7, truncate(address, 40), x + 4, y - 58, GREY);
    }

    private float drawTotalRow(PDPageContentStream cs, PDFont regular, PDFont bold,
                                float x, float y, float labelW, float valW,
                                String label, BigDecimal value, boolean highlight, Color bg) {
        fillRect(cs, x, y - 18, labelW + valW, 18, bg);
        drawText(cs, regular, 9, label, x + 4, y - 12, GREY);
        String valStr = fmt(value) + " SAR";
        try {
            float tw = regular.getStringWidth(valStr) / 1000 * 9;
            drawText(cs, regular, 9, valStr, x + labelW + valW - tw - 4, y - 12, Color.BLACK);
        } catch (Exception e) {
            drawText(cs, regular, 9, valStr, x + labelW, y - 12, Color.BLACK);
        }
        return y - 18;
    }

    // ── Utility ──────────────────────────────────────────────────────────────

    private String safe(String s) {
        if (s == null) return "";
        // Strip characters outside WinAnsi encoding
        return s.replaceAll("[^\\x00-\\xFF]", "?");
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "";
        return s.length() > maxLen ? s.substring(0, maxLen - 1) + "…" : s;
    }

    private String fmt(BigDecimal v) {
        return v == null ? "0.00" : String.format("%.2f", v);
    }
}
