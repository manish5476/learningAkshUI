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
      },
      //     {
      //   path: 'master',
      //   // Use loadComponent instead of loadChildren for standalone components
      //   loadComponent: () => import('./features/master/components/master-data-grid.component').then(m => m.MasterDataGridComponent)
      // },
      {
        path: 'master',
        // Use loadComponent instead of loadChildren for standalone components
        loadComponent: () => import('./features/master/components/master-container/master-container.component').then(m => m.MasterContainerComponent)
      },
      {
        path: 'certificates',
        loadChildren: () => import('./features/certificates/certificate.routes').then(m => m.CERTIFICATE_ROUTES)
      },
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
