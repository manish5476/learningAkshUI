import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { AuthService } from '../../../core/services/auth.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { PropertyCourseCardComponent } from '../../../shared/components/course-card.component';

// Services

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ButtonModule, ProgressBarModule, 
    SkeletonModule, TagModule, DatePipe, PropertyCourseCardComponent
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent implements OnInit {
  private enrollmentService = inject(EnrollmentService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  currentUser = signal<any>(null);

  // State Signals
  enrollments = signal<any[]>([]);
  timeline = signal<any[]>([]);
  recommendations = signal<any[]>([]);

  // Loading States
  isLoadingEnrollments = signal<boolean>(true);
  isLoadingTimeline = signal<boolean>(true);
  isLoadingRecommendations = signal<boolean>(true);

  placeholderArray = [1, 2, 3]; // For skeletons

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => this.currentUser.set(user));

    this.fetchDashboardData();
  }

  fetchDashboardData(): void {
    // 1. Fetch My Enrollments
    this.enrollmentService.getMyEnrollments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const active = (res?.data?.enrollments || []).filter((e: any) => e.isActive && !e.isRevoked);
          this.enrollments.set(active);
          this.isLoadingEnrollments.set(false);
        },
        error: () => this.isLoadingEnrollments.set(false)
      });

    // 2. Fetch Timeline Activity
    this.enrollmentService.getStudentTimeline()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.timeline.set(res?.data?.timeline || []);
          this.isLoadingTimeline.set(false);
        },
        error: () => this.isLoadingTimeline.set(false)
      });

    // 3. Fetch Recommendations
    this.enrollmentService.getRecommendedCourses(4)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.recommendations.set(res?.data?.recommendations || []);
          this.isLoadingRecommendations.set(false);
        },
        error: () => this.isLoadingRecommendations.set(false)
      });
  }

  continueCourse(enrollment: any): void {
    const identifier = enrollment.course.slug || enrollment.course._id;
    if (identifier) {
      this.router.navigate(['/courses/learn', identifier]);
    }
  }

  getTimelineIcon(type: string): string {
    const icons: Record<string, string> = {
      'enrollment': 'pi pi-bolt',
      'completion': 'pi pi-check-circle',
      'progress': 'pi pi-chart-line',
      'certificate': 'pi pi-file-export'
    };
    return icons[type] || 'pi pi-clock';
  }

  getTimelineColor(type: string): string {
    const colors: Record<string, string> = {
      'enrollment': 'var(--color-info)',
      'completion': 'var(--color-success)',
      'progress': 'var(--color-primary)',
      'certificate': 'var(--color-warning)'
    };
    return colors[type] || 'var(--text-tertiary)';
  }
}