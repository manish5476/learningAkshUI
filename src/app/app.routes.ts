import { Routes } from '@angular/router';
import { MainScreen } from './layout/main-screen/main-screen';
import { AuthGuard } from './core/authentication/guards/auth.guard';

export const routes: Routes = [
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
        loadComponent: () => import('./features/dashboard/home-screen/home-screen').then(m => m.HomeScreen),
        title: 'Home - EdTech Platform'
      },
      // 1. Course Browsing & Playing
      {
        path: '',
        loadChildren: () => import('./core/routes/course.routes').then(m => m.COURSE_ROUTES)
      },
      // 2. Instructor Tools (Dashboard, Course/Quiz Builders)
      {
        path: '',
        loadChildren: () => import('./core/routes/instructor.routes').then(m => m.INSTRUCTOR_ROUTES)
      },
      // 3. Student Mock Tests
      {
        path: '',
        loadChildren: () => import('./core/routes/mock-test.routes').then(m => m.MOCK_TEST_ROUTES)
      },
      // 4. Categories
      {
        path: '',
        loadChildren: () => import('./core/routes/category.routes').then(m => m.CATEGORY_ROUTES)
      },
      // 5. Lessons
      {
        path: '',
        loadChildren: () => import('./features/lesson/lesson.routes').then(m => m.LESSON_ROUTES)
      },
      // 6. Users & Admin
      {
        path: '',
        loadChildren: () => import('./core/routes/admin.routes').then(m => m.ADMIN_ROUTES)
      }
    ]
  },
  // Auth Routes (Login, Signup - outside the MainScreen layout)
  {
    path: 'auth',
    loadChildren: () => import('./core/routes/auth.routes').then(m => m.AUTH_ROUTES)
  },
  // Wildcard fallback
  {
    path: '**',
    redirectTo: '/home'
  }
];

// import { Routes } from '@angular/router';
// import { MainScreen } from './layout/main-screen/main-screen';
// import { AuthGuard } from './core/authentication/guards/auth.guard';

// export const routes: Routes = [
//   // Public / authenticated pages that use the dashboard layout
//   {
//     path: '',
//     component: MainScreen,
//     canActivate: [AuthGuard],
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
//         title: 'Home - EdTech Platform'
//       },
//       // Course routes: Maps to /courses/...
//       {
//         path: '',
//         loadChildren: () =>
//           import('./core/routes/course.routes').then(m => m.COURSE_ROUTES)
//       },
//       // Category routes: Maps to /categories/...
//       {
//         path: '',
//         loadChildren: () =>
//           import('./features/category/category.routes').then(m => m.CATEGORY_ROUTES)
//       },
//       // Lesson routes: Maps to /lessons/...
//       {
//         path: '',
//         loadChildren: () =>
//           import('./features/lesson/lesson.routes').then(m => m.LESSON_ROUTES)
//       },
//       // Admin routes: Maps to /users
//       {
//         path: '',
//         loadChildren: () => 
//           import('./features/Users/admin.routes').then(m => m.ADMIN_ROUTES)
//       }
//     ]
//   },
//   // Auth routes: Maps to /auth/login, /auth/signup, etc.
//   {
//     path: 'auth',
//     loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
//   },
//   // Wildcard fallback
//   {
//     path: '**',
//     redirectTo: '/home'
//   }
// ];