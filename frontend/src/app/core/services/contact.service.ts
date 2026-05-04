import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Contact {
  id: string;
  nameAr: string;
  nameEn: string | null;
  contactType: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  vatNumber: string | null;
  crNumber: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateContactRequest {
  nameAr: string;
  nameEn?: string;
  contactType: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  vatNumber?: string;
  crNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdateContactRequest extends CreateContactRequest {
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly BASE = '/api/contacts';

  constructor(private http: HttpClient) {}

  findAll(type?: string, search?: string, page = 0, size = 20): Observable<{ data: { content: Contact[] } }> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (type) params = params.set('type', type);
    if (search) params = params.set('search', search);
    return this.http.get<{ data: { content: Contact[] } }>(this.BASE, { params });
  }

  findById(id: string): Observable<{ data: Contact }> {
    return this.http.get<{ data: Contact }>(`${this.BASE}/${id}`);
  }

  create(request: CreateContactRequest): Observable<{ data: Contact }> {
    return this.http.post<{ data: Contact }>(this.BASE, request);
  }

  update(id: string, request: UpdateContactRequest): Observable<{ data: Contact }> {
    return this.http.put<{ data: Contact }>(`${this.BASE}/${id}`, request);
  }

  deactivate(id: string): Observable<{ data: null }> {
    return this.http.delete<{ data: null }>(`${this.BASE}/${id}`);
  }
}
