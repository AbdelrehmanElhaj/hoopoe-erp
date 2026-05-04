package com.accounting.modules.reports.controller;

import com.accounting.modules.reports.dto.BalanceSheetDto;
import com.accounting.modules.reports.dto.IncomeStatementDto;
import com.accounting.modules.reports.dto.TrialBalanceLineDto;
import com.accounting.modules.reports.dto.VatReportDto;
import com.accounting.modules.reports.service.ReportService;
import com.accounting.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/trial-balance")
    public ResponseEntity<ApiResponse<List<TrialBalanceLineDto>>> trialBalance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.trialBalance(from, to)));
    }

    @GetMapping("/vat")
    public ResponseEntity<ApiResponse<VatReportDto>> vatReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.vatReport(from, to)));
    }

    @GetMapping("/income-statement")
    public ResponseEntity<ApiResponse<IncomeStatementDto>> incomeStatement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.incomeStatement(from, to)));
    }

    @GetMapping("/balance-sheet")
    public ResponseEntity<ApiResponse<BalanceSheetDto>> balanceSheet(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOf) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.balanceSheet(asOf)));
    }
}
