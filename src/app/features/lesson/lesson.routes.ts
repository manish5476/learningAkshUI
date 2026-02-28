// lesson.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/authentication/guards/auth.guard';
// import { InstructorGuard } from '../../core/authentication/guards/instructor.guard';

export const LESSON_ROUTES: Routes = [
  {
    path: 'lessons',
    children: [
      // Public routes (with access control)
      // {
      //   path: ':id/access',
      //   loadComponent: () => import('./components/lesson-player.component').then(m => m.LessonPlayerComponent),
      //   canActivate: [AuthGuard],
      //   title: 'Lesson'
      // },

      // Instructor routes
      {
        path: 'instructor',
        canActivate: [AuthGuard],
        children: [
          {
            path: 'section/:sectionId',
            loadComponent: () => import('./components/lesson-list/lesson-list.component').then(m => m.LessonListComponent),
            title: 'Section Lessons'
          },
          {
            path: 'new/:sectionId',
            loadComponent: () => import('./components/lesson-form/lesson-form.component').then(m => m.LessonFormComponent),
            title: 'Create Lesson'
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./components/lesson-form/lesson-form.component').then(m => m.LessonFormComponent),
            title: 'Edit Lesson'
          },
          // {
          //   path: ':id/preview',
          //   loadComponent: () => import('./components/lesson-preview.component').then(m => m.LessonPreviewComponent),
          //   title: 'Preview Lesson'
          // }
        ]
      }
    ]
  }
];