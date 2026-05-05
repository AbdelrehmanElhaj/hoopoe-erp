package com.accounting.modules.contacts.controller;

import com.accounting.modules.contacts.dto.ContactResponse;
import com.accounting.modules.contacts.dto.CreateContactRequest;
import com.accounting.modules.contacts.dto.UpdateContactRequest;
import com.accounting.modules.contacts.entity.Contact;
import com.accounting.modules.contacts.repository.ContactRepository;
import com.accounting.shared.dto.ApiResponse;
import com.accounting.shared.exception.BusinessException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactRepository contactRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ContactResponse>>> findAll(
            @RequestParam(required = false) Contact.ContactType type,
            @RequestParam(required = false, defaultValue = "") String search,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ContactResponse> page = contactRepository
                .search(type, search, pageable)
                .map(ContactResponse::from);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ContactResponse>> findById(@PathVariable UUID id) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Contact not found", HttpStatus.NOT_FOUND));
        return ResponseEntity.ok(ApiResponse.ok(ContactResponse.from(contact)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<ContactResponse>> create(
            @Valid @RequestBody CreateContactRequest req) {
        Contact contact = Contact.builder()
                .nameAr(req.getNameAr())
                .nameEn(req.getNameEn())
                .contactType(req.getContactType())
                .vatNumber(req.getVatNumber())
                .crNumber(req.getCrNumber())
                .phone(req.getPhone())
                .email(req.getEmail())
                .address(req.getAddress())
                .notes(req.getNotes())
                .build();
        contact = contactRepository.save(contact);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ContactResponse.from(contact), "تم إضافة جهة الاتصال"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<ContactResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateContactRequest req) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Contact not found", HttpStatus.NOT_FOUND));
        contact.setNameAr(req.getNameAr());
        contact.setNameEn(req.getNameEn());
        contact.setContactType(req.getContactType());
        contact.setVatNumber(req.getVatNumber());
        contact.setCrNumber(req.getCrNumber());
        contact.setPhone(req.getPhone());
        contact.setEmail(req.getEmail());
        contact.setAddress(req.getAddress());
        contact.setNotes(req.getNotes());
        if (req.getActive() != null) {
            contact.setActive(req.getActive());
        }
        contact = contactRepository.save(contact);
        return ResponseEntity.ok(ApiResponse.ok(ContactResponse.from(contact), "تم تحديث جهة الاتصال"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Contact not found", HttpStatus.NOT_FOUND));
        contact.setActive(false);
        contactRepository.save(contact);
        return ResponseEntity.ok(ApiResponse.ok(null, "تم تعطيل جهة الاتصال"));
    }
}
