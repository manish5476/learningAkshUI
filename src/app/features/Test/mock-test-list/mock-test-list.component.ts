import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { MockTestService } from '../../../core/services/mock-test.service';

// Services

@Component({
  selector: 'app-mock-test-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
    ButtonModule,
    TagModule,
    TableModule
  ],
  templateUrl: './mock-test-list.component.html',
  styleUrls: ['./mock-test-list.component.scss']
})
export class MockTestListComponent implements OnInit {
  private mockTestService = inject(MockTestService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // State Signals
  activeTab = signal<'available' | 'attempts'>('available');
  isLoading = signal<boolean>(true);
  
  availableTests = signal<any[]>([]);
  myAttempts = signal<any[]>([]);

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  private fetchDashboardData(): void {
    this.isLoading.set(true);

    forkJoin({
      testsRes: this.mockTestService.getAll({ isPublished: true }).pipe(catchError(() => of(null))),
      attemptsRes: this.mockTestService.getMyAttempts().pipe(catchError(() => of(null)))
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: ({ testsRes, attemptsRes }) => {
        this.availableTests.set(testsRes?.data?.data || testsRes?.data || []);
        this.myAttempts.set(attemptsRes?.data?.attempts || attemptsRes?.data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  setTab(tab: 'available' | 'attempts'): void {
    this.activeTab.set(tab);
  }

  startTest(testId: string): void {
    // Navigate to a dedicated "Test Taker" component (which we will build next!)
    this.router.navigate(['/mock-tests/take', testId]);
  }

  viewAttemptResult(attemptId: string): void {
    this.router.navigate(['/mock-tests/results', attemptId]);
  }

  getLevelSeverity(level: string): any {
    const map: Record<string, string> = {
      'beginner': 'success',
      'intermediate': 'info',
      'advanced': 'danger'
    };
    return map[level?.toLowerCase()] || 'info';
  }
}