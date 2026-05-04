import { Routes } from '@angular/router';

export const CONTACTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/contacts-list.component').then(m => m.ContactsListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./view/contact-view.component').then(m => m.ContactViewComponent)
  }
];
