package com.accounting.modules.contacts.entity;

import com.accounting.shared.entity.AuditEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "contacts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contact extends AuditEntity {

    public enum ContactType { CUSTOMER, SUPPLIER, BOTH }

    @Column(name = "name_ar", nullable = false, length = 200)
    private String nameAr;

    @Column(name = "name_en", length = 200)
    private String nameEn;

    @Enumerated(EnumType.STRING)
    @Column(name = "contact_type", nullable = false, length = 20)
    private ContactType contactType;

    @Column(name = "vat_number", length = 20)
    private String vatNumber;

    @Column(name = "cr_number", length = 20)
    private String crNumber;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private boolean active = true;
}
