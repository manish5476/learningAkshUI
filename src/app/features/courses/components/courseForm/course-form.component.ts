import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Course, Category } from '../../../../core/models/course.model';
import { CategoryService } from '../../../../core/services/category.service';
import { CourseService } from '../../../../core/services/course.service';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, SelectModule, InputTextModule, ReactiveFormsModule],
  templateUrl: './course-form.component.html',
  styleUrl: './course-form.component.scss'
})
export class CourseFormComponent implements OnInit, OnDestroy {
  @Input() courseId?: string;
  @Output() saved = new EventEmitter<Course>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  courseForm!: FormGroup;
  categories: Category[] = [];
  isLoading = false;
  isEditMode = false;
  currentStep = 1;

  thumbnailPreview: string | null = null;
  hasDiscount = false;
  difficultyLevels = [
    { name: 'Beginner', value: 'beginner' },
    { name: 'Intermediate', value: 'intermediate' },
    { name: 'Advanced', value: 'advanced' },
    { name: 'All Levels', value: 'all-levels' }
  ];
  lessonTypes = [
    { name: 'Video', value: 'video' },
    { name: 'Article', value: 'article' },
    { name: 'Quiz', value: 'quiz' }
  ];
  currencies = [
    { name: 'USD - US Dollar', value: 'USD' },
    { name: 'EUR - Euro', value: 'EUR' },
    { name: 'GBP - British Pound', value: 'GBP' },
    { name: 'INR - Indian Rupee', value: 'INR' }
  ];
  languages = [
    { name: 'English', value: 'English' },
    { name: 'Spanish', value: 'Spanish' },
    { name: 'French', value: 'French' },
    { name: 'German', value: 'German' },
    { name: 'Chinese', value: 'Chinese' },
    { name: 'Japanese', value: 'Japanese' },
    { name: 'Arabic', value: 'Arabic' }
  ];
  // Form arrays

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();

    if (this.courseId) {
      this.isEditMode = true;
      this.loadCourse();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  // 2. Add the getter
  get sections(): FormArray {
    return this.courseForm.get('sections') as FormArray;
  }

  private initForm(): void {
    this.courseForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      subtitle: ['', Validators.maxLength(200)],
      description: ['', [Validators.required, Validators.minLength(50)]],
      category: ['', Validators.required],
      level: ['beginner'],
      language: ['English'],
      thumbnail: [''],
      previewVideo: [''],
      price: [0, [Validators.min(0)]],
      discountPrice: [null],
      discountStartDate: [null],
      discountEndDate: [null],
      isFree: [false],
      currency: ['USD'],
      requirements: this.fb.array([]),
      whatYouWillLearn: this.fb.array([]),
      targetAudience: this.fb.array([]),
      tags: this.fb.array([]),
      sections: this.fb.array([])
    });

    // Add initial items
    this.addLearningItem(); // At least one learning outcome
  }

  private loadCategories(): void {
    const sub = this.categoryService.getAll({ isActive: true }).subscribe({
      next: (res: any) => {
        this.categories = res.data.data || [];
      },
      error: (error: any) => {
        console.error('Failed to load categories', error);
      }
    });
    this.subscriptions.push(sub);
  }

  private loadCourse(): void {
    if (!this.courseId) return;

    this.isLoading = true;
    const sub = this.courseService.getById(this.courseId).subscribe({
      next: (res: any) => {
        const course = res.data;
        if (course) {
          this.patchForm(course);
          if (course.thumbnail) {
            this.thumbnailPreview = course.thumbnail;
          }
          if (course.discountPrice) {
            this.hasDiscount = true;
          }
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Failed to load course', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private patchForm(course: any): void {
    // Clear arrays first
    while (this.requirements.length) this.requirements.removeAt(0);
    while (this.whatYouWillLearn.length) this.whatYouWillLearn.removeAt(0);
    while (this.targetAudience.length) this.targetAudience.removeAt(0);
    while (this.tags.length) this.tags.removeAt(0);

    // Patch values
    this.courseForm.patchValue({
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      category: course.category,
      level: course.level,
      language: course.language,
      thumbnail: course.thumbnail,
      previewVideo: course.previewVideo,
      price: course.price,
      discountPrice: course.discountPrice,
      discountStartDate: course.discountStartDate ? this.formatDate(course.discountStartDate) : null,
      discountEndDate: course.discountEndDate ? this.formatDate(course.discountEndDate) : null,
      isFree: course.isFree,
      currency: course.currency
    });

    // Add arrays
    course.requirements?.forEach((req: string) => {
      this.requirements.push(this.fb.control(req));
    });

    course.whatYouWillLearn?.forEach((item: string) => {
      this.whatYouWillLearn.push(this.fb.control(item, Validators.required));
    });

    course.targetAudience?.forEach((audience: string) => {
      this.targetAudience.push(this.fb.control(audience));
    });

    course.tags?.forEach((tag: string) => {
      this.tags.push(this.fb.control(tag));
    });
  }

  private formatDate(date: string): string {
    return new Date(date).toISOString().split('T')[0];
  }

  // Helper method to cast AbstractControl to FormControl
  getAsFormControl(control: AbstractControl): FormControl {
    return control as FormControl;
  }

  getSectionControl(sectionIndex: number, controlName: string): FormControl {
    return this.sections.at(sectionIndex).get(controlName) as FormControl;
  }

  getLessonControl(sectionIndex: number, lessonIndex: number, controlName: string): FormControl {
    return this.getLessons(sectionIndex).at(lessonIndex).get(controlName) as FormControl;
  }
  // Getters
  get titleLength(): number {
    return this.courseForm.get('title')?.value?.length || 0;
  }

  get wordCount(): number {
    const description = this.courseForm.get('description')?.value || '';
    return description.trim().split(/\s+/).filter(Boolean).length;
  }

  get requirements() {
    return this.courseForm.get('requirements') as FormArray;
  }

  get whatYouWillLearn() {
    return this.courseForm.get('whatYouWillLearn') as FormArray;
  }

  get targetAudience() {
    return this.courseForm.get('targetAudience') as FormArray;
  }

  get tags() {
    return this.courseForm.get('tags') as FormArray;
  }

  // Form Validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.courseForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  // Navigation
  nextStep(): void {
    if (this.currentStep < 4) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  addSection(): void {
    const sectionForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      order: [this.sections.length],
      lessons: this.fb.array([])
    });

    (this.sections as FormArray).push(sectionForm);
  }

  removeSection(index: number): void {
    this.sections.removeAt(index);
    // Update orders
    this.sections.controls.forEach((control, i) => {
      control.get('order')?.setValue(i);
    });
  }

  getLessons(sectionIndex: number): FormArray {
    return this.sections.at(sectionIndex).get('lessons') as FormArray;
  }

  addLesson(sectionIndex: number): void {
    const lessonForm = this.fb.group({
      title: ['', Validators.required],
      type: ['video'],
      duration: [0],
      isFree: [false],
      order: [this.getLessons(sectionIndex).length]
    });
    this.getLessons(sectionIndex).push(lessonForm);
  }

  removeLesson(sectionIndex: number, lessonIndex: number): void {
    this.getLessons(sectionIndex).removeAt(lessonIndex);
    // Update orders
    this.getLessons(sectionIndex).controls.forEach((control, i) => {
      control.get('order')?.setValue(i);
    });
  }

  // Array Management
  addRequirement(): void {
    this.requirements.push(this.fb.control(''));
  }

  removeRequirement(index: number): void {
    this.requirements.removeAt(index);
  }

  addLearningItem(): void {
    this.whatYouWillLearn.push(this.fb.control('', Validators.required));
  }

  removeLearningItem(index: number): void {
    this.whatYouWillLearn.removeAt(index);
  }

  addAudience(): void {
    this.targetAudience.push(this.fb.control(''));
  }

  removeAudience(index: number): void {
    this.targetAudience.removeAt(index);
  }

  addTag(event: any): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();

    if (value && event.key === 'Enter') {
      event.preventDefault();
      this.tags.push(this.fb.control(value));
      input.value = '';
    }
  }

  removeTag(index: number): void {
    this.tags.removeAt(index);
  }

  // File Upload
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent, type: string): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0], type);
    }
  }

  onFileSelected(event: Event, type: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0], type);
    }
  }

  private handleFile(file: File, type: string): void {
    if (type === 'thumbnail' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.thumbnailPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);

      // Here you would upload the file to your server
      // this.uploadService.uploadThumbnail(file).subscribe(...)
    }
  }

  removeThumbnail(event: Event): void {
    event.stopPropagation();
    this.thumbnailPreview = null;
    this.courseForm.patchValue({ thumbnail: '' });
  }

  // Pricing
  onFreeToggle(): void {
    const isFree = this.courseForm.get('isFree')?.value;
    if (isFree) {
      this.courseForm.patchValue({ price: 0 });
      this.courseForm.get('price')?.disable();
    } else {
      this.courseForm.get('price')?.enable();
    }
  }

  toggleDiscount(): void {
    this.hasDiscount = !this.hasDiscount;
    if (!this.hasDiscount) {
      this.courseForm.patchValue({
        discountPrice: null,
        discountStartDate: null,
        discountEndDate: null
      });
    }
  }

  // Submit
  onSubmit(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      // Find first invalid step and navigate to it
      if (this.courseForm.get('title')?.invalid) this.currentStep = 1;
      else if (this.courseForm.get('description')?.invalid) this.currentStep = 1;
      else if (this.courseForm.get('category')?.invalid) this.currentStep = 1;
      else if (this.whatYouWillLearn.length === 0) this.currentStep = 4;
      return;
    }

    this.isLoading = true;
    const formData = this.courseForm.value;

    const request = this.isEditMode && this.courseId
      ? this.courseService.update(this.courseId, formData)
      : this.courseService.create(formData);

    const sub = (request as any).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.router.navigate(['/courses'])
        this.saved.emit(res.data?.course || res.data);
      },
      error: (error: any) => {
        console.error('Failed to save course', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}