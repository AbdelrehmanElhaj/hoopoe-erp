import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Divider } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { InvoiceService } from '../../../core/services/invoice.service';
import { saudiVatValidator } from '../../../shared/validators/vat-number.validator';

@Component({
  selector: 'app-invoice-create',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, DecimalPipe,
    Button, InputText, Select, Divider
  ],
  template: `
    <div class="page-wrap" dir="rtl">

      <div class="page-header">
        <h1 class="page-title">فاتورة جديدة</h1>
        <p-button label="العودة" icon="pi pi-arrow-left" iconPos="right"
                  [outlined]="true" routerLink="/invoices" />
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-grid">

          <!-- Invoice info card -->
          <div class="section-card">
            <div class="section-title">بيانات الفاتورة</div>

            <div class="field-row">
              <div class="field">
                <label>نوع الفاتورة</label>
                <p-select formControlName="invoiceType"
                          [options]="invoiceTypeOptions"
                          optionLabel="label" optionValue="value"
                          styleClass="w-full" />
              </div>
            </div>

            <div class="sub-title">بيانات البائع</div>
            <div class="field-row two-col">
              <div class="field">
                <label>اسم الشركة</label>
                <input pInputText formControlName="sellerNameAr" class="w-full" />
                @if (f['sellerNameAr'].touched && f['sellerNameAr'].hasError('required')) {
                  <small class="error-msg">مطلوب</small>
                }
              </div>
              <div class="field">
                <label>الرقم الضريبي للبائع</label>
                <input pInputText formControlName="sellerVatNumber" dir="ltr" maxlength="15" class="w-full" />
                @if (f['sellerVatNumber'].touched && f['sellerVatNumber'].hasError('invalidVat')) {
                  <small class="error-msg">15 رقماً تبدأ بـ 3</small>
                }
              </div>
            </div>

            <div class="sub-title">بيانات المشتري</div>
            <div class="field-row two-col">
              <div class="field">
                <label>اسم المشتري</label>
                <input pInputText formControlName="buyerName" class="w-full" />
              </div>
              <div class="field">
                <label>الرقم الضريبي للمشتري</label>
                <input pInputText formControlName="buyerVatNumber" dir="ltr" maxlength="15" class="w-full" />
                @if (f['buyerVatNumber'].touched && f['buyerVatNumber'].hasError('invalidVat')) {
                  <small class="error-msg">15 رقماً تبدأ بـ 3</small>
                }
              </div>
            </div>
          </div>

          <!-- Items card -->
          <div class="section-card">
            <div class="section-header">
              <div class="section-title">بنود الفاتورة</div>
              <p-button label="إضافة بند" icon="pi pi-plus" iconPos="right"
                        [outlined]="true" size="small" type="button"
                        (onClick)="addItem()" />
            </div>

            @for (item of items.controls; track $index) {
              <div [formGroupName]="$index" class="item-block">
                <div class="item-header">
                  <span class="item-number">{{ $index + 1 }}</span>
                  <p-button icon="pi pi-trash" [text]="true" [rounded]="true"
                            severity="danger" type="button"
                            [disabled]="items.length <= 1"
                            (onClick)="removeItem($index)" />
                </div>

                <div class="field">
                  <label>الوصف</label>
                  <input pInputText formControlName="descriptionAr" class="w-full" />
                </div>

                <div class="item-numbers">
                  <div class="field">
                    <label>الكمية</label>
                    <input pInputText type="number" formControlName="quantity" dir="ltr" min="0.0001" class="w-full" />
                  </div>
                  <div class="field">
                    <label>سعر الوحدة (ر.س)</label>
                    <input pInputText type="number" formControlName="unitPrice" dir="ltr" min="0" class="w-full" />
                  </div>
                  <div class="field">
                    <label>الخصم %</label>
                    <input pInputText type="number" formControlName="discountPercent" dir="ltr" min="0" max="100" class="w-full" />
                  </div>
                  <div class="field">
                    <label>الضريبة</label>
                    <p-select formControlName="taxCategory"
                              [options]="taxCategoryOptions"
                              optionLabel="label" optionValue="value"
                              styleClass="w-full" />
                  </div>
                </div>

                <div class="item-totals">
                  <span>المجموع: <strong>{{ lineTotal($index) | number:'1.2-2' }}</strong> ر.س</span>
                  <span>ض.ق.م: <strong>{{ lineVat($index) | number:'1.2-2' }}</strong> ر.س</span>
                </div>

                @if (!$last) {
                  <p-divider />
                }
              </div>
            }

            <!-- Grand totals -->
            <div class="invoice-totals">
              <div class="total-row">
                <span>المجموع قبل الضريبة</span>
                <span class="mono">{{ taxableTotal() | number:'1.2-2' }} ر.س</span>
              </div>
              <div class="total-row">
                <span>ضريبة القيمة المضافة (15%)</span>
                <span class="mono">{{ vatTotal() | number:'1.2-2' }} ر.س</span>
              </div>
              <p-divider />
              <div class="total-row grand-total">
                <span>الإجمالي</span>
                <span class="mono">{{ grandTotal() | number:'1.2-2' }} ر.س</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Actions -->
        <div class="form-actions">
          <p-button label="إلغاء" [outlined]="true" type="button" routerLink="/invoices" />
          <p-button label="حفظ كمسودة" icon="pi pi-save" iconPos="right"
                    type="submit" [loading]="saving()"
                    [disabled]="form.invalid || saving()" />
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

    .form-grid { display: flex; flex-direction: column; gap: 16px; }

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

    .sub-title {
      font-size: 0.88rem; font-weight: 700; color: #546e7a;
      margin: 16px 0 10px; padding-bottom: 4px;
      border-bottom: 1px solid #f0f0f0;
    }

    .field-row { margin-bottom: 8px; }
    .field-row.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 0.83rem; font-weight: 600; color: #546e7a; }
    .error-msg { color: #c62828; font-size: 0.78rem; }

    /* Item block */
    .item-block { margin: 12px 0; }
    .item-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 10px;
    }
    .item-number { font-weight: 700; color: #1a237e; font-size: 1rem; }

    .item-numbers { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin: 10px 0; }

    .item-totals {
      display: flex; gap: 24px; padding: 8px 0;
      color: #546e7a; font-size: 0.9rem;
      strong { color: #1a237e; font-family: monospace; }
    }

    /* Totals */
    .invoice-totals {
      margin-top: 16px; padding: 16px;
      background: #f8f9fa; border-radius: 8px;
    }
    .total-row {
      display: flex; justify-content: space-between;
      padding: 6px 0; font-size: 0.95rem;
    }
    .grand-total { font-size: 1.1rem; font-weight: 700; color: #1a237e; margin-top: 8px; }
    .mono { font-family: monospace; direction: ltr; }

    /* Actions */
    .form-actions {
      display: flex; justify-content: flex-end;
      gap: 12px; margin-top: 16px;
    }

    .w-full { width: 100%; }
  `]
})
export class InvoiceCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);
  private toast = inject(MessageService);

  saving = signal(false);

  invoiceTypeOptions = [
    { label: 'فاتورة ضريبية (B2B)', value: 'STANDARD' },
    { label: 'فاتورة مبسّطة (B2C)',  value: 'SIMPLIFIED' },
  ];

  taxCategoryOptions = [
    { label: '15% خاضع',  value: 'STANDARD' },
    { label: '0% صفري',   value: 'ZERO_RATED' },
    { label: 'معفي',      value: 'EXEMPT' },
  ];

  form = this.fb.group({
    invoiceType:     ['SIMPLIFIED', Validators.required],
    sellerNameAr:    ['', Validators.required],
    sellerVatNumber: ['', [Validators.required, saudiVatValidator]],
    buyerName:       [''],
    buyerVatNumber:  ['', saudiVatValidator],
    items:           this.fb.array([this.newItem()])
  });

  get f() { return this.form.controls as Record<string, AbstractControl>; }
  get items() { return this.form.get('items') as FormArray; }

  ngOnInit(): void {}

  newItem() {
    return this.fb.group({
      descriptionAr:   ['', Validators.required],
      quantity:        [1, [Validators.required, Validators.min(0.0001)]],
      unitPrice:       [0, [Validators.required, Validators.min(0)]],
      discountPercent: [0],
      taxCategory:     ['STANDARD', Validators.required]
    });
  }

  addItem(): void { this.items.push(this.newItem()); }

  removeItem(i: number): void { if (this.items.length > 1) this.items.removeAt(i); }

  lineTotal(i: number): number {
    const g = this.items.at(i).value;
    const total = (g.quantity ?? 0) * (g.unitPrice ?? 0);
    return total - total * ((g.discountPercent ?? 0) / 100);
  }

  lineVat(i: number): number {
    return this.items.at(i).value.taxCategory === 'STANDARD' ? this.lineTotal(i) * 0.15 : 0;
  }

  taxableTotal(): number {
    return this.items.controls.reduce((s, _, i) => s + this.lineTotal(i), 0);
  }

  vatTotal(): number {
    return this.items.controls.reduce((s, _, i) => s + this.lineVat(i), 0);
  }

  grandTotal(): number { return this.taxableTotal() + this.vatTotal(); }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const v = this.form.getRawValue();
    const request = {
      invoiceType:     v.invoiceType!,
      sellerNameAr:    v.sellerNameAr!,
      sellerVatNumber: v.sellerVatNumber!,
      buyerName:       v.buyerName || undefined,
      buyerVatNumber:  v.buyerVatNumber || undefined,
      items:           v.items!.map((item: any) => ({
        descriptionAr:   item.descriptionAr,
        quantity:        item.quantity,
        unitPrice:       item.unitPrice,
        discountPercent: item.discountPercent || 0,
        taxCategory:     item.taxCategory
      }))
    };

    this.invoiceService.create(request as any).subscribe({
      next: res => {
        this.toast.add({ severity: 'success', summary: 'تم', detail: 'تم إنشاء الفاتورة بنجاح', life: 3000 });
        this.router.navigate(['/invoices', res.data.id]);
      },
      error: err => {
        this.saving.set(false);
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message ?? 'حدث خطأ', life: 4000 });
      }
    });
  }
}
