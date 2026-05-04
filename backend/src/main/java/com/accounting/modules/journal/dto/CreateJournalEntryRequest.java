package com.accounting.modules.journal.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class CreateJournalEntryRequest {

    @NotNull
    private LocalDate entryDate;

    @NotBlank
    @Size(max = 500)
    private String description;

    @Size(max = 100)
    private String reference;

    private String sourceType;
    private UUID sourceId;

    @NotEmpty
    @Size(min = 2, message = "Entry must have at least 2 lines")
    @Valid
    private List<JournalLineRequest> lines;
}
