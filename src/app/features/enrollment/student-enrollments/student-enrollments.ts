// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-student-enrollments',
//   imports: [],

// })
// export class StudentEnrollments {

// }
import { Component, OnInit, ChangeDetectionStrategy, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

// PrimeNG
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Enrollment } from '../../../core/models/enrollment.model';
import { EnrollmentService } from '../../../core/services/enrollment.service';


@Component({
  selector: 'app-student-enrollments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ProgressBarModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    ToastModule
  ],
  templateUrl: './student-enrollments.html',
  styleUrl: './student-enrollments.scss',
  providers: [MessageService],
  
})
export class StudentEnrollmentsComponent implements OnInit {
  private enrollmentService = inject(EnrollmentService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Signals for state management
  enrollments = signal<Enrollment[]>([]);
  isLoading = signal<boolean>(true);
  
  // Computed-like stats
  activeCoursesCount = signal<number>(0);
  completedCoursesCount = signal<number>(0);

  ngOnInit(): void {
    this.loadMyEnrollments();
  }

  private loadMyEnrollments(): void {
    this.isLoading.set(true);
    
   this.enrollmentService.getMyEnrollments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const data = res.data?.enrollments || res.data || [];
          this.enrollments.set(data);
          
          // FIX: Access progress?.courseProgressPercentage safely
          this.activeCoursesCount.set(
            data.filter((e: Enrollment) => e.isActive && (e.progress?.courseProgressPercentage || 0) < 100).length
          );
          
          this.completedCoursesCount.set(
            data.filter((e: Enrollment) => (e.progress?.courseProgressPercentage || 0) === 100 ).length
          );
          
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error fetching enrollments', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load your courses.' });
          this.isLoading.set(false);
        }
      });
  }

  // Helper methods to handle populated mongoose references Safely
  getCourseTitle(enrollment: Enrollment): string {
    if (typeof enrollment.course === 'object' && enrollment.course !== null) {
      return (enrollment.course as any).title || 'Unknown Course';
    }
    return 'Loading...';
  }

  getCourseThumbnail(enrollment: Enrollment): string {
    if (typeof enrollment.course === 'object' && enrollment.course !== null) {
      return (enrollment.course as any).thumbnail || 'assets/images/course-placeholder.jpg';
    }
    return 'assets/images/course-placeholder.jpg';
  }

  getInstructorName(enrollment: Enrollment): string {
    if (typeof enrollment.course === 'object' && enrollment.course !== null) {
      const instructor = (enrollment.course as any).instructor;
      if (instructor && typeof instructor === 'object') {
        return `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || 'Instructor';
      }
    }
    return 'Platform Instructor';
  }

  // Navigation & Actions
  goToCourse(enrollment: Enrollment): void {
    const courseId = typeof enrollment.course === 'string' ? enrollment.course : (enrollment.course as any)._id;
    // Route to the learning viewer/player
    this.router.navigate(['/learning', courseId]); 
  }

  downloadCertificate(enrollmentId: string): void {
    this.messageService.add({ severity: 'info', summary: 'Processing', detail: 'Generating your certificate...' });
    
    this.enrollmentService.getCertificate(enrollmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob: Blob) => {
          // Create an invisible link to trigger the browser download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Certificate_${enrollmentId}.pdf`; 
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Could not download certificate.' });
        }
      });
  }
}