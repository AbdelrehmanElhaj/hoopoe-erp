import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="login-page">
      <div class="login-container">

        <div class="login-brand">
          <mat-icon class="brand-icon">account_balance</mat-icon>
          <h1>النظام المحاسبي السعودي</h1>
          <p>نظام محاسبي متوافق مع هيئة الزكاة والضريبة والجمارك</p>
        </div>

        <mat-card class="login-card">
          <mat-card-content>
            <h2>تسجيل الدخول</h2>

            <form [formGroup]="form" (ngSubmit)="submit()">

              <mat-form-field appearance="outline">
                <mat-label>معرّف الشركة</mat-label>
                <mat-icon matPrefix>business</mat-icon>
                <input matInput formControlName="tenantId" placeholder="مثال: my-company" dir="ltr">
                @if (form.get('tenantId')?.hasError('required')) {
                  <mat-error>معرّف الشركة مطلوب</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>البريد الإلكتروني</mat-label>
                <mat-icon matPrefix>email</mat-icon>
                <input matInput type="email" formControlName="email" dir="ltr">
                @if (form.get('email')?.hasError('required')) {
                  <mat-error>البريد الإلكتروني مطلوب</mat-error>
                }
                @if (form.get('email')?.hasError('email')) {
                  <mat-error>بريد إلكتروني غير صالح</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>كلمة المرور</mat-label>
                <mat-icon matPrefix>lock</mat-icon>
                <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password" dir="ltr">
                <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())">
                  <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (form.get('password')?.hasError('required')) {
                  <mat-error>كلمة المرور مطلوبة</mat-error>
                }
              </mat-form-field>

              <button mat-flat-button color="primary" type="submit"
                      [disabled]="form.invalid || loading()"
                      class="submit-btn">
                @if (loading()) {
                  <mat-spinner diameter="20" />
                } @else {
                  <ng-container><mat-icon>login</mat-icon> دخول</ng-container>
                }
              </button>

            </form>
          </mat-card-content>
        </mat-card>

      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%);
    }

    .login-container {
      width: 100%;
      max-width: 440px;
      padding: 16px;
    }

    .login-brand {
      text-align: center;
      margin-bottom: 24px;
      color: white;
      .brand-icon {
        font-size: 56px;
        height: 56px;
        width: 56px;
        color: #ffd740;
      }
      h1 { margin: 12px 0 8px; font-size: 1.4rem; font-weight: 700; }
      p { margin: 0; opacity: .8; font-size: 0.9rem; }
    }

    .login-card {
      border-radius: 16px !important;
      padding: 8px;
    }

    h2 {
      margin: 0 0 24px;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a237e;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .submit-btn {
      height: 48px;
      font-size: 1rem;
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  showPassword = signal(false);
  loading = signal(false);

  form = this.fb.group({
    tenantId: ['', Validators.required],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;

    const { tenantId, email, password } = this.form.getRawValue();
    this.loading.set(true);

    this.auth.login(email!, password!, tenantId!).subscribe({
      next: () => this.router.navigate(['/invoices']),
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message ?? 'بيانات الدخول غير صحيحة';
        this.snackBar.open(msg, 'إغلاق', { duration: 4000, panelClass: 'error-snack' });
      }
    });
  }
}
