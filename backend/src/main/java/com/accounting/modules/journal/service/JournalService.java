package com.accounting.modules.journal.service;

import com.accounting.modules.accounts.entity.Account;
import com.accounting.modules.accounts.repository.AccountRepository;
import com.accounting.modules.journal.dto.CreateJournalEntryRequest;
import com.accounting.modules.journal.dto.JournalEntryResponse;
import com.accounting.modules.journal.dto.JournalLineRequest;
import com.accounting.modules.journal.entity.JournalEntry;
import com.accounting.modules.journal.entity.JournalEntryLine;
import com.accounting.modules.journal.repository.JournalEntryRepository;
import com.accounting.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.Year;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalEntryRepository journalRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public JournalEntry create(CreateJournalEntryRequest request, UUID userId) {
        validateBalance(request);

        JournalEntry entry = JournalEntry.builder()
                .entryNumber(generateEntryNumber())
                .entryDate(request.getEntryDate())
                .description(request.getDescription())
                .reference(request.getReference())
                .sourceType(request.getSourceType())
                .sourceId(request.getSourceId())
                .status(JournalEntry.EntryStatus.DRAFT)
                .build();

        AtomicInteger lineNum = new AtomicInteger(1);
        for (JournalLineRequest lineReq : request.getLines()) {
            Account account = accountRepository.findById(lineReq.getAccountId())
                    .orElseThrow(() -> new BusinessException("Account not found: " + lineReq.getAccountId()));

            if (!account.isPostable()) {
                throw new BusinessException("Account " + account.getCode() + " does not allow posting");
            }

            JournalEntryLine line = JournalEntryLine.builder()
                    .entry(entry)
                    .lineNumber(lineNum.getAndIncrement())
                    .account(account)
                    .debit(lineReq.getDebit() != null ? lineReq.getDebit() : BigDecimal.ZERO)
                    .credit(lineReq.getCredit() != null ? lineReq.getCredit() : BigDecimal.ZERO)
                    .description(lineReq.getDescription())
                    .build();

            entry.getLines().add(line);
        }

        return journalRepository.save(entry);
    }

    @Transactional
    public JournalEntry post(UUID entryId, UUID userId) {
        JournalEntry entry = findById(entryId);

        if (!entry.isEditable()) {
            throw new BusinessException("Only DRAFT entries can be posted");
        }
        if (entry.getLines().isEmpty()) {
            throw new BusinessException("Cannot post entry with no lines");
        }

        validateBalance(entry);

        entry.setStatus(JournalEntry.EntryStatus.POSTED);
        entry.setPostedBy(userId);
        entry.setPostedAt(Instant.now());

        log.info("Journal entry posted: {}", entry.getEntryNumber());
        return journalRepository.save(entry);
    }

    @Transactional
    public JournalEntry voidEntry(UUID entryId, String reason, UUID userId) {
        JournalEntry entry = findById(entryId);

        if (entry.getStatus() == JournalEntry.EntryStatus.VOID) {
            throw new BusinessException("Entry is already void");
        }
        if (reason == null || reason.isBlank()) {
            throw new BusinessException("Void reason is required");
        }

        entry.setStatus(JournalEntry.EntryStatus.VOID);
        entry.setVoidReason(reason);
        entry.setVoidedBy(userId);
        entry.setVoidedAt(Instant.now());

        log.info("Journal entry voided: {} - Reason: {}", entry.getEntryNumber(), reason);
        return journalRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public Page<JournalEntryResponse> findAll(Pageable pageable) {
        return journalRepository.findAll(pageable).map(JournalEntryResponse::from);
    }

    @Transactional(readOnly = true)
    public JournalEntry findById(UUID id) {
        return journalRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Journal entry not found", HttpStatus.NOT_FOUND));
    }

    private void validateBalance(CreateJournalEntryRequest request) {
        BigDecimal totalDebit = request.getLines().stream()
                .map(l -> l.getDebit() != null ? l.getDebit() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredit = request.getLines().stream()
                .map(l -> l.getCredit() != null ? l.getCredit() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalDebit.compareTo(BigDecimal.ZERO) == 0) {
            throw new BusinessException("Journal entry must have at least one debit line");
        }
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new BusinessException(
                    String.format("Journal entry is not balanced: Debit=%.2f, Credit=%.2f",
                            totalDebit, totalCredit));
        }
    }

    private void validateBalance(JournalEntry entry) {
        BigDecimal totalDebit = entry.getLines().stream()
                .map(JournalEntryLine::getDebit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredit = entry.getLines().stream()
                .map(JournalEntryLine::getCredit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new BusinessException("Journal entry is not balanced");
        }
    }

    private String generateEntryNumber() {
        int year = Year.now().getValue();
        long count = journalRepository.countByCurrentYear(year) + 1;
        return String.format("JE-%d-%06d", year, count);
    }
}
