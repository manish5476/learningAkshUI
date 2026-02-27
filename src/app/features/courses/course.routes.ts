// course.routes.ts (updated)
import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/authentication/guards/auth.guard';
// import { InstructorGuard } from '../../core/authentication/guards/instructor.guard';

export const COURSE_ROUTES: Routes = [
  {
    path: 'courses',
    children: [
      // Public routes
      {
        path: '',
        loadComponent: () => import('./components/course-list.component').then(m => m.CourseListComponent),
        title: 'Browse Courses'
      },
      {
        path: ':id',
        loadComponent: () => import('./components/course-detail.component').then(m => m.CourseDetailComponent),
        title: 'Course Details'
      },

      // Student routes (enrolled)
      {
        path: 'learn/:id',
        loadComponent: () => import('./components/course-player.component').then(m => m.CoursePlayerComponent),
        canActivate: [AuthGuard],
        title: 'Course Player'
      },

      // Instructor routes
      {
        path: 'instructor',
        canActivate: [AuthGuard],
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
          },
          {
            path: ':id/curriculum',
            loadComponent: () => import('./components/course-curriculum.component').then(m => m.CourseCurriculumComponent),
            title: 'Course Curriculum'
          },
          // {
          //   path: ':id/lessons',
          //   loadComponent: () => import('../lessons/components/lesson-list.component').then(m => m.LessonListComponent),
          //   title: 'Course Lessons'
          // }
        ]
      }
    ]
  }
];
// import { Routes } from '@angular/router';
// import { AuthGuard } from '../../core/authentication/guards/auth.guard';

// // InstructorGuard
// export const COURSE_ROUTES: Routes = [
//   {
//     path: 'instructor/courses',
//     // canActivate: [AuthGuard],
//     children: [
//       {
//         path: '',
//         loadComponent: () => import('./components/course-list.component').then(m => m.CourseListComponent),
//         title: 'My Courses'
//       },
//       {
//         path: 'new',
//         loadComponent: () => import('./components/course-form.component').then(m => m.CourseFormComponent),
//         title: 'Create New Course'
//       },
//       {
//         path: ':id',
//         loadComponent: () => import('./components/course-detail.component').then(m => m.CourseDetailComponent),
//         title: 'Course Details'
//       },
//       {
//         path: ':id/edit',
//         loadComponent: () => import('./components/course-form.component').then(m => m.CourseFormComponent),
//         title: 'Edit Course'
//       }
//     ]
//   }
// ];