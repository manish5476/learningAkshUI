import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/authentication/guards/auth.guard';

export const INSTRUCTOR_ROUTES: Routes = [
  {
    path: 'instructor',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard', // The Bento-Grid analytics dashboard
        loadComponent: () => import('../../features/instructor/instructor-dashboard/instructor-dashboard.component').then(m => m.InstructorDashboardComponent),
        title: 'Instructor Center'
      },
      {
        path: 'courses', // Instructor's private course management feed
        loadComponent: () => import('../../features/courses/components/courselist/course-list.component').then(m => m.CourseListComponent),
        title: 'My Published Content'
      },
      {
        path: 'courses/new', // Wizard form builder step 1
        loadComponent: () => import('../../features/courses/components/courseForm/course-form.component').then(m => m.CourseFormComponent),
        title: 'New Course'
      },
      {
        path: 'courses/:id/edit', // Wizard form builder edit mode
        loadComponent: () => import('../../features/courses/components/courseForm/course-form.component').then(m => m.CourseFormComponent),
        title: 'Course Settings'
      },
      {
        path: 'courses/:id/curriculum', // Drag & Drop curriculum builder
        loadComponent: () => import('../../features/courses/components/course-curriculum/course-curriculum.component').then(m => m.CourseCurriculumComponent),
        title: 'Manage Curriculum'
      },
      {
        path: 'courses/:id/students', // The responsive student roster feed
        loadComponent: () => import('../../features/courses/components/course-students/course-students.component').then(m => m.CourseStudentsComponent),
        title: 'Student Roster'
      },
       {
        path: 'assessments',
        loadComponent: () => import('../../features/Test/instructor-assessments/instructor-assessments.component').then(m => m.InstructorAssessmentsComponent),
        title: 'Quiz Manager'
      },
      {
        path: 'quiz/:id', // The complex Quiz Builder tool
        loadComponent: () => import('../../features/courses/components/quiz-builder/quiz-builder.component').then(m => m.QuizBuilderComponent),
        title: 'Quiz Architect'
      },
      {
        path: 'mock-tests/new',
        loadComponent: () => import('../../features/Test/mock-test-builder/mock-test-builder.component').then(m => m.MockTestBuilderComponent),
        title: 'Create Mock Test'
      }
    ]
  }
];

// import { Instructor } from "./../models/course.model";
// import { Routes } from '@angular/router';
// import { AuthGuard } from '../../core/authentication/guards/auth.guard';

// export const INSTRUCTOR_ROUTES: Routes = [
//   {
//     path: 'instructor',
//     canActivate: [AuthGuard], // Add an InstructorGuard here later if you make one!
//     children: [
//       {
//         path: '',
//         redirectTo: 'dashboard',
//         pathMatch: 'full'
//       },
//       {
//         path: 'dashboard',
//         loadComponent: () => import('../../features/instructor/instructor-dashboard/instructor-dashboard.component').then(m => m.InstructorDashboardComponent),
//         title: 'Instructor Command Center'
//       },
//       {
//         path: 'courses',
//         loadComponent: () => import('../../features/courses/components/courselist/course-list.component').then(m => m.CourseListComponent),
//         title: 'My Courses'
//       },
//       {
//         path: 'courses/new',
//         loadComponent: () => import('../../features/courses/components/courseForm/course-form.component').then(m => m.CourseFormComponent),
//         title: 'Create New Course'
//       },
//       {
//         path: 'courses/:id/edit',
//         loadComponent: () => import('../../features/courses/components/courseForm/course-form.component').then(m => m.CourseFormComponent),
//         title: 'Edit Course'
//       },
//       {
//         path: 'courses/:id/curriculum',
//         loadComponent: () => import('../../features/courses/components/course-curriculum/course-curriculum.component').then(m => m.CourseCurriculumComponent),
//         title: 'Course Curriculum'
//       },
//       {
//         path: 'courses/:id/students',
//         loadComponent: () => import('../../features/courses/components/course-students/course-students.component').then(m => m.CourseStudentsComponent),
//         title: 'Course Roster'
//       },
//       {
//         path: 'courses/:id/analytics',
//         loadComponent: () => import('../../features/courses/components/course-analytics/course-analytics.component').then(m => m.CourseAnalyticsComponent),
//         title: 'Course Analytics'
//       },
      // {
      //   path: 'quizzes',
      //   loadComponent: () => import('../../features/Test/instructor-assessments/instructor-assessments.component').then(m => m.InstructorAssessmentsComponent),
      //   title: 'Quiz Manager'
      // },
//       {
//         path: 'quiz/:id', // Handles both 'new' and actual MongoDB IDs
//         loadComponent: () => import('../../features/courses/components/quiz-builder/quiz-builder.component').then(m => m.QuizBuilderComponent),
//         title: 'Quiz Builder'
//       },
//       {
//         path: 'mock-tests/new',
//         loadComponent: () => import('../../features/Test/mock-test-builder/mock-test-builder.component').then(m => m.MockTestBuilderComponent),
//         title: 'Create Mock Test'
//       }
//     ]
//   }
// ];