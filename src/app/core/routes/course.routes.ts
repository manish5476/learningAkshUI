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
        // STATIC ROUTE - Keep this above :id
        path: 'top-courses', 
        loadComponent: () => import('./../../features/courses/components/top-rated-courses/top-rated-courses').then(m => m.TopRatedCoursesComponent),
        title: 'Top Courses'
      },
      // ========== INVITATION ROUTE ==========
      {
        // STATIC ROUTE - Keep this above :id
        path: 'accept-invite', 
        // Adjust this import path if you saved the AcceptInviteComponent somewhere else!
        loadComponent: () => import('../../features/courses/components/accept-invite/accept-invite.component').then(m => m.AcceptInviteComponent),
        title: 'Accept Instructor Invitation'
      },
      // ======================================
      {
        path: 'learn/:id',
        canActivate: [AuthGuard],
        loadComponent: () => import('./../../features/courses/components/course-player/course-player.component').then(m => m.CoursePlayerComponent),
        title: 'Classroom'
      },
      {
        path: 'analytics/:id',
        canActivate: [AuthGuard],
        loadComponent: () => import('./../../features/courses/components/course-analytics/course-analytics.component').then(m => m.CourseAnalyticsComponent),
        title: 'Course Analytics' // Fixed duplicate title
      },
      // ========== QUIZ ROUTES ==========
      {
        path: ':courseId/quiz/new',
        canActivate: [AuthGuard],
        loadComponent: () => import('../../features/courses/components/quiz-builder/quiz-builder.component').then(m => m.QuizBuilderComponent),
        title: 'Create Quiz'
      },
      {
        path: ':courseId/quiz/:id',
        canActivate: [AuthGuard],
        loadComponent: () => import('../../features/courses/components/quiz-builder/quiz-builder.component').then(m => m.QuizBuilderComponent),
        title: 'Edit Quiz'
      },
      // ========== END QUIZ ROUTES ==========
      {
        // DYNAMIC ROUTE - Always keep at the very bottom of the children array
        path: ':id', 
        loadComponent: () => import('./../../features/courses/components/coursedetails/course-detail.component').then(m => m.CourseDetailComponent),
        title: 'Course Details'
      }
    ]
  }
];

// import { Routes } from '@angular/router';
// import { AuthGuard } from '../../core/authentication/guards/auth.guard';

// export const COURSE_ROUTES: Routes = [
//   {
//     path: 'courses',
//     children: [
//       {
//         path: '', 
//         loadComponent: () => import('./../../features/courses/components/courselist/course-list.component').then(m => m.CourseListComponent),
//         title: 'Browse Courses'
//       },
//       {
//         // STATIC ROUTE - Keep this above :id
//         path: 'top-courses', 
//         loadComponent: () => import('./../../features/courses/components/top-rated-courses/top-rated-courses').then(m => m.TopRatedCoursesComponent),
//         title: 'Top Courses'
//       },
//       {
//         path: 'learn/:id',
//         canActivate: [AuthGuard],
//         loadComponent: () => import('./../../features/courses/components/course-player/course-player.component').then(m => m.CoursePlayerComponent),
//         title: 'Classroom'
//       },
//       {
//         path: 'analytics/:id',
//         canActivate: [AuthGuard],
//         loadComponent: () => import('./../../features/courses/components/course-analytics/course-analytics.component').then(m => m.CourseAnalyticsComponent),
//         title: 'Classroom'
//       },
//       // ========== QUIZ ROUTES ==========
//       {
//         path: ':courseId/quiz/new',
//         canActivate: [AuthGuard],
//         loadComponent: () => import('../../features/courses/components/quiz-builder/quiz-builder.component').then(m => m.QuizBuilderComponent),
//         title: 'Create Quiz'
//       },
//       {
//         path: ':courseId/quiz/:id',
//         canActivate: [AuthGuard],
//         loadComponent: () => import('../../features/courses/components/quiz-builder/quiz-builder.component').then(m => m.QuizBuilderComponent),
//         title: 'Edit Quiz'
//       },
//       // ========== END QUIZ ROUTES ==========
//       {
//         // DYNAMIC ROUTE - Always keep at the very bottom of the children array
//         path: ':id', 
//         loadComponent: () => import('./../../features/courses/components/coursedetails/course-detail.component').then(m => m.CourseDetailComponent),
//         title: 'Course Details'
//       }
//     ]
//   }
// ];