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
      // Course routes: Maps to /courses/...
      {
        path: '',
        loadChildren: () =>
          import('./features/courses/course.routes').then(m => m.COURSE_ROUTES)
      },
      // Category routes: Maps to /categories/...
      {
        path: '',
        loadChildren: () =>
          import('./features/category/category.routes').then(m => m.CATEGORY_ROUTES)
      },
      // Lesson routes: Maps to /lessons/...
      {
        path: '',
        loadChildren: () =>
          import('./features/lesson/lesson.routes').then(m => m.LESSON_ROUTES)
      },
      // Admin routes: Maps to /users
      {
        path: '',
        loadChildren: () => 
          import('./features/Users/admin.routes').then(m => m.ADMIN_ROUTES)
      }
    ]
  },
  // Auth routes: Maps to /auth/login, /auth/signup, etc.
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  // Wildcard fallback
  {
    path: '**',
    redirectTo: '/home'
  }
];