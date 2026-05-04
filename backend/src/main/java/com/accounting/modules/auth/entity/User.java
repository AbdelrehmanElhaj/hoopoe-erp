package com.accounting.modules.auth.entity;

import com.accounting.shared.entity.AuditEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class User extends AuditEntity {

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name_en", nullable = false, length = 200)
    private String fullNameEn;

    @Column(name = "full_name_ar", length = 200)
    private String fullNameAr;

    @Column(nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Column(name = "is_active")
    @Builder.Default
    private boolean active = true;

    public enum UserRole {
        OWNER, ADMIN, ACCOUNTANT, VIEWER
    }
}
