package com.accounting.modules.accounts.dto;

import com.accounting.modules.accounts.entity.Account;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AccountResponse {

    private UUID id;
    private String code;
    private String nameAr;
    private String nameEn;
    private String accountType;
    private String normalBalance;
    private UUID parentId;
    private String parentCode;
    private int level;
    private boolean leaf;
    private boolean active;
    private String description;

    public static AccountResponse from(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .code(account.getCode())
                .nameAr(account.getNameAr())
                .nameEn(account.getNameEn())
                .accountType(account.getAccountType().name())
                .normalBalance(account.getNormalBalance().name())
                .parentId(account.getParent() != null ? account.getParent().getId() : null)
                .parentCode(account.getParent() != null ? account.getParent().getCode() : null)
                .level(account.getLevel())
                .leaf(account.isLeaf())
                .active(account.isActive())
                .description(account.getDescription())
                .build();
    }
}
