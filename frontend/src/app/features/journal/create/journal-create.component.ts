import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { DecimalPipe } from '@angular/common';
import { JournalService } from '../../../core/services/journal.service';
import { AccountService, Account } from '../../../core/services/account.service';

@Component({
  selector: 'app-journal-create',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, DecimalPipe,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule,
    MatSnackBarModule, MatDividerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>قيد يومي جديد</h1>
        <button mat-stroked-button routerLink="/journal">
          <mat-icon>arrow_forward</mat-icon> العودة
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">

        <!-- Header -->
        <mat-card>
          <mat-card-header><mat-card-title>رأس القيد</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="header-fields">
              <mat-form-field appearance="outline">
                <mat-label>تاريخ القيد</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="entryDate">
                <mat-datepicker-toggle matSuffix [for]="picker" />
                <mat-datepicker #picker />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>البيان</mat-label>
                <input matInput formControlName="description">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>المرجع (اختياري)</mat-label>
                <input matInput formControlName="reference">
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Lines -->
        <mat-card style="margin-top: 16px;">
          <mat-card-header>
            <mat-card-title>سطور القيد</mat-card-title>
            <div style="margin-right: auto; display: flex; gap: 8px;">
              <button mat-stroked-button type="button" (click)="addLine('debit')">
                <mat-icon>add</mat-icon> سطر مدين
              </button>
              <button mat-stroked-button type="button" (click)="addLine('credit')">
                <mat-icon>add</mat-icon> سطر دائن
              </button>
            </div>
          </mat-card-header>
          <mat-card-content>

            <div class="lines-header">
              <span class="col-num">#</span>
              <span class="col-account">الحساب</span>
              <span class="col-desc">البيان</span>
              <span class="col-amount">مدين</span>
              <span class="col-amount">دائن</span>
              <span class="col-action"></span>
            </div>

            @for (line of lines.controls; track $index) {
              <div [formGroupName]="$index" class="line-row">
                <span class="col-num">{{ $index + 1 }}</span>
                <mat-form-field appearance="outline" class="col-account">
                  <mat-select formControlName="accountId" placeholder="اختر الحساب">
                    @for (acc of postableAccounts(); track acc.id) {
                      <mat-option [value]="acc.id">{{ acc.code }} - {{ acc.nameAr }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="col-desc">
                  <input matInput formControlName="description" placeholder="بيان السطر">
                </mat-form-field>
                <mat-form-field appearance="outline" class="col-amount">
                  <input matInput type="number" formControlName="debit" dir="ltr" min="0" step="0.01">
                </mat-form-field>
                <mat-form-field appearance="outline" class="col-amount">
                  <input matInput type="number" formControlName="credit" dir="ltr" min="0" step="0.01">
                </mat-form-field>
                <button mat-icon-button type="button" color="warn" class="col-action"
                        (click)="removeLine($index)" [disabled]="lines.length <= 2">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            }

            <mat-divider style="margin: 16px 0;" />

            <!-- Balance check -->
            <div class="balance-summary" [class.balanced]="isBalanced()" [class.unbalanced]="!isBalanced()">
              <div class="balance-row">
                <span>إجمالي المدين</span>
                <strong class="amount">{{ totalDebit() | number:'1.2-2' }}</strong>
              </div>
              <div class="balance-row">
                <span>إجمالي الدائن</span>
                <strong class="amount">{{ totalCredit() | number:'1.2-2' }}</strong>
              </div>
              <div class="balance-row">
                <span>الفرق</span>
                <strong [class.amount-negative]="!isBalanced()">{{ difference() | number:'1.2-2' }}</strong>
              </div>
              @if (isBalanced()) {
                <div class="balanced-badge">
                  <mat-icon>check_circle</mat-icon> القيد متوازن
                </div>
              } @else {
                <div class="unbalanced-badge">
                  <mat-icon>error</mat-icon> القيد غير متوازن
                </div>
              }
            </div>

          </mat-card-content>
        </mat-card>

        <div class="form-actions" style="margin-top: 16px;">
          <button mat-stroked-button type="button" routerLink="/journal">إلغاء</button>
          <button mat-flat-button color="primary" type="submit"
                  [disabled]="form.invalid || !isBalanced() || saving()">
            <mat-icon>save</mat-icon>
            حفظ كمسودة
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .header-fields { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 12px; }

    .lines-header {
      display: grid;
      grid-template-columns: 40px 2fr 2fr 120px 120px 48px;
      gap: 8px; padding: 0 4px 8px;
      font-size: 0.8rem; font-weight: 600; color: #546e7a;
    }

    .line-row {
      display: grid;
      grid-template-columns: 40px 2fr 2fr 120px 120px 48px;
      gap: 8px; align-items: center;
    }

    .col-num { text-align: center; color: #999; font-weight: 700; }

    .balance-summary {
      padding: 16px; border-radius: 8px; background: #f8f9fa;
    }
    .balance-summary.balanced { border: 1px solid #a5d6a7; background: #f1f8e9; }
    .balance-summary.unbalanced { border: 1px solid #ef9a9a; background: #fff3f3; }

    .balance-row { display: flex; justify-content: space-between; padding: 4px 0; }

    .balanced-badge {
      display: flex; align-items: center; gap: 4px; color: #2e7d32;
      font-weight: 600; margin-top: 8px;
      mat-icon { color: #2e7d32; }
    }
    .unbalanced-badge {
      display: flex; align-items: center; gap: 4px; color: #c62828;
      font-weight: 600; margin-top: 8px;
      mat-icon { color: #c62828; }
    }

    .form-actions { display: flex; justify-content: flex-end; gap: 12px; }
  `]
})
export class JournalCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private journalService = inject(JournalService);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  saving = signal(false);
  postableAccounts = signal<Account[]>([]);

  form = this.fb.group({
    entryDate:   [new Date(), Validators.required],
    description: ['', Validators.required],
    reference:   [''],
    lines:       this.fb.array([this.newLine(0), this.newLine(0)])
  });

  get lines() { return this.form.get('lines') as FormArray; }

  ngOnInit(): void {
    this.accountService.findPostable().subscribe({
      next: res => this.postableAccounts.set(res.data)
    });
  }

  newLine(defaultDebit: number) {
    return this.fb.group({
      accountId:   ['', Validators.required],
      description: [''],
      debit:       [defaultDebit >= 0 ? defaultDebit : 0],
      credit:      [defaultDebit < 0 ? Math.abs(defaultDebit) : 0]
    });
  }

  addLine(type: 'debit' | 'credit'): void {
    this.lines.push(this.fb.group({
      accountId:   ['', Validators.required],
      description: [''],
      debit:       [type === 'debit' ? 0 : 0],
      credit:      [type === 'credit' ? 0 : 0]
    }));
  }

  removeLine(i: number): void { if (this.lines.length > 2) this.lines.removeAt(i); }

  totalDebit(): number {
    return this.lines.controls.reduce((s, l) => s + (+(l.get('debit')?.value ?? 0)), 0);
  }

  totalCredit(): number {
    return this.lines.controls.reduce((s, l) => s + (+(l.get('credit')?.value ?? 0)), 0);
  }

  difference(): number {
    return Math.abs(this.totalDebit() - this.totalCredit());
  }

  isBalanced(): boolean {
    return this.totalDebit() > 0 && Math.abs(this.totalDebit() - this.totalCredit()) < 0.001;
  }

  submit(): void {
    if (this.form.invalid || !this.isBalanced()) return;
    this.saving.set(true);

    const v = this.form.getRawValue();
    const rawDate = v.entryDate;
    const date = rawDate instanceof Date
      ? rawDate.toISOString().split('T')[0]
      : String(rawDate);

    const request: import('../../../core/services/journal.service').CreateJournalRequest = {
      entryDate:   date,
      description: v.description!,
      reference:   v.reference || undefined,
      lines:       v.lines!.map((l: any) => ({
        accountId:   l.accountId,
        description: l.description || undefined,
        debit:       l.debit > 0 ? l.debit : undefined,
        credit:      l.credit > 0 ? l.credit : undefined
      })).filter((l: any) => l.debit || l.credit)
    };

    this.journalService.create(request).subscribe({
      next: () => {
        this.snackBar.open('تم إنشاء القيد', 'إغلاق', { duration: 3000 });
        this.router.navigate(['/journal']);
      },
      error: err => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'حدث خطأ', 'إغلاق', { duration: 4000 });
      }
    });
  }
}
