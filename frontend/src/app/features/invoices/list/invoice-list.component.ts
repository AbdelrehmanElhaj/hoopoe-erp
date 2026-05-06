import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Tooltip } from 'primeng/tooltip';
import { InvoiceService, Invoice } from '../../../core/services/invoice.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, TableModule, Button, Tag, Tooltip],
  template: `
    <div class="page-wrap" dir="rtl">

      <div class="page-header">
        <h1 class="page-title">الفواتير</h1>
        <p-button label="فاتورة جديدة" icon="pi pi-plus" iconPos="right" routerLink="new" />
      </div>

      <p-table [value]="invoices()" [loading]="loading()"
               styleClass="invoices-table" [rowHover]="true">

        <ng-template pTemplate="header">
          <tr>
            <th>رقم الفاتورة</th>
            <th>العميل</th>
            <th>التاريخ</th>
            <th>الإجمالي</th>
            <th>ض.ق.م</th>
            <th>الحالة</th>
            <th>ZATCA</th>
            <th></th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-inv>
          <tr class="clickable-row" [routerLink]="[inv.id]">
            <td>
              <div class="num-cell">
                <span class="inv-link">{{ inv.invoiceNumber }}</span>
                @if (inv.creditNote) {
                  <p-tag value="إشعار دائن" severity="warn" [rounded]="true" />
                }
              </div>
            </td>
            <td>{{ inv.buyerName || '—' }}</td>
            <td>{{ inv.issueDatetime | date:'yyyy/MM/dd' }}</td>
            <td class="amount-col">{{ inv.totalAmount | number:'1.2-2' }} ر.س</td>
            <td class="amount-col">{{ inv.vatAmount | number:'1.2-2' }} ر.س</td>
            <td>
              <p-tag [value]="statusLabel(inv.status)"
                     [severity]="statusSeverity(inv.status)"
                     [rounded]="true" />
            </td>
            <td>
              <p-tag [value]="zatcaLabel(inv.zatcaStatus)"
                     [severity]="zatcaSeverity(inv.zatcaStatus)"
                     [rounded]="true" />
            </td>
            <td (click)="$event.stopPropagation()">
              <p-button icon="pi pi-eye" [text]="true" [rounded]="true"
                        severity="secondary" size="small"
                        [routerLink]="[inv.id]"
                        pTooltip="عرض" />
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="8" class="empty-cell">
              <i class="pi pi-receipt empty-icon"></i>
              <p>لا توجد فواتير بعد. أنشئ أول فاتورة!</p>
            </td>
          </tr>
        </ng-template>

      </p-table>

    </div>
  `,
  styles: [`
    .page-wrap { padding: 24px; max-width: 1200px; margin: 0 auto; }

    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px;
    }
    .page-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1a237e; }

    ::ng-deep .invoices-table {
      border-radius: 12px; overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,.07);
      .p-datatable-header-cell { background: #f5f7fb; font-weight: 700; color: #546e7a; font-size: 0.82rem; }
    }

    .clickable-row { cursor: pointer; }

    .num-cell { display: flex; align-items: center; gap: 8px; }
    .inv-link { color: #1a237e; font-weight: 600; }

    .amount-col { font-family: monospace; direction: ltr; text-align: left; color: #1b5e20; }

    .empty-cell { text-align: center; padding: 48px; }
    .empty-icon { font-size: 3rem; color: #cfd8dc; display: block; margin-bottom: 12px; }
    .empty-cell p { color: #b0bec5; margin: 0; }
  `]
})
export class InvoiceListComponent implements OnInit {
  private invoiceService = inject(InvoiceService);

  invoices = signal<Invoice[]>([]);
  loading  = signal(true);

  ngOnInit(): void {
    this.invoiceService.findAll().subscribe({
      next: res => { this.invoices.set(res.data.content); this.loading.set(false); },
      error: () => this.loading.set(false)
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
