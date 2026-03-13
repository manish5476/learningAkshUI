import { Component, OnInit, OnDestroy, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

// Services
import { MockTestService } from '../../../core/services/mock-test.service';

interface AnswerMap {
  [questionId: string]: number;
}

@Component({
  selector: 'app-mock-test-taker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    RadioButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './mock-test-taker.component.html',
  styleUrls: ['./mock-test-taker.component.scss']
})
export class MockTestTakerComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mockTestService = inject(MockTestService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Core State
  testId = signal<string>('');
  attemptId = signal<string>('');
  testState = signal<'intro' | 'in-progress' | 'submitting'>('intro');
  isLoading = signal<boolean>(false);
  isMobilePaletteOpen = signal<boolean>(false); 
  
  // Test Data
  mockTest = signal<any>(null);
  questions = signal<any[]>([]);
  
  // User Interaction State
  currentIndex = signal<number>(0);
  answers = signal<AnswerMap>({});
  
  // Timer State
  timeRemaining = signal<number>(0); 
  private timerInterval: any;

  // Computed Values
  currentQuestion = computed(() => {
    const qList = this.questions();
    const idx = this.currentIndex();
    return qList.length > 0 ? qList[idx] : null;
  });

  answeredCount = computed(() => Object.keys(this.answers()).length);
  totalQuestions = computed(() => this.questions().length);

  formattedTimer = computed(() => {
    const totalSeconds = this.timeRemaining();
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  isTimerDanger = computed(() => this.timeRemaining() < 300 && this.timeRemaining() > 0); 

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['id']) {
        this.testId.set(params['id']);
        this.fetchTestIntro(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private fetchTestIntro(id: string): void {
    this.isLoading.set(true);
    this.mockTestService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.mockTest.set(res.data?.mockTest || res.data);
          this.isLoading.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load test.' });
          this.isLoading.set(false);
        }
      });
  }

  startTest(): void {
    this.isLoading.set(true);
    this.mockTestService.startAttempt(this.testId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const payload = res.data;
          this.attemptId.set(payload.attempt._id);
          this.questions.set(payload.questions);
          
          const durationMins = this.mockTest()?.duration || 30;
          this.timeRemaining.set(durationMins * 60);
          this.startTimer();
          
          this.testState.set('in-progress');
          this.isLoading.set(false);
        },
        error: (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'Cannot Start', detail: err.error?.message || 'Failed to start attempt.' });
          this.isLoading.set(false);
        }
      });
  }

  private startTimer(): void {
    this.clearTimer();
    this.timerInterval = setInterval(() => {
      const current = this.timeRemaining();
      if (current > 0) {
        this.timeRemaining.set(current - 1);
      } else {
        this.clearTimer();
        this.autoSubmitTimeUp();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private autoSubmitTimeUp(): void {
    this.messageService.add({ severity: 'warn', summary: 'Time is up!', detail: 'Auto-submitting your test...', sticky: true });
    this.submitTest(true);
  }

  selectOption(optionIndex: number): void {
    const qId = this.currentQuestion()?._id;
    if (qId) {
      this.answers.update(current => ({ ...current, [qId]: optionIndex }));
    }
  }

  goToQuestion(index: number): void {
    this.currentIndex.set(index);
    this.isMobilePaletteOpen.set(false); // Auto-close drawer on mobile
  }

  nextQuestion(): void {
    if (this.currentIndex() < this.totalQuestions() - 1) {
      this.currentIndex.update(i => i + 1);
    }
  }

  prevQuestion(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
    }
  }

  isAnswered(questionId: string): boolean {
    return this.answers()[questionId] !== undefined;
  }

  togglePalette(): void {
    this.isMobilePaletteOpen.update(v => !v);
  }

  confirmSubmit(): void {
    const unanswered = this.totalQuestions() - this.answeredCount();
    const msg = unanswered > 0 
      ? `You still have ${unanswered} unanswered questions. Are you sure you want to submit?`
      : `You have answered all questions. Ready to submit?`;

    this.confirmationService.confirm({
      message: msg,
      header: 'Confirm Submission',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.submitTest()
    });
  }

  private submitTest(isAutoSubmit = false): void {
    this.clearTimer();
    this.testState.set('submitting');
    
    const answerPayload = Object.keys(this.answers()).map(qId => ({
      questionId: qId,
      selectedOptionIndex: this.answers()[qId]
    }));

    this.mockTestService.submitAttempt(this.attemptId(), answerPayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Test submitted successfully!' });
          setTimeout(() => {
            this.router.navigate(['/mock-tests/results', this.attemptId()]);
          }, 1500);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit test.' });
          this.testState.set('in-progress'); 
          this.startTimer(); 
        }
      });
  }

  exitTest(): void {
    this.router.navigate(['/mock-tests']);
  }
}
