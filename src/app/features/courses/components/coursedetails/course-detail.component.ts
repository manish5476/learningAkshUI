import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
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
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  // Add these properties to your component
  showVideoModal = signal<boolean>(false);
  videoType = signal<'youtube' | 'vimeo' | 'direct' | null>(null);
  videoId = signal<string>('');
  // Core State
  course = signal<Course | undefined>(undefined);
  sections = signal<SectionWithUI[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);


  // Replace isInstructorMode boolean with currentUser signal
  currentUser = signal<any>(null);
  isEnrolled = signal<boolean>(false);
  isOwner = signal<boolean>(false);
  userProgress = signal<number>(0);
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

    // Admin can edit anything. Instructor can edit if they own it.
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
      .subscribe(user => this.currentUser.set(user));

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
      },
      error: (err: any) => {
        this.error.set(err.error?.message || err.message || 'Course not found');
        this.isLoading.set(false);
      }
    });
  }

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
            severity: 'success',
            summary: 'Published!',
            detail: 'Course published successfully'
          });
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: 'Could not publish course'
          });
        }
      });
  }

  // Add this new method:
  unpublishCourse(): void {
    const c = this.course();
    if (!c || !confirm(`Are you sure you want to unpublish "${c.title}"? It will no longer be visible to new students.`)) return;

    // Assuming you have an unpublish method in your service. If not, you might need to use an updateCourse method.
    this.courseService.unpublishCourses(c._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.course.update(course => course ? { ...course, isPublished: false } : course);
          this.messageService.add({
            severity: 'info',
            summary: 'Unpublished',
            detail: 'Course is now hidden from the public catalog.'
          });
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Failed',
            detail: 'Could not unpublish course'
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

  //   // Simulate payment processing
  //   setTimeout(() => {
  //     this.isProcessingPayment.set(false);
  //     this.showCheckoutModal.set(false);
  //     this.isEnrolled.set(true);

  //     this.messageService.add({
  //       severity: 'success',
  //       summary: 'Success!',
  //       detail: 'Enrollment complete. Taking you to the classroom...'
  //     });

  //     setTimeout(() => {
  //       this.router.navigate(['/courses/learn', this.course()?.slug || courseId]);
  //     }, 1500);
  //   }, 2000);
  // }

  processEnrollment(): void {
    // 1. Validate the form for paid courses
    if (!this.course()?.isFree && this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isProcessingPayment.set(true);
    const courseId = this.course()?._id;
    if (!courseId) return;

    // 2. Call the real backend API
    this.enrollmentService.enrollInCourse(courseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.isProcessingPayment.set(false);
          this.showCheckoutModal.set(false);

          // Instantly update the UI state
          this.isEnrolled.set(true);

          this.messageService.add({
            severity: 'success',
            summary: 'Success!',
            detail: 'Enrollment complete. Taking you to the classroom...'
          });

          // 3. Navigate to the player (Aligning with your goToLearning route)
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

    if (c.isPublished && c.isApproved) {
      return { label: 'Published', severity: 'success', icon: 'pi pi-check-circle' };
    } else if (c.isPublished) {
      return { label: 'Pending Approval', severity: 'warning', icon: 'pi pi-clock' };
    } else {
      return { label: 'Draft', severity: 'info', icon: 'pi pi-pencil' };
    }
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

  // Navigation
  editCourse(): void {
    const courseId = this.course()?._id;
    if (courseId) {
      this.router.navigate(['/instructor/courses', courseId, 'edit']);
    }
  }

  editPricing(): void {
    const courseId = this.course()?._id;
    if (courseId) {
      // Corrected path: /instructor/courses/:id/edit#pricing
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

  /**
   * Checks if URL is a Vimeo link
   */
  private isVimeoUrl(url: string): boolean {
    return url.includes('vimeo.com');
  }

  /**
   * Extracts YouTube video ID from various URL formats
   */
  private extractYouTubeId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  }

  /**
   * Extracts Vimeo video ID from URL
   */
  private extractVimeoId(url: string): string {
    const regExp = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[5] : url;
  }

  /**
   * Opens video in modal or new tab
   */
  private openVideoModal(type: 'youtube' | 'vimeo' | 'direct', id: string): void {
    // Option 1: Open in a modal dialog
    this.showVideoModal.set(true)// = true;
    this.videoType.set(type) //= type;
    this.videoId.set(id)// = id;

    // Option 2: Or open in new tab for external videos
    if (type === 'youtube') {
      window.open(`https://www.youtube.com/embed/${id}`, '_blank');
    } else if (type === 'vimeo') {
      window.open(`https://player.vimeo.com/video/${id}`, '_blank');
    } else {
      // For direct video files, you might want to open in a video player
      window.open(id, '_blank');
    }
  }

  /**
   * Alternative: Using a service to handle video playback
   */
  playPreviewWithService(): void {
    const course = this.course();

    if (!course?.previewVideo) {
      return;
    }

    // If you have a video player service/component
    // this.videoPlayerService.playPreview({
    //   url: course.previewVideo,
    //   title: course.title,
    //   thumbnail: course.thumbnail
    // });
  }

  closeVideoModal(): void {
    this.showVideoModal.set(false);
    this.videoType.set(null);
    this.videoId.set('');
  }
}
