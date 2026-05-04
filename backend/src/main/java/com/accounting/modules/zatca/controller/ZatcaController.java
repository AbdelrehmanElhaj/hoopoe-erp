package com.accounting.modules.zatca.controller;

import com.accounting.modules.tenant.entity.Tenant;
import com.accounting.modules.tenant.repository.TenantRepository;
import com.accounting.modules.zatca.dto.OnboardingRequest;
import com.accounting.modules.zatca.dto.StoreCertificateRequest;
import com.accounting.modules.zatca.service.ZatcaCertificateService;
import com.accounting.multitenancy.TenantContext;
import com.accounting.shared.dto.ApiResponse;
import com.accounting.shared.exception.BusinessException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/zatca")
@RequiredArgsConstructor
public class ZatcaController {

    private final ZatcaCertificateService certificateService;
    private final TenantRepository tenantRepository;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status() {
        String subdomain = TenantContext.getCurrentTenant();
        Tenant tenant = tenantRepository.findBySubdomain(subdomain)
                .orElseThrow(() -> new BusinessException("Tenant not found"));

        Map<String, Object> result = new HashMap<>();
        result.put("onboarded", tenant.getZatcaOnboardedAt() != null);
        result.put("vatNumber", tenant.getVatNumber());
        result.put("companyNameAr", tenant.getCompanyNameAr());
        result.put("certSerial", tenant.getZatcaCertSerial());
        result.put("onboardedAt", tenant.getZatcaOnboardedAt());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/generate-csr")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCsr(
            @Valid @RequestBody OnboardingRequest request) throws Exception {
        String subdomain = TenantContext.getCurrentTenant();
        String csr = certificateService.generateCsr(subdomain, request.getOtp());
        return ResponseEntity.ok(ApiResponse.ok(
                Map.of("csr", csr),
                "CSR generated. Submit this to ZATCA portal to receive your certificate."));
    }

    @PostMapping("/store-certificate")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> storeCertificate(
            @Valid @RequestBody StoreCertificateRequest request) {
        String subdomain = TenantContext.getCurrentTenant();
        certificateService.storeCertificate(subdomain, request.getCertificatePem(), request.getSerialNumber());
        return ResponseEntity.ok(ApiResponse.ok(null, "ZATCA certificate stored successfully"));
    }
}
