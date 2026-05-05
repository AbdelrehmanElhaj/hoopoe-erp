import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Dialog } from 'primeng/dialog';
import { Skeleton } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { ContactService, Contact } from '../../../core/services/contact.service';
import { ContactFormComponent } from '../form/contact-form-dialog.component';

@Component({
  selector: 'app-contact-view',
  standalone: true,
  imports: [RouterLink, DatePipe, Card, Button, Tag, Dialog, Skeleton, ContactFormComponent],
  template: `
    <div class="page-wrap" dir="rtl">

      @if (loading()) {
        <div class="skeleton-wrap">
          <p-skeleton height="40px" width="300px" borderRadius="8px" />
          <div class="skel-grid">
            <p-skeleton height="200px" borderRadius="12px" />
            <p-skeleton height="200px" borderRadius="12px" />
          </div>
        </div>
      }

      @if (contact(); as c) {

        <!-- Header -->
        <div class="page-header">
          <div class="header-start">
            <p-button icon="pi pi-arrow-right" [text]="true" [rounded]="true"
                      severity="secondary" routerLink="/contacts" />
            <h1 class="page-title">{{ c.nameAr }}</h1>
            <p-tag [value]="typeLabel(c.contactType)"
                   [severity]="typeSeverity(c.contactType)"
                   [rounded]="true" />
            @if (!c.active) {
              <span class="inactive-badge">غير نشط</span>
            }
          </div>
          <div class="header-actions">
            <p-button label="تعديل" icon="pi pi-pencil" iconPos="right"
                      [outlined]="true" (onClick)="editVisible = true" />
            @if (c.active) {
              <p-button label="تعطيل" icon="pi pi-ban" iconPos="right"
                        severity="danger" [outlined]="true"
                        (onClick)="deactivate(c)" />
            }
          </div>
        </div>

        <!-- Cards grid -->
        <div class="cards-grid">

          <!-- Basic info -->
          <p-card>
            <ng-template pTemplate="header">
              <div class="card-head">
                <div class="card-head-icon blue"><i class="pi pi-user"></i></div>
                <span class="card-head-title">البيانات الأساسية</span>
              </div>
            </ng-template>
            <dl class="info-list">
              @if (c.nameEn) {
                <div class="info-row">
                  <dt>الاسم بالإنجليزي</dt><dd>{{ c.nameEn }}</dd>
                </div>
              }
              @if (c.vatNumber) {
                <div class="info-row">
                  <dt>الرقم الضريبي</dt><dd class="mono">{{ c.vatNumber }}</dd>
                </div>
              }
              @if (c.crNumber) {
                <div class="info-row">
                  <dt>السجل التجاري</dt><dd class="mono">{{ c.crNumber }}</dd>
                </div>
              }
              @if (c.address) {
                <div class="info-row">
                  <dt>العنوان</dt><dd>{{ c.address }}</dd>
                </div>
              }
              @if (!c.nameEn && !c.vatNumber && !c.crNumber && !c.address) {
                <p class="no-data">لا توجد بيانات إضافية</p>
              }
            </dl>
          </p-card>

          <!-- Contact info -->
          <p-card>
            <ng-template pTemplate="header">
              <div class="card-head">
                <div class="card-head-icon green"><i class="pi pi-phone"></i></div>
                <span class="card-head-title">بيانات التواصل</span>
              </div>
            </ng-template>
            <dl class="info-list">
              @if (c.phone) {
                <div class="info-row">
                  <dt><i class="pi pi-phone info-icon"></i> الهاتف</dt>
                  <dd><a [href]="'tel:' + c.phone" class="contact-link">{{ c.phone }}</a></dd>
                </div>
              }
              @if (c.email) {
                <div class="info-row">
                  <dt><i class="pi pi-envelope info-icon"></i> البريد الإلكتروني</dt>
                  <dd><a [href]="'mailto:' + c.email" class="contact-link">{{ c.email }}</a></dd>
                </div>
              }
              @if (!c.phone && !c.email) {
                <p class="no-data">لا توجد بيانات تواصل</p>
              }
            </dl>
          </p-card>

          <!-- Notes -->
          @if (c.notes) {
            <p-card styleClass="full-width-card">
              <ng-template pTemplate="header">
                <div class="card-head">
                  <div class="card-head-icon purple"><i class="pi pi-file-edit"></i></div>
                  <span class="card-head-title">ملاحظات</span>
                </div>
              </ng-template>
              <p class="notes-text">{{ c.notes }}</p>
            </p-card>
          }

          <!-- Meta -->
          <p-card styleClass="full-width-card">
            <ng-template pTemplate="header">
              <div class="card-head">
                <div class="card-head-icon grey"><i class="pi pi-info-circle"></i></div>
                <span class="card-head-title">معلومات النظام</span>
              </div>
            </ng-template>
            <dl class="info-list">
              <div class="info-row">
                <dt>تاريخ الإضافة</dt>
                <dd class="mono">{{ c.createdAt | date:'yyyy/MM/dd HH:mm' }}</dd>
              </div>
              @if (c.updatedAt) {
                <div class="info-row">
                  <dt>آخر تعديل</dt>
                  <dd class="mono">{{ c.updatedAt | date:'yyyy/MM/dd HH:mm' }}</dd>
                </div>
              }
            </dl>
          </p-card>

        </div>
      }
    </div>

    <!-- Edit dialog -->
    <p-dialog [(visible)]="editVisible"
              header="تعديل جهة الاتصال"
              [modal]="true" [draggable]="false"
              [style]="{ width: '560px' }"
              [contentStyle]="{ padding: '20px' }"
              dir="rtl">
      @if (editVisible && contact()) {
        <app-contact-form
          [data]="contact()"
          (saved)="onEdited($event)"
          (cancelled)="editVisible = false" />
      }
    </p-dialog>
  `,
  styles: [`
    .page-wrap { padding: 24px; max-width: 1200px; margin: 0 auto; }

    .skeleton-wrap { display: flex; flex-direction: column; gap: 16px; }
    .skel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
    }
    .header-start { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .page-title { margin: 0; font-size: 1.4rem; font-weight: 800; color: #1a237e; }
    .header-actions { display: flex; gap: 8px; }

    .inactive-badge {
      background: #ffebee; color: #c62828;
      padding: 3px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 600;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }

    ::ng-deep .full-width-card { grid-column: 1 / -1; }

    /* Card header */
    .card-head {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px 0;
    }
    .card-head-icon {
      width: 34px; height: 34px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      i { font-size: 0.95rem; color: white; }
      &.blue   { background: #1a237e; }
      &.green  { background: #1b5e20; }
      &.purple { background: #4a148c; }
      &.grey   { background: #546e7a; }
    }
    .card-head-title { font-weight: 700; font-size: 0.92rem; color: #1a237e; }

    /* Info list */
    .info-list {
      display: flex; flex-direction: column;
      gap: 10px; margin: 12px 0 0; padding: 0;
    }
    .info-row {
      display: flex; justify-content: space-between;
      align-items: flex-start; gap: 16px;
      padding-bottom: 10px; border-bottom: 1px solid #f5f5f5;
      &:last-child { border-bottom: none; padding-bottom: 0; }
    }
    dt { color: #78909c; font-size: 0.83rem; display: flex; align-items: center; gap: 5px; white-space: nowrap; }
    dd { font-weight: 600; color: #1a1a2e; margin: 0; text-align: left; }

    .info-icon { font-size: 0.85rem; color: #90a4ae; }
    .mono { font-family: monospace; }
    .contact-link { color: #1a237e; text-decoration: none; &:hover { text-decoration: underline; } }
    .no-data { color: #b0bec5; font-style: italic; margin: 8px 0 0; font-size: 0.88rem; }
    .notes-text { line-height: 1.8; color: #333; white-space: pre-wrap; margin: 0; }
  `]
})
export class ContactViewComponent implements OnInit {
  @Input() id!: string;

  private svc     = inject(ContactService);
  private toast   = inject(MessageService);
  private router  = inject(Router);

  contact  = signal<Contact | null>(null);
  loading  = signal(true);
  editVisible = false;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.findById(this.id).subscribe({
      next: res => { this.contact.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onEdited(updated: Contact): void {
    this.editVisible = false;
    this.toast.add({ severity: 'success', summary: 'تم', detail: 'تم تحديث جهة الاتصال', life: 3000 });
    this.load();
  }

  deactivate(c: Contact): void {
    if (!confirm(`هل تريد تعطيل "${c.nameAr}"؟`)) return;
    this.svc.deactivate(c.id).subscribe({
      next: () => {
        this.toast.add({ severity: 'warn', summary: 'تم', detail: 'تم تعطيل جهة الاتصال', life: 3000 });
        this.router.navigate(['/contacts']);
      }
    });
  }

  typeLabel(t: string): string {
    return ({ CUSTOMER: 'عميل', SUPPLIER: 'مورد', BOTH: 'عميل ومورد' } as Record<string, string>)[t] ?? t;
  }

  typeSeverity(t: string): 'success' | 'warn' | 'info' {
    return ({ CUSTOMER: 'success', SUPPLIER: 'warn', BOTH: 'info' } as Record<string, any>)[t] ?? 'info';
  }
}
