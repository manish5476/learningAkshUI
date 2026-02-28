import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

// PrimeNG
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { EnrollmentService } from '../../../../core/services/enrollment.service';

// Services
// import { EnrollmentService } from '../../../core/services/enrollment.service';

@Component({
  selector: 'app-my-learning',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProgressBarModule,
    ButtonModule
  ],
  templateUrl: './my-learning.component.html',
  styleUrls: ['./my-learning.component.scss']
})
export class MyLearningComponent implements OnInit {
  private enrollmentService = inject(EnrollmentService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // State Signals
  enrollments = signal<any[]>([]);
  loading = signal<boolean>(true);
  activeTab = signal<'active' | 'completed' | 'certificates'>('active');

  // Computed State for Tab Filtering
  activeCourses = computed(() => {
    return this.enrollments().filter(e => (e.progress || 0) < 100);
  });

  completedCourses = computed(() => {
    return this.enrollments().filter(e => (e.progress || 0) === 100);
  });

  certificates = computed(() => {
    // Only return enrollments that have a certificate URL generated
    return this.enrollments().filter(e => e.certificateUrl);
  });

  ngOnInit(): void {
    this.fetchMyLearning();
  }

  private fetchMyLearning(): void {
    this.loading.set(true);
    
    // Replace 'getMyEnrollments' with whatever your actual service method is named
    this.enrollmentService.getMyEnrollments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const data = res.data?.data || res.data || [];
          this.enrollments.set(Array.isArray(data) ? data : []);
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Failed to load enrollments', err);
          this.loading.set(false);
        }
      });
  }

  setTab(tab: 'active' | 'completed' | 'certificates'): void {
    this.activeTab.set(tab);
  }

  resumeCourse(enrollment: any): void {
    const courseIdOrSlug = enrollment.course?.slug || enrollment.course?._id;
    if (courseIdOrSlug) {
      // Navigates to the CoursePlayerComponent we built earlier!
      this.router.navigate(['/learn', courseIdOrSlug]);
    }
  }

  downloadCertificate(url: string): void {
    window.open(url, '_blank');
  }
}

// import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// // PrimeNG
// import { ProgressBarModule } from 'primeng/progressbar';
// import { ButtonModule } from 'primeng/button';
// import { EnrollmentService } from '../../../../core/services/enrollment.service';

// // Services

// @Component({
//   selector: 'app-my-learning',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ProgressBarModule,
//     ButtonModule
//   ],
//   templateUrl: './my-learning.component.html',
//   styleUrls: ['./my-learning.component.scss']
// })
// export class MyLearningComponent implements OnInit {
//   private enrollmentService = inject(EnrollmentService);
//   private destroyRef = inject(DestroyRef);

//   // Reactive State
//   enrollments = signal<any[]>([]);
//   isLoading = signal<boolean>(true);
//   activeTab = signal<'all' | 'in-progress' | 'completed'>('all');

//   // Computed: Filter enrollments based on the active tab
//   filteredEnrollments = computed(() => {
//     const data = this.enrollments();
//     const tab = this.activeTab();

//     if (tab === 'in-progress') {
//       return data.filter(e => e.progress < 100);
//     }
//     if (tab === 'completed') {
//       return data.filter(e => e.progress === 100);
//     }
//     return data;
//   });

//   ngOnInit(): void {
//     this.loadMyLearning();
//   }

//   private loadMyLearning(): void {
//     this.isLoading.set(true);
    
//     // Assuming your EnrollmentService has a route to get the current user's enrollments
//     this.enrollmentService.getMyEnrollments()
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           const payload = res.data?.data || res.data || [];
//           this.enrollments.set(Array.isArray(payload) ? payload : []);
//           this.isLoading.set(false);
//         },
//         error: (err: any) => {
//           console.error('Failed to load enrollments', err);
//           this.isLoading.set(false);
//         }
//       });
//   }

//   setTab(tab: 'all' | 'in-progress' | 'completed'): void {
//     this.activeTab.set(tab);
//   }

//   // Helper to determine the correct label for the button
//   getButtonLabel(progress: number): string {
//     if (progress === 0) return 'Start Course';
//     if (progress === 100) return 'Review Course';
//     return 'Resume Learning';
//   }
// }