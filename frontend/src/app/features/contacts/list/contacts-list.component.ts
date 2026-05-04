import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ContactService, Contact, CreateContactRequest } from '../../../core/services/contact.service';
import { ContactFormDialogComponent } from '../form/contact-form-dialog.component';

@Component({
  selector: 'app-contacts-list',
  standalone: true,
  imports: [
    RouterLink, FormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule,
    MatChipsModule, MatProgressBarModule, MatTooltipModule,
    MatSnackBarModule, MatDialogModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>العملاء والموردون</h1>
        <button mat-flat-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon>
          إضافة جهة اتصال
        </button>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>بحث</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input matInput [(ngModel)]="searchTerm" (ngModelChange)="onSearch()" placeholder="اسم، رقم ضريبي، هاتف...">
            </mat-form-field>

            <div class="type-filters">
              @for (f of typeFilters; track f.value) {
                <button mat-stroked-button
                        [class.active-filter]="activeType === f.value"
                        (click)="setType(f.value)">
                  {{ f.label }}
                </button>
              }
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="contacts()" class="w-full">

            <ng-container matColumnDef="nameAr">
              <th mat-header-cell *matHeaderCellDef>الاسم</th>
              <td mat-cell *matCellDef="let c">
                <div class="name-cell">
                  <a [routerLink]="[c.id]" class="link-primary">{{ c.nameAr }}</a>
                  @if (c.nameEn) {
                    <span class="name-en">{{ c.nameEn }}</span>
                  }
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="contactType">
              <th mat-header-cell *matHeaderCellDef>النوع</th>
              <td mat-cell *matCellDef="let c">
                <span class="type-chip" [class]="'type-' + c.contactType.toLowerCase()">
                  {{ typeLabel(c.contactType) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="vatNumber">
              <th mat-header-cell *matHeaderCellDef>الرقم الضريبي</th>
              <td mat-cell *matCellDef="let c">{{ c.vatNumber || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>الهاتف</th>
              <td mat-cell *matCellDef="let c">{{ c.phone || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>البريد الإلكتروني</th>
              <td mat-cell *matCellDef="let c">{{ c.email || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let c">
                <button mat-icon-button [routerLink]="[c.id]" matTooltip="عرض وتعديل">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;" class="clickable-row"
                [routerLink]="[row.id]"></tr>

            @if (contacts().length === 0 && !loading()) {
              <tr class="mat-row">
                <td [attr.colspan]="columns.length" class="empty-row">
                  <mat-icon>people_outline</mat-icon>
                  <p>لا توجد جهات اتصال. أضف أول عميل أو مورد!</p>
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
    .filter-card { margin-bottom: 16px; }
    .filters-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 200px; }
    .type-filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .type-filters button { border-radius: 20px; }
    .active-filter { background: #1a237e !important; color: white !important; }
    .link-primary { color: #1a237e; text-decoration: none; font-weight: 600; }
    .name-cell { display: flex; flex-direction: column; gap: 2px; }
    .name-en { font-size: 0.78rem; color: #666; }
    .type-chip { padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 600; }
    .type-customer { background: #e8f5e9; color: #2e7d32; }
    .type-supplier { background: #fff3e0; color: #e65100; }
    .type-both     { background: #e3f2fd; color: #1565c0; }
    .empty-row {
      text-align: center; padding: 48px;
      mat-icon { font-size: 48px; opacity: .3; display: block; }
      p { color: #999; margin: 8px 0 0; }
    }
  `]
})
export class ContactsListComponent implements OnInit {
  private contactService = inject(ContactService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  contacts = signal<Contact[]>([]);
  loading = signal(true);
  searchTerm = '';
  activeType = '';

  columns = ['nameAr', 'contactType', 'vatNumber', 'phone', 'email', 'actions'];

  typeFilters = [
    { label: 'الكل',      value: '' },
    { label: 'عملاء',     value: 'CUSTOMER' },
    { label: 'موردون',    value: 'SUPPLIER' },
    { label: 'الاثنان',  value: 'BOTH' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.contactService.findAll(this.activeType || undefined, this.searchTerm || undefined).subscribe({
      next: res => { this.contacts.set(res.data.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  setType(type: string): void {
    this.activeType = type;
    this.load();
  }

  onSearch(): void {
    this.load();
  }

  openForm(): void {
    const ref = this.dialog.open(ContactFormDialogComponent, { width: '560px' });
    ref.afterClosed().subscribe(created => {
      if (created) {
        this.snack.open('تم إضافة جهة الاتصال', 'إغلاق', { duration: 3000 });
        this.load();
      }
    });
  }

  typeLabel(t: string): string {
    return ({ CUSTOMER: 'عميل', SUPPLIER: 'مورد', BOTH: 'عميل ومورد' } as Record<string, string>)[t] ?? t;
  }
}
