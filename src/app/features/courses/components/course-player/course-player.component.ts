import { Component, OnInit, inject, DestroyRef, signal, computed, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { switchMap, of, catchError, forkJoin } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Dialog } from "primeng/dialog";
import { SkeletonModule } from 'primeng/skeleton';

// Services & Pipes
import { DurationPipe } from '../../../../core/pipes/duration.pipe';
import { CourseService } from '../../../../core/services/course.service';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import { LessonService } from '../../../../core/services/lesson.service';
// import { MasterApiService, MasterValue } from '../../../../core/services/master-api.service';
// import { LessonProgressTrackerComponent } from "../../../lesson/components/lesson-progress-tracker/lesson-progress-tracker.component";
import { LessonQuizTakerComponent } from "../../../Test/lesson-quiz-taker/lesson-quiz-taker.component";
import { LessonProgressTrackerComponent } from '../../../lesson/components/lesson-progress-tracker/lesson-progress-tracker.component';
import { MasterApiService } from '../../../../core/services/master-list.service';

interface LessonWithExtras {
  _id: string;
  title: string;
  description?: string;
  type: string;
  content?: any;
  duration: number;
  order: number;
  isFree: boolean;
  isPublished: boolean;
  section: string;
  course: string;
  // Enriched fields
  typeLabel?: string;
  typeIcon?: string;
  typeMetadata?: any;
}

interface SectionWithLessons {
  _id: string;
  title: string;
  description?: string;
  order: number;
  isPublished: boolean;
  lessons: LessonWithExtras[];
}

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
    SkeletonModule,
    // DurationPipe,
    // TitleCasePipe,
    // LessonProgressTrackerComponent,
    // LessonQuizTakerComponent,
    // Dialog
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
  private masterApi = inject(MasterApiService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);

  // Core State Signals
  courseId = signal<string>('');
  course = signal<any>(null);
  sections = signal<SectionWithLessons[]>([]);
  currentLesson = signal<LessonWithExtras | null>(null);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Progress & UI Signals
  courseProgress = signal<number>(0);
  completedLessons = signal<Set<string>>(new Set());
  sidebarVisible = signal<boolean>(true);
  expandedSections = signal<string[]>(['0']);

  // Master Data Cache
  lessonTypes = signal<Map<string, any>>(new Map());

  // Computed: Video token for backward compatibility
  videoToken = computed<string>(() => {
    const lesson = this.currentLesson();
    if (lesson?.type !== 'video' || !lesson?.content?.video) return '';

    const url = lesson.content.video.url;
    const provider = lesson.content.video.provider;

    if (provider === 'youtube') {
      return this.extractYouTubeId(url);
    }
    
    return url; 
  });
  
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
    // For local videos, use direct URL
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  // Computed: Lesson type display
  currentLessonType = computed(() => {
    const lesson = this.currentLesson();
    if (!lesson) return null;
    
    return {
      label: lesson.typeLabel || lesson.type,
      icon: lesson.typeIcon || this.getDefaultIcon(lesson.type)
    };
  });

  // Quiz dialog state
  showQuizDialog = signal<boolean>(false);
  selectedQuizId = signal<string>('');

  // Automatically hide sidebar on small screens
  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth <= 1024 && this.sidebarVisible()) {
      this.sidebarVisible.set(false);
    } else if (window.innerWidth > 1024 && !this.sidebarVisible()) {
      this.sidebarVisible.set(true);
    }
  }

  ngOnInit(): void {
    this.onResize();
    this.loadLessonTypes();

    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['id']) {
        this.courseId.set(params['id']);
        this.loadCourseData();
      }
    });
  }

  /**
   * Load lesson types from master data
   */
  private loadLessonTypes(): void {
    // this.masterApi.getPublicMasterValues('LESSON_TYPE', { 
    //   params: { includeMetadata: true } 
    // }).pipe(
    //   takeUntilDestroyed(this.destroyRef),
    //   catchError(() => of({ data: [] }))
    // ).subscribe({
    //   next: (response) => {
    //     const types = response.data as MasterValue[] || [];
    //     const typeMap = new Map();
    //     types.forEach(type => typeMap.set(type.value, type));
    //     this.lessonTypes.set(typeMap);
    //   }
    // });
  }

  /**
   * Enrich lesson with master data
   */
  private enrichLesson(lesson: any): any {
    const typeInfo = this.lessonTypes().get(lesson.type);
    
    return {
      ...lesson,
      typeLabel: typeInfo?.label || lesson.type,
      typeIcon: typeInfo?.metadata?.icon,
      typeMetadata: typeInfo?.metadata
    };
  }

  /**
   * Get default icon for lesson type
   */
  private getDefaultIcon(type: string): string {
    const icons: Record<string, string> = {
      'video': 'pi pi-video',
      'article': 'pi pi-file',
      'quiz': 'pi pi-question-circle',
      'assignment': 'pi pi-pencil',
      'coding-exercise': 'pi pi-code'
    };
    return icons[type] || 'pi pi-file';
  }

  // --- Progress Tracker Event Handler ---
  onProgressUpdatedFromTracker(progress: any): void {
    this.completedLessons.update(set => {
      const newSet = new Set(set);
      if (progress.completed) {
        newSet.add(progress.lessonId);
      } else {
        newSet.delete(progress.lessonId);
      }
      return newSet;
    });

    const totalLessons = this.flatLessons().length;
    if (totalLessons > 0) {
      this.courseProgress.set(Math.round((this.completedLessons().size / totalLessons) * 100));
    }

    if (progress.completed) {
      const next = this.lessonNav().next;
      if (next) {
        setTimeout(() => this.selectLesson(next), 1500);
      }
    }
  }

  private loadCourseData(): void {
    this.loading.set(true);

    // Use getCourseStructure to get full course with sections and lessons
    this.courseService.getCourseStructure(this.courseId())
      .pipe(
        switchMap((response: any) => {
          const courseData = response.data || response;
          
          // Enrich lessons with master data
          if (courseData.sections) {
            courseData.sections.forEach((section: any) => {
              if (section.lessons) {
                section.lessons = section.lessons.map((lesson: any) => 
                  this.enrichLesson(lesson)
                );
              }
            });
          }
          
          return of(courseData);
        }),
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Failed to load course structure', error);
          return of(null);
        })
      )
      .subscribe({
        next: (courseData) => {
          if (!courseData) {
            this.error.set('You do not have access to this course, or it does not exist.');
            this.loading.set(false);
            return;
          }

          this.course.set(courseData);
          this.sections.set(courseData.sections || []);

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
    // Use checkEnrollment to get progress
    this.enrollmentService.checkEnrollment(this.courseId())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of({ data: { isEnrolled: false, progress: 0, completedLessons: [] } }))
      )
      .subscribe({
        next: (res: any) => {
          const enrollmentData = res.data || {};
          this.completedLessons.set(new Set(enrollmentData.completedLessons || []));
          this.courseProgress.set(enrollmentData.progress || 0);

          // Restore last lesson or set first
          if (enrollmentData.lastLessonId && !this.currentLesson()) {
            this.restoreLastLesson(enrollmentData.lastLessonId);
          } else {
            this.setFirstLesson();
          }
          this.loading.set(false);
        },
        error: () => {
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

    // If lesson content is not loaded, fetch it
    if (!lesson.content) {
      this.lessonService.getLesson(lesson._id, { skipAuth: false })
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          switchMap((response: any) => {
            const lessonData = response.data || response;
            // Enrich with master data
            return of(this.enrichLesson(lessonData));
          }),
          catchError((err) => {
            if (err.status === 403) {
              this.error.set('premium_locked');
            } else {
              this.messageService.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Could not load lesson content' 
              });
            }
            return of(null);
          })
        )
        .subscribe({
          next: (enrichedLesson) => {
            if (enrichedLesson && this.currentLesson()?._id === lesson._id) {
              this.currentLesson.set(enrichedLesson);
              
              // Check if it's a quiz
              if (enrichedLesson.type === 'quiz' && enrichedLesson.content?.quiz) {
                this.openQuizDialog(enrichedLesson.content.quiz);
              }
            }
          }
        });
    } else {
      // Check if it's a quiz
      if (lesson.type === 'quiz' && lesson.content?.quiz) {
        this.openQuizDialog(lesson.content.quiz);
      }
    }

    // Auto-hide sidebar on mobile
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

  completeCourse(): void {
    if (this.courseProgress() < 100) return;

    this.confirmationService.confirm({
      message: 'Congratulations! Would you like to claim your certificate?',
      header: 'Course Completed',
      icon: 'pi pi-check-circle',
      // accept: () => {
      //   // Use enrollment service to complete course
      //   this.enrollmentService.completeCourse(this.courseId())
      //     .pipe(takeUntilDestroyed(this.destroyRef))
      //     .subscribe({
      //       next: (res: any) => {
      //         this.messageService.add({ 
      //           severity: 'success', 
      //           summary: 'Issued', 
      //           detail: 'Certificate ready', 
      //           sticky: true 
      //         });
      //         if (res.data?.certificateUrl) {
      //           window.open(res.data.certificateUrl, '_blank');
      //         }
      //       },
      //       error: () => this.messageService.add({ 
      //         severity: 'error', 
      //         summary: 'Error', 
      //         detail: 'Failed to generate certificate' 
      //       })
      //     });
      // }
    });
  }

  toggleSidebar(): void {
    this.sidebarVisible.update(v => !v);
  }

  goToMyLearning(): void {
    this.router.navigate(['/my-learning']);
  }

  // --- Video Helpers ---
  private extractYouTubeId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  }

  private extractVimeoId(url: string): string {
    const regExp = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[5] : url;
  }

  // --- Quiz Methods ---
  openQuizDialog(quizId: string): void {
    this.selectedQuizId.set(quizId);
    this.showQuizDialog.set(true);
  }

  handleQuizCompleted(result: { score: number, passed: boolean }): void {
    this.showQuizDialog.set(false);
    
    // Update progress if needed
    if (this.currentLesson()) {
      this.onProgressUpdatedFromTracker({
        lessonId: this.currentLesson()!._id,
        completed: result.passed,
        score: result.score
      });
    }
    
    this.messageService.add({
      severity: result.passed ? 'success' : 'info',
      summary: result.passed ? 'Quiz Passed!' : 'Quiz Completed',
      detail: `You scored ${result.score}% - ${result.passed ? 'Great job!' : 'Keep practicing!'}`
    });
  }

  // --- Lesson Helpers ---
  getLessonIcon(type: string): string {
    const typeInfo = this.lessonTypes().get(type);
    return typeInfo?.metadata?.icon || this.getDefaultIcon(type);
  }

  getLessonTypeLabel(type: string): string {
    const typeInfo = this.lessonTypes().get(type);
    return typeInfo?.label || type;
  }

  /**
   * Check if lesson is accessible (free or enrolled)
   */
  isLessonAccessible(lesson: LessonWithExtras): boolean {
    return lesson.isFree || this.courseProgress() > 0 || this.isCurrentLessonCompleted();
  }

  /**
   * Get lesson status for UI
   */
  getLessonStatus(lesson: LessonWithExtras): { icon: string; class: string } {
    if (this.completedLessons().has(lesson._id)) {
      return { icon: 'pi pi-check-circle', class: 'completed' };
    }
    if (lesson.isFree) {
      return { icon: 'pi pi-lock-open', class: 'free' };
    }
    if (!this.isLessonAccessible(lesson)) {
      return { icon: 'pi pi-lock', class: 'locked' };
    }
    return { icon: 'pi pi-play-circle', class: 'available' };
  }
}



// import { Component, OnInit, inject, DestroyRef, signal, computed, HostListener } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule, TitleCasePipe } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { AccordionModule } from 'primeng/accordion';
// import { ProgressBarModule } from 'primeng/progressbar';
// import { TagModule } from 'primeng/tag';
// import { TooltipModule } from 'primeng/tooltip';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { MessageService, ConfirmationService } from 'primeng/api';

// // Services & Pipes
// import { DurationPipe } from '../../../../core/pipes/duration.pipe';
// import { CourseService } from '../../../../core/services/course.service';
// import { EnrollmentService } from '../../../../core/services/enrollment.service';
// import { LessonService } from '../../../../core/services/lesson.service';
// import { LessonProgressTrackerComponent } from "../../../lesson/components/lesson-progress-tracker/lesson-progress-tracker.component";
// import { LessonQuizTakerComponent } from "../../../Test/lesson-quiz-taker/lesson-quiz-taker.component";
// import { Dialog } from "primeng/dialog";


// @Component({
//   selector: 'app-course-player',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ButtonModule,
//     AccordionModule,
//     ProgressBarModule,
//     TagModule,
//     TooltipModule,
//     ToastModule,
//     ConfirmDialogModule,
//     DurationPipe,
//     TitleCasePipe,
//     LessonProgressTrackerComponent,
//     LessonQuizTakerComponent,
//     Dialog
// ],
//   providers: [MessageService, ConfirmationService],
//   templateUrl: './course-player.component.html',
//   styleUrls: ['./course-player.component.scss']
// })
// export class CoursePlayerComponent implements OnInit {

//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private courseService = inject(CourseService);
//   private enrollmentService = inject(EnrollmentService);
//   private lessonService = inject(LessonService);
//   private messageService = inject(MessageService);
//   private confirmationService = inject(ConfirmationService);
//   private destroyRef = inject(DestroyRef);
//   private sanitizer = inject(DomSanitizer);

//   // Core State Signals
//   courseId = signal<string>('');
//   course = signal<any>(null);
//   sections = signal<any[]>([]);
//   currentLesson = signal<any>(null);

//   loading = signal<boolean>(true);
//   error = signal<string | null>(null);

//   // Progress & UI Signals
//   courseProgress = signal<number>(0);
//   completedLessons = signal<Set<string>>(new Set());
//   sidebarVisible = signal<boolean>(true);
//   expandedSections = signal<string[]>(['0']);

//   videoToken = computed<string>(() => {
//     const lesson = this.currentLesson();
//     if (lesson?.type !== 'video' || !lesson?.content?.video) return '';

//     const url = lesson.content.video.url;
//     const provider = lesson.content.video.provider;

//     if (provider === 'youtube') {
//       return this.extractYouTubeId(url);
//     }
    
//     // For local videos, return the URL or token
//     return url; 
//   });
  
//   // Computed: Flattened lessons for easy next/prev navigation
//   private flatLessons = computed(() => {
//     const secs = this.sections();
//     if (!secs || !secs.length) return [];
//     return secs.flatMap(s => s.lessons || []);
//   });

//   // Computed: Navigation
//   lessonNav = computed(() => {
//     const current = this.currentLesson();
//     const flat = this.flatLessons();
//     if (!current || !flat.length) return { prev: null, next: null };

//     const idx = flat.findIndex(l => l._id === current._id);
//     return {
//       prev: idx > 0 ? flat[idx - 1] : null,
//       next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null
//     };
//   });

//   // Computed: Current Lesson Status
//   isCurrentLessonCompleted = computed(() => {
//     const current = this.currentLesson();
//     return current ? this.completedLessons().has(current._id) : false;
//   });

//   // Computed: Safe Video URL (Fixes Angular "unsafe resource" errors)
//   safeVideoUrl = computed<SafeResourceUrl | null>(() => {
//     const lesson = this.currentLesson();
//     if (lesson?.type !== 'video' || !lesson?.content?.video?.url) return null;

//     const url = lesson.content.video.url;
//     const provider = lesson.content.video.provider;

//     if (provider === 'youtube') {
//       const id = this.extractYouTubeId(url);
//       return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=0&rel=0`);
//     }
//     if (provider === 'vimeo') {
//       const id = this.extractVimeoId(url);
//       return this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.vimeo.com/video/${id}?autoplay=0&title=0&byline=0&portrait=0`);
//     }
//     return null;
//   });

//   // Automatically hide sidebar on small screens
//   @HostListener('window:resize')
//   onResize() {
//     if (window.innerWidth <= 1024 && this.sidebarVisible()) {
//       this.sidebarVisible.set(false);
//     } else if (window.innerWidth > 1024 && !this.sidebarVisible()) {
//       this.sidebarVisible.set(true);
//     }
//   }

//   ngOnInit(): void {
//     this.onResize();

//     this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
//       if (params['id']) {
//         this.courseId.set(params['id']);
//         this.loadCourseData();
//       }
//     });
//   }

//   // --- Progress Tracker Event Handler ---
//   onProgressUpdatedFromTracker(progress: any): void {
//     this.completedLessons.update(set => {
//       const newSet = new Set(set);
//       if (progress.completed) {
//         newSet.add(progress.lessonId);
//       } else {
//         newSet.delete(progress.lessonId);
//       }
//       return newSet;
//     });

//     const totalLessons = this.flatLessons().length;
//     if (totalLessons > 0) {
//       this.courseProgress.set(Math.round((this.completedLessons().size / totalLessons) * 100));
//     }

//     if (progress.completed) {
//       const next = this.lessonNav().next;
//       if (next) {
//         setTimeout(() => this.selectLesson(next), 1500);
//       }
//     }
//   }

//   private loadCourseData(): void {
//     this.loading.set(true);

//     this.courseService.getCoursesBySlug(this.courseId())
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           const courseData = res.data?.course || res.data;
//           const sectionData = res.data?.sections || courseData.sections || [];

//           this.course.set(courseData);
//           this.sections.set(sectionData);

//           this.loadProgress();
//         },
//         error: (error: any) => {
//           console.error('Failed to load course', error);
//           this.error.set('You do not have access to this course, or it does not exist.');
//           this.loading.set(false);
//         }
//       });
//   }

//   private loadProgress(): void {
//     this.enrollmentService.getMyEnrollments(this.courseId())
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           const progressData = res.data;
//           this.completedLessons.set(new Set(progressData?.completedLessons || []));
//           this.courseProgress.set(progressData?.progress || 0);

//           if (progressData?.lastLessonId && !this.currentLesson()) {
//             this.restoreLastLesson(progressData.lastLessonId);
//           } else {
//             this.setFirstLesson();
//           }
//           this.loading.set(false);
//         },
//         error: () => {
//           this.setFirstLesson();
//           this.loading.set(false);
//         }
//       });
//   }

//   private restoreLastLesson(lessonId: string): void {
//     const lesson = this.flatLessons().find(l => l._id === lessonId);
//     if (lesson) {
//       this.selectLesson(lesson);
//     } else {
//       this.setFirstLesson();
//     }
//   }

//   private setFirstLesson(): void {
//     const flat = this.flatLessons();
//     if (flat.length > 0 && !this.currentLesson()) {
//       this.selectLesson(flat[0]);
//     }
//   }

//   selectLesson(lesson: any): void {
//     this.currentLesson.set(lesson);
//     this.expandSectionForLesson(lesson._id);

//     if (!lesson.content) {
//       this.lessonService.getl(this.courseId(), lesson.section, lesson._id)
//         .pipe(takeUntilDestroyed(this.destroyRef))
//         .subscribe({
//           next: (res: any) => {
//             if (this.currentLesson()?._id === lesson._id) {
//               this.currentLesson.set(res.data?.lesson || res.data);
//             }
//           },
//           error: (err) => {
//             // Check if it's our 403 Forbidden error from the backend
//             if (err.status === 403) {
//               this.error.set('premium_locked'); // Using a specific string to trigger the UI
//             } else {
//               this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load lesson content' });
//             }
//           }
//         });
//     }

//     if (window.innerWidth <= 1024) {
//       this.sidebarVisible.set(false);
//     }
//   }
  
//   private expandSectionForLesson(lessonId: string): void {
//     const secs = this.sections();
//     for (let i = 0; i < secs.length; i++) {
//       if (secs[i].lessons?.some((l: any) => l._id === lessonId)) {
//         const idxStr = i.toString();
//         const currentExpanded = this.expandedSections();
//         if (!currentExpanded.includes(idxStr)) {
//           this.expandedSections.set([...currentExpanded, idxStr]);
//         }
//         break;
//       }
//     }
//   }

//   completeCourse(): void {
//     if (this.courseProgress() < 100) return;

//     this.confirmationService.confirm({
//       message: 'Congratulations! Would you like to claim your certificate?',
//       header: 'Course Completed',
//       icon: 'pi pi-check-circle',
//       // accept: () => {
//       //   this.enrollmentService.completeCourse(this.courseId())
//       //     .pipe(takeUntilDestroyed(this.destroyRef))
//       //     .subscribe({
//       //       next: (res: any) => {
//       //         this.messageService.add({ severity: 'success', summary: 'Issued', detail: 'Certificate ready', sticky: true });
//       //         if (res.data?.certificateUrl) window.open(res.data.certificateUrl, '_blank');
//       //       },
//       //       error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate certificate' })
//       //     });
//       // }
//     });
//   }

//   toggleSidebar(): void {
//     this.sidebarVisible.update(v => !v);
//   }

//   goToMyLearning(): void {
//     this.router.navigate(['/my-learning']);
//   }

//   private extractYouTubeId(url: string): string {
//     const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
//     return (match && match[2].length === 11) ? match[2] : url;
//   }

//   private extractVimeoId(url: string): string {
//     const match = url.match(/^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/);
//     return match ? match[5] : url;
//   }




//   // In your component class, add:
// showQuizDialog = signal<boolean>(false);
// selectedQuizId = signal<string>('');

// // Add this method
// openQuizDialog(quizId: string): void {
//   this.selectedQuizId.set(quizId);
//   this.showQuizDialog.set(true);
// }

// handleQuizCompleted(result: { score: number, passed: boolean }): void {
//   this.showQuizDialog.set(false);
  
//   // Update progress if needed
//   if (this.currentLesson()) {
//     this.onProgressUpdatedFromTracker({
//       lessonId: this.currentLesson()._id,
//       completed: result.passed,
//       score: result.score
//     });
//   }
  
//   this.messageService.add({
//     severity: result.passed ? 'success' : 'info',
//     summary: result.passed ? 'Quiz Passed!' : 'Quiz Completed',
//     detail: `You scored ${result.score}% - ${result.passed ? 'Great job!' : 'Keep practicing!'}`
//   });
// }
// }
