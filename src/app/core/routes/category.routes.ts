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
        loadComponent: () => import('./../../features/category/components/category-list/category-list.component').then(m => m.CategoryListComponent),
        title: 'Category Tree'
      },
      {
        path: 'tree',
        loadComponent: () => import('./../../features/category/components/category-tree/category-tree.component').then(m => m.CategoryTreeComponent),
        title: 'Category Tree'
      },
      {
        path: ':id/courses',
        loadComponent: () => import('./../../features/category/components/category-course/category-courses.component').then(m => m.CategoryCoursesComponent),
        title: 'Category Courses'
      },

      // Admin routes (protected)
      {
        path: 'admin',
        // canActivate: [AuthGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./../../features/category/components/category-list/category-list.component').then(m => m.CategoryListComponent),
            title: 'Category Management'
          },
          {
            path: 'new',
            loadComponent: () => import('./../../features/category/components/category-form/category-form.component').then(m => m.CategoryFormComponent),
            title: 'Create Category'
          },
          {
            path: ':id',
            loadComponent: () => import('./../../features/category/components/category-detail/category-detail.component').then(m => m.CategoryDetailComponent),
            title: 'Category Details'
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./../../features/category/components/category-form/category-form.component').then(m => m.CategoryFormComponent),
            title: 'Edit Category'
          }
        ]
      }
    ]
  }
];