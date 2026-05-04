package com.accounting.modules.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateTenantProfileRequest {

    @NotBlank
    @Size(max = 200)
    private String companyNameAr;

    @Size(max = 200)
    private String companyNameEn;

    @Size(max = 20)
    private String crNumber;

    @Size(max = 500)
    private String addressAr;
}
