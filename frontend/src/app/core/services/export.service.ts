import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { TrialBalanceLine, VatReport, BalanceSheet, IncomeStatement, AccountLine } from './report.service';

@Injectable({ providedIn: 'root' })
export class ExportService {

  exportTrialBalance(lines: TrialBalanceLine[], from: string, to: string): void {
    const typeMap: Record<string, string> = {
      ASSET: 'أصول', LIABILITY: 'خصوم', EQUITY: 'حقوق ملكية',
      REVENUE: 'إيرادات', EXPENSE: 'مصروفات'
    };
    const rows = lines.map(l => ({
      'رمز الحساب': l.code,
      'اسم الحساب': l.nameAr,
      'النوع': typeMap[l.accountType] ?? l.accountType,
      'المستوى': l.level,
      'المدين': l.debitTotal || '',
      'الدائن': l.creditTotal || '',
      'الرصيد': l.balance || '',
    }));

    const leafLines = lines.filter(l => l.leaf);
    rows.push({
      'رمز الحساب': '',
      'اسم الحساب': 'الإجمالي',
      'النوع': '',
      'المستوى': '' as any,
      'المدين': leafLines.reduce((s, l) => s + l.debitTotal, 0),
      'الدائن': leafLines.reduce((s, l) => s + l.creditTotal, 0),
      'الرصيد': '' as any,
    });

    this.download(rows, `ميزان-المراجعة-${from}-${to}`);
  }

  exportVatReport(r: VatReport): void {
    const rows = [
      { 'البيان': 'المبيعات الخاضعة للضريبة القياسية',   'المبلغ (ر.س)': r.standardRatedSales },
      { 'البيان': 'ضريبة المخرجات القياسية',              'المبلغ (ر.س)': r.standardRatedVat },
      { 'البيان': 'المبيعات صفرية الضريبة',               'المبلغ (ر.س)': r.zeroRatedSales },
      { 'البيان': 'المبيعات المعفاة',                     'المبلغ (ر.س)': r.exemptSales },
      { 'البيان': 'مبيعات الإشعارات الدائنة',             'المبلغ (ر.س)': r.creditNotesSales },
      { 'البيان': 'ضريبة الإشعارات الدائنة',              'المبلغ (ر.س)': r.creditNotesVat },
      { 'البيان': 'إجمالي ضريبة المخرجات',                'المبلغ (ر.س)': r.totalOutputVat },
      { 'البيان': 'ضريبة المدخلات',                       'المبلغ (ر.س)': r.inputVat },
      { 'البيان': 'صافي الضريبة المستحقة',                'المبلغ (ر.س)': r.netVatPayable },
      { 'البيان': 'عدد الفواتير الضريبية',                'المبلغ (ر.س)': r.standardInvoiceCount },
      { 'البيان': 'عدد الفواتير المبسطة',                 'المبلغ (ر.س)': r.simplifiedInvoiceCount },
    ];
    this.download(rows, `تقرير-الضريبة-${r.from}-${r.to}`);
  }

  exportBalanceSheet(r: BalanceSheet): void {
    const toRow = (l: AccountLine, section: string) => ({
      'القسم': section,
      'رمز الحساب': l.code,
      'اسم الحساب': l.nameAr,
      'المستوى': l.level,
      'الرصيد (ر.س)': l.balance || '',
    });

    const rows = [
      ...r.assetLines.map(l => toRow(l, 'الأصول')),
      { 'القسم': 'الأصول', 'رمز الحساب': '', 'اسم الحساب': 'إجمالي الأصول', 'المستوى': '' as any, 'الرصيد (ر.س)': r.totalAssets },
      ...r.liabilityLines.map(l => toRow(l, 'الخصوم')),
      { 'القسم': 'الخصوم', 'رمز الحساب': '', 'اسم الحساب': 'إجمالي الخصوم', 'المستوى': '' as any, 'الرصيد (ر.س)': r.totalLiabilities },
      ...r.equityLines.map(l => toRow(l, 'حقوق الملكية')),
      { 'القسم': 'حقوق الملكية', 'رمز الحساب': '', 'اسم الحساب': 'إجمالي حقوق الملكية', 'المستوى': '' as any, 'الرصيد (ر.س)': r.totalEquity },
      { 'القسم': '', 'رمز الحساب': '', 'اسم الحساب': 'إجمالي الخصوم + حقوق الملكية', 'المستوى': '' as any, 'الرصيد (ر.س)': r.totalLiabilitiesAndEquity },
    ];

    this.download(rows, `الميزانية-العمومية-${r.asOf}`);
  }

  exportIncomeStatement(r: IncomeStatement): void {
    const toRow = (l: AccountLine, section: string) => ({
      'القسم': section,
      'رمز الحساب': l.code,
      'اسم الحساب': l.nameAr,
      'المستوى': l.level,
      'المبلغ (ر.س)': l.balance || '',
    });

    const rows = [
      ...r.revenueLines.map(l => toRow(l, 'الإيرادات')),
      { 'القسم': 'الإيرادات', 'رمز الحساب': '', 'اسم الحساب': 'إجمالي الإيرادات', 'المستوى': '' as any, 'المبلغ (ر.س)': r.totalRevenue },
      ...r.expenseLines.map(l => toRow(l, 'المصروفات')),
      { 'القسم': 'المصروفات', 'رمز الحساب': '', 'اسم الحساب': 'إجمالي المصروفات', 'المستوى': '' as any, 'المبلغ (ر.س)': r.totalExpenses },
      { 'القسم': '', 'رمز الحساب': '', 'اسم الحساب': r.netIncome >= 0 ? 'صافي الربح' : 'صافي الخسارة', 'المستوى': '' as any, 'المبلغ (ر.س)': r.netIncome },
    ];

    this.download(rows, `قائمة-الدخل-${r.from}-${r.to}`);
  }

  private download(rows: Record<string, any>[], filename: string): void {
    const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
    ws['!dir'] = 'rtl';
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
}
