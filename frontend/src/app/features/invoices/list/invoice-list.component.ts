import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe, DatePipe } from '@angular/common';
import { InvoiceService, Invoice } from '../../../core/services/invoice.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressBarModule, MatTooltipModule,
    DecimalPipe, DatePipe
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>الفواتير</h1>
        <button mat-flat-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon>
          فاتورة جديدة
        </button>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="invoices()" class="w-full">

            <ng-container matColumnDef="invoiceNumber">
              <th mat-header-cell *matHeaderCellDef>رقم الفاتورة</th>
              <td mat-cell *matCellDef="let inv">
                <a [routerLink]="[inv.id]" class="link-primary">{{ inv.invoiceNumber }}</a>
              </td>
            </ng-container>

            <ng-container matColumnDef="buyerName">
              <th mat-header-cell *matHeaderCellDef>العميل</th>
              <td mat-cell *matCellDef="let inv">{{ inv.buyerName || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="issueDate">
              <th mat-header-cell *matHeaderCellDef>التاريخ</th>
              <td mat-cell *matCellDef="let inv">
                {{ inv.issueDatetime | date:'yyyy/MM/dd' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="totalAmount">
              <th mat-header-cell *matHeaderCellDef>الإجمالي</th>
              <td mat-cell *matCellDef="let inv">
                <span class="amount">{{ inv.totalAmount | number:'1.2-2' }} ر.س</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="vatAmount">
              <th mat-header-cell *matHeaderCellDef>ضريبة القيمة المضافة</th>
              <td mat-cell *matCellDef="let inv">
                <span class="amount">{{ inv.vatAmount | number:'1.2-2' }} ر.س</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>الحالة</th>
              <td mat-cell *matCellDef="let inv">
                <span class="status-chip" [class]="'status-' + inv.status.toLowerCase()">
                  {{ statusLabel(inv.status) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="zatcaStatus">
              <th mat-header-cell *matHeaderCellDef>ZATCA</th>
              <td mat-cell *matCellDef="let inv">
                <span class="status-chip" [class]="'zatca-' + inv.zatcaStatus.toLowerCase().replace('_','-')">
                  {{ zatcaLabel(inv.zatcaStatus) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let inv">
                <button mat-icon-button [routerLink]="[inv.id]" matTooltip="عرض">
                  <mat-icon>visibility</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;" class="clickable-row"
                [routerLink]="[row.id]"></tr>

            @if (invoices().length === 0 && !loading()) {
              <tr class="mat-row">
                <td [attr.colspan]="columns.length" class="empty-row">
                  <mat-icon>receipt_long</mat-icon>
                  <p>لا توجد فواتير بعد. أنشئ أول فاتورة!</p>
                </td>
              </tr>
            }
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .w-full { width: 100%; }
    .link-primary { color: #1a237e; text-decoration: none; font-weight: 600; }
    .status-chip {
      padding: 4px 10px; border-radius: 12px;
      font-size: 0.78rem; font-weight: 600;
    }
    .empty-row {
      text-align: center; padding: 48px;
      mat-icon { font-size: 48px; opacity: .3; display: block; }
      p { color: #999; margin: 8px 0 0; }
    }
  `]
})
export class InvoiceListComponent implements OnInit {
  private invoiceService = inject(InvoiceService);

  invoices = signal<Invoice[]>([]);
  loading = signal(true);

  columns = ['invoiceNumber', 'buyerName', 'issueDate', 'totalAmount', 'vatAmount', 'status', 'zatcaStatus', 'actions'];

  ngOnInit(): void {
    this.invoiceService.findAll().subscribe({
      next: res => { this.invoices.set(res.data.content); this.loading.set(false); },
      error: () => this.loading.set(false)
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
