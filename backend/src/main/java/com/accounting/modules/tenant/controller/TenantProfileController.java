package com.accounting.modules.tenant.controller;

import com.accounting.modules.tenant.dto.TenantResponse;
import com.accounting.modules.tenant.dto.UpdateTenantProfileRequest;
import com.accounting.modules.tenant.entity.Tenant;
import com.accounting.modules.tenant.repository.TenantRepository;
import com.accounting.multitenancy.TenantContext;
import com.accounting.shared.dto.ApiResponse;
import com.accounting.shared.exception.BusinessException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tenant/profile")
@RequiredArgsConstructor
public class TenantProfileController {

    private final TenantRepository tenantRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<TenantResponse>> getProfile() {
        Tenant tenant = current();
        return ResponseEntity.ok(ApiResponse.ok(TenantResponse.from(tenant)));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<TenantResponse>> updateProfile(
            @Valid @RequestBody UpdateTenantProfileRequest req) {
        Tenant tenant = current();
        tenant.setCompanyNameAr(req.getCompanyNameAr());
        tenant.setCompanyNameEn(req.getCompanyNameEn());
        tenant.setCrNumber(req.getCrNumber());
        tenant.setAddressAr(req.getAddressAr());
        tenantRepository.save(tenant);
        return ResponseEntity.ok(ApiResponse.ok(TenantResponse.from(tenant), "تم حفظ بيانات الشركة"));
    }

    private Tenant current() {
        return tenantRepository.findBySubdomain(TenantContext.getCurrentTenant())
                .orElseThrow(() -> new BusinessException("Tenant not found"));
    }
}
