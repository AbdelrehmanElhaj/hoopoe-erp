import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InvoiceStats {
  totalCount: number;
  monthCount: number;
  draftCount: number;
  confirmedCount: number;
  totalRevenue: number;
  monthRevenue: number;
  totalVat: number;
  monthVat: number;
}

export interface JournalStats {
  totalCount: number;
  draftCount: number;
  postedCount: number;
}

export interface ZatcaStats {
  notSubmitted: number;
  pending: number;
  cleared: number;
  reported: number;
  rejected: number;
}

export interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  buyerName: string | null;
  invoiceType: string;
  totalAmount: number;
  status: string;
  zatcaStatus: string;
  issueDatetime: string;
}

export interface RecentJournalEntry {
  id: string;
  entryNumber: string;
  description: string;
  totalDebit: number;
  status: string;
  entryDate: string;
}

export interface DashboardData {
  invoiceStats: InvoiceStats;
  journalStats: JournalStats;
  zatcaStats: ZatcaStats;
  recentInvoices: RecentInvoice[];
  recentJournalEntries: RecentJournalEntry[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}

  getDashboard(): Observable<{ data: DashboardData }> {
    return this.http.get<{ data: DashboardData }>('/api/dashboard');
  }
}
