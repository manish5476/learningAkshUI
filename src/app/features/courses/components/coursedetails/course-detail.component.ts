import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, NgClass, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

// Models & Services
import { Course, Section } from '../../../../core/models/course.model';
import { CourseService } from '../../../../core/services/course.service';
import { SectionService } from '../../../../core/services/section.service';
import { LessonService } from '../../../../core/services/lesson.service';
import { EnrollmentService } from '../../../../core/services/enrollment.service'; // <-- ADDED

type SectionWithUI = Section & { expanded?: boolean; lessons?: any[] };

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule, // <-- ADDED
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
    NgClass,
    DialogModule,      // <-- ADDED
    InputTextModule,   // <-- ADDED
    ToastModule        // <-- ADDED
  ],
  providers: [MessageService], // <-- ADDED
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private sectionService = inject(SectionService);
  private lessonService = inject(LessonService);
  private enrollmentService = inject(EnrollmentService); // <-- ADDED
  private messageService = inject(MessageService);       // <-- ADDED
  private destroyRef = inject(DestroyRef);

  // Core State
  course = signal<Course | undefined>(undefined);
  sections = signal<SectionWithUI[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  isInstructorMode = signal<boolean>(false);
  
  // Stats State
  completionRate = signal<number>(0);
  revenue = signal<number>(0);
  actualTotalLessons = signal<number>(0);
  actualTotalDuration = signal<number>(0);

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
    this.isInstructorMode.set(this.router.url.includes('/instructor'));
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const identifier = params['id'] || params['slug'];
      if (identifier) this.loadCourse(identifier);
    });
  }
  
    publishCourse(): void {
    const c = this.course();
    if (!c || !confirm(`Are you sure you want to publish "${c.title}"?`)) return;

    this.courseService.publish(c._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.course.update(course => course ? { ...course, isPublished: true } : course),
        error: (err: any) => console.error('Failed to publish course', err)
      });
  }

    previewCourse(): void {
    const c = this.course();
    if (c?.slug) window.open(`/courses/${c.slug}`, '_blank');
  }
  
  private loadCourse(identifier: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    const request$ = this.isInstructorMode() 
      ? this.courseService.getById(identifier) 
      : this.courseService.getBySlug(identifier);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const c = this.isInstructorMode() ? res?.data?.data || res?.data : res?.data?.course || res?.data?.data || res?.data;
        this.course.set(c);
        this.calculateMetrics(c);
        
        if (c?._id) this.loadCurriculum(c._id);
        else this.isLoading.set(false);
      },
      error: (err: any) => {
        this.error.set(err.error?.message || err.message || 'Course not found');
        this.isLoading.set(false);
      }
    });
  }

  private loadCurriculum(courseId: string): void {
    forkJoin({
      sectionsRes: this.sectionService.getSectionsByCourse(courseId).pipe(catchError(() => of(null))),
      lessonsRes: this.lessonService.getAll({ course: courseId, limit: 1000 }).pipe(catchError(() => of(null)))
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ sectionsRes, lessonsRes }) => {
        const rawSections = sectionsRes?.data?.data || sectionsRes?.data || [];
        const rawLessons = lessonsRes?.data?.data || lessonsRes?.data || [];
        let courseTotalLessons = 0; let courseTotalDuration = 0;

        const mappedSections = rawSections.map((sec: any, index: number) => {
          const secLessons = rawLessons.filter((l: any) => l.section === sec._id || l.section?._id === sec._id).sort((a: any, b: any) => a.order - b.order);
          const secDuration = secLessons.reduce((acc: number, l: any) => acc + (l.duration || 0), 0);
          courseTotalLessons += secLessons.length; courseTotalDuration += secDuration;

          return { ...sec, lessons: secLessons, totalLessons: secLessons.length, totalDuration: secDuration, expanded: index === 0 };
        }).sort((a: any, b: any) => a.order - b.order);

        this.sections.set(mappedSections);
        this.actualTotalLessons.set(courseTotalLessons);
        this.actualTotalDuration.set(courseTotalDuration);
        this.isLoading.set(false);
      }
    });
  }

  // --- ENROLLMENT / CHECKOUT LOGIC ---

  openCheckout(): void {
    this.checkoutForm.reset();
    
    // If the course is completely free, we don't need the card form validators
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
    if (!this.course()?.isFree && this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isProcessingPayment.set(true);

    const courseId = this.course()?._id;
    if (!courseId) return;

    // Call your backend. (Passing null for paymentDetails since this is a mock flow. 
    // Your backend handles no paymentId gracefully if the course is free, or ignores it for now).
    this.enrollmentService.enrollInCourse(courseId, null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isProcessingPayment.set(false);
          this.showCheckoutModal.set(false);
          
          this.messageService.add({ severity: 'success', summary: 'Success!', detail: 'Enrollment complete. Taking you to the classroom...' });
          
          // Teleport user to the learning player after a brief success delay!
          setTimeout(() => {
            this.router.navigate(['/courses/learn', this.course()?.slug || courseId]);
          }, 1500);
        },
        error: (err) => {
          this.isProcessingPayment.set(false);
          
          // Handle backend error (e.g. "Already enrolled")
          if (err.error?.message?.includes('already enrolled')) {
            this.messageService.add({ severity: 'info', summary: 'Welcome back', detail: 'You are already enrolled. Taking you there now...' });
            setTimeout(() => this.router.navigate(['/courses/learn', this.course()?.slug || courseId]), 1000);
          } else {
            this.messageService.add({ severity: 'error', summary: 'Enrollment Failed', detail: err.error?.message || 'Please try again.' });
          }
        }
      });
  }

  closeCheckout(): void {
    this.showCheckoutModal.set(false);
  }

  // --- Helpers ---
  toggleSection(index: number): void { this.sections.update(secs => secs.map((sec, i) => i === index ? { ...sec, expanded: !sec.expanded } : sec)); }
  calculateMetrics(courseData: Course | undefined): void { if (courseData) { this.completionRate.set(Math.round(Math.random() * 100)); this.revenue.set((courseData.totalEnrollments || 0) * (courseData.price || 0)); } }
  getCourseStatus(): string { const c = this.course(); return !c ? '' : (c.isPublished && c.isApproved) ? 'Published' : c.isPublished ? 'Pending Approval' : 'Draft'; }
  getCategoryName(): string { const c = this.course(); return !c?.category ? 'N/A' : typeof c.category === 'object' ? c.category.name : 'Loading...'; }
  calculateDiscount(): number { const c = this.course(); return (!c?.discountPrice || !c?.price) ? 0 : Math.round(((c.price - c.discountPrice) / c.price) * 100); }
  formatDuration(minutes: number): string { if (!minutes) return '0m'; const hrs = Math.floor(minutes / 60); const mins = minutes % 60; return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`; }
  editCourse(): void { if (this.course()) this.router.navigate(['/courses/instructor', this.course()?._id, 'edit']); }
  editPricing(): void { if (this.course()) this.router.navigate(['/courses/instructor', this.course()?._id, 'edit'], { fragment: 'pricing' }); }
  editCurriculum(): void { if (this.course()) this.router.navigate(['/courses/instructor', this.course()?._id, 'curriculum']); }
  retry(): void { const id = this.route.snapshot.params['id']; if (id) this.loadCourse(id); }
}
