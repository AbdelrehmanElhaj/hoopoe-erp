import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JournalLine {
  accountId: string;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface CreateJournalRequest {
  entryDate: string;   // ISO date YYYY-MM-DD
  description: string;
  reference?: string;
  lines: JournalLine[];
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  reference: string | null;
  status: string;
  sourceType: string | null;
  sourceId: string | null;
  totalDebit: number;
  totalCredit: number;
  postedAt: string | null;
  lines: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  lineNumber: number;
  accountId: string;
  accountCode: string;
  accountNameAr: string;
  debit: number;
  credit: number;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class JournalService {
  private readonly BASE = '/api/journal-entries';

  constructor(private http: HttpClient) {}

  findAll(page = 0, size = 20): Observable<{ data: { content: JournalEntry[] } }> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<{ data: { content: JournalEntry[] } }>(this.BASE, { params });
  }

  findById(id: string): Observable<{ data: JournalEntry }> {
    return this.http.get<{ data: JournalEntry }>(`${this.BASE}/${id}`);
  }

  create(request: CreateJournalRequest): Observable<{ data: JournalEntry }> {
    return this.http.post<{ data: JournalEntry }>(this.BASE, request);
  }

  post(id: string): Observable<{ data: JournalEntry }> {
    return this.http.post<{ data: JournalEntry }>(`${this.BASE}/${id}/post`, {});
  }

  voidEntry(id: string, reason: string): Observable<{ data: JournalEntry }> {
    return this.http.post<{ data: JournalEntry }>(`${this.BASE}/${id}/void`, { reason });
  }
}
