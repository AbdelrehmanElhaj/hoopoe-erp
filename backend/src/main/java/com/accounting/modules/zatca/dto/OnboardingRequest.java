package com.accounting.modules.zatca.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OnboardingRequest {

    @NotBlank
    @Size(min = 6, max = 6, message = "OTP must be exactly 6 characters")
    private String otp;
}
