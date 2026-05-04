package com.accounting.modules.tenant.dto;

import com.accounting.modules.tenant.entity.Tenant;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TenantResponse {

    private UUID id;
    private String subdomain;
    private String companyNameAr;
    private String companyNameEn;
    private String vatNumber;
    private String crNumber;
    private String addressAr;
    private String status;
    private String plan;
    private boolean zatcaOnboarded;
    private Instant createdAt;

    public static TenantResponse from(Tenant tenant) {
        return TenantResponse.builder()
                .id(tenant.getId())
                .subdomain(tenant.getSubdomain())
                .companyNameAr(tenant.getCompanyNameAr())
                .companyNameEn(tenant.getCompanyNameEn())
                .vatNumber(tenant.getVatNumber())
                .crNumber(tenant.getCrNumber())
                .addressAr(tenant.getAddressAr())
                .status(tenant.getStatus() != null ? tenant.getStatus().name() : null)
                .plan(tenant.getPlan() != null ? tenant.getPlan().name() : null)
                .zatcaOnboarded(tenant.getZatcaOnboardedAt() != null)
                .createdAt(tenant.getCreatedAt())
                .build();
    }
}
