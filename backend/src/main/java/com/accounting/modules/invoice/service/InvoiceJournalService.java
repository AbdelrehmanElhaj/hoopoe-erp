package com.accounting.modules.invoice.service;

import com.accounting.modules.accounts.entity.Account;
import com.accounting.modules.accounts.repository.AccountRepository;
import com.accounting.modules.invoice.entity.Invoice;
import com.accounting.modules.journal.entity.JournalEntry;
import com.accounting.modules.journal.entity.JournalEntryLine;
import com.accounting.modules.journal.repository.JournalEntryRepository;
import com.accounting.shared.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.time.ZoneId;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceJournalService {

    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalRepository;

    private static final String CASH_ACCOUNT    = "1101";
    private static final String AR_ACCOUNT      = "1102";
    private static final String VAT_OUT_ACCOUNT = "2102";
    private static final String SALES_ACCOUNT   = "410101";

    @Transactional
    public JournalEntry createForInvoice(Invoice invoice) {
        boolean isStandard = invoice.getInvoiceType() == Invoice.InvoiceType.STANDARD;

        Account debitAccount  = findAccount(isStandard ? AR_ACCOUNT : CASH_ACCOUNT);
        Account salesAccount  = findAccount(SALES_ACCOUNT);
        Account vatOutAccount = findAccount(VAT_OUT_ACCOUNT);

        LocalDate entryDate = invoice.getIssueDatetime()
                .atZone(ZoneId.of("Asia/Riyadh"))
                .toLocalDate();

        JournalEntry entry = JournalEntry.builder()
                .entryNumber(generateEntryNumber())
                .entryDate(entryDate)
                .description("قيد فاتورة رقم " + invoice.getInvoiceNumber())
                .reference(invoice.getInvoiceNumber())
                .sourceType("INVOICE")
                .sourceId(invoice.getUuid())
                .status(JournalEntry.EntryStatus.POSTED)
                .postedAt(Instant.now())
                .build();

        int lineNum = 1;

        // Debit: AR (standard) or Cash (simplified) — full amount including VAT
        String debitDesc = isStandard
                ? "ذمة عميل - " + (invoice.getBuyerName() != null ? invoice.getBuyerName() : invoice.getInvoiceNumber())
                : "مبيعات نقدية - " + invoice.getInvoiceNumber();

        entry.getLines().add(JournalEntryLine.builder()
                .entry(entry).lineNumber(lineNum++)
                .account(debitAccount)
                .debit(invoice.getTotalAmount()).credit(BigDecimal.ZERO)
                .description(debitDesc)
                .build());

        // Credit: Sales/Revenue — taxable amount (net of discount)
        entry.getLines().add(JournalEntryLine.builder()
                .entry(entry).lineNumber(lineNum++)
                .account(salesAccount)
                .debit(BigDecimal.ZERO).credit(invoice.getTaxableAmount())
                .description("إيراد - " + invoice.getInvoiceNumber())
                .build());

        // Credit: Output VAT — only when VAT > 0 (zero-rated invoices skip this line)
        if (invoice.getVatAmount().compareTo(BigDecimal.ZERO) > 0) {
            entry.getLines().add(JournalEntryLine.builder()
                    .entry(entry).lineNumber(lineNum)
                    .account(vatOutAccount)
                    .debit(BigDecimal.ZERO).credit(invoice.getVatAmount())
                    .description("ضريبة القيمة المضافة - " + invoice.getInvoiceNumber())
                    .build());
        }

        JournalEntry saved = journalRepository.save(entry);
        log.info("Auto-journal {} posted for invoice {}", saved.getEntryNumber(), invoice.getInvoiceNumber());
        return saved;
    }

    private Account findAccount(String code) {
        return accountRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(
                        "الحساب المطلوب غير موجود: " + code + " — تحقق من دليل الحسابات"));
    }

    private String generateEntryNumber() {
        int year = Year.now().getValue();
        long count = journalRepository.countByCurrentYear(year) + 1;
        return String.format("JE-%d-%06d", year, count);
    }
}
