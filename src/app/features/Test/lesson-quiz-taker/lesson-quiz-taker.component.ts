import { Component, OnInit, inject, DestroyRef, signal, input, output, effect, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { QuizService } from '../../../core/services/quiz.service';

// Services
// import { QuizService } from '../../../../core/services/quiz.service';

@Component({
  selector: 'app-lesson-quiz-taker',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, RadioButtonModule, 
    InputTextModule, TextareaModule, TagModule
  ],
  templateUrl: './lesson-quiz-taker.component.html',
  styleUrls: ['./lesson-quiz-taker.component.scss']
})
export class LessonQuizTakerComponent implements OnInit {
  quizId = input.required<string>();
  quizCompleted = output<{ score: number, passed: boolean }>();
  
  private quizService = inject(QuizService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  quizState = signal<'intro' | 'taking' | 'results'>('intro');
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  
  quizData = signal<any>(null);
  questions = signal<any[]>([]);
  resultsData = signal<any>(null);
  
  // Maps question _id to the student's answer (option _id, boolean, or text)
  studentAnswers: { [questionId: string]: any } = {};

  // Timer State
  timeRemaining = signal<number>(0);
  timerSubscription: Subscription | null = null;
  
  formattedTime = computed(() => {
    const totalSeconds = this.timeRemaining();
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  isTimeRunningOut = computed(() => this.timeRemaining() <= 60 && this.timeRemaining() > 0);

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
          this.quizData.set(res.data?.quiz || res.data);
          this.questions.set(res.data?.questions || res.questions || []);
          this.quizState.set('intro');
          this.isLoading.set(false);
        },
        error: (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load assessment data.' });
          this.isLoading.set(false);
        }
      });
  }

  startQuiz(): void {
    this.studentAnswers = {};
    this.quizState.set('taking');
    this.startTimer();
  }

  private startTimer(): void {
    const timeLimitMinutes = this.quizData()?.timeLimit || 30; // Default to 30 mins if not set
    this.timeRemaining.set(timeLimitMinutes * 60);

    this.timerSubscription = interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const current = this.timeRemaining();
        if (current > 0) {
          this.timeRemaining.set(current - 1);
        } else {
          this.handleTimeUp();
        }
      });
  }

  private handleTimeUp(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    this.messageService.add({ severity: 'warn', summary: 'Time is up!', detail: 'Your assessment is being auto-submitted.' });
    this.submitQuiz(true); // Pass true to indicate forced auto-submit
  }

  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  submitQuiz(isAutoSubmit = false): void {
    const qList = this.questions();
    const answeredCount = Object.keys(this.studentAnswers).length;

    // Prevent manual submission if incomplete
    if (!isAutoSubmit && answeredCount < qList.length) {
      this.messageService.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please answer all questions before submitting.' });
      return;
    }

    this.isSubmitting.set(true);
    this.stopTimer();

    // Format payload based on the question types defined in the builder
    const formattedAnswers = qList.map(q => {
      const val = this.studentAnswers[q._id];
      const answerPayload: any = { questionId: q._id };
      const type = q.type?.toLowerCase();

      if (type === 'multiple-choice' || type === 'true-false') {
        answerPayload.selectedOption = val;
      } else {
        answerPayload.answerText = val || ''; // Fallback to empty string if unanswered
      }
      return answerPayload;
    });

    this.quizService.submitQuiz(this.quizId(), formattedAnswers)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.isSubmitting.set(false);
          const result = res.data || res;
          this.resultsData.set(result);
          this.quizState.set('results');
          
          if (result.passed) {
            this.quizCompleted.emit({ score: result.score, passed: true });
          }
        },
        error: (err: any) => {
          this.isSubmitting.set(false);
          this.messageService.add({ severity: 'error', summary: 'Submission Failed', detail: err.error?.message || 'Could not grade assessment.' });
        }
      });
  }

  retryQuiz(): void {
    this.startQuiz();
  }

  // Safe type checker helper for the HTML template
  getQType(type: string): string {
    return type?.toLowerCase() || '';
  }
}
// import { Component, OnInit, inject, DestroyRef, signal, input, output, effect } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { RadioButtonModule } from 'primeng/radiobutton';
// import { InputTextModule } from 'primeng/inputtext';
// import { TextareaModule } from 'primeng/textarea';
// import { MessageService } from 'primeng/api';

// // Services
// import { QuizService } from '../../../core/services/quiz.service';
// import { Tag } from "primeng/tag";

// @Component({
//   selector: 'app-lesson-quiz-taker',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ButtonModule,
//     RadioButtonModule,
//     InputTextModule,
//     TextareaModule,
//     Tag
// ],
//   templateUrl: './lesson-quiz-taker.component.html',
//   styleUrls: ['./lesson-quiz-taker.component.scss']
// })
// export class LessonQuizTakerComponent implements OnInit {
//   quizId = input.required<string>();
//   quizCompleted = output<{ score: number, passed: boolean }>();
//   private quizService = inject(QuizService);
//   private messageService = inject(MessageService);
//   private destroyRef = inject(DestroyRef);
//   quizState = signal<'intro' | 'taking' | 'results'>('intro');
//   isLoading = signal<boolean>(false);
//   isSubmitting = signal<boolean>(false);
//   quizData = signal<any>(null);
//   questions = signal<any[]>([]);
//   resultsData = signal<any>(null);
//   studentAnswers: { [questionId: string]: any } = {};
//   constructor() {
//     effect(() => {
//       const id = this.quizId();
//       if (id) {
//         this.loadQuizData(id);
//       }
//     }, { allowSignalWrites: true });
//   }

//   ngOnInit(): void {}
//   private loadQuizData(id: string): void {
//     this.isLoading.set(true);
//     this.quizService.getQuizWithQuestions(id)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           this.quizData.set(res.data?.quiz);
//           this.questions.set(res.data?.questions || []);
//           this.quizState.set('intro');
//           this.isLoading.set(false);
//         },
//         error: (err: any) => {
//           this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load quiz.' });
//           this.isLoading.set(false);
//         }
//       });
//   }

//   startQuiz(): void {
//     this.studentAnswers = {};
//     this.quizState.set('taking');
//   }
//   submitQuiz(): void {
//     const qList = this.questions();
//     const answeredCount = Object.keys(this.studentAnswers).length;
//     if (answeredCount < qList.length) {
//       this.messageService.add({ severity: 'warn', summary: 'Incomplete', detail: 'Please answer all questions before submitting.' });
//       return;
//     }
//     this.isSubmitting.set(true);  
//     const formattedAnswers = qList.map(q => {
//       const val = this.studentAnswers[q._id];
//       const answerPayload: any = { questionId: q._id };
//       if (q.type === 'multiple-choice' || q.type === 'true-false') {answerPayload.selectedOption = val;} 
//       else {answerPayload.answerText = val;}
//       return answerPayload;
//     });

//     this.quizService.submitQuiz(this.quizId(), formattedAnswers)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           this.isSubmitting.set(false);
//           const result = res.data;
//           this.resultsData.set(result);
//           this.quizState.set('results');
//           if (result.passed) {
//             this.quizCompleted.emit({ score: result.score, passed: true });
//           }
//         },
//         error: (err: any) => {
//           this.isSubmitting.set(false);
//           this.messageService.add({ severity: 'error', summary: 'Submission Failed', detail: err.error?.message || 'Could not grade quiz.' });
//         }
//       });
//   }

//   retryQuiz(): void {
//     this.startQuiz();
//   }
// }