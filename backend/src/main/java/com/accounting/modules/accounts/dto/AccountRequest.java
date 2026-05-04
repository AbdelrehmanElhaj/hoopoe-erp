package com.accounting.modules.accounts.dto;

import com.accounting.modules.accounts.entity.Account;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.UUID;

@Data
public class AccountRequest {

    @NotBlank
    @Size(max = 20)
    @Pattern(regexp = "^\\d+$", message = "Code must be numeric")
    private String code;

    @NotBlank
    @Size(max = 200)
    private String nameAr;

    @Size(max = 200)
    private String nameEn;

    @NotNull
    private Account.AccountType accountType;

    @NotNull
    private Account.NormalBalance normalBalance;

    private UUID parentId;

    @Size(max = 500)
    private String description;
}
