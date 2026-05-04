import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ZatcaStatus {
  onboarded: boolean;
  vatNumber: string;
  companyNameAr: string;
  certSerial: string | null;
  onboardedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class ZatcaService {
  private http = inject(HttpClient);
  private base = '/api/zatca';

  status(): Observable<ZatcaStatus> {
    return this.http.get<any>(`${this.base}/status`).pipe(map(r => r.data));
  }

  generateCsr(otp: string): Observable<string> {
    return this.http.post<any>(`${this.base}/generate-csr`, { otp }).pipe(map(r => r.data.csr));
  }

  storeCertificate(certificatePem: string, serialNumber: string): Observable<void> {
    return this.http.post<any>(`${this.base}/store-certificate`, { certificatePem, serialNumber })
      .pipe(map(() => void 0));
  }
}
