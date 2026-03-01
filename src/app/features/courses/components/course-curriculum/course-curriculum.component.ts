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
    this.courseService.getCoursesById(this.courseId()).subscribe({
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
      this.sectionService.updateSection(editId, formData).subscribe({
        next: () => {
          this.showSuccess('Section updated successfully');
          this.closeSectionDialog();
          this.loadSections(); // Refresh list
        },
        error: () => this.showError('Failed to update section')
      });
    } else {
      // Create new
      this.sectionService.createSection(formData).subscribe({
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
        this.sectionService.deleteSection(section._id).subscribe({
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