import { Component, OnInit, inject, DestroyRef, signal, computed, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DurationPipe } from '../../../../core/pipes/duration.pipe';
import { CourseService } from '../../../../core/services/course.service';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { LessonProgress, LessonService } from '../../../../core/services/lesson.service';
import { LessonProgressTrackerComponent } from "../../../lesson/components/lesson-progress-tracker/lesson-progress-tracker.component";

// Services & Pipes
@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    AccordionModule,
    ProgressBarModule,
    TagModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule,
    DurationPipe,
    TitleCasePipe,
    LessonProgressTrackerComponent
],
  providers: [MessageService, ConfirmationService],
  templateUrl: './course-player.component.html',
  styleUrls: ['./course-player.component.scss']
})
export class CoursePlayerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);
  private lessonService = inject(LessonService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);

  // Core State Signals
  courseId = signal<string>('');
  course = signal<any>(null);
  sections = signal<any[]>([]);
  currentLesson = signal<any>(null);
  
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Progress & UI Signals
  courseProgress = signal<number>(0);
  completedLessons = signal<Set<string>>(new Set());
  sidebarVisible = signal<boolean>(true);
  expandedSections = signal<string[]>(['0']);

  // Computed: Flattened lessons for easy next/prev navigation
  private flatLessons = computed(() => {
    const secs = this.sections();
    if (!secs || !secs.length) return [];
    return secs.flatMap(s => s.lessons || []);
  });

  // Computed: Navigation
  lessonNav = computed(() => {
    const current = this.currentLesson();
    const flat = this.flatLessons();
    if (!current || !flat.length) return { prev: null, next: null };

    const idx = flat.findIndex(l => l._id === current._id);
    return {
      prev: idx > 0 ? flat[idx - 1] : null,
      next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null
    };
  });

  // Computed: Current Lesson Status
  isCurrentLessonCompleted = computed(() => {
    const current = this.currentLesson();
    return current ? this.completedLessons().has(current._id) : false;
  });

  // Computed: Safe Video URL (Fixes Angular "unsafe resource" errors)
  safeVideoUrl = computed<SafeResourceUrl | null>(() => {
    const lesson = this.currentLesson();
    if (lesson?.type !== 'video' || !lesson?.content?.video?.url) return null;

    const url = lesson.content.video.url;
    const provider = lesson.content.video.provider;

    if (provider === 'youtube') {
      const id = this.extractYouTubeId(url);
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=0&rel=0`);
    }
    if (provider === 'vimeo') {
      const id = this.extractVimeoId(url);
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.vimeo.com/video/${id}?autoplay=0&title=0&byline=0&portrait=0`);
    }
    return null;
  });

  @HostListener('window:resize',)
  onResize() {
    if (window.innerWidth <= 1024 && this.sidebarVisible()) {
      this.sidebarVisible.set(false);
    } else if (window.innerWidth > 1024 && !this.sidebarVisible()) {
      this.sidebarVisible.set(true);
    }
  }

  ngOnInit(): void {
    this.onResize(); // Initial check

    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['id']) {
        this.courseId.set(params['id']);
        this.loadCourseData();
      }
    });
  }

  // --- Progress Tracker Event Handler ---
  onProgressUpdatedFromTracker(progress: LessonProgress): void {
    // 1. Update the sidebar checkmarks immutably using Signals
    this.completedLessons.update(set => {
      const newSet = new Set(set);
      if (progress.completed) {
        newSet.add(progress.lessonId);
      } else {
        newSet.delete(progress.lessonId);
      }
      return newSet;
    });

    // 2. Update the overall course progress percentage at the top of the screen
    const totalLessons = this.flatLessons().length;
    if (totalLessons > 0) {
      this.courseProgress.set(Math.round((this.completedLessons().size / totalLessons) * 100));
    }

    // 3. Auto-navigate to the next lesson if they just completed it
    if (progress.completed) {
      const next = this.lessonNav().next;
      if (next) {
        // Slight delay so they can see the success animation before it switches
        setTimeout(() => this.selectLesson(next), 1500); 
      }
    }
  }
  
  private loadCourseData(): void {
    this.loading.set(true);
    
    this.courseService.getBySlug(this.courseId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          // Adapt to typical backend payload
          const courseData = res.data?.course || res.data;
          const sectionData = res.data?.sections || courseData.sections || [];
          
          this.course.set(courseData);
          this.sections.set(sectionData);
          
          this.loadProgress();
        },
        error: (error: any) => {
          console.error('Failed to load course', error);
          this.error.set('You do not have access to this course, or it does not exist.');
          this.loading.set(false);
        }
      });
  }

  private loadProgress(): void {
    this.enrollmentService.getEnrollmentProgress(this.courseId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const progressData = res.data;
          this.completedLessons.set(new Set(progressData?.completedLessons || []));
          this.courseProgress.set(progressData?.progress || 0);
          
          // Restore last watched or set first lesson
          if (progressData?.lastLessonId && !this.currentLesson()) {
            this.restoreLastLesson(progressData.lastLessonId);
          } else {
            this.setFirstLesson();
          }
          this.loading.set(false);
        },
        error: () => {
          // If no progress found, just start at the beginning safely
          this.setFirstLesson();
          this.loading.set(false);
        }
      });
  }

  private restoreLastLesson(lessonId: string): void {
    const lesson = this.flatLessons().find(l => l._id === lessonId);
    if (lesson) {
      this.selectLesson(lesson);
    } else {
      this.setFirstLesson();
    }
  }

  private setFirstLesson(): void {
    const flat = this.flatLessons();
    if (flat.length > 0 && !this.currentLesson()) {
      this.selectLesson(flat[0]);
    }
  }

  selectLesson(lesson: any): void {
    this.currentLesson.set(lesson);
    this.expandSectionForLesson(lesson._id);

    // Fetch secure details if the payload doesn't contain the 'content' block
    if (!lesson.content) {
      this.lessonService.getLessonWithAccess(lesson._id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res: any) => {
            if (this.currentLesson()?._id === lesson._id) {
              this.currentLesson.set(res.data?.lesson || res.data);
            }
          }
        });
    }

    if (window.innerWidth <= 1024) {
      this.sidebarVisible.set(false);
    }
  }

  private expandSectionForLesson(lessonId: string): void {
    const secs = this.sections();
    for (let i = 0; i < secs.length; i++) {
      if (secs[i].lessons?.some((l: any) => l._id === lessonId)) {
        const idxStr = i.toString();
        const currentExpanded = this.expandedSections();
        if (!currentExpanded.includes(idxStr)) {
          this.expandedSections.set([...currentExpanded, idxStr]);
        }
        break;
      }
    }
  }

  toggleLessonComplete(): void {
    if (this.isCurrentLessonCompleted()) {
      this.confirmationService.confirm({
        message: 'Are you sure you want to mark this lesson as incomplete?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        accept: () => this.updateLessonProgress(false)
      });
    } else {
      this.updateLessonProgress(true);
    }
  }

  private updateLessonProgress(completed: boolean): void {
    const lesson = this.currentLesson();
    if (!lesson) return;

    this.enrollmentService.updateLessonProgress(this.courseId(), lesson._id, completed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          // Mutate the signal Set immutably
          this.completedLessons.update(set => {
            const newSet = new Set(set);
            completed ? newSet.add(lesson._id) : newSet.delete(lesson._id);
            return newSet;
          });

          this.courseProgress.set(res.data?.progress || Math.round((this.completedLessons().size / this.flatLessons().length) * 100));

          if (completed) {
            this.messageService.add({ severity: 'success', summary: 'Great job!', detail: 'Lesson completed' });
            
            // Auto-navigate
            const next = this.lessonNav().next;
            if (next) setTimeout(() => this.selectLesson(next), 1500);
          } else {
            this.messageService.add({ severity: 'info', summary: 'Updated', detail: 'Lesson marked as incomplete' });
          }
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save progress.' })
      });
  }

  completeCourse(): void {
    if (this.courseProgress() < 100) return;

    this.confirmationService.confirm({
      message: 'Congratulations! Would you like to claim your certificate?',
      header: 'Course Completed',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.enrollmentService.completeCourse(this.courseId())
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res: any) => {
              this.messageService.add({ severity: 'success', summary: 'Issued', detail: 'Certificate ready', sticky: true });
              if (res.data?.certificateUrl) window.open(res.data.certificateUrl, '_blank');
            },
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate certificate' })
          });
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarVisible.update(v => !v);
  }

  goToMyLearning(): void {
    this.router.navigate(['/my-learning']);
  }

  private extractYouTubeId(url: string): string {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : url;
  }

  private extractVimeoId(url: string): string {
    const match = url.match(/^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/);
    return match ? match[5] : url;
  }
}