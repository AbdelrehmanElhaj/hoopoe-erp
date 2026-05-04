package com.accounting.modules.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardDto {

    private InvoiceStats invoiceStats;
    private JournalStats journalStats;
    private ZatcaStats zatcaStats;
    private List<RecentInvoice> recentInvoices;
    private List<RecentJournalEntry> recentJournalEntries;

    @Data @Builder
    public static class InvoiceStats {
        private long totalCount;
        private long monthCount;
        private long draftCount;
        private long confirmedCount;
        private BigDecimal totalRevenue;
        private BigDecimal monthRevenue;
        private BigDecimal totalVat;
        private BigDecimal monthVat;
    }

    @Data @Builder
    public static class JournalStats {
        private long totalCount;
        private long draftCount;
        private long postedCount;
    }

    @Data @Builder
    public static class ZatcaStats {
        private long notSubmitted;
        private long pending;
        private long cleared;
        private long reported;
        private long rejected;
    }

    @Data @Builder
    public static class RecentInvoice {
        private String id;
        private String invoiceNumber;
        private String buyerName;
        private String invoiceType;
        private BigDecimal totalAmount;
        private String status;
        private String zatcaStatus;
        private String issueDatetime;
    }

    @Data @Builder
    public static class RecentJournalEntry {
        private String id;
        private String entryNumber;
        private String description;
        private BigDecimal totalDebit;
        private String status;
        private String entryDate;
    }
}
