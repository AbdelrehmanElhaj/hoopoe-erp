import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'trial-balance',
    loadComponent: () => import('./trial-balance/trial-balance.component').then(m => m.TrialBalanceComponent)
  },
  {
    path: 'vat',
    loadComponent: () => import('./vat-report/vat-report.component').then(m => m.VatReportComponent)
  },
  {
    path: 'income-statement',
    loadComponent: () => import('./income-statement/income-statement.component').then(m => m.IncomeStatementComponent)
  },
  {
    path: 'balance-sheet',
    loadComponent: () => import('./balance-sheet/balance-sheet.component').then(m => m.BalanceSheetComponent)
  }
];
