import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CourseService } from '../../../../core/services/course.service';
import { EnrollmentService } from '../../../../core/services/enrollment.service';

// Services

@Component({
  selector: 'app-course-students',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe, TableModule, ButtonModule, InputTextModule, ProgressBarModule, AvatarModule, TagModule, TooltipModule, ConfirmDialogModule, ToastModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './course-students.component.html',
  styleUrls: ['./course-students.component.scss']
})
export class CourseStudentsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private enrollmentService = inject(EnrollmentService);
  private courseService = inject(CourseService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // State Signals 
  courseId = signal<string>('');
  courseTitle = signal<string>('Loading...');
  enrollments = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');

  // Computed: Filtered Students based on search query
  filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const all = this.enrollments();
    if (!query) return all;

    return all.filter(e => {
      const name = `${e.student?.firstName} ${e.student?.lastName}`.toLowerCase();
      const email = e.student?.email?.toLowerCase() || '';
      return name.includes(query) || email.includes(query);
    });
  });

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['id']) {
        this.courseId.set(params['id']);
        this.fetchCourseDetails(params['id']);
        this.fetchStudents(params['id']);
      }
    });
  }

  private fetchCourseDetails(id: string): void {
    this.courseService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const course = res.data?.course || res.data?.data || res.data;
          this.courseTitle.set(course?.title || 'Student Roster');
        }
      });
  }

  private fetchStudents(courseId: string): void {
    this.isLoading.set(true);
    this.enrollmentService.getCourseStudents(courseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const data = res.data?.students || res.data || [];
          this.enrollments.set(data);
          this.isLoading.set(false);
        },
        error: (err: any) => {
          console.error('Failed to load students', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load student list.' });
          this.isLoading.set(false);
        }
      });
  }

  revokeAccess(enrollment: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to revoke access for ${enrollment.student?.firstName} ${enrollment.student?.lastName}? They will no longer be able to view the course content.`,
      header: 'Revoke Access',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.enrollmentService.cancelEnrollment(enrollment._id, 'Instructor revoked access')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.messageService.add({ severity: 'success', summary: 'Access Revoked', detail: 'Student has been removed from the course.' });
              // Optimistically remove from UI
              this.enrollments.update(list => list.filter(e => e._id !== enrollment._id));
            },
            error: (err) => {
              this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to revoke access.' });
            }
          });
      }
    });
  }

  getInitials(firstName: string, lastName: string): string {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase() || 'U';
  }
}