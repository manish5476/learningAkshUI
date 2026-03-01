import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';

// Services
import { QuizService } from '../../../core/services/quiz.service';

@Component({
  selector: 'app-instructor-assessments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    TableModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    InputTextModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './instructor-assessments.component.html',
  styleUrls: ['./instructor-assessments.component.scss']
})
export class InstructorAssessmentsComponent implements OnInit {
  private quizService = inject(QuizService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // State
  isLoading = signal<boolean>(true);
  quizzes = signal<any[]>([]);
  searchQuery = signal<string>('');

  ngOnInit(): void {
    this.fetchQuizzes();
  }

  private fetchQuizzes(): void {
    this.isLoading.set(true);
    // Note: Assuming your backend filters this by the logged-in instructor's token
    this.quizService.getAllQuizzes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const data = res.data?.data || res.data || [];
          this.quizzes.set(data);
          this.isLoading.set(false);
        },
        error: (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load assessments.' });
          this.isLoading.set(false);
        }
      });
  }

  editQuiz(id: string): void {
    this.router.navigate(['/instructor/quiz', id]);
  }

  deleteQuiz(id: string, title: string): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the quiz "${title}"? This action cannot be undone and will remove it from any attached lessons.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.quizService.deleteQuiz(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Quiz successfully deleted.' });
              this.quizzes.update(list => list.filter(q => q._id !== id));
            },
            error: (err) => {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to delete quiz.' });
            }
          });
      }
    });
  }

  copyQuizId(id: string): void {
    navigator.clipboard.writeText(id);
    this.messageService.add({ severity: 'info', summary: 'Copied', detail: 'Quiz ID copied to clipboard! Paste it into your Lesson Form.' });
  }

  // Helper for filtering table locally
  onSearch(event: Event, table: any): void {
    const val = (event.target as HTMLInputElement).value;
    table.filterGlobal(val, 'contains');
  }
}