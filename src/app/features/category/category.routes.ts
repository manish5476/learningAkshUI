// category.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/authentication/guards/auth.guard';

export const CATEGORY_ROUTES: Routes = [
  {
    path: 'categories',
    children: [
      // Public routes
      {
        path: 'list',
        loadComponent: () => import('./components/category-list.component').then(m => m.CategoryListComponent),
        title: 'Category Tree'
      },
      {
        path: 'tree',
        loadComponent: () => import('./components/category-tree.component').then(m => m.CategoryTreeComponent),
        title: 'Category Tree'
      },
      {
        path: ':id/courses',
        loadComponent: () => import('./components/category-courses.component').then(m => m.CategoryCoursesComponent),
        title: 'Category Courses'
      },

      // Admin routes (protected)
      {
        path: 'admin',
        // canActivate: [AuthGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./components/category-list.component').then(m => m.CategoryListComponent),
            title: 'Category Management'
          },
          {
            path: 'new',
            loadComponent: () => import('./components/category-form.component').then(m => m.CategoryFormComponent),
            title: 'Create Category'
          },
          {
            path: ':id',
            loadComponent: () => import('./components/category-detail.component').then(m => m.CategoryDetailComponent),
            title: 'Category Details'
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./components/category-form.component').then(m => m.CategoryFormComponent),
            title: 'Edit Category'
          }
        ]
      }
    ]
  }
];