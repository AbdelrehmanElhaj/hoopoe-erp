import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Divider } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { JournalService } from '../../../core/services/journal.service';
import { AccountService, Account } from '../../../core/services/account.service';

@Component({
  selector: 'app-journal-create',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, DecimalPipe,
    Button, InputText, Select, DatePicker, Divider
  ],
  template: `
    <div class="page-wrap" dir="rtl">

      <div class="page-header">
        <h1 class="page-title">قيد يومي جديد</h1>
        <p-button label="العودة" icon="pi pi-arrow-left" iconPos="right"
                  [outlined]="true" routerLink="/journal" />
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">

        <!-- Header card -->
        <div class="section-card">
          <div class="section-title">رأس القيد</div>
          <div class="header-fields">
            <div class="field">
              <label>تاريخ القيد</label>
              <p-datepicker formControlName="entryDate" dateFormat="yy/mm/dd"
                            [showIcon]="true" styleClass="w-full" />
            </div>
            <div class="field">
              <label>البيان</label>
              <input pInputText formControlName="description" class="w-full" />
            </div>
            <div class="field">
              <label>المرجع (اختياري)</label>
              <input pInputText formControlName="reference" class="w-full" />
            </div>
          </div>
        </div>

        <!-- Lines card -->
        <div class="section-card" style="margin-top: 16px;">
          <div class="section-header">
            <div class="section-title">سطور القيد</div>
            <div class="add-line-btns">
              <p-button label="سطر مدين" icon="pi pi-plus" iconPos="right"
                        [outlined]="true" size="small" type="button"
                        (onClick)="addLine('debit')" />
              <p-button label="سطر دائن" icon="pi pi-plus" iconPos="right"
                        [outlined]="true" size="small" type="button"
                        (onClick)="addLine('credit')" />
            </div>
          </div>

          <!-- Lines header -->
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
              <div class="col-account">
                <p-select formControlName="accountId"
                          [options]="accountOptions()"
                          optionLabel="label" optionValue="value"
                          [filter]="true" filterBy="label"
                          placeholder="اختر الحساب" styleClass="w-full" />
              </div>
              <div class="col-desc">
                <input pInputText formControlName="description"
                       placeholder="بيان السطر" class="w-full" />
              </div>
              <div class="col-amount">
                <input pInputText type="number" formControlName="debit"
                       dir="ltr" min="0" step="0.01" class="w-full" />
              </div>
              <div class="col-amount">
                <input pInputText type="number" formControlName="credit"
                       dir="ltr" min="0" step="0.01" class="w-full" />
              </div>
              <div class="col-action">
                <p-button icon="pi pi-trash" [text]="true" [rounded]="true"
                          severity="danger" type="button"
                          [disabled]="lines.length <= 2"
                          (onClick)="removeLine($index)" />
              </div>
            </div>
          }

          <p-divider />

          <!-- Balance summary -->
          <div class="balance-summary" [class.balanced]="isBalanced()" [class.unbalanced]="!isBalanced()">
            <div class="balance-row">
              <span>إجمالي المدين</span>
              <strong class="mono">{{ totalDebit() | number:'1.2-2' }}</strong>
            </div>
            <div class="balance-row">
              <span>إجمالي الدائن</span>
              <strong class="mono">{{ totalCredit() | number:'1.2-2' }}</strong>
            </div>
            <div class="balance-row">
              <span>الفرق</span>
              <strong class="mono" [class.negative]="!isBalanced()">{{ difference() | number:'1.2-2' }}</strong>
            </div>
            @if (isBalanced()) {
              <div class="balance-badge balance-badge--ok">
                <i class="pi pi-check-circle"></i> القيد متوازن
              </div>
            } @else {
              <div class="balance-badge balance-badge--err">
                <i class="pi pi-exclamation-triangle"></i> القيد غير متوازن
              </div>
            }
          </div>
        </div>

        <!-- Form actions -->
        <div class="form-actions">
          <p-button label="إلغاء" [outlined]="true" type="button" routerLink="/journal" />
          <p-button label="حفظ كمسودة" icon="pi pi-save" iconPos="right"
                    type="submit" [loading]="saving()"
                    [disabled]="form.invalid || !isBalanced() || saving()" />
        </div>

      </form>
    </div>
  `,
  styles: [`
    .page-wrap { padding: 24px; max-width: 1100px; margin: 0 auto; }

    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px;
    }
    .page-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1a237e; }

    /* Section card */
    .section-card {
      background: white; border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,.07);
      padding: 20px;
    }
    .section-title { font-size: 1rem; font-weight: 700; color: #1a237e; margin-bottom: 16px; }

    .section-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 16px;
    }
    .section-header .section-title { margin-bottom: 0; }
    .add-line-btns { display: flex; gap: 8px; }

    /* Header fields */
    .header-fields { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 0.83rem; font-weight: 600; color: #546e7a; }

    /* Lines grid */
    .lines-header, .line-row {
      display: grid;
      grid-template-columns: 40px 2fr 2fr 120px 120px 48px;
      gap: 8px; align-items: center;
    }
    .lines-header {
      padding: 0 4px 8px;
      font-size: 0.8rem; font-weight: 600; color: #546e7a;
      border-bottom: 1px solid #f0f0f0;
    }
    .line-row { padding: 6px 4px; border-bottom: 1px solid #fafafa; }

    .col-num { text-align: center; color: #9e9e9e; font-weight: 700; font-size: 0.85rem; }

    /* Balance summary */
    .balance-summary {
      padding: 16px; border-radius: 8px; background: #f8f9fa;
      border: 1px solid #e0e0e0;
    }
    .balance-summary.balanced   { border-color: #a5d6a7; background: #f1f8e9; }
    .balance-summary.unbalanced { border-color: #ef9a9a; background: #fff3f3; }

    .balance-row {
      display: flex; justify-content: space-between;
      padding: 4px 0; font-size: 0.9rem;
    }
    .mono { font-family: monospace; }
    .negative { color: #c62828; }

    .balance-badge {
      display: flex; align-items: center; gap: 6px;
      font-weight: 600; margin-top: 10px; font-size: 0.9rem;
    }
    .balance-badge--ok  { color: #2e7d32; }
    .balance-badge--err { color: #c62828; }

    /* Form actions */
    .form-actions {
      display: flex; justify-content: flex-end; gap: 12px;
      margin-top: 16px;
    }

    .w-full { width: 100%; }
  `]
})
export class JournalCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private journalService = inject(JournalService);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private toast = inject(MessageService);

  saving = signal(false);
  postableAccounts = signal<Account[]>([]);

  accountOptions = computed(() =>
    this.postableAccounts().map(a => ({ label: `${a.code} - ${a.nameAr}`, value: a.id }))
  );

  form = this.fb.group({
    entryDate:   [new Date(), Validators.required],
    description: ['', Validators.required],
    reference:   [''],
    lines:       this.fb.array([this.newLine(), this.newLine()])
  });

  get lines() { return this.form.get('lines') as FormArray; }

  ngOnInit(): void {
    this.accountService.findPostable().subscribe({
      next: res => this.postableAccounts.set(res.data)
    });
  }

  newLine() {
    return this.fb.group({
      accountId:   ['', Validators.required],
      description: [''],
      debit:       [0],
      credit:      [0]
    });
  }

  addLine(type: 'debit' | 'credit'): void {
    this.lines.push(this.fb.group({
      accountId:   ['', Validators.required],
      description: [''],
      debit:       [0],
      credit:      [0]
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
        this.toast.add({ severity: 'success', summary: 'تم', detail: 'تم إنشاء القيد', life: 3000 });
        this.router.navigate(['/journal']);
      },
      error: err => {
        this.saving.set(false);
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message ?? 'حدث خطأ', life: 4000 });
      }
    });
  }
}
