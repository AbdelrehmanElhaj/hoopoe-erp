package com.accounting.modules.journal.entity;

import com.accounting.shared.entity.AuditEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "journal_entries")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class JournalEntry extends AuditEntity {

    @Column(name = "entry_number", unique = true, nullable = false, length = 50)
    private String entryNumber;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column
    private String description;

    @Column(length = 100)
    private String reference;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EntryStatus status = EntryStatus.DRAFT;

    @Column(name = "source_type", length = 30)
    private String sourceType;

    @Column(name = "source_id")
    private UUID sourceId;

    @Column(name = "posted_by")
    private UUID postedBy;

    @Column(name = "posted_at")
    private Instant postedAt;

    @Column(name = "void_reason")
    private String voidReason;

    @Column(name = "voided_by")
    private UUID voidedBy;

    @Column(name = "voided_at")
    private Instant voidedAt;

    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @OrderBy("lineNumber ASC")
    private List<JournalEntryLine> lines = new ArrayList<>();

    public enum EntryStatus {
        DRAFT, POSTED, VOID
    }

    public boolean isEditable() {
        return status == EntryStatus.DRAFT;
    }
}
