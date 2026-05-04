import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { ContactService, Contact } from '../../../core/services/contact.service';
import { ContactFormDialogComponent } from '../form/contact-form-dialog.component';

@Component({
  selector: 'app-contact-view',
  standalone: true,
  imports: [
    RouterLink, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressBarModule, MatDividerModule,
    MatSnackBarModule, MatDialogModule, DatePipe
  ],
  template: `
    <div class="page-container">

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (contact(); as c) {
        <div class="page-header">
          <div class="header-left">
            <button mat-icon-button routerLink="/contacts">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <h1>{{ c.nameAr }}</h1>
            <span class="type-chip" [class]="'type-' + c.contactType.toLowerCase()">
              {{ typeLabel(c.contactType) }}
            </span>
            @if (!c.active) {
              <span class="inactive-badge">غير نشط</span>
            }
          </div>
          <div class="header-actions">
            <button mat-stroked-button (click)="openEdit(c)">
              <mat-icon>edit</mat-icon>
              تعديل
            </button>
            @if (c.active) {
              <button mat-stroked-button color="warn" (click)="deactivate(c)">
                <mat-icon>block</mat-icon>
                تعطيل
              </button>
            }
          </div>
        </div>

        <div class="cards-grid">

          <!-- Basic Info -->
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>person</mat-icon>
              <mat-card-title>البيانات الأساسية</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <dl class="info-list">
                @if (c.nameEn) {
                  <div class="info-row">
                    <dt>الاسم بالإنجليزي</dt>
                    <dd>{{ c.nameEn }}</dd>
                  </div>
                }
                @if (c.vatNumber) {
                  <div class="info-row">
                    <dt>الرقم الضريبي</dt>
                    <dd class="mono">{{ c.vatNumber }}</dd>
                  </div>
                }
                @if (c.crNumber) {
                  <div class="info-row">
                    <dt>السجل التجاري</dt>
                    <dd class="mono">{{ c.crNumber }}</dd>
                  </div>
                }
                @if (c.address) {
                  <div class="info-row">
                    <dt>العنوان</dt>
                    <dd>{{ c.address }}</dd>
                  </div>
                }
              </dl>
            </mat-card-content>
          </mat-card>

          <!-- Contact Info -->
          <mat-card>
            <mat-card-header>
              <mat-icon mat-card-avatar>contact_phone</mat-icon>
              <mat-card-title>بيانات التواصل</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <dl class="info-list">
                @if (c.phone) {
                  <div class="info-row">
                    <dt><mat-icon class="info-icon">phone</mat-icon> الهاتف</dt>
                    <dd><a [href]="'tel:' + c.phone">{{ c.phone }}</a></dd>
                  </div>
                }
                @if (c.email) {
                  <div class="info-row">
                    <dt><mat-icon class="info-icon">email</mat-icon> البريد الإلكتروني</dt>
                    <dd><a [href]="'mailto:' + c.email">{{ c.email }}</a></dd>
                  </div>
                }
                @if (!c.phone && !c.email) {
                  <p class="no-data">لا توجد بيانات تواصل</p>
                }
              </dl>
            </mat-card-content>
          </mat-card>

          <!-- Notes -->
          @if (c.notes) {
            <mat-card class="notes-card">
              <mat-card-header>
                <mat-icon mat-card-avatar>notes</mat-icon>
                <mat-card-title>ملاحظات</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p class="notes-text">{{ c.notes }}</p>
              </mat-card-content>
            </mat-card>
          }

          <!-- Meta -->
          <mat-card class="meta-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>info_outline</mat-icon>
              <mat-card-title>معلومات النظام</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <dl class="info-list">
                <div class="info-row">
                  <dt>تاريخ الإضافة</dt>
                  <dd>{{ c.createdAt | date:'yyyy/MM/dd HH:mm' }}</dd>
                </div>
                @if (c.updatedAt) {
                  <div class="info-row">
                    <dt>آخر تعديل</dt>
                    <dd>{{ c.updatedAt | date:'yyyy/MM/dd HH:mm' }}</dd>
                  </div>
                }
              </dl>
            </mat-card-content>
          </mat-card>

        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
    }
    .header-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .header-actions { display: flex; gap: 8px; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .notes-card, .meta-card { grid-column: 1 / -1; }
    .type-chip { padding: 4px 12px; border-radius: 12px; font-size: 0.78rem; font-weight: 600; }
    .type-customer { background: #e8f5e9; color: #2e7d32; }
    .type-supplier { background: #fff3e0; color: #e65100; }
    .type-both     { background: #e3f2fd; color: #1565c0; }
    .inactive-badge { background: #ffebee; color: #c62828; padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; }
    .info-list { display: flex; flex-direction: column; gap: 12px; margin: 16px 0 0; }
    .info-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .info-row dt { color: #666; font-size: 0.85rem; display: flex; align-items: center; gap: 4px; white-space: nowrap; }
    .info-row dd { font-weight: 500; text-align: left; margin: 0; }
    .info-icon { font-size: 16px; width: 16px; height: 16px; vertical-align: middle; }
    .mono { font-family: monospace; }
    .no-data { color: #999; font-style: italic; margin: 16px 0 0; }
    .notes-text { line-height: 1.8; color: #333; white-space: pre-wrap; }
    a { color: #1a237e; text-decoration: none; }
    a:hover { text-decoration: underline; }
  `]
})
export class ContactViewComponent implements OnInit {
  @Input() id!: string;

  private contactService = inject(ContactService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private router = inject(Router);

  contact = signal<Contact | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.contactService.findById(this.id).subscribe({
      next: res => { this.contact.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openEdit(c: Contact): void {
    const ref = this.dialog.open(ContactFormDialogComponent, { width: '560px', data: c });
    ref.afterClosed().subscribe(updated => {
      if (updated) {
        this.snack.open('تم تحديث جهة الاتصال', 'إغلاق', { duration: 3000 });
        this.load();
      }
    });
  }

  deactivate(c: Contact): void {
    if (!confirm(`هل تريد تعطيل "${c.nameAr}"؟`)) return;
    this.contactService.deactivate(c.id).subscribe({
      next: () => {
        this.snack.open('تم تعطيل جهة الاتصال', 'إغلاق', { duration: 3000 });
        this.router.navigate(['/contacts']);
      }
    });
  }

  typeLabel(t: string): string {
    return ({ CUSTOMER: 'عميل', SUPPLIER: 'مورد', BOTH: 'عميل ومورد' } as Record<string, string>)[t] ?? t;
  }
}
