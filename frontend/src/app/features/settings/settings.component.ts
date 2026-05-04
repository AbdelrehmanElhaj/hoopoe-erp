import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { TenantService, TenantProfile } from '../../core/services/tenant.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule,
            MatProgressSpinnerModule, MatSnackBarModule, DatePipe, RouterLink],
  template: `
    <div class="page-container" dir="rtl">
      <div class="page-header">
        <h1><mat-icon>business</mat-icon> إعدادات الشركة</h1>
      </div>

      @if (loading()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else if (error()) {
        <div class="error-msg">{{ error() }}</div>
      } @else {
        @if (profile(); as p) {

        <!-- Read-only info banner -->
        <div class="info-banner">
          <div class="info-item">
            <span class="info-label">النطاق الفرعي</span>
            <code>{{ p.subdomain }}</code>
          </div>
          <div class="info-item">
            <span class="info-label">الرقم الضريبي</span>
            <code>{{ p.vatNumber }}</code>
          </div>
          <div class="info-item">
            <span class="info-label">الخطة</span>
            <span class="badge plan">{{ planLabel(p.plan) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">الحالة</span>
            <span class="badge" [class]="'status-' + p.status.toLowerCase()">{{ statusLabel(p.status) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">ZATCA</span>
            @if (p.zatcaOnboarded) {
              <span class="badge zatca-on"><mat-icon>verified</mat-icon> مربوط</span>
            } @else {
              <span class="badge zatca-off">غير مربوط</span>
            }
          </div>
          <div class="info-item">
            <span class="info-label">تاريخ التسجيل</span>
            <span>{{ p.createdAt | date:'yyyy/MM/dd' }}</span>
          </div>
        </div>

        <!-- Editable form -->
        <div class="form-card">
          <h2>بيانات الشركة</h2>
          <p class="hint">الرقم الضريبي والنطاق الفرعي ثابتان ولا يمكن تغييرهما.</p>

          <div class="field-grid">
            <div class="field-group">
              <label>اسم الشركة بالعربية <span class="required">*</span></label>
              <input type="text" [(ngModel)]="form.companyNameAr" [disabled]="saving()" />
            </div>
            <div class="field-group">
              <label>اسم الشركة بالإنجليزية</label>
              <input type="text" [(ngModel)]="form.companyNameEn" [disabled]="saving()" dir="ltr" />
            </div>
            <div class="field-group">
              <label>رقم السجل التجاري</label>
              <input type="text" [(ngModel)]="form.crNumber" [disabled]="saving()" dir="ltr" />
            </div>
            <div class="field-group full-width">
              <label>العنوان</label>
              <textarea [(ngModel)]="form.addressAr" rows="3" [disabled]="saving()"></textarea>
            </div>
          </div>

          <div class="actions">
            <button mat-flat-button color="primary" (click)="save()"
                    [disabled]="saving() || !form.companyNameAr.trim()">
              @if (saving()) { <mat-spinner diameter="18" /> }
              @else { <mat-icon>save</mat-icon> }
              حفظ التغييرات
            </button>
            @if (!p.zatcaOnboarded) {
              <button mat-stroked-button routerLink="/zatca">
                <mat-icon>qr_code_2</mat-icon> ربط ZATCA
              </button>
            }
          </div>
        </div>

        }
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 900px; direction: rtl; }
    .page-header h1 { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }

    .info-banner {
      display: flex; flex-wrap: wrap; gap: 12px;
      background: #e8eaf6; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;
    }
    .info-item { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
    .info-label { font-size: .75rem; color: #546e7a; font-weight: 600; text-transform: uppercase; }
    .info-item code { background: white; padding: 3px 8px; border-radius: 4px; font-size: .85rem; direction: ltr; display: inline-block; }

    .badge { display: inline-flex; align-items: center; gap: 4px;
             padding: 3px 10px; border-radius: 12px; font-size: .8rem; font-weight: 600; }
    .badge.plan       { background: #ede7f6; color: #4a148c; }
    .status-active    { background: #e8f5e9; color: #1b5e20; }
    .status-suspended { background: #fff3e0; color: #e65100; }
    .status-cancelled { background: #ffebee; color: #b71c1c; }
    .zatca-on  { background: #e8f5e9; color: #1b5e20; }
    .zatca-off { background: #f5f5f5; color: #757575; }
    .zatca-on mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .form-card {
      background: white; border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,.08); padding: 28px;
    }
    .form-card h2 { margin: 0 0 6px; font-size: 1.1rem; }
    .hint { color: #546e7a; font-size: .85rem; margin-bottom: 24px; }

    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-group.full-width { grid-column: 1 / -1; }
    .field-group label { font-weight: 600; font-size: .9rem; }
    .required { color: #c62828; }
    .field-group input, .field-group textarea {
      border: 1px solid #ccc; border-radius: 6px; padding: 10px 12px;
      font-size: .95rem; font-family: inherit; box-sizing: border-box; width: 100%;
      transition: border-color .2s;
    }
    .field-group input:focus, .field-group textarea:focus { outline: none; border-color: #1a237e; }
    .field-group input:disabled, .field-group textarea:disabled { background: #fafafa; color: #999; }
    .field-group textarea { resize: vertical; }

    .actions { display: flex; gap: 12px; margin-top: 24px; align-items: center; }

    .center { display: flex; justify-content: center; padding: 60px; }
    .error-msg { background: #ffebee; color: #c62828; border-radius: 6px; padding: 12px; }
  `]
})
export class SettingsComponent implements OnInit {
  private svc = inject(TenantService);
  private snackBar = inject(MatSnackBar);

  profile = signal<TenantProfile | null>(null);
  loading = signal(true);
  saving  = signal(false);
  error   = signal('');

  form = { companyNameAr: '', companyNameEn: '', crNumber: '', addressAr: '' };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.getProfile().subscribe({
      next: p => {
        this.profile.set(p);
        this.form = {
          companyNameAr: p.companyNameAr ?? '',
          companyNameEn: p.companyNameEn ?? '',
          crNumber: p.crNumber ?? '',
          addressAr: p.addressAr ?? '',
        };
        this.loading.set(false);
      },
      error: () => { this.error.set('فشل تحميل بيانات الشركة'); this.loading.set(false); }
    });
  }

  save() {
    this.saving.set(true);
    this.svc.updateProfile(this.form).subscribe({
      next: p => {
        this.profile.set(p);
        this.saving.set(false);
        this.snackBar.open('تم حفظ بيانات الشركة بنجاح', 'إغلاق', { duration: 3000 });
      },
      error: err => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'فشل الحفظ', 'إغلاق', { duration: 4000 });
      }
    });
  }

  planLabel(p: string): string {
    return ({ BASIC: 'أساسية', STANDARD: 'قياسية', ENTERPRISE: 'متقدمة' } as Record<string,string>)[p] ?? p;
  }

  statusLabel(s: string): string {
    return ({ ACTIVE: 'نشط', SUSPENDED: 'موقوف', CANCELLED: 'ملغى' } as Record<string,string>)[s] ?? s;
  }
}
