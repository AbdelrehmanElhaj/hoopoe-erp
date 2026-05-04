package com.accounting.modules.invoice.repository;

import com.accounting.modules.invoice.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    @Query("SELECT COUNT(i) FROM Invoice i WHERE YEAR(i.issueDatetime) = :year")
    long countByCurrentYear(int year);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.creditNote = true AND YEAR(i.issueDatetime) = :year")
    long countCreditNotesByCurrentYear(int year);

    List<Invoice> findByZatcaStatus(Invoice.ZatcaStatus status);
}
