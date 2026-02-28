import { Component, OnInit, inject, DestroyRef, signal, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // <-- Added ActivatedRoute

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
  private route = inject(ActivatedRoute); // <-- Injected ActivatedRoute
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

  private slugTimeout: any;

  constructor() {
    // 1. Check if courseId was passed directly as an input (e.g., via a Modal)
    effect(() => {
      const id = this.courseId();
      if (id) {
        this.isEditMode.set(true);
        this.loadCourse(id);
      }
    }, { allowSignalWrites: true });

    // 2. Auto-Slug Feature
    this.courseForm.get('title')?.valueChanges
      .pipe(takeUntilDestroyed()) 
      .subscribe(title => {
        if (title && !this.courseForm.get('slug')?.dirty) {
          if (this.slugTimeout) clearTimeout(this.slugTimeout);
          this.slugTimeout = setTimeout(() => {
            const slug = title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
            this.courseForm.get('slug')?.setValue(slug, { emitEvent: false });
          }, 500);
        }
      });
  }

  ngOnInit(): void {
    this.loadCategories();

    // 3. Check if courseId is in the URL Route (e.g., /instructor/courses/:id/edit)
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const routeId = params['id'];
      // If we found an ID in the URL, and it wasn't already loaded by the signal input
      if (routeId && !this.courseId()) {
        this.isEditMode.set(true);
        this.loadCourse(routeId);
      } else if (!routeId && !this.courseId()) {
        // If it's a completely new course, initialize at least one empty learning item
        this.addLearningItem();
      }
    });
  }

  // --- API Calls ---

  private loadCategories(): void {
    this.categoryService.getAll({ isActive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => this.categories.set(res.data?.data || res.data || []),
        error: (error: any) => console.error('Failed to load categories', error)
      });
  }

  private loadCourse(id: string): void {
    this.isLoading.set(true);
    this.courseService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          // Bulletproof extraction: checks multiple common backend wrapper formats
          const course = res.data?.course || res.data?.data || res.data;
          
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
    // 1. Clear Form Arrays completely before patching to avoid duplicates
    ['requirements', 'whatYouWillLearn', 'targetAudience', 'tags', 'sections'].forEach(name => {
      const arr = this.courseForm.get(name) as FormArray;
      while (arr.length) arr.removeAt(0);
    });

    // 2. Patch flat values
    this.courseForm.patchValue({
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      category: course.category?._id || course.category, // Handle populated category object
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

    // 3. Repopulate Arrays
    if (course.requirements?.length) {
      course.requirements.forEach((req: string) => this.requirements.push(this.fb.control(req)));
    }
    
    if (course.whatYouWillLearn?.length) {
      course.whatYouWillLearn.forEach((item: string) => this.whatYouWillLearn.push(this.fb.control(item, Validators.required)));
    } else {
      this.addLearningItem(); // Ensure at least one field exists if array is empty
    }

    if (course.targetAudience?.length) {
      course.targetAudience.forEach((aud: string) => this.targetAudience.push(this.fb.control(aud)));
    }

    if (course.tags?.length) {
      course.tags.forEach((tag: string) => this.tags.push(this.fb.control(tag)));
    }
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
    
    // We get the active ID either from the route or the signal input
    const activeId = this.route.snapshot.paramMap.get('id') || this.courseId();

    const request$ = (this.isEditMode() && activeId
      ? this.courseService.update(activeId, formData)
      : this.courseService.create(formData)) as import('rxjs').Observable<any>;

    request$.subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.router.navigate(['/courses/instructor']);
        this.saved.emit(res?.data?.course || res?.data);
      },
      error: (error: any) => {
        console.error('Failed to save course', error);
        this.isLoading.set(false);
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
    this.router.navigate(['/courses/instructor']);
  }
}