import { Component, OnInit, inject, DestroyRef, signal, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DecimalPipe, NgClass, TitleCasePipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { switchMap, of, catchError, forkJoin, map, Observable, shareReplay } from 'rxjs';

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
import { Card } from "primeng/card";
import { ConfirmDialog } from "primeng/confirmdialog";

// Models & Services
import { Course, Section, Lesson } from '../../../../core/models/course.model';
import { CourseService } from '../../../../core/services/course.service';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CourseDiscussionComponent } from "../course-discussion/course-discussion.component";
import { QuizService } from '../../../../core/services/quiz.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { MasterApiService } from '../../../../core/services/master-list.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, CurrencyPipe, NgClass,
    DialogModule, InputTextModule, ButtonModule, TagModule, ToastModule,
    TooltipModule, AccordionModule, DividerModule, SkeletonModule,
    CourseDiscussionComponent, Card,
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
  private masterApi = inject(MasterApiService);

  private masterDataCache = new Map<string, Observable<any>>();

  showVideoModal = signal<boolean>(false);
  videoType = signal<'youtube' | 'vimeo' | 'direct' | null>(null);
  videoId = signal<string>('');

  course = signal<any | undefined>(undefined);
  sections = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  currentUser = signal<any>(null);
  isEnrolled = signal<boolean>(false);
  isOwner = signal<boolean>(false);
  userProgress = signal<number>(0);
  id: string | null = null;

  actualTotalLessons = computed(() => this.sections().reduce((acc, section) => acc + (section.lessons?.length || 0), 0));
  actualTotalDuration = computed(() => this.sections().reduce((acc, section) => acc + (section.totalDuration || 0), 0));

  canManageCourse = computed(() => {
    const user = this.currentUser();
    const courseData = this.course();

    if (!user || !courseData) return false;
    if (user.role === 'admin') return true;

    if (courseData.primaryInstructor &&
      (typeof courseData.primaryInstructor === 'object'
        ? courseData.primaryInstructor._id === user.id
        : courseData.primaryInstructor === user.id)) {
      return true;
    }

    return courseData.instructors?.some(
      (inst: any) =>
        (typeof inst.instructor === 'object'
          ? inst.instructor._id === user.id
          : inst.instructor === user.id) &&
        inst.isActive &&
        (inst.permissions?.canEditCourse || inst.role === 'primary')
    ) || false;
  });

  showCheckoutModal = signal<boolean>(false);
  isProcessingPayment = signal<boolean>(false);

  checkoutForm: FormGroup = this.fb.group({
    cardName: ['', Validators.required],
    cardNumber: ['', [Validators.required, Validators.pattern('^[0-9]{16}$')]],
    expiry: ['', [Validators.required, Validators.pattern('^(0[1-9]|1[0-2])\/([0-9]{2})$')]],
    cvv: ['', [Validators.required, Validators.pattern('^[0-9]{3,4}$')]]
  });

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        this.currentUser.set(user);
        if (user && this.id) {
          this.verifyEnrollmentStatus(this.id);
        }
      });

    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const identifier = params['id'] || params['slug'];
      if (identifier) this.loadCourse(identifier);
    });
  }

  private enrichCourseWithMasterData(courseData: any): Observable<any> {
    if (!courseData) return of(courseData);

    const requests: { [key: string]: Observable<any> } = {};

    if (courseData.category) requests['category'] = this.getMasterValuesWithCache('course_category');
    if (courseData.level) requests['levels'] = this.getMasterValuesWithCache('course_level');
    if (courseData.language) requests['languages'] = this.getMasterValuesWithCache('language');
    if (courseData.currency) requests['currencies'] = this.getMasterValuesWithCache('currency');

    if (Object.keys(requests).length === 0) return of(courseData);

    return forkJoin(requests).pipe(
      map((results: any) => {
        if (results.category?.data) {
          const categories = results.category.data as any[];
          const category = categories.find(c => c.value === courseData.category || c._id === courseData.category);
          courseData.categoryLabel = category?.label || category?.name || courseData.category;
        }

        if (results.levels?.data) {
          const levels = results.levels.data as any[];
          const level = levels.find(l => l.value === courseData.level || l.code === courseData.level);
          courseData.levelLabel = level?.label || level?.name || courseData.level;
          courseData.levelMetadata = level?.metadata;
        }

        if (results.languages?.data) {
          const languages = results.languages.data as any[];
          const language = languages.find(l => l.value === courseData.language || l.code === courseData.language);
          courseData.languageLabel = language?.label || language?.name || courseData.language;
          courseData.languageMetadata = language?.metadata;
        }

        if (results.currencies?.data) {
          const currencies = results.currencies.data as any[];
          const currency = currencies.find(c => c.value === courseData.currency || c.code === courseData.currency);
          courseData.currencySymbol = currency?.metadata?.symbol || courseData.currency;
          courseData.currencyMetadata = currency?.metadata;
        }

        return courseData;
      }),
      catchError((error) => {
        console.error('Error enriching course with master data:', error);
        return of(courseData);
      })
    );
  }

  // ✅ FIX 1: Uncommented and fixed caching function to prevent 'undefined' stream errors
  private getMasterValuesWithCache(masterName: string): Observable<any> {
    const cacheKey = masterName;

    if (!this.masterDataCache.has(cacheKey)) {
      const request = this.masterApi.getPublicValues(masterName).pipe(
        catchError(error => {
          console.error(`Error fetching ${masterName}:`, error);
          return of({ data: [] });
        }),
        shareReplay(1)
      );
      this.masterDataCache.set(cacheKey, request);
    }

    return this.masterDataCache.get(cacheKey)!;
  }

  getMasterValueLabel(masterName: string, value: string): Observable<string> {
    return this.getMasterValuesWithCache(masterName).pipe(
      map((response: any) => {
        const values = response.data as any[];
        const found = values.find(v => v.value === value || v.code === value);
        return found?.label || found?.name || value;
      })
    );
  }

  getMasterValueMetadata(masterName: string, value: string): Observable<any> {
    return this.getMasterValuesWithCache(masterName).pipe(
      map((response: any) => {
        const values = response.data as any[];
        const found = values.find(v => v.value === value || v.code === value);
        return found?.metadata || null;
      })
    );
  }

  private verifyEnrollmentStatus(courseId: string): void {
    if (this.isEnrolled()) return;

    this.enrollmentService.checkEnrollment(courseId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res: any) => {
        if (res?.data?.isEnrolled === true) {
          this.isEnrolled.set(true);
          this.userProgress.set(res?.data?.progress || 0);
        }
      },
      error: (err) => console.error('Failed to check enrollment', err)
    });
  }

  publishCourse(): void {
    const c = this.course();
    if (!c || !confirm(`Are you sure you want to publish "${c.title}"?`)) return;

    this.courseService.publishCourse(c._id!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.course.update(course => course ? { ...course, isPublished: true } : course);
          this.messageService.add({ severity: 'success', summary: 'Published!', detail: 'Course published successfully' });
        },
        error: (error) => this.messageService.add({ severity: 'error', summary: 'Failed', detail: error.message || 'Could not publish course' })
      });
  }

  unpublishCourse(): void {
    const c = this.course();
    if (!c || !confirm(`Are you sure you want to unpublish "${c.title}"?`)) return;

    this.courseService.unpublishCourse(c._id!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.course.update(course => course ? { ...course, isPublished: false } : course);
          this.messageService.add({ severity: 'info', summary: 'Unpublished', detail: 'Course is now hidden.' });
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Failed', detail: 'Could not unpublish course' })
      });
  }

  previewCourse(): void {
    const c = this.course();
    if (c?.slug) window.open(`/courses/${c.slug}`, '_blank');
  }

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

  processEnrollment(): void {
    const course = this.course();
    if (!course?._id) return;

    if (course.isFree) {
      this.enrollInCourse(course._id);
      return;
    }

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isProcessingPayment.set(true);
    const courseId = course._id;

    this.paymentService.createPaymentIntent(courseId, 'course')
      .pipe(
        switchMap((response: any) => this.paymentService.confirmPayment(response.data.paymentId, 'dummy_transaction_' + Date.now())),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.isProcessingPayment.set(false);
          this.showCheckoutModal.set(false);
          this.isEnrolled.set(true);
          this.messageService.add({ severity: 'success', summary: 'Payment Successful!', detail: 'Taking you to the classroom...' });
          setTimeout(() => this.router.navigate(['/courses/learn', course.slug || courseId]), 1500);
        },
        error: (err: any) => {
          this.isProcessingPayment.set(false);
          this.messageService.add({ severity: 'error', summary: 'Payment Failed', detail: err?.error?.message || 'Could not complete payment.' });
        }
      });
  }

  private enrollInCourse(courseId: string): void {
    this.enrollmentService.enrollInCourse(courseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isProcessingPayment.set(false);
          this.showCheckoutModal.set(false);
          this.isEnrolled.set(true);
          this.messageService.add({ severity: 'success', summary: 'Success!', detail: 'Enrollment complete.' });
          setTimeout(() => this.router.navigate(['/courses/learn', this.course()?.slug || courseId]), 1500);
        },
        error: (err: any) => {
          this.isProcessingPayment.set(false);
          this.messageService.add({ severity: 'error', summary: 'Enrollment Failed', detail: err?.error?.message || 'Could not complete enrollment.' });
        }
      });
  }

  closeCheckout(): void {
    this.showCheckoutModal.set(false);
  }

  toggleSection(index: number): void {
    this.sections.update(secs => secs.map((sec, i) => i === index ? { ...sec, expanded: !sec.expanded } : sec));
  }

  getCourseStatus(): { label: string; severity: string; icon: string } {
    const c = this.course();
    if (!c) return { label: '', severity: '', icon: '' };
    if (c.isPublished && c.isApproved) return { label: 'Published', severity: 'success', icon: 'pi pi-check-circle' };
    else if (c.isPublished) return { label: 'Pending Approval', severity: 'warning', icon: 'pi pi-clock' };
    return { label: 'Draft', severity: 'info', icon: 'pi pi-pencil' };
  }

  getCategoryName(): any {
    const c = this.course();
    if (!c?.category) return 'N/A';
    return c.categoryLabel || (typeof c.category === 'object' ? c.category.name : c.category) || 'General';
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
      'VIDEO': 'pi pi-play-circle',
      'ARTICLE': 'pi pi-file-pdf',
      'QUIZ': 'pi pi-question-circle',
      'ASSIGNMENT': 'pi pi-file',
      'CODING-EXERCISE': 'pi pi-code'
    };
    return icons[type?.toUpperCase()] || 'pi pi-file';
  }

  getLessonTypeLabel(type: string): Observable<string> {
    return this.getMasterValueLabel('LESSON_TYPE', type);
  }

  editCourse(): void {
    const courseId = this.course()?._id;
    if (courseId) this.router.navigate(['/instructor/courses', courseId, 'edit']);
  }

  editPricing(): void {
    const courseId = this.course()?._id;
    if (courseId) this.router.navigate(['/instructor/courses', courseId, 'edit'], { fragment: 'pricing' });
  }

  editCurriculum(): void {
    const courseId = this.course()?._id;
    if (courseId) this.router.navigate(['/instructor/courses', courseId, 'curriculum']);
  }

  retry(): void {
    const id = this.route.snapshot.params['id'];
    if (id) this.loadCourse(id);
  }

  goToLearning(): void {
    const course = this.course();
    if (course) this.router.navigate(['/courses/learn', course.slug || course._id]);
  }

  goAnalytics(): void {
    const course = this.course();
    if (course) this.router.navigate(['/instructor/analytics', this.id]);
  }

  playPreview(): void {
    const course = this.course();
    if (!course?.previewVideo) return;

    if (this.isYouTubeUrl(course.previewVideo)) {
      this.openVideoModal('youtube', this.extractYouTubeId(course.previewVideo));
    } else if (this.isVimeoUrl(course.previewVideo)) {
      this.openVideoModal('vimeo', this.extractVimeoId(course.previewVideo));
    } else {
      this.openVideoModal('direct', course.previewVideo);
    }
  }

  private isYouTubeUrl(url: string): boolean { return url.includes('youtube.com') || url.includes('youtu.be'); }
  private isVimeoUrl(url: string): boolean { return url.includes('vimeo.com'); }
  private extractYouTubeId(url: string): string {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? match[2] : url;
  }
  private extractVimeoId(url: string): string {
    const match = url.match(/^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/);
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

  openQuizBuilder(): void {
    const courseData = this.course();
    if (!courseData?._id) return;

    // ✅ CORRECT: Matches your :courseId/quiz/new route
    this.router.navigate(['/courses', courseData._id, 'quiz', 'new']);
  }

  viewInstructors(): void {
    const courseId = this.course()?._id;
    if (courseId) this.router.navigate(['/instructor/courses', courseId, 'instructors']);
  }

  private loadCourse(identifier: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    const isMongoId = /^[a-fA-F0-9]{24}$/.test(identifier);
    const request$ = isMongoId
      ? this.courseService.getCourseById(identifier, { skipAuth: true })
      : this.courseService.getCoursesBySlug(identifier);

    request$.pipe(
      switchMap((response: any) => {
        const responseData = response?.data || response;
        const courseData = responseData?.course || responseData;
        const sectionsData = responseData?.sections || [];

        return this.enrichCourseWithMasterData({ ...courseData, sections: sectionsData });
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (enrichedCourse: any) => {
        this.course.set(enrichedCourse);
        this.id = enrichedCourse._id || enrichedCourse.id;

        this.checkIfUserIsInstructor(enrichedCourse);
        if (this.currentUser() && this.id) this.verifyEnrollmentStatus(this.id);

        const sectionsWithUI = (enrichedCourse.sections || []).map((section: any, index: number) => ({
          ...section,
          expanded: index === 0,
          lessons: section.lessons || []
        }));

        this.sections.set(sectionsWithUI);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading course:', err);
        this.error.set(err.error?.message || err.message || 'Course not found');
        this.isLoading.set(false);
      }
    });
  }

  private checkIfUserIsInstructor(courseData: any): void {
    const user = this.currentUser();
    if (!user || !courseData) return;

    if (user.role === 'admin') {
      this.isOwner.set(true);
      return;
    }

    if (courseData.instructor) {
      const instructorId = typeof courseData.instructor === 'object' ? courseData.instructor._id : courseData.instructor;
      this.isOwner.set(instructorId === user.id);
    }
  }

  getInstructorName(instructor: any): string {
    if (!instructor) return 'Unknown Instructor';
    if (typeof instructor === 'object') return `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || 'Instructor';
    return 'Instructor';
  }

  getInstructorInitials(instructor: any): string {
    if (!instructor) return 'IN';
    if (typeof instructor === 'object') {
      const first = instructor.firstName?.charAt(0) || '';
      const last = instructor.lastName?.charAt(0) || '';
      return (first + last) || 'IN';
    }
    return 'IN';
  }

  getInstructorId(instructor: any): string {
    if (!instructor) return '';
    return typeof instructor === 'object' ? instructor._id : instructor;
  }
}





// import { Component, OnInit, inject, DestroyRef, signal, computed, effect } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule, CurrencyPipe, DecimalPipe, NgClass, TitleCasePipe, DatePipe } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { switchMap, of, catchError, forkJoin, map, Observable, shareReplay } from 'rxjs';

// // PrimeNG
// import { DialogModule } from 'primeng/dialog';
// import { InputTextModule } from 'primeng/inputtext';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { ToastModule } from 'primeng/toast';
// import { TooltipModule } from 'primeng/tooltip';
// import { AccordionModule } from 'primeng/accordion';
// import { DividerModule } from 'primeng/divider';
// import { SkeletonModule } from 'primeng/skeleton';
// import { MessageService } from 'primeng/api';
// import { Card } from "primeng/card";
// import { ConfirmDialog } from "primeng/confirmdialog";

// // Models & Services
// import { Course, Section, Lesson } from '../../../../core/models/course.model';
// import { CourseService } from '../../../../core/services/course.service';
// import { EnrollmentService } from '../../../../core/services/enrollment.service';
// import { AuthService } from '../../../../core/services/auth.service';
// import { CourseDiscussionComponent } from "../course-discussion/course-discussion.component";
// import { QuizService } from '../../../../core/services/quiz.service';
// import { PaymentService } from '../../../../core/services/payment.service';
// import { MasterApiService } from '../../../../core/services/master-list.service';

// // interface any extends Section {
// //   expanded?: boolean;
// //   lessons?: Lesson[];
// //   isPublished?: boolean;
// // }

// // interface any extends Course {
// //   sections?: any[];
// //   categoryLabel?: string;
// //   levelLabel?: string;
// //   languageLabel?: string;
// //   currencySymbol?: string;
// //   levelMetadata?: any;
// //   languageMetadata?: any;
// //   currencyMetadata?: any;
// // }

// @Component({
//   selector: 'app-course-detail',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ReactiveFormsModule,
//     CurrencyPipe,
//     NgClass,
//     DialogModule,
//     InputTextModule,
//     ButtonModule,
//     TagModule,
//     ToastModule,
//     TooltipModule,
//     AccordionModule,
//     DividerModule,
//     SkeletonModule,
//     CourseDiscussionComponent,
//     Card,
//   ],
//   providers: [MessageService],
//   templateUrl: './course-detail.component.html',
//   styleUrls: ['./course-detail.component.scss']
// })
// export class CourseDetailComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private fb = inject(FormBuilder);
//   private courseService = inject(CourseService);
//   private enrollmentService = inject(EnrollmentService);
//   private messageService = inject(MessageService);
//   private quizService = inject(QuizService);
//   private destroyRef = inject(DestroyRef);
//   private authService = inject(AuthService);
//   private paymentService = inject(PaymentService);
//   private masterApi = inject(MasterApiService);

//   // Cache for master data to avoid repeated calls
//   private masterDataCache = new Map<string, any>();

//   showVideoModal = signal<boolean>(false);
//   videoType = signal<'youtube' | 'vimeo' | 'direct' | null>(null);
//   videoId = signal<string>('');

//   // Core State
//   course = signal<any | undefined>(undefined);
//   sections = signal<any[]>([]);
//   isLoading = signal<boolean>(true);
//   error = signal<string | null>(null);

//   currentUser = signal<any>(null);
//   isEnrolled = signal<boolean>(false);
//   isOwner = signal<boolean>(false);
//   userProgress = signal<number>(0);
//   id: string | null = null;

//   // Stats
//   actualTotalLessons = computed(() => {
//     return this.sections().reduce((acc, section) => acc + (section.lessons?.length || 0), 0);
//   });

//   actualTotalDuration = computed(() => {
//     return this.sections().reduce((acc, section) => acc + (section.totalDuration || 0), 0);
//   });

//   canManageCourse = computed(() => {
//     const user = this.currentUser();
//     const courseData = this.course();

//     if (!user || !courseData) return false;

//     // Check if user is admin
//     if (user.role === 'admin') return true;

//     // Check if user is primary instructor
//     if (courseData.primaryInstructor &&
//       (typeof courseData.primaryInstructor === 'object'
//         ? courseData.primaryInstructor._id === user.id
//         : courseData.primaryInstructor === user.id)) {
//       return true;
//     }

//     // Check if user is an instructor with edit permissions
//     return courseData.instructors?.some(
//       (inst: any) =>
//         (typeof inst.instructor === 'object'
//           ? inst.instructor._id === user.id
//           : inst.instructor === user.id) &&
//         inst.isActive &&
//         (inst.permissions?.canEditCourse || inst.role === 'primary')
//     ) || false;
//   });

//   // --- CHECKOUT STATE ---
//   showCheckoutModal = signal<boolean>(false);
//   isProcessingPayment = signal<boolean>(false);

//   checkoutForm: FormGroup = this.fb.group({
//     cardName: ['', Validators.required],
//     cardNumber: ['', [Validators.required, Validators.pattern('^[0-9]{16}$')]],
//     expiry: ['', [Validators.required, Validators.pattern('^(0[1-9]|1[0-2])\/([0-9]{2})$')]],
//     cvv: ['', [Validators.required, Validators.pattern('^[0-9]{3,4}$')]]
//   });

//   ngOnInit(): void {
//     // 1. Track the logged-in user
//     this.authService.currentUser$
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(user => {
//         this.currentUser.set(user);
//         if (user && this.id) {
//           this.verifyEnrollmentStatus(this.id);
//         }
//       });

//     // 2. Fetch the course
//     this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
//       const identifier = params['id'] || params['slug'];
//       if (identifier) this.loadCourse(identifier);
//     });
//   }

//   /**
//    * Enrich course with master data labels using MasterApiService
//    */
//   private enrichCourseWithMasterData(courseData: any): Observable<any> {
//     if (!courseData) return of(courseData);

//     // Create an object to hold all master data requests
//     const requests: { [key: string]: Observable<any> } = {};

//     // Only request if we have the values
//     if (courseData.category) {
//       requests['category'] = this.getMasterValuesWithCache('COURSE_CATEGORY');
//     }

//     if (courseData.level) {
//       requests['levels'] = this.getMasterValuesWithCache('COURSE_LEVEL');
//     }

//     if (courseData.language) {
//       requests['languages'] = this.getMasterValuesWithCache('LANGUAGE');
//     }

//     if (courseData.currency) {
//       requests['currencies'] = this.getMasterValuesWithCache('CURRENCY');
//     }

//     // If no requests needed, return course data as is
//     if (Object.keys(requests).length === 0) {
//       return of(courseData);
//     }

//     // Execute all requests in parallel
//     return forkJoin(requests).pipe(
//       map((results: any) => {
//         // Enrich with category label
//         if (results.category?.data) {
//           const categories = results.category.data as any[];
//           const category = categories.find(c => c.value === courseData.category);
//           courseData.categoryLabel = category?.label || courseData.category;
//         }

//         // Enrich with level label and metadata
//         if (results.levels?.data) {
//           const levels = results.levels.data as any[];
//           const level = levels.find(l => l.value === courseData.level);
//           courseData.levelLabel = level?.label || courseData.level;
//           courseData.levelMetadata = level?.metadata;
//         }

//         // Enrich with language label and metadata
//         if (results.languages?.data) {
//           const languages = results.languages.data as any[];
//           const language = languages.find(l => l.value === courseData.language);
//           courseData.languageLabel = language?.label || courseData.language;
//           courseData.languageMetadata = language?.metadata;
//         }

//         // Enrich with currency symbol
//         if (results.currencies?.data) {
//           const currencies = results.currencies.data as any[];
//           const currency = currencies.find(c => c.value === courseData.currency);
//           courseData.currencySymbol = currency?.metadata?.symbol || courseData.currency;
//           courseData.currencyMetadata = currency?.metadata;
//         }

//         return courseData;
//       }),
//       catchError((error) => {
//         console.error('Error enriching course with master data:', error);
//         return of(courseData); // Return original course data on error
//       })
//     );
//   }

//   /**
//    * Get master values with caching
//    */
//   private getMasterValuesWithCache(masterName: string): Observable<any> {
//     const cacheKey = masterName;

//     // if (!this.masterDataCache.has(cacheKey)) {
//     //   const request = this.masterApi.getPublicMasterValues(masterName, {
//     //     params: { includeMetadata: true }
//     //   }).pipe(
//     //     catchError(error => {
//     //       console.error(`Error fetching ${masterName}:`, error);
//     //       return of({ data: [] });
//     //     }),
//     //     shareReplay(1) // Cache and share the result
//     //   );

//     //   this.masterDataCache.set(cacheKey, request);
//     // }

//     return this.masterDataCache.get(cacheKey)!;
//   }

//   /**
//    * Get master value label with metadata
//    */
//   getMasterValueLabel(masterName: string, value: string): Observable<string> {
//     return this.getMasterValuesWithCache(masterName).pipe(
//       map((response: any) => {
//         const values = response.data as any[];
//         const found = values.find(v => v.value === value);
//         return found?.label || value;
//       })
//     );
//   }

//   /**
//    * Get master value metadata
//    */
//   getMasterValueMetadata(masterName: string, value: string): Observable<any> {
//     return this.getMasterValuesWithCache(masterName).pipe(
//       map((response: any) => {
//         const values = response.data as any[];
//         const found = values.find(v => v.value === value);
//         return found?.metadata || null;
//       })
//     );
//   }

//   private verifyEnrollmentStatus(courseId: string): void {
//     if (this.isEnrolled()) return;

//     this.enrollmentService.checkEnrollment(courseId).pipe(
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe({
//       next: (res: any) => {
//         if (res?.data?.isEnrolled === true) {
//           this.isEnrolled.set(true);
//           this.userProgress.set(res?.data?.progress || 0);
//         }
//       },
//       error: (err) => console.error('Failed to check enrollment', err)
//     });
//   }

//   publishCourse(): void {
//     const c = this.course();
//     if (!c || !confirm(`Are you sure you want to publish "${c.title}"?`)) return;

//     this.courseService.publishCourse(c._id!)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (response) => {
//           this.course.update(course => course ? { ...course, isPublished: true } : course);
//           this.messageService.add({
//             severity: 'success',
//             summary: 'Published!',
//             detail: 'Course published successfully'
//           });
//         },
//         error: (error) => {
//           this.messageService.add({
//             severity: 'error',
//             summary: 'Failed',
//             detail: error.message || 'Could not publish course'
//           });
//         }
//       });
//   }

//   unpublishCourse(): void {
//     const c = this.course();
//     if (!c || !confirm(`Are you sure you want to unpublish "${c.title}"? It will no longer be visible to new students.`)) return;

//     this.courseService.unpublishCourse(c._id!)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: () => {
//           this.course.update(course => course ? { ...course, isPublished: false } : course);
//           this.messageService.add({
//             severity: 'info',
//             summary: 'Unpublished',
//             detail: 'Course is now hidden from the public catalog.'
//           });
//         },
//         error: () => {
//           this.messageService.add({
//             severity: 'error',
//             summary: 'Failed',
//             detail: 'Could not unpublish course'
//           });
//         }
//       });
//   }

//   previewCourse(): void {
//     const c = this.course();
//     if (c?.slug) window.open(`/courses/${c.slug}`, '_blank');
//   }

//   // --- ENROLLMENT / CHECKOUT LOGIC ---
//   openCheckout(): void {
//     this.checkoutForm.reset();
//     if (this.course()?.isFree) {
//       this.checkoutForm.clearValidators();
//       Object.keys(this.checkoutForm.controls).forEach(key => {
//         this.checkoutForm.get(key)?.clearValidators();
//         this.checkoutForm.get(key)?.updateValueAndValidity();
//       });
//     }

//     this.showCheckoutModal.set(true);
//   }

//   processEnrollment(): void {
//     const course = this.course();
//     if (!course?._id) return;

//     // For free courses - direct enrollment
//     if (course.isFree) {
//       this.enrollInCourse(course._id);
//       return;
//     }

//     // For paid courses - validate payment form
//     if (this.checkoutForm.invalid) {
//       this.checkoutForm.markAllAsTouched();
//       return;
//     }

//     this.isProcessingPayment.set(true);
//     const courseId = course._id;

//     // Step 1: Create payment intent
//     this.paymentService.createPaymentIntent(courseId, 'course')
//       .pipe(
//         switchMap((response: any) => {
//           const paymentData = response.data;
//           console.log('Payment intent created:', paymentData);

//           // Step 2: Confirm payment
//           return this.paymentService.confirmPayment(
//             paymentData.paymentId,
//             'dummy_transaction_' + Date.now()
//           );
//         }),
//         takeUntilDestroyed(this.destroyRef)
//       )
//       .subscribe({
//         next: (confirmResponse: any) => {
//           console.log('Payment confirmed:', confirmResponse);

//           this.isProcessingPayment.set(false);
//           this.showCheckoutModal.set(false);
//           this.isEnrolled.set(true);

//           this.messageService.add({
//             severity: 'success',
//             summary: 'Payment Successful!',
//             detail: 'Your payment has been processed. Taking you to the classroom...'
//           });

//           // Navigate directly to classroom
//           setTimeout(() => {
//             this.router.navigate(['/courses/learn', course.slug || courseId]);
//           }, 1500);
//         },
//         error: (err: any) => {
//           console.error('Payment failed:', err);
//           this.isProcessingPayment.set(false);
//           this.messageService.add({
//             severity: 'error',
//             summary: 'Payment Failed',
//             detail: err?.error?.message || 'Could not complete payment process.'
//           });
//         }
//       });
//   }

//   /**
//    * Handle actual enrollment after successful payment
//    */
//   private enrollInCourse(courseId: string): void {
//     this.enrollmentService.enrollInCourse(courseId)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           this.isProcessingPayment.set(false);
//           this.showCheckoutModal.set(false);
//           this.isEnrolled.set(true);

//           this.messageService.add({
//             severity: 'success',
//             summary: 'Success!',
//             detail: 'Enrollment complete. Taking you to the classroom...'
//           });

//           setTimeout(() => {
//             this.router.navigate(['/courses/learn', this.course()?.slug || courseId]);
//           }, 1500);
//         },
//         error: (err: any) => {
//           this.isProcessingPayment.set(false);
//           this.messageService.add({
//             severity: 'error',
//             summary: 'Enrollment Failed',
//             detail: err?.error?.message || 'Could not complete enrollment.'
//           });
//         }
//       });
//   }

//   closeCheckout(): void {
//     this.showCheckoutModal.set(false);
//   }

//   // --- UI HELPERS ---
//   toggleSection(index: number): void {
//     this.sections.update(secs =>
//       secs.map((sec, i) => i === index ? { ...sec, expanded: !sec.expanded } : sec)
//     );
//   }

//   getCourseStatus(): { label: string; severity: string; icon: string } {
//     const c = this.course();
//     if (!c) return { label: '', severity: '', icon: '' };

//     if (c.isPublished && c.isApproved) {
//       return { label: 'Published', severity: 'success', icon: 'pi pi-check-circle' };
//     } else if (c.isPublished) {
//       return { label: 'Pending Approval', severity: 'warning', icon: 'pi pi-clock' };
//     } else {
//       return { label: 'Draft', severity: 'info', icon: 'pi pi-pencil' };
//     }
//   }

//   getCategoryName(): string {
//     const c = this.course();
//     if (!c?.category) return 'N/A';

//     // Use enriched category label first, then try to get from category object
//     return c.categoryLabel ||
//       (typeof c.category === 'object' ? c.category.name : c.category) ||
//       'Loading...';
//   }

//   calculateDiscount(): number {
//     const c = this.course();
//     return (!c?.discountPrice || !c?.price) ? 0 : Math.round(((c.price - c.discountPrice) / c.price) * 100);
//   }

//   formatDuration(minutes: number): string {
//     if (!minutes) return '0m';
//     const hrs = Math.floor(minutes / 60);
//     const mins = minutes % 60;
//     return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
//   }
// getLessonIcon(type: string): string {
//   const icons: Record<string, string> = {
//     'VIDEO': 'pi pi-play-circle',
//     'ARTICLE': 'pi pi-file-pdf',
//     'QUIZ': 'pi pi-question-circle',
//     'ASSIGNMENT': 'pi pi-file',
//     'CODING-EXERCISE': 'pi pi-code'
//   };
//   return icons[type?.toUpperCase()] || 'pi pi-file';
// }
//   // getLessonIcon(type: string): string {
//   //   const icons: Record<string, string> = {
//   //     'video': 'pi pi-video',
//   //     'article': 'pi pi-file',
//   //     'quiz': 'pi pi-question-circle',
//   //     'assignment': 'pi pi-pencil',
//   //     'coding-exercise': 'pi pi-code'
//   //   };
//   //   return icons[type] || 'pi pi-file';
//   // }

//   getLessonTypeLabel(type: string): Observable<string> {
//     return this.getMasterValueLabel('LESSON_TYPE', type);
//   }

//   editCourse(): void {
//     const courseId = this.course()?._id;
//     if (courseId) {
//       this.router.navigate(['/instructor/courses', courseId, 'edit']);
//     }
//   }

//   editPricing(): void {
//     const courseId = this.course()?._id;
//     if (courseId) {
//       this.router.navigate(['/instructor/courses', courseId, 'edit'], {
//         fragment: 'pricing'
//       });
//     }
//   }

//   editCurriculum(): void {
//     const courseId = this.course()?._id;
//     if (courseId) {
//       this.router.navigate(['/instructor/courses', courseId, 'curriculum']);
//     }
//   }

//   retry(): void {
//     const id = this.route.snapshot.params['id'];
//     if (id) this.loadCourse(id);
//   }

//   goToLearning(): void {
//     const course = this.course();
//     if (course) {
//       this.router.navigate(['/courses/learn', course.slug || course._id]);
//     }
//   }

//   goAnalytics(): void {
//     const course = this.course();
//     if (course) {
//       this.router.navigate(['/instructor/analytics', this.id]);
//     }
//   }

//   playPreview(): void {
//     const course = this.course();

//     if (!course?.previewVideo) {
//       return;
//     }

//     if (this.isYouTubeUrl(course.previewVideo)) {
//       const videoId = this.extractYouTubeId(course.previewVideo);
//       this.openVideoModal('youtube', videoId);
//     }
//     else if (this.isVimeoUrl(course.previewVideo)) {
//       const videoId = this.extractVimeoId(course.previewVideo);
//       this.openVideoModal('vimeo', videoId);
//     }
//     else {
//       this.openVideoModal('direct', course.previewVideo);
//     }
//   }

//   private isYouTubeUrl(url: string): boolean {
//     return url.includes('youtube.com') || url.includes('youtu.be');
//   }

//   private isVimeoUrl(url: string): boolean {
//     return url.includes('vimeo.com');
//   }

//   private extractYouTubeId(url: string): string {
//     const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
//     const match = url.match(regExp);
//     return (match && match[2].length === 11) ? match[2] : url;
//   }

//   private extractVimeoId(url: string): string {
//     const regExp = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
//     const match = url.match(regExp);
//     return match ? match[5] : url;
//   }

//   private openVideoModal(type: 'youtube' | 'vimeo' | 'direct', id: string): void {
//     this.showVideoModal.set(true);
//     this.videoType.set(type);
//     this.videoId.set(id);
//   }

//   closeVideoModal(): void {
//     this.showVideoModal.set(false);
//     this.videoType.set(null);
//     this.videoId.set('');
//   }

//   openQuizBuilder(): void {
//     const courseData = this.course();

//     if (!courseData?._id) {
//       console.error('Course ID not found');
//       this.messageService.add({
//         severity: 'error',
//         summary: 'Error',
//         detail: 'Cannot open quiz builder: Course ID not found'
//       });
//       return;
//     }

//     const courseId = courseData._id;
//     // Navigate to quiz builder
//     this.router.navigate(['/instructor/courses', courseId, 'quiz-builder']);
//   }

//   /**
//    * View all instructors of this course
//    */
//   viewInstructors(): void {
//     const courseId = this.course()?._id;
//     if (courseId) {
//       this.router.navigate(['/instructor/courses', courseId, 'instructors']);
//     }
//   }

//   /**
//    * Validate a value against master data
//    */
//   // validateMasterValue(masterName: string, value: string): Observable<boolean> {
//   //   return this.masterApi.validatePublicMasterValue(masterName, value).pipe(
//   //     map(response => response.data as boolean),
//   //     catchError(() => of(false))
//   //   );
//   // }













//   private loadCourse(identifier: string): void {
//     this.isLoading.set(true);
//     this.error.set(null);

//     // 1. Check if the identifier is a valid 24-character MongoDB ObjectId
//     const isMongoId = /^[a-fA-F0-9]{24}$/.test(identifier);

//     // 2. Use the correct API method based on the identifier type
//     const request$ = isMongoId
//       ? this.courseService.getCourseById(identifier, { skipAuth: true })
//       : this.courseService.getCoursesBySlug(identifier);

//     request$.pipe(
//       switchMap((response: any) => {
//         // Extract data from the response structure
//         // Your API returns { status: 'success', data: { course: {...}, sections: [...] } }
//         const responseData = response?.data || response;

//         // Extract course and sections from the response
//         const courseData = responseData?.course || responseData;
//         const sectionsData = responseData?.sections || [];

//         // Combine course with sections
//         const enrichedCourse = {
//           ...courseData,
//           sections: sectionsData
//         };

//         // 3. Enrich course with master data labels
//         return this.enrichCourseWithMasterData(enrichedCourse);
//       }),
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe({
//       next: (enrichedCourse: any) => {
//         this.course.set(enrichedCourse);
//         this.id = enrichedCourse._id || enrichedCourse.id;

//         // Check if user is the instructor/owner
//         this.checkIfUserIsInstructor(enrichedCourse);

//         // Check enrollment status if user is logged in
//         if (this.currentUser() && this.id) {
//           this.verifyEnrollmentStatus(this.id);
//         }

//         // Process sections for the UI Accordion
//         const sectionsWithUI = (enrichedCourse.sections || []).map((section: any, index: number) => ({
//           ...section,
//           expanded: index === 0, // Auto-expand the first section
//           lessons: section.lessons || []
//         }));

//         this.sections.set(sectionsWithUI);
//         this.isLoading.set(false);
//       },
//       error: (err: any) => {
//         console.error('Error loading course:', err);
//         this.error.set(err.error?.message || err.message || 'Course not found');
//         this.isLoading.set(false);
//       }
//     });
//   }

//   /**
//    * Check if current user is the instructor of this course
//    */
//   private checkIfUserIsInstructor(courseData: any): void {
//     const user = this.currentUser();
//     if (!user || !courseData) return;

//     // Check if user is admin
//     if (user.role === 'admin') {
//       this.isOwner.set(true);
//       return;
//     }

//     // Check if user is the instructor
//     if (courseData.instructor) {
//       const instructorId = typeof courseData.instructor === 'object'
//         ? courseData.instructor._id
//         : courseData.instructor;

//       this.isOwner.set(instructorId === user.id);
//     }
//   }




//   /**
//    * Get instructor name (handles both object and string formats)
//    */
//   getInstructorName(instructor: any): string {
//     if (!instructor) return 'Unknown Instructor';

//     if (typeof instructor === 'object') {
//       return `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || 'Instructor';
//     }

//     return 'Instructor';
//   }

//   /**
//    * Get instructor initials for avatar
//    */
//   getInstructorInitials(instructor: any): string {
//     if (!instructor) return 'IN';

//     if (typeof instructor === 'object') {
//       const first = instructor.firstName?.charAt(0) || '';
//       const last = instructor.lastName?.charAt(0) || '';
//       return (first + last) || 'IN';
//     }

//     return 'IN';
//   }

//   /**
//    * Get instructor ID (handles both object and string formats)
//    */
//   getInstructorId(instructor: any): string {
//     if (!instructor) return '';
//     return typeof instructor === 'object' ? instructor._id : instructor;
//   }
// }