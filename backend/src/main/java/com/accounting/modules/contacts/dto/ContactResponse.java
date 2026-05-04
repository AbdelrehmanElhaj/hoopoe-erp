package com.accounting.modules.contacts.dto;

import com.accounting.modules.contacts.entity.Contact;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ContactResponse {

    private UUID id;
    private String nameAr;
    private String nameEn;
    private String contactType;
    private String vatNumber;
    private String crNumber;
    private String phone;
    private String email;
    private String address;
    private String notes;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;

    public static ContactResponse from(Contact c) {
        return ContactResponse.builder()
                .id(c.getId())
                .nameAr(c.getNameAr())
                .nameEn(c.getNameEn())
                .contactType(c.getContactType().name())
                .vatNumber(c.getVatNumber())
                .crNumber(c.getCrNumber())
                .phone(c.getPhone())
                .email(c.getEmail())
                .address(c.getAddress())
                .notes(c.getNotes())
                .active(c.isActive())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
