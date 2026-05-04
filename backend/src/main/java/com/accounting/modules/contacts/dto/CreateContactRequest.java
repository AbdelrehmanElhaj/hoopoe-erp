package com.accounting.modules.contacts.dto;

import com.accounting.modules.contacts.entity.Contact;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateContactRequest {

    @NotBlank(message = "الاسم بالعربي مطلوب")
    @Size(max = 200)
    private String nameAr;

    @Size(max = 200)
    private String nameEn;

    @NotNull(message = "نوع جهة الاتصال مطلوب")
    private Contact.ContactType contactType;

    @Size(max = 20)
    private String vatNumber;

    @Size(max = 20)
    private String crNumber;

    @Size(max = 30)
    private String phone;

    @Size(max = 150)
    private String email;

    @Size(max = 500)
    private String address;

    @Size(max = 1000)
    private String notes;
}
