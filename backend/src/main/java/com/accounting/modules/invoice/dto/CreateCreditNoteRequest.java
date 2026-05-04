package com.accounting.modules.invoice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCreditNoteRequest {

    @NotBlank(message = "سبب الإشعار الدائن مطلوب")
    private String reason;
}
