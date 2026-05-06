import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';
import { ReportService, VatReport } from '../../../core/services/report.service';
import { ExportService } from '../../../core/services/export.service';

@Component({
  selector: 'app-vat-report',
  standalone: true,
  imports: [FormsModule, DecimalPipe, RouterLink, Button, ProgressSpinner],
  template: `
    <div class="page-container" dir="rtl">
      <div class="page-header">
        <div class="header-row">
          <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" routerLink="/reports" />
          <h1>تقرير ضريبة القيمة المضافة</h1>
        </div>

        <div class="filters">
          <label>من <input type="date" [(ngModel)]="from" /></label>
          <label>إلى <input type="date" [(ngModel)]="to" /></label>
          <p-button label="عرض" icon="pi pi-search" iconPos="right"
                    (onClick)="load()" [disabled]="loading()" />
          <p-button label="طباعة" icon="pi pi-print" iconPos="right"
                    [outlined]="true" (onClick)="print()" />
          @if (report()) {
            <p-button label="Excel" icon="pi pi-table" iconPos="right"
                      [outlined]="true" (onClick)="exportExcel()" />
          }
        </div>

        <div class="shortcuts">
          <span>فترة سريعة:</span>
          @for (q of quarters; track q.label) {
            <button class="quick-btn" (click)="setQuarter(q)">{{ q.label }}</button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="center">
          <p-progressSpinner strokeWidth="4" [style]="{width:'40px', height:'40px'}" />
        </div>
      } @else if (error()) {
        <div class="error">{{ error() }}</div>
      } @else if (report()) {
        <div class="report" id="printable">
          <div class="report-title">
            <h2>إقرار ضريبة القيمة المضافة</h2>
            <span>الفترة: {{ report()!.from }} إلى {{ report()!.to }}</span>
          </div>

          <!-- Output VAT -->
          <div class="section">
            <h3 class="section-header output">الضريبة على المبيعات (ضريبة المخرجات)</h3>
            <table class="vat-table">
              <thead>
                <tr><th>البيان</th><th class="num">المبلغ الخاضع للضريبة (ر.س)</th><th class="num">الضريبة (ر.س)</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>المبيعات الخاضعة للضريبة (15%)</td>
                  <td class="num">{{ report()!.standardRatedSales | number:'1.2-2' }}</td>
                  <td class="num">{{ report()!.standardRatedVat | number:'1.2-2' }}</td>
                </tr>
                <tr>
                  <td>المبيعات الصفرية</td>
                  <td class="num">{{ report()!.zeroRatedSales | number:'1.2-2' }}</td>
                  <td class="num">—</td>
                </tr>
                <tr>
                  <td>المبيعات المعفاة</td>
                  <td class="num">{{ report()!.exemptSales | number:'1.2-2' }}</td>
                  <td class="num">—</td>
                </tr>
                @if (report()!.creditNotesSales > 0) {
                  <tr class="credit-note-row">
                    <td>إشعارات الدائن (خصم)</td>
                    <td class="num">({{ report()!.creditNotesSales | number:'1.2-2' }})</td>
                    <td class="num">({{ report()!.creditNotesVat | number:'1.2-2' }})</td>
                  </tr>
                }
                <tr class="total-row">
                  <td><strong>إجمالي ضريبة المخرجات</strong></td>
                  <td class="num"></td>
                  <td class="num"><strong>{{ report()!.totalOutputVat | number:'1.2-2' }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Input VAT -->
          <div class="section">
            <h3 class="section-header input">الضريبة على المشتريات (ضريبة المدخلات)</h3>
            <table class="vat-table">
              <thead>
                <tr><th>البيان</th><th class="num">الضريبة (ر.س)</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>ضريبة المدخلات القابلة للاسترداد</td>
                  <td class="num">{{ report()!.inputVat | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Net VAT -->
          <div class="net-vat" [class.payable]="report()!.netVatPayable >= 0"
               [class.refund]="report()!.netVatPayable < 0">
            <span>{{ report()!.netVatPayable >= 0 ? 'صافي الضريبة المستحقة السداد' : 'ضريبة مستردة' }}</span>
            <strong>{{ (report()!.netVatPayable < 0 ? -report()!.netVatPayable : report()!.netVatPayable) | number:'1.2-2' }} ر.س</strong>
          </div>

          <!-- Invoice stats -->
          <div class="invoice-stats">
            <div class="stat">
              <span>فواتير ضريبية (B2B)</span>
              <strong>{{ report()!.standardInvoiceCount }}</strong>
            </div>
            <div class="stat">
              <span>فواتير مبسطة (B2C)</span>
              <strong>{{ report()!.simplifiedInvoiceCount }}</strong>
            </div>
            <div class="stat">
              <span>إجمالي الفواتير</span>
              <strong>{{ report()!.standardInvoiceCount + report()!.simplifiedInvoiceCount }}</strong>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; direction: rtl; }
    .header-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    h1 { margin: 0; font-size: 1.4rem; font-weight: 800; color: #1a237e; }

    .filters {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;
    }
    .filters label { display: flex; align-items: center; gap: 6px; font-size: .9rem; color: #546e7a; }
    .filters input[type=date] { border: 1px solid #ccc; border-radius: 4px; padding: 6px 10px; font-size: .9rem; }

    .shortcuts {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      margin-bottom: 20px; font-size: .9rem;
    }
    .shortcuts span { color: #666; }
    .quick-btn {
      padding: 5px 12px; font-size: .8rem; font-family: 'Cairo', sans-serif;
      border: 1.5px solid #d0d0d0; border-radius: 16px; background: white;
      cursor: pointer; color: #555; transition: all .15s;
    }
    .quick-btn:hover { border-color: #1a237e; color: #1a237e; }

    .report { max-width: 800px; }
    .report-title { text-align: center; margin-bottom: 24px; }
    .report-title h2 { margin: 0 0 4px; }
    .report-title span { color: #666; font-size: .9rem; }

    .section { margin-bottom: 24px; }
    .section-header { padding: 10px 14px; border-radius: 6px 6px 0 0; margin: 0; font-size: 1rem; }
    .section-header.output { background: #e8eaf6; color: #1a237e; }
    .section-header.input  { background: #e8f5e9; color: #1b5e20; }

    .vat-table { width: 100%; border-collapse: collapse; }
    .vat-table th { background: #f5f5f5; padding: 9px 14px; text-align: right; font-size: .9rem; border: 1px solid #ddd; }
    .vat-table td { padding: 9px 14px; border: 1px solid #eee; font-size: .9rem; }
    th.num, td.num { text-align: left; font-variant-numeric: tabular-nums; }
    .total-row td { background: #fafafa; border-top: 2px solid #ccc; }
    .credit-note-row td { color: #c62828; }

    .net-vat {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 20px; border-radius: 8px; margin-bottom: 20px; font-size: 1.1rem;
    }
    .net-vat.payable { background: #fff3e0; }
    .net-vat.refund  { background: #e8f5e9; }
    .net-vat strong  { font-size: 1.4rem; }

    .invoice-stats { display: flex; gap: 16px; flex-wrap: wrap; }
    .stat { background: #f5f5f5; border-radius: 8px; padding: 12px 20px; flex: 1; min-width: 140px; }
    .stat span   { display: block; font-size: .8rem; color: #666; margin-bottom: 4px; }
    .stat strong { font-size: 1.3rem; color: #1a237e; }

    .center { display: flex; justify-content: center; padding: 40px; }
    .error  { color: #c62828; padding: 20px; }

    @media print { .page-header button, .filters, .shortcuts { display: none !important; } }
  `]
})
export class VatReportComponent {
  private svc = inject(ReportService);
  private exportSvc = inject(ExportService);

  from = new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().split('T')[0];
  to   = new Date().toISOString().split('T')[0];

  report  = signal<VatReport | null>(null);
  loading = signal(false);
  error   = signal('');

  quarters = this.buildQuarters();

  load() {
    this.loading.set(true);
    this.error.set('');
    this.svc.vatReport(this.from, this.to).subscribe({
      next: data => { this.report.set(data); this.loading.set(false); },
      error: _   => { this.error.set('حدث خطأ أثناء تحميل التقرير'); this.loading.set(false); }
    });
  }

  setQuarter(q: { from: string; to: string }) {
    this.from = q.from;
    this.to   = q.to;
    this.load();
  }

  print() { window.print(); }
  exportExcel() { this.exportSvc.exportVatReport(this.report()!); }

  private buildQuarters() {
    const yr = new Date().getFullYear();
    return [
      { label: `ر1 ${yr}`, from: `${yr}-01-01`, to: `${yr}-03-31` },
      { label: `ر2 ${yr}`, from: `${yr}-04-01`, to: `${yr}-06-30` },
      { label: `ر3 ${yr}`, from: `${yr}-07-01`, to: `${yr}-09-30` },
      { label: `ر4 ${yr}`, from: `${yr}-10-01`, to: `${yr}-12-31` },
    ];
  }
}
