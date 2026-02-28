import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, NgClass, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Models & Services
import { Course, Section } from '../../../../core/models/course.model';
import { CourseService } from '../../../../core/services/course.service';
import { SectionService } from '../../../../core/services/section.service';
import { LessonService } from '../../../../core/services/lesson.service';

// Extended type for UI interaction
type SectionWithUI = Section & { expanded?: boolean; lessons?: any[] };

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [
    RouterModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
    NgClass
  ],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private sectionService = inject(SectionService);
  private lessonService = inject(LessonService);
  private destroyRef = inject(DestroyRef);

  // Reactive State Signals
  course = signal<Course | undefined>(undefined);
  sections = signal<SectionWithUI[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  isInstructorMode = signal<boolean>(false);
  
  // Computed-like State
  completionRate = signal<number>(0);
  revenue = signal<number>(0);
  actualTotalLessons = signal<number>(0);
  actualTotalDuration = signal<number>(0);

  ngOnInit(): void {
    this.isInstructorMode.set(this.router.url.includes('/instructor'));

    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const identifier = params['id'];
      if (identifier) {
        this.loadCourse(identifier);
      }
    });
  }

  private loadCourse(identifier: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    const request$ = this.isInstructorMode() 
      ? this.courseService.getById(identifier) 
      : this.courseService.getBySlug(identifier);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        // Handle various payload structures from backend
        const c = this.isInstructorMode() 
          ? res?.data?.data || res?.data 
          : res?.data?.course || res?.data?.data || res?.data;
        
        this.course.set(c);
        this.calculateMetrics(c);
        
        // After getting the course, fetch its curriculum mapping using the DB _id
        if (c?._id) {
          this.loadCurriculum(c._id);
        } else {
          this.isLoading.set(false);
        }
      },
      error: (err: any) => {
        this.error.set(err.error?.message || err.message || 'Course not found or unavailable');
        this.isLoading.set(false);
      }
    });
  }

  private loadCurriculum(courseId: string): void {
    // Parallel fetch for Sections and Lessons to avoid waterfalls
    forkJoin({
      sectionsRes: this.sectionService.getSectionsByCourse(courseId).pipe(catchError(() => of(null))),
      lessonsRes: this.lessonService.getAll({ course: courseId, limit: 1000 }).pipe(catchError(() => of(null)))
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: ({ sectionsRes, lessonsRes }) => {
        const rawSections = sectionsRes?.data?.data || sectionsRes?.data || [];
        const rawLessons = lessonsRes?.data?.data || lessonsRes?.data || [];

        let courseTotalLessons = 0;
        let courseTotalDuration = 0;

        // Stitch Lessons into their respective Sections
        const mappedSections = rawSections.map((sec: any, index: number) => {
          // Filter lessons belonging to this section
          const secLessons = rawLessons
            .filter((l: any) => l.section === sec._id || l.section?._id === sec._id)
            .sort((a: any, b: any) => a.order - b.order); // Respect ordering
            
          const secDuration = secLessons.reduce((acc: number, l: any) => acc + (l.duration || 0), 0);

          courseTotalLessons += secLessons.length;
          courseTotalDuration += secDuration;

          return {
            ...sec,
            lessons: secLessons,
            totalLessons: secLessons.length,
            totalDuration: secDuration,
            expanded: index === 0 // Auto-expand only the first section
          };
        }).sort((a: any, b: any) => a.order - b.order);

        this.sections.set(mappedSections);
        this.actualTotalLessons.set(courseTotalLessons);
        this.actualTotalDuration.set(courseTotalDuration);
        this.isLoading.set(false);
      },
      error: () => {
        console.error('Failed to stitch curriculum');
        this.isLoading.set(false);
      }
    });
  }

  private calculateMetrics(courseData: Course | undefined): void {
    if (!courseData) return;
    this.completionRate.set(Math.round(Math.random() * 100)); // Dynamic mock for UI
    this.revenue.set((courseData.totalEnrollments || 0) * (courseData.price || 0));
  }

  // --- UI Interactions ---

  toggleSection(index: number): void {
    this.sections.update(secs => 
      secs.map((sec, i) => i === index ? { ...sec, expanded: !sec.expanded } : sec)
    );
  }

  // --- View Helpers ---

  getCourseStatus(): string {
    const c = this.course();
    if (!c) return '';
    if (c.isPublished && c.isApproved) return 'Published';
    if (c.isPublished) return 'Pending Approval';
    return 'Draft';
  }

  getCategoryName(): string {
    const c = this.course();
    if (!c?.category) return 'N/A';
    return typeof c.category === 'object' ? c.category.name : 'Loading...';
  }

  calculateDiscount(): number {
    const c = this.course();
    if (!c?.discountPrice || !c?.price) return 0;
    return Math.round(((c.price - c.discountPrice) / c.price) * 100);
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }

  // --- Actions ---

  editCourse(): void {
    const c = this.course();
    if (c) this.router.navigate(['/courses/instructor', c._id, 'edit']);
  }

  editPricing(): void {
    const c = this.course();
    if (c) this.router.navigate(['/courses/instructor', c._id, 'edit'], { fragment: 'pricing' });
  }

  editCurriculum(): void {
    const c = this.course();
    if (c) this.router.navigate(['/courses/instructor', c._id, 'curriculum']);
  }

  approve(): void {
    const c = this.course();
    if (!c || !confirm(`Are you sure you want to approve "${c.title}"?`)) return;

    this.courseService.approve(c._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.course.update(course => course ? { ...course, isPublished: true, isApproved: true } : course),
        error: (err: any) => console.error('Failed to approve course', err)
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

  unpublishCourse(): void {
    const c = this.course();
    if (!c || !confirm(`Are you sure you want to unpublish "${c.title}"?`)) return;

    this.courseService.publish(c._id) 
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.course.update(course => course ? { ...course, isPublished: false } : course),
        error: (err: any) => console.error('Failed to unpublish course', err)
      });
  }

  previewCourse(): void {
    const c = this.course();
    if (c?.slug) window.open(`/courses/${c.slug}`, '_blank');
  }

  retry(): void {
    const id = this.route.snapshot.params['id'];
    if (id) this.loadCourse(id);
  }
}