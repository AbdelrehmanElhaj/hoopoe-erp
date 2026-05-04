package com.accounting.modules.tenant.controller;

import com.accounting.modules.tenant.dto.CreateTenantRequest;
import com.accounting.modules.tenant.dto.TenantResponse;
import com.accounting.modules.tenant.entity.Tenant;
import com.accounting.modules.tenant.service.TenantProvisioningService;
import com.accounting.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/public/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantProvisioningService provisioningService;

    /**
     * Public endpoint - register a new company (tenant).
     * Creates schema + default chart of accounts automatically.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<TenantResponse>> register(
            @Valid @RequestBody CreateTenantRequest request) {
        Tenant tenant = provisioningService.createTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(TenantResponse.from(tenant),
                        "Company registered. Use subdomain '" + tenant.getSubdomain() + "' as your X-Tenant-ID header."));
    }
}
