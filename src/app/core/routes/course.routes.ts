import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/authentication/guards/auth.guard';

export const COURSE_ROUTES: Routes = [
  {
    path: 'courses',
    children: [
      {
        path: '', // Fluid card-based browsing feed
        loadComponent: () => import('./../../features/courses/components/courselist/course-list.component').then(m => m.CourseListComponent),
        title: 'Browse Courses'
      },
      {
        path: 'learn/:id', // The 100dvh Native Theater Player shell
        canActivate: [AuthGuard],
        loadComponent: () => import('./../../features/courses/components/course-player/course-player.component').then(m => m.CoursePlayerComponent),
        title: 'Classroom'
      },
      {
        path: 'analytics/:id', // The 100dvh Native Theater Player shell
        canActivate: [AuthGuard],
        loadComponent: () => import('./../../features/courses/components/course-analytics/course-analytics.component').then(m => m.CourseAnalyticsComponent),
        title: 'Classroom'
      },
      {
        path: ':id', // Course Sales page with the Premium Checkout modal
        loadComponent: () => import('./../../features/courses/components/coursedetails/course-detail.component').then(m => m.CourseDetailComponent),
        title: 'Course Details'
      }
    ]
  }
];

