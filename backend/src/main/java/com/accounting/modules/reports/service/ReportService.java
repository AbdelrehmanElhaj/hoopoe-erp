package com.accounting.modules.reports.service;

import com.accounting.modules.reports.dto.AccountLineDto;
import com.accounting.modules.reports.dto.BalanceSheetDto;
import com.accounting.modules.reports.dto.IncomeStatementDto;
import com.accounting.modules.reports.dto.TrialBalanceLineDto;
import com.accounting.modules.reports.dto.VatReportDto;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class ReportService {

    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<TrialBalanceLineDto> trialBalance(LocalDate from, LocalDate to) {
        String sql = """
                SELECT a.id::text,
                       a.code,
                       a.name_ar,
                       a.name_en,
                       a.account_type,
                       a.normal_balance,
                       CAST(a.level AS int),
                       a.is_leaf,
                       COALESCE(SUM(
                           CASE WHEN je.status = 'POSTED'
                                AND je.entry_date BETWEEN :from AND :to
                           THEN jel.debit ELSE 0 END
                       ), 0) AS debit_total,
                       COALESCE(SUM(
                           CASE WHEN je.status = 'POSTED'
                                AND je.entry_date BETWEEN :from AND :to
                           THEN jel.credit ELSE 0 END
                       ), 0) AS credit_total
                FROM accounts a
                LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
                LEFT JOIN journal_entries je ON je.id = jel.entry_id
                WHERE a.is_active = true
                GROUP BY a.id, a.code, a.name_ar, a.name_en,
                         a.account_type, a.normal_balance, a.level, a.is_leaf
                ORDER BY a.code
                """;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();

        return rows.stream().map(row -> {
            BigDecimal debit  = toBigDecimal(row[8]);
            BigDecimal credit = toBigDecimal(row[9]);
            return TrialBalanceLineDto.builder()
                    .id(UUID.fromString((String) row[0]))
                    .code((String) row[1])
                    .nameAr((String) row[2])
                    .nameEn((String) row[3])
                    .accountType((String) row[4])
                    .normalBalance((String) row[5])
                    .level((Integer) row[6])
                    .leaf((Boolean) row[7])
                    .debitTotal(debit)
                    .creditTotal(credit)
                    .balance(debit.subtract(credit))
                    .build();
        }).toList();
    }

    @Transactional(readOnly = true)
    public VatReportDto vatReport(LocalDate from, LocalDate to) {
        // Output VAT — aggregated from confirmed invoice items
        String outputSql = """
                SELECT
                    COALESCE(SUM(CASE WHEN ii.tax_category = 'STANDARD' AND NOT i.is_credit_note
                                     THEN ii.taxable_amount ELSE 0 END), 0),
                    COALESCE(SUM(CASE WHEN ii.tax_category = 'STANDARD' AND NOT i.is_credit_note
                                     THEN ii.vat_amount ELSE 0 END), 0),
                    COALESCE(SUM(CASE WHEN ii.tax_category = 'ZERO_RATED' AND NOT i.is_credit_note
                                     THEN ii.taxable_amount ELSE 0 END), 0),
                    COALESCE(SUM(CASE WHEN ii.tax_category = 'EXEMPT' AND NOT i.is_credit_note
                                     THEN ii.taxable_amount ELSE 0 END), 0),
                    COALESCE(SUM(CASE WHEN i.is_credit_note THEN ii.taxable_amount ELSE 0 END), 0),
                    COALESCE(SUM(CASE WHEN i.is_credit_note THEN ii.vat_amount     ELSE 0 END), 0),
                    COUNT(DISTINCT CASE WHEN i.invoice_type = 'STANDARD'   AND NOT i.is_credit_note THEN i.id END),
                    COUNT(DISTINCT CASE WHEN i.invoice_type = 'SIMPLIFIED' AND NOT i.is_credit_note THEN i.id END)
                FROM invoice_items ii
                JOIN invoices i ON i.id = ii.invoice_id
                WHERE i.status = 'CONFIRMED'
                  AND DATE(i.issue_datetime AT TIME ZONE 'UTC') BETWEEN :from AND :to
                """;

        Object[] out = (Object[]) em.createNativeQuery(outputSql)
                .setParameter("from", from)
                .setParameter("to", to)
                .getSingleResult();

        BigDecimal standardSales  = toBigDecimal(out[0]);
        BigDecimal standardVat    = toBigDecimal(out[1]);
        BigDecimal zeroRated      = toBigDecimal(out[2]);
        BigDecimal exempt         = toBigDecimal(out[3]);
        BigDecimal creditSales    = toBigDecimal(out[4]);
        BigDecimal creditVat      = toBigDecimal(out[5]);
        long standardCount        = toLong(out[6]);
        long simplifiedCount      = toLong(out[7]);

        // Input VAT from posted journal entries on account 1103 (ضريبة القيمة المضافة المدخلات)
        String inputSql = """
                SELECT COALESCE(SUM(jel.debit), 0)
                FROM journal_entry_lines jel
                JOIN journal_entries je ON je.id = jel.entry_id
                JOIN accounts a         ON a.id  = jel.account_id
                WHERE a.code = '1103'
                  AND je.status = 'POSTED'
                  AND je.entry_date BETWEEN :from AND :to
                """;

        BigDecimal inputVat = toBigDecimal(em.createNativeQuery(inputSql)
                .setParameter("from", from)
                .setParameter("to", to)
                .getSingleResult());

        BigDecimal totalOutputVat = standardVat.subtract(creditVat);
        BigDecimal netVatPayable  = totalOutputVat.subtract(inputVat);

        return VatReportDto.builder()
                .from(from)
                .to(to)
                .standardRatedSales(standardSales)
                .standardRatedVat(standardVat)
                .zeroRatedSales(zeroRated)
                .exemptSales(exempt)
                .creditNotesSales(creditSales)
                .creditNotesVat(creditVat)
                .totalOutputVat(totalOutputVat)
                .inputVat(inputVat)
                .netVatPayable(netVatPayable)
                .standardInvoiceCount(standardCount)
                .simplifiedInvoiceCount(simplifiedCount)
                .build();
    }

    @Transactional(readOnly = true)
    public IncomeStatementDto incomeStatement(LocalDate from, LocalDate to) {
        String sql = """
                SELECT a.code, a.name_ar, a.name_en, CAST(a.level AS int), a.is_leaf,
                       a.account_type,
                       COALESCE(agg.total_credit, 0) - COALESCE(agg.total_debit, 0) AS credit_balance,
                       COALESCE(agg.total_debit, 0)  - COALESCE(agg.total_credit, 0) AS debit_balance
                FROM accounts a
                LEFT JOIN (
                    SELECT jel.account_id,
                           SUM(jel.debit)  AS total_debit,
                           SUM(jel.credit) AS total_credit
                    FROM journal_entry_lines jel
                    JOIN journal_entries je ON je.id = jel.entry_id
                    WHERE je.status = 'POSTED'
                      AND je.entry_date BETWEEN :from AND :to
                    GROUP BY jel.account_id
                ) agg ON agg.account_id = a.id
                WHERE a.is_active = true
                  AND a.account_type IN ('REVENUE', 'EXPENSE')
                ORDER BY a.code
                """;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("from", from)
                .setParameter("to", to)
                .getResultList();

        List<AccountLineDto> revenueLines = new java.util.ArrayList<>();
        List<AccountLineDto> expenseLines = new java.util.ArrayList<>();

        for (Object[] row : rows) {
            String type    = (String) row[5];
            BigDecimal bal = "REVENUE".equals(type) ? toBigDecimal(row[6]) : toBigDecimal(row[7]);
            AccountLineDto line = AccountLineDto.builder()
                    .code((String) row[0])
                    .nameAr((String) row[1])
                    .nameEn((String) row[2])
                    .level((Integer) row[3])
                    .leaf((Boolean) row[4])
                    .balance(bal)
                    .build();
            if ("REVENUE".equals(type)) revenueLines.add(line);
            else expenseLines.add(line);
        }

        BigDecimal totalRevenue  = revenueLines.stream().filter(AccountLineDto::isLeaf)
                .map(AccountLineDto::getBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpenses = expenseLines.stream().filter(AccountLineDto::isLeaf)
                .map(AccountLineDto::getBalance).reduce(BigDecimal.ZERO, BigDecimal::add);

        return IncomeStatementDto.builder()
                .from(from).to(to)
                .revenueLines(revenueLines)
                .expenseLines(expenseLines)
                .totalRevenue(totalRevenue)
                .totalExpenses(totalExpenses)
                .netIncome(totalRevenue.subtract(totalExpenses))
                .build();
    }

    @Transactional(readOnly = true)
    public BalanceSheetDto balanceSheet(LocalDate asOf) {
        String sql = """
                SELECT a.code, a.name_ar, a.name_en, CAST(a.level AS int), a.is_leaf,
                       a.account_type, a.normal_balance,
                       COALESCE(agg.total_debit, 0)  AS total_debit,
                       COALESCE(agg.total_credit, 0) AS total_credit
                FROM accounts a
                LEFT JOIN (
                    SELECT jel.account_id,
                           SUM(jel.debit)  AS total_debit,
                           SUM(jel.credit) AS total_credit
                    FROM journal_entry_lines jel
                    JOIN journal_entries je ON je.id = jel.entry_id
                    WHERE je.status = 'POSTED'
                      AND je.entry_date <= :asOf
                    GROUP BY jel.account_id
                ) agg ON agg.account_id = a.id
                WHERE a.is_active = true
                  AND a.account_type IN ('ASSET', 'LIABILITY', 'EQUITY')
                ORDER BY a.code
                """;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter("asOf", asOf)
                .getResultList();

        List<AccountLineDto> assetLines     = new java.util.ArrayList<>();
        List<AccountLineDto> liabilityLines = new java.util.ArrayList<>();
        List<AccountLineDto> equityLines    = new java.util.ArrayList<>();

        for (Object[] row : rows) {
            String type          = (String) row[5];
            String normalBalance = (String) row[6];
            BigDecimal debit  = toBigDecimal(row[7]);
            BigDecimal credit = toBigDecimal(row[8]);
            BigDecimal bal    = "DEBIT".equals(normalBalance)
                    ? debit.subtract(credit)
                    : credit.subtract(debit);

            AccountLineDto line = AccountLineDto.builder()
                    .code((String) row[0])
                    .nameAr((String) row[1])
                    .nameEn((String) row[2])
                    .level((Integer) row[3])
                    .leaf((Boolean) row[4])
                    .balance(bal)
                    .build();

            switch (type) {
                case "ASSET"     -> assetLines.add(line);
                case "LIABILITY" -> liabilityLines.add(line);
                case "EQUITY"    -> equityLines.add(line);
            }
        }

        BigDecimal totalAssets      = assetLines.stream().filter(AccountLineDto::isLeaf)
                .map(AccountLineDto::getBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalLiabilities = liabilityLines.stream().filter(AccountLineDto::isLeaf)
                .map(AccountLineDto::getBalance).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalEquity      = equityLines.stream().filter(AccountLineDto::isLeaf)
                .map(AccountLineDto::getBalance).reduce(BigDecimal.ZERO, BigDecimal::add);

        return BalanceSheetDto.builder()
                .asOf(asOf)
                .assetLines(assetLines)
                .liabilityLines(liabilityLines)
                .equityLines(equityLines)
                .totalAssets(totalAssets)
                .totalLiabilities(totalLiabilities)
                .totalEquity(totalEquity)
                .totalLiabilitiesAndEquity(totalLiabilities.add(totalEquity))
                .build();
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return BigDecimal.ZERO;
        if (val instanceof BigDecimal bd) return bd;
        return new BigDecimal(val.toString());
    }

    private long toLong(Object val) {
        if (val == null) return 0L;
        if (val instanceof Number n) return n.longValue();
        return Long.parseLong(val.toString());
    }
}
