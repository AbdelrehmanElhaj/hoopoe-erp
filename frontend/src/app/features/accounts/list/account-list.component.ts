import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { AccountService, Account } from '../../../core/services/account.service';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TableModule, Button, InputText, Select, Tag
  ],
  template: `
    <div class="page-wrap" dir="rtl">

      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">دليل الحسابات</h1>
        <p-button
          [label]="showForm() ? 'إلغاء' : 'حساب جديد'"
          [icon]="showForm() ? 'pi pi-times' : 'pi pi-plus'"
          iconPos="right"
          [severity]="showForm() ? 'secondary' : 'primary'"
          (onClick)="showForm.set(!showForm())" />
      </div>

      <!-- Add form -->
      @if (showForm()) {
        <div class="add-form-card">
          <div class="add-form-title">إضافة حساب جديد</div>
          <form [formGroup]="form" (ngSubmit)="save()" class="account-form">
            <div class="field">
              <label>كود الحساب</label>
              <input pInputText formControlName="code" dir="ltr" placeholder="مثال: 110103" class="w-full" />
            </div>
            <div class="field">
              <label>اسم الحساب (عربي)</label>
              <input pInputText formControlName="nameAr" class="w-full" />
            </div>
            <div class="field">
              <label>نوع الحساب</label>
              <p-select formControlName="accountType"
                        [options]="accountTypeOptions"
                        optionLabel="label" optionValue="value"
                        placeholder="اختر النوع" styleClass="w-full" />
            </div>
            <div class="field">
              <label>الرصيد الطبيعي</label>
              <p-select formControlName="normalBalance"
                        [options]="normalBalanceOptions"
                        optionLabel="label" optionValue="value"
                        placeholder="اختر الرصيد" styleClass="w-full" />
            </div>
            <div class="field">
              <label>الحساب الأب (اختياري)</label>
              <p-select formControlName="parentId"
                        [options]="parentOptions()"
                        optionLabel="label" optionValue="value"
                        placeholder="— بدون أب —" styleClass="w-full" />
            </div>
            <div class="form-actions">
              <p-button label="حفظ" icon="pi pi-save" iconPos="right"
                        type="submit"
                        [disabled]="form.invalid || saving()"
                        [loading]="saving()" />
            </div>
          </form>
        </div>
      }

      <!-- Type filter pills -->
      <div class="filters-bar">
        @for (f of typeFilters; track f.value) {
          <button class="filter-btn" [class.filter-btn--active]="selectedType() === f.value"
                  (click)="filterType(f.value)">
            {{ f.label }}
          </button>
        }
      </div>

      <!-- Accounts table -->
      <p-table [value]="filtered()" [loading]="loading()"
               styleClass="accounts-table" [rowHover]="true">

        <ng-template pTemplate="header">
          <tr>
            <th>الكود</th>
            <th>اسم الحساب</th>
            <th>النوع</th>
            <th>الرصيد الطبيعي</th>
            <th>المستوى</th>
            <th>قابل للترحيل</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-a>
          <tr [class.inactive-row]="!a.active">
            <td>
              <span [style.paddingRight.px]="(a.level - 1) * 16" dir="ltr"
                    [style.fontWeight]="a.leaf ? 'normal' : '700'">
                {{ a.code }}
              </span>
            </td>
            <td [style.fontWeight]="a.leaf ? 'normal' : '600'">{{ a.nameAr }}</td>
            <td>
              <p-tag [value]="typeLabel(a.accountType)"
                     [severity]="typeSeverity(a.accountType)"
                     [rounded]="true" />
            </td>
            <td>{{ a.normalBalance === 'DEBIT' ? 'مدين' : 'دائن' }}</td>
            <td>{{ a.level }}</td>
            <td>
              <i [class]="a.leaf ? 'pi pi-check-circle' : 'pi pi-minus'"
                 [style.color]="a.leaf ? '#2e7d32' : '#9e9e9e'"
                 [style.fontSize.px]="16"></i>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" class="empty-cell">
              <i class="pi pi-book empty-icon"></i>
              <p>لا توجد حسابات. أضف أول حساب!</p>
            </td>
          </tr>
        </ng-template>

      </p-table>

    </div>
  `,
  styles: [`
    .page-wrap { padding: 24px; max-width: 1200px; margin: 0 auto; }

    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 20px;
    }
    .page-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1a237e; }

    /* Add form card */
    .add-form-card {
      background: white; border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,.07);
      padding: 20px; margin-bottom: 16px;
    }
    .add-form-title { font-size: 1rem; font-weight: 700; color: #1a237e; margin-bottom: 16px; }

    .account-form {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;
    }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 0.83rem; font-weight: 600; color: #546e7a; }

    .form-actions {
      grid-column: 1 / -1; display: flex; justify-content: flex-end;
      padding-top: 4px;
    }

    /* Filter pills */
    .filters-bar {
      display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;
    }
    .filter-btn {
      padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;
      border: 1.5px solid #d0d0d0; background: white; color: #555;
      cursor: pointer; transition: all .15s; font-family: 'Cairo', sans-serif;
    }
    .filter-btn:hover { border-color: #1a237e; color: #1a237e; }
    .filter-btn--active {
      background: #1a237e !important; color: white !important; border-color: #1a237e !important;
    }

    /* Table */
    ::ng-deep .accounts-table {
      border-radius: 12px; overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,.07);

      .p-datatable-header-cell { background: #f5f7fb; font-weight: 700; color: #546e7a; font-size: 0.82rem; }
    }
    .inactive-row { opacity: 0.4; }

    .empty-cell {
      text-align: center; padding: 48px;
    }
    .empty-icon { font-size: 3rem; color: #cfd8dc; display: block; margin-bottom: 12px; }
    .empty-cell p { color: #b0bec5; margin: 0; }

    .w-full { width: 100%; }
  `]
})
export class AccountListComponent implements OnInit {
  private accountService = inject(AccountService);
  private toast = inject(MessageService);
  private fb = inject(FormBuilder);

  accounts  = signal<Account[]>([]);
  filtered  = signal<Account[]>([]);
  loading   = signal(true);
  saving    = signal(false);
  showForm  = signal(false);
  selectedType = signal('');

  typeFilters = [
    { value: '',          label: 'الكل' },
    { value: 'ASSET',     label: 'أصول' },
    { value: 'LIABILITY', label: 'خصوم' },
    { value: 'EQUITY',    label: 'حقوق ملكية' },
    { value: 'REVENUE',   label: 'إيرادات' },
    { value: 'EXPENSE',   label: 'مصروفات' },
  ];

  accountTypeOptions = [
    { label: 'أصول',        value: 'ASSET' },
    { label: 'خصوم',        value: 'LIABILITY' },
    { label: 'حقوق ملكية', value: 'EQUITY' },
    { label: 'إيرادات',     value: 'REVENUE' },
    { label: 'مصروفات',     value: 'EXPENSE' },
  ];

  normalBalanceOptions = [
    { label: 'مدين', value: 'DEBIT' },
    { label: 'دائن', value: 'CREDIT' },
  ];

  parentOptions = computed(() => [
    { label: '— بدون أب —', value: null },
    ...this.accounts().map(a => ({ label: `${a.code} - ${a.nameAr}`, value: a.id }))
  ]);

  form = this.fb.group({
    code:          ['', Validators.required],
    nameAr:        ['', Validators.required],
    accountType:   ['', Validators.required],
    normalBalance: ['', Validators.required],
    parentId:      [null as string | null]
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.accountService.findAll().subscribe({
      next: res => {
        const sorted = res.data.sort((a, b) => a.code.localeCompare(b.code));
        this.accounts.set(sorted);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filterType(type: string): void {
    this.selectedType.set(type);
    this.applyFilter();
  }

  private applyFilter(): void {
    const type = this.selectedType();
    this.filtered.set(type ? this.accounts().filter(a => a.accountType === type) : this.accounts());
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.accountService.create(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.form.reset();
        this.toast.add({ severity: 'success', summary: 'تم', detail: 'تم إضافة الحساب', life: 3000 });
        this.load();
      },
      error: err => {
        this.saving.set(false);
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message ?? 'حدث خطأ', life: 4000 });
      }
    });
  }

  typeLabel(t: string): string {
    return ({ ASSET: 'أصول', LIABILITY: 'خصوم', EQUITY: 'حقوق ملكية', REVENUE: 'إيرادات', EXPENSE: 'مصروفات' } as Record<string, string>)[t] ?? t;
  }

  typeSeverity(t: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return ({ ASSET: 'info', LIABILITY: 'danger', EQUITY: 'secondary', REVENUE: 'success', EXPENSE: 'warn' } as Record<string, any>)[t] ?? 'secondary';
  }
}
