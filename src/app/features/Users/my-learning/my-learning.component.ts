import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { AppMessageService } from '../../../core/utils/message.service';

// Services

@Component({
  selector: 'app-my-learning',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ButtonModule, 
    SkeletonModule, 
    ProgressBarModule, 
    DatePipe
  ],
  templateUrl: './my-learning.component.html',
  styleUrls: ['./my-learning.component.scss']
})
export class MyLearningComponent implements OnInit {
  private enrollmentService = inject(EnrollmentService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  enrollments = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  // For the skeleton loader
  placeholderArray = [1, 2, 3, 4, 5, 6]; 

  ngOnInit(): void {
    this.loadMyEnrollments();
  }

  loadMyEnrollments(): void {
    this.isLoading.set(true);
    
    this.enrollmentService.getMyEnrollments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const data = res?.data?.enrollments || [];
          
          // Filter out inactive/revoked enrollments and ensure course object exists
          const activeEnrollments = data.filter((e: any) => 
            e.isActive && !e.isRevoked && e.course && typeof e.course === 'object'
          );
          
          this.enrollments.set(activeEnrollments);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.messageService.handleHttpError(err);
        }
      });
  }

  continueCourse(enrollment: any, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const identifier = enrollment.course.slug || enrollment.course._id;
    if (identifier) {
      this.router.navigate(['/courses/learn', identifier]);
    } else {
      this.messageService.showError('Course link is broken.');
    }
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}

// import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { Router, RouterModule } from '@angular/router';
// import { CommonModule, DatePipe } from '@angular/common';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { CardModule } from 'primeng/card';
// import { SkeletonModule } from 'primeng/skeleton';
// import { ProgressBarModule } from 'primeng/progressbar';
// import { EnrollmentService } from '../../../core/services/enrollment.service';
// import { AppMessageService } from '../../../core/utils/message.service';

// // Services

// @Component({
//   selector: 'app-my-learning',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     RouterModule, 
//     ButtonModule, 
//     CardModule, 
//     SkeletonModule, 
//     ProgressBarModule, 
//     DatePipe
//   ],
//   templateUrl: './my-learning.component.html',
//   styleUrls: ['./my-learning.component.scss']
// })
// export class MyLearningComponent implements OnInit {
//   private enrollmentService = inject(EnrollmentService);
//   private messageService = inject(AppMessageService);
//   private router = inject(Router);
//   private destroyRef = inject(DestroyRef);

//   enrollments = signal<any[]>([]);
//   isLoading = signal<boolean>(true);

//   // For the skeleton loader
//   placeholderArray = [1, 2, 3, 4, 5, 6]; 

//   ngOnInit(): void {
//     this.loadMyEnrollments();
//   }

//   loadMyEnrollments(): void {
//     this.isLoading.set(true);
    
//     this.enrollmentService.getMyEnrollments()
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           const data = res?.data?.enrollments || [];
          
//           // Filter out any enrollments that are inactive, revoked, or have a missing course object
//           const activeEnrollments = data.filter((e: any) => 
//             e.isActive && !e.isRevoked && e.course && typeof e.course === 'object'
//           );
          
//           this.enrollments.set(activeEnrollments);
//           this.isLoading.set(false);
//         },
//         error: (err) => {
//           this.isLoading.set(false);
//           this.messageService.handleHttpError(err);
//         }
//       });
//   }

//   continueCourse(enrollment: any): void {
//     // Prefer slug for SEO/clean URLs, fallback to ID
//     const identifier = enrollment.course.slug || enrollment.course._id;
//     if (identifier) {
//       this.router.navigate(['/courses/learn', identifier]);
//     } else {
//       this.messageService.showError('Course link is broken.');
//     }
//   }
// }