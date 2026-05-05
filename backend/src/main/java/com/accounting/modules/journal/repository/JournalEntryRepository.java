package com.accounting.modules.journal.repository;

import com.accounting.modules.journal.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

    @Query("SELECT COUNT(j) FROM JournalEntry j WHERE YEAR(j.entryDate) = :year")
    long countByCurrentYear(int year);

    // Eagerly loads lines + their accounts in one query so callers outside a
    // transaction (controller layer) can safely call JournalEntryResponse.from().
    @Query("SELECT DISTINCT j FROM JournalEntry j " +
           "LEFT JOIN FETCH j.lines l " +
           "LEFT JOIN FETCH l.account " +
           "WHERE j.id = :id")
    Optional<JournalEntry> findByIdWithLines(@Param("id") UUID id);

    List<JournalEntry> findByEntryDateBetweenOrderByEntryDateAsc(LocalDate from, LocalDate to);

    List<JournalEntry> findBySourceTypeAndSourceId(String sourceType, UUID sourceId);
}
