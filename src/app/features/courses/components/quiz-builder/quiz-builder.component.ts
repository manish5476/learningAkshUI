import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { switchMap, finalize, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { combineLatest } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';

// Services
import { QuizService } from '../../../../core/services/quiz.service';

// Types
interface QuestionType {
  label: string;
  value: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  icon: string;
  color: 'primary' | 'info' | 'success' | 'warning';
}

interface QuizData {
  quiz: any;
  questions: any[];
}

@Component({
  selector: 'app-quiz-builder',
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
    RadioButtonModule,
    ToastModule,
    TooltipModule,
    CardModule
  ],
  providers: [MessageService],
  templateUrl: './quiz-builder.component.html',
  styleUrls: ['./quiz-builder.component.scss']
})
export class QuizBuilderComponent implements OnInit {
  // Dependencies
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private quizService = inject(QuizService);
  private destroyRef = inject(DestroyRef);

  // State signals
  readonly quizId = signal<string | null>(null);
  readonly courseId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  // Constants
  readonly questionTypes: QuestionType[] = [
    { label: 'Multiple Choice', value: 'multiple-choice', icon: 'pi pi-list', color: 'primary' },
    { label: 'True / False', value: 'true-false', icon: 'pi pi-check-circle', color: 'info' },
    { label: 'Short Answer', value: 'short-answer', icon: 'pi pi-window-minimize', color: 'success' },
    { label: 'Essay', value: 'essay', icon: 'pi pi-align-left', color: 'warning' }
  ];

  readonly minOptions = 2;
  readonly maxOptions = 6;
  readonly maxQuestions = 50;

  // Form
  quizForm!: FormGroup;

  // Lifecycle
  ngOnInit(): void {
    this.initializeForm();
    this.setupRouteSubscriptions();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  private initializeForm(): void {
    this.quizForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', Validators.maxLength(1000)],
      timeLimit: [30, [Validators.required, Validators.min(0), Validators.max(480)]],
      passingScore: [70, [Validators.required, Validators.min(1), Validators.max(100)]],
      maxAttempts: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
      questions: this.fb.array([])
    });
  }

  private setupRouteSubscriptions(): void {
    // Combine both params and queryParams to handle all cases
    combineLatest([
      this.route.params,
      this.route.queryParams
    ]).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([params, queryParams]) => {

      // Priority 1: Get courseId from route params (your main route structure)
      if (params['courseId']) {
        this.courseId.set(params['courseId']);
      }
      // Priority 2: Get courseId from query params (fallback)
      else if (queryParams['courseId']) {
        this.courseId.set(queryParams['courseId']);
      }

      // Handle quiz ID
      if (params['id'] && params['id'] !== 'new') {
        // Edit existing quiz
        this.quizId.set(params['id']);
        this.loadQuiz(params['id']);
      } else if (params['id'] === 'new') {
        // Create new quiz - verify we have courseId
        if (!this.courseId()) {
          console.error('Course ID is required to create a quiz');
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Course ID is missing. Cannot create quiz.'
          });

          // Redirect back to courses
          setTimeout(() => {
            this.router.navigate(['/instructor/courses']);
          }, 2000);
          return;
        }

        // Add initial question if this is a new quiz
        if (this.questions.length === 0) {
          this.addQuestion();
        }
      }
    });
  }
  // private setupRouteSubscriptions(): void {
  //   // Get course ID from route parameters FIRST (this is your main issue)
  //   this.route.params.pipe(
  //     takeUntilDestroyed(this.destroyRef)
  //   ).subscribe(params => {
  //     // Check for courseId in route params (from your route structure: /courses/:courseId/quiz/:id)
  //     if (params['courseId']) {
  //       console.log('Found courseId in route params:', params['courseId']);
  //       this.courseId.set(params['courseId']);
  //     }

  //     // Handle quiz ID param
  //     if (params['id'] && params['id'] !== 'new') {
  //       this.quizId.set(params['id']);
  //       this.loadQuiz(params['id']);
  //     } else if (params['id'] === 'new') {
  //       // For new quiz, make sure we have courseId before adding question
  //       if (this.courseId()) {
  //         this.addQuestion(); // Start with one empty question
  //       } else {
  //         // If no courseId yet, wait for query params or show error
  //         console.warn('No courseId found in params yet');
  //       }
  //     }
  //   });

  //   // Also check query params as fallback (for backward compatibility)
  //   this.route.queryParams.pipe(
  //     takeUntilDestroyed(this.destroyRef)
  //   ).subscribe(params => {
  //     if (params['courseId'] && !this.courseId()) {
  //       console.log('Found courseId in query params:', params['courseId']);
  //       this.courseId.set(params['courseId']);

  //       // If this is a new quiz and we just got the courseId, add the question
  //       const currentId = this.route.snapshot.params['id'];
  //       if (currentId === 'new' && this.questions.length === 0) {
  //         this.addQuestion();
  //       }
  //     }
  //   });
  // }

  // private setupRouteSubscriptions(): void {
  //   // Get course ID from query params
  //   this.route.queryParams.pipe(
  //     takeUntilDestroyed(this.destroyRef)
  //   ).subscribe(params => {
  //     if (params['courseId']) {
  //       this.courseId.set(params['courseId']);
  //     }
  //   });

  //   // Handle quiz ID param
  //   this.route.params.pipe(
  //     takeUntilDestroyed(this.destroyRef)
  //   ).subscribe(params => {
  //     if (params['id'] && params['id'] !== 'new') {
  //       this.quizId.set(params['id']);
  //       this.loadQuiz(params['id']);
  //     } else {
  //       this.addQuestion(); // Start with one empty question
  //     }
  //   });
  // }

  // ==========================================================================
  // FORM ACCESSORS
  // ==========================================================================

  get questions(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  // ==========================================================================
  // FORM VALIDATION
  // ==========================================================================

  isFieldInvalid(fieldName: string): boolean {
    const field = this.quizForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Custom validator to ensure at least one option is marked as correct
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
  // QUESTION MANAGEMENT
  // ==========================================================================

  private createQuestionGroup(): FormGroup {
    const optionsArray = this.fb.array([
      this.createOptionGroup(),
      this.createOptionGroup()
    ]);

    // Add custom validator to the options array
    optionsArray.setValidators(this.validateOptions());

    return this.fb.group({
      question: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1000)]],
      type: ['multiple-choice', Validators.required],
      points: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      explanation: ['', Validators.maxLength(1000)],
      correctAnswer: [''],
      options: optionsArray
    });
  }

  private createOptionGroup(): FormGroup {
    return this.fb.group({
      text: ['', [Validators.required, Validators.maxLength(500)]],
      isCorrect: [false]
    });
  }

  addQuestion(): void {
    if (this.questions.length >= this.maxQuestions) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Limit Reached',
        detail: `Maximum ${this.maxQuestions} questions allowed`
      });
      return;
    }

    this.questions.push(this.createQuestionGroup());
  }

  removeQuestion(index: number): void {
    if (this.questions.length <= 1) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot Remove',
        detail: 'Quiz must have at least one question'
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

    if (options.length >= this.maxOptions) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Limit Reached',
        detail: `Maximum ${this.maxOptions} options allowed`
      });
      return;
    }

    options.push(this.createOptionGroup());

    // Re-apply validators after adding
    options.updateValueAndValidity();
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.getOptions(questionIndex);

    if (options.length <= this.minOptions) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cannot Remove',
        detail: `Minimum ${this.minOptions} options required`
      });
      return;
    }

    options.removeAt(optionIndex);

    // Re-apply validators after removal
    options.updateValueAndValidity();
  }

  onCorrectAnswerChange(questionIndex: number, optionIndex: number, isChecked: boolean): void {
    if (!isChecked) return;

    const options = this.getOptions(questionIndex);
    options.controls.forEach((control: AbstractControl, idx: number) => {
      if (idx !== optionIndex) {
        control.get('isCorrect')?.setValue(false, { emitEvent: false });
      }
    });

    // Update validity after changes
    options.updateValueAndValidity();
  }

  // ==========================================================================
  // TYPE HANDLING
  // ==========================================================================

  onQuestionTypeChange(questionIndex: number, newType: string): void {
    const question = this.questions.at(questionIndex);

    // Reset type-specific fields
    if (newType === 'true-false') {
      question.get('correctAnswer')?.setValue('true');
    } else {
      question.get('correctAnswer')?.setValue('');
    }

    // Update validation based on type
    const optionsArray = question.get('options') as FormArray;
    if (newType === 'multiple-choice') {
      optionsArray.setValidators(this.validateOptions());
    } else {
      optionsArray.clearValidators();
    }
    optionsArray.updateValueAndValidity();
  }

  getTypeColor(type: string): string {
    const questionType = this.questionTypes.find(t => t.value === type);
    return `var(--color-${questionType?.color || 'primary'})`;
  }

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================

  private loadQuiz(id: string): void {
    this.isLoading.set(true);

    this.quizService.getQuizWithQuestions(id).pipe(finalize(() => this.isLoading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const { quiz, questions } = res.data as QuizData;
        this.populateForm(quiz, questions);
      },
      error: (error) => {
        console.error('Failed to load quiz:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load quiz data. Please try again.'
        });
      }
    });
  }

  private populateForm(quiz: any, questions: any[]): void {
    // Set course ID from quiz
    this.courseId.set(quiz.course?._id || quiz.course);

    // Patch basic info
    this.quizForm.patchValue({
      title: quiz.title,
      description: quiz.description || '',
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts
    });

    // Clear and populate questions
    this.questions.clear();

    if (questions?.length) {
      questions.forEach(q => this.addExistingQuestion(q));
    } else {
      this.addQuestion();
    }
  }

  private addExistingQuestion(question: any): void {
    const questionGroup = this.createQuestionGroup();

    questionGroup.patchValue({
      question: question.question,
      type: question.type,
      points: question.points,
      explanation: question.explanation || '',
      correctAnswer: question.correctAnswer || ''
    });

    // Handle options for multiple choice
    if (question.type === 'multiple-choice' && question.options?.length) {
      const optionsArray = questionGroup.get('options') as FormArray;
      optionsArray.clear();

      question.options.forEach((opt: any) => {
        optionsArray.push(this.fb.group({
          text: [opt.text, Validators.required],
          isCorrect: [opt.isCorrect || false]
        }));
      });

      // Re-apply validator based on type
      if (question.type === 'multiple-choice') {
        optionsArray.setValidators(this.validateOptions());
        optionsArray.updateValueAndValidity();
      }
    }

    this.questions.push(questionGroup);
  }

  // ==========================================================================
  // SAVE OPERATIONS
  // ==========================================================================

  saveQuiz(): void {
    if (!this.validateQuiz()) {
      return;
    }

    this.isSaving.set(true);
    const rawData = this.quizForm.getRawValue();

    const saveOperation = this.quizId()
      ? this.updateQuiz(rawData)
      : this.createQuiz(rawData);

    saveOperation.pipe(
      finalize(() => this.isSaving.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Quiz ${this.quizId() ? 'updated' : 'created'} successfully!`
        });

        setTimeout(() => {
          this.router.navigate(['/instructor/courses']);
        }, 1500);
      },
      error: (error) => {
        console.error('Failed to save quiz:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || `Failed to ${this.quizId() ? 'update' : 'create'} quiz.`
        });
      }
    });
  }

  private validateQuiz(): boolean {
    // Check course ID
    if (!this.courseId()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Missing Course',
        detail: 'This quiz must be attached to a course.'
      });
      return false;
    }

    // Check form validity
    if (this.quizForm.invalid) {
      this.quizForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Incomplete Form',
        detail: 'Please fill out all required fields correctly.'
      });
      return false;
    }

    const rawData = this.quizForm.getRawValue();

    // Validate each question based on type
    for (let i = 0; i < rawData.questions.length; i++) {
      const q = rawData.questions[i];

      if (q.type === 'multiple-choice') {
        const hasCorrect = q.options.some((opt: any) => opt.isCorrect);
        if (!hasCorrect) {
          this.messageService.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: `Question ${i + 1} must have a correct option selected.`
          });
          return false;
        }
      } else if (q.type === 'true-false' || q.type === 'short-answer') {
        if (!q.correctAnswer || q.correctAnswer.trim() === '') {
          this.messageService.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: `Question ${i + 1} requires a correct answer.`
          });
          return false;
        }
      }
    }

    return true;
  }

  private createQuiz(rawData: any): Observable<any> {
    const basePayload = {
      title: rawData.title,
      description: rawData.description,
      timeLimit: rawData.timeLimit,
      passingScore: rawData.passingScore,
      maxAttempts: rawData.maxAttempts,
      course: this.courseId()
    };

    return this.quizService.createQuiz(basePayload).pipe(
      switchMap((res: any) => {
        const newQuizId = res.data.quiz._id;
        this.quizId.set(newQuizId);
        return this.quizService.addQuestions(newQuizId, rawData.questions);
      })
    );
  }

  private updateQuiz(rawData: any): Observable<any> {
    const basePayload = {
      title: rawData.title,
      description: rawData.description,
      timeLimit: rawData.timeLimit,
      passingScore: rawData.passingScore,
      maxAttempts: rawData.maxAttempts
    };

    return this.quizService.updateQuiz(this.quizId()!, basePayload);
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  copyQuizId(): void {
    if (this.quizId()) {
      navigator.clipboard.writeText(this.quizId()!);
      this.messageService.add({
        severity: 'info',
        summary: 'Copied',
        detail: 'Quiz ID copied to clipboard!'
      });
    }
  }
}
