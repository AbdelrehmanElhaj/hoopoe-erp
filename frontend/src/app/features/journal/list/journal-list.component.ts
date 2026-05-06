import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Tooltip } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { JournalService, JournalEntry } from '../../../core/services/journal.service';

@Component({
  selector: 'app-journal-list',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe, TableModule, Button, Tag, Tooltip],
  template: `
    <div class="page-wrap" dir="rtl">

      <div class="page-header">
        <h1 class="page-title">القيود اليومية</h1>
        <p-button label="قيد جديد" icon="pi pi-plus" iconPos="right" routerLink="new" />
      </div>

      <p-table [value]="entries()" [loading]="loading()"
               styleClass="journal-table" [rowHover]="true">

        <ng-template pTemplate="header">
          <tr>
            <th>رقم القيد</th>
            <th>التاريخ</th>
            <th>البيان</th>
            <th>إجمالي المدين</th>
            <th>إجمالي الدائن</th>
            <th>الحالة</th>
            <th></th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-e>
          <tr>
            <td><strong>{{ e.entryNumber }}</strong></td>
            <td>{{ e.entryDate | date:'yyyy/MM/dd' }}</td>
            <td>{{ e.description }}</td>
            <td class="amount-debit">{{ e.totalDebit | number:'1.2-2' }}</td>
            <td class="amount-credit">{{ e.totalCredit | number:'1.2-2' }}</td>
            <td>
              <p-tag [value]="statusLabel(e.status)"
                     [severity]="statusSeverity(e.status)"
                     [rounded]="true" />
            </td>
            <td class="actions-cell">
              <p-button icon="pi pi-eye" [text]="true" [rounded]="true"
                        severity="secondary" size="small"
                        [routerLink]="['/journal', e.id]"
                        pTooltip="عرض" />
              @if (e.status === 'DRAFT') {
                <p-button label="ترحيل" icon="pi pi-send" iconPos="right"
                          [outlined]="true" size="small"
                          (onClick)="post(e.id)" />
              }
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="7" class="empty-cell">
              <i class="pi pi-book empty-icon"></i>
              <p>لا توجد قيود بعد</p>
            </td>
          </tr>
        </ng-template>

      </p-table>

    </div>
  `,
  styles: [`
    .page-wrap { padding: 24px; max-width: 1100px; margin: 0 auto; }

    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px;
    }
    .page-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1a237e; }

    ::ng-deep .journal-table {
      border-radius: 12px; overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,.07);
      .p-datatable-header-cell { background: #f5f7fb; font-weight: 700; color: #546e7a; font-size: 0.82rem; }
    }

    .amount-debit, .amount-credit { font-family: monospace; direction: ltr; text-align: left; }
    .amount-debit  { color: #1b5e20; }
    .amount-credit { color: #1a237e; }

    .actions-cell { display: flex; align-items: center; gap: 4px; }

    .empty-cell { text-align: center; padding: 48px; }
    .empty-icon { font-size: 3rem; color: #cfd8dc; display: block; margin-bottom: 12px; }
    .empty-cell p { color: #b0bec5; margin: 0; }
  `]
})
export class JournalListComponent implements OnInit {
  private journalService = inject(JournalService);
  private toast = inject(MessageService);

  entries = signal<JournalEntry[]>([]);
  loading = signal(true);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.journalService.findAll().subscribe({
      next: res => { this.entries.set(res.data.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  post(id: string): void {
    this.journalService.post(id).subscribe({
      next: res => {
        this.entries.update(list => list.map(e => e.id === id ? res.data : e));
        this.toast.add({ severity: 'success', summary: 'تم', detail: 'تم ترحيل القيد بنجاح', life: 3000 });
      },
      error: err => this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message ?? 'حدث خطأ', life: 4000 })
    });
  }

  statusLabel(s: string): string {
    return ({ DRAFT: 'مسودة', POSTED: 'مرحَّل', VOID: 'ملغى' } as Record<string, string>)[s] ?? s;
  }

  statusSeverity(s: string): 'warn' | 'success' | 'danger' {
    return ({ DRAFT: 'warn', POSTED: 'success', VOID: 'danger' } as Record<string, any>)[s] ?? 'secondary';
  }
}
