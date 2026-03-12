// core/models/course.model.ts

 interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  parent?: string | Category;
  createdAt?: Date;
  updatedAt?: Date;
}

 interface Question {
  _id?: string;
  question: string;
  sectionName?: string;
  marks: number;
  negativeMarks?: number;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
  order?: number;
  mockTest?: string;
}

 interface MockTest {
  _id?: string;
  title: string;
  description?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string | Category;
  duration: number; // in minutes
  passingMarks: number;
  isFree: boolean;
  price?: number;
  totalQuestions: number;
  totalMarks: number;
  isPublished: boolean;
  questions?: Question[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

 interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any[];
}
import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { switchMap, finalize, catchError, tap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';

// Services
import { MockTestService } from '../../../core/services/mock-test.service';
import { CategoryService } from '../../../core/services/category.service';

// Models
// import { Category, MockTest } from '../../../core/models/course.model';

// Constants
const DIFFICULTY_LEVELS:any = [
  { label: 'Beginner', value: 'beginner', color: 'success' },
  { label: 'Intermediate', value: 'intermediate', color: 'warning' },
  { label: 'Advanced', value: 'advanced', color: 'error' }
] as const;

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;
const MAX_QUESTIONS = 100;

@Component({
  selector: 'app-mock-test-builder',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    CheckboxModule,
    SelectModule,
    ToastModule,
    TooltipModule,
    CardModule
  ],
  providers: [MessageService],
  templateUrl: './mock-test-builder.component.html',
  styleUrls: ['./mock-test-builder.component.scss']
})
export class MockTestBuilderComponent implements OnInit {
  // Dependencies
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private mockTestService = inject(MockTestService);
  private categoryService = inject(CategoryService);
  private destroyRef = inject(DestroyRef);

  // Public constants
  readonly levels = DIFFICULTY_LEVELS;
  readonly maxQuestions = MAX_QUESTIONS;

  // State signals
  readonly categories = signal<Category[]>([]);
  readonly mockTestId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly loadingError = signal<string | null>(null);

  // Computed values
  readonly totalMarks = computed(() => {
    const questions = this.testForm?.getRawValue().questions || [];
    return questions.reduce((acc: number, q: any) => acc + (q.marks || 0), 0);
  });

  // Form
  testForm!: FormGroup;

  // Lifecycle
  ngOnInit() {
    this.initializeForm();
    this.loadCategories();
    this.setupRouteSubscription();
    this.setupFormSubscriptions();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  private initializeForm(): void {
    this.testForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', Validators.maxLength(500)],
      level: ['beginner', Validators.required],
      category: [null, Validators.required],
      duration: [60, [Validators.required, Validators.min(1), Validators.max(480)]],
      passingMarks: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      isFree: [false],
      price: [{ value: 0, disabled: false }, [Validators.min(0), Validators.max(9999)]],
      questions: this.fb.array([])
    });
  }

  private setupRouteSubscription(): void {
    this.route.params.pipe(
      tap(() => this.isLoading.set(true)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.mockTestId.set(params['id']);
        this.loadMockTest(params['id']);
      } else {
        this.handleNewTest();
      }
    });
  }

  private setupFormSubscriptions(): void {
    // Handle free test toggle
    this.testForm.get('isFree')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(isFree => this.togglePriceField(isFree));
  }

  private handleNewTest(): void {
    this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(qParams => {
      if (qParams['categoryId']) {
        this.testForm.patchValue({ category: qParams['categoryId'] });
      }
    });
    
    // Add initial question
    this.addQuestion();
    this.isLoading.set(false);
  }

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================

  private loadCategories(): void {
    this.categoryService.getAllCategories({ isActive: true })
      .pipe(
        tap({
          next: (res: any) => {
            const categories = res.data?.data || res.data || [];
            this.categories.set(categories);
          },
          error: (error) => {
            console.error('Failed to load categories', error);
            this.messageService.add({
              severity: 'warn',
              summary: 'Warning',
              detail: 'Could not load categories. Please try again.'
            });
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private loadMockTest(id: string): void {
    this.isLoading.set(true);
    this.loadingError.set(null);

    this.mockTestService.getById(id)
      .pipe(
        tap({
          next: (res: any) => {
            const test = res.data?.mockTest || res.data;
            this.populateForm(test);
          },
          error: (error) => {
            this.loadingError.set(error.message || 'Failed to load mock test');
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Could not load Mock Test. Please try again.'
            });
          }
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private populateForm(test: any): void {
    // Patch basic info
    this.testForm.patchValue({
      title: test.title,
      description: test.description || '',
      level: test.level,
      category: test.category?._id || test.category,
      duration: test.duration,
      passingMarks: test.passingMarks,
      isFree: test.isFree,
      price: test.price || 0
    });

    this.togglePriceField(test.isFree);

    // Clear and populate questions
    this.questions.clear();
    
    if (test.questions?.length) {
      test.questions.forEach((q: any) => this.addExistingQuestion(q));
    } else {
      this.addQuestion();
    }
  }

  // ==========================================================================
  // FORM VALIDATION
  // ==========================================================================

  isFieldInvalid(fieldName: string): boolean {
    const field = this.testForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isQuestionValid(questionIndex: number): boolean {
    const question = this.questions.at(questionIndex);
    return question.valid || !question.touched;
  }

  /**
   * Custom validator factory for options (at least one correct)
   */
  private validateOptions(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      // Ensure control is a FormArray
      if (!(control instanceof FormArray)) {
        return null;
      }

      const formArray = control as FormArray;
      
      // Check if any option has isCorrect = true
      const hasCorrect = formArray.controls.some(
        (optionControl: AbstractControl) => optionControl.get('isCorrect')?.value === true
      );

      return hasCorrect ? null : { noCorrectOption: true };
    };
  }

  // ==========================================================================
  // FORM ARRAY ACCESSORS
  // ==========================================================================

  get questions(): FormArray {
    return this.testForm.get('questions') as FormArray;
  }

  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  // ==========================================================================
  // QUESTION MANAGEMENT
  // ==========================================================================

  addQuestion(): void {
    if (this.questions.length >= MAX_QUESTIONS) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Limit Reached',
        detail: `Maximum ${MAX_QUESTIONS} questions allowed`
      });
      return;
    }

    const questionGroup = this.createQuestionGroup();
    this.questions.push(questionGroup);
  }

  private addExistingQuestion(question: any): void {
    const questionGroup = this.createQuestionGroup();
    
    questionGroup.patchValue({
      sectionName: question.sectionName || 'General',
      question: question.question,
      marks: question.marks,
      negativeMarks: question.negativeMarks || 0
    });

    // Clear and add options
    const optionsArray = questionGroup.get('options') as FormArray;
    optionsArray.clear();
    
    question.options?.forEach((opt: any) => {
      optionsArray.push(this.fb.group({
        text: [opt.text, Validators.required],
        isCorrect: [opt.isCorrect || false]
      }));
    });

    // Re-apply validator and update validity
    optionsArray.setValidators(this.validateOptions());
    optionsArray.updateValueAndValidity();

    this.questions.push(questionGroup);
  }

  private createQuestionGroup(): FormGroup {
    const optionsArray = this.fb.array([
      this.createOptionGroup(),
      this.createOptionGroup()
    ]);

    // Add custom validator
    optionsArray.setValidators(this.validateOptions());

    return this.fb.group({
      sectionName: ['General', [Validators.required, Validators.maxLength(50)]],
      question: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]],
      marks: [1, [Validators.required, Validators.min(0.1), Validators.max(100)]],
      negativeMarks: [0, [Validators.min(0), Validators.max(10)]],
      options: optionsArray
    });
  }

  private createOptionGroup(): FormGroup {
    return this.fb.group({
      text: ['', [Validators.required, Validators.maxLength(500)]],
      isCorrect: [false]
    });
  }

  removeQuestion(index: number): void {
    if (this.questions.length <= 1) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot Remove',
        detail: 'Test must have at least one question'
      });
      return;
    }

    this.questions.removeAt(index);
  }

  // ==========================================================================
  // OPTION MANAGEMENT
  // ==========================================================================

  addOption(questionIndex: number): void {
    const options = this.getOptions(questionIndex);
    
    if (options.length >= MAX_OPTIONS) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Limit Reached',
        detail: `Maximum ${MAX_OPTIONS} options allowed`
      });
      return;
    }

    options.push(this.createOptionGroup());
    
    // Re-apply validator and update validity
    options.setValidators(this.validateOptions());
    options.updateValueAndValidity();
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.getOptions(questionIndex);
    
    if (options.length <= MIN_OPTIONS) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot Remove',
        detail: `Minimum ${MIN_OPTIONS} options required`
      });
      return;
    }

    options.removeAt(optionIndex);
    
    // Re-apply validator and update validity
    options.setValidators(this.validateOptions());
    options.updateValueAndValidity();
  }

  onCorrectChange(questionIndex: number, optionIndex: number, checked: boolean): void {
    if (!checked) return;

    const options = this.getOptions(questionIndex);
    options.controls.forEach((control, idx) => {
      if (idx !== optionIndex) {
        control.get('isCorrect')?.setValue(false, { emitEvent: false });
      }
    });
    
    // Update validity after changes
    options.updateValueAndValidity();
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  calculateTotalMarks(): number {
    return this.totalMarks();
  }

  private togglePriceField(isFree: boolean): void {
    const priceControl = this.testForm.get('price');
    if (isFree) {
      priceControl?.setValue(0, { emitEvent: false });
      priceControl?.disable({ emitEvent: false });
    } else {
      priceControl?.enable({ emitEvent: false });
    }
  }

  private validateTest(): boolean {
    if (this.testForm.invalid) {
      this.testForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Form',
        detail: 'Please fill out all required fields correctly.'
      });
      return false;
    }

    // Validate each question has a correct option
    const questions = this.testForm.getRawValue().questions;
    for (let i = 0; i < questions.length; i++) {
      const hasCorrect = questions[i].options.some((opt: any) => opt.isCorrect);
      if (!hasCorrect) {
        this.messageService.add({
          severity: 'error',
          summary: 'Missing Answer',
          detail: `Question ${i + 1} needs a correct option selected.`
        });
        return false;
      }
    }

    return true;
  }

  // ==========================================================================
  // API OPERATIONS
  // ==========================================================================

  saveMockTest(): void {
    if (!this.validateTest()) {
      return;
    }

    this.isSaving.set(true);
    const rawData = this.testForm.getRawValue();
    
    // Prepare payload
    const mockTestPayload = this.prepareMockTestPayload(rawData);

    const saveOperation = this.mockTestId()
      ? this.updateExistingTest(mockTestPayload)
      : this.createNewTest(mockTestPayload, rawData.questions);

    saveOperation.pipe(
      tap({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Mock Test ${this.mockTestId() ? 'updated' : 'created'} successfully!`
          });
          
          setTimeout(() => {
            this.router.navigate(['/instructor/mock-tests']);
          }, 1500);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || `Failed to ${this.mockTestId() ? 'update' : 'create'} mock test.`
          });
        }
      }),
      finalize(() => this.isSaving.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private prepareMockTestPayload(rawData: any): Partial<MockTest> {
    return {
      title: rawData.title,
      description: rawData.description,
      level: rawData.level,
      category: rawData.category,
      duration: rawData.duration,
      passingMarks: rawData.passingMarks,
      isFree: rawData.isFree,
      price: rawData.isFree ? 0 : rawData.price,
      totalQuestions: rawData.questions.length,
      totalMarks: this.calculateTotalMarks(),
      isPublished: true
    };
  }

  private updateExistingTest(payload: Partial<MockTest>): Observable<any> {
    return this.mockTestService.update(this.mockTestId()!, payload);
  }

  private createNewTest(payload: Partial<MockTest>, questions: any[]): Observable<any> {
    return this.mockTestService.create(payload).pipe(
      switchMap((res: any) => {
        const newId = res.data.mockTest._id;
        
        const questionsWithRef = questions.map((q: any, index: number) => ({
          ...q,
          mockTest: newId,
          order: index
        }));

        return this.mockTestService.addQuestions(newId, questionsWithRef);
      })
    );
  }
}

// import { Component, OnInit, inject, DestroyRef, signal, computed, effect } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { switchMap, finalize, catchError, tap } from 'rxjs/operators';
// import { of, Observable } from 'rxjs';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { TextareaModule } from 'primeng/textarea';
// import { CheckboxModule } from 'primeng/checkbox';
// import { SelectModule } from 'primeng/select';
// import { ToastModule } from 'primeng/toast';
// import { TooltipModule } from 'primeng/tooltip';
// import { CardModule } from 'primeng/card';
// import { MessageService } from 'primeng/api';

// // Services
// import { MockTestService } from '../../../core/services/mock-test.service';
// import { CategoryService } from '../../../core/services/category.service';

// // Models
// import { Category } from '../../../core/models/course.model';

// // Constants
// const DIFFICULTY_LEVELS = [
//   { label: 'Beginner', value: 'beginner', color: 'success' },
//   { label: 'Intermediate', value: 'intermediate', color: 'warning' },
//   { label: 'Advanced', value: 'advanced', color: 'error' }
// ] as const;

// const DEFAULT_QUESTION_COUNT = 1;
// const MIN_OPTIONS = 2;
// const MAX_OPTIONS = 6;
// const MAX_QUESTIONS = 100;

// @Component({
//   selector: 'app-mock-test-builder',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     RouterModule,
//     ButtonModule,
//     InputTextModule,
//     InputNumberModule,
//     TextareaModule,
//     CheckboxModule,
//     SelectModule,
//     ToastModule,
//     TooltipModule,
//     CardModule
//   ],
//   providers: [MessageService],
//   templateUrl: './mock-test-builder.component.html',
//   styleUrls: ['./mock-test-builder.component.scss']
// })
//  class MockTestBuilderComponent implements OnInit {
//   // Dependencies
//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private messageService = inject(MessageService);
//   private mockTestService = inject(MockTestService);
//   private categoryService = inject(CategoryService);
//   private destroyRef = inject(DestroyRef);

//   // Public constants
//   readonly levels = DIFFICULTY_LEVELS;
//   readonly maxQuestions = MAX_QUESTIONS;

//   // State signals
//   readonly categories = signal<Category[]>([]);
//   readonly mockTestId = signal<string | null>(null);
//   readonly isLoading = signal<boolean>(false);
//   readonly isSaving = signal<boolean>(false);
//   readonly loadingError = signal<string | null>(null);

//   // Computed values
//   readonly totalMarks = computed(() => {
//     const questions = this.testForm?.getRawValue().questions || [];
//     return questions.reduce((acc: number, q: any) => acc + (q.marks || 0), 0);
//   });

//   // Form
//   testForm!: FormGroup;

//   // Lifecycle
//   ngOnInit() {
//     this.initializeForm();
//     this.loadCategories();
//     this.setupRouteSubscription();
//     this.setupFormSubscriptions();
//   }

//   // ==========================================================================
//   // INITIALIZATION
//   // ==========================================================================

//   private initializeForm(): void {
//     this.testForm = this.fb.group({
//       title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
//       description: ['', Validators.maxLength(500)],
//       level: ['beginner', Validators.required],
//       category: [null, Validators.required],
//       duration: [60, [Validators.required, Validators.min(1), Validators.max(480)]],
//       passingMarks: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
//       isFree: [false],
//       price: [{ value: 0, disabled: false }, [Validators.min(0), Validators.max(9999)]],
//       questions: this.fb.array([])
//     });
//   }

//   private setupRouteSubscription(): void {
//     this.route.params.pipe(
//       tap(() => this.isLoading.set(true)),
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe(params => {
//       if (params['id'] && params['id'] !== 'new') {
//         this.mockTestId.set(params['id']);
//         this.loadMockTest(params['id']);
//       } else {
//         this.handleNewTest();
//       }
//     });
//   }

//   private setupFormSubscriptions(): void {
//     // Handle free test toggle
//     this.testForm.get('isFree')?.valueChanges.pipe(
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe(isFree => this.togglePriceField(isFree));

//     // Auto-save draft periodically (optional)
//     // this.setupAutoSave();
//   }

//   private handleNewTest(): void {
//     this.route.queryParams.pipe(
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe(qParams => {
//       if (qParams['categoryId']) {
//         this.testForm.patchValue({ category: qParams['categoryId'] });
//       }
//     });
    
//     // Add initial question
//     this.addQuestion();
//     this.isLoading.set(false);
//   }

//   // ==========================================================================
//   // DATA LOADING
//   // ==========================================================================

//   private loadCategories(): void {
//     this.categoryService.getAllCategories({ isActive: true })
//       .pipe(
//         tap({
//           next: (res: any) => {
//             const categories = res.data?.data || res.data || [];
//             this.categories.set(categories);
//           },
//           error: (error) => {
//             console.error('Failed to load categories', error);
//             this.messageService.add({
//               severity: 'warn',
//               summary: 'Warning',
//               detail: 'Could not load categories. Please try again.'
//             });
//           }
//         }),
//         takeUntilDestroyed(this.destroyRef)
//       )
//       .subscribe();
//   }

//   private loadMockTest(id: string): void {
//     this.isLoading.set(true);
//     this.loadingError.set(null);

//     this.mockTestService.getById(id)
//       .pipe(
//         tap({
//           next: (res: any) => {
//             const test = res.data?.mockTest || res.data;
//             this.populateForm(test);
//           },
//           error: (error) => {
//             this.loadingError.set(error.message || 'Failed to load mock test');
//             this.messageService.add({
//               severity: 'error',
//               summary: 'Error',
//               detail: 'Could not load Mock Test. Please try again.'
//             });
//           }
//         }),
//         finalize(() => this.isLoading.set(false)),
//         takeUntilDestroyed(this.destroyRef)
//       )
//       .subscribe();
//   }

//   private populateForm(test: any): void {
//     // Patch basic info
//     this.testForm.patchValue({
//       title: test.title,
//       description: test.description || '',
//       level: test.level,
//       category: test.category?._id || test.category,
//       duration: test.duration,
//       passingMarks: test.passingMarks,
//       isFree: test.isFree,
//       price: test.price || 0
//     });

//     this.togglePriceField(test.isFree);

//     // Clear and populate questions
//     this.questions.clear();
    
//     if (test.questions?.length) {
//       test.questions.forEach((q: any) => this.addExistingQuestion(q));
//     } else {
//       this.addQuestion();
//     }
//   }

//   // ==========================================================================
//   // FORM VALIDATION
//   // ==========================================================================

//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.testForm.get(fieldName);
//     return !!(field && field.invalid && (field.dirty || field.touched));
//   }

//   isQuestionValid(questionIndex: number): boolean {
//     const question = this.questions.at(questionIndex);
//     return question.valid || !question.touched;
//   }

//   // Custom validator for options (at least one correct)
//   private validateOptions(options: FormArray): ValidationErrors | null {
//     const hasCorrect = options.controls.some(
//       control => control.get('isCorrect')?.value === true
//     );
//     return hasCorrect ? null : { noCorrectOption: true };
//   }

//   // ==========================================================================
//   // FORM ARRAY ACCESSORS
//   // ==========================================================================

//   get questions(): FormArray {
//     return this.testForm.get('questions') as FormArray;
//   }

//   getOptions(questionIndex: number): FormArray {
//     return this.questions.at(questionIndex).get('options') as FormArray;
//   }

//   // ==========================================================================
//   // QUESTION MANAGEMENT
//   // ==========================================================================

//   addQuestion(): void {
//     if (this.questions.length >= MAX_QUESTIONS) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Limit Reached',
//         detail: `Maximum ${MAX_QUESTIONS} questions allowed`
//       });
//       return;
//     }

//     const questionGroup = this.createQuestionGroup();
//     this.questions.push(questionGroup);
//   }

//   private addExistingQuestion(question: any): void {
//     const questionGroup = this.createQuestionGroup();
    
//     questionGroup.patchValue({
//       sectionName: question.sectionName || 'General',
//       question: question.question,
//       marks: question.marks,
//       negativeMarks: question.negativeMarks || 0
//     });

//     // Clear and add options
//     const optionsArray = questionGroup.get('options') as FormArray;
//     optionsArray.clear();
    
//     question.options?.forEach((opt:any) => {
//       optionsArray.push(this.fb.group({
//         text: [opt.text, Validators.required],
//         isCorrect: [opt.isCorrect || false]
//       }));
//     });

//     this.questions.push(questionGroup);
//   }

//   private createQuestionGroup(): FormGroup {
//     const optionsArray = this.fb.array([
//       this.createOptionGroup(),
//       this.createOptionGroup()
//     ]);

//     // Add custom validator
//     optionsArray.setValidators(this.validateOptions.bind(this));

//     return this.fb.group({
//       sectionName: ['General', [Validators.required, Validators.maxLength(50)]],
//       question: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]],
//       marks: [1, [Validators.required, Validators.min(0.1), Validators.max(100)]],
//       negativeMarks: [0, [Validators.min(0), Validators.max(10)]],
//       options: optionsArray
//     });
//   }

//   private createOptionGroup(): FormGroup {
//     return this.fb.group({
//       text: ['', [Validators.required, Validators.maxLength(500)]],
//       isCorrect: [false]
//     });
//   }

//   removeQuestion(index: number): void {
//     if (this.questions.length <= 1) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Cannot Remove',
//         detail: 'Test must have at least one question'
//       });
//       return;
//     }

//     this.questions.removeAt(index);
//   }

//   // ==========================================================================
//   // OPTION MANAGEMENT
//   // ==========================================================================

//   addOption(questionIndex: number): void {
//     const options = this.getOptions(questionIndex);
    
//     if (options.length >= MAX_OPTIONS) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Limit Reached',
//         detail: `Maximum ${MAX_OPTIONS} options allowed`
//       });
//       return;
//     }

//     options.push(this.createOptionGroup());
//   }

//   removeOption(questionIndex: number, optionIndex: number): void {
//     const options = this.getOptions(questionIndex);
    
//     if (options.length <= MIN_OPTIONS) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Cannot Remove',
//         detail: `Minimum ${MIN_OPTIONS} options required`
//       });
//       return;
//     }

//     options.removeAt(optionIndex);
//   }

//   onCorrectChange(questionIndex: number, optionIndex: number, checked: boolean): void {
//     if (!checked) return;

//     const options = this.getOptions(questionIndex);
//     options.controls.forEach((control, idx) => {
//       if (idx !== optionIndex) {
//         control.get('isCorrect')?.setValue(false, { emitEvent: false });
//       }
//     });
//   }

//   // ==========================================================================
//   // UTILITIES
//   // ==========================================================================

//   calculateTotalMarks(): number {
//     return this.totalMarks();
//   }

//   private togglePriceField(isFree: boolean): void {
//     const priceControl = this.testForm.get('price');
//     if (isFree) {
//       priceControl?.setValue(0, { emitEvent: false });
//       priceControl?.disable({ emitEvent: false });
//     } else {
//       priceControl?.enable({ emitEvent: false });
//     }
//   }

//   private validateTest(): boolean {
//     if (this.testForm.invalid) {
//       this.testForm.markAllAsTouched();
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Incomplete Form',
//         detail: 'Please fill out all required fields correctly.'
//       });
//       return false;
//     }

//     // Validate each question has a correct option
//     const questions = this.testForm.getRawValue().questions;
//     for (let i = 0; i < questions.length; i++) {
//       const hasCorrect = questions[i].options.some((opt: any) => opt.isCorrect);
//       if (!hasCorrect) {
//         this.messageService.add({
//           severity: 'error',
//           summary: 'Missing Answer',
//           detail: `Question ${i + 1} needs a correct option selected.`
//         });
//         return false;
//       }
//     }

//     return true;
//   }

//   // ==========================================================================
//   // API OPERATIONS
//   // ==========================================================================

//   saveMockTest(): void {
//     if (!this.validateTest()) {
//       return;
//     }

//     this.isSaving.set(true);
//     const rawData = this.testForm.getRawValue();
    
//     // Prepare payload
//     const mockTestPayload = this.prepareMockTestPayload(rawData);

//     const saveOperation = this.mockTestId()
//       ? this.updateExistingTest(mockTestPayload)
//       : this.createNewTest(mockTestPayload, rawData.questions);

//     saveOperation.pipe(
//       tap({
//         next: () => {
//           this.messageService.add({
//             severity: 'success',
//             summary: 'Success',
//             detail: `Mock Test ${this.mockTestId() ? 'updated' : 'created'} successfully!`
//           });
          
//           setTimeout(() => {
//             this.router.navigate(['/instructor/mock-tests']);
//           }, 1500);
//         },
//         error: (error) => {
//           this.messageService.add({
//             severity: 'error',
//             summary: 'Error',
//             detail: error.error?.message || `Failed to ${this.mockTestId() ? 'update' : 'create'} mock test.`
//           });
//         }
//       }),
//       finalize(() => this.isSaving.set(false)),
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe();
//   }

//   private prepareMockTestPayload(rawData: any): Partial<MockTest> {
//     return {
//       title: rawData.title,
//       description: rawData.description,
//       level: rawData.level,
//       category: rawData.category,
//       duration: rawData.duration,
//       passingMarks: rawData.passingMarks,
//       isFree: rawData.isFree,
//       price: rawData.isFree ? 0 : rawData.price,
//       totalQuestions: rawData.questions.length,
//       totalMarks: this.calculateTotalMarks(),
//       isPublished: true
//     };
//   }

//   private updateExistingTest(payload: Partial<MockTest>): Observable<any> {
//     return this.mockTestService.update(this.mockTestId()!, payload);
//   }

//   private createNewTest(payload: Partial<MockTest>, questions: any[]): Observable<any> {
//     return this.mockTestService.create(payload).pipe(
//       switchMap((res: any) => {
//         const newId = res.data.mockTest._id;
        
//         const questionsWithRef = questions.map((q: any, index: number) => ({
//           ...q,
//           mockTest: newId,
//           order: index
//         }));

//         return this.mockTestService.addQuestions(newId, questionsWithRef);
//       })
//     );
//   }

//   // Optional: Auto-save draft functionality
//   private setupAutoSave(): void {
//     this.testForm.valueChanges.pipe(
//       debounceTime(3000),
//       filter(() => this.testForm.dirty && this.testForm.valid),
//       switchMap(() => {
//         if (!this.mockTestId()) return of(null);
//         const payload = this.prepareMockTestPayload(this.testForm.getRawValue());
//         return this.mockTestService.update(this.mockTestId()!, payload).pipe(
//           catchError(() => of(null))
//         );
//       }),
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe();
//   }
// }

// // Utility function for debounce (add if needed)
// function debounceTime(ms: number) {
//   return (source: Observable<any>) => {
//     return new Observable(subscriber => {
//       let timeoutId: any;
//       return source.subscribe({
//         next(value) {
//           clearTimeout(timeoutId);
//           timeoutId = setTimeout(() => subscriber.next(value), ms);
//         },
//         error(err) { subscriber.error(err); },
//         complete() { subscriber.complete(); }
//       });
//     });
//   };
// }
// // import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
// // import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
// // import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// // import { switchMap } from 'rxjs/operators';
// // import { of } from 'rxjs';

// // // PrimeNG
// // import { ButtonModule } from 'primeng/button';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { TextareaModule } from 'primeng/textarea';
// // import { CheckboxModule } from 'primeng/checkbox';
// // import { SelectModule } from 'primeng/select';
// // import { ToastModule } from 'primeng/toast';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { MessageService } from 'primeng/api';

// // // Services
// // import { MockTestService } from '../../../core/services/mock-test.service';
// // import { CategoryService } from '../../../core/services/category.service';
// // import { Category } from '../../../core/models/course.model';
// // import { Card } from "primeng/card";

// // @Component({
// //   selector: 'app-mock-test-builder',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     ReactiveFormsModule,
// //     RouterModule,
// //     ButtonModule,
// //     InputTextModule,
// //     InputNumberModule,
// //     TextareaModule,
// //     CheckboxModule,
// //     SelectModule,
// //     ToastModule,
// //     TooltipModule,
// //     Card
// // ],
// //   providers: [MessageService],
// //   templateUrl: './mock-test-builder.component.html',
// //   styleUrls: ['./mock-test-builder.component.scss']
// // })
// //  class MockTestBuilderComponent implements OnInit {
// //   private fb = inject(FormBuilder);
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);
// //   private messageService = inject(MessageService);
// //   private mockTestService = inject(MockTestService);
// //   private categoryService = inject(CategoryService);
// //   private destroyRef = inject(DestroyRef);

// //   // State
// //   categories = signal<Category[]>([]);
// //   mockTestId = signal<string | null>(null);
// //   isLoading = signal<boolean>(false);
// //   isSaving = signal<boolean>(false);

// //   levels = [
// //     { label: 'Beginner', value: 'beginner' }, 
// //     { label: 'Intermediate', value: 'intermediate' }, 
// //     { label: 'Advanced', value: 'advanced' }
// //   ];
  
// //   testForm: FormGroup = this.fb.group({
// //     title: ['', Validators.required],
// //     description: [''],
// //     level: ['beginner', Validators.required],
// //     category: [null, Validators.required], // Added Category Form Control
// //     duration: [60, [Validators.required, Validators.min(1)]],
// //     passingMarks: [50, [Validators.required, Validators.min(1)]],
// //     isFree: [false],
// //     price: [{ value: 0, disabled: false }, [Validators.min(0)]], 
// //     questions: this.fb.array([])
// //   });

// //   ngOnInit() { 
// //     // Load categories first
// //     this.loadCategories();

// //     // Handle Routing & Initialization
// //     this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
// //       if (params['id'] && params['id'] !== 'new') {
// //         this.mockTestId.set(params['id']);
// //         this.loadMockTest(params['id']);
// //       } else {
// //         // If creating new, check if we came from a specific category route
// //         this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(qParams => {
// //           if (qParams['categoryId']) {
// //             this.testForm.patchValue({ category: qParams['categoryId'] });
// //           }
// //         });
// //         this.addQuestion(); // Start with one empty question
// //       }
// //     });

// //     // Handle Monetary Logic: Clear & disable price if test is set to Free
// //     this.testForm.get('isFree')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(isFree => {
// //       this.togglePriceField(isFree);
// //     });
// //   }

// //   private loadCategories(): void {
// //     this.categoryService.getAllCategories({ isActive: true })
// //       .pipe(takeUntilDestroyed(this.destroyRef))
// //       .subscribe({
// //         next: (res: any) => this.categories.set(res.data?.data || res.data || []),
// //         error: (error: any) => console.error('Failed to load categories', error)
// //       });
// //   }

// //   // Form Validation Helper
// //   isFieldInvalid(fieldName: string): boolean {
// //     const field = this.testForm.get(fieldName);
// //     return !!(field && field.invalid && (field.dirty || field.touched));
// //   }

// //   // Helper to dynamically enable/disable price
// //   private togglePriceField(isFree: boolean): void {
// //     const priceControl = this.testForm.get('price');
// //     if (isFree) {
// //       priceControl?.setValue(0, { emitEvent: false });
// //       priceControl?.disable({ emitEvent: false });
// //     } else {
// //       priceControl?.enable({ emitEvent: false });
// //     }
// //   }

// //   // --- Form Array Getters ---
// //   get questions(): FormArray { return this.testForm.get('questions') as FormArray; }
// //   getOptions(qIndex: number): FormArray { return this.questions.at(qIndex).get('options') as FormArray; }

// //   // --- Mutators ---
// //   addQuestion() {
// //     this.questions.push(this.fb.group({
// //       sectionName: ['General', Validators.required], 
// //       question: ['', Validators.required],
// //       marks: [1, [Validators.required, Validators.min(0.1)]],
// //       negativeMarks: [0, Validators.min(0)], 
// //       options: this.fb.array([
// //         this.fb.group({ text: ['', Validators.required], isCorrect: [false] }),
// //         this.fb.group({ text: ['', Validators.required], isCorrect: [false] })
// //       ])
// //     }));
// //   }

// //   addOption(qIndex: number) {
// //     this.getOptions(qIndex).push(this.fb.group({ text: ['', Validators.required], isCorrect: [false] }));
// //   }

// //   removeQuestion(index: number) { this.questions.removeAt(index); }
// //   removeOption(qIndex: number, optIndex: number) { this.getOptions(qIndex).removeAt(optIndex); }

// //   onCorrectChange(qIndex: number, optIndex: number, checked: boolean) {
// //     const options = this.getOptions(qIndex);
    
// //     if (checked) {
// //       options.controls.forEach((ctrl, idx) => {
// //         if (idx !== optIndex) {
// //           ctrl.get('isCorrect')?.setValue(false, { emitEvent: false });
// //         }
// //       });
// //     }
// //   }

// //   calculateTotalMarks(): number {
// //     const questions = this.testForm.getRawValue().questions || []; 
// //     return questions.reduce((acc: number, q: any) => acc + (q.marks || 0), 0);
// //   }

// //   // --- API Integrations ---
// //   private loadMockTest(id: string): void {
// //     this.isLoading.set(true);
// //     this.mockTestService.getById(id)
// //       .pipe(takeUntilDestroyed(this.destroyRef))
// //       .subscribe({
// //         next: (res: any) => {
// //           const test = res.data?.mockTest || res.data;
          
// //           this.testForm.patchValue({
// //             title: test.title,
// //             description: test.description,
// //             level: test.level,
// //             category: test.category?._id || test.category, // Handle populated category
// //             duration: test.duration,
// //             passingMarks: test.passingMarks,
// //             isFree: test.isFree,
// //             price: test.price
// //           });

// //           this.togglePriceField(test.isFree);
          
// //           if (test.questions && Array.isArray(test.questions)) {
// //             this.questions.clear();
// //             test.questions.forEach((q: any) => {
// //                // Your logic for mapping backend questions to the form array goes here
// //             });
// //           }

// //           if (this.questions.length === 0) {
// //              this.addQuestion(); 
// //           }

// //           this.isLoading.set(false);
// //         },
// //         error: () => {
// //           this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load Mock Test.' });
// //           this.isLoading.set(false);
// //         }
// //       });
// //   }

// //   saveMockTest() {
// //     if (this.testForm.invalid) {
// //       this.testForm.markAllAsTouched();
// //       this.messageService.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please fill out all required fields before saving.' });
// //       return;
// //     }

// //     const rawData = this.testForm.getRawValue(); 
    
// //     for (let i = 0; i < rawData.questions.length; i++) {
// //       const hasCorrect = rawData.questions[i].options.some((opt: any) => opt.isCorrect);
// //       if (!hasCorrect) {
// //          this.messageService.add({ severity: 'error', summary: 'Missing Answer', detail: `Question ${i + 1} needs a correct option selected.` });
// //          return;
// //       }
// //     }

// //     // Notice we now use rawData.category directly from the form dropdown
// //     const mockTestPayload = {
// //       title: rawData.title,
// //       description: rawData.description,
// //       level: rawData.level,
// //       category: rawData.category,
// //       duration: rawData.duration,
// //       passingMarks: rawData.passingMarks,
// //       isFree: rawData.isFree,
// //       price: rawData.price,
// //       totalQuestions: rawData.questions.length,
// //       totalMarks: this.calculateTotalMarks(),
// //       isPublished: true
// //     };

// //     this.isSaving.set(true);

// //     const request$ = this.mockTestId()
// //       ? this.mockTestService.update(this.mockTestId()!, mockTestPayload)
// //       : this.mockTestService.create(mockTestPayload).pipe(
// //           switchMap((res: any) => {
// //             const newId = res.data.mockTest._id;
            
// //             const questionsWithRef = rawData.questions.map((q: any, index: number) => ({
// //               ...q,
// //               mockTest: newId,
// //               order: index
// //             }));
            
// //             return this.mockTestService.addQuestions(newId, questionsWithRef);
// //           })
// //         );

// //     request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
// //       next: () => {
// //         this.isSaving.set(false);
// //         this.messageService.add({ severity: 'success', summary: 'Published', detail: 'Mock Test is now live and assigned.' });
// //         setTimeout(() => this.router.navigate(['/instructor/mock-tests']), 1200);
// //       },
// //       error: (err: any) => {
// //         this.isSaving.set(false);
// //         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to publish mock test.' });
// //       }
// //     });
// //   }
// // }