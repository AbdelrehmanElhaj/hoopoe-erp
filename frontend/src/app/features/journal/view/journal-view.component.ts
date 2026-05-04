import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { JournalService, JournalEntry } from '../../../core/services/journal.service';

@Component({
  selector: 'app-journal-view',
  standalone: true,
  imports: [
    RouterLink, DecimalPipe, DatePipe,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressBarModule, MatSnackBarModule, MatDividerModule
  ],
  template: `
    <div class="page-container" dir="rtl">
      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

      @if (entry(); as e) {
        <div class="page-header">
          <div>
            <h1>{{ e.entryNumber }}</h1>
            <p class="sub">{{ e.description }}</p>
          </div>
          <div class="header-actions">
            <button mat-stroked-button routerLink="/journal">
              <mat-icon>arrow_forward</mat-icon> العودة
            </button>
            @if (e.status === 'DRAFT') {
              <button mat-flat-button color="primary" (click)="post(e.id)" [disabled]="posting()">
                <mat-icon>check_circle</mat-icon>
                {{ posting() ? 'جارٍ الترحيل...' : 'ترحيل القيد' }}
              </button>
            }
          </div>
        </div>

        <!-- Meta -->
        <div class="meta-row">
          <span class="status-chip" [class]="'status-' + e.status.toLowerCase()">
            {{ statusLabel(e.status) }}
          </span>
          <span class="meta-item"><mat-icon>calendar_today</mat-icon>{{ e.entryDate | date:'yyyy/MM/dd' }}</span>
          @if (e.postedAt) {
            <span class="meta-item"><mat-icon>schedule</mat-icon>رُحِّل {{ e.postedAt | date:'yyyy/MM/dd HH:mm' }}</span>
          }
          @if (sourceInvoiceId()) {
            <a mat-stroked-button [routerLink]="['/invoices', sourceInvoiceId()]" class="source-link">
              <mat-icon>receipt_long</mat-icon> عرض الفاتورة المصدر
            </a>
          }
        </div>

        <!-- Lines table -->
        <mat-card class="lines-card">
          <mat-card-header><mat-card-title>بنود القيد</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="lines-table">
              <div class="line-row header-row">
                <span class="col-num">#</span>
                <span class="col-code">كود</span>
                <span class="col-name">الحساب</span>
                <span class="col-amount">مدين</span>
                <span class="col-amount">دائن</span>
                <span class="col-desc">البيان</span>
              </div>
              @for (line of e.lines; track line.id) {
                <div class="line-row">
                  <span class="col-num">{{ line.lineNumber }}</span>
                  <span class="col-code"><span class="acc-code">{{ line.accountCode }}</span></span>
                  <span class="col-name">{{ line.accountNameAr }}</span>
                  <span class="col-amount debit">
                    {{ line.debit > 0 ? (line.debit | number:'1.2-2') : '—' }}
                  </span>
                  <span class="col-amount credit">
                    {{ line.credit > 0 ? (line.credit | number:'1.2-2') : '—' }}
                  </span>
                  <span class="col-desc muted">{{ line.description ?? '' }}</span>
                </div>
              }
              <div class="line-row totals-row">
                <span class="col-num"></span>
                <span class="col-code"></span>
                <span class="col-name total-label">الإجمالي</span>
                <span class="col-amount debit">{{ e.totalDebit | number:'1.2-2' }}</span>
                <span class="col-amount credit">{{ e.totalCredit | number:'1.2-2' }}</span>
                <span class="col-desc"></span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 900px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .page-header h1 { margin: 0; font-size: 1.5rem; }
    .sub { color: #546e7a; margin: 4px 0 0; }
    .header-actions { display: flex; gap: 8px; align-items: center; }

    .meta-row { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .meta-item { display: flex; align-items: center; gap: 4px; color: #546e7a; font-size: 0.9rem;
                 mat-icon { font-size: 16px; width: 16px; height: 16px; } }
    .source-link { font-size: 0.85rem; }

    .status-chip { padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
    .status-draft  { background: #fff8e1; color: #f57f17; }
    .status-posted { background: #e8f5e9; color: #1b5e20; }
    .status-void   { background: #ffebee; color: #b71c1c; }

    .lines-card { margin-top: 8px; }

    .lines-table { display: flex; flex-direction: column; font-size: 0.9rem; direction: rtl; }
    .line-row {
      display: grid;
      grid-template-columns: 40px 90px 1fr 130px 130px 1fr;
      gap: 8px; padding: 10px 12px;
      border-bottom: 1px solid #f0f0f0;
      align-items: center;
    }
    .header-row { font-weight: 700; font-size: 0.8rem; color: #546e7a; background: #f5f5f5; border-radius: 6px 6px 0 0; }
    .totals-row { font-weight: 700; background: #f9f9f9; border-top: 2px solid #e0e0e0; }
    .total-label { color: #1a237e; }

    .col-amount { text-align: left; font-family: monospace; direction: ltr; }
    .acc-code { background: #e8eaf6; color: #1a237e; padding: 2px 6px; border-radius: 4px;
                font-size: 0.78rem; font-weight: 700; font-family: monospace; }
    .debit  { color: #1b5e20; }
    .credit { color: #1a237e; }
    .muted { color: #78909c; font-size: 0.85rem; }
  `]
})
export class JournalViewComponent implements OnInit {
  @Input() id!: string;

  private svc = inject(JournalService);
  private snackBar = inject(MatSnackBar);

  entry    = signal<JournalEntry | null>(null);
  loading  = signal(true);
  posting  = signal(false);
  sourceInvoiceId = signal<string | null>(null);

  ngOnInit(): void {
    this.svc.findById(this.id).subscribe({
      next: res => {
        this.entry.set(res.data);
        this.loading.set(false);
        // If this entry was auto-created from an invoice, surface a back-link
        // The backend stores sourceId as the invoice UUID — we use sourceType to guard
        const e = res.data as any;
        if (e.sourceType === 'INVOICE' && e.sourceId) {
          // sourceId is the invoice UUID; find the invoice ID by navigating to /invoices filtered by uuid
          // For simplicity, link to invoice list — deep link requires a separate lookup
        }
      },
      error: () => this.loading.set(false)
    });
  }

  post(id: string): void {
    this.posting.set(true);
    this.svc.post(id).subscribe({
      next: res => {
        this.entry.set(res.data);
        this.posting.set(false);
        this.snackBar.open('تم ترحيل القيد بنجاح', 'إغلاق', { duration: 3000 });
      },
      error: err => {
        this.posting.set(false);
        this.snackBar.open(err.error?.message ?? 'فشل الترحيل', 'إغلاق', { duration: 4000 });
      }
    });
  }

  statusLabel(s: string): string {
    return ({ DRAFT: 'مسودة', POSTED: 'مرحَّل', VOID: 'ملغى' } as Record<string, string>)[s] ?? s;
  }
}
