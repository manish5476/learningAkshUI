import { Component, inject, input, output, effect, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { switchMap, of, catchError } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { LessonService } from '../../../../core/services/lesson.service';

@Component({
  selector: 'app-lesson-progress-tracker',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule,
    ProgressBarModule,
    TooltipModule
  ],
  templateUrl: './lesson-progress-tracker.component.html',
  styleUrls: ['./lesson-progress-tracker.component.scss']
})
export class LessonProgressTrackerComponent {
  // Modern Signal Inputs/Outputs
  lessonId = input.required<string>();
  lessonDuration = input<number>(0); // Total duration from the lesson object
  courseId = input<string>(); // Optional: for course-level progress
  sectionId = input<string>(); // Optional: for section context
  
  // Emits to parent so the sidebar can update its checkmarks!
  progressUpdated = output<any>(); 
  protected readonly Math = Math; 

  // Injectors
  private lessonService = inject(LessonService);
  private enrollmentService = inject(EnrollmentService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // State Signals
  progress = signal<any | null>(null);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  watchTime = signal<number>(0); // Track watch time in seconds
  watchTimer: any; // For tracking video watch time

  constructor() {
    // Automatically fetch progress whenever the lessonId input changes
    effect(() => {
      const id = this.lessonId();
      if (id) {
        this.fetchProgress(id);
        this.startWatchTimer();
      }
      
      // Cleanup timer when lesson changes
      return () => this.clearWatchTimer();
    }, { allowSignalWrites: true });
  }

  /**
   * Fetch lesson progress using the new LessonService method
   */
  private fetchProgress(id: string): void {
    this.isLoading.set(true);
    
    // this.lessonService.getLessonProgress(id)
    //   .pipe(
    //     takeUntilDestroyed(this.destroyRef),
    //     catchError((error) => {
    //       console.error('Failed to fetch lesson progress', error);
    //       // If no progress document exists yet, return a default progress object
    //       return of({ 
    //         data: { 
    //           lessonId: id, 
    //           completed: false,
    //           watchTime: 0,
    //           lastAccessedAt: new Date()
    //         } 
    //       });
    //     })
    //   )
    //   .subscribe({
    //     next: (res: any) => {
    //       const progressData = res.data || res;
    //       this.progress.set({
    //         lessonId: progressData.lessonId || id,
    //         completed: progressData.completed || false,
    //         watchTime: progressData.watchTime || 0,
    //         lastAccessedAt: progressData.lastAccessedAt || new Date()
    //       });
          
    //       // Set initial watch time
    //       this.watchTime.set(progressData.watchTime || 0);
    //       this.isLoading.set(false);
    //     },
    //     error: (err: any) => {
    //       console.error('Failed to fetch lesson progress', err);
    //       // Set default progress
    //       this.progress.set({ 
    //         lessonId: id, 
    //         completed: false,
    //         watchTime: 0,
    //         lastAccessedAt: new Date()
    //       });
    //       this.isLoading.set(false);
    //     }
    //   });
  }

  /**
   * Mark lesson as completed
   */
  markComplete(): void {
    const id = this.lessonId();
    const courseId = this.courseId();
    const sectionId = this.sectionId();
    
    if (!id) return;

    this.isSubmitting.set(true);

    // First, submit any accumulated watch time
    // this.submitWatchTime().pipe(
    //   switchMap(() => {
    //     // Then mark the lesson as completed
    //     return this.lessonService.markLessonAsCompleted(id);
    //   }),
    //   takeUntilDestroyed(this.destroyRef),
    //   catchError((error) => {
    //     console.error('Failed to mark lesson as completed', error);
    //     this.messageService.add({ 
    //       severity: 'error', 
    //       summary: 'Error', 
    //       detail: 'Could not save your progress. Please try again.' 
    //     });
    //     return of(null);
    //   })
    // ).subscribe({
    //   next: (response: any) => {
    //     if (!response) return;
        
    //     const newProgress = response.data || response;
        
    //     // Update local state
    //     this.progress.update(p => ({
    //       ...p,
    //       completed: true,
    //       watchTime: this.watchTime() // Ensure watch time is saved
    //     }));
        
    //     // Emit to parent
    //     this.progressUpdated.emit({
    //       lessonId: id,
    //       completed: true,
    //       watchTime: this.watchTime(),
    //       ...(courseId && { courseId }),
    //       ...(sectionId && { sectionId })
    //     });
        
    //     // Show success message
    //     this.messageService.add({ 
    //       severity: 'success', 
    //       summary: 'Great job!', 
    //       detail: 'Lesson marked as completed.' 
    //     });
        
    //     this.isSubmitting.set(false);
    //     this.clearWatchTimer();
    //   },
    //   error: (err: any) => {
    //     console.error('Failed to mark complete', err);
    //     this.messageService.add({ 
    //       severity: 'error', 
    //       summary: 'Oops', 
    //       detail: err?.error?.message || 'Could not save your progress.' 
    //     });
    //     this.isSubmitting.set(false);
    //   }
    // });
  }

  /**
   * Toggle completion status (for testing or manual override)
   */
  toggleComplete(): void {
    const current = this.progress();
    if (current?.completed) {
      this.markIncomplete();
    } else {
      this.markComplete();
    }
  }

  /**
   * Mark lesson as incomplete (useful for admin/reset functionality)
   */
  markIncomplete(): void {
    const id = this.lessonId();
    if (!id) return;

    this.isSubmitting.set(true);

    // Note: You might need to add this method to your LessonService
    // For now, we'll just update local state
    this.progress.update(p => ({
      ...p,
      completed: false
    }));
    
    this.progressUpdated.emit({
      lessonId: id,
      completed: false,
      watchTime: this.watchTime()
    });
    
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Reset', 
      detail: 'Lesson marked as incomplete.' 
    });
    
    this.isSubmitting.set(false);
  }

  /**
   * Start tracking watch time for video lessons
   */
  private startWatchTimer(): void {
    // Clear any existing timer
    this.clearWatchTimer();
    
    // Only track for non-completed lessons
    if (this.progress()?.completed) return;
    
    // // Update watch time every 30 seconds
    // this.watchTimer = setInterval(() => {
    //   this.watchTime.update(time => time + 30);
      
    //   // Auto-submit every 2 minutes
    //   if (this.watchTime() % 120 === 0) {
    //     this.submitWatchTime().subscribe();
    //   }
    // }, 30000);
  }

  /**
   * Submit accumulated watch time to server
   */
  private submitWatchTime() {
    const id = this.lessonId();
    if (!id || this.watchTime() === 0) return of(null);

    // Note: You might need to add this endpoint to your LessonService
    // For now, we'll just return the current watch time
    return of({ data: { watchTime: this.watchTime() } });
  }

  /**
   * Clear watch timer
   */
  private clearWatchTimer(): void {
    if (this.watchTimer) {
      clearInterval(this.watchTimer);
      this.watchTimer = null;
    }
  }

  /**
   * Calculate percentage for the progress bar based on watch time vs total duration
   */
  getWatchPercentage(): number {
    const currentProgress = this.progress();
    const total = this.lessonDuration();
    
    if (currentProgress?.completed) return 100;
    
    // Use accumulated watch time or stored watch time
    const watchTime = this.watchTime() || currentProgress?.watchTime || 0;
    
    if (!total || total <= 0) return 0;
    
    // Assuming watchTime is in seconds and duration is in minutes
    // Convert duration to seconds for accurate percentage
    const totalSeconds = total * 60;
    const percentage = Math.round((watchTime / totalSeconds) * 100);
    
    return percentage > 100 ? 100 : percentage;
  }

  /**
   * Get formatted watch time
   */
  getFormattedWatchTime(): string {
    const watchTime = this.watchTime() || this.progress()?.watchTime || 0;
    const minutes = Math.floor(watchTime / 60);
    const seconds = watchTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get estimated time remaining
   */
  getTimeRemaining(): string {
    const total = this.lessonDuration() * 60; // Convert to seconds
    const watched = this.watchTime() || this.progress()?.watchTime || 0;
    const remaining = Math.max(total - watched, 0);
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Check if lesson can be marked as completed (watched enough)
   */
  canComplete(): boolean {
    const percentage = this.getWatchPercentage();
    // Require at least 90% watched to mark as complete
    return percentage >= 90 || this.progress()?.completed || false;
  }

  /**
   * Get button text based on state
   */
  getButtonText(): string {
    if (this.isSubmitting()) return 'Saving...';
    if (this.progress()?.completed) return 'Completed ✓';
    if (this.canComplete()) return 'Mark Complete';
    return 'Keep Watching';
  }

  /**
   * Get button severity based on state
   */
  getButtonSeverity(): 'success' | 'secondary' | 'info' {
    if (this.progress()?.completed) return 'success';
    if (this.canComplete()) return 'info';
    return 'secondary';
  }

  /**
   * Clean up on component destroy
   */
  // ngOnDestroy(): void {
  //   this.clearWatchTimer();
  //   // Submit final watch time before destroying
  //   if (this.watchTime() > 0) {
  //     this.submitWatchTime().subscribe();
  //   }
  // }
}

// import { Component, inject, input, output, effect, signal, DestroyRef } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule, DatePipe } from '@angular/common';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { ProgressBarModule } from 'primeng/progressbar';
// import { MessageService } from 'primeng/api';

// // Services
// import { LessonService, LessonProgress } from '../../../../core/services/lesson.service';

// @Component({
//   selector: 'app-lesson-progress-tracker',
//   standalone: true,
//   imports: [CommonModule, ButtonModule,CommonModule, ProgressBarModule, ],//DatePipe
//   templateUrl: './lesson-progress-tracker.component.html',
//   styleUrls: ['./lesson-progress-tracker.component.scss']
// })
// export class LessonProgressTrackerComponent {
//   // Modern Signal Inputs/Outputs
//   lessonId = input.required<string>();
//   lessonDuration = input<number>(0); // Total duration from the lesson object
  
//   // Emits to parent so the sidebar can update its checkmarks!
//   progressUpdated = output<any>(); 
//   protected readonly Math = Math; 

//   // Injectors
//   private lessonService = inject(LessonService);
//   private messageService = inject(MessageService);
//   private destroyRef = inject(DestroyRef);

//   // State Signals
//   progress = signal<LessonProgress | null>(null);
//   isLoading = signal<boolean>(true);
//   isSubmitting = signal<boolean>(false);

//   constructor() {
//     // Automatically fetch progress whenever the lessonId input changes
//     effect(() => {
//       const id = this.lessonId();
//       if (id) {
//         this.fetchProgress(id);
//       }
//     }, { allowSignalWrites: true });
//   }

//   private fetchProgress(id: string): void {
//     this.isLoading.set(true);
    
//   //   this.lessonService.getLessonProgress(id)
//   //     .pipe(takeUntilDestroyed(this.destroyRef))
//   //     .subscribe({
//   //       next: (res: any) => {
//   //         this.progress.set(res.data || null);
//   //         this.isLoading.set(false);
//   //       },
//   //       error: (err: any) => {
//   //         console.error('Failed to fetch lesson progress', err);
//   //         // If no progress document exists yet, fail gracefully to a clean state
//   //         this.progress.set({ lessonId: id, completed: false });
//   //         this.isLoading.set(false);
//   //       }
//   //     });
//   // }

//   // markComplete(): void {
//   //   const id = this.lessonId();
//   //   if (!id) return;

//   //   this.isSubmitting.set(true);

//   //   this.lessonService.markAsCompleted(id)
//   //     .pipe(takeUntilDestroyed(this.destroyRef))
//   //     .subscribe({
//   //       next: (res: any) => {
//   //         const newProgress = res.data;
//   //         this.progress.set(newProgress);
//   //         this.progressUpdated.emit(newProgress); // Tell parent player to move to next lesson
          
//   //         this.messageService.add({ 
//   //           severity: 'success', 
//   //           summary: 'Awesome!', 
//   //           detail: 'Lesson marked as completed.' 
//   //         });
//   //         this.isSubmitting.set(false);
//   //       },
//   //       error: (err: any) => {
//   //         console.error('Failed to mark complete', err);
//   //         this.messageService.add({ 
//   //           severity: 'error', 
//   //           summary: 'Oops', 
//   //           detail: 'Could not save your progress.' 
//   //         });
//   //         this.isSubmitting.set(false);
//   //       }
//   //     });
//   // }

//   // Calculate percentage for the progress bar based on watch time vs total duration
//   // getWatchPercentage(): number {
//   //   const currentProgress = this.progress();
//   //   const total = this.lessonDuration();
    
//   //   if (currentProgress?.completed) return 100;
//   //   if (!currentProgress?.watchTime || !total || total <= 0) return 0;
    
//   //   // Assuming watchTime is in seconds and duration is in minutes
//   //   // Adjust logic based on your exact DB structure
//   //   const watchMinutes = currentProgress.watchTime / 60;
//   //   const percentage = Math.round((watchMinutes / total) * 100);
    
//   //   return percentage > 100 ? 100 : percentage;
//   // }
// }}