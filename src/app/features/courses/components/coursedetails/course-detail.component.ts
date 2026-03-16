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
import { AppMessageService } from '../../../../core/utils/message.service';
import { CourseInstructorsComponent } from "../course-instructors/course-instructors.component";

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, CurrencyPipe, NgClass,
    DialogModule, InputTextModule, ButtonModule, TagModule, ToastModule,
    TooltipModule, AccordionModule, DividerModule, SkeletonModule,
    CourseDiscussionComponent, Card,
    CourseInstructorsComponent
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
  private messageService = inject(AppMessageService);
  private quizService = inject(QuizService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private paymentService = inject(PaymentService);
  private masterApi = inject(MasterApiService);

  private masterDataCache = new Map<string, Observable<any>>();

  showVideoModal = signal<boolean>(false);
  videoType = signal<'youtube' | 'vimeo' | 'direct' | null>(null);
  videoId = signal<string>('');

  quizzes = signal<any[]>([]);
  showCourseInvitationDialog = signal<boolean>(false);
  showQuizzesModal = signal<boolean>(false);
  course = signal<any | undefined>(undefined);
  sections = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  courseId = signal<string | null>(null);

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
      this.CourseQuizes(identifier)
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
          this.messageService.showSuccess('Course published successfully');
        },
        error: (error) => this.messageService.showError(error.message || 'Could not publish course')
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
          this.messageService.showInfo('Course is now hidden.');
        },
        error: () => this.messageService.showError('Could not unpublish course')
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
          this.messageService.showSuccess('Taking you to the classroom...');
          setTimeout(() => this.router.navigate(['/courses/learn', course.slug || courseId]), 1500);
        },
        error: (err: any) => {
          this.isProcessingPayment.set(false);
          this.messageService.showError(err?.error?.message || 'Could not complete payment.');
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
          this.messageService.showSuccess('Enrollment complete.');
          setTimeout(() => this.router.navigate(['/courses/learn', this.course()?.slug || courseId]), 1500);
        },
        error: (err: any) => {
          this.isProcessingPayment.set(false);
          this.messageService.showError(err?.error?.message || 'Could not complete enrollment.');
        }
      });
  }

  private CourseQuizes(courseId: string): void {
    this.courseService.getquizzesBySlug(courseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          // ✅ CORRECT: Just save the quizzes to your state
          const fetchedQuizzes = response?.data?.quizzes || response?.quizzes || [];
          this.quizzes.set(fetchedQuizzes);
        },
        error: (err: any) => {
          console.error('Failed to load course quizzes', err);
          // Optional: Show an error toast specifically for quizzes if you want
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

  // openQuizBuilder(): void {
  //   const courseData = this.course();
  //   if (!courseData?._id) return;

  //   // ✅ CORRECT: Matches your :courseId/quiz/new route
  //   this.router.navigate(['/courses', courseData._id, 'quiz', 'new']);
  // }
  // ==================== QUIZ MANAGEMENT ====================
  openQuizzesModal(): void {
    this.showQuizzesModal.set(true);
  }

  closeQuizzesModal(): void {
    this.showQuizzesModal.set(false);
  }

  createNewQuiz(): void {
    const courseId = this.course()?._id;
    if (!courseId) return;
    // Navigates to: /courses/:courseId/quiz/new
    this.router.navigate(['/courses', courseId, 'quiz', 'new']);
  }

  editQuiz(quizId: string): void {
    const courseId = this.course()?._id;
    if (!courseId || !quizId) return;
    // Navigates to: /courses/:courseId/quiz/:id
    this.router.navigate(['/courses', courseId, 'quiz', quizId]);
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
        this.courseId.set(courseData._id)
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
