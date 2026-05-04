package com.accounting.modules.tenant.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateTenantRequest {

    @NotBlank
    @Size(min = 3, max = 50)
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Subdomain must be lowercase letters, numbers, and hyphens only")
    private String subdomain;

    @NotBlank
    @Size(max = 200)
    private String companyNameAr;

    @Size(max = 200)
    private String companyNameEn;

    @NotBlank
    @Pattern(regexp = "^3\\d{14}$", message = "VAT number must be 15 digits starting with 3")
    private String vatNumber;

    @Size(max = 20)
    private String crNumber;

    private String addressAr;

    @NotBlank
    @Size(min = 8)
    private String ownerEmail;

    @NotBlank
    @Size(min = 8)
    private String ownerPassword;

    @NotBlank
    private String ownerFullName;
}
