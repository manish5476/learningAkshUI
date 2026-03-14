import { Component, OnInit, inject, DestroyRef, signal, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs'; // <-- Added for parallel API calls

// PrimeNG 
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from "primeng/card"; 

// Models
import { Course } from '../../../../core/models/course.model';

// Services
import { ApiResponse } from '../../../../core/http/base-api.service';
import { CourseService } from '../../../../core/services/course.service';
import { LessonService } from '../../../../core/services/lesson.service';
import { SectionService } from '../../../../core/services/section.service';
import { Master, MasterApiService } from '../../../../core/services/master-list.service';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, SelectModule, InputTextModule, InputNumberModule, TextareaModule, CheckboxModule, ButtonModule, TooltipModule, CardModule],
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.scss']
})
export class CourseFormComponent implements OnInit {

  courseId = input<string | undefined>();
  saved = output<Course>();
  cancelled = output<void>();
  
  // Injectors
  private sectionApiService = inject(SectionService);
  private lessonApiService = inject(LessonService);
  private courseApiService = inject(CourseService);
  private masterApiService = inject(MasterApiService); 
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  // State Signals
  isLoading = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  currentStep = signal<number>(1);
  thumbnailPreview = signal<string | null>(null);
  hasDiscount = signal<boolean>(false);

  // Master Data Signals (Replaces hardcoded arrays)
  categories = signal<Master[]>([]);
  difficultyLevels = signal<Master[]>([]);
  lessonTypes = signal<Master[]>([]);
  currencies = signal<Master[]>([]);
  languages = signal<Master[]>([]);

  // Default values updated to match Master codes (Uppercase)
  courseForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    subtitle: ['', Validators.maxLength(200)],
    slug: [''],
    description: ['', [Validators.required, Validators.minLength(50)]],
    category: ['', Validators.required],
    level: ['BEGINNER'], // Matches master CODE
    language: ['EN'],    // Matches master CODE
    thumbnail: [''],
    previewVideo: [''],
    price: [0, [Validators.min(0)]],
    discountPrice: [null],
    discountStartDate: [null],
    discountEndDate: [null],
    isFree: [false],
    isPublished: [false],
    isApproved: [false],
    currency: ['USD'],   // Matches master CODE
    requirements: this.fb.array([]),
    whatYouWillLearn: this.fb.array([]),
    targetAudience: this.fb.array([]),
    tags: this.fb.array([]),
    sections: this.fb.array([])
  });

  private slugTimeout: any;
  routeId: any;

  constructor() {
    effect(() => {
      const id = this.courseId();
      if (id) {
        this.isEditMode.set(true);
        this.loadCourse(id);
      }
    }, { allowSignalWrites: true });

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
    this.isLoading.set(true);
    
    forkJoin({
      categories: this.masterApiService.getPublicValues('course_category'),
      levels: this.masterApiService.getPublicValues('course_level'),
      languages: this.masterApiService.getPublicValues('language'),
      currencies: this.masterApiService.getPublicValues('currency'),
      lessonTypes: this.masterApiService.getPublicValues('lesson_type')
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          // 2. Set the dropdown signals
          this.categories.set(res.categories.data || []);
          this.difficultyLevels.set(res.levels.data || []);
          this.languages.set(res.languages.data || []);
          this.currencies.set(res.currencies.data || []);
          this.lessonTypes.set(res.lessonTypes.data || []);

          // 3. NOW that dropdowns are ready, load the Course!
          this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            const routeId = params['id'];
            this.routeId = routeId;
            if (routeId && !this.courseId()) {
              this.isEditMode.set(true);
              this.loadCourse(routeId); // Safe to load and patch now!
            } else if (!routeId && !this.courseId()) {
              this.addLearningItem();
              this.isLoading.set(false);
            }
          });
        },
        error: (err) => {
          console.error('Failed to load master dropdowns', err);
          this.isLoading.set(false);
        }
      });
      
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const routeId = params['id'];
      this.routeId = routeId;
      if (routeId && !this.courseId()) {
        this.isEditMode.set(true);
        this.loadCourse(routeId);
      } else if (!routeId && !this.courseId()) {
        this.addLearningItem();
      }
    });
  }

  // --- NEW: Load all master data in parallel ---
  private loadMasterData(): void {
    forkJoin({
      categories: this.masterApiService.getPublicValues('course_category'),
      levels: this.masterApiService.getPublicValues('course_level'),
      languages: this.masterApiService.getPublicValues('language'),
      currencies: this.masterApiService.getPublicValues('currency'),
      lessonTypes: this.masterApiService.getPublicValues('lesson_type')
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.categories.set(res.categories.data || []);
          this.difficultyLevels.set(res.levels.data || []);
          this.languages.set(res.languages.data || []);
          this.currencies.set(res.currencies.data || []);
          this.lessonTypes.set(res.lessonTypes.data || []);
        },
        error: (err) => console.error('Failed to load master dropdowns', err)
      });
  }

  private loadCourse(id: string): void {
    this.isLoading.set(true);
    this.courseApiService.getCourseById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: ApiResponse<any>) => {
          const payload = res.data;
          const course = payload?.course || payload;
          const sections = payload?.sections || course?.sections || [];
          
          if (course) {
            // Standardize saved strings to uppercase to match dropdown Codes if necessary
            if (course.level) course.level = course.level.toUpperCase();
            if (course.language) course.language = course.language.toUpperCase();
            if (course.currency) course.currency = course.currency.toUpperCase();
            
            this.patchForm(course, sections);
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

  private patchForm(course: any, sectionsData: any[]): void {
    ['requirements', 'whatYouWillLearn', 'targetAudience', 'tags', 'sections'].forEach(name => {
      const arr = this.courseForm.get(name) as FormArray;
      while (arr.length) arr.removeAt(0);
    });

    this.courseForm.patchValue({
      title: course.title,
      subtitle: course.subtitle,
      slug: course.slug,
      description: course.description,
      category: course.category?._id || course.category, // Uses _id to match MongoDB ObjectId
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

    if (course.requirements?.length) {
      course.requirements.forEach((req: string) => this.requirements.push(this.fb.control(req)));
    }

    if (course.whatYouWillLearn?.length) {
      course.whatYouWillLearn.forEach((item: string) => this.whatYouWillLearn.push(this.fb.control(item, Validators.required)));
    } else {
      this.addLearningItem();
    }

    if (course.targetAudience?.length) {
      course.targetAudience.forEach((aud: string) => this.targetAudience.push(this.fb.control(aud)));
    }

    if (course.tags?.length) {
      course.tags.forEach((tag: string) => this.tags.push(this.fb.control(tag)));
    }

    if (sectionsData && sectionsData.length > 0) {
      sectionsData.forEach((section: any, sIndex: number) => {
        const sectionGroup = this.fb.group({
          _id: [section._id],
          title: [section.title || '', Validators.required],
          description: [section.description || ''],
          order: [section.order ?? sIndex],
          lessons: this.fb.array([])
        });

        const lessonsArray = sectionGroup.get('lessons') as FormArray;

        if (section.lessons && section.lessons.length > 0) {
          section.lessons.forEach((lesson: any, lIndex: number) => {
            lessonsArray.push(this.fb.group({
              _id: [lesson._id],
              title: [lesson.title || '', Validators.required],
              type: [lesson.type?.toUpperCase() || 'VIDEO'], // Default to uppercase code
              duration: [lesson.duration || 0],
              isFree: [lesson.isFree || false],
              order: [lesson.order ?? lIndex]
            }));
          });
        }

        this.sections.push(sectionGroup);
      });
    }
  }

  private formatDate(date: string): string {
    return new Date(date).toISOString().split('T')[0];
  }

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

  nextStep(): void {
    if (this.currentStep() < 4) this.currentStep.update(s => s + 1);
  }

  prevStep(): void {
    if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
  }

  setStep(step: number): void {
    if (step >= 1 && step <= 4) this.currentStep.set(step);
  }

  addSection(): void {
    this.sections.push(this.fb.group({
      _id: [null],
      title: ['', Validators.required],
      description: [''],
      order: [this.sections.length],
      lessons: this.fb.array([])
    }));
  }

  getLessons(sectionIndex: number): FormArray {
    return this.sections.at(sectionIndex).get('lessons') as FormArray;
  }

  addLesson(sectionIndex: number): void {
    this.getLessons(sectionIndex).push(this.fb.group({
      _id: [null],
      title: ['', Validators.required],
      type: ['VIDEO'], // Default to uppercase Master code
      duration: [0],
      isFree: [false],
      order: [this.getLessons(sectionIndex).length]
    }));
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

  onSubmit(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      if (this.courseForm.get('title')?.invalid || this.courseForm.get('description')?.invalid || this.courseForm.get('category')?.invalid) {
        this.currentStep.set(1);
      } else if (this.whatYouWillLearn.length === 0 || this.whatYouWillLearn.invalid) {
        this.currentStep.set(4);
      }
      return;
    }

    this.isLoading.set(true);
    const formData = this.courseForm.getRawValue();
    const activeId = this.route.snapshot.paramMap.get('id') || this.courseId();

    const request$ = (this.isEditMode() && activeId
      ? this.courseApiService.updateCourse(activeId, formData)
      : this.courseApiService.createCourse(formData)) as import('rxjs').Observable<ApiResponse<any>>;

    request$.subscribe({
      next: (res: ApiResponse<any>) => {
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

  private executeLocalSectionRemoval(index: number): void {
    this.sections.removeAt(index);
    this.sections.controls.forEach((c, i) => c.get('order')?.setValue(i));
  }

  removeSection(index: number): void {
    const sectionGroup = this.sections.at(index) as FormGroup;
    const sectionId = sectionGroup.get('_id')?.value;
    
    if (sectionId) {
      if (confirm('Are you sure you want to permanently delete this section and all its lessons?')) {
        this.executeLocalSectionRemoval(index);
        
        this.sectionApiService.deleteSection(sectionId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {},
            error: (err: any) => {
              if (err.status !== 404 && err.status !== 200 && !err.message.includes('Http failure')) {
                console.error('Background delete failed', err);
              }
            }
          });
      }
    } else {
      this.executeLocalSectionRemoval(index);
    }
  }

  removeLesson(sIndex: number, lIndex: number): void {
    const lessons = this.getLessons(sIndex);
    const lessonGroup = lessons.at(lIndex) as FormGroup;

    const lessonId = lessonGroup.get('_id')?.value;

    if (lessonId) {
      if (confirm('Permanently delete this lesson?')) {

        this.executeLocalLessonRemoval(lessons, lIndex);

        this.lessonApiService.deleteLesson(lessonId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {},
            error: (err: any) => {
              if (err.status !== 404 && err.status !== 200 && !err.message?.includes('Http failure')) {
                console.error('Background lesson delete failed', err);
              }
            }
          });
      }
    } else {
      this.executeLocalLessonRemoval(lessons, lIndex);
    }
  }
  
  private executeLocalLessonRemoval(lessons: FormArray, lIndex: number): void {
    lessons.removeAt(lIndex);
    lessons.controls.forEach((c, i) => c.get('order')?.setValue(i));
  }

  thumbnailMode = signal<'upload' | 'url'>('upload');
  thumbnailUrlPreview = signal<string | null>(null);

  setThumbnailMode(mode: 'upload' | 'url'): void {
    this.thumbnailMode.set(mode);
    if (mode === 'url') {
      this.thumbnailPreview.set(null);
    } else {
      this.thumbnailUrlPreview.set(null);
      this.courseForm.patchValue({ thumbnail: '' });
    }
  }

  onThumbnailUrlChange(event: Event): void {
    const url = (event.target as HTMLInputElement).value;
    if (url && url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      this.thumbnailUrlPreview.set(url);
    } else {
      this.thumbnailUrlPreview.set(null);
    }
  }
}

// import { Component, OnInit, inject, DestroyRef, signal, effect, input, output } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';

// // PrimeNG 
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { TextareaModule } from 'primeng/textarea';
// import { CheckboxModule } from 'primeng/checkbox';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { CardModule } from "primeng/card"; // <-- Fixed PrimeNG import

// // Models
// import { Course, Category } from '../../../../core/models/course.model';

// // Services
// import { CategoryService } from '../../../../core/services/category.service';
// import { ApiResponse } from '../../../../core/http/base-api.service';
// import { CourseService } from '../../../../core/services/course.service';
// import { LessonService } from '../../../../core/services/lesson.service';
// import { SectionService } from '../../../../core/services/section.service';

// @Component({
//   selector: 'app-course-form',
//   standalone: true,
//   imports: [FormsModule, CommonModule, ReactiveFormsModule, SelectModule, InputTextModule, InputNumberModule, TextareaModule, CheckboxModule, ButtonModule, TooltipModule, CardModule],
//   templateUrl: './course-form.component.html',
//   styleUrls: ['./course-form.component.scss']
// })
// export class CourseFormComponent implements OnInit {

//   courseId = input<string | undefined>();
//   saved = output<Course>();
//   cancelled = output<void>();
  
//   // Injectors updated to use the new API Services
//   private sectionApiService = inject(SectionService);
//   private lessonApiService = inject(LessonService);
//   private courseApiService = inject(CourseService);
//   private fb = inject(FormBuilder);
//   private categoryService = inject(CategoryService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);
//   private destroyRef = inject(DestroyRef);


//   categories = signal<Category[]>([]);
//   isLoading = signal<boolean>(false);
//   isEditMode = signal<boolean>(false);
//   currentStep = signal<number>(1);
//   thumbnailPreview = signal<string | null>(null);
//   hasDiscount = signal<boolean>(false);


//   difficultyLevels = [
//     { name: 'Beginner', value: 'beginner' },
//     { name: 'Intermediate', value: 'intermediate' },
//     { name: 'Advanced', value: 'advanced' },
//     { name: 'All Levels', value: 'all-levels' }
//   ];
//   lessonTypes = [
//     { name: 'Video', value: 'video' },
//     { name: 'Article', value: 'article' },
//     { name: 'Quiz', value: 'quiz' }
//   ];
//   currencies = [
//     { name: 'USD - US Dollar', value: 'USD' },
//     { name: 'EUR - Euro', value: 'EUR' },
//     { name: 'GBP - British Pound', value: 'GBP' },
//     { name: 'INR - Indian Rupee', value: 'INR' }
//   ];
//   languages = [
//     { name: 'English', value: 'English' },
//     { name: 'Spanish', value: 'Spanish' },
//     { name: 'French', value: 'French' },
//     { name: 'German', value: 'German' },
//     { name: 'Chinese', value: 'Chinese' },
//     { name: 'Arabic', value: 'Arabic' },
//     { name: 'Hindi', value: 'Hindi' }
//   ];


//   courseForm: FormGroup = this.fb.group({
//     title: ['', [Validators.required, Validators.maxLength(100)]],
//     subtitle: ['', Validators.maxLength(200)],
//     slug: [''],
//     description: ['', [Validators.required, Validators.minLength(50)]],
//     category: ['', Validators.required],
//     level: ['beginner'],
//     language: ['English'],
//     thumbnail: [''],
//     previewVideo: [''],
//     price: [0, [Validators.min(0)]],
//     discountPrice: [null],
//     discountStartDate: [null],
//     discountEndDate: [null],
//     isFree: [false],
//     isPublished: [false],
//     isApproved: [false],
//     currency: ['USD'],
//     requirements: this.fb.array([]),
//     whatYouWillLearn: this.fb.array([]),
//     targetAudience: this.fb.array([]),
//     tags: this.fb.array([]),
//     sections: this.fb.array([])
//   });

//   private slugTimeout: any;
//   routeId: any;

//   constructor() {
//     effect(() => {
//       const id = this.courseId();
//       if (id) {
//         this.isEditMode.set(true);
//         this.loadCourse(id);
//       }
//     }, { allowSignalWrites: true });

//     this.courseForm.get('title')?.valueChanges
//       .pipe(takeUntilDestroyed())
//       .subscribe(title => {
//         if (title && !this.courseForm.get('slug')?.dirty) {
//           if (this.slugTimeout) clearTimeout(this.slugTimeout);
//           this.slugTimeout = setTimeout(() => {
//             const slug = title
//               .toLowerCase()
//               .replace(/[^a-z0-9]+/g, '-')
//               .replace(/^-|-$/g, '');
//             this.courseForm.get('slug')?.setValue(slug, { emitEvent: false });
//           }, 500);
//         }
//       });
//   }

//   ngOnInit(): void {
//     this.loadCategories();
//     this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
//       const routeId = params['id'];
//       this.routeId = params['id'];
//       if (routeId && !this.courseId()) {
//         this.isEditMode.set(true);
//         this.loadCourse(routeId);
//       } else if (!routeId && !this.courseId()) {
//         this.addLearningItem();
//       }
//     });
//   }


//   private loadCategories(): void {
//     this.categoryService.getAllCategories({ isActive: true })
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => this.categories.set(res.data?.data || res.data || []),
//         error: (error: any) => console.error('Failed to load categories', error)
//       });
//   }

//   private loadCourse(id: string): void {
//     this.isLoading.set(true);
//     // <-- Updated to use courseApiService
//     this.courseApiService.getCourseById(id)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: ApiResponse<any>) => {
//           // Standardized unwrapping
//           const payload = res.data;
//           const course = payload?.course || payload;
//           const sections = payload?.sections || course?.sections || [];
          
//           if (course) {
//             this.patchForm(course, sections);
//             if (course.thumbnail) this.thumbnailPreview.set(course.thumbnail);
//             if (course.discountPrice) this.hasDiscount.set(true);
//           }
//           this.isLoading.set(false);
//         },
//         error: (error: any) => {
//           console.error('Failed to load course', error);
//           this.isLoading.set(false);
//         }
//       });
//   }

//   private patchForm(course: any, sectionsData: any[]): void {
//     ['requirements', 'whatYouWillLearn', 'targetAudience', 'tags', 'sections'].forEach(name => {
//       const arr = this.courseForm.get(name) as FormArray;
//       while (arr.length) arr.removeAt(0);
//     });

//     this.courseForm.patchValue({
//       title: course.title,
//       subtitle: course.subtitle,
//       slug: course.slug,
//       description: course.description,
//       category: course.category?._id || course.category,
//       level: course.level,
//       language: course.language,
//       thumbnail: course.thumbnail,
//       previewVideo: course.previewVideo,
//       price: course.price,
//       discountPrice: course.discountPrice,
//       discountStartDate: course.discountStartDate ? this.formatDate(course.discountStartDate) : null,
//       discountEndDate: course.discountEndDate ? this.formatDate(course.discountEndDate) : null,
//       isFree: course.isFree,
//       currency: course.currency
//     });

//     if (course.requirements?.length) {
//       course.requirements.forEach((req: string) => this.requirements.push(this.fb.control(req)));
//     }

//     if (course.whatYouWillLearn?.length) {
//       course.whatYouWillLearn.forEach((item: string) => this.whatYouWillLearn.push(this.fb.control(item, Validators.required)));
//     } else {
//       this.addLearningItem();
//     }

//     if (course.targetAudience?.length) {
//       course.targetAudience.forEach((aud: string) => this.targetAudience.push(this.fb.control(aud)));
//     }

//     if (course.tags?.length) {
//       course.tags.forEach((tag: string) => this.tags.push(this.fb.control(tag)));
//     }


//     if (sectionsData && sectionsData.length > 0) {
//       sectionsData.forEach((section: any, sIndex: number) => {
//         const sectionGroup = this.fb.group({
//           _id: [section._id],
//           title: [section.title || '', Validators.required],
//           description: [section.description || ''],
//           order: [section.order ?? sIndex],
//           lessons: this.fb.array([])
//         });

//         const lessonsArray = sectionGroup.get('lessons') as FormArray;

//         if (section.lessons && section.lessons.length > 0) {
//           section.lessons.forEach((lesson: any, lIndex: number) => {
//             lessonsArray.push(this.fb.group({
//               _id: [lesson._id],
//               title: [lesson.title || '', Validators.required],
//               type: [lesson.type || 'video'],
//               duration: [lesson.duration || 0],
//               isFree: [lesson.isFree || false],
//               order: [lesson.order ?? lIndex]
//             }));
//           });
//         }

//         this.sections.push(sectionGroup);
//       });
//     }
//   }

//   private formatDate(date: string): string {
//     return new Date(date).toISOString().split('T')[0];
//   }

//   get sections(): FormArray { return this.courseForm.get('sections') as FormArray; }
//   get requirements(): FormArray { return this.courseForm.get('requirements') as FormArray; }
//   get whatYouWillLearn(): FormArray { return this.courseForm.get('whatYouWillLearn') as FormArray; }
//   get targetAudience(): FormArray { return this.courseForm.get('targetAudience') as FormArray; }
//   get tags(): FormArray { return this.courseForm.get('tags') as FormArray; }

//   get titleLength(): number { return this.courseForm.get('title')?.value?.length || 0; }
//   get wordCount(): number {
//     const description = this.courseForm.get('description')?.value || '';
//     return description.trim().split(/\s+/).filter(Boolean).length;
//   }

//   getAsFormControl(control: any): FormControl { return control as FormControl; }
//   getSectionControl(sIndex: number, name: string): FormControl { return this.sections.at(sIndex).get(name) as FormControl; }
//   getLessonControl(sIndex: number, lIndex: number, name: string): FormControl { return this.getLessons(sIndex).at(lIndex).get(name) as FormControl; }

//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.courseForm.get(fieldName);
//     return field ? field.invalid && (field.dirty || field.touched) : false;
//   }

//   nextStep(): void {
//     if (this.currentStep() < 4) this.currentStep.update(s => s + 1);
//   }

//   prevStep(): void {
//     if (this.currentStep() > 1) this.currentStep.update(s => s - 1);
//   }

//   setStep(step: number): void {
//     if (step >= 1 && step <= 4) this.currentStep.set(step);
//   }

//   addSection(): void {
//     this.sections.push(this.fb.group({
//       _id: [null],
//       title: ['', Validators.required],
//       description: [''],
//       order: [this.sections.length],
//       lessons: this.fb.array([])
//     }));
//   }

//   getLessons(sectionIndex: number): FormArray {
//     return this.sections.at(sectionIndex).get('lessons') as FormArray;
//   }

//   addLesson(sectionIndex: number): void {
//     this.getLessons(sectionIndex).push(this.fb.group({
//       _id: [null],
//       title: ['', Validators.required],
//       type: ['video'],
//       duration: [0],
//       isFree: [false],
//       order: [this.getLessons(sectionIndex).length]
//     }));
//   }
  
//   addRequirement(): void { this.requirements.push(this.fb.control('')); }
//   removeRequirement(index: number): void { this.requirements.removeAt(index); }
//   addLearningItem(): void { this.whatYouWillLearn.push(this.fb.control('', Validators.required)); }
//   removeLearningItem(index: number): void { this.whatYouWillLearn.removeAt(index); }
//   addAudience(): void { this.targetAudience.push(this.fb.control('')); }
//   removeAudience(index: number): void { this.targetAudience.removeAt(index); }

//   addTag(event: any): void {
//     const value = (event.target as HTMLInputElement).value.trim();
//     if (value && event.key === 'Enter') {
//       event.preventDefault();
//       this.tags.push(this.fb.control(value));
//       event.target.value = '';
//     }
//   }
  
//   removeTag(index: number): void { this.tags.removeAt(index); }

//   onDragOver(event: DragEvent): void {
//     event.preventDefault();
//     event.stopPropagation();
//   }

//   onDrop(event: DragEvent, type: string): void {
//     event.preventDefault();
//     event.stopPropagation();
//     if (event.dataTransfer?.files?.length) {
//       this.handleFile(event.dataTransfer.files[0], type);
//     }
//   }

//   onFileSelected(event: Event, type: string): void {
//     const input = event.target as HTMLInputElement;
//     if (input.files?.length) {
//       this.handleFile(input.files[0], type);
//     }
//   }

//   private handleFile(file: File, type: string): void {
//     if (type === 'thumbnail' && file.type.startsWith('image/')) {
//       const reader = new FileReader();
//       reader.onload = (e) => this.thumbnailPreview.set(e.target?.result as string);
//       reader.readAsDataURL(file);
//     }
//   }

//   removeThumbnail(event: Event): void {
//     event.stopPropagation();
//     this.thumbnailPreview.set(null);
//     this.courseForm.patchValue({ thumbnail: '' });
//   }

//   onFreeToggle(): void {
//     const isFree = this.courseForm.get('isFree')?.value;
//     const priceCtrl = this.courseForm.get('price');
//     if (isFree) {
//       priceCtrl?.patchValue(0);
//       priceCtrl?.disable();
//     } else {
//       priceCtrl?.enable();
//     }
//   }

//   toggleDiscount(): void {
//     this.hasDiscount.set(!this.hasDiscount());
//     if (!this.hasDiscount()) {
//       this.courseForm.patchValue({ discountPrice: null, discountStartDate: null, discountEndDate: null });
//     }
//   }

//   private recalculateSectionOrders(): void {
//     this.sections.controls.forEach((c, i) => c.get('order')?.setValue(i));
//   }

//   onSubmit(): void {
//     if (this.courseForm.invalid) {
//       this.courseForm.markAllAsTouched();
//       if (this.courseForm.get('title')?.invalid || this.courseForm.get('description')?.invalid || this.courseForm.get('category')?.invalid) {
//         this.currentStep.set(1);
//       } else if (this.whatYouWillLearn.length === 0 || this.whatYouWillLearn.invalid) {
//         this.currentStep.set(4);
//       }
//       return;
//     }

//     this.isLoading.set(true);
//     const formData = this.courseForm.getRawValue();
//     const activeId = this.route.snapshot.paramMap.get('id') || this.courseId();

//     // <-- Updated to use courseApiService methods
//     const request$ = (this.isEditMode() && activeId
//       ? this.courseApiService.updateCourse(activeId, formData)
//       : this.courseApiService.createCourse(formData)) as import('rxjs').Observable<ApiResponse<any>>;

//     request$.subscribe({
//       next: (res: ApiResponse<any>) => {
//         this.isLoading.set(false);
//         this.router.navigate(['/courses/instructor']);
//         // Standardized unwrapping
//         this.saved.emit(res?.data?.course || res?.data);
//       },
//       error: (error: any) => {
//         console.error('Failed to save course', error);
//         this.isLoading.set(false);
//       }
//     });
//   }

//   onCancel(): void {
//     this.cancelled.emit();
//     this.router.navigate(['/courses/instructor']);
//   }

//   private executeLocalSectionRemoval(index: number): void {
//     this.sections.removeAt(index);
//     this.sections.controls.forEach((c, i) => c.get('order')?.setValue(i));
//   }

//   removeSection(index: number): void {
//     const sectionGroup = this.sections.at(index) as FormGroup;
//     const sectionId = sectionGroup.get('_id')?.value;
//     // Don't need courseId for deleting sections anymore based on section-api.service
    
//     if (sectionId) {
//       if (confirm('Are you sure you want to permanently delete this section and all its lessons?')) {
//         this.executeLocalSectionRemoval(index);
        
//         // <-- Updated to use sectionApiService
//         this.sectionApiService.deleteSection(sectionId)
//           .pipe(takeUntilDestroyed(this.destroyRef))
//           .subscribe({
//             next: () => {
//             },
//             error: (err: any) => {
//               if (err.status !== 404 && err.status !== 200 && !err.message.includes('Http failure')) {
//                 console.error('Background delete failed', err);
//               }
//             }
//           });
//       }
//     } else {
//       this.executeLocalSectionRemoval(index);
//     }
//   }

//   removeLesson(sIndex: number, lIndex: number): void {
//     const lessons = this.getLessons(sIndex);
//     const lessonGroup = lessons.at(lIndex) as FormGroup;

//     const lessonId = lessonGroup.get('_id')?.value;

//     if (lessonId) {
//       if (confirm('Permanently delete this lesson?')) {

//         this.executeLocalLessonRemoval(lessons, lIndex);

//         // <-- Updated to use lessonApiService
//         this.lessonApiService.deleteLesson(lessonId)
//           .pipe(takeUntilDestroyed(this.destroyRef))
//           .subscribe({
//             next: () => { /* Background success */ },
//             error: (err: any) => {
//               if (err.status !== 404 && err.status !== 200 && !err.message?.includes('Http failure')) {
//                 console.error('Background lesson delete failed', err);
//               }
//             }
//           });
//       }
//     } else {
//       this.executeLocalLessonRemoval(lessons, lIndex);
//     }
//   }
  
//   private executeLocalLessonRemoval(lessons: FormArray, lIndex: number): void {
//     lessons.removeAt(lIndex);
//     lessons.controls.forEach((c, i) => c.get('order')?.setValue(i));
//   }

//   thumbnailMode = signal<'upload' | 'url'>('upload');
//   thumbnailUrlPreview = signal<string | null>(null);

//   setThumbnailMode(mode: 'upload' | 'url'): void {
//     this.thumbnailMode.set(mode);
//     if (mode === 'url') {
//       this.thumbnailPreview.set(null);
//     } else {
//       this.thumbnailUrlPreview.set(null);
//       this.courseForm.patchValue({ thumbnail: '' });
//     }
//   }

//   onThumbnailUrlChange(event: Event): void {
//     const url = (event.target as HTMLInputElement).value;
//     if (url && url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
//       this.thumbnailUrlPreview.set(url);
//     } else {
//       this.thumbnailUrlPreview.set(null);
//     }
//   }
// }
