import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/authentication/guards/auth.guard';
// import { InstructorGuard } from '../../core/authentication/guards/instructor.guard';

export const COURSE_ROUTES: Routes = [
  {
    path: 'courses',
    children: [
      // 1. Static Public Route
      {
        path: '',
        loadComponent: () => import('./components/courselist/course-list.component').then(m => m.CourseListComponent),
        title: 'Browse Courses'
      },

      // 2. PROTECTED / STATIC ROUTES MUST GO BEFORE DYNAMIC ROUTES
      // Student routes (enrolled)
      {
        path: 'learn/:id',
        loadComponent: () => import('./components/course-player/course-player.component').then(m => m.CoursePlayerComponent),
        canActivate: [AuthGuard],
        title: 'Course Player'
      },

      // Instructor/Admin routes
      {
        path: 'instructor',
        canActivate: [AuthGuard],
        children: [
          {
            path: '', // This acts as the home page for /instructor
            loadComponent: () => import('../instructor/instructor-dashboard/instructor-dashboard.component').then(m => m.InstructorDashboardComponent),
            title: 'Instructor Command Center'
          },
          {
            path: '',
            loadComponent: () => import('./components/courselist/course-list.component').then(m => m.CourseListComponent),
            title: 'My Courses'
          },
          {
            path: 'new',
            loadComponent: () => import('./components/courseForm/course-form.component').then(m => m.CourseFormComponent),
            title: 'Create New Course'
          },
          // Notice inside here, ':id' is safely at the bottom of the instructor children
          {
            path: ':id',
            loadComponent: () => import('./components/coursedetails/course-detail.component').then(m => m.CourseDetailComponent),
            title: 'Course Details'
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./components/courseForm/course-form.component').then(m => m.CourseFormComponent),
            title: 'Edit Course'
          },
          {
            path: ':id/analytics',
            loadComponent: () => import('./components/course-analytics/course-analytics.component').then(m => m.CourseAnalyticsComponent),
            title: 'Course Analytics'
          },
          {
            path: ':id/curriculum',
            loadComponent: () => import('./course-curriculum/course-curriculum.component').then(m => m.CourseCurriculumComponent),
            title: 'Course Curriculum'
          }
        ]
      },

      // 3. DYNAMIC CATCH-ALL ROUTE GOES LAST
      // Public Course Detail (by slug or ID)
      {
        path: ':id', // Alternatively: path: ':slug'
        loadComponent: () => import('./components/coursedetails/course-detail.component').then(m => m.CourseDetailComponent),
        title: 'Course Details'
      }
    ]
  }
];