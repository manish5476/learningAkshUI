import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

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
    TagModule
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
  
  // Smart Percentage Calculator (Handles null percentages and divide-by-zero)
  calculatedPercentage = computed(() => {
    const data = this.attemptData();
    if (!data) return 0;
    
    // If backend provided a valid percentage, use it
    if (data.percentage !== null && data.percentage !== undefined) {
      return data.percentage;
    }
    
    // Fallback calculation
    const total = data.mockTest?.totalMarks || 0;
    return total > 0 ? (data.score / total) * 100 : 0;
  });

  // Smart Time Formatter (Handles fractional minutes accurately)
  formattedTime = computed(() => {
    const mins = this.attemptData()?.timeTaken || 0;
    
    // If it took less than 1 minute, show seconds
    if (mins > 0 && mins < 1) {
      const secs = Math.round(mins * 60);
      return `${secs} sec${secs !== 1 ? 's' : ''}`;
    }
    
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
    this.error.set(null);

    this.mockTestService.getAttemptDetails(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          // Robust mapping to catch nested attempt structures
          const payload = res.data?.attempt || res.data || res;
          if (payload && payload._id) {
            this.attemptData.set(payload);
          } else {
            this.error.set('Invalid attempt data received.');
          }
          this.isLoading.set(false);
        },
        error: (err: any) => {
          console.error('Failed to load test results', err);
          this.error.set('Failed to load test results. Please try again.');
          this.isLoading.set(false);
        }
      });
  }

  // Determines the visual state of an option during review
  getOptionState(option: any, index: number, selectedIndex: number): 'correct' | 'incorrect' | 'default' {
    const isActuallyCorrect = option.isCorrect;
    const isUserSelected = index === selectedIndex;

    if (isActuallyCorrect) return 'correct'; // Always highlight the correct answer in green
    if (isUserSelected && !isActuallyCorrect) return 'incorrect'; // Highlight wrong selections in red
    return 'default';
  }

  goBackToDashboard(): void {
    this.router.navigate(['/instructor/mock-tests']); // Adjust route if needed for students
  }
}