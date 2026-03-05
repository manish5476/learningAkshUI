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
        path: 'courses/new',
        loadComponent: () => import('../../features/courses/components/courseForm/course-form.component').then(m => m.CourseFormComponent),
        title: 'New Course'
      },
      {
        path: 'courses/:id/edit',
        loadComponent: () => import('../../features/courses/components/courseForm/course-form.component').then(m => m.CourseFormComponent),
        title: 'Course Settings'
      },
      {
        path: 'courses/:id/curriculum',
        loadComponent: () => import('../../features/courses/components/course-curriculum/course-curriculum.component').then(m => m.CourseCurriculumComponent),
        title: 'Manage Curriculum'
      },
      {
        path: 'courses/:id/students',
        loadComponent: () => import('../../features/courses/components/course-students/course-students.component').then(m => m.CourseStudentsComponent),
        title: 'Student Roster'
      },
      {
        path: 'assessments',
        loadComponent: () => import('../../features/Test/instructor-assessments/instructor-assessments.component').then(m => m.InstructorAssessmentsComponent),
        title: 'Quiz Manager'
      },
      {
        path: 'quiz/:id',
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

