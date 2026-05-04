package com.accounting.modules.zatca.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.Map;

/**
 * ZATCA Fatoora API Client
 *
 * Phase 2 operations:
 * - /compliance:          Submit invoice for compliance check
 * - /invoices/reporting:  Report B2C (simplified) invoice
 * - /invoices/clearance:  Clear B2B (standard) invoice
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ZatcaApiClient {

    @Value("${app.zatca.environment}")
    private String environment;

    @Value("${app.zatca.sandbox-url}")
    private String sandboxUrl;

    @Value("${app.zatca.production-url}")
    private String productionUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Clear a Standard (B2B) invoice - ZATCA must approve before sharing with buyer.
     */
    public Map<String, Object> clearInvoice(String invoiceXmlBase64, String invoiceHash,
                                            String uuid, String certPem, String secret) {
        HttpHeaders headers = buildHeaders(certPem, secret);
        headers.set("clearanceStatus", "1");

        Map<String, String> body = Map.of(
                "invoiceHash", invoiceHash,
                "uuid", uuid,
                "invoice", invoiceXmlBase64
        );

        String url = getApiUrl() + "/invoices/clearance?lang=en";
        log.info("Submitting invoice for ZATCA clearance: UUID={}", uuid);

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.PUT,
                new HttpEntity<>(body, headers),
                String.class
        );

        return parseResponse(response);
    }

    /**
     * Report a Simplified (B2C) invoice to ZATCA.
     * No approval needed, just notification within 24 hours.
     */
    public Map<String, Object> reportInvoice(String invoiceXmlBase64, String invoiceHash,
                                              String uuid, String certPem, String secret) {
        HttpHeaders headers = buildHeaders(certPem, secret);

        Map<String, String> body = Map.of(
                "invoiceHash", invoiceHash,
                "uuid", uuid,
                "invoice", invoiceXmlBase64
        );

        String url = getApiUrl() + "/invoices/reporting?lang=en";
        log.info("Reporting simplified invoice to ZATCA: UUID={}", uuid);

        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST,
                new HttpEntity<>(body, headers),
                String.class
        );

        return parseResponse(response);
    }

    private HttpHeaders buildHeaders(String certPem, String secret) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));

        // ZATCA uses certificate + secret as Basic Auth credentials
        String credentials = Base64.getEncoder().encodeToString(
                (certPem + ":" + secret).getBytes());
        headers.set("Authorization", "Basic " + credentials);
        headers.set("Accept-Version", "V2");

        return headers;
    }

    private String getApiUrl() {
        return "sandbox".equalsIgnoreCase(environment) ? sandboxUrl : productionUrl;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseResponse(ResponseEntity<String> response) {
        try {
            return objectMapper.readValue(response.getBody(), Map.class);
        } catch (Exception e) {
            log.error("Failed to parse ZATCA response", e);
            return Map.of("rawResponse", response.getBody(),
                    "statusCode", response.getStatusCode().value());
        }
    }
}
