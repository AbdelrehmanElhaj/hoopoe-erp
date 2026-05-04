import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TenantProfile {
  id: string;
  subdomain: string;
  companyNameAr: string;
  companyNameEn: string;
  vatNumber: string;
  crNumber: string;
  addressAr: string;
  status: string;
  plan: string;
  zatcaOnboarded: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  companyNameAr: string;
  companyNameEn: string;
  crNumber: string;
  addressAr: string;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  private base = '/api/tenant/profile';

  getProfile(): Observable<TenantProfile> {
    return this.http.get<any>(this.base).pipe(map(r => r.data));
  }

  updateProfile(req: UpdateProfileRequest): Observable<TenantProfile> {
    return this.http.put<any>(this.base, req).pipe(map(r => r.data));
  }
}
