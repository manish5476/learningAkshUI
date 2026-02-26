import { Routes } from '@angular/router';
import { MainScreen } from './layout/main-screen/main-screen';

export const routes: Routes = [
  // Public / authenticated pages that use the dashboard layout
  {
    path: '',
    component: MainScreen,
    children: [
      {
        path: '',
        redirectTo: '/home', // ✅ Redirects CAN have a leading slash (absolute redirect)
        pathMatch: 'full'
      },
      {
        path: 'home',        // ✅ Paths CANNOT have a leading slash. Changed from '/home'
        loadComponent: () =>
          // Make sure this path exactly matches your folder structure!
          import('./features/dashboard/home-screen/home-screen').then(m => m.HomeScreen),
        title: 'Home - EdTech Platform'
      },
      // ← Add more protected / dashboard routes here later
    ]
  },

  // Auth routes — NO layout, usually plain auth pages
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Wildcard — must be LAST
  {
    path: '**',
    redirectTo: '/home'      // ✅ Added the leading slash so it redirects reliably from anywhere
  }
];