package com.accounting.modules.journal.repository;

import com.accounting.modules.journal.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

    @Query("SELECT COUNT(j) FROM JournalEntry j WHERE YEAR(j.entryDate) = :year")
    long countByCurrentYear(int year);

    List<JournalEntry> findByEntryDateBetweenOrderByEntryDateAsc(LocalDate from, LocalDate to);

    List<JournalEntry> findBySourceTypeAndSourceId(String sourceType, UUID sourceId);
}
