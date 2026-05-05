import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Card, InputText, Password,
    Button, Toast
  ],
  template: `
    <p-toast position="top-center" />

    <div class="login-page">
      <div class="login-container">

        <!-- Brand -->
        <div class="login-brand">
          <div class="brand-icon-wrap">
            <i class="pi pi-building-columns brand-icon"></i>
          </div>
          <h1>النظام المحاسبي السعودي</h1>
          <p>نظام محاسبي متوافق مع هيئة الزكاة والضريبة والجمارك</p>
        </div>

        <!-- Card -->
        <p-card styleClass="login-card">
          <h2>تسجيل الدخول</h2>

          <form [formGroup]="form" (ngSubmit)="submit()" class="login-form">

            <!-- Tenant -->
            <div class="field">
              <label for="tenantId">معرّف الشركة</label>
              <div class="p-inputgroup">
                <span class="p-inputgroup-addon"><i class="pi pi-building"></i></span>
                <input pInputText id="tenantId" formControlName="tenantId"
                       placeholder="مثال: al-nakheel" dir="ltr" />
              </div>
              @if (submitted() && form.get('tenantId')?.invalid) {
                <small class="field-error">معرّف الشركة مطلوب</small>
              }
            </div>

            <!-- Email -->
            <div class="field">
              <label for="email">البريد الإلكتروني</label>
              <div class="p-inputgroup">
                <span class="p-inputgroup-addon"><i class="pi pi-envelope"></i></span>
                <input pInputText id="email" type="email" formControlName="email" dir="ltr" />
              </div>
              @if (submitted() && form.get('email')?.invalid) {
                <small class="field-error">أدخل بريدًا إلكترونيًا صالحًا</small>
              }
            </div>

            <!-- Password -->
            <div class="field">
              <label for="password">كلمة المرور</label>
              <p-password
                inputId="password"
                formControlName="password"
                [feedback]="false"
                [toggleMask]="true"
                styleClass="w-full"
                inputStyleClass="w-full" />
              @if (submitted() && form.get('password')?.invalid) {
                <small class="field-error">كلمة المرور مطلوبة</small>
              }
            </div>

            <!-- Submit -->
            <p-button
              type="submit"
              label="دخول"
              icon="pi pi-sign-in"
              iconPos="right"
              styleClass="submit-btn"
              [loading]="loading()" />

          </form>
        </p-card>

      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0d1757 0%, #1a237e 50%, #283593 100%);
      padding: 16px;
    }

    .login-container {
      width: 100%;
      max-width: 440px;
    }

    /* Brand */
    .login-brand {
      text-align: center;
      margin-bottom: 28px;
      color: white;

      .brand-icon-wrap {
        width: 72px;
        height: 72px;
        background: rgba(255,213,79,.2);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
      }

      .brand-icon {
        font-size: 2.2rem;
        color: #ffd54f;
      }

      h1 {
        margin: 0 0 8px;
        font-size: 1.35rem;
        font-weight: 700;
      }

      p {
        margin: 0;
        font-size: 0.88rem;
        opacity: 0.75;
      }
    }

    /* Card overrides */
    ::ng-deep .login-card {
      border-radius: 20px !important;
      box-shadow: 0 20px 60px rgba(0,0,0,.3) !important;

      .p-card-body { padding: 32px; }
    }

    h2 {
      margin: 0 0 24px;
      font-size: 1.2rem;
      font-weight: 700;
      color: #1a237e;
      text-align: center;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 0.88rem;
        font-weight: 600;
        color: #444;
      }
    }

    .field-error {
      color: #c62828;
      font-size: 0.8rem;
    }

    /* PrimeNG overrides */
    ::ng-deep .p-inputgroup input { direction: ltr; }
    ::ng-deep .p-password { width: 100%; }
    ::ng-deep .p-password input { width: 100%; direction: ltr; }

    ::ng-deep .submit-btn {
      width: 100% !important;
      height: 48px !important;
      font-size: 1rem !important;
      justify-content: center;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(MessageService);

  showPassword = signal(false);
  loading = signal(false);
  submitted = signal(false);

  form = this.fb.group({
    tenantId: ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;

    const { tenantId, email, password } = this.form.getRawValue();
    this.loading.set(true);

    this.auth.login(email!, password!, tenantId!).subscribe({
      next: () => this.router.navigate(['/invoices']),
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message ?? 'بيانات الدخول غير صحيحة';
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: msg, life: 4000 });
      }
    });
  }
}
