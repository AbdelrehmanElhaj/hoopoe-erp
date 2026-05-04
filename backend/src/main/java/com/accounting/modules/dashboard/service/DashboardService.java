package com.accounting.modules.dashboard.service;

import com.accounting.modules.dashboard.dto.DashboardDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class DashboardService {

    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public DashboardDto getDashboard() {
        LocalDate now = LocalDate.now();
        int year  = now.getYear();
        int month = now.getMonthValue();

        return DashboardDto.builder()
                .invoiceStats(buildInvoiceStats(year, month))
                .journalStats(buildJournalStats())
                .zatcaStats(buildZatcaStats())
                .recentInvoices(buildRecentInvoices())
                .recentJournalEntries(buildRecentJournalEntries())
                .build();
    }

    @SuppressWarnings("unchecked")
    private DashboardDto.InvoiceStats buildInvoiceStats(int year, int month) {
        List<Object[]> rows = em.createNativeQuery("""
            SELECT
                COUNT(*)                                                                AS total_count,
                COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM issue_datetime)  = :year
                                   AND EXTRACT(MONTH FROM issue_datetime) = :month)    AS month_count,
                COUNT(*) FILTER (WHERE status = 'DRAFT')                               AS draft_count,
                COUNT(*) FILTER (WHERE status = 'CONFIRMED')                           AS confirmed_count,
                COALESCE(SUM(taxable_amount), 0)                                       AS total_revenue,
                COALESCE(SUM(taxable_amount) FILTER (
                    WHERE EXTRACT(YEAR FROM issue_datetime)  = :year
                      AND EXTRACT(MONTH FROM issue_datetime) = :month), 0)             AS month_revenue,
                COALESCE(SUM(vat_amount), 0)                                           AS total_vat,
                COALESCE(SUM(vat_amount) FILTER (
                    WHERE EXTRACT(YEAR FROM issue_datetime)  = :year
                      AND EXTRACT(MONTH FROM issue_datetime) = :month), 0)             AS month_vat
            FROM invoices
            WHERE status != 'CANCELLED'
            """)
                .setParameter("year", year)
                .setParameter("month", month)
                .getResultList();

        Object[] r = rows.get(0);
        return DashboardDto.InvoiceStats.builder()
                .totalCount(toLong(r[0]))
                .monthCount(toLong(r[1]))
                .draftCount(toLong(r[2]))
                .confirmedCount(toLong(r[3]))
                .totalRevenue(toBigDecimal(r[4]))
                .monthRevenue(toBigDecimal(r[5]))
                .totalVat(toBigDecimal(r[6]))
                .monthVat(toBigDecimal(r[7]))
                .build();
    }

    @SuppressWarnings("unchecked")
    private DashboardDto.JournalStats buildJournalStats() {
        List<Object[]> rows = em.createNativeQuery("""
            SELECT
                COUNT(*)                                      AS total_count,
                COUNT(*) FILTER (WHERE status = 'DRAFT')     AS draft_count,
                COUNT(*) FILTER (WHERE status = 'POSTED')    AS posted_count
            FROM journal_entries
            WHERE status != 'VOID'
            """)
                .getResultList();

        Object[] r = rows.get(0);
        return DashboardDto.JournalStats.builder()
                .totalCount(toLong(r[0]))
                .draftCount(toLong(r[1]))
                .postedCount(toLong(r[2]))
                .build();
    }

    @SuppressWarnings("unchecked")
    private DashboardDto.ZatcaStats buildZatcaStats() {
        List<Object[]> rows = em.createNativeQuery("""
            SELECT
                COUNT(*) FILTER (WHERE zatca_status = 'NOT_SUBMITTED') AS not_submitted,
                COUNT(*) FILTER (WHERE zatca_status = 'PENDING')       AS pending,
                COUNT(*) FILTER (WHERE zatca_status = 'CLEARED')       AS cleared,
                COUNT(*) FILTER (WHERE zatca_status = 'REPORTED')      AS reported,
                COUNT(*) FILTER (WHERE zatca_status = 'REJECTED')      AS rejected
            FROM invoices
            WHERE status = 'CONFIRMED'
            """)
                .getResultList();

        Object[] r = rows.get(0);
        return DashboardDto.ZatcaStats.builder()
                .notSubmitted(toLong(r[0]))
                .pending(toLong(r[1]))
                .cleared(toLong(r[2]))
                .reported(toLong(r[3]))
                .rejected(toLong(r[4]))
                .build();
    }

    @SuppressWarnings("unchecked")
    private List<DashboardDto.RecentInvoice> buildRecentInvoices() {
        List<Object[]> rows = em.createNativeQuery("""
            SELECT id::text, invoice_number, buyer_name, invoice_type,
                   total_amount, status, zatca_status, issue_datetime::text
            FROM invoices
            ORDER BY created_at DESC
            LIMIT 6
            """)
                .getResultList();

        return rows.stream().map(r -> DashboardDto.RecentInvoice.builder()
                .id((String) r[0])
                .invoiceNumber((String) r[1])
                .buyerName((String) r[2])
                .invoiceType((String) r[3])
                .totalAmount(toBigDecimal(r[4]))
                .status((String) r[5])
                .zatcaStatus((String) r[6])
                .issueDatetime((String) r[7])
                .build()).toList();
    }

    @SuppressWarnings("unchecked")
    private List<DashboardDto.RecentJournalEntry> buildRecentJournalEntries() {
        List<Object[]> rows = em.createNativeQuery("""
            SELECT je.id::text, je.entry_number, je.description,
                   COALESCE(SUM(jel.debit), 0) AS total_debit,
                   je.status, je.entry_date::text
            FROM journal_entries je
            LEFT JOIN journal_entry_lines jel ON jel.entry_id = je.id
            GROUP BY je.id, je.entry_number, je.description, je.status, je.entry_date, je.created_at
            ORDER BY je.created_at DESC
            LIMIT 5
            """)
                .getResultList();

        return rows.stream().map(r -> DashboardDto.RecentJournalEntry.builder()
                .id((String) r[0])
                .entryNumber((String) r[1])
                .description((String) r[2])
                .totalDebit(toBigDecimal(r[3]))
                .status((String) r[4])
                .entryDate((String) r[5])
                .build()).toList();
    }

    private long toLong(Object o) {
        if (o == null) return 0L;
        return ((Number) o).longValue();
    }

    private BigDecimal toBigDecimal(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal bd) return bd;
        return new BigDecimal(o.toString());
    }
}
