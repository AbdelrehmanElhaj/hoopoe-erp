import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { DecimalPipe, DatePipe } from '@angular/common';
import { InvoiceService, Invoice } from '../../../core/services/invoice.service';

@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressBarModule, MatSnackBarModule,
    MatTableModule, DecimalPipe, DatePipe
  ],
  template: `
    <div class="page-container">
      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

      @if (invoice(); as inv) {
        <div class="page-header">
          <div>
            <h1>{{ inv.invoiceNumber }}</h1>
            <div class="badges">
              <span class="status-chip" [class]="'status-' + inv.status.toLowerCase()">
                {{ statusLabel(inv.status) }}
              </span>
              <span class="status-chip" [class]="'zatca-' + inv.zatcaStatus.toLowerCase().replace('_','-')">
                ZATCA: {{ zatcaLabel(inv.zatcaStatus) }}
              </span>
            </div>
          </div>
          <div class="header-actions">
            <button mat-stroked-button routerLink="/invoices">
              <mat-icon>arrow_forward</mat-icon> العودة
            </button>
            <button mat-stroked-button (click)="downloadPdf(inv.id, inv.invoiceNumber)" [disabled]="downloadingPdf()">
              <mat-icon>picture_as_pdf</mat-icon>
              {{ downloadingPdf() ? '...' : 'تحميل PDF' }}
            </button>
            @if (inv.status === 'DRAFT') {
              <button mat-flat-button color="primary" (click)="confirm(inv.id)" [disabled]="confirming()">
                <mat-icon>check_circle</mat-icon>
                {{ confirming() ? 'جارٍ التأكيد...' : 'تأكيد وإرسال ZATCA' }}
              </button>
            }
          </div>
        </div>

        <!-- Summary cards -->
        <div class="summary-grid">
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-label">الإجمالي شامل الضريبة</div>
              <div class="summary-value primary">{{ inv.totalAmount | number:'1.2-2' }} ر.س</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-label">ضريبة القيمة المضافة</div>
              <div class="summary-value">{{ inv.vatAmount | number:'1.2-2' }} ر.س</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-label">تاريخ الإصدار</div>
              <div class="summary-value">{{ inv.issueDatetime | date:'yyyy/MM/dd HH:mm' }}</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="summary-card">
            <mat-card-content>
              <div class="summary-label">نوع الفاتورة</div>
              <div class="summary-value">{{ inv.invoiceType === 'STANDARD' ? 'ضريبية' : 'مبسّطة' }}</div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Parties -->
        <div class="parties-grid">
          <mat-card>
            <mat-card-header><mat-card-title>البائع</mat-card-title></mat-card-header>
            <mat-card-content>
              <p><strong>{{ inv.sellerNameAr }}</strong></p>
              <p>الرقم الضريبي: <span dir="ltr">{{ inv.sellerVatNumber }}</span></p>
            </mat-card-content>
          </mat-card>
          <mat-card>
            <mat-card-header><mat-card-title>المشتري</mat-card-title></mat-card-header>
            <mat-card-content>
              <p><strong>{{ inv.buyerName || '—' }}</strong></p>
              @if (inv.buyerVatNumber) {
                <p>الرقم الضريبي: <span dir="ltr">{{ inv.buyerVatNumber }}</span></p>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Items table -->
        <mat-card>
          <mat-card-header><mat-card-title>بنود الفاتورة</mat-card-title></mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="inv.items">
              <ng-container matColumnDef="line">
                <th mat-header-cell *matHeaderCellDef>#</th>
                <td mat-cell *matCellDef="let i">{{ i.lineNumber }}</td>
              </ng-container>
              <ng-container matColumnDef="desc">
                <th mat-header-cell *matHeaderCellDef>الوصف</th>
                <td mat-cell *matCellDef="let i">{{ i.descriptionAr }}</td>
              </ng-container>
              <ng-container matColumnDef="qty">
                <th mat-header-cell *matHeaderCellDef>الكمية</th>
                <td mat-cell *matCellDef="let i"><span class="amount">{{ i.quantity | number:'1.0-4' }}</span></td>
              </ng-container>
              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>السعر</th>
                <td mat-cell *matCellDef="let i"><span class="amount">{{ i.unitPrice | number:'1.2-2' }}</span></td>
              </ng-container>
              <ng-container matColumnDef="tax">
                <th mat-header-cell *matHeaderCellDef>الضريبة</th>
                <td mat-cell *matCellDef="let i"><span class="amount">{{ i.vatAmount | number:'1.2-2' }}</span></td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>الإجمالي</th>
                <td mat-cell *matCellDef="let i"><strong class="amount">{{ i.totalAmount | number:'1.2-2' }}</strong></td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="itemCols"></tr>
              <tr mat-row *matRowDef="let row; columns: itemCols;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Accounting Journal Entry -->
        @if (inv.journalEntryId) {
          <mat-card class="journal-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="journal-icon">menu_book</mat-icon>
              <mat-card-title>القيد المحاسبي</mat-card-title>
              <mat-card-subtitle>تم إنشاؤه تلقائياً عند التأكيد</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="journal-lines">
                <div class="journal-line header-line">
                  <span class="col-account">الحساب</span>
                  <span class="col-amount">مدين</span>
                  <span class="col-amount">دائن</span>
                </div>
                @if (inv.invoiceType === 'STANDARD') {
                  <div class="journal-line">
                    <span class="col-account"><span class="acc-code">1102</span> العملاء والذمم المدينة</span>
                    <span class="col-amount debit">{{ inv.totalAmount | number:'1.2-2' }}</span>
                    <span class="col-amount">—</span>
                  </div>
                } @else {
                  <div class="journal-line">
                    <span class="col-account"><span class="acc-code">1101</span> النقدية وما يعادلها</span>
                    <span class="col-amount debit">{{ inv.totalAmount | number:'1.2-2' }}</span>
                    <span class="col-amount">—</span>
                  </div>
                }
                <div class="journal-line">
                  <span class="col-account"><span class="acc-code">410101</span> مبيعات خاضعة للضريبة</span>
                  <span class="col-amount">—</span>
                  <span class="col-amount credit">{{ inv.taxableAmount | number:'1.2-2' }}</span>
                </div>
                @if (inv.vatAmount > 0) {
                  <div class="journal-line">
                    <span class="col-account"><span class="acc-code">2102</span> ضريبة القيمة المضافة المخرجات</span>
                    <span class="col-amount">—</span>
                    <span class="col-amount credit">{{ inv.vatAmount | number:'1.2-2' }}</span>
                  </div>
                }
              </div>
            </mat-card-content>
            <mat-card-actions>
              <a mat-stroked-button [routerLink]="['/journal', inv.journalEntryId]">
                <mat-icon>open_in_new</mat-icon> عرض القيد كاملاً
              </a>
            </mat-card-actions>
          </mat-card>
        }

        <!-- QR Code (ZATCA) -->
        @if (inv.qrCodeBase64) {
          <mat-card class="qr-card">
            <mat-card-header><mat-card-title>رمز QR - ZATCA</mat-card-title></mat-card-header>
            <mat-card-content class="qr-content">
              <img [src]="'data:image/png;base64,' + inv.qrCodeBase64" alt="ZATCA QR Code" class="qr-image">
              <p class="qr-note">{{ inv.uuid }}</p>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .badges { display: flex; gap: 8px; margin-top: 8px; }
    .status-chip { padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 600; }
    .header-actions { display: flex; gap: 8px; align-items: center; }

    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 16px 0; }
    .summary-card { text-align: center; }
    .summary-label { color: #546e7a; font-size: 0.85rem; margin-bottom: 8px; }
    .summary-value { font-size: 1.3rem; font-weight: 700; color: #263238; }
    .summary-value.primary { color: #1a237e; font-size: 1.6rem; }

    .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }

    .journal-card { margin-top: 16px; }
    .journal-icon { color: #1a237e; background: #e8eaf6; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .journal-lines { display: flex; flex-direction: column; gap: 0; margin-top: 8px; font-size: 0.9rem; direction: rtl; }
    .journal-line { display: grid; grid-template-columns: 1fr 130px 130px; padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
    .journal-line.header-line { font-weight: 700; font-size: 0.8rem; color: #546e7a; background: #f5f5f5; border-radius: 6px 6px 0 0; }
    .col-account { display: flex; align-items: center; gap: 8px; }
    .col-amount { text-align: left; font-family: monospace; direction: ltr; }
    .acc-code { background: #e8eaf6; color: #1a237e; padding: 2px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; font-family: monospace; }
    .debit  { color: #1b5e20; font-weight: 600; }
    .credit { color: #1a237e; font-weight: 600; }

    .qr-card { margin-top: 16px; }
    .qr-content { display: flex; flex-direction: column; align-items: center; padding: 16px; }
    .qr-image { width: 180px; height: 180px; border: 1px solid #eee; border-radius: 8px; }
    .qr-note { font-size: 0.75rem; color: #999; margin-top: 8px; font-family: monospace; }
  `]
})
export class InvoiceViewComponent implements OnInit {
  @Input() id!: string;

  private invoiceService = inject(InvoiceService);
  private snackBar = inject(MatSnackBar);

  invoice = signal<Invoice | null>(null);
  loading = signal(true);
  confirming = signal(false);
  downloadingPdf = signal(false);

  itemCols = ['line', 'desc', 'qty', 'price', 'tax', 'total'];

  ngOnInit(): void {
    this.invoiceService.findById(this.id).subscribe({
      next: res => { this.invoice.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  confirm(id: string): void {
    this.confirming.set(true);
    this.invoiceService.confirm(id).subscribe({
      next: res => {
        this.invoice.set(res.data);
        this.confirming.set(false);
        this.snackBar.open('تم تأكيد الفاتورة وإرسالها إلى ZATCA', 'إغلاق', { duration: 4000 });
      },
      error: err => {
        this.confirming.set(false);
        this.snackBar.open(err.error?.message ?? 'حدث خطأ', 'إغلاق', { duration: 4000 });
      }
    });
  }

  downloadPdf(id: string, invoiceNumber: string): void {
    this.downloadingPdf.set(true);
    this.invoiceService.downloadPdf(id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingPdf.set(false);
      },
      error: () => {
        this.downloadingPdf.set(false);
        this.snackBar.open('فشل تحميل PDF', 'إغلاق', { duration: 3000 });
      }
    });
  }

  statusLabel(s: string): string {
    return ({ DRAFT: 'مسودة', CONFIRMED: 'مؤكدة', CANCELLED: 'ملغاة' } as Record<string,string>)[s] ?? s;
  }

  zatcaLabel(s: string): string {
    return ({
      NOT_SUBMITTED: 'لم ترسل', PENDING: 'قيد الإرسال',
      REPORTED: 'مُبلّغ', CLEARED: 'مُخلَّصة', REJECTED: 'مرفوضة'
    } as Record<string,string>)[s] ?? s;
  }
}
