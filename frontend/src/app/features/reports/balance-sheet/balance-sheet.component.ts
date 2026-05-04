import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportService, BalanceSheet } from '../../../core/services/report.service';
import { ExportService } from '../../../core/services/export.service';

@Component({
  selector: 'app-balance-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule,
            MatProgressSpinnerModule, DecimalPipe],
  template: `
    <div class="page-container" dir="rtl">
      <div class="page-header">
        <h1><mat-icon>account_tree</mat-icon> الميزانية العمومية</h1>
      </div>

      <!-- Date picker -->
      <div class="filter-bar">
        <label>بتاريخ</label>
        <input type="date" [(ngModel)]="asOf" />
        <button mat-flat-button color="primary" (click)="load()" [disabled]="loading()">
          <mat-icon>refresh</mat-icon> عرض
        </button>
        @if (report()) {
          <button mat-stroked-button (click)="print()"><mat-icon>print</mat-icon> طباعة</button>
          <button mat-stroked-button (click)="exportExcel()"><mat-icon>table_view</mat-icon> Excel</button>
        }
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else if (error()) {
        <div class="error-msg">{{ error() }}</div>
      } @else {
        @if (report(); as r) {

          <!-- Balance check -->
          @if (balanced(r)) {
            <div class="balanced-badge"><mat-icon>check_circle</mat-icon> الميزانية متوازنة</div>
          } @else {
            <div class="unbalanced-badge"><mat-icon>warning</mat-icon> الميزانية غير متوازنة!</div>
          }

          <div class="bs-grid printable" id="print-area">

            <!-- Left: Assets -->
            <div class="section">
              <div class="section-header assets">
                <mat-icon>savings</mat-icon>
                <span>الأصول</span>
                <span class="section-total">{{ r.totalAssets | number:'1.2-2' }} ر.س</span>
              </div>
              <table class="report-table">
                @for (line of r.assetLines; track line.code) {
                  <tr [class]="'level-' + line.level" [class.leaf]="line.leaf">
                    <td class="code">{{ line.code }}</td>
                    <td class="name">{{ line.nameAr }}</td>
                    <td class="amount">
                      @if (line.balance !== 0) { {{ line.balance | number:'1.2-2' }} }
                    </td>
                  </tr>
                }
                <tr class="subtotal-row">
                  <td colspan="2">إجمالي الأصول</td>
                  <td class="amount">{{ r.totalAssets | number:'1.2-2' }}</td>
                </tr>
              </table>
            </div>

            <!-- Right: Liabilities + Equity -->
            <div class="section">
              <div class="section-header liabilities">
                <mat-icon>account_balance</mat-icon>
                <span>الخصوم</span>
                <span class="section-total">{{ r.totalLiabilities | number:'1.2-2' }} ر.س</span>
              </div>
              <table class="report-table">
                @for (line of r.liabilityLines; track line.code) {
                  <tr [class]="'level-' + line.level" [class.leaf]="line.leaf">
                    <td class="code">{{ line.code }}</td>
                    <td class="name">{{ line.nameAr }}</td>
                    <td class="amount">
                      @if (line.balance !== 0) { {{ line.balance | number:'1.2-2' }} }
                    </td>
                  </tr>
                }
                <tr class="subtotal-row">
                  <td colspan="2">إجمالي الخصوم</td>
                  <td class="amount">{{ r.totalLiabilities | number:'1.2-2' }}</td>
                </tr>
              </table>

              <div class="section-header equity">
                <mat-icon>business_center</mat-icon>
                <span>حقوق الملكية</span>
                <span class="section-total">{{ r.totalEquity | number:'1.2-2' }} ر.س</span>
              </div>
              <table class="report-table">
                @for (line of r.equityLines; track line.code) {
                  <tr [class]="'level-' + line.level" [class.leaf]="line.leaf">
                    <td class="code">{{ line.code }}</td>
                    <td class="name">{{ line.nameAr }}</td>
                    <td class="amount">
                      @if (line.balance !== 0) { {{ line.balance | number:'1.2-2' }} }
                    </td>
                  </tr>
                }
                <tr class="subtotal-row">
                  <td colspan="2">إجمالي حقوق الملكية</td>
                  <td class="amount">{{ r.totalEquity | number:'1.2-2' }}</td>
                </tr>
              </table>

              <div class="grand-total-row">
                <span>إجمالي الخصوم + حقوق الملكية</span>
                <span class="amount">{{ r.totalLiabilitiesAndEquity | number:'1.2-2' }} ر.س</span>
              </div>
            </div>

          </div>

        }
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; direction: rtl; }
    .page-header h1 { display: flex; align-items: center; gap: 8px; }

    .filter-bar { display: flex; align-items: center; gap: 12px;
                  background: white; padding: 16px; border-radius: 8px;
                  box-shadow: 0 1px 4px rgba(0,0,0,.08); margin-bottom: 20px; }
    .filter-bar label { font-size: .85rem; color: #546e7a; }
    .filter-bar input { border: 1px solid #ccc; border-radius: 4px; padding: 6px 10px; font-size: .9rem; }

    .balanced-badge, .unbalanced-badge {
      display: flex; align-items: center; gap: 8px;
      border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; font-weight: 600;
    }
    .balanced-badge   { background: #e8f5e9; color: #1b5e20; }
    .unbalanced-badge { background: #ffebee; color: #b71c1c; }

    .bs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    .section { background: white; border-radius: 8px;
               box-shadow: 0 1px 4px rgba(0,0,0,.08); overflow: hidden;
               margin-bottom: 12px; }
    .section-header { display: flex; align-items: center; gap: 8px;
                      padding: 12px 16px; font-weight: 700; font-size: 1rem; }
    .section-header.assets      { background: #e3f2fd; color: #0d47a1; }
    .section-header.liabilities { background: #fce4ec; color: #880e4f; }
    .section-header.equity      { background: #f3e5f5; color: #4a148c; margin-top: 4px; }
    .section-total { margin-right: auto; font-size: 1.05rem; }

    .report-table { width: 100%; border-collapse: collapse; font-size: .88rem; }
    .report-table tr { border-bottom: 1px solid #f5f5f5; }
    .report-table tr:hover { background: #fafafa; }
    .report-table td { padding: 6px 10px; }
    td.code  { color: #999; width: 70px; font-family: monospace; font-size: .8rem; }
    td.amount { text-align: left; font-variant-numeric: tabular-nums; white-space: nowrap; }

    tr.level-1 td.name { font-weight: 700; color: #1a237e; }
    tr.level-2 td.name { font-weight: 600; padding-right: 20px; }
    tr.level-3 td.name { padding-right: 36px; }
    tr.level-4 td.name { padding-right: 52px; }

    .subtotal-row td { background: #f5f5f5; font-weight: 700; padding: 8px 10px;
                       border-top: 2px solid #e0e0e0; }
    .grand-total-row { display: flex; justify-content: space-between; align-items: center;
                       padding: 12px 16px; background: #1a237e; color: white; font-weight: 700; font-size: 1rem; }
    .grand-total-row .amount { font-size: 1.1rem; }

    .center { display: flex; justify-content: center; padding: 60px; }
    .error-msg { background: #ffebee; color: #c62828; border-radius: 6px; padding: 12px; }

    @media print {
      .filter-bar, .balanced-badge, .unbalanced-badge { display: none; }
    }
  `]
})
export class BalanceSheetComponent implements OnInit {
  private svc = inject(ReportService);
  private exportSvc = inject(ExportService);

  report = signal<BalanceSheet | null>(null);
  loading = signal(false);
  error = signal('');

  asOf = new Date().toISOString().slice(0, 10);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.svc.balanceSheet(this.asOf).subscribe({
      next: r  => { this.report.set(r); this.loading.set(false); },
      error: _  => { this.error.set('فشل تحميل الميزانية'); this.loading.set(false); }
    });
  }

  balanced(r: BalanceSheet): boolean {
    return Math.abs(r.totalAssets - r.totalLiabilitiesAndEquity) < 0.01;
  }

  print() { window.print(); }

  exportExcel() { this.exportSvc.exportBalanceSheet(this.report()!); }
}
