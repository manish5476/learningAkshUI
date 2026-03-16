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
import { of, Observable, forkJoin } from 'rxjs';

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
import { MasterApiService } from '../../../core/services/master-list.service';
import { AppMessageService } from '../../../core/utils/message.service';

// Models
// import { Category, MockTest } from '../../../core/models/course.model';

// Constants
// const DIFFICULTY_LEVELS:any = [
//   { label: 'Beginner', value: 'beginner', color: 'success' },
//   { label: 'Intermediate', value: 'intermediate', color: 'warning' },
//   { label: 'Advanced', value: 'advanced', color: 'error' }
// ] as const;

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
  private masterApiService = inject(MasterApiService);
  private router = inject(Router);
  private messageService = inject(AppMessageService);
  private mockTestService = inject(MockTestService);
  private categoryService = inject(CategoryService);
  private destroyRef = inject(DestroyRef);

  // Public constants
  readonly levels = signal<any[]>([]);
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
    this.loadMasterData();
    this.setupRouteSubscription();
    this.setupFormSubscriptions();
  }

  private loadMasterData(): void {
    forkJoin({
      categories: this.masterApiService.getPublicValues('course_category'),
      levels: this.masterApiService.getPublicValues('course_level'),
      // languages: this.masterApiService.getPublicValues('language'),
      // currencies: this.masterApiService.getPublicValues('currency'),
      // lessonTypes: this.masterApiService.getPublicValues('lesson_type')
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.categories.set(res.categories.data);
          this.levels.set(res.levels.data || []);
          // this.languages.set(res.languages.data || []);
          // this.currencies.set(res.currencies.data || []);
          // this.lessonTypes.set(res.lessonTypes.data || []);
        },
        error: (err) => console.error('Failed to load master dropdowns', err)
      });
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
            this.messageService.showWarn('Could not load categories. Please try again.');
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
            this.messageService.showError('Could not load Mock Test. Please try again.');
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
      this.messageService.showWarn(`Maximum ${MAX_QUESTIONS} questions allowed`);
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
      this.messageService.showWarn('Test must have at least one question');
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
      this.messageService.showWarn(`Maximum ${MAX_OPTIONS} options allowed`);
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
      this.messageService.showWarn(`Minimum ${MIN_OPTIONS} options required`);
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
      this.messageService.showWarn('Please fill out all required fields correctly.');
      return false;
    }

    // Validate each question has a correct option
    const questions = this.testForm.getRawValue().questions;
    for (let i = 0; i < questions.length; i++) {
      const hasCorrect = questions[i].options.some((opt: any) => opt.isCorrect);
      if (!hasCorrect) {
        this.messageService.showError(`Question ${i + 1} needs a correct option selected.`);
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
          this.messageService.showSuccess(
            `Mock Test ${this.mockTestId() ? 'updated' : 'created'} successfully!`
          );

          setTimeout(() => {
            this.router.navigate(['/instructor/mock-tests']);
          }, 1500);
        },
        error: (error) => {
          this.messageService.showError(error.error?.message || `Failed to ${this.mockTestId() ? 'update' : 'create'} mock test.`);
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