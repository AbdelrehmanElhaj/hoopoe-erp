import { Routes } from '@angular/router';

export const ZATCA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./zatca.component').then(m => m.ZatcaComponent)
  }
];
