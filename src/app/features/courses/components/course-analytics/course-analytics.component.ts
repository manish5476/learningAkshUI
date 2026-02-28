import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { CourseService } from '../../../../core/services/course.service';

// Services

@Component({
  selector: 'app-course-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    TableModule,
    ProgressBarModule,
    AvatarModule
  ],
  templateUrl: './course-analytics.component.html',
  styleUrls: ['./course-analytics.component.scss']
})
export class CourseAnalyticsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private destroyRef = inject(DestroyRef);

  // State Signals
  courseId = signal<string>('');
  courseTitle = signal<string>('Loading Course...');
  isLoading = signal<boolean>(true);

  // Analytics Data Signals
  overviewStats = signal({
    totalRevenue: 0,
    totalEnrollments: 0,
    averageRating: 0,
    completionRate: 0
  });

  engagementMetrics = signal([
    { label: '0-25% Completed', count: 0, percentage: 0 },
    { label: '26-50% Completed', count: 0, percentage: 0 },
    { label: '51-75% Completed', count: 0, percentage: 0 },
    { label: '76-99% Completed', count: 0, percentage: 0 },
    { label: '100% Completed', count: 0, percentage: 0 }
  ]);

  recentStudents = signal<any[]>([]);

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['id']) {
        this.courseId.set(params['id']);
        this.fetchAnalytics(params['id']);
      }
    });
  }

  private fetchAnalytics(id: string): void {
    this.isLoading.set(true);

    // Fetch the course details to get the title and basic stats
    this.courseService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const course = res.data?.data || res.data;
          this.courseTitle.set(course?.title || 'Course Analytics');
          
          // NOTE: In a real production app, you would call a dedicated analytics endpoint here.
          // e.g., this.courseService.getCourseAnalytics(id)
          // For now, we calculate from the base course object and generate beautiful mock data for the UI
          
          const enrollments = course?.totalEnrollments || Math.floor(Math.random() * 500) + 50;
          const price = course?.discountPrice || course?.price || 49.99;

          this.overviewStats.set({
            totalRevenue: enrollments * price,
            totalEnrollments: enrollments,
            averageRating: course?.rating || 4.8,
            completionRate: Math.floor(Math.random() * 40) + 20 // Mock 20-60%
          });

          this.generateMockEngagement(enrollments);
          this.generateMockRecentStudents();

          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load analytics', err);
          this.isLoading.set(false);
        }
      });
  }

  private generateMockEngagement(totalStudents: number): void {
    // Distribute students across progress buckets for the UI visualization
    const b1 = Math.floor(totalStudents * 0.4);
    const b2 = Math.floor(totalStudents * 0.2);
    const b3 = Math.floor(totalStudents * 0.15);
    const b4 = Math.floor(totalStudents * 0.1);
    const b5 = totalStudents - (b1 + b2 + b3 + b4); // The rest completed

    this.engagementMetrics.set([
      { label: '0 - 25%', count: b1, percentage: Math.round((b1/totalStudents)*100) },
      { label: '26 - 50%', count: b2, percentage: Math.round((b2/totalStudents)*100) },
      { label: '51 - 75%', count: b3, percentage: Math.round((b3/totalStudents)*100) },
      { label: '76 - 99%', count: b4, percentage: Math.round((b4/totalStudents)*100) },
      { label: 'Completed', count: b5, percentage: Math.round((b5/totalStudents)*100) }
    ]);
  }

  private generateMockRecentStudents(): void {
    const names = ['Alex Chen', 'Sarah Jenkins', 'Miguel Santos', 'Emma Wilson', 'David Kim'];
    const mockStudents = names.map((name, i) => ({
      id: i,
      name: name,
      email: name.toLowerCase().replace(' ', '.') + '@example.com',
      enrolledAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
      progress: Math.floor(Math.random() * 100)
    }));
    
    // Sort by date descending
    this.recentStudents.set(mockStudents.sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime()));
  }
}