import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG Imports
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { DragDropModule } from 'primeng/dragdrop';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CourseService } from '../../../../core/services/course.service';
import { SectionService } from '../../../../core/services/section.service';
import { LessonListComponent } from "../../../lesson/components/lesson-list/lesson-list.component";
import { DurationPipe } from "../../../../core/pipes/duration.pipe";

// Services

@Component({
  selector: 'app-course-curriculum',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    DragDropModule,
    TooltipModule,
    LessonListComponent,
    DurationPipe
],
  providers: [MessageService, ConfirmationService],
  templateUrl: './course-curriculum.component.html',
  styleUrl: './course-curriculum.component.scss'
})
export class CourseCurriculumComponent implements OnInit {
  // Injections
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private sectionService = inject(SectionService);
  private courseService = inject(CourseService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Signals
  courseId = signal<string>('');
  course = signal<any>(null); // Replace 'any' with your Course interface
  sections = signal<any[]>([]); // Replace 'any' with your Section interface
  loading = signal<boolean>(true);
  
  // Dialog State
  showSectionDialog = signal<boolean>(false);
  editingSectionId = signal<string | null>(null);
  
  // Drag & Drop State
  draggedSectionIndex = signal<number | null>(null);

  // Form
  sectionForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    isPublished: [true]
  });

  // Computed Properties (Derived State)
  sectionDialogTitle = computed(() => this.editingSectionId() ? 'Edit Section' : 'Add New Section');
  
  // Calculate totals dynamically based on the sections array
  totalSections = computed(() => this.sections().length);
  totalLessons = computed(() => 
    this.sections().reduce((acc, curr) => acc + (curr.totalLessons || 0), 0)
  );
  totalDuration = computed(() => 
    this.sections().reduce((acc, curr) => acc + (curr.totalDuration || 0), 0)
  );

  ngOnInit(): void {
    // Extract ID from route (e.g., /courses/:id/curriculum)
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseId.set(id);
      this.loadData();
    }
  }

  loadData(): void {
    this.loading.set(true);
    
    // Fetch Course Details
    this.courseService.getById(this.courseId()).subscribe({
      next: (res: any) => {
        // Unwrapping the double data structure based on your JSON snippet
        // { "status": "success", "data": { "data": { ... } } }
        const courseData = res.data?.data || res.data; 
        this.course.set(courseData);
      },
      error: (err) => this.showError('Failed to load course details')
    });

    // Fetch Sections
    this.loadSections();
  }

  loadSections(): void {
    this.sectionService.getSectionsByCourse(this.courseId()).subscribe({
      next: (res: any) => {
        // Map over sections to ensure 'expanded' property exists for UI toggling
        const sectionsData = (res.data?.data || res.data || []).map((s: any) => ({
          ...s,
          expanded: false
        }));
        this.sections.set(sectionsData);
        this.loading.set(false);
      },
      error: (err) => {
        this.showError('Failed to load sections');
        this.loading.set(false);
      }
    });
  }

  // --- Dialog & Form Management ---

  openAddSectionDialog(): void {
    this.editingSectionId.set(null);
    this.sectionForm.reset({ isPublished: true });
    this.showSectionDialog.set(true);
  }

  editSection(section: any): void {
    this.editingSectionId.set(section._id);
    this.sectionForm.patchValue({
      title: section.title,
      description: section.description,
      isPublished: section.isPublished
    });
    this.showSectionDialog.set(true);
  }

  closeSectionDialog(): void {
    this.showSectionDialog.set(false);
    this.sectionForm.reset();
  }

  saveSection(): void {
    if (this.sectionForm.invalid) {
      this.sectionForm.markAllAsTouched();
      return;
    }

    const formData = {
      ...this.sectionForm.value,
      course: this.courseId() // Link section to current course
    };

    const editId = this.editingSectionId();

    if (editId) {
      // Update existing
      this.sectionService.update(editId, formData).subscribe({
        next: () => {
          this.showSuccess('Section updated successfully');
          this.closeSectionDialog();
          this.loadSections(); // Refresh list
        },
        error: () => this.showError('Failed to update section')
      });
    } else {
      // Create new
      this.sectionService.create(formData).subscribe({
        next: () => {
          this.showSuccess('Section created successfully');
          this.closeSectionDialog();
          this.loadSections(); // Refresh list
        },
        error: () => this.showError('Failed to create section')
      });
    }
  }

  deleteSection(section: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${section.title}"? All lessons inside will also be removed.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.sectionService.delete(section._id).subscribe({
          next: () => {
            this.showSuccess('Section deleted');
            this.loadSections();
          },
          error: () => this.showError('Failed to delete section')
        });
      }
    });
  }

  // --- UI Interactions ---

  toggleSection(sectionId: string): void {
    this.sections.update(sections => 
      sections.map(s => 
        s._id === sectionId ? { ...s, expanded: !s.expanded } : s
      )
    );
  }

  // --- Drag & Drop Reordering ---

  onSectionDragStart(index: number): void {
    this.draggedSectionIndex.set(index);
  }

  onSectionDragEnd(): void {
    this.draggedSectionIndex.set(null);
  }

  onSectionDrop(event: any): void {
    const fromIndex = this.draggedSectionIndex();
    if (fromIndex === null) return;

    // Determine drop target index based on the element dropped on
    const target = event.target.closest('.section-card');
    if (!target) return;
    
    const toIndex = parseInt(target.getAttribute('data-index'), 10);
    if (isNaN(toIndex) || fromIndex === toIndex) return;

    // Reorder locally first for instant UI feedback
    const updatedSections = [...this.sections()];
    const [movedSection] = updatedSections.splice(fromIndex, 1);
    updatedSections.splice(toIndex, 0, movedSection);
    
    this.sections.set(updatedSections);

    // Prepare payload for backend: { id: string, order: number }[]
    const reorderPayload = updatedSections.map((sec, index) => ({
      id: sec._id,
      order: index
    }));

    // Send to backend
    this.sectionService.reorderSections(this.courseId(), reorderPayload).subscribe({
      next: () => this.showSuccess('Sections reordered'),
      error: () => {
        this.showError('Failed to save new order');
        this.loadSections(); // Revert on failure
      }
    });
  }

  // --- Child Component Event Handlers ---

  onLessonCountChange(count: number, sectionId: string): void {
    this.sections.update(sections => 
      sections.map(s => 
        s._id === sectionId ? { ...s, totalLessons: count } : s
      )
    );
  }

  onDurationChange(duration: number, sectionId: string): void {
    this.sections.update(sections => 
      sections.map(s => 
        s._id === sectionId ? { ...s, totalDuration: duration } : s
      )
    );
  }

  // --- Helpers ---

  private showSuccess(detail: string): void {
    this.messageService.add({ severity: 'success', summary: 'Success', detail });
  }

  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
}
// import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { DragDropModule } from 'primeng/dragdrop';
// import { InputTextModule } from 'primeng/inputtext';
// import { TextareaModule } from 'primeng/textarea';
// import { DialogModule } from 'primeng/dialog';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ToastModule } from 'primeng/toast';
// import { TooltipModule } from 'primeng/tooltip';
// import { CheckboxModule } from 'primeng/checkbox';
// import { ConfirmationService, MessageService } from 'primeng/api';

// // Services & Pipes
// import { CourseService } from '../../../core/services/course.service';
// import { SectionService } from '../../../core/services/section.service';
// import { DurationPipe } from '../../../core/pipes/duration.pipe';
// import { LessonListComponent } from '../../lesson/components/lesson-list/lesson-list.component';

// @Component({
//   selector: 'app-course-curriculum',
//   standalone: true,
//   imports: [CommonModule,RouterModule,ReactiveFormsModule,ButtonModule,CheckboxModule,DragDropModule,InputTextModule,TextareaModule,DialogModule,ConfirmDialogModule,ToastModule,TooltipModule,DurationPipe,LessonListComponent  ],
//   providers: [ConfirmationService, MessageService],
//   templateUrl: './course-curriculum.component.html',
//   styleUrls: ['./course-curriculum.component.scss']
// })
// export class CourseCurriculumComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private fb = inject(FormBuilder);
//   private courseService = inject(CourseService);
//   private sectionService = inject(SectionService);
//   private confirmationService = inject(ConfirmationService);
//   private messageService = inject(MessageService);
//   private destroyRef = inject(DestroyRef);

//   // Reactive State Signals
//   courseId = signal<string>('');
//   course = signal<any>(null);
//   sections = signal<any[]>([]);
//   loading = signal<boolean>(true);
  
//   // Computed Stats
//   totalSections = computed(() => this.sections().length);
//   totalLessons = computed(() => this.sections().reduce((sum, section) => sum + (section.totalLessons || 0), 0));
//   totalDuration = computed(() => this.sections().reduce((sum, section) => sum + (section.totalDuration || 0), 0));

//   // Dialog & Form State
//   showSectionDialog = signal<boolean>(false);
//   sectionDialogTitle = signal<string>('Add New Section');
//   editingSectionId = signal<string | null>(null);
  
//   sectionForm: FormGroup = this.fb.group({title: ['', Validators.required],
//     description: [''],
//     isPublished: [true]
//   });

//   // Drag State
//   private draggingSectionIndex: number | null = null;

//   ngOnInit(): void {
//     this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
//       const id = params['id'];
//       if (id) {
//         this.courseId.set(id);
//         this.loadCurriculum(id);
//       }
//     });
//   }

//   loadCurriculum(id: string): void {
//     this.loading.set(true);
    
//     // Assuming edit view uses getById to fetch course + sections
//     this.courseService.getById(id)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           const payload = res.data?.data 
//           this.course.set(payload);
          
//           const mappedSections = (payload?.sections || []).map((section: any) => ({
//             ...section,
//             expanded: true
//           }));
          
//           this.sections.set(mappedSections);
//           this.loading.set(false);
//         },
//         error: (error: any) => {
//           console.error('Failed to load curriculum', error);
//           this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load course curriculum' });
//           this.loading.set(false);
//         }
//       });
//   }

//   // --- Section Dialog Management ---

//   openAddSectionDialog(): void {
//     this.editingSectionId.set(null);
//     this.sectionDialogTitle.set('Add New Section');
//     this.sectionForm.reset({ isPublished: true });
//     this.showSectionDialog.set(true);
//   }

//   editSection(section: any): void {
//     this.editingSectionId.set(section._id);
//     this.sectionDialogTitle.set('Edit Section');
//     this.sectionForm.patchValue({
//       title: section.title,
//       description: section.description || '',
//       isPublished: section.isPublished
//     });
//     this.showSectionDialog.set(true);
//   }

//   closeSectionDialog(): void {
//     this.showSectionDialog.set(false);
//     this.editingSectionId.set(null);
//     this.sectionForm.reset();
//   }

//   saveSection(): void {
//     if (this.sectionForm.invalid) {
//       this.sectionForm.markAllAsTouched();
//       return;
//     }

//     // Attach courseId here as required by the backend controller
//     const sectionData = {
//       ...this.sectionForm.value,
//       course: this.courseId() 
//     };

//     const editId = this.editingSectionId();

//     if (editId) {
//       // Calls update(id, data) from section.service.ts
//       this.sectionService.update(editId, sectionData)
//         .pipe(takeUntilDestroyed(this.destroyRef))
//         .subscribe({
//           next: (res: any) => {
//             const updatedSection = res.data?.section || res.data;
//             this.sections.update(arr => arr.map(s => s._id === editId ? { ...s, ...updatedSection } : s));
//             this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Section updated' });
//             this.closeSectionDialog();
//           },
//           error: (err) => this.handleError('update', err)
//         });
//     } else {
//       // Calls create(data) from section.service.ts
//       this.sectionService.create(sectionData)
//         .pipe(takeUntilDestroyed(this.destroyRef))
//         .subscribe({
//           next: (res: any) => {
//             const newSection = res.data?.section || res.data;
//             this.sections.update(arr => [...arr, { ...newSection, expanded: true, lessons: [] }]);
//             this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Section created' });
//             this.closeSectionDialog();
//           },
//           error: (err) => this.handleError('create', err)
//         });
//     }
//   }

//   deleteSection(section: any): void {
//     this.confirmationService.confirm({
//       message: `Are you sure you want to delete "${section.title}"? This will also delete all lessons in this section.`,
//       header: 'Confirm Delete',
//       icon: 'pi pi-exclamation-triangle',
//       accept: () => {
//         // Calls delete(id) from section.service.ts
//         this.sectionService.delete(section._id)
//           .pipe(takeUntilDestroyed(this.destroyRef))
//           .subscribe({
//             next: () => {
//               this.sections.update(arr => arr.filter(s => s._id !== section._id));
//               this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Section deleted' });
//             },
//             error: (err) => this.handleError('delete', err)
//           });
//       }
//     });
//   }

//   toggleSection(sectionId: string): void {
//     this.sections.update(arr => arr.map(s => 
//       s._id === sectionId ? { ...s, expanded: !s.expanded } : s
//     ));
//   }

//   // --- Drag & Drop Reordering ---

//   onSectionDragStart(index: number): void {
//     this.draggingSectionIndex = index;
//   }

//   onSectionDragEnd(): void {
//     this.draggingSectionIndex = null;
//   }

//   onSectionDrop(event: any): void {
//     if (this.draggingSectionIndex === null) return;

//     const dropIndex = event.index;
//     if (this.draggingSectionIndex === dropIndex) return;

//     const currentSections = [...this.sections()];
//     const [movedSection] = currentSections.splice(this.draggingSectionIndex, 1);
//     currentSections.splice(dropIndex, 0, movedSection);

//     const reorderedPayload = currentSections.map((section, index) => ({
//       id: section._id,
//       order: index + 1
//     }));

//     // Optimistically update UI
//     this.sections.set(currentSections);

//     // Call reorderSections(courseId, sectionsArray) - directly passing array
//     // Service already wraps it: { sections: data }
//     this.sectionService.reorderSections(this.courseId(), reorderedPayload)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: () => {
//           this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Sections reordered' });
//         },
//         error: (err) => {
//           this.handleError('reorder', err);
//           // Revert UI on failure
//           this.loadCurriculum(this.courseId());
//         }
//       });

//     this.draggingSectionIndex = null;
//   }

//   // --- Propagated Lesson Updates ---

//   onLessonCountChange(count: number, sectionId: string): void {
//     this.sections.update(arr => arr.map(s => 
//       s._id === sectionId ? { ...s, totalLessons: count } : s
//     ));
//   }

//   onDurationChange(duration: number, sectionId: string): void {
//     this.sections.update(arr => arr.map(s => 
//       s._id === sectionId ? { ...s, totalDuration: duration } : s
//     ));
//   }

//   private handleError(action: string, err: any): void {
//     console.error(`Failed to ${action} section`, err);
//     this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || `Failed to ${action} section` });
//   }
// }

// // import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
// // import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// // import { CommonModule } from '@angular/common';
// // import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// // import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// // // PrimeNG
// // import { ButtonModule } from 'primeng/button';
// // import { DragDropModule } from 'primeng/dragdrop';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { TextareaModule } from 'primeng/textarea';
// // import { DialogModule } from 'primeng/dialog';
// // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // import { ToastModule } from 'primeng/toast';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { CheckboxModule } from 'primeng/checkbox';
// // import { ConfirmationService, MessageService } from 'primeng/api';

// // // Services & Pipes (Ensure paths are correct for your workspace)
// // import { CourseService } from '../../../core/services/course.service';
// // import { SectionService } from '../../../core/services/section.service';
// // import { DurationPipe } from '../../../core/pipes/duration.pipe';
// // import { LessonListComponent } from '../../lesson/components/lesson-list.component';

// // @Component({
// //   selector: 'app-course-curriculum',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     RouterModule,
// //     ReactiveFormsModule,
// //     ButtonModule,
// //     CheckboxModule,
// //     DragDropModule,
// //     InputTextModule,
// //     TextareaModule,
// //     DialogModule,
// //     ConfirmDialogModule,
// //     ToastModule,
// //     TooltipModule,
// //     DurationPipe,
// //     LessonListComponent
// //   ],
// //   providers: [ConfirmationService, MessageService],
// //   templateUrl: './course-curriculum.component.html',
// //   styleUrls: ['./course-curriculum.component.scss']
// // })
// // export class CourseCurriculumComponent implements OnInit {
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);
// //   private fb = inject(FormBuilder);
// //   private courseService = inject(CourseService);
// //   private sectionService = inject(SectionService);
// //   private confirmationService = inject(ConfirmationService);
// //   private messageService = inject(MessageService);
// //   private destroyRef = inject(DestroyRef);

// //   // Reactive State Signals
// //   courseId = signal<string>('');
// //   course = signal<any>(null);
// //   sections = signal<any[]>([]);
// //   loading = signal<boolean>(true);
  
// //   // Computed Stats (Automatically updates when sections change)
// //   totalSections = computed(() => this.sections().length);
// //   totalLessons = computed(() => this.sections().reduce((sum, section) => sum + (section.totalLessons || 0), 0));
// //   totalDuration = computed(() => this.sections().reduce((sum, section) => sum + (section.totalDuration || 0), 0));

// //   // Dialog & Form State
// //   showSectionDialog = signal<boolean>(false);
// //   sectionDialogTitle = signal<string>('Add New Section');
// //   editingSectionId = signal<string | null>(null);
  
// //   sectionForm: FormGroup = this.fb.group({
// //     title: ['', Validators.required],
// //     description: [''],
// //     isPublished: [true]
// //   });

// //   // Drag State
// //   private draggingSectionIndex: number | null = null;

// //   ngOnInit(): void {
// //     this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
// //       const id = params['id'];
// //       if (id) {
// //         // Checking if ID is standard mongo ID or slug. Based on backend, if it's an edit view, it usually passes the Mongo ID.
// //         // Assuming your backend route handles it, or using getById for instructor edits:
// //         this.courseId.set(id);
// //         this.loadCurriculum(id);
// //       }
// //     });
// //   }

// //   loadCurriculum(id: string): void {
// //     this.loading.set(true);
    
// //     // Instructors typically use getById to see drafts, adjusting based on your service
// //     this.courseService.getById(id)
// //       .pipe(takeUntilDestroyed(this.destroyRef))
// //       .subscribe({
// //         next: (res: any) => {
// //           const payload = res.data?.data || res.data;
// //           this.course.set(payload);
          
// //           // Map sections to include UI state
// //           const mappedSections = (payload?.sections || []).map((section: any) => ({
// //             ...section,
// //             expanded: true
// //           }));
          
// //           this.sections.set(mappedSections);
// //           this.loading.set(false);
// //         },
// //         error: (error: any) => {
// //           console.error('Failed to load curriculum', error);
// //           this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load course curriculum' });
// //           this.loading.set(false);
// //         }
// //       });
// //   }

// //   // --- Section Dialog Management ---

// //   openAddSectionDialog(): void {
// //     this.editingSectionId.set(null);
// //     this.sectionDialogTitle.set('Add New Section');
// //     this.sectionForm.reset({ isPublished: true });
// //     this.showSectionDialog.set(true);
// //   }

// //   editSection(section: any): void {
// //     this.editingSectionId.set(section._id);
// //     this.sectionDialogTitle.set('Edit Section');
// //     this.sectionForm.patchValue({
// //       title: section.title,
// //       description: section.description || '',
// //       isPublished: section.isPublished
// //     });
// //     this.showSectionDialog.set(true);
// //   }

// //   closeSectionDialog(): void {
// //     this.showSectionDialog.set(false);
// //     this.editingSectionId.set(null);
// //     this.sectionForm.reset();
// //   }

// //   saveSection(): void {
// //     if (this.sectionForm.invalid) {
// //       this.sectionForm.markAllAsTouched();
// //       return;
// //     }

// //     const sectionData = {
// //       ...this.sectionForm.value,
// //       course: this.courseId()
// //     };

// //     const editId = this.editingSectionId();

// //     if (editId) {
// //       this.sectionService.update(this.courseId(), editId, sectionData)
// //         .pipe(takeUntilDestroyed(this.destroyRef))
// //         .subscribe({
// //           next: (res: any) => {
// //             this.sections.update(arr => arr.map(s => s._id === editId ? { ...s, ...res.data } : s));
// //             this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Section updated' });
// //             this.closeSectionDialog();
// //           },
// //           error: (err) => this.handleError('update', err)
// //         });
// //     } else {
// //       // Create new section. Passing courseId based on your Service signature
// //       this.sectionService.createSection(this.courseId(), sectionData)
// //         .pipe(takeUntilDestroyed(this.destroyRef))
// //         .subscribe({
// //           next: (res: any) => {
// //             this.sections.update(arr => [...arr, { ...res.data, expanded: true, lessons: [] }]);
// //             this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Section created' });
// //             this.closeSectionDialog();
// //           },
// //           error: (err) => this.handleError('create', err)
// //         });
// //     }
// //   }

// //   deleteSection(section: any): void {
// //     this.confirmationService.confirm({
// //       message: `Are you sure you want to delete "${section.title}"? This will also delete all lessons in this section.`,
// //       header: 'Confirm Delete',
// //       icon: 'pi pi-exclamation-triangle',
// //       accept: () => {
// //         this.sectionService.delete(this.courseId(), section._id)
// //           .pipe(takeUntilDestroyed(this.destroyRef))
// //           .subscribe({
// //             next: () => {
// //               this.sections.update(arr => arr.filter(s => s._id !== section._id));
// //               this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Section deleted' });
// //             },
// //             error: (err) => this.handleError('delete', err)
// //           });
// //       }
// //     });
// //   }

// //   toggleSection(sectionId: string): void {
// //     this.sections.update(arr => arr.map(s => 
// //       s._id === sectionId ? { ...s, expanded: !s.expanded } : s
// //     ));
// //   }

// //   // --- Drag & Drop Reordering ---

// //   onSectionDragStart(index: number): void {
// //     this.draggingSectionIndex = index;
// //   }

// //   onSectionDragEnd(): void {
// //     this.draggingSectionIndex = null;
// //   }

// //   onSectionDrop(event: any): void {
// //     if (this.draggingSectionIndex === null) return;

// //     const dropIndex = event.index;
// //     if (this.draggingSectionIndex === dropIndex) return;

// //     const currentSections = [...this.sections()];
// //     const [movedSection] = currentSections.splice(this.draggingSectionIndex, 1);
// //     currentSections.splice(dropIndex, 0, movedSection);

// //     // Map to required payload: array of { id, order }
// //     const reorderedPayload = currentSections.map((section, index) => ({
// //       id: section._id,
// //       order: index + 1
// //     }));

// //     this.sectionService.reorderSections(this.courseId(), { sections: reorderedPayload })
// //       .pipe(takeUntilDestroyed(this.destroyRef))
// //       .subscribe({
// //         next: () => {
// //           this.sections.set(currentSections);
// //           this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Sections reordered' });
// //         },
// //         error: (err) => {
// //           this.handleError('reorder', err);
// //           this.loadCurriculum(this.courseId()); // Revert UI state on failure
// //         }
// //       });

// //     this.draggingSectionIndex = null;
// //   }

// //   // --- Propagated Lesson Updates ---

// //   onLessonCountChange(count: number, sectionId: string): void {
// //     this.sections.update(arr => arr.map(s => 
// //       s._id === sectionId ? { ...s, totalLessons: count } : s
// //     ));
// //   }

// //   onDurationChange(duration: number, sectionId: string): void {
// //     this.sections.update(arr => arr.map(s => 
// //       s._id === sectionId ? { ...s, totalDuration: duration } : s
// //     ));
// //   }

// //   private handleError(action: string, err: any): void {
// //     console.error(`Failed to ${action} section`, err);
// //     this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || `Failed to ${action} section` });
// //   }
// // }

// // // // course-curriculum.component.ts
// // // import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// // // import { Subscription } from 'rxjs';
// // // import { ButtonModule } from 'primeng/button';
// // // import { CardModule } from 'primeng/card';
// // // import { AccordionModule } from 'primeng/accordion';
// // // import { DragDropModule } from 'primeng/dragdrop';
// // // import { InputTextModule } from 'primeng/inputtext';
// // // import { DialogModule } from 'primeng/dialog';
// // // import { ConfirmDialogModule } from 'primeng/confirmdialog';
// // // import { ToastModule } from 'primeng/toast';
// // // import { TooltipModule } from 'primeng/tooltip';
// // // import { TagModule } from 'primeng/tag';
// // // import { DividerModule } from 'primeng/divider';
// // // import { FormsModule } from '@angular/forms';
// // // import { ConfirmationService, MessageService } from 'primeng/api';
// // // import { CourseService } from '../../../core/services/course.service';
// // // import { SectionService } from '../../../core/services/section.service';
// // // import { LessonService } from '../../../core/services/lesson.service';
// // // import { DurationPipe } from '../../../core/pipes/duration.pipe';
// // // import { LessonListComponent } from '../../lesson/components/lesson-list.component';
// // // import { CheckboxModule } from 'primeng/checkbox';

// // // @Component({
// // //   selector: 'app-course-curriculum',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule,
// // //     RouterModule,
// // //     FormsModule,
// // //     ButtonModule,
// // //     CardModule,CheckboxModule,
// // //     AccordionModule,
// // //     DragDropModule,
// // //     InputTextModule,
// // //     DialogModule,
// // //     ConfirmDialogModule,
// // //     ToastModule,
// // //     TooltipModule,
// // //     TagModule,
// // //     DividerModule,
// // //     DurationPipe,
// // //     LessonListComponent
// // //   ],
// // //   providers: [ConfirmationService, MessageService],
// // //   template: `
// // //     <div class="course-curriculum-container">
// // //       <p-toast position="top-right"></p-toast>
// // //       <p-confirmDialog></p-confirmDialog>

// // //       <!-- Header -->
// // //       <div class="curriculum-header">
// // //         <div class="header-left">
// // //           <button pButton pRipple 
// // //                   icon="pi pi-arrow-left" 
// // //                   class="p-button-rounded p-button-text"
// // //                   [routerLink]="['/instructor/courses', courseId]">
// // //           </button>
// // //           <div>
// // //             <h1 class="page-title">Course Curriculum</h1>
// // //             <p class="course-title">{{ course?.title }}</p>
// // //           </div>
// // //         </div>
// // //         <div class="header-actions">
// // //           <button pButton pRipple 
// // //                   label="Preview Course" 
// // //                   icon="pi pi-eye" 
// // //                   class="p-button-outlined p-button-sm"
// // //                   [routerLink]="['/courses', courseId]">
// // //           </button>
// // //           <button pButton pRipple 
// // //                   label="Add Section" 
// // //                   icon="pi pi-plus" 
// // //                   class="p-button-success p-button-sm"
// // //                   (click)="openAddSectionDialog()">
// // //           </button>
// // //         </div>
// // //       </div>

// // //       <!-- Loading State -->
// // //       @if (loading) {
// // //         <div class="loading-state">
// // //           <div class="spinner"></div>
// // //           <p>Loading curriculum...</p>
// // //         </div>
// // //       } @else {
// // //         <!-- Curriculum Stats -->
// // //         <div class="curriculum-stats">
// // //           <div class="stat-card">
// // //             <div class="stat-icon">
// // //               <i class="pi pi-sitemap"></i>
// // //             </div>
// // //             <div class="stat-content">
// // //               <span class="stat-value">{{ totalSections }}</span>
// // //               <span class="stat-label">Sections</span>
// // //             </div>
// // //           </div>
// // //           <div class="stat-card">
// // //             <div class="stat-icon">
// // //               <i class="pi pi-file"></i>
// // //             </div>
// // //             <div class="stat-content">
// // //               <span class="stat-value">{{ totalLessons }}</span>
// // //               <span class="stat-label">Lessons</span>
// // //             </div>
// // //           </div>
// // //           <div class="stat-card">
// // //             <div class="stat-icon">
// // //               <i class="pi pi-clock"></i>
// // //             </div>
// // //             <div class="stat-content">
// // //               <span class="stat-value">{{ totalDuration | duration }}</span>
// // //               <span class="stat-label">Total Duration</span>
// // //             </div>
// // //           </div>
// // //         </div>

// // //         <!-- Sections List -->
// // //         <div class="sections-container" 
// // //              pDroppable="sections"
// // //              (onDrop)="onSectionDrop($event)">
          
// // //           @for (section of sections; track section._id; let i = $index) {
// // //             <div class="section-card" 
// // //                  [attr.data-index]="i"
// // //                  pDraggable="sections"
// // //                  (onDragStart)="onSectionDragStart(i)"
// // //                  (onDragEnd)="onSectionDragEnd()">
              
// // //               <!-- Section Header -->
// // //               <div class="section-header">
// // //                 <div class="section-drag-handle">
// // //                   <i class="pi pi-bars"></i>
// // //                 </div>
                
// // //                 <div class="section-info">
// // //                   <div class="section-title-wrapper">
// // //                     <h3 class="section-title">{{ section.title }}</h3>
// // //                     <div class="section-meta">
// // //                       <span class="meta-item">
// // //                         <i class="pi pi-file"></i> {{ section.totalLessons || 0 }} lessons
// // //                       </span>
// // //                       <span class="meta-item">
// // //                         <i class="pi pi-clock"></i> {{ (section.totalDuration || 0) | duration }}
// // //                       </span>
// // //                       @if (!section.isPublished) {
// // //                         <p-tag value="Draft" severity="warn" [rounded]="true"></p-tag>
// // //                       }
// // //                     </div>
// // //                   </div>
// // //                 </div>

// // //                 <div class="section-actions">
// // //                   <button pButton pRipple 
// // //                           icon="pi pi-pencil" 
// // //                           class="p-button-rounded p-button-text p-button-sm"
// // //                           (click)="editSection(section)"
// // //                           pTooltip="Edit Section">
// // //                   </button>
// // //                   <button pButton pRipple 
// // //                           icon="pi pi-trash" 
// // //                           class="p-button-rounded p-button-text p-button-danger p-button-sm"
// // //                           (click)="deleteSection(section)"
// // //                           pTooltip="Delete Section">
// // //                   </button>
// // //                   <button pButton pRipple 
// // //                           icon="pi pi-chevron-down" 
// // //                           class="p-button-rounded p-button-text p-button-sm"
// // //                           (click)="toggleSection(section)">
// // //                   </button>
// // //                 </div>
// // //               </div>

// // //               <!-- Section Content (Lessons) -->
// // //               @if (section.expanded) {
// // //                 <div class="section-content">
// // //                   <app-lesson-list 
// // //                     [sectionId]="section._id"
// // //                     [courseId]="courseId"
// // //                     (lessonCountChange)="onLessonCountChange($event, section)"
// // //                     (durationChange)="onDurationChange($event, section)">
// // //                   </app-lesson-list>
// // //                 </div>
// // //               }
// // //             </div>
// // //           }

// // //           <!-- Empty State -->
// // //           @if (sections.length === 0) {
// // //             <div class="empty-state">
// // //               <i class="pi pi-sitemap"></i>
// // //               <h3>No Sections Yet</h3>
// // //               <p>Start building your course by adding sections and lessons.</p>
// // //               <button pButton pRipple 
// // //                       label="Add First Section" 
// // //                       icon="pi pi-plus" 
// // //                       class="p-button-primary"
// // //                       (click)="openAddSectionDialog()">
// // //               </button>
// // //             </div>
// // //           }
// // //         </div>

// // //         <!-- Section Form Dialog -->
// // //         <p-dialog appendTo="body" 
// // //           [(visible)]="showSectionDialog" 
// // //           [style]="{width: '500px'}" 
// // //           [header]="sectionDialogTitle"
// // //           [modal]="true"
// // //           [draggable]="false"
// // //           [resizable]="false">
          
// // //           <div class="section-form">
// // //             <div class="form-group">
// // //               <label class="input-label">Section Title <span class="required">*</span></label>
// // //               <input pInputText 
// // //                      [(ngModel)]="sectionForm.title" 
// // //                      placeholder="e.g., Introduction to the Course"
// // //                      class="w-full"
// // //                      [class.ng-invalid]="sectionFormSubmitted && !sectionForm.title">
// // //             </div>

// // //             <div class="form-group">
// // //               <label class="input-label">Description</label>
// // //               <textarea pInputTextarea 
// // //                         [(ngModel)]="sectionForm.description" 
// // //                         placeholder="Describe what this section covers..."
// // //                         [rows]="4"
// // //                         class="w-full">
// // //               </textarea>
// // //             </div>

// // //             <div class="form-group">
// // //               <div class="flex align-items-center">
// // //                 <p-checkbox  
// // //                   [(ngModel)]="sectionForm.isPublished" 
// // //                   [binary]="true"
// // //                   inputId="isPublished">
// // //                 </p-checkbox >
// // //                 <label for="isPublished" class="ml-2">Publish section immediately</label>
// // //               </div>
// // //             </div>
// // //           </div>

// // //           <div class="dialog-actions">
// // //             <button pButton pRipple 
// // //                     label="Cancel" 
// // //                     icon="pi pi-times" 
// // //                     class="p-button-outlined"
// // //                     (click)="closeSectionDialog()">
// // //             </button>
// // //             <button pButton pRipple 
// // //                     [label]="editingSection ? 'Update' : 'Create'" 
// // //                     icon="pi pi-check"
// // //                     (click)="saveSection()">
// // //             </button>
// // //           </div>
// // //         </p-dialog>
// // //       }
// // //     </div>
// // //   `,
// // //   styles: [`
// // //     .course-curriculum-container {
// // //       padding: var(--spacing-2xl);
// // //       min-height: 100vh;
// // //       background: var(--bg-primary);
// // //     }

// // //     /* Header */
// // //     .curriculum-header {
// // //       display: flex;
// // //       justify-content: space-between;
// // //       align-items: center;
// // //       margin-bottom: var(--spacing-xl);
// // //     }

// // //     .header-left {
// // //       display: flex;
// // //       align-items: center;
// // //       gap: var(--spacing-md);
// // //     }

// // //     .page-title {
// // //       font-size: var(--font-size-2xl);
// // //       font-weight: var(--font-weight-bold);
// // //       color: var(--text-primary);
// // //       margin: 0 0 var(--spacing-xs);
// // //     }

// // //     .course-title {
// // //       color: var(--text-secondary);
// // //       margin: 0;
// // //     }

// // //     .header-actions {
// // //       display: flex;
// // //       gap: var(--spacing-sm);
// // //     }

// // //     /* Loading State */
// // //     .loading-state {
// // //       display: flex;
// // //       flex-direction: column;
// // //       align-items: center;
// // //       justify-content: center;
// // //       min-height: 400px;
// // //     }

// // //     .spinner {
// // //       width: 50px;
// // //       height: 50px;
// // //       border: 3px solid var(--border-secondary);
// // //       border-top-color: var(--accent-primary);
// // //       border-radius: 50%;
// // //       animation: spin 1s linear infinite;
// // //       margin-bottom: var(--spacing-lg);
// // //     }

// // //     @keyframes spin {
// // //       to { transform: rotate(360deg); }
// // //     }

// // //     /* Stats */
// // //     .curriculum-stats {
// // //       display: grid;
// // //       grid-template-columns: repeat(3, 1fr);
// // //       gap: var(--spacing-lg);
// // //       margin-bottom: var(--spacing-xl);
// // //     }

// // //     .stat-card {
// // //       display: flex;
// // //       align-items: center;
// // //       gap: var(--spacing-md);
// // //       padding: var(--spacing-lg);
// // //       background: var(--bg-secondary);
// // //       border-radius: var(--ui-border-radius);
// // //     }

// // //     .stat-icon {
// // //       width: 48px;
// // //       height: 48px;
// // //       background: var(--accent-focus);
// // //       border-radius: 50%;
// // //       display: flex;
// // //       align-items: center;
// // //       justify-content: center;
// // //       color: var(--accent-primary);
// // //     }

// // //     .stat-icon i {
// // //       font-size: var(--font-size-xl);
// // //     }

// // //     .stat-content {
// // //       display: flex;
// // //       flex-direction: column;
// // //     }

// // //     .stat-value {
// // //       font-size: var(--font-size-2xl);
// // //       font-weight: var(--font-weight-bold);
// // //       color: var(--text-primary);
// // //       line-height: 1.2;
// // //     }

// // //     .stat-label {
// // //       color: var(--text-secondary);
// // //       font-size: var(--font-size-sm);
// // //     }

// // //     /* Sections Container */
// // //     .sections-container {
// // //       display: flex;
// // //       flex-direction: column;
// // //       gap: var(--spacing-lg);
// // //     }

// // //     /* Section Card */
// // //     .section-card {
// // //       background: var(--bg-secondary);
// // //       border-radius: var(--ui-border-radius);
// // //       border: 1px solid var(--border-secondary);
// // //       overflow: hidden;
// // //       transition: var(--transition-base);
// // //     }

// // //     .section-card.dragging {
// // //       opacity: 0.5;
// // //       border-style: dashed;
// // //     }

// // //     .section-card:hover {
// // //       border-color: var(--border-primary);
// // //       box-shadow: var(--shadow-sm);
// // //     }

// // //     .section-header {
// // //       display: flex;
// // //       align-items: center;
// // //       gap: var(--spacing-md);
// // //       padding: var(--spacing-md) var(--spacing-lg);
// // //       background: var(--bg-primary);
// // //       cursor: move;
// // //     }

// // //     .section-drag-handle {
// // //       color: var(--text-tertiary);
// // //       cursor: grab;
// // //     }

// // //     .section-drag-handle:active {
// // //       cursor: grabbing;
// // //     }

// // //     .section-info {
// // //       flex: 1;
// // //     }

// // //     .section-title-wrapper {
// // //       display: flex;
// // //       align-items: center;
// // //       gap: var(--spacing-md);
// // //       flex-wrap: wrap;
// // //     }

// // //     .section-title {
// // //       margin: 0;
// // //       font-size: var(--font-size-lg);
// // //       font-weight: var(--font-weight-semibold);
// // //       color: var(--text-primary);
// // //     }

// // //     .section-meta {
// // //       display: flex;
// // //       gap: var(--spacing-md);
// // //       align-items: center;
// // //       color: var(--text-tertiary);
// // //       font-size: var(--font-size-sm);
// // //     }

// // //     .meta-item {
// // //       display: flex;
// // //       align-items: center;
// // //       gap: var(--spacing-xs);
// // //     }

// // //     .meta-item i {
// // //       font-size: var(--font-size-xs);
// // //     }

// // //     .section-actions {
// // //       display: flex;
// // //       gap: var(--spacing-xs);
// // //       opacity: 0;
// // //       transition: var(--transition-fast);
// // //     }

// // //     .section-card:hover .section-actions {
// // //       opacity: 1;
// // //     }

// // //     .section-content {
// // //       padding: var(--spacing-lg);
// // //       border-top: 1px solid var(--border-secondary);
// // //     }

// // //     /* Form Styles */
// // //     .section-form {
// // //       padding: var(--spacing-md) 0;
// // //     }

// // //     .form-group {
// // //       margin-bottom: var(--spacing-lg);
// // //     }

// // //     .input-label {
// // //       display: block;
// // //       font-weight: var(--font-weight-medium);
// // //       margin-bottom: var(--spacing-xs);
// // //       color: var(--text-primary);
// // //     }

// // //     .required {
// // //       color: var(--color-error);
// // //     }

// // //     /* Dialog Actions */
// // //     .dialog-actions {
// // //       display: flex;
// // //       justify-content: flex-end;
// // //       gap: var(--spacing-md);
// // //       padding-top: var(--spacing-lg);
// // //       border-top: 1px solid var(--border-secondary);
// // //     }

// // //     /* Empty State */
// // //     .empty-state {
// // //       text-align: center;
// // //       padding: var(--spacing-3xl);
// // //       background: var(--bg-secondary);
// // //       border-radius: var(--ui-border-radius);
// // //     }

// // //     .empty-state i {
// // //       font-size: 4rem;
// // //       color: var(--text-tertiary);
// // //       margin-bottom: var(--spacing-lg);
// // //     }

// // //     .empty-state h3 {
// // //       color: var(--text-primary);
// // //       margin-bottom: var(--spacing-sm);
// // //     }

// // //     .empty-state p {
// // //       color: var(--text-secondary);
// // //       margin-bottom: var(--spacing-xl);
// // //     }

// // //     /* Responsive */
// // //     @media (max-width: 768px) {
// // //       .course-curriculum-container {
// // //         padding: var(--spacing-md);
// // //       }

// // //       .curriculum-header {
// // //         flex-direction: column;
// // //         align-items: flex-start;
// // //         gap: var(--spacing-md);
// // //       }

// // //       .curriculum-stats {
// // //         grid-template-columns: 1fr;
// // //       }

// // //       .section-title-wrapper {
// // //         flex-direction: column;
// // //         align-items: flex-start;
// // //       }

// // //       .section-actions {
// // //         opacity: 1;
// // //       }
// // //     }
// // //   `]
// // // })
// // // export class CourseCurriculumComponent implements OnInit, OnDestroy {
// // //   private route = inject(ActivatedRoute);
// // //   private router = inject(Router);
// // //   private courseService = inject(CourseService);
// // //   private sectionService = inject(SectionService);
// // //   private confirmationService = inject(ConfirmationService);
// // //   private messageService = inject(MessageService);

// // //   courseId: string = '';
// // //   course: any = null;
// // //   sections: any[] = [];
// // //   loading = true;

// // //   // Stats
// // //   totalSections = 0;
// // //   totalLessons = 0;
// // //   totalDuration = 0;

// // //   // Drag and drop
// // //   draggingSectionIndex: number | null = null;

// // //   // Section Form
// // //   showSectionDialog = false;
// // //   sectionDialogTitle = 'Add New Section';
// // //   editingSection: any = null;
// // //   sectionForm = {
// // //     title: '',
// // //     description: '',
// // //     isPublished: true
// // //   };
// // //   sectionFormSubmitted = false;

// // //   private subscriptions: Subscription[] = [];

// // //   ngOnInit(): void {
// // //     this.route.params.subscribe(params => {
// // //       this.courseId = params['id'];
// // //       this.loadCurriculum();
// // //     });
// // //   }

// // //   ngOnDestroy(): void {
// // //     this.subscriptions.forEach(sub => sub.unsubscribe());
// // //   }

// // //   loadCurriculum(): void {
// // //     this.loading = true;
// // //     const sub = this.courseService.getBySlug(this.courseId).subscribe({
// // //       next: (res) => {
// // //         this.course = res.data;
// // //         this.sections = (res.data?.sections || []).map((section: any) => ({
// // //           ...section,
// // //           expanded: true
// // //         }));
// // //         this.calculateStats();
// // //         this.loading = false;
// // //       },
// // //       error: (error) => {
// // //         console.error('Failed to load curriculum', error);
// // //         this.messageService.add({
// // //           severity: 'error',
// // //           summary: 'Error',
// // //           detail: 'Failed to load course curriculum'
// // //         });
// // //         this.loading = false;
// // //       }
// // //     });
// // //     this.subscriptions.push(sub);
// // //   }

// // //   calculateStats(): void {
// // //     this.totalSections = this.sections.length;
// // //     this.totalLessons = this.sections.reduce((sum, section) => sum + (section.totalLessons || 0), 0);
// // //     this.totalDuration = this.sections.reduce((sum, section) => sum + (section.totalDuration || 0), 0);
// // //   }

// // //   // Section Management
// // //   openAddSectionDialog(): void {
// // //     this.editingSection = null;
// // //     this.sectionDialogTitle = 'Add New Section';
// // //     this.sectionForm = {
// // //       title: '',
// // //       description: '',
// // //       isPublished: true
// // //     };
// // //     this.sectionFormSubmitted = false;
// // //     this.showSectionDialog = true;
// // //   }

// // //   editSection(section: any): void {
// // //     this.editingSection = section;
// // //     this.sectionDialogTitle = 'Edit Section';
// // //     this.sectionForm = {
// // //       title: section.title,
// // //       description: section.description || '',
// // //       isPublished: section.isPublished
// // //     };
// // //     this.showSectionDialog = true;
// // //   }

// // //   closeSectionDialog(): void {
// // //     this.showSectionDialog = false;
// // //     this.editingSection = null;
// // //   }

// // //   saveSection(): void {
// // //     this.sectionFormSubmitted = true;

// // //     if (!this.sectionForm.title) {
// // //       this.messageService.add({
// // //         severity: 'error',
// // //         summary: 'Error',
// // //         detail: 'Section title is required'
// // //       });
// // //       return;
// // //     }

// // //     const sectionData = {
// // //       title: this.sectionForm.title,
// // //       description: this.sectionForm.description,
// // //       isPublished: this.sectionForm.isPublished,
// // //       course: this.courseId
// // //     };

// // //     if (this.editingSection) {
// // //       // Update existing section
// // //       const sub = this.sectionService.update(this.editingSection._id, sectionData).subscribe({
// // //         next: (res) => {
// // //           const index = this.sections.findIndex(s => s._id === this.editingSection._id);
// // //           if (index !== -1) {
// // //             this.sections[index] = { ...this.sections[index], ...res.data };
// // //           }
// // //           this.messageService.add({
// // //             severity: 'success',
// // //             summary: 'Success',
// // //             detail: 'Section updated successfully'
// // //           });
// // //           this.closeSectionDialog();
// // //         },
// // //         error: (error) => {
// // //           console.error('Failed to update section', error);
// // //           this.messageService.add({
// // //             severity: 'error',
// // //             summary: 'Error',
// // //             detail: 'Failed to update section'
// // //           });
// // //         }
// // //       });
// // //       this.subscriptions.push(sub);
// // //     } else {
// // //       // Create new section
// // //       const sub = this.sectionService.create(sectionData).subscribe({
// // //         next: (res) => {
// // //           this.sections.push({ ...res.data, expanded: true, lessons: [] });
// // //           this.calculateStats();
// // //           this.messageService.add({
// // //             severity: 'success',
// // //             summary: 'Success',
// // //             detail: 'Section created successfully'
// // //           });
// // //           this.closeSectionDialog();
// // //         },
// // //         error: (error) => {
// // //           console.error('Failed to create section', error);
// // //           this.messageService.add({
// // //             severity: 'error',
// // //             summary: 'Error',
// // //             detail: 'Failed to create section'
// // //           });
// // //         }
// // //       });
// // //       this.subscriptions.push(sub);
// // //     }
// // //   }

// // //   deleteSection(section: any): void {
// // //     this.confirmationService.confirm({
// // //       message: `Are you sure you want to delete "${section.title}"? This will also delete all lessons in this section.`,
// // //       header: 'Confirm Delete',
// // //       icon: 'pi pi-exclamation-triangle',
// // //       accept: () => {
// // //         const sub = this.sectionService.delete(section._id).subscribe({
// // //           next: () => {
// // //             this.sections = this.sections.filter(s => s._id !== section._id);
// // //             this.calculateStats();
// // //             this.messageService.add({
// // //               severity: 'success',
// // //               summary: 'Success',
// // //               detail: 'Section deleted successfully'
// // //             });
// // //           },
// // //           error: (error) => {
// // //             console.error('Failed to delete section', error);
// // //             this.messageService.add({
// // //               severity: 'error',
// // //               summary: 'Error',
// // //               detail: 'Failed to delete section'
// // //             });
// // //           }
// // //         });
// // //         this.subscriptions.push(sub);
// // //       }
// // //     });
// // //   }

// // //   toggleSection(section: any): void {
// // //     section.expanded = !section.expanded;
// // //   }

// // //   // Drag and Drop
// // //   onSectionDragStart(index: number): void {
// // //     this.draggingSectionIndex = index;
// // //   }

// // //   onSectionDragEnd(): void {
// // //     this.draggingSectionIndex = null;
// // //   }

// // //   onSectionDrop(event: any): void {
// // //     if (this.draggingSectionIndex === null) return;

// // //     const dropIndex = event.index;
// // //     if (this.draggingSectionIndex === dropIndex) return;

// // //     // Reorder sections
// // //     const newSections = [...this.sections];
// // //     const [movedSection] = newSections.splice(this.draggingSectionIndex, 1);
// // //     newSections.splice(dropIndex, 0, movedSection);

// // //     // Update order numbers
// // //     const reorderedSections = newSections.map((section, index) => ({
// // //       id: section._id,
// // //       order: index + 1
// // //     }));

// // //     // Save reorder
// // //     const sub = this.sectionService.reorderSections(this.courseId, reorderedSections).subscribe({
// // //       next: () => {
// // //         this.sections = newSections;
// // //         this.messageService.add({
// // //           severity: 'success',
// // //           summary: 'Success',
// // //           detail: 'Sections reordered successfully'
// // //         });
// // //       },
// // //       error: (error) => {
// // //         console.error('Failed to reorder sections', error);
// // //         this.messageService.add({
// // //           severity: 'error',
// // //           summary: 'Error',
// // //           detail: 'Failed to reorder sections'
// // //         });
// // //       }
// // //     });
// // //     this.subscriptions.push(sub);
// // //     this.draggingSectionIndex = null;
// // //   }

// // //   // Lesson Updates
// // //   onLessonCountChange(count: number, section: any): void {
// // //     section.totalLessons = count;
// // //     this.calculateStats();
// // //   }

// // //   onDurationChange(duration: number, section: any): void {
// // //     section.totalDuration = duration;
// // //     this.calculateStats();
// // //   }
// // // }