import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';

// Components
import { PropertyCourseCardComponent } from '../../../shared/components/course-card.component';

// Services
import { CourseService } from '../../../core/services/course.service';

interface DashboardStats {
  lifetimeRevenue: number;
  totalStudents: number;
  activeCourses: number;
  averageRating: number;
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  pendingApproval: number;
}

interface ActivityItem {
  id: number;
  type: 'enrollment' | 'review' | 'completion' | 'system';
  text: string;
  time: Date;
  icon: string;
  color: string;
  bg: string;
  courseId?: string;
  userName?: string;
}

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    ButtonModule,
    ProgressBarModule,
    AvatarModule,
    TooltipModule,
    TagModule,
    ChartModule,
    PropertyCourseCardComponent
  ],
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.scss']
})
export class InstructorDashboardComponent implements OnInit {
  private courseService = inject(CourseService);
  private destroyRef = inject(DestroyRef);
  readonly Math =Math

  // State Signals
  isLoading = signal<boolean>(true);
  courses = signal<any[]>([]);
  
  // Computed Stats
  macroStats = computed<DashboardStats>(() => {
    const courses = this.courses();
    
    let revenue = 0;
    let students = 0;
    let activeCount = 0;
    let publishedCount = 0;
    let draftCount = 0;
    let pendingCount = 0;
    let totalRating = 0;
    let ratedCoursesCount = 0;

    courses.forEach(c => {
      if (c.isPublished) {
        publishedCount++;
        if (c.isApproved) {
          activeCount++;
        } else {
          pendingCount++;
        }
      } else {
        draftCount++;
      }
      
      const courseStudents = c.totalEnrollments || 0;
      students += courseStudents;
      revenue += courseStudents * (c.discountPrice || c.price || 0);
      
      if (c.rating > 0) {
        totalRating += c.rating;
        ratedCoursesCount++;
      }
    });

    return {
      lifetimeRevenue: revenue,
      totalStudents: students,
      activeCourses: activeCount,
      averageRating: ratedCoursesCount > 0 ? (totalRating / ratedCoursesCount) : 0,
      totalCourses: courses.length,
      publishedCourses: publishedCount,
      draftCourses: draftCount,
      pendingApproval: pendingCount
    };
  });

  // Top performing courses
  topCourses = computed(() => {
    const courses = this.courses();
    return [...courses]
      .sort((a, b) => {
        const revA = (a.totalEnrollments || 0) * (a.discountPrice || a.price || 0);
        const revB = (b.totalEnrollments || 0) * (b.discountPrice || b.price || 0);
        return revB - revA;
      })
      .slice(0, 4);
  });

  // Courses needing attention (drafts or pending approval)
  attentionCourses = computed(() => {
    const courses = this.courses();
    return courses
      .filter(c => !c.isPublished || (c.isPublished && !c.isApproved))
      .slice(0, 3);
  });

  // Recent activity
  recentActivity = signal<ActivityItem[]>([]);

  // Chart data
  revenueChartData = computed(() => {
    const courses = this.courses();
    const last6Months = this.getLast6Months();
    
    return {
      labels: last6Months.map(m => m.label),
      datasets: [
        {
          label: 'Revenue',
          data: last6Months.map(() => Math.floor(Math.random() * 50000) + 10000), // Replace with real data
          borderColor: 'var(--color-primary)',
          backgroundColor: 'var(--color-primary-bg)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Enrollments',
          data: last6Months.map(() => Math.floor(Math.random() * 100) + 20), // Replace with real data
          borderColor: 'var(--color-success)',
          backgroundColor: 'var(--color-success-bg)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  });

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'var(--text-secondary)',
          font: {
            family: 'var(--font-body)'
          }
        }
      }
    },
    scales: {
      y: {
        grid: {
          color: 'var(--border-secondary)'
        },
        ticks: {
          color: 'var(--text-tertiary)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'var(--text-tertiary)'
        }
      }
    }
  };

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  private fetchDashboardData(): void {
    this.isLoading.set(true);
    this.courseService.getInstructorCourses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const courses = res.data?.courses || res.data || [];
          this.courses.set(courses);
          this.generateActivity(courses);
          this.isLoading.set(false);
        },
        error: (err: any) => {
          console.error('Failed to load instructor dashboard', err);
          this.isLoading.set(false);
        }
      });
  }

  private generateActivity(courses: any[]): void {
    const activities: ActivityItem[] = [];
    const now = new Date();
    
    // Generate activity based on actual course data
    courses.forEach((course, index) => {
      if (course.totalEnrollments > 0) {
        activities.push({
          id: index * 3 + 1,
          type: 'enrollment',
          text: `New student enrolled in "${course.title}"`,
          time: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          icon: 'pi-user-plus',
          color: 'text-info',
          bg: 'bg-info-light',
          courseId: course._id
        });
      }

      if (course.totalReviews > 0) {
        activities.push({
          id: index * 3 + 2,
          type: 'review',
          text: `New review on "${course.title}"`,
          time: new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000),
          icon: 'pi-star-fill',
          color: 'text-warning',
          bg: 'bg-warning-light',
          courseId: course._id
        });
      }

      if (course.updatedAt) {
        activities.push({
          id: index * 3 + 3,
          type: 'system',
          text: course.isPublished 
            ? `Course "${course.title}" was updated` 
            : `Course "${course.title}" saved as draft`,
          time: new Date(course.updatedAt),
          icon: course.isPublished ? 'pi-verified' : 'pi-pencil',
          color: 'text-primary',
          bg: 'bg-primary-light',
          courseId: course._id
        });
      }
    });

    // Sort by time (most recent first) and take top 8
    const sorted = activities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 8);

    this.recentActivity.set(sorted);
  }

  private getLast6Months(): { label: string; date: Date }[] {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        date
      });
    }
    
    return months;
  }

  getStatusSeverity(course: any): any {
    if (course.isPublished && course.isApproved) return 'success';
    if (course.isPublished) return 'warn';
    return 'info';
  }

  getStatusLabel(course: any): string {
    if (course.isPublished && course.isApproved) return 'Published';
    if (course.isPublished) return 'Pending Approval';
    return 'Draft';
  }

  getRevenueGrowth(): number {
    // Calculate growth from last month (mock data - replace with real)
    return 23.5;
  }

  getStudentGrowth(): number {
    // Calculate growth from last month (mock data - replace with real)
    return 15.2;
  }

  getEngagementRate(): number {
    // Calculate average completion rate (mock data - replace with real)
    return 68;
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  trackCourse(index: number, course: any): string {
    return course._id;
  }

  trackActivity(index: number, activity: ActivityItem): number {
    return activity.id;
  }
}
