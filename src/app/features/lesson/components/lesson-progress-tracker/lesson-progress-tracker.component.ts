import { Component, inject, input, output, effect, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';

// Services
import { LessonService, LessonProgress } from '../../../../core/services/lesson.service';

@Component({
  selector: 'app-lesson-progress-tracker',
  standalone: true,
  imports: [CommonModule, ButtonModule,CommonModule, ProgressBarModule, DatePipe],
  templateUrl: './lesson-progress-tracker.component.html',
  styleUrls: ['./lesson-progress-tracker.component.scss']
})
export class LessonProgressTrackerComponent {
  // Modern Signal Inputs/Outputs
  lessonId = input.required<string>();
  lessonDuration = input<number>(0); // Total duration from the lesson object
  
  // Emits to parent so the sidebar can update its checkmarks!
  progressUpdated = output<LessonProgress>(); 
  protected readonly Math = Math; 

  // Injectors
  private lessonService = inject(LessonService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // State Signals
  progress = signal<LessonProgress | null>(null);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);

  constructor() {
    // Automatically fetch progress whenever the lessonId input changes
    effect(() => {
      const id = this.lessonId();
      if (id) {
        this.fetchProgress(id);
      }
    }, { allowSignalWrites: true });
  }

  private fetchProgress(id: string): void {
    this.isLoading.set(true);
    
    this.lessonService.getLessonProgress(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.progress.set(res.data || null);
          this.isLoading.set(false);
        },
        error: (err: any) => {
          console.error('Failed to fetch lesson progress', err);
          // If no progress document exists yet, fail gracefully to a clean state
          this.progress.set({ lessonId: id, completed: false });
          this.isLoading.set(false);
        }
      });
  }

  markComplete(): void {
    const id = this.lessonId();
    if (!id) return;

    this.isSubmitting.set(true);

    this.lessonService.markAsCompleted(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const newProgress = res.data;
          this.progress.set(newProgress);
          this.progressUpdated.emit(newProgress); // Tell parent player to move to next lesson
          
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Awesome!', 
            detail: 'Lesson marked as completed.' 
          });
          this.isSubmitting.set(false);
        },
        error: (err: any) => {
          console.error('Failed to mark complete', err);
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Oops', 
            detail: 'Could not save your progress.' 
          });
          this.isSubmitting.set(false);
        }
      });
  }

  // Calculate percentage for the progress bar based on watch time vs total duration
  getWatchPercentage(): number {
    const currentProgress = this.progress();
    const total = this.lessonDuration();
    
    if (currentProgress?.completed) return 100;
    if (!currentProgress?.watchTime || !total || total <= 0) return 0;
    
    // Assuming watchTime is in seconds and duration is in minutes
    // Adjust logic based on your exact DB structure
    const watchMinutes = currentProgress.watchTime / 60;
    const percentage = Math.round((watchMinutes / total) * 100);
    
    return percentage > 100 ? 100 : percentage;
  }
}