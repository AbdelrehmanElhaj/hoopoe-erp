package com.accounting.modules.zatca.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class StoreCertificateRequest {

    @NotBlank
    private String certificatePem;

    @NotBlank
    private String serialNumber;
}
