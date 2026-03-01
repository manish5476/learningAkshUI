import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/authentication/guards/auth.guard';

export const COURSE_ROUTES: Routes = [
  {
    path: 'courses',
    children: [
      {
        path: '',
        loadComponent: () => import('./../../features/courses/components/courselist/course-list.component').then(m => m.CourseListComponent),
        title: 'Browse Courses'
      },
      {
        path: 'learn/:id',
        loadComponent: () => import('./../../features/courses/components/course-player/course-player.component').then(m => m.CoursePlayerComponent),
        canActivate: [AuthGuard],
        title: 'Course Player'
      },
      // DYNAMIC CATCH-ALL ROUTE GOES LAST
      {
        path: ':id', 
        loadComponent: () => import('./../../features/courses/components/coursedetails/course-detail.component').then(m => m.CourseDetailComponent),
        title: 'Course Details'
      }
    ]
  }
];