import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Account {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  accountType: string;
  normalBalance: string;
  parentId: string | null;
  parentCode: string | null;
  level: number;
  leaf: boolean;
  active: boolean;
}

export interface AccountRequest {
  code: string;
  nameAr: string;
  nameEn?: string;
  accountType: string;
  normalBalance: string;
  parentId?: string;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly BASE = '/api/accounts';

  constructor(private http: HttpClient) {}

  findAll(): Observable<{ data: Account[] }> {
    return this.http.get<{ data: Account[] }>(this.BASE);
  }

  findPostable(): Observable<{ data: Account[] }> {
    return this.http.get<{ data: Account[] }>(`${this.BASE}/postable`);
  }

  findTree(): Observable<{ data: Account[] }> {
    return this.http.get<{ data: Account[] }>(`${this.BASE}/tree`);
  }

  create(request: AccountRequest): Observable<{ data: Account }> {
    return this.http.post<{ data: Account }>(this.BASE, request);
  }
}
