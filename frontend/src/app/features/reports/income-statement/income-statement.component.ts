import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';
import { ReportService, IncomeStatement } from '../../../core/services/report.service';
import { ExportService } from '../../../core/services/export.service';

@Component({
  selector: 'app-income-statement',
  standalone: true,
  imports: [FormsModule, DecimalPipe, Button, ProgressSpinner],
  template: `
    <div class="page-container" dir="rtl">
      <div class="page-header">
        <h1><i class="pi pi-chart-line"></i> قائمة الدخل</h1>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="field-row">
          <label>من</label>
          <input type="date" [(ngModel)]="from" />
          <label>إلى</label>
          <input type="date" [(ngModel)]="to" />
        </div>
        <div class="quick-btns">
          @for (q of quarters; track q.label) {
            <button class="quick-btn" (click)="applyQuarter(q)">{{ q.label }}</button>
          }
        </div>
        <p-button label="عرض" icon="pi pi-refresh" iconPos="right"
                  (onClick)="load()" [disabled]="loading()" />
        @if (report()) {
          <p-button label="طباعة" icon="pi pi-print" iconPos="right"
                    [outlined]="true" (onClick)="print()" />
          <p-button label="Excel" icon="pi pi-table" iconPos="right"
                    [outlined]="true" (onClick)="exportExcel()" />
        }
      </div>

      @if (loading()) {
        <div class="center">
          <p-progressSpinner strokeWidth="4" [style]="{width:'40px', height:'40px'}" />
        </div>
      } @else if (error()) {
        <div class="error-msg">{{ error() }}</div>
      } @else {
        @if (report(); as r) {

          <div class="net-banner" [class.profit]="r.netIncome >= 0" [class.loss]="r.netIncome < 0">
            <span class="net-label">{{ r.netIncome >= 0 ? 'صافي الربح' : 'صافي الخسارة' }}</span>
            <span class="net-value">{{ r.netIncome | number:'1.2-2' }} ر.س</span>
            <span class="net-period">{{ r.from }} — {{ r.to }}</span>
          </div>

          <div class="two-col printable" id="print-area">

            <!-- Revenue -->
            <div class="section">
              <div class="section-header revenue">
                <i class="pi pi-arrow-up"></i>
                <span>الإيرادات</span>
                <span class="section-total">{{ r.totalRevenue | number:'1.2-2' }} ر.س</span>
              </div>
              <table class="report-table">
                @for (line of r.revenueLines; track line.code) {
                  <tr [class]="'level-' + line.level" [class.leaf]="line.leaf">
                    <td class="code">{{ line.code }}</td>
                    <td class="name">{{ line.nameAr }}</td>
                    <td class="amount">
                      @if (line.balance !== 0) { {{ line.balance | number:'1.2-2' }} }
                    </td>
                  </tr>
                }
              </table>
            </div>

            <!-- Expenses -->
            <div class="section">
              <div class="section-header expense">
                <i class="pi pi-arrow-down"></i>
                <span>المصروفات</span>
                <span class="section-total">{{ r.totalExpenses | number:'1.2-2' }} ر.س</span>
              </div>
              <table class="report-table">
                @for (line of r.expenseLines; track line.code) {
                  <tr [class]="'level-' + line.level" [class.leaf]="line.leaf">
                    <td class="code">{{ line.code }}</td>
                    <td class="name">{{ line.nameAr }}</td>
                    <td class="amount">
                      @if (line.balance !== 0) { {{ line.balance | number:'1.2-2' }} }
                    </td>
                  </tr>
                }
              </table>
            </div>

          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; direction: rtl; }
    .page-header h1 { display: flex; align-items: center; gap: 8px; margin: 0 0 20px; font-size: 1.5rem; font-weight: 800; color: #1a237e; }

    .filter-bar {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      background: white; padding: 16px; border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,.08); margin-bottom: 20px;
    }
    .field-row { display: flex; align-items: center; gap: 8px; }
    .field-row label { font-size: .85rem; color: #546e7a; }
    .field-row input { border: 1px solid #ccc; border-radius: 4px; padding: 6px 10px; font-size: .9rem; }

    .quick-btns { display: flex; gap: 6px; }
    .quick-btn {
      padding: 5px 12px; font-size: .8rem; font-family: 'Cairo', sans-serif;
      border: 1.5px solid #d0d0d0; border-radius: 16px; background: white;
      cursor: pointer; color: #555; transition: all .15s;
    }
    .quick-btn:hover { border-color: #1a237e; color: #1a237e; }

    .net-banner {
      display: flex; align-items: center; gap: 16px;
      border-radius: 10px; padding: 18px 24px; margin-bottom: 20px; font-weight: 700;
    }
    .net-banner.profit { background: #e8f5e9; color: #1b5e20; }
    .net-banner.loss   { background: #ffebee; color: #b71c1c; }
    .net-label { font-size: 1rem; }
    .net-value { font-size: 1.8rem; flex: 1; text-align: center; }
    .net-period { font-size: .85rem; color: #666; font-weight: 400; }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

    .section {
      background: white; border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,.08); overflow: hidden;
    }
    .section-header {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; font-weight: 700; font-size: 1rem;
    }
    .section-header.revenue { background: #e8f5e9; color: #2e7d32; }
    .section-header.expense { background: #fff3e0; color: #e65100; }
    .section-total { margin-right: auto; font-size: 1.05rem; }

    .report-table { width: 100%; border-collapse: collapse; font-size: .88rem; }
    .report-table tr { border-bottom: 1px solid #f5f5f5; }
    .report-table tr:hover { background: #fafafa; }
    .report-table td { padding: 6px 10px; }
    td.code   { color: #999; width: 70px; font-family: monospace; font-size: .8rem; }
    td.amount { text-align: left; font-variant-numeric: tabular-nums; white-space: nowrap; }

    tr.level-1 td.name { font-weight: 700; color: #1a237e; }
    tr.level-2 td.name { font-weight: 600; padding-right: 20px; }
    tr.level-3 td.name { padding-right: 36px; }
    tr.level-4 td.name { padding-right: 52px; }

    .center { display: flex; justify-content: center; padding: 60px; }
    .error-msg { background: #ffebee; color: #c62828; border-radius: 6px; padding: 12px; }

    @media print {
      .filter-bar, .net-banner { display: none; }
      .two-col { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class IncomeStatementComponent implements OnInit {
  private svc = inject(ReportService);
  private exportSvc = inject(ExportService);

  report  = signal<IncomeStatement | null>(null);
  loading = signal(false);
  error   = signal('');

  today = new Date().toISOString().slice(0, 10);
  year  = new Date().getFullYear();
  from  = `${this.year}-01-01`;
  to    = this.today;

  quarters = [
    { label: 'ر1', from: `${this.year}-01-01`, to: `${this.year}-03-31` },
    { label: 'ر2', from: `${this.year}-04-01`, to: `${this.year}-06-30` },
    { label: 'ر3', from: `${this.year}-07-01`, to: `${this.year}-09-30` },
    { label: 'ر4', from: `${this.year}-10-01`, to: `${this.year}-12-31` },
  ];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.svc.incomeStatement(this.from, this.to).subscribe({
      next: r => { this.report.set(r); this.loading.set(false); },
      error: _ => { this.error.set('فشل تحميل قائمة الدخل'); this.loading.set(false); }
    });
  }

  applyQuarter(q: { from: string; to: string }) {
    this.from = q.from;
    this.to   = q.to;
    this.load();
  }

  print() { window.print(); }
  exportExcel() { this.exportSvc.exportIncomeStatement(this.report()!); }
}
