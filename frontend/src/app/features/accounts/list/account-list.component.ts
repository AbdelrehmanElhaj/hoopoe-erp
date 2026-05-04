import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AccountService, Account } from '../../../core/services/account.service';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatProgressBarModule, MatChipsModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>دليل الحسابات</h1>
        <button mat-flat-button color="primary" (click)="showForm.set(!showForm())">
          <mat-icon>{{ showForm() ? 'close' : 'add' }}</mat-icon>
          {{ showForm() ? 'إلغاء' : 'حساب جديد' }}
        </button>
      </div>

      @if (loading()) { <mat-progress-bar mode="indeterminate" /> }

      <!-- Add form -->
      @if (showForm()) {
        <mat-card class="add-form-card">
          <mat-card-header><mat-card-title>إضافة حساب جديد</mat-card-title></mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()" class="account-form">
              <mat-form-field appearance="outline">
                <mat-label>كود الحساب</mat-label>
                <input matInput formControlName="code" dir="ltr" placeholder="مثال: 110103">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>اسم الحساب (عربي)</mat-label>
                <input matInput formControlName="nameAr">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>نوع الحساب</mat-label>
                <mat-select formControlName="accountType">
                  <mat-option value="ASSET">أصول</mat-option>
                  <mat-option value="LIABILITY">خصوم</mat-option>
                  <mat-option value="EQUITY">حقوق ملكية</mat-option>
                  <mat-option value="REVENUE">إيرادات</mat-option>
                  <mat-option value="EXPENSE">مصروفات</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>الرصيد الطبيعي</mat-label>
                <mat-select formControlName="normalBalance">
                  <mat-option value="DEBIT">مدين</mat-option>
                  <mat-option value="CREDIT">دائن</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>الحساب الأب (اختياري)</mat-label>
                <mat-select formControlName="parentId">
                  <mat-option [value]="null">— بدون أب —</mat-option>
                  @for (acc of accounts(); track acc.id) {
                    <mat-option [value]="acc.id">{{ acc.code }} - {{ acc.nameAr }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <div class="form-actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
                  <mat-icon>save</mat-icon> حفظ
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <!-- Filter by type -->
      <mat-card class="filter-card">
        <div class="type-filters">
          @for (f of typeFilters; track f.value) {
            <button mat-stroked-button
                    [color]="selectedType() === f.value ? 'primary' : undefined"
                    (click)="filterType(f.value)">
              {{ f.label }}
            </button>
          }
        </div>
      </mat-card>

      <!-- Accounts table -->
      <mat-card>
        <mat-card-content>
          <table mat-table [dataSource]="filtered()">

            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>الكود</th>
              <td mat-cell *matCellDef="let a">
                <span [style.paddingRight.px]="(a.level - 1) * 16" dir="ltr"
                      [style.fontWeight]="a.leaf ? 'normal' : '700'">
                  {{ a.code }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="nameAr">
              <th mat-header-cell *matHeaderCellDef>اسم الحساب</th>
              <td mat-cell *matCellDef="let a" [style.fontWeight]="a.leaf ? 'normal' : '600'">
                {{ a.nameAr }}
              </td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>النوع</th>
              <td mat-cell *matCellDef="let a">
                <span class="type-chip" [class]="'type-' + a.accountType.toLowerCase()">
                  {{ typeLabel(a.accountType) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="balance">
              <th mat-header-cell *matHeaderCellDef>الرصيد الطبيعي</th>
              <td mat-cell *matCellDef="let a">
                {{ a.normalBalance === 'DEBIT' ? 'مدين' : 'دائن' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="level">
              <th mat-header-cell *matHeaderCellDef>المستوى</th>
              <td mat-cell *matCellDef="let a">{{ a.level }}</td>
            </ng-container>

            <ng-container matColumnDef="leaf">
              <th mat-header-cell *matHeaderCellDef>قابل للترحيل</th>
              <td mat-cell *matCellDef="let a">
                <mat-icon [style.color]="a.leaf ? '#2e7d32' : '#999'" [style.fontSize.px]="18">
                  {{ a.leaf ? 'check_circle' : 'remove' }}
                </mat-icon>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"
                [class.inactive-row]="!row.active"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .add-form-card { margin-bottom: 16px; }
    .account-form { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .form-actions { grid-column: 1/-1; display: flex; justify-content: flex-end; }
    .filter-card { margin-bottom: 16px; padding: 8px 16px; }
    .type-filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .type-chip { padding: 3px 8px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    .type-asset     { background: #e3f2fd; color: #1565c0; }
    .type-liability { background: #fce4ec; color: #c62828; }
    .type-equity    { background: #f3e5f5; color: #6a1b9a; }
    .type-revenue   { background: #e8f5e9; color: #1b5e20; }
    .type-expense   { background: #fff8e1; color: #e65100; }
    .inactive-row { opacity: 0.4; }
  `]
})
export class AccountListComponent implements OnInit {
  private accountService = inject(AccountService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  accounts = signal<Account[]>([]);
  filtered = signal<Account[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  selectedType = signal('');

  columns = ['code', 'nameAr', 'type', 'balance', 'level', 'leaf'];

  typeFilters = [
    { value: '', label: 'الكل' },
    { value: 'ASSET', label: 'أصول' },
    { value: 'LIABILITY', label: 'خصوم' },
    { value: 'EQUITY', label: 'حقوق ملكية' },
    { value: 'REVENUE', label: 'إيرادات' },
    { value: 'EXPENSE', label: 'مصروفات' },
  ];

  form = this.fb.group({
    code:          ['', Validators.required],
    nameAr:        ['', Validators.required],
    accountType:   ['', Validators.required],
    normalBalance: ['', Validators.required],
    parentId:      [null as string | null]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.accountService.findAll().subscribe({
      next: res => {
        const sorted = res.data.sort((a, b) => a.code.localeCompare(b.code));
        this.accounts.set(sorted);
        this.filtered.set(sorted);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filterType(type: string): void {
    this.filtered.set(
      type ? this.accounts().filter(a => a.accountType === type) : this.accounts()
    );
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.accountService.create(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.form.reset();
        this.snackBar.open('تم إضافة الحساب', 'إغلاق', { duration: 3000 });
        this.load();
      },
      error: err => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'حدث خطأ', 'إغلاق', { duration: 4000 });
      }
    });
  }

  typeLabel(t: string): string {
    return ({ ASSET:'أصول', LIABILITY:'خصوم', EQUITY:'حقوق ملكية', REVENUE:'إيرادات', EXPENSE:'مصروفات' } as Record<string,string>)[t] ?? t;
  }
}
