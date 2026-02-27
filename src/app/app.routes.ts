import { Routes } from '@angular/router';
import { MainScreen } from './layout/main-screen/main-screen';

export const routes: Routes = [
  // ==========================================
  // 1. AUTHENTICATED ROUTES (Uses Main Layout)
  // ==========================================
  {
    path: '',
    component: MainScreen,
    children: [
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/dashboard/home-screen/home-screen').then(m => m.HomeScreen),
        title: 'Dashboard - EdTech Platform'
      },
      // Cleaned up path: URLs will now be /instructor/courses instead of /course/instructor/courses
      {
        path: '', 
        loadChildren: () =>
          import('./features/courses/course.routes').then(m => m.COURSE_ROUTES)
      },
      {
        path: '', 
        loadChildren: () =>
          import('./features/Users/admin.routes').then(m => m.ADMIN_ROUTES)
      }
    ]
  },

  // ==========================================
  // 2. PUBLIC / AUTH ROUTES (No Layout)
  // ==========================================
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // ==========================================
  // 3. WILDCARD / FALLBACK
  // ==========================================
  {
    path: '**',
    redirectTo: '/home'
  }
];