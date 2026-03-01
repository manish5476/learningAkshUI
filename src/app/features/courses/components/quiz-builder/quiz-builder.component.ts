import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton'; // <-- ADDED
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { QuizService } from '../../../../core/services/quiz.service';

// Services

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
    SelectModule,      // <-- ADDED
    RadioButtonModule, // <-- ADDED
    ToastModule
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
  private destroyRef = inject(DestroyRef);

  // State
  quizId = signal<string | null>(null);
  courseId = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Available Question Types mapping to backend enum
  questionTypes = [
    { label: 'Multiple Choice', value: 'multiple-choice', icon: 'pi pi-list' },
    { label: 'True / False', value: 'true-false', icon: 'pi pi-check-circle' },
    { label: 'Short Answer', value: 'short-answer', icon: 'pi pi-window-minimize' },
    { label: 'Essay', value: 'essay', icon: 'pi pi-align-left' }
  ];

  quizForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    timeLimit: [30, [Validators.required, Validators.min(0)]],
    passingScore: [70, [Validators.required, Validators.min(1), Validators.max(100)]],
    maxAttempts: [3, [Validators.required, Validators.min(1)]],
    questions: this.fb.array([])
  });

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['courseId']) this.courseId.set(params['courseId']);
    });

    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.quizId.set(params['id']);
        this.loadQuiz(params['id']);
      } else {
        this.addQuestion();
      }
    });
  }

  // --- Form Array Getters ---
  get questions(): FormArray { return this.quizForm.get('questions') as FormArray; }
  getOptions(questionIndex: number): FormArray { return this.questions.at(questionIndex).get('options') as FormArray; }

  // --- Form Creators ---
  private createQuestionGroup(): FormGroup {
    return this.fb.group({
      question: ['', Validators.required],
      type: ['multiple-choice', Validators.required], // Added Type
      points: [10, Validators.required],
      explanation: [''],
      correctAnswer: [''], // Used for True/False, Short Answer, and Essay
      options: this.fb.array([
        this.createOptionGroup(),
        this.createOptionGroup()
      ])
    });
  }

  private createOptionGroup(): FormGroup {
    return this.fb.group({ text: ['', Validators.required], isCorrect: [false] });
  }

  // --- Mutators ---
  addQuestion(): void { this.questions.push(this.createQuestionGroup()); }
  removeQuestion(index: number): void { this.questions.removeAt(index); }
  addOption(questionIndex: number): void { this.getOptions(questionIndex).push(this.createOptionGroup()); }
  removeOption(questionIndex: number, optionIndex: number): void { this.getOptions(questionIndex).removeAt(optionIndex); }

  onQuestionTypeChange(index: number, newType: string): void {
    const qGroup = this.questions.at(index) as FormGroup;
    // Set default values when switching types to avoid bugs
    if (newType === 'true-false') {
      qGroup.get('correctAnswer')?.setValue('true');
    } else if (newType === 'short-answer' || newType === 'essay') {
      qGroup.get('correctAnswer')?.setValue('');
    }
  }

  onCorrectAnswerChange(questionIndex: number, optionIndex: number, isChecked: boolean): void {
    if (isChecked) {
      const optionsArray = this.getOptions(questionIndex);
      optionsArray.controls.forEach((control, idx) => {
        if (idx !== optionIndex) control.get('isCorrect')?.setValue(false, { emitEvent: false });
      });
    }
  }

  // --- API Integrations ---
  private loadQuiz(id: string): void {
    this.isLoading.set(true);
    this.quizService.getQuizWithQuestions(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const { quiz, questions } = res.data;
        this.courseId.set(quiz.course?._id || quiz.course);

        this.quizForm.patchValue({
          title: quiz.title, description: quiz.description, timeLimit: quiz.timeLimit,
          passingScore: quiz.passingScore, maxAttempts: quiz.maxAttempts
        });

        this.questions.clear();
        questions.forEach((q: any) => {
          const qGroup = this.createQuestionGroup();
          qGroup.patchValue({
            question: q.question, type: q.type, points: q.points,
            explanation: q.explanation, correctAnswer: q.correctAnswer
          });

          if (q.type === 'multiple-choice' && q.options) {
            const optArray = qGroup.get('options') as FormArray;
            optArray.clear();
            q.options.forEach((opt: any) => {
              const optGroup = this.createOptionGroup();
              optGroup.patchValue({ text: opt.text, isCorrect: opt.isCorrect });
              optArray.push(optGroup);
            });
          }
          this.questions.push(qGroup);
        });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  saveQuiz(): void {
    if (!this.courseId()) {
      this.messageService.add({ severity: 'error', summary: 'Missing Course', detail: 'This quiz is not attached to a course.' });
      return;
    }
    if (this.quizForm.invalid) {
      this.quizForm.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please fill out all required fields.' });
      return;
    }

    const rawData = this.quizForm.getRawValue();

    // DYNAMIC VALIDATION based on Question Type
    for (let i = 0; i < rawData.questions.length; i++) {
      const q = rawData.questions[i];
      if (q.type === 'multiple-choice') {
        const hasCorrect = q.options.some((opt: any) => opt.isCorrect);
        if (!hasCorrect) {
          this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: `Question ${i + 1} (Multiple Choice) must have a correct option selected.` });
          return;
        }
      } else if (q.type === 'true-false' || q.type === 'short-answer') {
        if (!q.correctAnswer || q.correctAnswer.trim() === '') {
          this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: `Question ${i + 1} requires a correct answer to be provided.` });
          return;
        }
      }
    }

    this.isSaving.set(true);

    const baseQuizPayload = {
      title: rawData.title, description: rawData.description, timeLimit: rawData.timeLimit,
      passingScore: rawData.passingScore, maxAttempts: rawData.maxAttempts, course: this.courseId()
    };

    const request$: Observable<any> = this.quizId()
      ? this.quizService.updateQuiz(this.quizId()!, baseQuizPayload).pipe(
        switchMap(() => of({ data: { message: 'Updated' } }))
      )
      : this.quizService.createQuiz(baseQuizPayload).pipe(
        switchMap((res: any) => {
          const newQuizId = res.data.quiz._id;
          this.quizId.set(newQuizId);
          return this.quizService.addQuestions(newQuizId, rawData.questions);
        })
      );

    // const request$ = this.quizId() 
    //   ? this.quizService.updateQuiz(this.quizId()!, baseQuizPayload).pipe(switchMap(() => of({ data: { message: 'Updated' } })))
    //   : this.quizService.createQuiz(baseQuizPayload).pipe(switchMap((res: any) => {
    //       const newQuizId = res.data.quiz._id;
    //       this.quizId.set(newQuizId);
    //       return this.quizService.addQuestions(newQuizId, rawData.questions);
    //     }));

    request$.pipe(takeUntilDestroyed()).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.messageService.add({ severity: 'success', summary: 'Saved!', detail: 'Quiz has been successfully saved.' });
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save quiz.' });
      }
    });
  }

  copyQuizId(): void {
    if (this.quizId()) {
      navigator.clipboard.writeText(this.quizId()!);
      this.messageService.add({ severity: 'info', summary: 'Copied', detail: 'Quiz ID copied!' });
    }
  }
}
