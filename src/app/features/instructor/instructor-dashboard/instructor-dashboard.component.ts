import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { CourseService } from '../../../core/services/course.service';

// Services
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
    AvatarModule
  ],
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.scss']
})
export class InstructorDashboardComponent implements OnInit {
  private courseService = inject(CourseService);
  private destroyRef = inject(DestroyRef);

  // State Signals
  isLoading = signal<boolean>(true);
  
  // Aggregate Data Signals
  macroStats = signal({
    lifetimeRevenue: 0,
    totalStudents: 0,
    activeCourses: 0,
    averageRating: 0
  });

  topCourses = signal<any[]>([]);
  recentActivity = signal<any[]>([]);

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  private fetchDashboardData(): void {
    this.isLoading.set(true);

    // Fetch all courses for this instructor
    this.courseService.getMyCourses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const courses = res.data?.data || res.data || [];
          this.calculateMacroStats(courses);
          this.extractTopCourses(courses);
          this.generateMockActivity(); // Replace with real activity endpoint later
          this.isLoading.set(false);
        },
        error: (err: any) => {
          console.error('Failed to load instructor dashboard', err);
          this.isLoading.set(false);
        }
      });
  }

  private calculateMacroStats(courses: any[]): void {
    let revenue = 0;
    let students = 0;
    let activeCount = 0;
    let totalRating = 0;
    let ratedCoursesCount = 0;

    courses.forEach(c => {
      if (c.isPublished) activeCount++;
      const courseStudents = c.totalEnrollments || 0;
      students += courseStudents;
      revenue += courseStudents * (c.discountPrice || c.price || 0);
      
      if (c.rating > 0) {
        totalRating += c.rating;
        ratedCoursesCount++;
      }
    });

    this.macroStats.set({
      lifetimeRevenue: revenue,
      totalStudents: students,
      activeCourses: activeCount,
      averageRating: ratedCoursesCount > 0 ? (totalRating / ratedCoursesCount) : 0
    });
  }

  private extractTopCourses(courses: any[]): void {
    // Sort courses by revenue (or enrollments) and take top 4
    const sorted = [...courses].sort((a, b) => {
      const revA = (a.totalEnrollments || 0) * (a.discountPrice || a.price || 0);
      const revB = (b.totalEnrollments || 0) * (b.discountPrice || b.price || 0);
      return revB - revA;
    });

    this.topCourses.set(sorted.slice(0, 4));
  }

  private generateMockActivity(): void {
    // In a real app, this comes from a Notifications/Activity log API
    this.recentActivity.set([
      { id: 1, type: 'enrollment', text: 'Sarah Jenkins enrolled in Angular Mastery', time: new Date(Date.now() - 1000 * 60 * 30), icon: 'pi-user-plus', color: 'text-info', bg: 'bg-info-light' },
      { id: 2, type: 'review', text: 'David Kim left a 5-star review on Node.js API', time: new Date(Date.now() - 1000 * 60 * 120), icon: 'pi-star-fill', color: 'text-warning', bg: 'bg-warning-light' },
      { id: 3, type: 'completion', text: 'Miguel Santos completed Full-Stack Bootcamp', time: new Date(Date.now() - 1000 * 60 * 60 * 5), icon: 'pi-check-circle', color: 'text-success', bg: 'bg-success-light' },
      { id: 4, type: 'enrollment', text: 'Emma Wilson enrolled in Angular Mastery', time: new Date(Date.now() - 1000 * 60 * 60 * 24), icon: 'pi-user-plus', color: 'text-info', bg: 'bg-info-light' },
      { id: 5, type: 'system', text: 'Course "React Basics" was approved by Admin', time: new Date(Date.now() - 1000 * 60 * 60 * 48), icon: 'pi-verified', color: 'text-primary', bg: 'bg-primary-light' }
    ]);
  }
}