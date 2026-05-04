package com.accounting.modules.journal.controller;

import com.accounting.modules.journal.dto.CreateJournalEntryRequest;
import com.accounting.modules.journal.dto.JournalEntryResponse;
import com.accounting.modules.journal.dto.VoidRequest;
import com.accounting.modules.journal.entity.JournalEntry;
import com.accounting.modules.journal.service.JournalService;
import com.accounting.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/journal-entries")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<JournalEntryResponse>>> findAll(
            @PageableDefault(size = 20, sort = "entryDate") Pageable pageable) {
        Page<JournalEntryResponse> page = journalService.findAll(pageable)
                .map(JournalEntryResponse::from);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JournalEntryResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(
                JournalEntryResponse.from(journalService.findById(id))));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<JournalEntryResponse>> create(
            @Valid @RequestBody CreateJournalEntryRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        JournalEntry entry = journalService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(JournalEntryResponse.from(entry), "Journal entry created"));
    }

    @PostMapping("/{id}/post")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<JournalEntryResponse>> post(
            @PathVariable UUID id,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        JournalEntry entry = journalService.post(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(JournalEntryResponse.from(entry), "Entry posted successfully"));
    }

    @PostMapping("/{id}/void")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<JournalEntryResponse>> voidEntry(
            @PathVariable UUID id,
            @Valid @RequestBody VoidRequest request,
            Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        JournalEntry entry = journalService.voidEntry(id, request.getReason(), userId);
        return ResponseEntity.ok(ApiResponse.ok(JournalEntryResponse.from(entry), "Entry voided"));
    }
}
