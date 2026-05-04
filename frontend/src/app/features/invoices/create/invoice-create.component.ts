import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DecimalPipe } from '@angular/common';
import { InvoiceService } from '../../../core/services/invoice.service';
import { saudiVatValidator } from '../../../shared/validators/vat-number.validator';

@Component({
  selector: 'app-invoice-create',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, DecimalPipe,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDividerModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>فاتورة جديدة</h1>
        <button mat-stroked-button routerLink="/invoices">
          <mat-icon>arrow_forward</mat-icon>
          العودة
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-grid">

          <!-- Invoice Info -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>بيانات الفاتورة</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="field-row">
                <mat-form-field appearance="outline">
                  <mat-label>نوع الفاتورة</mat-label>
                  <mat-select formControlName="invoiceType">
                    <mat-option value="STANDARD">فاتورة ضريبية (B2B)</mat-option>
                    <mat-option value="SIMPLIFIED">فاتورة مبسّطة (B2C)</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <p class="form-section-title">بيانات البائع</p>
              <div class="field-row">
                <mat-form-field appearance="outline">
                  <mat-label>اسم الشركة</mat-label>
                  <input matInput formControlName="sellerNameAr">
                  @if (f['sellerNameAr'].hasError('required')) {
                    <mat-error>مطلوب</mat-error>
                  }
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>الرقم الضريبي للبائع</mat-label>
                  <input matInput formControlName="sellerVatNumber" dir="ltr" maxlength="15">
                  @if (f['sellerVatNumber'].hasError('invalidVat')) {
                    <mat-error>15 رقماً تبدأ بـ 3</mat-error>
                  }
                </mat-form-field>
              </div>

              <p class="form-section-title">بيانات المشتري</p>
              <div class="field-row">
                <mat-form-field appearance="outline">
                  <mat-label>اسم المشتري</mat-label>
                  <input matInput formControlName="buyerName">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>الرقم الضريبي للمشتري</mat-label>
                  <input matInput formControlName="buyerVatNumber" dir="ltr" maxlength="15">
                  @if (f['buyerVatNumber'].hasError('invalidVat')) {
                    <mat-error>15 رقماً تبدأ بـ 3</mat-error>
                  }
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Invoice Items -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>بنود الفاتورة</mat-card-title>
              <div class="card-header-actions">
                <button mat-stroked-button type="button" (click)="addItem()">
                  <mat-icon>add</mat-icon>
                  إضافة بند
                </button>
              </div>
            </mat-card-header>
            <mat-card-content>

              @for (item of items.controls; track $index) {
                <div [formGroupName]="$index" class="item-row">
                  <div class="item-header">
                    <span class="item-number">{{ $index + 1 }}</span>
                    <button mat-icon-button type="button" color="warn"
                            (click)="removeItem($index)" [disabled]="items.length <= 1">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>

                  <mat-form-field appearance="outline">
                    <mat-label>الوصف</mat-label>
                    <input matInput formControlName="descriptionAr">
                  </mat-form-field>

                  <div class="item-numbers">
                    <mat-form-field appearance="outline">
                      <mat-label>الكمية</mat-label>
                      <input matInput type="number" formControlName="quantity" dir="ltr" min="0.0001">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>سعر الوحدة</mat-label>
                      <input matInput type="number" formControlName="unitPrice" dir="ltr" min="0">
                      <span matSuffix>ر.س</span>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>الخصم %</mat-label>
                      <input matInput type="number" formControlName="discountPercent" dir="ltr" min="0" max="100">
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>الضريبة</mat-label>
                      <mat-select formControlName="taxCategory">
                        <mat-option value="STANDARD">15% خاضع</mat-option>
                        <mat-option value="ZERO_RATED">0% صفري</mat-option>
                        <mat-option value="EXEMPT">معفي</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="item-totals">
                    <span>المجموع: <strong class="amount">{{ lineTotal($index) | number:'1.2-2' }}</strong> ر.س</span>
                    <span>ض.ق.م: <strong class="amount">{{ lineVat($index) | number:'1.2-2' }}</strong> ر.س</span>
                  </div>

                  <mat-divider />
                </div>
              }

              <!-- Grand totals -->
              <div class="invoice-totals">
                <div class="total-row">
                  <span>المجموع قبل الضريبة</span>
                  <span class="amount">{{ taxableTotal() | number:'1.2-2' }} ر.س</span>
                </div>
                <div class="total-row">
                  <span>ضريبة القيمة المضافة (15%)</span>
                  <span class="amount">{{ vatTotal() | number:'1.2-2' }} ر.س</span>
                </div>
                <mat-divider />
                <div class="total-row grand-total">
                  <span>الإجمالي</span>
                  <span class="amount">{{ grandTotal() | number:'1.2-2' }} ر.س</span>
                </div>
              </div>

            </mat-card-content>
          </mat-card>

        </div>

        <!-- Submit buttons -->
        <div class="form-actions">
          <button mat-stroked-button type="button" routerLink="/invoices">إلغاء</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
            @if (saving()) { <mat-spinner diameter="20" /> }
            @else { <mat-icon>save</mat-icon> }
            حفظ كمسودة
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    .form-grid { display: flex; flex-direction: column; gap: 16px; }

    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .card-header-actions { margin-right: auto; }

    .item-row { margin: 12px 0; }
    .item-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .item-number { font-weight: 700; color: #1a237e; font-size: 1rem; }

    .item-numbers { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; }

    .item-totals {
      display: flex; gap: 24px; padding: 8px 0;
      color: #546e7a; font-size: 0.9rem;
      strong { color: #1a237e; }
    }

    .invoice-totals {
      margin-top: 16px; padding: 16px;
      background: #f8f9fa; border-radius: 8px;
    }
    .total-row {
      display: flex; justify-content: space-between;
      padding: 6px 0; font-size: 0.95rem;
    }
    .grand-total { font-size: 1.1rem; font-weight: 700; color: #1a237e; margin-top: 8px; }

    .form-actions {
      display: flex; justify-content: flex-end;
      gap: 12px; margin-top: 16px;
    }
  `]
})
export class InvoiceCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  saving = signal(false);

  form = this.fb.group({
    invoiceType:      ['SIMPLIFIED', Validators.required],
    sellerNameAr:     ['', Validators.required],
    sellerVatNumber:  ['', [Validators.required, saudiVatValidator]],
    buyerName:        [''],
    buyerVatNumber:   ['', saudiVatValidator],
    items: this.fb.array([this.newItem()])
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
    const discount = total * ((g.discountPercent ?? 0) / 100);
    return total - discount;
  }

  lineVat(i: number): number {
    const g = this.items.at(i).value;
    return g.taxCategory === 'STANDARD' ? this.lineTotal(i) * 0.15 : 0;
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
      invoiceType:      v.invoiceType!,
      sellerNameAr:     v.sellerNameAr!,
      sellerVatNumber:  v.sellerVatNumber!,
      buyerName:        v.buyerName || undefined,
      buyerVatNumber:   v.buyerVatNumber || undefined,
      items:            v.items!.map((item: any) => ({
        descriptionAr:   item.descriptionAr,
        quantity:        item.quantity,
        unitPrice:       item.unitPrice,
        discountPercent: item.discountPercent || 0,
        taxCategory:     item.taxCategory
      }))
    };

    this.invoiceService.create(request as any).subscribe({
      next: res => {
        this.snackBar.open('تم إنشاء الفاتورة بنجاح', 'إغلاق', { duration: 3000 });
        this.router.navigate(['/invoices', res.data.id]);
      },
      error: err => {
        this.saving.set(false);
        this.snackBar.open(err.error?.message ?? 'حدث خطأ', 'إغلاق', { duration: 4000 });
      }
    });
  }
}
