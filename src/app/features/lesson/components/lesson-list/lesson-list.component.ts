import { Component, OnInit, inject, DestroyRef, signal, computed, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { DragDropModule } from 'primeng/dragdrop';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DurationPipe } from '../../../../core/pipes/duration.pipe';
import { LessonService } from '../../../../core/services/lesson.service';
import { LessonDetailComponent } from '../lesson-detail/lesson-detail.component';
import { LessonFormComponent } from '../lesson-form/lesson-form.component';

@Component({
  selector: 'app-lesson-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    DialogModule,
    TooltipModule,
    DragDropModule,
    LessonFormComponent,
    LessonDetailComponent,
    DurationPipe
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './lesson-list.component.html',
  styleUrls: ['./lesson-list.component.scss']
})
export class LessonListComponent implements OnInit {
  // Modern Signal Inputs/Outputs
  sectionId = input.required<string>();
  courseId = input.required<string>();
  
  lessonCountChange = output<number>();
  durationChange = output<number>();

  // Injectors
  private lessonService = inject(LessonService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // State Signals
  lessons = signal<any[]>([]);
  loading = signal<boolean>(false);
  
  // Dialog State
  showFormDialog = signal<boolean>(false);
  showDetailDialog = signal<boolean>(false);
  selectedLessonId = signal<string | null>(null);
  selectedLesson = signal<any>(null);
  dialogTitle = signal<string>('Add New Lesson');

  // Drag and drop state
  draggingIndex = signal<number | null>(null);

  // Computed State
  totalDuration = computed(() => {
    return this.lessons().reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
  });

  constructor() {
    // Automatically emit changes to parent (CourseCurriculum) when lessons update
    effect(() => {
      const data = this.lessons();
      this.lessonCountChange.emit(data.length);
      this.durationChange.emit(this.totalDuration());
    }, { allowSignalWrites: true });

    // Reload lessons if the input sectionId changes
    effect(() => {
      const id = this.sectionId();
      if (id) {
        this.loadLessons(id);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Initial load handled by effect above
  }

  /**
   * Load lessons for the current section using the LessonService
   */
  private loadLessons(sectionId: string): void {
    if (!sectionId) return;
    
    this.loading.set(true);
    
    this.lessonService.getSectionLessons(sectionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          // Handle the response format: { status: "success", results: 1, data: [...] }
          let lessonsData = [];
          
          if (res?.data && Array.isArray(res.data)) {
            // Format: { status: "success", results: 1, data: [...] }
            lessonsData = res.data;
          } else if (Array.isArray(res)) {
            // Format: direct array
            lessonsData = res;
          } else if (res?.data?.data && Array.isArray(res.data.data)) {
            // Nested data format
            lessonsData = res.data.data;
          }

          // Sort by order field if available
          const sorted = lessonsData.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          
          this.lessons.set(sorted);
          this.loading.set(false);
        },
        error: (error: any) => {
          console.error('Failed to load lessons', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load lessons'
          });
          this.loading.set(false);
        }
      });
  }

  // --- Drag and Drop Logic ---

  onDragStart(index: number): void {
    this.draggingIndex.set(index);
  }

  onDragEnd(): void {
    this.draggingIndex.set(null);
  }

  onLessonDrop(event: any): void {
    const dragIndex = this.draggingIndex();
    if (dragIndex === null) return;

    const dropIndex = event.index;
    if (dragIndex === dropIndex) return;

    // Get current lessons and reorder
    const currentLessons = [...this.lessons()];
    const [movedLesson] = currentLessons.splice(dragIndex, 1);
    currentLessons.splice(dropIndex, 0, movedLesson);

    // Update order values
    const reorderedLessons = currentLessons.map((lesson, index) => ({
      ...lesson,
      order: index
    }));

    // Update UI optimistically
    this.lessons.set(reorderedLessons);

    // Prepare ordered IDs for backend
    const orderedIds = currentLessons.map(lesson => lesson._id);

    // Persist to backend using the service
    this.lessonService.reorderLessons(this.sectionId(), orderedIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Lessons reordered successfully'
          });
        },
        error: (error: any) => {
          console.error('Failed to reorder lessons', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to reorder lessons'
          });
          // Reload to revert to server state
          this.loadLessons(this.sectionId());
        }
      });

    this.draggingIndex.set(null);
  }

  // --- Dialog & CRUD Actions ---

  openNewLessonDialog(): void {
    this.selectedLessonId.set(null);
    this.dialogTitle.set('Add New Lesson');
    this.showFormDialog.set(true);
  }

  viewLesson(lesson: any): void {
    this.selectedLesson.set(lesson);
    this.showDetailDialog.set(true);
  }

  editLesson(lesson: any): void {
    this.selectedLessonId.set(lesson._id);
    this.dialogTitle.set('Edit Lesson');
    this.showFormDialog.set(true);
  }

  deleteLesson(lesson: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${lesson.title}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.lessonService.deleteLesson(lesson._id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Lesson deleted successfully'
              });
              // Remove from local array
              this.lessons.update(arr => arr.filter(l => l._id !== lesson._id));
            },
            error: (error: any) => {
              console.error('Failed to delete lesson', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.error?.message || 'Failed to delete lesson'
              });
            }
          });
      }
    });
  }

  /**
   * Handle lesson saved/updated from form
   */
  onLessonSaved(lesson: any): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `Lesson ${this.selectedLessonId() ? 'updated' : 'created'} successfully`
    });
    this.closeDialog();
    this.loadLessons(this.sectionId());
  }

  closeDialog(): void {
    this.showFormDialog.set(false);
    this.selectedLessonId.set(null);
  }

  editFromDetail(): void {
    this.closeDetailDialog();
    setTimeout(() => {
      this.dialogTitle.set('Edit Lesson');
      this.showFormDialog.set(true);
    }, 150);
  }

  closeDetailDialog(): void {
    this.showDetailDialog.set(false);
    this.selectedLesson.set(null);
  }

  /**
   * Get lesson icon based on type
   */
  getLessonIcon(type: string): string {
    const icons: Record<string, string> = {
      'video': 'pi pi-video',
      'article': 'pi pi-file',
      'quiz': 'pi pi-question-circle',
      'assignment': 'pi pi-pencil',
      'coding-exercise': 'pi pi-code'
    };
    return icons[type] || 'pi pi-file';
  }

  /**
   * Get content summary for display
   */
  getContentSummary(lesson: any): string {
    if (!lesson.content) return '';
    
    if (lesson.type === 'video' && lesson.content.video?.url) {
      return 'Video content available';
    } else if (lesson.type === 'article' && lesson.content.article) {
      return 'Article content';
    } else if (lesson.type === 'quiz') {
      return 'Quiz available';
    }
    return '';
  }
}


// import { Component, OnInit, inject, DestroyRef, signal, computed, effect, input, output } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';

// // PrimeNG
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ToastModule } from 'primeng/toast';
// import { DialogModule } from 'primeng/dialog';
// import { TooltipModule } from 'primeng/tooltip';
// import { DragDropModule } from 'primeng/dragdrop';
// import { ConfirmationService, MessageService } from 'primeng/api';
// import { DurationPipe } from '../../../../core/pipes/duration.pipe';
// import { LessonService } from '../../../../core/services/lesson.service';
// import { LessonDetailComponent } from '../lesson-detail/lesson-detail.component';
// import { LessonFormComponent } from '../lesson-form/lesson-form.component';


// @Component({
//   selector: 'app-lesson-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     TableModule,
//     ButtonModule,
//     TagModule,
//     ConfirmDialogModule,
//     ToastModule,
//     DialogModule,
//     TooltipModule,
//     DragDropModule,
//     LessonFormComponent,
//     LessonDetailComponent,
//     DurationPipe
//   ],
//   providers: [ConfirmationService, MessageService],
//   templateUrl: './lesson-list.component.html',
//   styleUrls: ['./lesson-list.component.scss']
// })
// export class LessonListComponent implements OnInit {
//   // Modern Signal Inputs/Outputs
//   sectionId = input.required<string>();
//   courseId = input.required<string>();
  
//   lessonCountChange = output<number>();
//   durationChange = output<number>();

//   // Injectors
//   private lessonService = inject(LessonService);
//   private confirmationService = inject(ConfirmationService);
//   private messageService = inject(MessageService);
//   private destroyRef = inject(DestroyRef);

//   // State Signals
//   lessons = signal<any[]>([]);
//   loading = signal<boolean>(false);
  
//   // Dialog State
//   showFormDialog = signal<boolean>(false);
//   showDetailDialog = signal<boolean>(false);
//   selectedLessonId = signal<string | null>(null);
//   selectedLesson = signal<any>(null);
//   dialogTitle = signal<string>('Add New Lesson');

//   // Drag and drop state
//   draggingIndex = signal<number | null>(null);

//   // Computed State
//   totalDuration = computed(() => {
//     return this.lessons().reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
//   });

//   constructor() {
//     // Automatically emit changes to parent (CourseCurriculum) when lessons update
//     effect(() => {
//       const data = this.lessons();
//       this.lessonCountChange.emit(data.length);
//       this.durationChange.emit(this.totalDuration());
//     }, { allowSignalWrites: true });

//     // Reload lessons if the input sectionId changes
//     effect(() => {
//       const id = this.sectionId();
//       if (id) {
//         this.loadLessons(id);
//       }
//     }, { allowSignalWrites: true });
//   }

//   ngOnInit(): void {
//     // Fallback/Initial load handled by effect above
//   }

//   private loadLessons(sectionId: string): void {
//     this.loading.set(true);
//     // this.lessonService.getLessonsBySection(this.courseId(),sectionId)
//     //   .pipe(takeUntilDestroyed(this.destroyRef))
//     //   .subscribe({
//     //     next: (res: any) => {
//     //       // Flatten array and ensure order sorting
//     //       const data = res.data?.data || res.data || [];
//     //       const sorted = Array.isArray(data) ? data.sort((a, b) => a.order - b.order) : [];
//     //       this.lessons.set(sorted);
//     //       this.loading.set(false);
//     //     },
//     //     error: (error: any) => {
//     //       console.error('Failed to load lessons', error);
//     //       this.loading.set(false);
//     //     }
//     //   });
//   }

//   // --- Drag and Drop Logic ---

//   onDragStart(index: number): void {
//     this.draggingIndex.set(index);
//   }

//   onDragEnd(): void {
//     this.draggingIndex.set(null);
//   }

//   onLessonDrop(event: any): void {
//     const dragIndex = this.draggingIndex();
//     if (dragIndex === null) return;

//     const dropIndex = event.index;
//     if (dragIndex === dropIndex) return;

//     // Mutate local array state for immediate UI feedback
//     const newLessons = [...this.lessons()];
//     const [movedLesson] = newLessons.splice(dragIndex, 1);
//     newLessons.splice(dropIndex, 0, movedLesson);

//     // Update internal order identifiers
//     const reorderedPayload = newLessons.map((lesson, index) => ({
//       id: lesson._id,
//       order: index + 1
//     }));

//     // Update signal optimistically
//     this.lessons.set(newLessons);

//     // Persist to backend
//     // this.lessonService.reorderLessons(this.courseId(),this.sectionId(), reorderedPayload)
//     //   .pipe(takeUntilDestroyed(this.destroyRef))
//     //   .subscribe({
//     //     next: () => {
//     //       this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Lessons reordered successfully' });
//     //     },
//     //     error: (error: any) => {
//     //       console.error('Failed to reorder lessons', error);
//     //       this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to reorder lessons' });
//     //       this.loadLessons(this.sectionId()); // Revert UI on failure
//     //     }
//     //   });

//     this.draggingIndex.set(null);
//   }

//   // --- Dialog & CRUD Actions ---

//   openNewLessonDialog(): void {
//     this.selectedLessonId.set(null);
//     this.dialogTitle.set('Add New Lesson');
//     this.showFormDialog.set(true);
//   }

//   viewLesson(lesson: any): void {
//     this.selectedLesson.set(lesson);
//     this.showDetailDialog.set(true);
//   }

//   editLesson(lesson: any): void {
//     this.selectedLessonId.set(lesson._id);
//     this.dialogTitle.set('Edit Lesson');
//     this.showFormDialog.set(true);
//   }

//   deleteLesson(lesson: any): void {
//     this.confirmationService.confirm({
//       message: `Are you sure you want to delete "${lesson.title}"?`,
//       header: 'Confirm Delete',
//       icon: 'pi pi-exclamation-triangle',
//       // accept: () => {
//       //   this.lessonService.deleteLesson(this.courseId(),this.sectionId(),lesson._id)
//       //     .pipe(takeUntilDestroyed(this.destroyRef))
//       //     .subscribe({
//       //       next: () => {
//       //         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Lesson deleted successfully' });
//       //         this.lessons.update(arr => arr.filter(l => l._id !== lesson._id));
//       //       },
//       //       error: (error: any) => {
//       //         console.error('Failed to delete lesson', error);
//       //         this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'Failed to delete lesson' });
//       //       }
//       //     });
//       // }
//     });
//   }

//   onLessonSaved(lesson: any): void {
//     this.messageService.add({
//       severity: 'success',
//       summary: 'Success',
//       detail: `Lesson ${this.selectedLessonId() ? 'updated' : 'created'} successfully`
//     });
//     this.closeDialog();
//     this.loadLessons(this.sectionId());
//   }

//   closeDialog(): void {
//     this.showFormDialog.set(false);
//     this.selectedLessonId.set(null);
//   }

//   editFromDetail(): void {
//     this.closeDetailDialog();
//     setTimeout(() => {
//       this.dialogTitle.set('Edit Lesson');
//       this.showFormDialog.set(true);
//     }, 150); // slight delay for smooth modal transition
//   }

//   closeDetailDialog(): void {
//     this.showDetailDialog.set(false);
//     this.selectedLesson.set(null);
//   }
// }
