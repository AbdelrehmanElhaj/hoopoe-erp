import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Saudi VAT number: 15 digits starting with 3
export const saudiVatValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as string;
  if (!value) return null;
  const valid = /^3\d{14}$/.test(value);
  return valid ? null : { invalidVat: { message: 'الرقم الضريبي يجب أن يكون 15 رقماً ويبدأ بـ 3' } };
};
