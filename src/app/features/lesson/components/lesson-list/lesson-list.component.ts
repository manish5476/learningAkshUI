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
    // Fallback/Initial load handled by effect above
  }

  private loadLessons(sectionId: string): void {
    this.loading.set(true);
    this.lessonService.getLessonsBySection(sectionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          // Flatten array and ensure order sorting
          const data = res.data?.data || res.data || [];
          const sorted = Array.isArray(data) ? data.sort((a, b) => a.order - b.order) : [];
          this.lessons.set(sorted);
          this.loading.set(false);
        },
        error: (error: any) => {
          console.error('Failed to load lessons', error);
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

    // Mutate local array state for immediate UI feedback
    const newLessons = [...this.lessons()];
    const [movedLesson] = newLessons.splice(dragIndex, 1);
    newLessons.splice(dropIndex, 0, movedLesson);

    // Update internal order identifiers
    const reorderedPayload = newLessons.map((lesson, index) => ({
      id: lesson._id,
      order: index + 1
    }));

    // Update signal optimistically
    this.lessons.set(newLessons);

    // Persist to backend
    this.lessonService.reorderLessons(this.sectionId(), reorderedPayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Lessons reordered successfully' });
        },
        error: (error: any) => {
          console.error('Failed to reorder lessons', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to reorder lessons' });
          this.loadLessons(this.sectionId()); // Revert UI on failure
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
      accept: () => {
        this.lessonService.delete(lesson._id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Lesson deleted successfully' });
              this.lessons.update(arr => arr.filter(l => l._id !== lesson._id));
            },
            error: (error: any) => {
              console.error('Failed to delete lesson', error);
              this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'Failed to delete lesson' });
            }
          });
      }
    });
  }

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
    }, 150); // slight delay for smooth modal transition
  }

  closeDetailDialog(): void {
    this.showDetailDialog.set(false);
    this.selectedLesson.set(null);
  }
}

// // lesson-list.component.ts
// import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Subscription } from 'rxjs';
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ToastModule } from 'primeng/toast';
// import { DialogModule } from 'primeng/dialog';
// import { TooltipModule } from 'primeng/tooltip';
// import { DragDropModule } from 'primeng/dragdrop';
// import { ConfirmationService, MessageService } from 'primeng/api';
// import { LessonService } from '../../../../core/services/lesson.service';
// import { LessonFormComponent } from '../lesson-form.component';
// import { LessonDetailComponent } from '../lesson-detail.component';
// import { DurationPipe } from "../../../../core/pipes/duration.pipe";

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
// ],
//   providers: [ConfirmationService, MessageService],
//   template: `
//     <div class="lesson-list-container">
//       <p-toast position="top-right"></p-toast>
//       <p-confirmDialog></p-confirmDialog>

//       <!-- Header -->
//       <div class="list-header">
//         <div class="header-left">
//           <h3 class="section-title">
//             <i class="pi pi-list"></i>
//             Lessons
//           </h3>
//           <span class="lesson-count">{{ lessons.length }} lessons</span>
//           <span class="total-duration">{{ totalDuration | duration }}</span>
//         </div>
//         <div class="header-right">
//           <button pButton pRipple 
//                   label="Add Lesson" 
//                   icon="pi pi-plus" 
//                   class="p-button-success p-button-sm"
//                   (click)="openNewLessonDialog()">
//           </button>
//         </div>
//       </div>

//       <!-- Lessons List with Drag & Drop -->
//       @if (lessons.length > 0) {
//         <div class="lessons-list" 
//              pDroppable="lessons"
//              (onDrop)="onLessonDrop($event)">
          
//           @for (lesson of lessons; track lesson._id; let i = $index) {
//             <div class="lesson-item" 
//                  [attr.data-index]="i"
//                  pDraggable="lessons"
//                  (onDragStart)="onDragStart(i)"
//                  (onDragEnd)="onDragEnd()"
//                  [ngClass]="{
//                    'dragging': draggingIndex === i,
//                    'free-lesson': lesson.isFree,
//                    'video-lesson': lesson.type === 'video',
//                    'article-lesson': lesson.type === 'article',
//                    'quiz-lesson': lesson.type === 'quiz'
//                  }">
              
//               <div class="lesson-drag-handle">
//                 <i class="pi pi-bars"></i>
//               </div>

//               <div class="lesson-icon">
//                 @switch (lesson.type) {
//                   @case ('video') {
//                     <i class="pi pi-video"></i>
//                   }
//                   @case ('article') {
//                     <i class="pi pi-file"></i>
//                   }
//                   @case ('quiz') {
//                     <i class="pi pi-question-circle"></i>
//                   }
//                   @case ('assignment') {
//                     <i class="pi pi-pencil"></i>
//                   }
//                   @case ('coding-exercise') {
//                     <i class="pi pi-code"></i>
//                   }
//                 }
//               </div>

//               <div class="lesson-content">
//                 <div class="lesson-title">
//                   <span class="order">{{ i + 1 }}.</span>
//                   <span class="title">{{ lesson.title }}</span>
//                   @if (!lesson.isPublished) {
//                     <p-tag value="Draft" severity="warn" [rounded]="true" styleClass="ml-2"></p-tag>
//                   }
//                 </div>
                
//                 <div class="lesson-meta">
//                   @if (lesson.duration) {
//                     <span class="meta-item">
//                       <i class="pi pi-clock"></i>
//                       {{ lesson.duration | duration }}
//                     </span>
//                   }
//                   @if (lesson.isFree) {
//                     <span class="meta-item free-badge">
//                       <i class="pi pi-lock-open"></i>
//                       Free Preview
//                     </span>
//                   }
//                 </div>
//               </div>

//               <div class="lesson-actions">
//                 <button pButton pRipple icon="pi pi-eye" class="p-button-rounded p-button-text p-button-sm" 
//                         (click)="viewLesson(lesson)" pTooltip="View"></button>
//                 <button pButton pRipple icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm" 
//                         (click)="editLesson(lesson)" pTooltip="Edit"></button>
//                 <button pButton pRipple icon="pi pi-trash" class="p-button-rounded p-button-text p-button-sm" 
//                         (click)="deleteLesson(lesson)" pTooltip="Delete"></button>
//               </div>
//             </div>
//           }
//         </div>
//       } @else {
//         <div class="empty-lessons">
//           <i class="pi pi-file-empty"></i>
//           <h4>No lessons yet</h4>
//           <p>Add your first lesson to this section.</p>
//           <button pButton pRipple 
//                   label="Add First Lesson" 
//                   icon="pi pi-plus" 
//                   class="p-button-outlined"
//                   (click)="openNewLessonDialog()">
//           </button>
//         </div>
//       }

//       <!-- Lesson Form Dialog -->
//       <p-dialog appendTo="body" 
//         [(visible)]="showFormDialog" 
//         [style]="{width: '700px'}" 
//         [header]="dialogTitle"
//         [modal]="true"
//         [draggable]="false"
//         [resizable]="false">
//         <app-lesson-form 
//           [sectionId]="sectionId"
//           [lessonId]="selectedLessonId"
//           [courseId]="courseId"
//           (saved)="onLessonSaved($event)"
//           (cancelled)="closeDialog()">
//         </app-lesson-form>
//       </p-dialog>

//       <!-- Lesson Detail Dialog -->
//       <p-dialog appendTo="body" 
//         [(visible)]="showDetailDialog" 
//         [style]="{width: '600px'}" 
//         header="Lesson Details"
//         [modal]="true"
//         [draggable]="false"
//         [resizable]="false">
//         @if (selectedLesson) {
//           <app-lesson-detail 
//             [lesson]="selectedLesson"
//             (edit)="editFromDetail()"
//             (close)="closeDetailDialog()">
//           </app-lesson-detail>
//         }
//       </p-dialog>
//     </div>
//   `,
//   styles: [`
//     .lesson-list-container {
//       background: var(--bg-primary);
//       border-radius: var(--ui-border-radius);
//       padding: var(--spacing-lg);
//     }

//     .list-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       margin-bottom: var(--spacing-lg);
//     }

//     .header-left {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//     }

//     .section-title {
//       margin: 0;
//       font-size: var(--font-size-lg);
//       color: var(--text-primary);
//     }

//     .section-title i {
//       color: var(--accent-primary);
//       margin-right: var(--spacing-sm);
//     }

//     .lesson-count, .total-duration {
//       color: var(--text-secondary);
//       font-size: var(--font-size-sm);
//       padding: var(--spacing-xs) var(--spacing-md);
//       background: var(--bg-secondary);
//       border-radius: var(--ui-border-radius);
//     }

//     /* Lesson Items */
//     .lessons-list {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-sm);
//     }

//     .lesson-item {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//       padding: var(--spacing-md);
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       transition: var(--transition-base);
//       cursor: move;
//       position: relative;
//     }

//     .lesson-item:hover {
//       background: var(--bg-hover);
//       border-color: var(--border-primary);
//       box-shadow: var(--shadow-sm);
//     }

//     .lesson-item.dragging {
//       opacity: 0.5;
//       background: var(--accent-focus);
//       border-style: dashed;
//     }

//     .lesson-item.free-lesson {
//       border-left: 4px solid var(--color-success);
//     }

//     .lesson-item.video-lesson .lesson-icon i {
//       color: var(--color-info);
//     }

//     .lesson-item.article-lesson .lesson-icon i {
//       color: var(--color-warning);
//     }

//     .lesson-item.quiz-lesson .lesson-icon i {
//       color: var(--color-danger);
//     }

//     .lesson-drag-handle {
//       color: var(--text-tertiary);
//       cursor: grab;
//       padding: var(--spacing-xs);
//     }

//     .lesson-drag-handle:active {
//       cursor: grabbing;
//     }

//     .lesson-icon {
//       width: 32px;
//       height: 32px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       background: var(--bg-primary);
//       border-radius: 50%;
//     }

//     .lesson-icon i {
//       font-size: var(--font-size-lg);
//     }

//     .lesson-content {
//       flex: 1;
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//     }

//     .lesson-title {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       font-weight: var(--font-weight-medium);
//     }

//     .order {
//       color: var(--text-tertiary);
//       font-size: var(--font-size-sm);
//     }

//     .title {
//       color: var(--text-primary);
//     }

//     .lesson-meta {
//       display: flex;
//       gap: var(--spacing-md);
//       align-items: center;
//     }

//     .meta-item {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xs);
//       color: var(--text-tertiary);
//       font-size: var(--font-size-xs);
//     }

//     .meta-item i {
//       font-size: var(--font-size-xs);
//     }

//     .free-badge {
//       color: var(--color-success);
//     }

//     .lesson-actions {
//       display: flex;
//       gap: var(--spacing-xs);
//       opacity: 0;
//       transition: var(--transition-fast);
//     }

//     .lesson-item:hover .lesson-actions {
//       opacity: 1;
//     }

//     /* Empty State */
//     .empty-lessons {
//       text-align: center;
//       padding: var(--spacing-3xl);
//       background: var(--bg-secondary);
//       border: 2px dashed var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//     }

//     .empty-lessons i {
//       font-size: 3rem;
//       color: var(--text-tertiary);
//       margin-bottom: var(--spacing-md);
//     }

//     .empty-lessons h4 {
//       color: var(--text-primary);
//       margin: 0 0 var(--spacing-xs);
//     }

//     .empty-lessons p {
//       color: var(--text-secondary);
//       margin-bottom: var(--spacing-xl);
//     }

//     @media (max-width: 768px) {
//       .lesson-item {
//         flex-wrap: wrap;
//       }

//       .lesson-actions {
//         opacity: 1;
//         margin-left: auto;
//       }

//       .lesson-meta {
//         flex-wrap: wrap;
//       }
//     }
//   `]
// })
// export class LessonListComponent implements OnInit, OnDestroy {
//   @Input() sectionId!: string;
//   @Input() courseId!: string;
//   @Output() lessonCountChange = new EventEmitter<number>();
//   @Output() durationChange = new EventEmitter<number>();

//   @ViewChild('dt') table: any;

//   private lessonService = inject(LessonService);
//   private confirmationService = inject(ConfirmationService);
//   private messageService = inject(MessageService);

//   lessons: any[] = [];
//   totalDuration = 0;
//   loading = false;

//   showFormDialog = false;
//   showDetailDialog = false;
//   selectedLessonId: string | null = null;
//   selectedLesson: any = null;
//   dialogTitle = 'Add New Lesson';

//   // Drag and drop
//   draggingIndex: number | null = null;
//   draggedItem: any = null;

//   private subscriptions: Subscription[] = [];

//   ngOnInit(): void {
//     this.loadLessons();
//   }

//   ngOnDestroy(): void {
//     this.subscriptions.forEach(sub => sub.unsubscribe());
//   }

//   loadLessons(): void {
//     if (!this.sectionId) return;

//     this.loading = true;
//     const sub = this.lessonService.getLessonsBySection(this.sectionId).subscribe({
//       next: (res) => {
//         this.lessons = res.data || [];
//         this.calculateTotalDuration();
//         this.loading = false;
//         this.lessonCountChange.emit(this.lessons.length);
//       },
//       error: (error) => {
//         console.error('Failed to load lessons', error);
//         this.loading = false;
//       }
//     });
//     this.subscriptions.push(sub);
//   }

//   calculateTotalDuration(): void {
//     this.totalDuration = this.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
//     this.durationChange.emit(this.totalDuration);
//   }

//   // Drag and Drop
//   onDragStart(index: number): void {
//     this.draggingIndex = index;
//     this.draggedItem = this.lessons[index];
//   }

//   onDragEnd(): void {
//     this.draggingIndex = null;
//   }

//   onLessonDrop(event: any): void {
//     if (this.draggingIndex === null || !this.draggedItem) return;

//     const dropIndex = event.index;
//     if (this.draggingIndex === dropIndex) return;

//     // Reorder lessons
//     const newLessons = [...this.lessons];
//     const [movedLesson] = newLessons.splice(this.draggingIndex, 1);
//     newLessons.splice(dropIndex, 0, movedLesson);

//     // Update order numbers
//     const reorderedLessons = newLessons.map((lesson, index) => ({
//       id: lesson._id,
//       order: index + 1
//     }));

//     // Save reorder
//     const sub = this.lessonService.reorderLessons(this.sectionId, reorderedLessons).subscribe({
//       next: () => {
//         this.lessons = newLessons;
//         this.messageService.add({
//           severity: 'success',
//           summary: 'Success',
//           detail: 'Lessons reordered successfully'
//         });
//       },
//       error: (error) => {
//         console.error('Failed to reorder lessons', error);
//         this.messageService.add({
//           severity: 'error',
//           summary: 'Error',
//           detail: 'Failed to reorder lessons'
//         });
//       }
//     });
//     this.subscriptions.push(sub);

//     this.draggingIndex = null;
//     this.draggedItem = null;
//   }

//   // Dialog Actions
//   openNewLessonDialog(): void {
//     this.selectedLessonId = null;
//     this.dialogTitle = 'Add New Lesson';
//     this.showFormDialog = true;
//   }

//   viewLesson(lesson: any): void {
//     this.selectedLesson = lesson;
//     this.showDetailDialog = true;
//   }

//   editLesson(lesson: any): void {
//     this.selectedLessonId = lesson._id;
//     this.dialogTitle = 'Edit Lesson';
//     this.showFormDialog = true;
//   }

//   deleteLesson(lesson: any): void {
//     this.confirmationService.confirm({
//       message: `Are you sure you want to delete "${lesson.title}"?`,
//       header: 'Confirm Delete',
//       icon: 'pi pi-exclamation-triangle',
//       accept: () => {
//         const sub = this.lessonService.delete(lesson._id).subscribe({
//           next: () => {
//             this.messageService.add({
//               severity: 'success',
//               summary: 'Success',
//               detail: 'Lesson deleted successfully'
//             });
//             this.loadLessons();
//           },
//           error: (error) => {
//             console.error('Failed to delete lesson', error);
//             this.messageService.add({
//               severity: 'error',
//               summary: 'Error',
//               detail: error.error?.message || 'Failed to delete lesson'
//             });
//           }
//         });
//         this.subscriptions.push(sub);
//       }
//     });
//   }

//   onLessonSaved(lesson: any): void {
//     this.messageService.add({
//       severity: 'success',
//       summary: 'Success',
//       detail: `Lesson ${this.selectedLessonId ? 'updated' : 'created'} successfully`
//     });
//     this.closeDialog();
//     this.loadLessons();
//   }

//   closeDialog(): void {
//     this.showFormDialog = false;
//     this.selectedLessonId = null;
//   }

//   editFromDetail(): void {
//     this.closeDetailDialog();
//     setTimeout(() => {
//       this.dialogTitle = 'Edit Lesson';
//       this.showFormDialog = true;
//     });
//   }

//   closeDetailDialog(): void {
//     this.showDetailDialog = false;
//     this.selectedLesson = null;
//   }
// }