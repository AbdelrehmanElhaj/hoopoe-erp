import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContactService, Contact } from '../../../core/services/contact.service';

@Component({
  selector: 'app-contact-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال جديدة' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="contact-form">

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>الاسم بالعربي *</mat-label>
            <input matInput formControlName="nameAr" dir="rtl">
            @if (form.get('nameAr')?.hasError('required') && form.get('nameAr')?.touched) {
              <mat-error>الاسم بالعربي مطلوب</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>الاسم بالإنجليزي</mat-label>
            <input matInput formControlName="nameEn">
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>النوع *</mat-label>
            <mat-select formControlName="contactType">
              <mat-option value="CUSTOMER">عميل</mat-option>
              <mat-option value="SUPPLIER">مورد</mat-option>
              <mat-option value="BOTH">عميل ومورد</mat-option>
            </mat-select>
            @if (form.get('contactType')?.hasError('required') && form.get('contactType')?.touched) {
              <mat-error>النوع مطلوب</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>الرقم الضريبي</mat-label>
            <input matInput formControlName="vatNumber" maxlength="20">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>السجل التجاري</mat-label>
            <input matInput formControlName="crNumber" maxlength="20">
          </mat-form-field>
        </div>

        <div class="form-row two-cols">
          <mat-form-field appearance="outline">
            <mat-label>الهاتف</mat-label>
            <mat-icon matPrefix>phone</mat-icon>
            <input matInput formControlName="phone" maxlength="30">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>البريد الإلكتروني</mat-label>
            <mat-icon matPrefix>email</mat-icon>
            <input matInput formControlName="email" type="email" maxlength="150">
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>العنوان</mat-label>
            <input matInput formControlName="address" maxlength="500" dir="rtl">
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>ملاحظات</mat-label>
            <textarea matInput formControlName="notes" rows="3" maxlength="1000" dir="rtl"></textarea>
          </mat-form-field>
        </div>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>إلغاء</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving || form.invalid">
        @if (saving) {
          <mat-spinner diameter="18" />
        } @else {
          <mat-icon>save</mat-icon>
        }
        حفظ
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .contact-form { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; }
    .form-row { width: 100%; }
    .full-width { width: 100%; }
    .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    mat-spinner { display: inline-block; }
    mat-dialog-content { min-width: 480px; }
  `]
})
export class ContactFormDialogComponent {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  dialogRef = inject(MatDialogRef<ContactFormDialogComponent>);

  saving = false;

  form = this.fb.group({
    nameAr:      ['', Validators.required],
    nameEn:      [''],
    contactType: ['CUSTOMER' as 'CUSTOMER' | 'SUPPLIER' | 'BOTH', Validators.required],
    vatNumber:   [''],
    crNumber:    [''],
    phone:       [''],
    email:       [''],
    address:     [''],
    notes:       [''],
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: Contact | null) {
    if (data) {
      this.form.patchValue({
        nameAr:      data.nameAr,
        nameEn:      data.nameEn ?? '',
        contactType: data.contactType,
        vatNumber:   data.vatNumber ?? '',
        crNumber:    data.crNumber ?? '',
        phone:       data.phone ?? '',
        email:       data.email ?? '',
        address:     data.address ?? '',
        notes:       data.notes ?? '',
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const val = this.form.value;
    const req = {
      nameAr:      val.nameAr!,
      nameEn:      val.nameEn || undefined,
      contactType: val.contactType!,
      vatNumber:   val.vatNumber || undefined,
      crNumber:    val.crNumber || undefined,
      phone:       val.phone || undefined,
      email:       val.email || undefined,
      address:     val.address || undefined,
      notes:       val.notes || undefined,
    };

    const call = this.data
      ? this.contactService.update(this.data.id, req)
      : this.contactService.create(req);

    call.subscribe({
      next: res => { this.saving = false; this.dialogRef.close(res.data); },
      error: () => { this.saving = false; }
    });
  }
}
