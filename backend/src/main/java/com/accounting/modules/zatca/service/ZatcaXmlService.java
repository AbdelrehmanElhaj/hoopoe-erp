package com.accounting.modules.zatca.service;

import com.accounting.modules.invoice.entity.Invoice;
import com.accounting.modules.invoice.entity.InvoiceItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.time.ZoneId;

/**
 * ZATCA XML Generation Service
 *
 * Generates UBL 2.1 XML compliant with ZATCA e-invoicing specifications.
 * Supports both Standard (B2B) and Simplified (B2C) invoice types.
 */
@Slf4j
@Service
public class ZatcaXmlService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm:ss");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter
            .ofPattern("yyyy-MM-dd'T'HH:mm:ss")
            .withZone(ZoneId.of("UTC"));

    public String generateXml(Invoice invoice) {
        String issueDate = DATE_FMT.format(invoice.getIssueDatetime().atZone(ZoneId.of("UTC")));
        String issueTime = TIME_FMT.format(invoice.getIssueDatetime().atZone(ZoneId.of("UTC")));

        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<Invoice xmlns=\"urn:oasis:names:specification:ubl:schema:xsd:Invoice-2\"\n");
        sb.append("         xmlns:cac=\"urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2\"\n");
        sb.append("         xmlns:cbc=\"urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2\"\n");
        sb.append("         xmlns:ext=\"urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2\">\n");

        // UBL Extensions (ZATCA signature placeholder)
        sb.append("  <ext:UBLExtensions>\n");
        sb.append("    <ext:UBLExtension>\n");
        sb.append("      <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:ext:XMLDSIG</ext:ExtensionURI>\n");
        sb.append("      <ext:ExtensionContent/>\n");
        sb.append("    </ext:UBLExtension>\n");
        sb.append("  </ext:UBLExtensions>\n");

        // Header
        sb.append("  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>\n");
        sb.append("  <cbc:ID>").append(escape(invoice.getInvoiceNumber())).append("</cbc:ID>\n");
        sb.append("  <cbc:UUID>").append(invoice.getUuid()).append("</cbc:UUID>\n");
        sb.append("  <cbc:IssueDate>").append(issueDate).append("</cbc:IssueDate>\n");
        sb.append("  <cbc:IssueTime>").append(issueTime).append("</cbc:IssueTime>\n");
        sb.append("  <cbc:InvoiceTypeCode name=\"").append(invoice.getInvoiceSubtype()).append("\">")
                .append(invoice.getInvoiceType() == Invoice.InvoiceType.STANDARD ? "388" : "381")
                .append("</cbc:InvoiceTypeCode>\n");
        sb.append("  <cbc:DocumentCurrencyCode>").append(invoice.getCurrency()).append("</cbc:DocumentCurrencyCode>\n");
        sb.append("  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>\n");

        // Seller (AccountingSupplierParty)
        sb.append("  <cac:AccountingSupplierParty>\n");
        sb.append("    <cac:Party>\n");
        sb.append("      <cac:PartyIdentification>\n");
        sb.append("        <cbc:ID schemeID=\"CRN\">").append(escape(invoice.getSellerCrNumber())).append("</cbc:ID>\n");
        sb.append("      </cac:PartyIdentification>\n");
        sb.append("      <cac:PostalAddress>\n");
        sb.append("        <cbc:StreetName>").append(escape(invoice.getSellerAddress())).append("</cbc:StreetName>\n");
        sb.append("        <cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country>\n");
        sb.append("      </cac:PostalAddress>\n");
        sb.append("      <cac:PartyTaxScheme>\n");
        sb.append("        <cbc:CompanyID>").append(escape(invoice.getSellerVatNumber())).append("</cbc:CompanyID>\n");
        sb.append("        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>\n");
        sb.append("      </cac:PartyTaxScheme>\n");
        sb.append("      <cac:PartyLegalEntity>\n");
        sb.append("        <cbc:RegistrationName>").append(escape(invoice.getSellerNameAr())).append("</cbc:RegistrationName>\n");
        sb.append("      </cac:PartyLegalEntity>\n");
        sb.append("    </cac:Party>\n");
        sb.append("  </cac:AccountingSupplierParty>\n");

        // Buyer (AccountingCustomerParty)
        sb.append("  <cac:AccountingCustomerParty>\n");
        sb.append("    <cac:Party>\n");
        if (invoice.getBuyerVatNumber() != null) {
            sb.append("      <cac:PartyTaxScheme>\n");
            sb.append("        <cbc:CompanyID>").append(escape(invoice.getBuyerVatNumber())).append("</cbc:CompanyID>\n");
            sb.append("        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>\n");
            sb.append("      </cac:PartyTaxScheme>\n");
        }
        sb.append("      <cac:PartyLegalEntity>\n");
        sb.append("        <cbc:RegistrationName>").append(escape(invoice.getBuyerName())).append("</cbc:RegistrationName>\n");
        sb.append("      </cac:PartyLegalEntity>\n");
        sb.append("    </cac:Party>\n");
        sb.append("  </cac:AccountingCustomerParty>\n");

        // Invoice Lines
        for (InvoiceItem item : invoice.getItems()) {
            sb.append("  <cac:InvoiceLine>\n");
            sb.append("    <cbc:ID>").append(item.getLineNumber()).append("</cbc:ID>\n");
            sb.append("    <cbc:InvoicedQuantity unitCode=\"").append(escape(item.getUnitOfMeasure())).append("\">")
                    .append(item.getQuantity().toPlainString()).append("</cbc:InvoicedQuantity>\n");
            sb.append("    <cbc:LineExtensionAmount currencyID=\"SAR\">")
                    .append(item.getTaxableAmount().toPlainString()).append("</cbc:LineExtensionAmount>\n");
            sb.append("    <cac:TaxTotal>\n");
            sb.append("      <cbc:TaxAmount currencyID=\"SAR\">")
                    .append(item.getVatAmount().toPlainString()).append("</cbc:TaxAmount>\n");
            sb.append("    </cac:TaxTotal>\n");
            sb.append("    <cac:Item>\n");
            sb.append("      <cbc:Name>").append(escape(item.getDescriptionAr())).append("</cbc:Name>\n");
            sb.append("      <cac:ClassifiedTaxCategory>\n");
            sb.append("        <cbc:ID>").append(taxCategoryCode(item.getTaxCategory())).append("</cbc:ID>\n");
            sb.append("        <cbc:Percent>").append(item.getTaxRate().toPlainString()).append("</cbc:Percent>\n");
            sb.append("        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>\n");
            sb.append("      </cac:ClassifiedTaxCategory>\n");
            sb.append("    </cac:Item>\n");
            sb.append("    <cac:Price>\n");
            sb.append("      <cbc:PriceAmount currencyID=\"SAR\">")
                    .append(item.getUnitPrice().toPlainString()).append("</cbc:PriceAmount>\n");
            sb.append("    </cac:Price>\n");
            sb.append("  </cac:InvoiceLine>\n");
        }

        // Tax Total
        sb.append("  <cac:TaxTotal>\n");
        sb.append("    <cbc:TaxAmount currencyID=\"SAR\">")
                .append(invoice.getVatAmount().toPlainString()).append("</cbc:TaxAmount>\n");
        sb.append("  </cac:TaxTotal>\n");

        // Legal Monetary Total
        sb.append("  <cac:LegalMonetaryTotal>\n");
        sb.append("    <cbc:LineExtensionAmount currencyID=\"SAR\">")
                .append(invoice.getSubtotal().toPlainString()).append("</cbc:LineExtensionAmount>\n");
        sb.append("    <cbc:TaxExclusiveAmount currencyID=\"SAR\">")
                .append(invoice.getTaxableAmount().toPlainString()).append("</cbc:TaxExclusiveAmount>\n");
        sb.append("    <cbc:TaxInclusiveAmount currencyID=\"SAR\">")
                .append(invoice.getTotalAmount().toPlainString()).append("</cbc:TaxInclusiveAmount>\n");
        sb.append("    <cbc:AllowanceTotalAmount currencyID=\"SAR\">")
                .append(invoice.getDiscountAmount().toPlainString()).append("</cbc:AllowanceTotalAmount>\n");
        sb.append("    <cbc:PayableAmount currencyID=\"SAR\">")
                .append(invoice.getTotalAmount().toPlainString()).append("</cbc:PayableAmount>\n");
        sb.append("  </cac:LegalMonetaryTotal>\n");

        sb.append("</Invoice>");
        return sb.toString();
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private String taxCategoryCode(InvoiceItem.TaxCategory category) {
        return switch (category) {
            case STANDARD -> "S";
            case ZERO_RATED -> "Z";
            case EXEMPT -> "E";
        };
    }
}
