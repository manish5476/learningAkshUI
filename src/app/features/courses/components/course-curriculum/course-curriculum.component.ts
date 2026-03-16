import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// PrimeNG Imports
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { DragDropModule } from 'primeng/dragdrop';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CardModule } from "primeng/card";

import { LessonListComponent } from "../../../lesson/components/lesson-list/lesson-list.component";
import { DurationPipe } from "../../../../core/pipes/duration.pipe";
import { SectionService } from '../../../../core/services/section.service';
import { CourseService } from '../../../../core/services/course.service';
import { AppMessageService } from '../../../../core/utils/message.service';

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
    ButtonModule,
    TagModule,
    LessonListComponent,
    DurationPipe,
    CardModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './course-curriculum.component.html',
  styleUrl: './course-curriculum.component.scss'
})
export class CourseCurriculumComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private sectionApiService = inject(SectionService);
  private courseApiService = inject(CourseService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);

  // Signals
  courseId = signal<string>('');
  course = signal<any>(null);
  sections = signal<any[]>([]);
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

  // Computed Properties
  sectionDialogTitle = computed(() => this.editingSectionId() ? 'Edit Section' : 'Add New Section');

  totalSections = computed(() => this.sections().length);
  totalLessons = computed(() =>
    this.sections().reduce((acc, curr) => acc + (curr.totalLessons || 0), 0)
  );
  totalDuration = computed(() =>
    this.sections().reduce((acc, curr) => acc + (curr.totalDuration || 0), 0)
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseId.set(id);
      this.loadData();
    }
  }

  loadData(): void {
    this.loading.set(true);

    // Load course details
    this.courseApiService.getCourseById(this.courseId()).subscribe({
      next: (res: any) => {
        const courseData = res?.data?.course || res?.data || res;
        this.course.set(courseData);
      },
      error: (err) => {
        console.error('Failed to load course details:', err);
        this.showError('Failed to load course details');
      }
    });

    // Load sections
    this.loadSections();
  }

  loadSections(): void {
    this.sectionApiService.getCourseSections(this.courseId()).subscribe({
      next: (res: any) => {
        let sectionsData = [];

        if (res?.data && Array.isArray(res.data)) {
          sectionsData = res.data;
        } else if (res?.data?.sections && Array.isArray(res.data.sections)) {
          sectionsData = res.data.sections;
        } else if (Array.isArray(res)) {
          sectionsData = res;
        }

        const processedSections = sectionsData.map((s: any) => ({
          ...s,
          expanded: false,
          totalLessons: s.lessons?.length || s.totalLessons || s.lessonCount || 0,
          totalDuration: s.totalDuration || 0,
          freeLessonCount: s.freeLessonCount || 0
        }));

        this.sections.set(processedSections);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load sections:', err);
        this.showError('Failed to load sections');
        this.loading.set(false);
      }
    });
  }

  // --- Section Dialog Management ---
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
    this.sectionForm.reset({ title: '', description: '', isPublished: true });
  }

  saveSection(): void {
    if (this.sectionForm.invalid) {
      this.sectionForm.markAllAsTouched();
      return;
    }

    const formData = {
      title: this.sectionForm.value.title,
      description: this.sectionForm.value.description,
      isPublished: this.sectionForm.value.isPublished,
      course: this.courseId()
    };

    const editId = this.editingSectionId();

    if (editId) {
      this.sectionApiService.updateSection(editId, formData).subscribe({
        next: () => {
          this.showSuccess('Section updated successfully');
          this.closeSectionDialog();
          this.loadSections();
        },
        error: () => this.showError('Failed to update section')
      });
    } else {
      this.sectionApiService.createSection(formData).subscribe({
        next: () => {
          this.showSuccess('Section created successfully');
          this.closeSectionDialog();
          this.loadSections();
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
        this.sectionApiService.deleteSection(section._id).subscribe({
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
      sections.map(s => s._id === sectionId ? { ...s, expanded: !s.expanded } : s)
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

    const target = event.target.closest('.section-card');
    if (!target) return;

    const toIndex = parseInt(target.getAttribute('data-index'), 10);
    if (isNaN(toIndex) || fromIndex === toIndex) return;

    const updatedSections = [...this.sections()];
    const [movedSection] = updatedSections.splice(fromIndex, 1);
    updatedSections.splice(toIndex, 0, movedSection);

    this.sections.set(updatedSections);

    const orderedIds = updatedSections.map(sec => sec._id);

    this.sectionApiService.reorderSections(this.courseId(), orderedIds).subscribe({
      next: () => this.showSuccess('Sections reordered successfully'),
      error: () => {
        this.showError('Failed to save new order');
        this.loadSections();
      }
    });
  }

  // --- Child Component Event Handlers ---
  onLessonCountChange(count: number, sectionId: string): void {
    this.sections.update(sections =>
      sections.map(s => s._id === sectionId ? { ...s, totalLessons: count } : s)
    );
  }

  onDurationChange(duration: number, sectionId: string): void {
    this.sections.update(sections =>
      sections.map(s => s._id === sectionId ? { ...s, totalDuration: duration } : s)
    );
  }

  // --- Helpers ---
  getCourseSlug(): string {
    const courseData = this.course();
    return courseData?.slug || this.courseId();
  }

  private showSuccess(detail: string): void {
    this.messageService.showSuccess(detail);
  }

  private showError(detail: string): void {
    this.messageService.showError(detail);
  }
}