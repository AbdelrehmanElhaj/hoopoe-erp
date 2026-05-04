import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InvoiceItem {
  descriptionAr: string;
  descriptionEn?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxCategory: 'STANDARD' | 'ZERO_RATED' | 'EXEMPT';
  unitOfMeasure?: string;
}

export interface CreateInvoiceRequest {
  invoiceType: 'STANDARD' | 'SIMPLIFIED';
  sellerNameAr: string;
  sellerVatNumber: string;
  sellerCrNumber?: string;
  sellerAddress?: string;
  buyerName?: string;
  buyerVatNumber?: string;
  items: InvoiceItem[];
}

export interface InvoiceLineItem {
  lineNumber: number;
  descriptionAr: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxableAmount: number;
  taxCategory: string;
  taxRate: number;
  vatAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  uuid: string;
  invoiceType: string;
  sellerNameAr: string;
  sellerVatNumber: string;
  buyerName: string;
  buyerVatNumber: string;
  totalAmount: number;
  vatAmount: number;
  taxableAmount: number;
  subtotal: number;
  discountAmount: number;
  currency: string;
  status: string;
  zatcaStatus: string;
  qrCodeBase64: string;
  issueDatetime: string;
  supplyDate: string;
  dueDate: string;
  creditNote: boolean;
  originalInvoiceId: string | null;
  journalEntryId: string | null;
  items: InvoiceLineItem[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly BASE = '/api/invoices';

  constructor(private http: HttpClient) {}

  create(request: CreateInvoiceRequest): Observable<{ data: Invoice }> {
    return this.http.post<{ data: Invoice }>(this.BASE, request);
  }

  confirm(id: string): Observable<{ data: Invoice }> {
    return this.http.post<{ data: Invoice }>(`${this.BASE}/${id}/confirm`, {});
  }

  findAll(page = 0, size = 20): Observable<{ data: { content: Invoice[] } }> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<{ data: { content: Invoice[] } }>(this.BASE, { params });
  }

  findById(id: string): Observable<{ data: Invoice }> {
    return this.http.get<{ data: Invoice }>(`${this.BASE}/${id}`);
  }

  createCreditNote(id: string, reason: string): Observable<{ data: Invoice }> {
    return this.http.post<{ data: Invoice }>(`${this.BASE}/${id}/credit-note`, { reason });
  }

  downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.BASE}/${id}/pdf`, { responseType: 'blob' });
  }
}
