import { Routes } from '@angular/router';

export const INVOICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/invoice-list.component').then(m => m.InvoiceListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./create/invoice-create.component').then(m => m.InvoiceCreateComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./view/invoice-view.component').then(m => m.InvoiceViewComponent)
  }
];
