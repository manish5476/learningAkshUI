import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/authentication/guards/auth.guard';

// InstructorGuard
export const COURSE_ROUTES: Routes = [
  {
    path: 'instructor/courses',
    // canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/course-list.component').then(m => m.CourseListComponent),
        title: 'My Courses'
      },
      {
        path: 'new',
        loadComponent: () => import('./components/course-form.component').then(m => m.CourseFormComponent),
        title: 'Create New Course'
      },
      {
        path: ':id',
        loadComponent: () => import('./components/course-detail.component').then(m => m.CourseDetailComponent),
        title: 'Course Details'
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./components/course-form.component').then(m => m.CourseFormComponent),
        title: 'Edit Course'
      }
    ]
  }
];