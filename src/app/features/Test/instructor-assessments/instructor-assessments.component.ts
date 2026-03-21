import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common'; // Added DatePipe for HTML template
import { Router, RouterModule } from '@angular/router';

// PrimeNG
import { TableModule, Table } from 'primeng/table'; // Imported Table
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip'; // Added TooltipModule

import { QuizService } from '../../../core/services/quiz.service';
import { AppMessageService } from '../../../core/utils/message.service';

@Component({
  selector: 'app-instructor-assessments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    InputTextModule,
    SkeletonModule,
    TooltipModule // Injected here
  ],
  providers: [ConfirmationService, MessageService, DatePipe],
  templateUrl: './instructor-assessments.component.html',
  styleUrls: ['./instructor-assessments.component.scss'] // You can delete custom CSS inside this file now!
})
export class InstructorAssessmentsComponent implements OnInit {
  private quizService = inject(QuizService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(AppMessageService);
  private destroyRef = inject(DestroyRef);

  // State
  isLoading = signal<boolean>(true);
  quizzes = signal<any[]>([]);
  searchQuery = signal<string>('');

  skeletonRows = Array(5).fill(0);

  ngOnInit(): void {
    this.fetchQuizzes();
  }

  private fetchQuizzes(): void {
    this.isLoading.set(true);

    this.quizService.getAllQuizzes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const data = res.data?.data || res.data || [];
          this.quizzes.set(data);
          this.isLoading.set(false);
        },
        error: (err: any) => {
          this.messageService.showError('Failed to load assessments.');
          this.isLoading.set(false);
        }
      });
  }

  createNewQuiz(): void {
    this.router.navigate(['/courses', 'unassigned', 'quiz', 'new']);
  }

  editQuiz(quiz: any): void {
    const courseId = quiz.course?._id || quiz.course || 'unassigned';
    this.router.navigate(['/courses', courseId, 'quiz', quiz._id]);
  }

  deleteQuiz(id: string, title: string): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${title}"? This cannot be undone.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle text-[var(--color-error)]',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.quizService.deleteQuiz(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.showSuccess('Quiz successfully deleted.');
              this.quizzes.update(list => list.filter(q => q._id !== id));
            },
            error: (err) => {
              this.messageService.showError(err.error?.message || 'Failed to delete quiz.');
            }
          });
      }
    });
  }

  copyQuizId(id: string): void {
    navigator.clipboard.writeText(id);
    this.messageService.showInfo('Quiz ID copied to clipboard!');
  }

  // Updated properly to interface with PrimeNG #dt table reference
  onSearch(event: Event, dt: Table): void {
    const val = (event.target as HTMLInputElement).value;
    dt.filterGlobal(val, 'contains');
  }
}
// import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule, DatePipe } from '@angular/common';
// import { Router, RouterModule } from '@angular/router';

// // PrimeNG
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmationService, MessageService } from 'primeng/api';
// import { InputTextModule } from 'primeng/inputtext';
// import { SkeletonModule } from 'primeng/skeleton';
// import { QuizService } from '../../../core/services/quiz.service';
// import { AppMessageService } from '../../../core/utils/message.service';

// // Services
// // import { QuizService } from '../../../../core/services/quiz.service';

// @Component({
//   selector: 'app-instructor-assessments',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     TableModule,
//     ButtonModule,
//     TagModule,
//     ConfirmDialogModule,
//     ToastModule,
//     InputTextModule,
//     SkeletonModule
//   ],
//   providers: [ConfirmationService, MessageService],
//   templateUrl: './instructor-assessments.component.html',
//   styleUrls: ['./instructor-assessments.component.scss']
// })
// export class InstructorAssessmentsComponent implements OnInit {
//   private quizService = inject(QuizService);
//   private router = inject(Router);
//   private confirmationService = inject(ConfirmationService);
//   private messageService = inject(AppMessageService);
//   private destroyRef = inject(DestroyRef);

//   // State
//   isLoading = signal<boolean>(true);
//   quizzes = signal<any[]>([]);
//   searchQuery = signal<string>('');

//   // Mock array for skeleton loaders
//   skeletonRows = Array(5).fill(0);

//   ngOnInit(): void {
//     this.fetchQuizzes();
//   }

//   private fetchQuizzes(): void {
//     this.isLoading.set(true);

//     this.quizService.getAllQuizzes()
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           const data = res.data?.data || res.data || [];
//           this.quizzes.set(data);
//           this.isLoading.set(false);
//         },
//         error: (err: any) => {
//           this.messageService.showError('Failed to load assessments.');
//           this.isLoading.set(false);
//         }
//       });
//   }

//   /**
//    * Navigate to create a new quiz.
//    * Passes 'unassigned' as the courseId so the Quiz Builder knows to unlock the dropdown.
//    */
//   createNewQuiz(): void {
//     this.router.navigate(['/courses', 'unassigned', 'quiz', 'new']);
//   }

//   /**
//    * Navigate to edit an existing quiz.
//    * Extracts the course ID from the populated course object or string reference.
//    */
//   editQuiz(quiz: any): void {
//     // Safely extract courseId whether backend populated it or left it as a string ID
//     const courseId = quiz.course?._id || quiz.course || 'unassigned';
//     this.router.navigate(['/courses', courseId, 'quiz', quiz._id]);
//   }

//   deleteQuiz(id: string, title: string): void {
//     this.confirmationService.confirm({
//       message: `Are you sure you want to delete the quiz "${title}"? This action cannot be undone and will remove it from any attached lessons.`,
//       header: 'Confirm Deletion',
//       icon: 'pi pi-exclamation-triangle',
//       acceptButtonStyleClass: 'p-button-danger',
//       accept: () => {
//         this.quizService.deleteQuiz(id)
//           .pipe(takeUntilDestroyed(this.destroyRef))
//           .subscribe({
//             next: () => {
//               this.messageService.showSuccess('Quiz successfully deleted.');
//               this.quizzes.update(list => list.filter(q => q._id !== id));
//             },
//             error: (err) => {
//               this.messageService.showError(err.error?.message || 'Failed to delete quiz.');
//             }
//           });
//       }
//     });
//   }

//   copyQuizId(id: string): void {
//     navigator.clipboard.writeText(id);
//     this.messageService.showInfo('Quiz ID copied to clipboard! Paste it into your Lesson Form.' );
//   }

//   onSearch(event: Event, table: any): void {
//     const val = (event.target as HTMLInputElement).value;
//     table.filterGlobal(val, 'contains');
//   }
// }
