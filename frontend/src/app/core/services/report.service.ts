import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TrialBalanceLine {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  accountType: string;
  normalBalance: string;
  level: number;
  leaf: boolean;
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

export interface VatReport {
  from: string;
  to: string;
  standardRatedSales: number;
  standardRatedVat: number;
  zeroRatedSales: number;
  exemptSales: number;
  creditNotesSales: number;
  creditNotesVat: number;
  totalOutputVat: number;
  inputVat: number;
  netVatPayable: number;
  standardInvoiceCount: number;
  simplifiedInvoiceCount: number;
}

export interface AccountLine {
  code: string;
  nameAr: string;
  nameEn: string;
  level: number;
  leaf: boolean;
  balance: number;
}

export interface IncomeStatement {
  from: string;
  to: string;
  revenueLines: AccountLine[];
  expenseLines: AccountLine[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export interface BalanceSheet {
  asOf: string;
  assetLines: AccountLine[];
  liabilityLines: AccountLine[];
  equityLines: AccountLine[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private base = '/api/reports';

  trialBalance(from: string, to: string): Observable<TrialBalanceLine[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<any>(`${this.base}/trial-balance`, { params })
      .pipe(map(r => r.data));
  }

  vatReport(from: string, to: string): Observable<VatReport> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<any>(`${this.base}/vat`, { params })
      .pipe(map(r => r.data));
  }

  incomeStatement(from: string, to: string): Observable<IncomeStatement> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<any>(`${this.base}/income-statement`, { params })
      .pipe(map(r => r.data));
  }

  balanceSheet(asOf: string): Observable<BalanceSheet> {
    const params = new HttpParams().set('asOf', asOf);
    return this.http.get<any>(`${this.base}/balance-sheet`, { params })
      .pipe(map(r => r.data));
  }
}
