import { Component, OnInit, inject, DestroyRef, signal, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';

// Models & Services
import { Course, Category } from '../../../../core/models/course.model';
import { CategoryService } from '../../../../core/services/category.service';
import { CourseService } from '../../../../core/services/course.service';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    SelectModule, 
    InputTextModule
  ],
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.scss']
})
export class CourseFormComponent implements OnInit {
  // Modern Signal Inputs/Outputs
  courseId = input<string | undefined>();
  saved = output<Course>();
  cancelled = output<void>();

  // Injectors
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Reactive State Signals
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  currentStep = signal<number>(1);
  thumbnailPreview = signal<string | null>(null);
  hasDiscount = signal<boolean>(false);

  // Configuration Constants
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
    { name: 'Arabic', value: 'Arabic' },
    { name: 'Hindi', value: 'Hindi' }
  ];

  // Initialize Form
  courseForm: FormGroup = this.fb.group({
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

  constructor() {
    // Automatically load course details if ID is provided
    effect(() => {
      const id = this.courseId();
      if (id) {
        this.isEditMode.set(true);
        this.loadCourse(id);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.addLearningItem(); // Initialize with at least one outcome
    this.loadCategories();
  }

  // --- API Calls ---

  private loadCategories(): void {
    this.categoryService.getAll({ isActive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => this.categories.set(res.data?.data || []),
        error: (error: any) => console.error('Failed to load categories', error)
      });
  }

  private loadCourse(id: string): void {
    this.isLoading.set(true);
    this.courseService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const course = res.data?.data || res.data;
          if (course) {
            this.patchForm(course);
            if (course.thumbnail) this.thumbnailPreview.set(course.thumbnail);
            if (course.discountPrice) this.hasDiscount.set(true);
          }
          this.isLoading.set(false);
        },
        error: (error: any) => {
          console.error('Failed to load course', error);
          this.isLoading.set(false);
        }
      });
  }

  private patchForm(course: any): void {
    // Clear Form Arrays completely before patching
    ['requirements', 'whatYouWillLearn', 'targetAudience', 'tags', 'sections'].forEach(name => {
      const arr = this.courseForm.get(name) as FormArray;
      while (arr.length) arr.removeAt(0);
    });

    this.courseForm.patchValue({
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      category: course.category?._id || course.category,
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

    // Repopulate Arrays
    course.requirements?.forEach((req: string) => this.requirements.push(this.fb.control(req)));
    course.whatYouWillLearn?.forEach((item: string) => this.whatYouWillLearn.push(this.fb.control(item, Validators.required)));
    course.targetAudience?.forEach((audience: string) => this.targetAudience.push(this.fb.control(audience)));
    course.tags?.forEach((tag: string) => this.tags.push(this.fb.control(tag)));
    
    // (Optional: handle sections repopulation if the backend provides it natively here)
  }

  private formatDate(date: string): string {
    return new Date(date).toISOString().split('T')[0];
  }

  // --- Form Getters & Helpers ---

  get sections(): FormArray { return this.courseForm.get('sections') as FormArray; }
  get requirements(): FormArray { return this.courseForm.get('requirements') as FormArray; }
  get whatYouWillLearn(): FormArray { return this.courseForm.get('whatYouWillLearn') as FormArray; }
  get targetAudience(): FormArray { return this.courseForm.get('targetAudience') as FormArray; }
  get tags(): FormArray { return this.courseForm.get('tags') as FormArray; }

  get titleLength(): number { return this.courseForm.get('title')?.value?.length || 0; }
  get wordCount(): number {
    const description = this.courseForm.get('description')?.value || '';
    return description.trim().split(/\s+/).filter(Boolean).length;
  }

  getAsFormControl(control: any): FormControl { return control as FormControl; }
  getSectionControl(sIndex: number, name: string): FormControl { return this.sections.at(sIndex).get(name) as FormControl; }
  getLessonControl(sIndex: number, lIndex: number, name: string): FormControl { return this.getLessons(sIndex).at(lIndex).get(name) as FormControl; }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.courseForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  // --- Step Navigation ---

  nextStep(): void {
    if (this.currentStep() < 4) this.currentStep.update(s => s + 1);
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
  }

  setStep(step: number): void {
    if (step >= 1 && step <= 4) this.currentStep.set(step);
  }

  // --- Form Array Manipulations ---

  addSection(): void {
    this.sections.push(this.fb.group({
      title: ['', Validators.required],
      description: [''],
      order: [this.sections.length],
      lessons: this.fb.array([])
    }));
  }

  removeSection(index: number): void {
    this.sections.removeAt(index);
    this.sections.controls.forEach((c, i) => c.get('order')?.setValue(i));
  }

  getLessons(sectionIndex: number): FormArray {
    return this.sections.at(sectionIndex).get('lessons') as FormArray;
  }

  addLesson(sectionIndex: number): void {
    this.getLessons(sectionIndex).push(this.fb.group({
      title: ['', Validators.required],
      type: ['video'],
      duration: [0],
      isFree: [false],
      order: [this.getLessons(sectionIndex).length]
    }));
  }

  removeLesson(sIndex: number, lIndex: number): void {
    const lessons = this.getLessons(sIndex);
    lessons.removeAt(lIndex);
    lessons.controls.forEach((c, i) => c.get('order')?.setValue(i));
  }

  addRequirement(): void { this.requirements.push(this.fb.control('')); }
  removeRequirement(index: number): void { this.requirements.removeAt(index); }
  addLearningItem(): void { this.whatYouWillLearn.push(this.fb.control('', Validators.required)); }
  removeLearningItem(index: number): void { this.whatYouWillLearn.removeAt(index); }
  addAudience(): void { this.targetAudience.push(this.fb.control('')); }
  removeAudience(index: number): void { this.targetAudience.removeAt(index); }

  addTag(event: any): void {
    const value = (event.target as HTMLInputElement).value.trim();
    if (value && event.key === 'Enter') {
      event.preventDefault();
      this.tags.push(this.fb.control(value));
      event.target.value = '';
    }
  }
  removeTag(index: number): void { this.tags.removeAt(index); }

  // --- File Upload ---

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent, type: string): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files?.length) {
      this.handleFile(event.dataTransfer.files[0], type);
    }
  }

  onFileSelected(event: Event, type: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFile(input.files[0], type);
    }
  }

  private handleFile(file: File, type: string): void {
    if (type === 'thumbnail' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => this.thumbnailPreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
      // TODO: Replace with actual upload logic: this.courseForm.patchValue({ thumbnail: uploadedUrl })
    }
  }

  removeThumbnail(event: Event): void {
    event.stopPropagation();
    this.thumbnailPreview.set(null);
    this.courseForm.patchValue({ thumbnail: '' });
  }

  // --- Pricing Toggles ---

  onFreeToggle(): void {
    const isFree = this.courseForm.get('isFree')?.value;
    const priceCtrl = this.courseForm.get('price');
    if (isFree) {
      priceCtrl?.patchValue(0);
      priceCtrl?.disable();
    } else {
      priceCtrl?.enable();
    }
  }

  toggleDiscount(): void {
    this.hasDiscount.set(!this.hasDiscount());
    if (!this.hasDiscount()) {
      this.courseForm.patchValue({ discountPrice: null, discountStartDate: null, discountEndDate: null });
    }
  }

  // --- Submission ---
onSubmit(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      // Auto-navigate to first invalid step
      if (this.courseForm.get('title')?.invalid || this.courseForm.get('description')?.invalid || this.courseForm.get('category')?.invalid) {
        this.currentStep.set(1);
      } else if (this.whatYouWillLearn.length === 0 || this.whatYouWillLearn.invalid) {
        this.currentStep.set(4);
      }
      return;
    }

    this.isLoading.set(true);
    const formData = this.courseForm.getRawValue();

    // 1. Explicitly cast the request as an Observable<any> to satisfy TypeScript's strict union matching
    const request$ = (this.isEditMode() && this.courseId()
      ? this.courseService.update(this.courseId()!, formData)
      : this.courseService.create(formData)) as import('rxjs').Observable<any>;

    // 2. Subscribe securely
    request$.subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        // Navigate or emit based on your routing logic
        this.router.navigate(['/courses']);
        this.saved.emit(res?.data?.course || res?.data);
      },
      error: (error: any) => {
        console.error('Failed to save course', error);
        this.isLoading.set(false);
      }
    });
  }
  // onSubmit(): void {
  //   if (this.courseForm.invalid) {
  //     this.courseForm.markAllAsTouched();
  //     // Auto-navigate to first invalid step
  //     if (this.courseForm.get('title')?.invalid || this.courseForm.get('description')?.invalid || this.courseForm.get('category')?.invalid) {
  //       this.currentStep.set(1);
  //     } else if (this.whatYouWillLearn.length === 0 || this.whatYouWillLearn.invalid) {
  //       this.currentStep.set(4);
  //     }
  //     return;
  //   }

  //   this.isLoading.set(true);
  //   const formData = this.courseForm.getRawValue(); // gets values including disabled fields like price

  //   const request$ = this.isEditMode() && this.courseId()
  //     ? this.courseService.update(this.courseId()!, formData)
  //     : this.courseService.create(formData);

  //   request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
  //     next: (res: any) => {
  //       this.isLoading.set(false);
  //       this.saved.emit(res.data?.course || res.data);
  //     },
  //     error: (error: any) => {
  //       console.error('Failed to save course', error);
  //       this.isLoading.set(false);
  //     }
  //   });
  // }

  onCancel(): void {
    this.cancelled.emit();
  }
}