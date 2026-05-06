import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Skeleton } from 'primeng/skeleton';
import { Textarea } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { InvoiceService, Invoice } from '../../../core/services/invoice.service';

@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [
    RouterLink, FormsModule, DecimalPipe, DatePipe,
    TableModule, Button, Tag, Skeleton, Textarea
  ],
  template: `
    <div class="page-wrap" dir="rtl">

      @if (loading()) {
        <div class="skeleton-wrap">
          <p-skeleton height="40px" borderRadius="8px" />
          <p-skeleton height="28px" width="50%" borderRadius="8px" />
          <p-skeleton height="120px" borderRadius="12px" />
          <p-skeleton height="300px" borderRadius="12px" />
        </div>
      }

      @if (invoice(); as inv) {

        <!-- Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">{{ inv.invoiceNumber }}</h1>
            <div class="badges">
              <p-tag [value]="statusLabel(inv.status)"
                     [severity]="statusSeverity(inv.status)"
                     [rounded]="true" />
              <p-tag [value]="'ZATCA: ' + zatcaLabel(inv.zatcaStatus)"
                     [severity]="zatcaSeverity(inv.zatcaStatus)"
                     [rounded]="true" />
            </div>
          </div>
          <div class="header-actions">
            <p-button label="العودة" icon="pi pi-arrow-left" iconPos="right"
                      [outlined]="true" routerLink="/invoices" />
            <p-button [label]="downloadingPdf() ? '...' : 'تحميل PDF'"
                      icon="pi pi-file-pdf" iconPos="right"
                      [outlined]="true" [loading]="downloadingPdf()"
                      (onClick)="downloadPdf(inv.id, inv.invoiceNumber)" />
            @if (inv.status === 'DRAFT') {
              <p-button [label]="confirming() ? 'جارٍ التأكيد...' : 'تأكيد وإرسال ZATCA'"
                        icon="pi pi-check-circle" iconPos="right"
                        [loading]="confirming()"
                        (onClick)="confirm(inv.id)" />
            }
            @if (inv.status === 'CONFIRMED' && !inv.creditNote) {
              <p-button label="إشعار دائن" icon="pi pi-reply" iconPos="right"
                        [outlined]="true" severity="warn"
                        (onClick)="toggleCnForm()" />
            }
          </div>
        </div>

        <!-- Credit note origin banner -->
        @if (inv.creditNote) {
          <div class="cn-banner">
            <i class="pi pi-reply"></i>
            <span>هذه وثيقة إشعار دائن تعكس الفاتورة الأصلية</span>
            @if (inv.originalInvoiceId) {
              <p-button label="عرض الفاتورة الأصلية" icon="pi pi-arrow-left" iconPos="right"
                        [text]="true" [routerLink]="['/invoices', inv.originalInvoiceId]" />
            }
          </div>
        }

        <!-- Credit note inline form -->
        @if (showCnForm()) {
          <div class="cn-form-card">
            <div class="cn-form-title">
              <i class="pi pi-reply"></i> إصدار إشعار دائن
            </div>
            <p class="cn-hint">سيتم إنشاء إشعار دائن يعكس كامل مبالغ الفاتورة وقيد عكسي تلقائياً.</p>
            <div class="field">
              <label>سبب الإشعار الدائن</label>
              <textarea pTextarea [(ngModel)]="cnReason" rows="3" class="w-full"
                        placeholder="مثال: إلغاء الطلب، خطأ في الأسعار..."></textarea>
            </div>
            <div class="cn-form-actions">
              <p-button label="تأكيد الإشعار الدائن" icon="pi pi-check" iconPos="right"
                        severity="warn" [loading]="creatingCn()"
                        [disabled]="creatingCn() || !cnReason.trim()"
                        (onClick)="createCreditNote(inv.id)" />
              <p-button label="إلغاء" [outlined]="true" (onClick)="toggleCnForm()" />
            </div>
          </div>
        }

        <!-- KPI summary -->
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">الإجمالي شامل الضريبة</div>
            <div class="summary-value primary">{{ inv.totalAmount | number:'1.2-2' }} ر.س</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">ضريبة القيمة المضافة</div>
            <div class="summary-value">{{ inv.vatAmount | number:'1.2-2' }} ر.س</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">تاريخ الإصدار</div>
            <div class="summary-value">{{ inv.issueDatetime | date:'yyyy/MM/dd HH:mm' }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">نوع الفاتورة</div>
            <div class="summary-value">{{ inv.invoiceType === 'STANDARD' ? 'ضريبية' : 'مبسّطة' }}</div>
          </div>
        </div>

        <!-- Parties -->
        <div class="parties-grid">
          <div class="info-card">
            <div class="info-card-title">البائع</div>
            <p><strong>{{ inv.sellerNameAr }}</strong></p>
            <p class="muted">الرقم الضريبي: <span dir="ltr">{{ inv.sellerVatNumber }}</span></p>
          </div>
          <div class="info-card">
            <div class="info-card-title">المشتري</div>
            <p><strong>{{ inv.buyerName || '—' }}</strong></p>
            @if (inv.buyerVatNumber) {
              <p class="muted">الرقم الضريبي: <span dir="ltr">{{ inv.buyerVatNumber }}</span></p>
            }
          </div>
        </div>

        <!-- Items table -->
        <div class="section-card">
          <div class="section-title">بنود الفاتورة</div>
          <p-table [value]="inv.items" styleClass="items-table">
            <ng-template pTemplate="header">
              <tr>
                <th>#</th>
                <th>الوصف</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>الضريبة</th>
                <th>الإجمالي</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td>{{ item.lineNumber }}</td>
                <td>{{ item.descriptionAr }}</td>
                <td class="mono">{{ item.quantity | number:'1.0-4' }}</td>
                <td class="mono">{{ item.unitPrice | number:'1.2-2' }}</td>
                <td class="mono">{{ item.vatAmount | number:'1.2-2' }}</td>
                <td class="mono"><strong>{{ item.totalAmount | number:'1.2-2' }}</strong></td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Accounting journal entry -->
        @if (inv.journalEntryId) {
          <div class="section-card journal-card">
            <div class="section-title">
              <i class="pi pi-book"></i> القيد المحاسبي
              <span class="section-subtitle">تم إنشاؤه تلقائياً عند التأكيد</span>
            </div>
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
            <div class="journal-footer">
              <p-button label="عرض القيد كاملاً" icon="pi pi-external-link" iconPos="right"
                        [outlined]="true" size="small"
                        [routerLink]="['/journal', inv.journalEntryId]" />
            </div>
          </div>
        }

        <!-- QR Code -->
        @if (inv.qrCodeBase64) {
          <div class="section-card qr-card">
            <div class="section-title">رمز QR - ZATCA</div>
            <div class="qr-content">
              <img [src]="'data:image/png;base64,' + inv.qrCodeBase64" alt="ZATCA QR Code" class="qr-image">
              <p class="qr-note">{{ inv.uuid }}</p>
            </div>
          </div>
        }

      }
    </div>
  `,
  styles: [`
    .page-wrap { padding: 24px; max-width: 1100px; margin: 0 auto; }

    .skeleton-wrap { display: flex; flex-direction: column; gap: 12px; }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 16px;
    }
    .page-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1a237e; }
    .badges { display: flex; gap: 8px; margin-top: 8px; }
    .header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

    /* Credit note banner */
    .cn-banner {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      background: #fff3e0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;
      color: #e65100; font-weight: 600;
    }
    .cn-banner i { font-size: 18px; }

    /* Credit note form */
    .cn-form-card {
      background: #fff8e1; border: 1px solid #ffe082; border-radius: 10px;
      padding: 20px 24px; margin-bottom: 16px;
    }
    .cn-form-title {
      display: flex; align-items: center; gap: 8px;
      color: #e65100; font-weight: 700; font-size: 1rem; margin-bottom: 8px;
    }
    .cn-hint { color: #78909c; font-size: 0.85rem; margin: 0 0 16px; }
    .cn-form-actions { display: flex; gap: 10px; margin-top: 12px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 0.83rem; font-weight: 600; color: #546e7a; }

    /* KPI grid */
    .summary-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 16px; margin: 16px 0;
    }
    .summary-card {
      background: white; border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,.07);
      padding: 16px; text-align: center;
    }
    .summary-label { color: #546e7a; font-size: 0.85rem; margin-bottom: 8px; }
    .summary-value { font-size: 1.3rem; font-weight: 700; color: #263238; }
    .summary-value.primary { color: #1a237e; font-size: 1.6rem; }

    /* Parties */
    .parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
    .info-card {
      background: white; border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,.07);
      padding: 16px;
    }
    .info-card-title { font-weight: 700; color: #1a237e; margin-bottom: 8px; }
    .info-card p { margin: 4px 0; }
    .muted { color: #78909c; font-size: 0.88rem; }

    /* Section card */
    .section-card {
      background: white; border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,.07);
      padding: 20px; margin-bottom: 16px;
    }
    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 1rem; font-weight: 700; color: #1a237e; margin-bottom: 16px;
    }
    .section-subtitle { font-size: 0.82rem; font-weight: 400; color: #78909c; }

    /* Items table */
    ::ng-deep .items-table {
      .p-datatable-header-cell { background: #f5f7fb; font-weight: 700; color: #546e7a; font-size: 0.82rem; }
    }
    .mono { font-family: monospace; direction: ltr; text-align: left; }

    /* Journal lines */
    .journal-lines { display: flex; flex-direction: column; font-size: 0.9rem; direction: rtl; margin-bottom: 16px; }
    .journal-line {
      display: grid; grid-template-columns: 1fr 130px 130px;
      padding: 8px 12px; border-bottom: 1px solid #f0f0f0;
    }
    .journal-line.header-line {
      font-weight: 700; font-size: 0.8rem; color: #546e7a;
      background: #f5f7fb; border-radius: 6px 6px 0 0;
    }
    .col-account { display: flex; align-items: center; gap: 8px; }
    .col-amount { text-align: left; font-family: monospace; direction: ltr; }
    .acc-code {
      background: #e8eaf6; color: #1a237e; padding: 2px 6px;
      border-radius: 4px; font-size: 0.78rem; font-weight: 700; font-family: monospace;
    }
    .debit  { color: #1b5e20; font-weight: 600; }
    .credit { color: #1a237e; font-weight: 600; }
    .journal-footer { display: flex; justify-content: flex-start; }

    /* QR */
    .qr-content { display: flex; flex-direction: column; align-items: center; padding: 8px; }
    .qr-image { width: 180px; height: 180px; border: 1px solid #eee; border-radius: 8px; }
    .qr-note { font-size: 0.75rem; color: #999; margin-top: 8px; font-family: monospace; }

    .w-full { width: 100%; }
  `]
})
export class InvoiceViewComponent implements OnInit {
  @Input() id!: string;

  private invoiceService = inject(InvoiceService);
  private toast = inject(MessageService);
  private router = inject(Router);

  invoice       = signal<Invoice | null>(null);
  loading       = signal(true);
  confirming    = signal(false);
  downloadingPdf = signal(false);
  showCnForm    = signal(false);
  creatingCn    = signal(false);
  cnReason      = '';

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
        this.toast.add({ severity: 'success', summary: 'تم', detail: 'تم تأكيد الفاتورة وإرسالها إلى ZATCA', life: 4000 });
      },
      error: err => {
        this.confirming.set(false);
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message ?? 'حدث خطأ', life: 4000 });
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
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تحميل PDF', life: 3000 });
      }
    });
  }

  toggleCnForm(): void {
    this.showCnForm.update(v => !v);
    this.cnReason = '';
  }

  createCreditNote(id: string): void {
    this.creatingCn.set(true);
    this.invoiceService.createCreditNote(id, this.cnReason).subscribe({
      next: res => {
        this.creatingCn.set(false);
        this.showCnForm.set(false);
        this.toast.add({ severity: 'success', summary: 'تم', detail: 'تم إنشاء الإشعار الدائن بنجاح', life: 3000 });
        this.router.navigate(['/invoices', res.data.id]);
      },
      error: err => {
        this.creatingCn.set(false);
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message ?? 'فشل إنشاء الإشعار الدائن', life: 4000 });
      }
    });
  }

  statusLabel(s: string): string {
    return ({ DRAFT: 'مسودة', CONFIRMED: 'مؤكدة', CANCELLED: 'ملغاة' } as Record<string, string>)[s] ?? s;
  }

  statusSeverity(s: string): 'secondary' | 'success' | 'danger' {
    return ({ DRAFT: 'secondary', CONFIRMED: 'success', CANCELLED: 'danger' } as Record<string, any>)[s] ?? 'secondary';
  }

  zatcaLabel(s: string): string {
    return ({
      NOT_SUBMITTED: 'لم ترسل', PENDING: 'قيد الإرسال',
      REPORTED: 'مُبلّغ', CLEARED: 'مُخلَّصة', REJECTED: 'مرفوضة'
    } as Record<string, string>)[s] ?? s;
  }

  zatcaSeverity(s: string): 'secondary' | 'warn' | 'info' | 'success' | 'danger' {
    return ({
      NOT_SUBMITTED: 'secondary', PENDING: 'warn',
      REPORTED: 'info', CLEARED: 'success', REJECTED: 'danger'
    } as Record<string, any>)[s] ?? 'secondary';
  }
}
