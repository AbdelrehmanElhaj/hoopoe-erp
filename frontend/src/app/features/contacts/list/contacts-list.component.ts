import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { Dialog } from 'primeng/dialog';
import { Skeleton } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { ContactService, Contact } from '../../../core/services/contact.service';
import { ContactFormComponent } from '../form/contact-form-dialog.component';

@Component({
  selector: 'app-contacts-list',
  standalone: true,
  imports: [
    RouterLink, FormsModule,
    TableModule, Button, InputText, Tag, Dialog, Skeleton,
    ContactFormComponent
  ],
  template: `
    <div class="page-wrap" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">العملاء والموردون</h1>
        <p-button label="إضافة جهة اتصال" icon="pi pi-plus" iconPos="right"
                  (onClick)="openAdd()" />
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="p-inputgroup search-group">
          <span class="p-inputgroup-addon"><i class="pi pi-search"></i></span>
          <input pInputText [(ngModel)]="searchTerm" (ngModelChange)="onSearch()"
                 placeholder="بحث باسم، رقم ضريبي، هاتف..." />
        </div>

        <div class="type-filters">
          @for (f of typeFilters; track f.value) {
            <button class="filter-btn" [class.filter-btn--active]="activeType === f.value"
                    (click)="setType(f.value)">
              {{ f.label }}
            </button>
          }
        </div>
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="skeleton-list">
          @for (_ of [1,2,3,4,5]; track _) {
            <p-skeleton height="48px" borderRadius="8px" />
          }
        </div>
      } @else {
        <p-table [value]="contacts()"
                 [paginator]="true" [rows]="20"
                 [showCurrentPageReport]="true"
                 currentPageReportTemplate="{first} - {last} من {totalRecords}"
                 [rowsPerPageOptions]="[10,20,50]"
                 styleClass="contacts-table"
                 [rowHover]="true"
                 (onRowSelect)="null">

          <ng-template pTemplate="header">
            <tr>
              <th>الاسم</th>
              <th>النوع</th>
              <th>الرقم الضريبي</th>
              <th>الهاتف</th>
              <th>البريد الإلكتروني</th>
              <th></th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-c>
            <tr class="contact-row" [routerLink]="[c.id]">
              <td>
                <div class="name-cell">
                  <span class="name-ar">{{ c.nameAr }}</span>
                  @if (c.nameEn) {
                    <span class="name-en">{{ c.nameEn }}</span>
                  }
                </div>
              </td>
              <td>
                <p-tag [value]="typeLabel(c.contactType)"
                       [severity]="typeSeverity(c.contactType)"
                       [rounded]="true" />
              </td>
              <td class="mono">{{ c.vatNumber || '—' }}</td>
              <td>{{ c.phone || '—' }}</td>
              <td>{{ c.email || '—' }}</td>
              <td class="action-col" (click)="$event.stopPropagation()">
                <p-button icon="pi pi-pencil" [text]="true" [rounded]="true"
                          severity="secondary" size="small"
                          [routerLink]="[c.id]" />
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="empty-cell">
                <i class="pi pi-users empty-icon"></i>
                <p>لا توجد جهات اتصال. أضف أول عميل أو مورد!</p>
              </td>
            </tr>
          </ng-template>

        </p-table>
      }

    </div>

    <!-- Add / Edit dialog -->
    <p-dialog [(visible)]="dialogVisible"
              [header]="editContact ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال جديدة'"
              [modal]="true" [draggable]="false"
              [style]="{ width: '560px' }"
              [contentStyle]="{ padding: '20px' }"
              dir="rtl">
      @if (dialogVisible) {
        <app-contact-form
          [data]="editContact"
          (saved)="onSaved($event)"
          (cancelled)="dialogVisible = false" />
      }
    </p-dialog>
  `,
  styles: [`
    .page-wrap { padding: 24px; max-width: 1200px; margin: 0 auto; }

    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px;
    }
    .page-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1a237e; }

    .filters-bar {
      display: flex; align-items: center; gap: 16px;
      flex-wrap: wrap; margin-bottom: 16px;
    }

    .search-group { flex: 1; min-width: 220px; max-width: 400px; }

    .type-filters { display: flex; gap: 6px; flex-wrap: wrap; }

    .filter-btn {
      padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;
      border: 1.5px solid #d0d0d0; background: white; color: #555;
      cursor: pointer; transition: all .15s; font-family: 'Cairo', sans-serif;
      &:hover { border-color: #1a237e; color: #1a237e; }
    }
    .filter-btn--active {
      background: #1a237e !important; color: white !important; border-color: #1a237e !important;
    }

    .skeleton-list { display: flex; flex-direction: column; gap: 8px; }

    /* Table overrides */
    ::ng-deep .contacts-table {
      border-radius: 12px; overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,.07);

      .p-datatable-header-cell { background: #f5f7fb; font-weight: 700; color: #546e7a; font-size: 0.82rem; }
      .p-datatable-tbody > tr { transition: background .15s; }
    }

    .contact-row { cursor: pointer; }

    .name-cell { display: flex; flex-direction: column; gap: 2px; }
    .name-ar { font-weight: 600; color: #1a237e; }
    .name-en { font-size: 0.77rem; color: #90a4ae; }

    .mono { font-family: monospace; font-size: 0.88rem; }
    .action-col { width: 60px; text-align: center; }

    .empty-cell {
      text-align: center; padding: 48px;
      .empty-icon { font-size: 3rem; color: #cfd8dc; display: block; margin-bottom: 12px; }
      p { color: #b0bec5; margin: 0; }
    }
  `]
})
export class ContactsListComponent implements OnInit {
  private svc = inject(ContactService);
  private toast = inject(MessageService);

  contacts = signal<Contact[]>([]);
  loading  = signal(true);
  searchTerm  = '';
  activeType  = '';
  dialogVisible = false;
  editContact: Contact | null = null;

  typeFilters = [
    { label: 'الكل',     value: '' },
    { label: 'عملاء',    value: 'CUSTOMER' },
    { label: 'موردون',   value: 'SUPPLIER' },
    { label: 'الاثنان', value: 'BOTH' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.findAll(this.activeType || undefined, this.searchTerm || undefined).subscribe({
      next: res => { this.contacts.set(res.data.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  setType(type: string): void { this.activeType = type; this.load(); }
  onSearch(): void { this.load(); }

  openAdd(): void { this.editContact = null; this.dialogVisible = true; }

  onSaved(contact: Contact): void {
    this.dialogVisible = false;
    this.toast.add({ severity: 'success', summary: 'تم', detail: 'تم حفظ جهة الاتصال', life: 3000 });
    this.load();
  }

  typeLabel(t: string): string {
    return ({ CUSTOMER: 'عميل', SUPPLIER: 'مورد', BOTH: 'عميل ومورد' } as Record<string, string>)[t] ?? t;
  }

  typeSeverity(t: string): 'success' | 'warn' | 'info' {
    return ({ CUSTOMER: 'success', SUPPLIER: 'warn', BOTH: 'info' } as Record<string, any>)[t] ?? 'info';
  }
}
