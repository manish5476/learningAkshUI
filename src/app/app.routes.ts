import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './layout/dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
  {
    // 1. The main shell of the app (Header + Sidebar + Content area)
    path: '',
    component: DashboardLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      // 🟢 PUBLIC ROUTES (Loads inside the layout)
      {
        path: 'home',
        // Note: Make sure the file name and class name below match your actual file exactly!
        loadComponent: () => import('../app/features/dashboard/home-screen/home-screen').then(m => m.HomeScreen),
        title: 'Home - EdTech Platform'
      }
      
      // ... You can uncomment your explore, projects, and locked routes here later!
    ]
  },
  
  // 🔵 AUTHENTICATION ROUTES (Loads outside the layout, taking up the whole screen)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // ⚠️ FALLBACK ROUTE (Catches bad URLs and sends them home)
  {
    path: '**',
    redirectTo: 'home'
  }
];