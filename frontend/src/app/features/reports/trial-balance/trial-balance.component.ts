import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { ReportService, TrialBalanceLine } from '../../../core/services/report.service';
import { ExportService } from '../../../core/services/export.service';

@Component({
  selector: 'app-trial-balance',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule,
            MatProgressSpinnerModule, MatSelectModule, RouterLink],
  template: `
    <div class="page-container" dir="rtl">
      <div class="page-header">
        <div class="header-row">
          <button mat-icon-button routerLink="/reports"><mat-icon>arrow_forward</mat-icon></button>
          <h1>ميزان المراجعة</h1>
        </div>

        <div class="filters">
          <label>من
            <input type="date" [(ngModel)]="from" />
          </label>
          <label>إلى
            <input type="date" [(ngModel)]="to" />
          </label>
          <mat-select [(ngModel)]="typeFilter" style="width:160px">
            <mat-option value="">كل أنواع الحسابات</mat-option>
            <mat-option value="ASSET">الأصول</mat-option>
            <mat-option value="LIABILITY">الخصوم</mat-option>
            <mat-option value="EQUITY">حقوق الملكية</mat-option>
            <mat-option value="REVENUE">الإيرادات</mat-option>
            <mat-option value="EXPENSE">المصروفات</mat-option>
          </mat-select>
          <button mat-flat-button color="primary" (click)="load()" [disabled]="loading()">
            <mat-icon>search</mat-icon> عرض
          </button>
          <button mat-stroked-button (click)="print()">
            <mat-icon>print</mat-icon> طباعة
          </button>
          @if (lines().length) {
            <button mat-stroked-button (click)="exportExcel()">
              <mat-icon>table_view</mat-icon> Excel
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else if (lines().length) {
        <div class="report-summary">
          <div class="summary-card">
            <span>إجمالي المدين</span>
            <strong>{{ totals().debit | number:'1.2-2' }} ر.س</strong>
          </div>
          <div class="summary-card">
            <span>إجمالي الدائن</span>
            <strong>{{ totals().credit | number:'1.2-2' }} ر.س</strong>
          </div>
          <div class="summary-card" [class.balanced]="totals().diff === 0">
            <span>الفرق</span>
            <strong>{{ totals().diff | number:'1.2-2' }} ر.س</strong>
          </div>
        </div>

        <div class="table-wrapper" id="printable">
          <table class="report-table">
            <thead>
              <tr>
                <th>رمز الحساب</th>
                <th>اسم الحساب</th>
                <th>النوع</th>
                <th>المستوى</th>
                <th class="num">المدين</th>
                <th class="num">الدائن</th>
                <th class="num">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              @for (line of filtered(); track line.id) {
                <tr [class]="'level-' + line.level" [class.leaf]="line.leaf">
                  <td class="code">{{ line.code }}</td>
                  <td class="name">{{ line.nameAr }}</td>
                  <td>{{ typeLabel(line.accountType) }}</td>
                  <td class="center">{{ line.level }}</td>
                  <td class="num">{{ line.debitTotal > 0 ? (line.debitTotal | number:'1.2-2') : '' }}</td>
                  <td class="num">{{ line.creditTotal > 0 ? (line.creditTotal | number:'1.2-2') : '' }}</td>
                  <td class="num" [class.debit-bal]="line.balance > 0" [class.credit-bal]="line.balance < 0">
                    {{ line.balance !== 0 ? (line.balance | number:'1.2-2') : '' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (loaded()) {
        <div class="empty">لا توجد حركات في هذه الفترة</div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; direction: rtl; }
    .header-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    h1 { margin: 0; font-size: 1.4rem; }
    .filters { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
    .filters label { display: flex; align-items: center; gap: 6px; font-size: .9rem; }
    .filters input[type=date] { border: 1px solid #ccc; border-radius: 4px; padding: 6px 10px; font-size: .9rem; }
    .report-summary { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .summary-card { background: #f5f5f5; border-radius: 8px; padding: 12px 20px; flex: 1; min-width: 160px; }
    .summary-card span { display: block; font-size: .8rem; color: #666; margin-bottom: 4px; }
    .summary-card strong { font-size: 1.1rem; color: #1a237e; }
    .summary-card.balanced strong { color: #2e7d32; }
    .table-wrapper { overflow-x: auto; }
    .report-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
    .report-table th { background: #1a237e; color: #fff; padding: 10px 12px; text-align: right; white-space: nowrap; }
    .report-table td { padding: 7px 12px; border-bottom: 1px solid #eee; }
    .report-table tr:hover td { background: #f9f9f9; }
    .level-1 td { font-weight: 700; background: #e8eaf6; }
    .level-2 td { font-weight: 600; background: #f3f4ff; }
    .level-3 td { padding-right: 24px; }
    .level-4 td, .level-5 td { padding-right: 40px; }
    td.code { font-family: monospace; white-space: nowrap; }
    td.num, th.num { text-align: left; font-variant-numeric: tabular-nums; }
    td.center { text-align: center; }
    .debit-bal { color: #1565c0; font-weight: 600; }
    .credit-bal { color: #c62828; font-weight: 600; }
    .center { display: flex; justify-content: center; padding: 40px; }
    .error { color: #c62828; padding: 20px; }
    .empty { color: #666; padding: 40px; text-align: center; }
    @media print {
      .page-header .filters, button { display: none !important; }
      .report-table { font-size: .8rem; }
    }
  `]
})
export class TrialBalanceComponent {
  private svc = inject(ReportService);
  private exportSvc = inject(ExportService);

  from = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  to   = new Date().toISOString().split('T')[0];
  typeFilter = '';

  lines  = signal<TrialBalanceLine[]>([]);
  loading = signal(false);
  loaded  = signal(false);
  error   = signal('');

  filtered = computed(() =>
    this.typeFilter
      ? this.lines().filter(l => l.accountType === this.typeFilter)
      : this.lines()
  );

  totals = computed(() => {
    const list = this.filtered();
    const debit  = list.filter(l => l.leaf).reduce((s, l) => s + l.debitTotal,  0);
    const credit = list.filter(l => l.leaf).reduce((s, l) => s + l.creditTotal, 0);
    return { debit, credit, diff: Math.abs(debit - credit) };
  });

  load() {
    this.loading.set(true);
    this.error.set('');
    this.svc.trialBalance(this.from, this.to).subscribe({
      next: data => { this.lines.set(data); this.loaded.set(true); this.loading.set(false); },
      error: err  => { this.error.set('حدث خطأ أثناء تحميل التقرير'); this.loading.set(false); }
    });
  }

  print() { window.print(); }

  exportExcel() { this.exportSvc.exportTrialBalance(this.filtered(), this.from, this.to); }

  typeLabel(t: string) {
    const map: Record<string, string> = {
      ASSET: 'أصول', LIABILITY: 'خصوم', EQUITY: 'حقوق ملكية',
      REVENUE: 'إيرادات', EXPENSE: 'مصروفات'
    };
    return map[t] ?? t;
  }
}
