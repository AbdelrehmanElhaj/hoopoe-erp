package com.accounting.modules.accounts.entity;

import com.accounting.shared.entity.AuditEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "accounts")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Account extends AuditEntity {

    @Column(unique = true, nullable = false, length = 20)
    private String code;

    @Column(name = "name_ar", nullable = false, length = 200)
    private String nameAr;

    @Column(name = "name_en", length = 200)
    private String nameEn;

    @Column(name = "account_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private AccountType accountType;

    @Column(name = "normal_balance", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    private NormalBalance normalBalance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Account parent;

    @Column(nullable = false)
    private int level;

    @Column(name = "is_leaf")
    @Builder.Default
    private boolean leaf = true;

    @Column(name = "is_active")
    @Builder.Default
    private boolean active = true;

    @Column
    private String description;

    public enum AccountType {
        ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    }

    public enum NormalBalance {
        DEBIT, CREDIT
    }

    public boolean isPostable() {
        return leaf && active;
    }
}
