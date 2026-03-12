import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';

// Services
import { CourseService } from '../../../../core/services/course.service';
import { SelectModule } from 'primeng/select';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string | null;
  enrolledAt: string;
  isActive: boolean;
  isCompleted: boolean;
}

interface CourseAnalyticsResponse {
  courseInfo: {
    id: string;
    title: string;
    slug: string;
    price: number;
  };
  stats: {
    revenue: {
      total: number;
      currency: string;
      transactionCount: number;
    };
    enrollment: {
      total: number;
      active: number;
      inactive: number;
    };
    engagement: {
      averageRating: number;
      totalReviews: number;
      completionRate: number;
      averageProgress: number;
    };
  };
  students: Student[];
}

@Component({
  selector: 'app-course-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    TableModule,
    ProgressBarModule,
    AvatarModule,
    TagModule,
    SelectModule,
    ButtonModule,
    TooltipModule,
    ChartModule,
    CardModule
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
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Data Signals
  analyticsData = signal<CourseAnalyticsResponse | null>(null);
  
  // Derived Signals
  courseInfo = computed(() => this.analyticsData()?.courseInfo);
  stats:any = computed(() => this.analyticsData()?.stats);
  students = computed(() => this.analyticsData()?.students || []);
  
  // Chart Data
  engagementChartData = signal<any>(null);
  chartOptions = signal<any>(null);
  
  // Filters
  searchTerm = signal<string>('');
  filteredStudents = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const students = this.students();
    
    if (!term) return students;
    
    return students.filter(s => 
      s.firstName.toLowerCase().includes(term) ||
      s.lastName.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term)
    );
  });

  // Student count by status
  activeStudentsCount = computed(() => 
    this.students().filter(s => s.isActive && !s.isCompleted).length
  );
  
  completedStudentsCount = computed(() => 
    this.students().filter(s => s.isCompleted).length
  );
  
  inactiveStudentsCount = computed(() => 
    this.students().filter(s => !s.isActive).length
  );

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['id']) {
        this.courseId.set(params['id']);
        this.fetchAnalytics(params['id']);
      }
    });
    
    this.initChartOptions();
  }

  private fetchAnalytics(id: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.courseService.getCourseAnalytics(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          // Handle nested response structure
          const data = res.data?.data || res.data;
          this.analyticsData.set(data);
          this.generateEngagementChart(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load analytics', err);
          this.error.set('Failed to load analytics. Please try again.');
          this.isLoading.set(false);
        }
      });
  }

  private generateEngagementChart(data: CourseAnalyticsResponse): void {
    const totalStudents = data.stats.enrollment.total;
    
    // Calculate engagement distribution based on actual data
    // Since we don't have detailed progress data, we'll use available metrics
    const activeCount = data.stats.enrollment.active;
    const inactiveCount = data.stats.enrollment.inactive;
    const completedCount = data.students.filter(s => s.isCompleted).length;
    const inProgressCount = activeCount - completedCount;
    
    this.engagementChartData.set({
      labels: ['In Progress', 'Completed', 'Inactive'],
      datasets: [
        {
          data: [inProgressCount, completedCount, inactiveCount],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 159, 64, 0.8)'
          ],
          hoverBackgroundColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 0
        }
      ]
    });
  }

  private initChartOptions(): void {
    this.chartOptions.set({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: 'var(--text-secondary)',
            font: {
              family: 'var(--font-body)',
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'var(--bg-secondary)',
          titleColor: 'var(--text-primary)',
          bodyColor: 'var(--text-secondary)',
          borderColor: 'var(--border-primary)',
          borderWidth: 1
        }
      }
    });
  }

  getStudentFullName(student: Student): string {
    return `${student.firstName} ${student.lastName}`;
  }

  getStudentInitials(student: Student): string {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`;
  }

  getStudentStatusSeverity(student: Student): 'success' | 'info' | 'warn' | 'danger' {
    if (student.isCompleted) return 'success';
    if (student.isActive) return 'info';
    return 'warn';
  }

  getStudentStatusLabel(student: Student): string {
    if (student.isCompleted) return 'Completed';
    if (student.isActive) return 'Active';
    return 'Inactive';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  retry(): void {
    this.fetchAnalytics(this.courseId());
  }

  exportCSV(): void {
    // Prepare CSV data
    const headers = ['Name', 'Email', 'Status', 'Enrolled Date'];
    const csvData = this.students().map(s => [
      this.getStudentFullName(s),
      s.email,
      this.getStudentStatusLabel(s),
      this.formatDate(s.enrolledAt)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.courseInfo()?.title || 'course'}-analytics.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}


// import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';

// // PrimeNG
// import { TableModule } from 'primeng/table';
// import { ProgressBarModule } from 'primeng/progressbar';
// import { AvatarModule } from 'primeng/avatar';
// import { CourseService } from '../../../../core/services/course.service';

// // Services

// @Component({
//   selector: 'app-course-analytics',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     CurrencyPipe,
//     DatePipe,
//     DecimalPipe,
//     TableModule,
//     ProgressBarModule,
//     AvatarModule
//   ],
//   templateUrl: './course-analytics.component.html',
//   styleUrls: ['./course-analytics.component.scss']
// })
// export class CourseAnalyticsComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private courseService = inject(CourseService);
//   private destroyRef = inject(DestroyRef);

//   // State Signals
//   courseId = signal<string>('');
//   courseTitle = signal<string>('Loading Course...');
//   isLoading = signal<boolean>(true);

//   // Analytics Data Signals
//   overviewStats = signal({
//     totalRevenue: 0,
//     totalEnrollments: 0,
//     averageRating: 0,
//     completionRate: 0
//   });

//   engagementMetrics = signal([
//     { label: '0-25% Completed', count: 0, percentage: 0 },
//     { label: '26-50% Completed', count: 0, percentage: 0 },
//     { label: '51-75% Completed', count: 0, percentage: 0 },
//     { label: '76-99% Completed', count: 0, percentage: 0 },
//     { label: '100% Completed', count: 0, percentage: 0 }
//   ]);

//   recentStudents = signal<any[]>([]);

//   ngOnInit(): void {
//     this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
//       if (params['id']) {
//         this.courseId.set(params['id']);
//         this.fetchAnalytics(params['id']);
//       }
//     });
//   }

//   private fetchAnalytics(id: string): void {
//     this.isLoading.set(true);

//     // Fetch the course details to get the title and basic stats
//     this.courseService.getCourseAnalytics(id)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           const course = res.data?.data || res.data;
//           this.courseTitle.set(course?.title || 'Course Analytics');
          
//           const enrollments = course?.totalEnrollments || Math.floor(Math.random() * 500) + 50;
//           const price = course?.discountPrice || course?.price || 49.99;

//           this.overviewStats.set({
//             totalRevenue: enrollments * price,
//             totalEnrollments: enrollments,
//             averageRating: course?.rating || 4.8,
//             completionRate: Math.floor(Math.random() * 40) + 20 // Mock 20-60%
//           });

//           this.generateMockEngagement(enrollments);
//           this.generateMockRecentStudents();

//           this.isLoading.set(false);
//         },
//         error: (err) => {
//           console.error('Failed to load analytics', err);
//           this.isLoading.set(false);
//         }
//       });
//   }

//   private generateMockEngagement(totalStudents: number): void {
//     // Distribute students across progress buckets for the UI visualization
//     const b1 = Math.floor(totalStudents * 0.4);
//     const b2 = Math.floor(totalStudents * 0.2);
//     const b3 = Math.floor(totalStudents * 0.15);
//     const b4 = Math.floor(totalStudents * 0.1);
//     const b5 = totalStudents - (b1 + b2 + b3 + b4); // The rest completed

//     this.engagementMetrics.set([
//       { label: '0 - 25%', count: b1, percentage: Math.round((b1/totalStudents)*100) },
//       { label: '26 - 50%', count: b2, percentage: Math.round((b2/totalStudents)*100) },
//       { label: '51 - 75%', count: b3, percentage: Math.round((b3/totalStudents)*100) },
//       { label: '76 - 99%', count: b4, percentage: Math.round((b4/totalStudents)*100) },
//       { label: 'Completed', count: b5, percentage: Math.round((b5/totalStudents)*100) }
//     ]);
//   }

//   private generateMockRecentStudents(): void {
//     const names = ['Alex Chen', 'Sarah Jenkins', 'Miguel Santos', 'Emma Wilson', 'David Kim'];
//     const mockStudents = names.map((name, i) => ({
//       id: i,
//       name: name,
//       email: name.toLowerCase().replace(' ', '.') + '@example.com',
//       enrolledAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
//       progress: Math.floor(Math.random() * 100)
//     }));
    
//     // Sort by date descending
//     this.recentStudents.set(mockStudents.sort((a, b) => b.enrolledAt.getTime() - a.enrolledAt.getTime()));
//   }
// }