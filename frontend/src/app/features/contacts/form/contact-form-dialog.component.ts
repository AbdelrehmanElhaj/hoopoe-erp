import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { ContactService, Contact } from '../../../core/services/contact.service';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [ReactiveFormsModule, Button, InputText, Select, Textarea],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()" class="contact-form" dir="rtl">

      <div class="field">
        <label>الاسم بالعربي <span class="req">*</span></label>
        <input pInputText formControlName="nameAr" class="w-full" dir="rtl" />
        @if (form.get('nameAr')?.invalid && form.get('nameAr')?.touched) {
          <small class="field-error">الاسم بالعربي مطلوب</small>
        }
      </div>

      <div class="field">
        <label>الاسم بالإنجليزي</label>
        <input pInputText formControlName="nameEn" class="w-full" dir="ltr" />
      </div>

      <div class="field">
        <label>النوع <span class="req">*</span></label>
        <p-select formControlName="contactType"
                  [options]="typeOptions"
                  optionLabel="label" optionValue="value"
                  placeholder="اختر النوع"
                  styleClass="w-full" />
        @if (form.get('contactType')?.invalid && form.get('contactType')?.touched) {
          <small class="field-error">النوع مطلوب</small>
        }
      </div>

      <div class="two-cols">
        <div class="field">
          <label>الرقم الضريبي</label>
          <input pInputText formControlName="vatNumber" class="w-full" dir="ltr" maxlength="20" />
        </div>
        <div class="field">
          <label>السجل التجاري</label>
          <input pInputText formControlName="crNumber" class="w-full" dir="ltr" maxlength="20" />
        </div>
      </div>

      <div class="two-cols">
        <div class="field">
          <label>الهاتف</label>
          <input pInputText formControlName="phone" class="w-full" dir="ltr" maxlength="30" />
        </div>
        <div class="field">
          <label>البريد الإلكتروني</label>
          <input pInputText formControlName="email" type="email" class="w-full" dir="ltr" maxlength="150" />
        </div>
      </div>

      <div class="field">
        <label>العنوان</label>
        <input pInputText formControlName="address" class="w-full" dir="rtl" maxlength="500" />
      </div>

      <div class="field">
        <label>ملاحظات</label>
        <textarea pTextarea formControlName="notes" rows="3" class="w-full" dir="rtl" maxlength="1000"></textarea>
      </div>

      <div class="form-actions">
        <p-button label="إلغاء" severity="secondary" [outlined]="true"
                  type="button" (onClick)="cancelled.emit()" />
        <p-button [label]="data() ? 'حفظ التعديلات' : 'إضافة'"
                  icon="pi pi-save" iconPos="right"
                  type="submit" [loading]="saving"
                  [disabled]="form.invalid" />
      </div>

    </form>
  `,
  styles: [`
    .contact-form { display: flex; flex-direction: column; gap: 14px; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    label { font-size: 0.85rem; font-weight: 600; color: #444; }
    .req { color: #c62828; }
    .field-error { color: #c62828; font-size: 0.78rem; }
    .two-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .w-full { width: 100%; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 8px; }
    ::ng-deep textarea.w-full { width: 100% !important; }
  `]
})
export class ContactFormComponent {
  private fb = inject(FormBuilder);
  private svc = inject(ContactService);

  data = input<Contact | null>(null);
  saved = output<Contact>();
  cancelled = output<void>();

  saving = false;

  typeOptions = [
    { label: 'عميل',       value: 'CUSTOMER' },
    { label: 'مورد',       value: 'SUPPLIER' },
    { label: 'عميل ومورد', value: 'BOTH' },
  ];

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

  ngOnInit(): void {
    const d = this.data();
    if (d) {
      this.form.patchValue({
        nameAr:      d.nameAr,
        nameEn:      d.nameEn ?? '',
        contactType: d.contactType,
        vatNumber:   d.vatNumber ?? '',
        crNumber:    d.crNumber ?? '',
        phone:       d.phone ?? '',
        email:       d.email ?? '',
        address:     d.address ?? '',
        notes:       d.notes ?? '',
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.value;
    const req = {
      nameAr:      v.nameAr!,
      nameEn:      v.nameEn || undefined,
      contactType: v.contactType!,
      vatNumber:   v.vatNumber || undefined,
      crNumber:    v.crNumber || undefined,
      phone:       v.phone || undefined,
      email:       v.email || undefined,
      address:     v.address || undefined,
      notes:       v.notes || undefined,
    };

    const call = this.data()
      ? this.svc.update(this.data()!.id, req)
      : this.svc.create(req);

    call.subscribe({
      next: res => { this.saving = false; this.saved.emit(res.data); },
      error: () => { this.saving = false; }
    });
  }
}
