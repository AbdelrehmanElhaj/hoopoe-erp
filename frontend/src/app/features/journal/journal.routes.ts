import { Routes } from '@angular/router';

export const JOURNAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/journal-list.component').then(m => m.JournalListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./create/journal-create.component').then(m => m.JournalCreateComponent)
  }
];
