import { Component, OnInit, inject, DestroyRef, signal, input, output, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';

// Services
import { QuizService } from '../../../core/services/quiz.service';

@Component({
  selector: 'app-lesson-quiz-taker',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule, 
    RadioButtonModule, 
    InputTextModule, 
    TextareaModule
  ],
  templateUrl: './lesson-quiz-taker.component.html',
  styleUrls: ['./lesson-quiz-taker.component.scss']
})
export class LessonQuizTakerComponent implements OnInit {
  // Inputs from CoursePlayerComponent
  quizId = input.required<string>();
  
  // Emits when the student submits the quiz so the player can update the sidebar checkmarks
  quizCompleted = output<{ score: number, passed: boolean }>();

  private quizService = inject(QuizService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // State Signals
  quizState = signal<'intro' | 'taking' | 'results'>('intro');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  quizData = signal<any>(null);
  questions = signal<any[]>([]);
  resultsData = signal<any>(null);

  // Use standard object for ngModel binding to avoid Signal mutation errors in loops
  studentAnswers: { [questionId: string]: any } = {};

  constructor() {
    effect(() => {
      const id = this.quizId();
      if (id) {
        this.loadQuizData(id);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {}

  private loadQuizData(id: string): void {
    this.isLoading.set(true);
    this.quizService.getQuizWithQuestions(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.quizData.set(res.data?.quiz);
          this.questions.set(res.data?.questions || []);
          this.quizState.set('intro');
          this.isLoading.set(false);
        },
        error: (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load quiz.' });
          this.isLoading.set(false);
        }
      });
  }

  startQuiz(): void {
    this.studentAnswers = {}; // Reset answers
    this.quizState.set('taking');
  }

  submitQuiz(): void {
    const qList = this.questions();
    
    // Validate all questions are answered
    const answeredCount = Object.keys(this.studentAnswers).length;
    if (answeredCount < qList.length) {
      this.messageService.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please answer all questions before submitting.' });
      return;
    }

    this.isSubmitting.set(true);
    
    // Format payload perfectly for your Node.js backend
    const formattedAnswers = qList.map(q => {
      const val = this.studentAnswers[q._id];
      const answerPayload: any = { questionId: q._id };

      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        answerPayload.selectedOption = val; // Backend expects numeric index or boolean
      } else {
        answerPayload.answerText = val; // Backend expects string for short-answer/essay
      }
      return answerPayload;
    });

    this.quizService.submitQuiz(this.quizId(), formattedAnswers)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.isSubmitting.set(false);
          const result = res.data; // { score, totalPoints, percentage, passed, results }
          this.resultsData.set(result);
          this.quizState.set('results');

          if (result.passed) {
            this.quizCompleted.emit({ score: result.score, passed: true });
          }
        },
        error: (err: any) => {
          this.isSubmitting.set(false);
          this.messageService.add({ severity: 'error', summary: 'Submission Failed', detail: err.error?.message || 'Could not grade quiz.' });
        }
      });
  }

  retryQuiz(): void {
    this.startQuiz();
  }
}

// import { Component, OnInit, inject, DestroyRef, signal, computed, input, output, effect } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { RadioButtonModule } from 'primeng/radiobutton';
// import { FormsModule } from '@angular/forms';
// import { MessageService } from 'primeng/api';

// // You will add this service to connect to the quiz routes you provided
// // import { QuizService } from '../../../core/services/quiz.service';

// @Component({
//   selector: 'app-lesson-quiz-taker',
//   standalone: true,
//   imports: [CommonModule, ButtonModule, RadioButtonModule, FormsModule],
//   templateUrl: './lesson-quiz-taker.component.html',
//   styleUrls: ['./lesson-quiz-taker.component.scss']
// })
// export class LessonQuizTakerComponent implements OnInit {
//   // Inputs from CoursePlayerComponent
//   quizId = input.required<string>();
  
//   // Emits when the student successfully passes the quiz
//   quizCompleted = output<{ score: number, passed: boolean }>();

//   // private quizService = inject(QuizService);
//   private messageService = inject(MessageService);
//   private destroyRef = inject(DestroyRef);

//   // State
//   quizState = signal<'intro' | 'taking' | 'results'>('intro');
//   isLoading = signal<boolean>(false);
//   isSubmitting = signal<boolean>(false);

//   quizData = signal<any>(null);
//   questions = signal<any[]>([]);
  
//   // User Answers: Maps question ID to selected Option Index
//   answers = signal<{[key: string]: number}>({});
  
//   // Results state
//   resultsData = signal<any>(null);

//   constructor() {
//     effect(() => {
//       const id = this.quizId();
//       if (id) this.loadQuizData(id);
//     }, { allowSignalWrites: true });
//   }

//   ngOnInit(): void {}

//   private loadQuizData(id: string): void {
//     this.isLoading.set(true);
//     // MOCK API CALL: this.quizService.getQuizWithQuestions(id)
//     setTimeout(() => {
//       // Mocked Backend Response
//       this.quizData.set({ title: 'Module 1 Knowledge Check', passingScore: 80, totalPoints: 20 });
//       this.questions.set([
//         { _id: 'q1', question: 'What is Angular?', type: 'multiple-choice', points: 10, options: [{text: 'A framework'}, {text: 'An OS'}] },
//         { _id: 'q2', question: 'TypeScript is typed JavaScript.', type: 'multiple-choice', points: 10, options: [{text: 'True'}, {text: 'False'}] }
//       ]);
//       this.quizState.set('intro');
//       this.isLoading.set(false);
//     }, 800);
//   }

//   startQuiz(): void {
//     this.answers.set({}); // Reset answers
//     this.quizState.set('taking');
//   }

//   submitQuiz(): void {
//     // Validate all questions answered
//     const answeredCount = Object.keys(this.answers()).length;
//     if (answeredCount < this.questions().length) {
//       this.messageService.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please answer all questions before submitting.' });
//       return;
//     }

//     this.isSubmitting.set(true);
    
//     // Format payload for backend: [{ questionId, selectedOption }]
//     const payload = Object.keys(this.answers()).map(qId => ({
//       questionId: qId,
//       selectedOption: this.answers()[qId]
//     }));

//     // MOCK API CALL: this.quizService.submitQuiz(this.quizId(), payload)
//     setTimeout(() => {
//       this.isSubmitting.set(false);
//       // Mock Result
//       const mockResult = { passed: true, percentage: 100, score: 20 };
//       this.resultsData.set(mockResult);
//       this.quizState.set('results');

//       if (mockResult.passed) {
//         this.quizCompleted.emit({ score: mockResult.score, passed: true });
//       }
//     }, 1000);
//   }

//   retryQuiz(): void {
//     this.startQuiz();
//   }
// }