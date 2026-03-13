import { Component, OnInit, inject, DestroyRef, signal, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DecimalPipe, NgClass, TitleCasePipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { AccordionModule } from 'primeng/accordion';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';

// Models & Services
import { Course, Section, Lesson } from '../../../../core/models/course.model';
import { CourseService } from '../../../../core/services/course.service';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CourseDiscussionComponent } from "../course-discussion/course-discussion.component";
import { Card } from "primeng/card";
import { ConfirmDialog } from "primeng/confirmdialog";
import { QuizService } from '../../../../core/services/quiz.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { switchMap } from 'rxjs';

interface SectionWithUI extends Section {
  expanded?: boolean;
  lessons?: Lesson[];
}

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CurrencyPipe,
    NgClass,
    DialogModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    ToastModule,
    TooltipModule,
    AccordionModule,
    DividerModule,
    SkeletonModule,
    CourseDiscussionComponent,
    Card,
  ],
  providers: [MessageService],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);
  private messageService = inject(MessageService);
  private quizService = inject(QuizService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private paymentService = inject(PaymentService);

  showVideoModal = signal<boolean>(false);
  videoType = signal<'youtube' | 'vimeo' | 'direct' | null>(null);
  videoId = signal<string>('');

  // Core State
  course = signal<Course | undefined>(undefined);
  sections = signal<SectionWithUI[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  currentUser = signal<any>(null);
  isEnrolled = signal<boolean>(false);
  isOwner = signal<boolean>(false);
  userProgress = signal<number>(0);
  id: any;

  // Stats
  actualTotalLessons = computed(() => {
    return this.sections().reduce((acc, section) => acc + (section.lessons?.length || 0), 0);
  });

  actualTotalDuration = computed(() => {
    return this.sections().reduce((acc, section) => acc + (section.totalDuration || 0), 0);
  });

  canManageCourse = computed(() => {
    const user = this.currentUser();
    const courseData = this.course();

    if (!user || !courseData) return false;

    return user.role === 'admin' ||
      (user.role === 'instructor' && user.id === courseData.instructor?._id);
  });

  // --- CHECKOUT STATE ---
  showCheckoutModal = signal<boolean>(false);
  isProcessingPayment = signal<boolean>(false);

  checkoutForm: FormGroup = this.fb.group({
    cardName: ['', Validators.required],
    cardNumber: ['', [Validators.required, Validators.pattern('^[0-9]{16}$')]],
    expiry: ['', [Validators.required, Validators.pattern('^(0[1-9]|1[0-2])\/([0-9]{2})$')]],
    cvv: ['', [Validators.required, Validators.pattern('^[0-9]{3,4}$')]]
  });

  ngOnInit(): void {
    // 1. Track the logged-in user
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser.set(user);
        // If we get the user AFTER the course has loaded, check enrollment
        if (user && this.id) {
          this.verifyEnrollmentStatus(this.id);
        }
      });

    // 2. Fetch the course
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const identifier = params['id'] || params['slug'];
      if (identifier) this.loadCourse(identifier);
    });
  }

  private loadCourse(identifier: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    const isMongoId = /^[a-fA-F0-9]{24}$/.test(identifier);
    const request$ = isMongoId
      ? this.courseService.getCoursesById(identifier)
      : this.courseService.getCoursesBySlug(identifier);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const responseData = res?.data || res;
        const courseData = responseData.course || responseData.data || responseData;

        this.course.set(courseData);
        this.id = courseData._id || courseData.id;

        // Initial fallback from course endpoint
        this.isEnrolled.set(responseData.isEnrolled || false);
        this.isOwner.set(responseData.isOwner || false);
        this.userProgress.set(responseData.userProgress || 0);

        const sectionsWithUI = (responseData.sections || []).map((section: any, index: number) => ({
          ...section,
          expanded: index === 0,
          lessons: section.lessons || []
        }));

        this.sections.set(sectionsWithUI);
        this.isLoading.set(false);

        // 👉 NEW: Explicitly check the "my-enrollments" endpoint
        if (this.currentUser()) {
          this.verifyEnrollmentStatus(this.id);
        }
      },
      error: (err: any) => {
        this.error.set(err.error?.message || err.message || 'Course not found');
        this.isLoading.set(false);
      }
    });
  }

  private verifyEnrollmentStatus(courseId: string): void {
    if (this.isEnrolled()) return;

    // Use the optimized 'check' endpoint provided in your JSON!
    this.enrollmentService.checkEnrollment(courseId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res: any) => {
        // Based on the JSON you provided:
        if (res?.data?.isEnrolled === true) {
          this.isEnrolled.set(true);
        }
      },
      error: (err) => console.error('Failed to check enrollment', err)
    });
  }

  // /**
  //  * 👉 NEW METHOD:
  //  * Fetches /enrollments/my-enrollments and checks if the current course ID
  //  * is within the returned array.
  //  */
  // private verifyEnrollmentStatus(courseId: string): void {
  //   // If the course endpoint already told us we're enrolled, skip the extra API check
  //   if (this.isEnrolled()) return;

  //   this.enrollmentService.getMyEnrollments().pipe(
  //     takeUntilDestroyed(this.destroyRef)
  //   ).subscribe({
  //     next: (res: any) => {
  //       // Access the nested array from your JSON structure: data.enrollments
  //       const enrollments = res?.data?.enrollments || [];

  //       const isUserEnrolled = enrollments.some((enrollment: any) => {
  //         // Check if course is a populated object or string ID
  //         const enrolledCourseId = typeof enrollment.course === 'object' 
  //           ? enrollment.course._id 
  //           : enrollment.course;

  //         // Check for matching ID and ensure it's not revoked
  //         return enrolledCourseId === courseId && enrollment.isActive !== false && enrollment.isRevoked !== true;
  //       });

  //       // Update the signal to toggle the UI to "Continue Learning"
  //       if (isUserEnrolled) {
  //         this.isEnrolled.set(true);
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Failed to fetch enrollments for status check', err);
  //     }
  //   });
  // }

  // --- INSTRUCTOR ACTIONS ---
  publishCourse(): void {
    const c = this.course();
    if (!c || !confirm(`Are you sure you want to publish "${c.title}"?`)) return;
    this.courseService.publishCourses(c._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.course.update(course => course ? { ...course, isPublished: true } : course);
          this.messageService.add({
            severity: 'success', summary: 'Published!', detail: 'Course published successfully'
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error', summary: 'Failed', detail: 'Could not publish course'
          });
        }
      });
  }

  unpublishCourse(): void {
    const c = this.course();
    if (!c || !confirm(`Are you sure you want to unpublish "${c.title}"? It will no longer be visible to new students.`)) return;

    this.courseService.unpublishCourses(c._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.course.update(course => course ? { ...course, isPublished: false } : course);
          this.messageService.add({
            severity: 'info', summary: 'Unpublished', detail: 'Course is now hidden from the public catalog.'
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error', summary: 'Failed', detail: 'Could not unpublish course'
          });
        }
      });
  }

  previewCourse(): void {
    const c = this.course();
    if (c?.slug) window.open(`/courses/${c.slug}`, '_blank');
  }

  // --- ENROLLMENT / CHECKOUT LOGIC ---
  openCheckout(): void {
    this.checkoutForm.reset();
    if (this.course()?.isFree) {
      this.checkoutForm.clearValidators();
      Object.keys(this.checkoutForm.controls).forEach(key => {
        this.checkoutForm.get(key)?.clearValidators();
        this.checkoutForm.get(key)?.updateValueAndValidity();
      });
    }

    this.showCheckoutModal.set(true);
  }

  // processEnrollment(): void {
  //   if (!this.course()?.isFree && this.checkoutForm.invalid) {
  //     this.checkoutForm.markAllAsTouched();
  //     return;
  //   }

  //   this.isProcessingPayment.set(true);
  //   const courseId = this.course()?._id;
  //   if (!courseId) return;

  //   this.enrollmentService.enrollInCourse(courseId)
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe({
  //       next: (res: any) => {
  //         this.isProcessingPayment.set(false);
  //         this.showCheckoutModal.set(false);
  //         this.isEnrolled.set(true);

  //         this.messageService.add({
  //           severity: 'success', summary: 'Success!', detail: 'Enrollment complete. Taking you to the classroom...'
  //         });

  //         setTimeout(() => {
  //           this.router.navigate(['/courses/learn', this.course()?.slug || courseId]);
  //         }, 1500);
  //       },
  //       error: (err: any) => {
  //         this.isProcessingPayment.set(false);
  //         this.messageService.add({
  //           severity: 'error', summary: 'Enrollment Failed', detail: err?.error?.message || 'Could not complete enrollment.'
  //         });
  //       }
  //     });
  // }

  // processEnrollment(): void {
  //   const course = this.course();
  //   if (!course?._id) return;

  //   // For free courses - direct enrollment
  //   if (course.isFree) {
  //     this.enrollInCourse(course._id);
  //     return;
  //   }

  //   // For paid courses - validate payment form
  //   if (this.checkoutForm.invalid) {
  //     this.checkoutForm.markAllAsTouched();
  //     return;
  //   }

  //   this.isProcessingPayment.set(true);

  //   // Step 1: Create payment intent
  //   this.paymentService.createPaymentIntent(course._id, 'course')
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe({
  //       next: (response: any) => {
  //         const paymentData = response.data;

  //         // Step 2: Simulate payment processing (in real app, you'd use Stripe Elements here)
  //         this.simulatePaymentConfirmation(paymentData.paymentId);
  //       },
  //       error: (err: any) => {
  //         this.isProcessingPayment.set(false);
  //         this.messageService.add({
  //           severity: 'error',
  //           summary: 'Payment Initiation Failed',
  //           detail: err?.error?.message || 'Could not initiate payment process.'
  //         });
  //       }
  //     });
  // }
processEnrollment(): void {
  const course = this.course();
  if (!course?._id) return;

  // For free courses - direct enrollment
  if (course.isFree) {
    this.enrollInCourse(course._id);
    return;
  }

  // For paid courses - validate payment form
  if (this.checkoutForm.invalid) {
    this.checkoutForm.markAllAsTouched();
    return;
  }

  this.isProcessingPayment.set(true);
  const courseId = course._id;

  // Step 1: Create payment intent
  this.paymentService.createPaymentIntent(courseId, 'course')
    .pipe(
      switchMap((response: any) => {
        const paymentData = response.data;
        console.log('Payment intent created:', paymentData);
        
        // Step 2: Confirm payment (this creates the payment record in backend)
        return this.paymentService.confirmPayment(
          paymentData.paymentId, 
          'dummy_transaction_' + Date.now()
        );
      }),
      // Remove the enrollment call here - payment confirmation should handle enrollment
      // or the enrollment happens automatically on the backend
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe({
      next: (confirmResponse: any) => {
        console.log('Payment confirmed:', confirmResponse);
        
        this.isProcessingPayment.set(false);
        this.showCheckoutModal.set(false);
        this.isEnrolled.set(true);

        this.messageService.add({
          severity: 'success', 
          summary: 'Payment Successful!', 
          detail: 'Your payment has been processed. Taking you to the classroom...'
        });

        // Navigate directly to classroom - enrollment should be automatic
        setTimeout(() => {
          this.router.navigate(['/courses/learn', course.slug || courseId]);
        }, 1500);
      },
      error: (err: any) => {
        console.error('Payment failed:', err);
        this.isProcessingPayment.set(false);
        this.messageService.add({
          severity: 'error', 
          summary: 'Payment Failed', 
          detail: err?.error?.message || 'Could not complete payment process.'
        });
      }
    });
}
  /**
   * Simulate payment confirmation (for dummy/local testing)
   * In production, this would be replaced with actual Stripe payment confirmation
   */
  private simulatePaymentConfirmation(paymentId: string): void {
    // Simulate payment processing delay
    setTimeout(() => {
      // Step 3: Confirm the payment
      this.paymentService.confirmPayment(paymentId, 'dummy_transaction_' + Date.now())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res: any) => {
            this.isProcessingPayment.set(false);
            this.showCheckoutModal.set(false);

            this.messageService.add({
              severity: 'success',
              summary: 'Payment Successful!',
              detail: 'Your payment has been processed. Enrolling you now...'
            });

            // Step 4: Enroll in course (though payment confirmation might already handle this)
            this.enrollInCourse(this.course()!._id);
          },
          error: (err: any) => {
            this.isProcessingPayment.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Payment Failed',
              detail: err?.error?.message || 'Could not complete payment process.'
            });
          }
        });
    }, 2000); // Simulate 2 second payment processing
  }

  /**
   * Handle actual enrollment after successful payment
   */
  private enrollInCourse(courseId: string): void {
    this.enrollmentService.enrollInCourse(courseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.isProcessingPayment.set(false);
          this.showCheckoutModal.set(false);
          this.isEnrolled.set(true);

          this.messageService.add({
            severity: 'success',
            summary: 'Success!',
            detail: 'Enrollment complete. Taking you to the classroom...'
          });

          setTimeout(() => {
            this.router.navigate(['/courses/learn', this.course()?.slug || courseId]);
          }, 1500);
        },
        error: (err: any) => {
          this.isProcessingPayment.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Enrollment Failed',
            detail: err?.error?.message || 'Could not complete enrollment.'
          });
        }
      });
  }

  closeCheckout(): void {
    this.showCheckoutModal.set(false);
  }

  // --- UI HELPERS ---
  toggleSection(index: number): void {
    this.sections.update(secs =>
      secs.map((sec, i) => i === index ? { ...sec, expanded: !sec.expanded } : sec)
    );
  }

  getCourseStatus(): { label: string; severity: string; icon: string } {
    const c = this.course();
    if (!c) return { label: '', severity: '', icon: '' };
    if (c.isPublished && c.isApproved) { return { label: 'Published', severity: 'success', icon: 'pi pi-check-circle' }; }
    else if (c.isPublished) { return { label: 'Pending Approval', severity: 'warning', icon: 'pi pi-clock' }; }
    else { return { label: 'Draft', severity: 'info', icon: 'pi pi-pencil' }; }
  }

  getCategoryName(): string {
    const c = this.course();
    return !c?.category ? 'N/A' : typeof c.category === 'object' ? c.category.name : 'Loading...';
  }

  calculateDiscount(): number {
    const c = this.course();
    return (!c?.discountPrice || !c?.price) ? 0 : Math.round(((c.price - c.discountPrice) / c.price) * 100);
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }

  getLessonIcon(type: string): string {
    const icons: Record<string, string> = {
      'video': 'pi pi-video',
      'article': 'pi pi-file',
      'quiz': 'pi pi-question-circle',
      'assignment': 'pi pi-pencil',
      'coding-exercise': 'pi pi-code'
    };
    return icons[type] || 'pi pi-file';
  }

  editCourse(): void {
    const courseId = this.course()?._id;
    if (courseId) {
      this.router.navigate(['/instructor/courses', courseId, 'edit']);
    }
  }

  editPricing(): void {
    const courseId = this.course()?._id;
    if (courseId) {
      this.router.navigate(['/instructor/courses', courseId, 'edit'], {
        fragment: 'pricing'
      });
    }
  }

  editCurriculum(): void {
    const courseId = this.course()?._id;
    if (courseId) {
      this.router.navigate(['/instructor/courses', courseId, 'curriculum']);
    }
  }

  retry(): void {
    const id = this.route.snapshot.params['id'];
    if (id) this.loadCourse(id);
  }

  goToLearning(): void {
    const course = this.course();
    if (course) {
      this.router.navigate(['/courses/learn', this.course()?.slug || course._id]);
    }
  }

  goAnalytics(): void {
    const course = this.course();
    if (course) {
      this.router.navigate(['/courses/analytics', this.id]);
    }
  }

  playPreview(): void {
    const course = this.course();

    if (!course?.previewVideo) {
      return;
    }

    if (this.isYouTubeUrl(course.previewVideo)) {
      const videoId = this.extractYouTubeId(course.previewVideo);
      this.openVideoModal('youtube', videoId);
    }
    else if (this.isVimeoUrl(course.previewVideo)) {
      const videoId = this.extractVimeoId(course.previewVideo);
      this.openVideoModal('vimeo', videoId);
    }
    else {
      this.openVideoModal('direct', course.previewVideo);
    }
  }

  private isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  private isVimeoUrl(url: string): boolean {
    return url.includes('vimeo.com');
  }

  private extractYouTubeId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  }

  private extractVimeoId(url: string): string {
    const regExp = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[5] : url;
  }

  private openVideoModal(type: 'youtube' | 'vimeo' | 'direct', id: string): void {
    this.showVideoModal.set(true);
    this.videoType.set(type);
    this.videoId.set(id);
  }

  closeVideoModal(): void {
    this.showVideoModal.set(false);
    this.videoType.set(null);
    this.videoId.set('');
  }

  // openQuizBuilder(): void {
  //   const courseData = this.course();

  //   if (!courseData?._id) {
  //     console.error('Course ID not found');
  //     return;
  //   }

  //   const courseId = courseData._id;

  //   // Show loading state
  //   this.isLoading.set(true);

  //   // Check if course has a quiz
  //   this.quizService.getQuizById(courseId).subscribe({
  //     next: (response: any) => {
  //       this.isLoading.set(false);

  //       // Navigate using the correct route structure: /courses/:courseId/quiz/:id
  //       if (response?.data?.quiz?._id || response?.data?._id) {
  //         const quizId = response.data.quiz?._id || response.data._id;
  //         // Edit existing quiz
  //         this.router.navigate(['/courses', courseId, 'quiz', quizId]);
  //       } else {
  //         // Create new quiz
  //         this.router.navigate(['/courses', courseId, 'quiz', 'new']);
  //       }
  //     },
  //     error: (error) => {
  //       this.isLoading.set(false);
  //       console.error('Error checking for existing quiz:', error);

  //       // If error (404 means no quiz), navigate to create new
  //       if (error.status === 404) {
  //         this.router.navigate(['/courses', courseId, 'quiz', 'new']);
  //       } else {
  //         this.messageService.add({
  //           severity: 'error',
  //           summary: 'Error',
  //           detail: 'Failed to check for existing quiz'
  //         });
  //       }
  //     }
  //   });
  // }

  openQuizBuilder(): void {
    const courseData = this.course();

    if (!courseData?._id) {
      console.error('Course ID not found');
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Cannot open quiz builder: Course ID not found'
      });
      return;
    }

    const courseId = courseData._id;
    if (courseData.quiz?._id || courseData.quizId) {
      const quizId = courseData.quiz?._id || courseData.quizId;
      this.router.navigate(['/courses', courseId, 'quiz', quizId]);
    } else {
      this.router.navigate(['/courses', courseId, 'quiz', 'new']);
    }
  }
}