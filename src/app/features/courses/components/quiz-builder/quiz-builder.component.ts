import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { switchMap, finalize, catchError } from 'rxjs/operators';
import { Observable, combineLatest } from 'rxjs';

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
import { MasterApiService } from '../../../../core/services/master-list.service';

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
    CommonModule, ReactiveFormsModule, RouterModule, ButtonModule,
    InputTextModule, InputNumberModule, TextareaModule, CheckboxModule,
    SelectModule, RadioButtonModule, ToastModule, TooltipModule, CardModule
  ],
  providers: [MessageService],
  templateUrl: './quiz-builder.component.html',
  styleUrls: ['./quiz-builder.component.scss']
})
export class QuizBuilderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private quizService = inject(QuizService);
  private masterApi = inject(MasterApiService);
  private destroyRef = inject(DestroyRef);

  readonly quizId = signal<string | null>(null);
  readonly courseId = signal<string | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);

  // Store fetched courses for the dropdown
  readonly courseOptions = signal<any[]>([]);

  readonly questionTypes: QuestionType[] = [
    { label: 'Multiple Choice', value: 'multiple-choice', icon: 'pi pi-list', color: 'primary' },
    { label: 'True / False', value: 'true-false', icon: 'pi pi-check-circle', color: 'info' },
    { label: 'Short Answer', value: 'short-answer', icon: 'pi pi-window-minimize', color: 'success' },
    { label: 'Essay', value: 'essay', icon: 'pi pi-align-left', color: 'warning' }
  ];

  readonly minOptions = 2;
  readonly maxOptions = 6;
  readonly maxQuestions = 50;

  quizForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
    this.loadCourseOptions(); // Fetch the dropdown list first
    this.setupRouteSubscriptions();
  }

  private initializeForm(): void {
    this.quizForm = this.fb.group({
      // ✅ Added courseId control for the dropdown
      courseId: [{ value: null, disabled: false }, Validators.required],
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', Validators.maxLength(1000)],
      timeLimit: [30, [Validators.required, Validators.min(0), Validators.max(480)]],
      passingScore: [70, [Validators.required, Validators.min(1), Validators.max(100)]],
      maxAttempts: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
      questions: this.fb.array([])
    });
  }

  private loadCourseOptions(): void {
    this.masterApi.courseDropdown().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const courses = Array.isArray(res.data) ? res.data : []
        this.courseOptions.set(courses);
      },
      error: (err) => console.error('Failed to load courses', err)
    });
  }

  private setupRouteSubscriptions(): void {
    combineLatest([this.route.params, this.route.queryParams]).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([params, queryParams]) => {

      const urlCourseId = params['courseId'] || queryParams['courseId'];

      if (urlCourseId && urlCourseId !== 'undefined' && urlCourseId !== 'null') {
        this.courseId.set(urlCourseId);
        this.quizForm.get('courseId')?.setValue(urlCourseId);
        this.quizForm.get('courseId')?.disable();
      }

      if (params['id'] && params['id'] !== 'new') {
        this.quizId.set(params['id']);
        this.loadQuiz(params['id']);
      } else if (params['id'] === 'new') {
        if (this.questions.length === 0) {
          this.addQuestion();
        }
      }
    });
  }

  // ✅ New Feature: Start Fresh without reloading the page
  startFresh(): void {
    this.quizId.set(null);
    this.courseId.set(null);

    this.quizForm.reset({
      timeLimit: 30,
      passingScore: 70,
      maxAttempts: 3
    });

    // Re-enable the course dropdown so they can pick a different one
    this.quizForm.get('courseId')?.enable();

    this.questions.clear();
    this.addQuestion();

    this.messageService.add({
      severity: 'info',
      summary: 'Started Fresh',
      detail: 'You are now creating a new quiz.'
    });
  }

  get questions(): FormArray { return this.quizForm.get('questions') as FormArray; }
  getOptions(questionIndex: number): FormArray { return this.questions.at(questionIndex).get('options') as FormArray; }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.quizForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private validateOptions(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!(control instanceof FormArray)) return null;
      const formArray = control as FormArray;
      const hasCorrect = formArray.controls.some((opt: AbstractControl) => opt.get('isCorrect')?.value === true);
      return hasCorrect ? null : { noCorrectOption: true };
    };
  }

  private createQuestionGroup(): FormGroup {
    const optionsArray = this.fb.array([this.createOptionGroup(), this.createOptionGroup()]);
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
    if (this.questions.length >= this.maxQuestions) return;
    this.questions.push(this.createQuestionGroup());
  }

  removeQuestion(index: number): void {
    if (this.questions.length <= 1) return;
    this.questions.removeAt(index);
  }

  addOption(questionIndex: number): void {
    const options = this.getOptions(questionIndex);
    if (options.length >= this.maxOptions) return;
    options.push(this.createOptionGroup());
    options.updateValueAndValidity();
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.getOptions(questionIndex);
    if (options.length <= this.minOptions) return;
    options.removeAt(optionIndex);
    options.updateValueAndValidity();
  }

  onCorrectAnswerChange(questionIndex: number, optionIndex: number, isChecked: boolean): void {
    if (!isChecked) return;
    const options = this.getOptions(questionIndex);
    options.controls.forEach((control: AbstractControl, idx: number) => {
      if (idx !== optionIndex) control.get('isCorrect')?.setValue(false, { emitEvent: false });
    });
    options.updateValueAndValidity();
  }

  onQuestionTypeChange(questionIndex: number, newType: string): void {
    const question = this.questions.at(questionIndex);
    if (newType === 'true-false') question.get('correctAnswer')?.setValue('true');
    else question.get('correctAnswer')?.setValue('');

    const optionsArray = question.get('options') as FormArray;
    if (newType === 'multiple-choice') optionsArray.setValidators(this.validateOptions());
    else optionsArray.clearValidators();

    optionsArray.updateValueAndValidity();
  }

  getTypeColor(type: string): string {
    const questionType = this.questionTypes.find(t => t.value === type);
    return `var(--color-${questionType?.color || 'primary'})`;
  }

  private loadQuiz(id: string): void {
    this.isLoading.set(true);
    this.quizService.getQuizWithQuestions(id).pipe(finalize(() => this.isLoading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const { quiz, questions } = res.data as QuizData;
        this.populateForm(quiz, questions);
      },
      error: (error) => console.error('Failed to load quiz:', error)
    });
  }

  private populateForm(quiz: any, questions: any[]): void {
    const cId = quiz.course?._id || quiz.course;
    this.courseId.set(cId);

    this.quizForm.patchValue({
      courseId: cId,
      title: quiz.title,
      description: quiz.description || '',
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts
    });

    // Lock course dropdown if editing an existing quiz
    this.quizForm.get('courseId')?.disable();

    this.questions.clear();
    if (questions?.length) questions.forEach(q => this.addExistingQuestion(q));
    else this.addQuestion();
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

    if (question.type === 'multiple-choice' && question.options?.length) {
      const optionsArray = questionGroup.get('options') as FormArray;
      optionsArray.clear();
      question.options.forEach((opt: any) => {
        optionsArray.push(this.fb.group({ text: [opt.text, Validators.required], isCorrect: [opt.isCorrect || false] }));
      });
      optionsArray.setValidators(this.validateOptions());
      optionsArray.updateValueAndValidity();
    }
    this.questions.push(questionGroup);
  }

  saveQuiz(): void {
    if (!this.validateQuiz()) return;

    this.isSaving.set(true);
    // ✅ getRawValue() ensures we also get the value of courseId even if the dropdown is disabled
    const rawData = this.quizForm.getRawValue();

    const saveOperation = this.quizId() ? this.updateQuiz(rawData) : this.createQuiz(rawData);

    saveOperation.pipe(finalize(() => this.isSaving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: `Quiz ${this.quizId() ? 'updated' : 'created'} successfully!` });
        setTimeout(() => this.router.navigate(['/instructor/courses']), 1500);
      },
      error: (error) => this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || `Failed to save quiz.` })
    });
  }

  private validateQuiz(): boolean {
    if (this.quizForm.invalid) {
      this.quizForm.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Incomplete Form', detail: 'Please fill out all required fields.' });
      return false;
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
      questions: rawData.questions ,
      course: rawData.courseId
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
      maxAttempts: rawData.maxAttempts,
      course: rawData.courseId,
      questions: rawData.questions // ✅ Added questions back to the first payload
    };
    return this.quizService.updateQuiz(this.quizId()!, basePayload);
  }

  copyQuizId(): void {
    if (this.quizId()) {
      navigator.clipboard.writeText(this.quizId()!);
      this.messageService.add({ severity: 'info', summary: 'Copied', detail: 'Quiz ID copied to clipboard!' });
    }
  }
}