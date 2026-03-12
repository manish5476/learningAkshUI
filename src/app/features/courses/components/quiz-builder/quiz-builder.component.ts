import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { switchMap, finalize, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

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
    // Get course ID from query params
    this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      if (params['courseId']) {
        this.courseId.set(params['courseId']);
      }
    });

    // Handle quiz ID param
    this.route.params.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.quizId.set(params['id']);
        this.loadQuiz(params['id']);
      } else {
        this.addQuestion(); // Start with one empty question
      }
    });
  }

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

    this.quizService.getQuizWithQuestions(id).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
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

// import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { switchMap, finalize, catchError } from 'rxjs/operators';
// import { Observable, of } from 'rxjs';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { TextareaModule } from 'primeng/textarea';
// import { CheckboxModule } from 'primeng/checkbox';
// import { SelectModule } from 'primeng/select';
// import { RadioButtonModule } from 'primeng/radiobutton';
// import { ToastModule } from 'primeng/toast';
// import { TooltipModule } from 'primeng/tooltip';
// import { CardModule } from 'primeng/card';
// import { MessageService } from 'primeng/api';

// // Services
// import { QuizService } from '../../../../core/services/quiz.service';

// // Types
// interface QuestionType {
//   label: string;
//   value: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
//   icon: string;
//   color: 'primary' | 'info' | 'success' | 'warning';
// }

// interface QuizData {
//   quiz: any;
//   questions: any[];
// }

// @Component({
//   selector: 'app-quiz-builder',
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
//     RadioButtonModule,
//     ToastModule,
//     TooltipModule,
//     CardModule
//   ],
//   providers: [MessageService],
//   templateUrl: './quiz-builder.component.html',
//   styleUrls: ['./quiz-builder.component.scss']
// })
// export class QuizBuilderComponent implements OnInit {
//   // Dependencies
//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private messageService = inject(MessageService);
//   private quizService = inject(QuizService);
//   private destroyRef = inject(DestroyRef);

//   // State signals
//   readonly quizId = signal<string | null>(null);
//   readonly courseId = signal<string | null>(null);
//   readonly isLoading = signal<boolean>(false);
//   readonly isSaving = signal<boolean>(false);

//   // Constants
//   readonly questionTypes: QuestionType[] = [
//     { label: 'Multiple Choice', value: 'multiple-choice', icon: 'pi pi-list', color: 'primary' },
//     { label: 'True / False', value: 'true-false', icon: 'pi pi-check-circle', color: 'info' },
//     { label: 'Short Answer', value: 'short-answer', icon: 'pi pi-window-minimize', color: 'success' },
//     { label: 'Essay', value: 'essay', icon: 'pi pi-align-left', color: 'warning' }
//   ];

//   readonly minOptions = 2;
//   readonly maxOptions = 6;
//   readonly maxQuestions = 50;

//   // Form
//   quizForm!: FormGroup;

//   // Lifecycle
//   ngOnInit(): void {
//     this.initializeForm();
//     this.setupRouteSubscriptions();
//   }

//   // ==========================================================================
//   // INITIALIZATION
//   // ==========================================================================

//   private initializeForm(): void {
//     this.quizForm = this.fb.group({
//       title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
//       description: ['', Validators.maxLength(1000)],
//       timeLimit: [30, [Validators.required, Validators.min(0), Validators.max(480)]],
//       passingScore: [70, [Validators.required, Validators.min(1), Validators.max(100)]],
//       maxAttempts: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
//       questions: this.fb.array([])
//     });
//   }

//   private setupRouteSubscriptions(): void {
//     // Get course ID from query params
//     this.route.queryParams.pipe(
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe(params => {
//       if (params['courseId']) {
//         this.courseId.set(params['courseId']);
//       }
//     });

//     // Handle quiz ID param
//     this.route.params.pipe(
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe(params => {
//       if (params['id'] && params['id'] !== 'new') {
//         this.quizId.set(params['id']);
//         this.loadQuiz(params['id']);
//       } else {
//         this.addQuestion(); // Start with one empty question
//       }
//     });
//   }

//   // ==========================================================================
//   // FORM ACCESSORS
//   // ==========================================================================

//   get questions(): FormArray {
//     return this.quizForm.get('questions') as FormArray;
//   }

//   getOptions(questionIndex: number): FormArray {
//     return this.questions.at(questionIndex).get('options') as FormArray;
//   }

//   // ==========================================================================
//   // FORM VALIDATION
//   // ==========================================================================

//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.quizForm.get(fieldName);
//     return !!(field && field.invalid && (field.dirty || field.touched));
//   }

//   private validateOptions(options: FormArray): ValidationErrors | null {
//     const hasCorrect = options.controls.some(
//       control => control.get('isCorrect')?.value === true
//     );
//     return hasCorrect ? null : { noCorrectOption: true };
//   }

//   // ==========================================================================
//   // QUESTION MANAGEMENT
//   // ==========================================================================

//   private createQuestionGroup(): FormGroup {
//     const optionsArray = this.fb.array([
//       this.createOptionGroup(),
//       this.createOptionGroup()
//     ]);

//     optionsArray.setValidators(this.validateOptions.bind(this));

//     return this.fb.group({
//       question: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1000)]],
//       type: ['multiple-choice', Validators.required],
//       points: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
//       explanation: ['', Validators.maxLength(1000)],
//       correctAnswer: [''],
//       options: optionsArray
//     });
//   }

//   private createOptionGroup(): FormGroup {
//     return this.fb.group({
//       text: ['', [Validators.required, Validators.maxLength(500)]],
//       isCorrect: [false]
//     });
//   }

//   addQuestion(): void {
//     if (this.questions.length >= this.maxQuestions) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Limit Reached',
//         detail: `Maximum ${this.maxQuestions} questions allowed`
//       });
//       return;
//     }

//     this.questions.push(this.createQuestionGroup());
//   }

//   removeQuestion(index: number): void {
//     if (this.questions.length <= 1) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Cannot Remove',
//         detail: 'Quiz must have at least one question'
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
    
//     if (options.length >= this.maxOptions) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Limit Reached',
//         detail: `Maximum ${this.maxOptions} options allowed`
//       });
//       return;
//     }

//     options.push(this.createOptionGroup());
//   }

//   removeOption(questionIndex: number, optionIndex: number): void {
//     const options = this.getOptions(questionIndex);
    
//     if (options.length <= this.minOptions) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Cannot Remove',
//         detail: `Minimum ${this.minOptions} options required`
//       });
//       return;
//     }

//     options.removeAt(optionIndex);
//   }

//   onCorrectAnswerChange(questionIndex: number, optionIndex: number, isChecked: boolean): void {
//     if (!isChecked) return;

//     const options = this.getOptions(questionIndex);
//     options.controls.forEach((control, idx) => {
//       if (idx !== optionIndex) {
//         control.get('isCorrect')?.setValue(false, { emitEvent: false });
//       }
//     });
//   }

//   // ==========================================================================
//   // TYPE HANDLING
//   // ==========================================================================

//   onQuestionTypeChange(questionIndex: number, newType: string): void {
//     const question = this.questions.at(questionIndex);
    
//     // Reset type-specific fields
//     if (newType === 'true-false') {
//       question.get('correctAnswer')?.setValue('true');
//     } else {
//       question.get('correctAnswer')?.setValue('');
//     }

//     // Clear options for non-multiple-choice types if needed
//     if (newType !== 'multiple-choice') {
//       // Keep options but they won't be used
//     }
//   }

//   getTypeColor(type: string): string {
//     const questionType = this.questionTypes.find(t => t.value === type);
//     return `var(--color-${questionType?.color || 'primary'})`;
//   }

//   // ==========================================================================
//   // DATA LOADING
//   // ==========================================================================

//   private loadQuiz(id: string): void {
//     this.isLoading.set(true);

//     this.quizService.getQuizWithQuestions(id).pipe(
//       finalize(() => this.isLoading.set(false)),
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe({
//       next: (res: any) => {
//         const { quiz, questions } = res.data as QuizData;
//         this.populateForm(quiz, questions);
//       },
//       error: (error) => {
//         console.error('Failed to load quiz:', error);
//         this.messageService.add({
//           severity: 'error',
//           summary: 'Error',
//           detail: 'Failed to load quiz data. Please try again.'
//         });
//       }
//     });
//   }

//   private populateForm(quiz: any, questions: any[]): void {
//     // Set course ID from quiz
//     this.courseId.set(quiz.course?._id || quiz.course);

//     // Patch basic info
//     this.quizForm.patchValue({
//       title: quiz.title,
//       description: quiz.description || '',
//       timeLimit: quiz.timeLimit,
//       passingScore: quiz.passingScore,
//       maxAttempts: quiz.maxAttempts
//     });

//     // Clear and populate questions
//     this.questions.clear();
    
//     if (questions?.length) {
//       questions.forEach(q => this.addExistingQuestion(q));
//     } else {
//       this.addQuestion();
//     }
//   }

//   private addExistingQuestion(question: any): void {
//     const questionGroup = this.createQuestionGroup();
    
//     questionGroup.patchValue({
//       question: question.question,
//       type: question.type,
//       points: question.points,
//       explanation: question.explanation || '',
//       correctAnswer: question.correctAnswer || ''
//     });

//     // Handle options for multiple choice
//     if (question.type === 'multiple-choice' && question.options?.length) {
//       const optionsArray = questionGroup.get('options') as FormArray;
//       optionsArray.clear();
      
//       question.options.forEach((opt: any) => {
//         optionsArray.push(this.fb.group({
//           text: [opt.text, Validators.required],
//           isCorrect: [opt.isCorrect || false]
//         }));
//       });
//     }

//     this.questions.push(questionGroup);
//   }

//   // ==========================================================================
//   // SAVE OPERATIONS
//   // ==========================================================================

//   saveQuiz(): void {
//     if (!this.validateQuiz()) {
//       return;
//     }

//     this.isSaving.set(true);
//     const rawData = this.quizForm.getRawValue();

//     const saveOperation = this.quizId()
//       ? this.updateQuiz(rawData)
//       : this.createQuiz(rawData);

//     saveOperation.pipe(
//       finalize(() => this.isSaving.set(false)),
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe({
//       next: () => {
//         this.messageService.add({
//           severity: 'success',
//           summary: 'Success',
//           detail: `Quiz ${this.quizId() ? 'updated' : 'created'} successfully!`
//         });

//         setTimeout(() => {
//           this.router.navigate(['/instructor/courses']);
//         }, 1500);
//       },
//       error: (error) => {
//         console.error('Failed to save quiz:', error);
//         this.messageService.add({
//           severity: 'error',
//           summary: 'Error',
//           detail: error.error?.message || `Failed to ${this.quizId() ? 'update' : 'create'} quiz.`
//         });
//       }
//     });
//   }

//   private validateQuiz(): boolean {
//     // Check course ID
//     if (!this.courseId()) {
//       this.messageService.add({
//         severity: 'error',
//         summary: 'Missing Course',
//         detail: 'This quiz must be attached to a course.'
//       });
//       return false;
//     }

//     // Check form validity
//     if (this.quizForm.invalid) {
//       this.quizForm.markAllAsTouched();
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Incomplete Form',
//         detail: 'Please fill out all required fields correctly.'
//       });
//       return false;
//     }

//     const rawData = this.quizForm.getRawValue();

//     // Validate each question based on type
//     for (let i = 0; i < rawData.questions.length; i++) {
//       const q = rawData.questions[i];

//       if (q.type === 'multiple-choice') {
//         const hasCorrect = q.options.some((opt: any) => opt.isCorrect);
//         if (!hasCorrect) {
//           this.messageService.add({
//             severity: 'error',
//             summary: 'Validation Error',
//             detail: `Question ${i + 1} must have a correct option selected.`
//           });
//           return false;
//         }
//       } else if (q.type === 'true-false' || q.type === 'short-answer') {
//         if (!q.correctAnswer || q.correctAnswer.trim() === '') {
//           this.messageService.add({
//             severity: 'error',
//             summary: 'Validation Error',
//             detail: `Question ${i + 1} requires a correct answer.`
//           });
//           return false;
//         }
//       }
//     }

//     return true;
//   }

//   private createQuiz(rawData: any): Observable<any> {
//     const basePayload = {
//       title: rawData.title,
//       description: rawData.description,
//       timeLimit: rawData.timeLimit,
//       passingScore: rawData.passingScore,
//       maxAttempts: rawData.maxAttempts,
//       course: this.courseId()
//     };

//     return this.quizService.createQuiz(basePayload).pipe(
//       switchMap((res: any) => {
//         const newQuizId = res.data.quiz._id;
//         this.quizId.set(newQuizId);
//         return this.quizService.addQuestions(newQuizId, rawData.questions);
//       })
//     );
//   }

//   private updateQuiz(rawData: any): Observable<any> {
//     const basePayload = {
//       title: rawData.title,
//       description: rawData.description,
//       timeLimit: rawData.timeLimit,
//       passingScore: rawData.passingScore,
//       maxAttempts: rawData.maxAttempts
//     };

//     return this.quizService.updateQuiz(this.quizId()!, basePayload);
//   }

//   // ==========================================================================
//   // UTILITIES
//   // ==========================================================================

//   copyQuizId(): void {
//     if (this.quizId()) {
//       navigator.clipboard.writeText(this.quizId()!);
//       this.messageService.add({
//         severity: 'info',
//         summary: 'Copied',
//         detail: 'Quiz ID copied to clipboard!'
//       });
//     }
//   }
// }
// // import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
// // import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
// // import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// // import { switchMap } from 'rxjs/operators';
// // import { Observable, of } from 'rxjs';

// // // PrimeNG
// // import { ButtonModule } from 'primeng/button';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { TextareaModule } from 'primeng/textarea';
// // import { CheckboxModule } from 'primeng/checkbox';
// // import { SelectModule } from 'primeng/select';
// // import { RadioButtonModule } from 'primeng/radiobutton';
// // import { ToastModule } from 'primeng/toast';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { MessageService } from 'primeng/api';

// // import { QuizService } from '../../../../core/services/quiz.service';

// // @Component({
// //   selector: 'app-quiz-builder',
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
// //     RadioButtonModule,
// //     ToastModule,
// //     TooltipModule
// //   ],
// //   providers: [MessageService],
// //   templateUrl: './quiz-builder.component.html',
// //   styleUrls: ['./quiz-builder.component.scss']
// // })
// // export class QuizBuilderComponent implements OnInit {
// //   private fb = inject(FormBuilder);
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);
// //   private messageService = inject(MessageService);
// //   private quizService = inject(QuizService);
// //   private destroyRef = inject(DestroyRef);

// //   // State
// //   quizId = signal<string | null>(null);
// //   courseId = signal<string | null>(null);
// //   isLoading = signal<boolean>(false);
// //   isSaving = signal<boolean>(false);

// //   // Question Types Definition
// //   questionTypes = [
// //     { label: 'Multiple Choice', value: 'multiple-choice', icon: 'pi pi-list' },
// //     { label: 'True / False', value: 'true-false', icon: 'pi pi-check-circle' },
// //     { label: 'Short Answer', value: 'short-answer', icon: 'pi pi-window-minimize' },
// //     { label: 'Essay', value: 'essay', icon: 'pi pi-align-left' }
// //   ];

// //   quizForm: FormGroup = this.fb.group({
// //     title: ['', Validators.required],
// //     description: [''],
// //     timeLimit: [30, [Validators.required, Validators.min(0)]],
// //     passingScore: [70, [Validators.required, Validators.min(1), Validators.max(100)]],
// //     maxAttempts: [3, [Validators.required, Validators.min(1)]],
// //     questions: this.fb.array([])
// //   });

// //   ngOnInit(): void {
// //     // 1. Check for course connection
// //     this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
// //       if (params['courseId']) this.courseId.set(params['courseId']);
// //     });

// //     // 2. Check for edit vs create mode
// //     this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
// //       if (params['id'] && params['id'] !== 'new') {
// //         this.quizId.set(params['id']);
// //         this.loadQuiz(params['id']);
// //       } else {
// //         this.addQuestion(); // Start with one empty question
// //       }
// //     });
// //   }

// //   // --- Form Array Getters ---
// //   get questions(): FormArray { return this.quizForm.get('questions') as FormArray; }
// //   getOptions(questionIndex: number): FormArray { return this.questions.at(questionIndex).get('options') as FormArray; }

// //   // --- Form Creators ---
// //   private createQuestionGroup(): FormGroup {
// //     return this.fb.group({
// //       question: ['', Validators.required],
// //       type: ['multiple-choice', Validators.required],
// //       points: [10, Validators.required],
// //       explanation: [''],
// //       correctAnswer: [''], 
// //       options: this.fb.array([
// //         this.createOptionGroup(),
// //         this.createOptionGroup()
// //       ])
// //     });
// //   }

// //   private createOptionGroup(): FormGroup {
// //     return this.fb.group({ text: ['', Validators.required], isCorrect: [false] });
// //   }

// //   // --- Mutators ---
// //   addQuestion(): void { this.questions.push(this.createQuestionGroup()); }
// //   removeQuestion(index: number): void { this.questions.removeAt(index); }
// //   addOption(questionIndex: number): void { this.getOptions(questionIndex).push(this.createOptionGroup()); }
// //   removeOption(questionIndex: number, optionIndex: number): void { this.getOptions(questionIndex).removeAt(optionIndex); }

// //   onQuestionTypeChange(index: number, newType: string): void {
// //     const qGroup = this.questions.at(index) as FormGroup;
    
// //     if (newType === 'true-false') {
// //       qGroup.get('correctAnswer')?.setValue('true');
// //     } else {
// //       qGroup.get('correctAnswer')?.setValue('');
// //     }
// //   }

// //   onCorrectAnswerChange(questionIndex: number, optionIndex: number, isChecked: boolean): void {
// //     if (isChecked) {
// //       const optionsArray = this.getOptions(questionIndex);
// //       optionsArray.controls.forEach((control, idx) => {
// //         if (idx !== optionIndex) control.get('isCorrect')?.setValue(false, { emitEvent: false });
// //       });
// //     }
// //   }

// //   // --- API Integrations ---
// //   private loadQuiz(id: string): void {
// //     this.isLoading.set(true);
// //     this.quizService.getQuizWithQuestions(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
// //       next: (res: any) => {
// //         const { quiz, questions } = res.data;
// //         this.courseId.set(quiz.course?._id || quiz.course);

// //         this.quizForm.patchValue({
// //           title: quiz.title, 
// //           description: quiz.description, 
// //           timeLimit: quiz.timeLimit,
// //           passingScore: quiz.passingScore, 
// //           maxAttempts: quiz.maxAttempts
// //         });

// //         this.questions.clear();
// //         questions.forEach((q: any) => {
// //           const qGroup = this.createQuestionGroup();
          
// //           qGroup.patchValue({
// //             question: q.question, 
// //             type: q.type, 
// //             points: q.points,
// //             explanation: q.explanation, 
// //             correctAnswer: q.correctAnswer
// //           });

// //           if (q.type === 'multiple-choice' && q.options && q.options.length > 0) {
// //             const optArray = qGroup.get('options') as FormArray;
// //             optArray.clear();
// //             q.options.forEach((opt: any) => {
// //               const optGroup = this.createOptionGroup();
// //               optGroup.patchValue({ text: opt.text, isCorrect: opt.isCorrect });
// //               optArray.push(optGroup);
// //             });
// //           }
// //           this.questions.push(qGroup);
// //         });
        
// //         this.isLoading.set(false);
// //       },
// //       error: () => {
// //         this.isLoading.set(false);
// //         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load quiz data.' });
// //       }
// //     });
// //   }

// //   saveQuiz(): void {
// //     if (!this.courseId()) {
// //       this.messageService.add({ severity: 'error', summary: 'Missing Course', detail: 'This quiz is not attached to a course.' });
// //       return;
// //     }
    
// //     if (this.quizForm.invalid) {
// //       this.quizForm.markAllAsTouched();
// //       this.messageService.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please fill out all required fields.' });
// //       return;
// //     }

// //     const rawData = this.quizForm.getRawValue();

// //     for (let i = 0; i < rawData.questions.length; i++) {
// //       const q = rawData.questions[i];
// //       if (q.type === 'multiple-choice') {
// //         const hasCorrect = q.options.some((opt: any) => opt.isCorrect);
// //         if (!hasCorrect) {
// //           this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: `Question ${i + 1} must have a correct option selected.` });
// //           return;
// //         }
// //       } else if (q.type === 'true-false' || q.type === 'short-answer') {
// //         if (!q.correctAnswer || q.correctAnswer.trim() === '') {
// //           this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: `Question ${i + 1} requires a correct answer.` });
// //           return;
// //         }
// //       }
// //     }

// //     this.isSaving.set(true);

// //     const baseQuizPayload = {
// //       title: rawData.title, 
// //       description: rawData.description, 
// //       timeLimit: rawData.timeLimit,
// //       passingScore: rawData.passingScore, 
// //       maxAttempts: rawData.maxAttempts, 
// //       course: this.courseId()
// //     };

// //     const request$: Observable<any> = this.quizId()
// //       ? this.quizService.updateQuiz(this.quizId()!, baseQuizPayload).pipe(
// //         switchMap(() => of({ data: { message: 'Updated' } }))
// //       )
// //       : this.quizService.createQuiz(baseQuizPayload).pipe(
// //         switchMap((res: any) => {
// //           const newQuizId = res.data.quiz._id;
// //           this.quizId.set(newQuizId);
// //           return this.quizService.addQuestions(newQuizId, rawData.questions);
// //         })
// //       );

// //     request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
// //       next: () => {
// //         this.isSaving.set(false);
// //         this.messageService.add({ severity: 'success', summary: 'Saved!', detail: 'Quiz has been successfully published.' });
// //       },
// //       error: (err: any) => {
// //         this.isSaving.set(false);
// //         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save quiz.' });
// //       }
// //     });
// //   }

// //   copyQuizId(): void {
// //     if (this.quizId()) {
// //       navigator.clipboard.writeText(this.quizId()!);
// //       this.messageService.add({ severity: 'info', summary: 'Copied', detail: 'Quiz ID copied to clipboard!' });
// //     }
// //   }
// // }