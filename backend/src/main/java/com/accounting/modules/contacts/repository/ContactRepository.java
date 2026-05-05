package com.accounting.modules.contacts.repository;

import com.accounting.modules.contacts.entity.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ContactRepository extends JpaRepository<Contact, UUID> {

    @Query("""
            SELECT c FROM Contact c
            WHERE c.active = true
              AND (:type IS NULL OR c.contactType = :type)
              AND (:search = '' OR LOWER(c.nameAr) LIKE LOWER(CONCAT('%', :search, '%'))
                                OR LOWER(c.nameEn)  LIKE LOWER(CONCAT('%', :search, '%'))
                                OR c.vatNumber      LIKE CONCAT('%', :search, '%')
                                OR c.phone          LIKE CONCAT('%', :search, '%'))
            ORDER BY c.nameAr
            """)
    Page<Contact> search(
            @Param("type") Contact.ContactType type,
            @Param("search") String search,
            Pageable pageable);

    long countByActiveTrue();
    long countByContactTypeAndActiveTrue(Contact.ContactType type);
}
