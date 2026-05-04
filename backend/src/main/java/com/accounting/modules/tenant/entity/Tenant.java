package com.accounting.modules.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tenants", schema = "public")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 50)
    private String subdomain;

    @Column(name = "company_name_ar", nullable = false, length = 200)
    private String companyNameAr;

    @Column(name = "company_name_en", length = 200)
    private String companyNameEn;

    @Column(name = "vat_number", unique = true, nullable = false, length = 15)
    private String vatNumber;

    @Column(name = "cr_number", length = 20)
    private String crNumber;

    @Column(name = "address_ar")
    private String addressAr;

    @Column(name = "schema_name", unique = true, nullable = false, length = 63)
    private String schemaName;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private TenantStatus status;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private TenantPlan plan;

    @Column(name = "zatca_cert_pem", columnDefinition = "TEXT")
    private String zatcaCertPem;

    @Column(name = "zatca_private_key_enc", columnDefinition = "TEXT")
    private String zatcaPrivateKeyEnc;

    @Column(name = "zatca_cert_serial", length = 100)
    private String zatcaCertSerial;

    @Column(name = "zatca_onboarded_at")
    private Instant zatcaOnboardedAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (status == null) status = TenantStatus.ACTIVE;
        if (plan == null) plan = TenantPlan.BASIC;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public enum TenantStatus { ACTIVE, SUSPENDED, CANCELLED }
    public enum TenantPlan { BASIC, STANDARD, ENTERPRISE }
}
