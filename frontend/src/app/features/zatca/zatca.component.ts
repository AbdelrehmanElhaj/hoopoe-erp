import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ZatcaService, ZatcaStatus } from '../../core/services/zatca.service';

@Component({
  selector: 'app-zatca',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container" dir="rtl">
      <div class="page-header">
        <h1><mat-icon>qr_code_2</mat-icon> ربط ZATCA — الفاتورة الإلكترونية المرحلة الثانية</h1>
      </div>

      @if (loadingStatus()) {
        <div class="center"><mat-spinner diameter="40" /></div>
      } @else if (status()?.onboarded) {

        <!-- Already onboarded -->
        <div class="onboarded-card">
          <mat-icon class="check-icon">verified</mat-icon>
          <div>
            <h2>مفعّل ومرتبط بـ ZATCA</h2>
            <p>{{ status()!.companyNameAr }} — {{ status()!.vatNumber }}</p>
            <p class="meta">رقم الشهادة: <code>{{ status()!.certSerial }}</code></p>
            <p class="meta">تاريخ الربط: {{ status()!.onboardedAt | date:'yyyy-MM-dd HH:mm' }}</p>
          </div>
        </div>

        <div class="renew-section">
          <p>لتجديد الشهادة أو إعادة الربط، ابدأ من الخطوة الأولى:</p>
          <button mat-stroked-button color="warn" (click)="resetWizard()">
            <mat-icon>refresh</mat-icon> إعادة الربط
          </button>
        </div>

      } @else {

        <!-- Onboarding wizard -->
        <div class="wizard">

          <!-- Step indicator -->
          <div class="steps">
            @for (s of STEPS; track s.n) {
              <div class="step" [class.active]="step() === s.n" [class.done]="step() > s.n">
                <div class="step-circle">
                  @if (step() > s.n) { <mat-icon>check</mat-icon> } @else { {{ s.n }} }
                </div>
                <span>{{ s.label }}</span>
              </div>
              @if (!$last) { <div class="step-line" [class.done]="step() > s.n"></div> }
            }
          </div>

          <!-- Step 1: Generate CSR -->
          @if (step() === 1) {
            <div class="step-content">
              <h2>الخطوة 1 — توليد طلب التوقيع (CSR)</h2>
              <p class="hint">
                سجّل دخولك على بوابة <strong>فاتورة ZATCA</strong>، ثم انسخ الـ OTP (6 أرقام)
                الخاص بجهازك من قسم "الأجهزة" وأدخله أدناه.
              </p>

              <div class="field-group">
                <label>رمز OTP (6 أرقام)</label>
                <input type="text" [(ngModel)]="otp" maxlength="6" placeholder="مثال: 123456"
                       class="otp-input" [disabled]="loadingCsr()" />
              </div>

              @if (csrError()) {
                <div class="error-msg">{{ csrError() }}</div>
              }

              <div class="actions">
                <button mat-flat-button color="primary"
                        (click)="generateCsr()"
                        [disabled]="otp.length !== 6 || loadingCsr()">
                  @if (loadingCsr()) { <mat-spinner diameter="18" /> }
                  @else { <mat-icon>key</mat-icon> }
                  توليد CSR
                </button>
              </div>

              @if (csr()) {
                <div class="csr-output">
                  <div class="csr-header">
                    <span>طلب التوقيع (CSR) — جاهز للرفع على بوابة ZATCA</span>
                    <button mat-stroked-button (click)="copyCsr()">
                      <mat-icon>{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
                      {{ copied() ? 'تم النسخ' : 'نسخ' }}
                    </button>
                  </div>
                  <textarea class="csr-text" readonly [value]="csr()!"></textarea>
                  <button mat-flat-button color="accent" (click)="step.set(2)">
                    التالي — تعليمات الرفع <mat-icon>arrow_back</mat-icon>
                  </button>
                </div>
              }
            </div>
          }

          <!-- Step 2: Instructions -->
          @if (step() === 2) {
            <div class="step-content">
              <h2>الخطوة 2 — رفع CSR على بوابة ZATCA</h2>
              <ol class="instructions">
                <li>افتح بوابة <strong>فاتورة ZATCA</strong>: <code>fatoora.zatca.gov.sa</code></li>
                <li>اذهب إلى <strong>الأجهزة → إضافة جهاز جديد</strong></li>
                <li>الصق محتوى الـ CSR من الخطوة السابقة في الحقل المخصص</li>
                <li>أدخل الـ OTP نفسه الذي استخدمته واضغط <strong>موافق</strong></li>
                <li>بعد الموافقة، حمّل الملف <code>.pem</code> (الشهادة) وانسخ الـ Serial Number</li>
              </ol>
              <div class="info-box">
                <mat-icon>info</mat-icon>
                <span>قد تستغرق موافقة ZATCA من دقائق إلى ساعات. انتظر وصول الشهادة قبل المتابعة.</span>
              </div>
              <div class="actions">
                <button mat-stroked-button (click)="step.set(1)">
                  <mat-icon>arrow_forward</mat-icon> السابق
                </button>
                <button mat-flat-button color="primary" (click)="step.set(3)">
                  التالي — تخزين الشهادة <mat-icon>arrow_back</mat-icon>
                </button>
              </div>
            </div>
          }

          <!-- Step 3: Store certificate -->
          @if (step() === 3) {
            <div class="step-content">
              <h2>الخطوة 3 — تخزين الشهادة</h2>
              <p class="hint">الصق الشهادة التي استلمتها من ZATCA (بصيغة PEM) وأدخل الـ Serial Number.</p>

              <div class="field-group">
                <label>الشهادة (Certificate PEM)</label>
                <textarea [(ngModel)]="certPem" rows="8" placeholder="-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----"
                          class="cert-textarea" [disabled]="loadingStore()"></textarea>
              </div>

              <div class="field-group">
                <label>رقم تسلسل الشهادة (Serial Number)</label>
                <input type="text" [(ngModel)]="serialNumber"
                       placeholder="مثال: 2593741264548" [disabled]="loadingStore()" />
              </div>

              @if (storeError()) {
                <div class="error-msg">{{ storeError() }}</div>
              }

              <div class="actions">
                <button mat-stroked-button (click)="step.set(2)" [disabled]="loadingStore()">
                  <mat-icon>arrow_forward</mat-icon> السابق
                </button>
                <button mat-flat-button color="primary"
                        (click)="storeCertificate()"
                        [disabled]="!certPem.trim() || !serialNumber.trim() || loadingStore()">
                  @if (loadingStore()) { <mat-spinner diameter="18" /> }
                  @else { <mat-icon>save</mat-icon> }
                  حفظ الشهادة وإتمام الربط
                </button>
              </div>
            </div>
          }

        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 800px; direction: rtl; }
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; }
    .page-header h1 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 1.4rem; }

    /* Onboarded state */
    .onboarded-card { display: flex; align-items: flex-start; gap: 20px;
                      background: #e8f5e9; border-radius: 12px; padding: 24px; margin-bottom: 20px; }
    .check-icon { font-size: 48px; width: 48px; height: 48px; color: #2e7d32; }
    .onboarded-card h2 { margin: 0 0 6px; color: #1b5e20; }
    .onboarded-card p { margin: 4px 0; color: #333; }
    .meta { font-size: .85rem; color: #555; }
    .meta code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
    .renew-section { color: #666; font-size: .9rem; }

    /* Wizard */
    .wizard { background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,.08); overflow: hidden; }

    .steps { display: flex; align-items: center; padding: 24px 32px;
             background: #f8f9ff; border-bottom: 1px solid #e8eaf6; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .step-circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
                   justify-content: center; font-weight: 700; font-size: .9rem;
                   background: #e0e0e0; color: #666; transition: all .2s; }
    .step.active .step-circle  { background: #1a237e; color: white; }
    .step.done .step-circle    { background: #2e7d32; color: white; }
    .step span { font-size: .8rem; color: #666; white-space: nowrap; }
    .step.active span { color: #1a237e; font-weight: 600; }
    .step-line { flex: 1; height: 2px; background: #e0e0e0; margin: 0 8px; margin-bottom: 22px; }
    .step-line.done { background: #2e7d32; }

    .step-content { padding: 32px; }
    .step-content h2 { margin: 0 0 12px; font-size: 1.2rem; }
    .hint { color: #546e7a; margin-bottom: 24px; line-height: 1.6; }

    .field-group { margin-bottom: 20px; }
    .field-group label { display: block; font-weight: 600; margin-bottom: 6px; font-size: .9rem; }
    .field-group input, .field-group textarea {
      width: 100%; box-sizing: border-box;
      border: 1px solid #ccc; border-radius: 6px; padding: 10px 12px;
      font-size: .95rem; font-family: inherit;
      transition: border-color .2s;
    }
    .field-group input:focus, .field-group textarea:focus { outline: none; border-color: #1a237e; }
    .otp-input { width: 160px !important; letter-spacing: .3em; font-size: 1.2rem; text-align: center; }
    .cert-textarea { font-family: monospace; font-size: .8rem; resize: vertical; }

    .csr-output { margin-top: 20px; background: #f5f5f5; border-radius: 8px; padding: 16px; }
    .csr-header { display: flex; justify-content: space-between; align-items: center;
                  margin-bottom: 10px; font-size: .9rem; font-weight: 600; }
    .csr-text { width: 100%; height: 180px; font-family: monospace; font-size: .75rem;
                resize: none; border: 1px solid #ddd; border-radius: 4px; padding: 8px;
                background: white; margin-bottom: 14px; box-sizing: border-box; }

    .instructions { padding-right: 20px; line-height: 2; color: #333; }
    .instructions li { margin-bottom: 4px; }
    .instructions code { background: #e8eaf6; padding: 2px 6px; border-radius: 4px; font-size: .85rem; }

    .info-box { display: flex; align-items: flex-start; gap: 10px; background: #e3f2fd;
                border-radius: 8px; padding: 14px 16px; margin: 20px 0; color: #0d47a1; }
    .info-box mat-icon { color: #1565c0; flex-shrink: 0; }

    .actions { display: flex; gap: 12px; margin-top: 24px; }
    .error-msg { background: #ffebee; color: #c62828; border-radius: 6px;
                 padding: 10px 14px; margin-top: 12px; font-size: .9rem; }
    .center { display: flex; justify-content: center; padding: 60px; }
  `]
})
export class ZatcaComponent implements OnInit {
  private svc = inject(ZatcaService);

  readonly STEPS = [
    { n: 1, label: 'توليد CSR' },
    { n: 2, label: 'رفع على ZATCA' },
    { n: 3, label: 'تخزين الشهادة' },
  ];

  status       = signal<ZatcaStatus | null>(null);
  loadingStatus = signal(true);
  step         = signal(1);

  otp          = '';
  csr          = signal<string | null>(null);
  copied       = signal(false);
  loadingCsr   = signal(false);
  csrError     = signal('');

  certPem      = '';
  serialNumber = '';
  loadingStore = signal(false);
  storeError   = signal('');

  ngOnInit() { this.loadStatus(); }

  loadStatus() {
    this.loadingStatus.set(true);
    this.svc.status().subscribe({
      next: s  => { this.status.set(s); this.loadingStatus.set(false); },
      error: _ => { this.status.set(null); this.loadingStatus.set(false); }
    });
  }

  generateCsr() {
    this.csrError.set('');
    this.loadingCsr.set(true);
    this.svc.generateCsr(this.otp).subscribe({
      next: csr => { this.csr.set(csr); this.loadingCsr.set(false); },
      error: err => {
        this.csrError.set(err.error?.message ?? 'فشل توليد CSR، تحقق من OTP وأعد المحاولة');
        this.loadingCsr.set(false);
      }
    });
  }

  copyCsr() {
    navigator.clipboard.writeText(this.csr()!).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  storeCertificate() {
    this.storeError.set('');
    this.loadingStore.set(true);
    this.svc.storeCertificate(this.certPem.trim(), this.serialNumber.trim()).subscribe({
      next: () => { this.loadingStore.set(false); this.loadStatus(); },
      error: err => {
        this.storeError.set(err.error?.message ?? 'فشل حفظ الشهادة، تحقق من البيانات وأعد المحاولة');
        this.loadingStore.set(false);
      }
    });
  }

  resetWizard() {
    this.step.set(1);
    this.otp = '';
    this.csr.set(null);
    this.certPem = '';
    this.serialNumber = '';
    this.status.set({ ...this.status()!, onboarded: false });
  }
}
