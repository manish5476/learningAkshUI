import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

// Services
import { MockTestService } from '../../../core/services/mock-test.service';

@Component({
  selector: 'app-mock-test-results',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DecimalPipe,
    DatePipe,
    ButtonModule,
    ProgressBarModule,
    TagModule,
    DividerModule
  ],
  templateUrl: './mock-test-results.component.html',
  styleUrls: ['./mock-test-results.component.scss']
})
export class MockTestResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mockTestService = inject(MockTestService);
  private destroyRef = inject(DestroyRef);

  // State Signals
  attemptId = signal<string>('');
  attemptData = signal<any>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Computed Values
  isPassed = computed(() => this.attemptData()?.isPassed || false);
  mockTest = computed(() => this.attemptData()?.mockTest || null);
  answers = computed(() => this.attemptData()?.answers || []);
  
  formattedTime = computed(() => {
    const mins = this.attemptData()?.timeTaken || 0;
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m} mins`;
  });

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['id']) {
        this.attemptId.set(params['id']);
        this.fetchResults(params['id']);
      }
    });
  }

  private fetchResults(id: string): void {
    this.isLoading.set(true);
    this.mockTestService.getAttemptDetails(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.attemptData.set(res.data?.attempt || res.data);
          this.isLoading.set(false);
        },
        error: (err: any) => {
          this.error.set('Failed to load test results.');
          this.isLoading.set(false);
        }
      });
  }

  // Determines the visual state of an option during review
  getOptionState(option: any, index: number, selectedIndex: number): 'correct' | 'incorrect' | 'default' {
    const isActuallyCorrect = option.isCorrect;
    const isUserSelected = index === selectedIndex;

    if (isActuallyCorrect) return 'correct'; // Always highlight the correct answer
    if (isUserSelected && !isActuallyCorrect) return 'incorrect'; // Highlight wrong selections
    return 'default';
  }

  goBackToDashboard(): void {
    this.router.navigate(['/mock-tests']);
  }
}