// app.routes.ts (updated)
import { Routes } from '@angular/router';
import { MainScreen } from './layout/main-screen/main-screen';
import { AuthGuard } from './core/authentication/guards/auth.guard';

export const routes: Routes = [
  // Public / authenticated pages that use the dashboard layout
  {
    path: '',
    component: MainScreen,
    canActivate: [AuthGuard],
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
        title: 'Home - EdTech Platform'
      },
      // ... other existing routes

      // Course routes (public and protected)
      {
        path: '',
        loadChildren: () =>
          import('./features/courses/course.routes').then(m => m.COURSE_ROUTES)
      },

      // Category routes
      {
        path: '',
        loadChildren: () =>
          import('./features/category/category.routes').then(m => m.CATEGORY_ROUTES)
      },

      // Lesson routes
      {
        path: '',
        loadChildren: () =>
          import('./features/lesson/lesson.routes').then(m => m.LESSON_ROUTES)
      }
    ]
  },

  // Auth routes
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Wildcard
  {
    path: '**',
    redirectTo: '/home'
  }
];
// import { Routes } from '@angular/router';
// import { MainScreen } from './layout/main-screen/main-screen';

// export const routes: Routes = [
//   // ==========================================
//   // 1. AUTHENTICATED ROUTES (Uses Main Layout)
//   // ==========================================
//   {
//     path: '',
//     component: MainScreen,
//     children: [
//       {
//         path: '',
//         redirectTo: '/home',
//         pathMatch: 'full'
//       },
//       {
//         path: 'home',
//         loadComponent: () =>
//           import('./features/dashboard/home-screen/home-screen').then(m => m.HomeScreen),
//         title: 'Dashboard - EdTech Platform'
//       },
//       // Cleaned up path: URLs will now be /instructor/courses instead of /course/instructor/courses
//       {
//         path: '', 
//         loadChildren: () =>
//           import('./features/courses/course.routes').then(m => m.COURSE_ROUTES)
//       },
//       {
//         path: '', 
//         loadChildren: () =>
//           import('./features/Users/admin.routes').then(m => m.ADMIN_ROUTES)
//       }
//     ]
//   },

//   // ==========================================
//   // 2. PUBLIC / AUTH ROUTES (No Layout)
//   // ==========================================
//   {
//     path: 'auth',
//     loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
//   },

//   // ==========================================
//   // 3. WILDCARD / FALLBACK
//   // ==========================================
//   {
//     path: '**',
//     redirectTo: '/home'
//   }
// ];