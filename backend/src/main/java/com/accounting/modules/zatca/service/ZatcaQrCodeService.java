package com.accounting.modules.zatca.service;

import com.accounting.modules.invoice.entity.Invoice;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

/**
 * ZATCA QR Code Service
 *
 * Phase 1: TLV tags 1-5 (seller name, VAT, datetime, total, VAT amount)
 * Phase 2: TLV tags 1-8 (adds invoice hash, digital signature, public key, signature of public key)
 *
 * ZATCA TLV encoding spec:
 * Each field: [1 byte tag] [1 byte length] [N bytes value (UTF-8)]
 */
@Slf4j
@Service
public class ZatcaQrCodeService {

    private static final DateTimeFormatter ZATCA_DATETIME = DateTimeFormatter
            .ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'")
            .withZone(ZoneId.of("UTC"));

    // Phase 1 QR (Simplified invoices and initial compliance)
    public String generatePhase1Qr(Invoice invoice) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        writeTlv(baos, 1, invoice.getSellerNameAr());
        writeTlv(baos, 2, invoice.getSellerVatNumber());
        writeTlv(baos, 3, ZATCA_DATETIME.format(invoice.getIssueDatetime()));
        writeTlv(baos, 4, formatAmount(invoice.getTotalAmount()));
        writeTlv(baos, 5, formatAmount(invoice.getVatAmount()));
        return Base64.getEncoder().encodeToString(baos.toByteArray());
    }

    // Phase 2 QR (adds digital signature fields)
    public String generatePhase2Qr(Invoice invoice, String invoiceHashBase64,
                                    String digitalSignatureBase64, String publicKeyBase64,
                                    String signatureOfPublicKeyBase64) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        writeTlv(baos, 1, invoice.getSellerNameAr());
        writeTlv(baos, 2, invoice.getSellerVatNumber());
        writeTlv(baos, 3, ZATCA_DATETIME.format(invoice.getIssueDatetime()));
        writeTlv(baos, 4, formatAmount(invoice.getTotalAmount()));
        writeTlv(baos, 5, formatAmount(invoice.getVatAmount()));

        // Phase 2 additional tags
        writeRawTlv(baos, 6, Base64.getDecoder().decode(invoiceHashBase64));
        writeRawTlv(baos, 7, Base64.getDecoder().decode(digitalSignatureBase64));
        writeRawTlv(baos, 8, Base64.getDecoder().decode(publicKeyBase64));

        if (signatureOfPublicKeyBase64 != null) {
            writeRawTlv(baos, 9, Base64.getDecoder().decode(signatureOfPublicKeyBase64));
        }

        return Base64.getEncoder().encodeToString(baos.toByteArray());
    }

    private void writeTlv(ByteArrayOutputStream baos, int tag, String value) {
        byte[] valueBytes = value.getBytes(StandardCharsets.UTF_8);
        baos.write(tag);
        baos.write(valueBytes.length);
        baos.writeBytes(valueBytes);
    }

    private void writeRawTlv(ByteArrayOutputStream baos, int tag, byte[] value) {
        baos.write(tag);
        // ZATCA uses multi-byte length for binary fields > 127 bytes
        if (value.length > 127) {
            baos.write(0x81);  // length indicator: 1 following byte for length
            baos.write(value.length & 0xFF);
        } else {
            baos.write(value.length);
        }
        baos.writeBytes(value);
    }

    private String formatAmount(BigDecimal amount) {
        return amount.toPlainString();
    }
}
