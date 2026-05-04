package com.accounting.modules.journal.dto;

import com.accounting.modules.journal.entity.JournalEntry;
import com.accounting.modules.journal.entity.JournalEntryLine;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class JournalEntryResponse {

    private UUID id;
    private String entryNumber;
    private LocalDate entryDate;
    private String description;
    private String reference;
    private String status;
    private String sourceType;
    private UUID sourceId;
    private Instant postedAt;
    private List<LineResponse> lines;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;

    @Data
    @Builder
    public static class LineResponse {
        private UUID id;
        private int lineNumber;
        private UUID accountId;
        private String accountCode;
        private String accountNameAr;
        private BigDecimal debit;
        private BigDecimal credit;
        private String description;
    }

    public static JournalEntryResponse from(JournalEntry entry) {
        List<LineResponse> lines = entry.getLines().stream()
                .map(l -> LineResponse.builder()
                        .id(l.getId())
                        .lineNumber(l.getLineNumber())
                        .accountId(l.getAccount().getId())
                        .accountCode(l.getAccount().getCode())
                        .accountNameAr(l.getAccount().getNameAr())
                        .debit(l.getDebit())
                        .credit(l.getCredit())
                        .description(l.getDescription())
                        .build())
                .toList();

        BigDecimal totalDebit = lines.stream()
                .map(LineResponse::getDebit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredit = lines.stream()
                .map(LineResponse::getCredit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return JournalEntryResponse.builder()
                .id(entry.getId())
                .entryNumber(entry.getEntryNumber())
                .entryDate(entry.getEntryDate())
                .description(entry.getDescription())
                .reference(entry.getReference())
                .status(entry.getStatus().name())
                .sourceType(entry.getSourceType())
                .sourceId(entry.getSourceId())
                .postedAt(entry.getPostedAt())
                .lines(lines)
                .totalDebit(totalDebit)
                .totalCredit(totalCredit)
                .build();
    }
}
