// admin.routes.ts
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./user-list').then(m => m.UserListComponent),
    title: 'User Management - Admin'
  }
];