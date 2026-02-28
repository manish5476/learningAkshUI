// import { Component, OnInit, ChangeDetectionStrategy, inject, signal, effect, DestroyRef, input } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule, Location } from '@angular/common';
// import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// // PrimeNG
// import { AccordionModule } from 'primeng/accordion';
// import { ButtonModule } from 'primeng/button';
// import { ProgressBarModule } from 'primeng/progressbar';
// import { CheckboxModule } from 'primeng/checkbox';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ToastModule } from 'primeng/toast';
// import { MessageService } from 'primeng/api';

// // Services & Models (Adjust paths as needed)
// import { CourseService } from '../../core/services/course.service';
// import { EnrollmentService } from '../../core/services/enrollment.service';
// import { EnrollmentProgress } from '../../core/models/enrollment.model';

// @Component({
//   selector: 'app-course-player',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   imports: [
//     CommonModule,
//     AccordionModule,
//     ButtonModule,
//     ProgressBarModule,
//     CheckboxModule,
//     ProgressSpinnerModule,
//     ToastModule
//   ],
//   providers: [MessageService],
//   template: `
//     <div class="player-wrapper">
//       <p-toast position="top-right"></p-toast>

//       <nav class="player-nav glass-panel-flat">
//         <div class="nav-left">
//           <button pButton pRipple icon="pi pi-arrow-left" class="p-button-text p-button-secondary p-button-rounded" 
//                   (click)="goBack()" pTooltip="Back to Dashboard"></button>
//           <div class="course-header-info">
//             <h2 class="course-title line-clamp-1">{{ courseTitle() }}</h2>
//             <span class="lesson-title text-muted line-clamp-1">Current: {{ activeLesson()?.title || 'Loading...' }}</span>
//           </div>
//         </div>
        
//         <div class="nav-right">
//           <div class="progress-container hidden-mobile">
//             <div class="flex justify-between text-xs font-medium mb-1 text-secondary">
//               <span>Your Progress</span>
//               <span>{{ courseProgress() }}%</span>
//             </div>
//             <p-progressBar [value]="courseProgress()" [showValue]="false" styleClass="header-progress"></p-progressBar>
//           </div>
//           <button pButton pRipple icon="pi pi-bars" class="p-button-text mobile-only" (click)="toggleSidebar()"></button>
//         </div>
//       </nav>

//       @if (isLoading()) {
//         <div class="loading-overlay">
//           <p-progressSpinner strokeWidth="4" animationDuration=".5s"></p-progressSpinner>
//           <p class="mt-4 text-muted font-medium">Loading your course environment...</p>
//         </div>
//       } @else {
//         <div class="player-layout">
          
//           <main class="content-area fade-in">
//             @if (activeLesson()) {
//               <div class="media-container glass-panel">
//                 @if (activeLesson()?.type === 'video' && safeVideoUrl()) {
//                   <div class="video-wrapper">
//                     <iframe [src]="safeVideoUrl()" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
//                   </div>
//                 } @else if (activeLesson()?.type === 'article') {
//                   <div class="article-wrapper prose">
//                     <div [innerHTML]="activeLesson()?.content?.article?.body"></div>
//                   </div>
//                 } @else {
//                   <div class="placeholder-wrapper">
//                     <i class="pi pi-file text-4xl text-muted mb-3"></i>
//                     <h3>{{ activeLesson()?.title }}</h3>
//                     <p class="text-muted">This is a {{ activeLesson()?.type }} activity.</p>
//                   </div>
//                 }
//               </div>

//               <div class="lesson-footer glass-panel mt-4">
//                 <div class="lesson-info">
//                   <h1 class="text-xl font-bold text-primary mb-2">{{ activeLesson()?.title }}</h1>
//                   <p class="text-muted text-sm">{{ activeLesson()?.description }}</p>
//                 </div>

//                 <div class="action-buttons mt-4 flex justify-between align-center border-t border-secondary pt-4">
//                   <div class="flex align-center gap-3">
//                     <button pButton pRipple icon="pi pi-step-backward" label="Previous" 
//                             class="p-button-outlined p-button-secondary" 
//                             [disabled]="isFirstLesson()" (click)="playPrevious()"></button>
                    
//                     <button pButton pRipple icon="pi pi-step-forward" label="Next" 
//                             class="p-button-primary shadow-btn" 
//                             [disabled]="isLastLesson()" (click)="playNext()"></button>
//                   </div>

//                   <div class="completion-toggle flex align-center gap-2 custom-checkbox cursor-pointer" 
//                        (click)="toggleLessonCompletion()">
//                     <p-checkbox [binary]="true" [ngModel]="isLessonCompleted(activeLesson()?._id)"></p-checkbox>
//                     <span class="font-medium text-sm" [class.text-success]="isLessonCompleted(activeLesson()?._id)">
//                       {{ isLessonCompleted(activeLesson()?._id) ? 'Completed' : 'Mark as Complete' }}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             }
//           </main>

//           <aside class="syllabus-sidebar glass-panel" [class.mobile-open]="sidebarVisible()">
//             <div class="sidebar-header border-b border-secondary pb-3 mb-3">
//               <h3 class="font-bold text-lg m-0"><i class="pi pi-list mr-2 text-primary"></i> Course Content</h3>
//             </div>
            
//             <div class="accordion-wrapper custom-scrollbar">
//               <p-accordion [multiple]="true">
//                 @for (section of sections(); track section._id; let i = $index) {
//                   <p-accordionTab [selected]="i === 0 || isSectionActive(section)">
//                     <ng-template pTemplate="header">
//                       <div class="flex justify-between w-full pr-2">
//                         <span class="font-semibold text-sm">{{ section.title }}</span>
//                         <span class="text-xs text-muted">{{ getCompletedLessonsCount(section) }}/{{ section.totalLessons || section.lessons?.length || 0 }}</span>
//                       </div>
//                     </ng-template>
                    
//                     <div class="lesson-list flex flex-col gap-1">
//                       @for (lesson of section.lessons; track lesson._id) {
//                         <div class="lesson-item flex align-center justify-between p-2 rounded cursor-pointer transition-colors"
//                              [class.active-lesson]="activeLesson()?._id === lesson._id"
//                              (click)="selectLesson(lesson, section)">
                          
//                           <div class="flex align-center gap-3 overflow-hidden">
//                             @if (isLessonCompleted(lesson._id)) {
//                               <i class="pi pi-check-circle text-success text-sm shrink-0"></i>
//                             } @else if (lesson.type === 'video') {
//                               <i class="pi pi-play-circle text-muted text-sm shrink-0"></i>
//                             } @else {
//                               <i class="pi pi-file text-muted text-sm shrink-0"></i>
//                             }
                            
//                             <span class="text-sm font-medium line-clamp-1" 
//                                   [class.text-primary]="activeLesson()?._id === lesson._id">
//                               {{ i + 1 }}.{{ $index + 1 }} {{ lesson.title }}
//                             </span>
//                           </div>

//                           @if (lesson.duration) {
//                             <span class="text-xs text-muted shrink-0">{{ lesson.duration }}m</span>
//                           }
//                         </div>
//                       }
//                     </div>
//                   </p-accordionTab>
//                 }
//               </p-accordion>
//             </div>
//           </aside>

//         </div>
//       }
//     </div>
//   `,
//   styles: [`
//     .player-wrapper {
//       display: flex;
//       flex-direction: column;
//       height: 100vh;
//       background: var(--bg-primary);
//       color: var(--text-primary);
//       overflow: hidden;
//     }

//     /* Top Navigation */
//     .player-nav {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: var(--spacing-sm) var(--spacing-xl);
//       background: var(--component-surface-raised);
//       border-bottom: var(--ui-border-width) solid var(--border-secondary);
//       height: 64px;
//       z-index: var(--z-sticky);
//     }

//     .nav-left {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//       flex: 1;
//       min-width: 0;
//     }

//     .course-header-info {
//       display: flex;
//       flex-direction: column;
//       min-width: 0;
//     }

//     .course-title {
//       font-family: var(--font-heading);
//       font-size: var(--font-size-md);
//       font-weight: var(--font-weight-bold);
//       margin: 0;
//     }

//     .nav-right {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xl);
//       min-width: 250px;
//       justify-content: flex-end;
//     }

//     .progress-container {
//       width: 200px;
//     }

//     /* Layout Grid */
//     .player-layout {
//       display: grid;
//       grid-template-columns: 1fr 380px;
//       gap: var(--spacing-lg);
//       padding: var(--spacing-lg);
//       height: calc(100vh - 64px);
//       overflow: hidden;
//     }

//     /* Main Content (Left) */
//     .content-area {
//       display: flex;
//       flex-direction: column;
//       overflow-y: auto;
//       padding-right: var(--spacing-xs);
      
//       &::-webkit-scrollbar { width: 6px; }
//       &::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: 10px; }
//     }

//     .video-wrapper {
//       position: relative;
//       width: 100%;
//       padding-top: 56.25%; /* 16:9 Aspect Ratio */
//       background: #000;
//       border-radius: var(--ui-border-radius-lg);
//       overflow: hidden;
//     }

//     .video-wrapper iframe {
//       position: absolute;
//       top: 0;
//       left: 0;
//       width: 100%;
//       height: 100%;
//       border: 0;
//     }

//     .article-wrapper, .placeholder-wrapper {
//       padding: var(--spacing-3xl);
//       min-height: 400px;
//       display: flex;
//       flex-direction: column;
//     }
    
//     .placeholder-wrapper {
//       align-items: center;
//       justify-content: center;
//       text-align: center;
//       background: var(--bg-secondary);
//       border-radius: var(--ui-border-radius-lg);
//     }

//     .lesson-footer {
//       padding: var(--spacing-xl);
//     }

//     /* Sidebar (Right) */
//     .syllabus-sidebar {
//       display: flex;
//       flex-direction: column;
//       height: 100%;
//       padding: var(--spacing-lg);
//       overflow: hidden;
//     }

//     .accordion-wrapper {
//       flex: 1;
//       overflow-y: auto;
//       padding-right: var(--spacing-xs);
//     }

//     .lesson-item {
//       border: 1px solid transparent;
      
//       &:hover {
//         background: var(--bg-hover);
//       }
//       &.active-lesson {
//         background: var(--color-primary-bg);
//         border-color: var(--color-primary-border);
//       }
//     }

//     /* Utilities */
//     .glass-panel {
//       background: var(--component-surface-raised);
//       border: var(--ui-border-width) solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-xl);
//     }
//     .glass-panel-flat {
//       background: var(--bg-primary);
//     }
//     .text-primary { color: var(--color-primary); }
//     .text-success { color: var(--color-success); }
//     .text-muted { color: var(--text-secondary); }
//     .border-secondary { border-color: var(--border-secondary); }
//     .shadow-btn { box-shadow: var(--shadow-sm); }
    
//     .line-clamp-1 {
//       display: -webkit-box;
//       -webkit-line-clamp: 1;
//       -webkit-box-orient: vertical;
//       overflow: hidden;
//       word-break: break-all;
//     }
//     .custom-scrollbar::-webkit-scrollbar { width: 4px; }
//     .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius: 10px; }

//     /* PrimeNG Overrides */
//     :host ::ng-deep {
//       .header-progress .p-progressbar {
//         height: 6px;
//         background: var(--bg-secondary);
//         border-radius: 10px;
//       }
//       .header-progress .p-progressbar-value {
//         background: var(--color-success);
//         border-radius: 10px;
//       }
//       .p-accordion-header-link {
//         background: transparent !important;
//         border: none !important;
//         padding: var(--spacing-md) 0 !important;
//         color: var(--text-primary) !important;
//       }
//       .p-accordion-content {
//         background: transparent !important;
//         border: none !important;
//         padding: 0 0 var(--spacing-md) 0 !important;
//       }
//     }

//     .loading-overlay {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       height: 100%;
//       flex: 1;
//     }

//     .mobile-only { display: none; }

//     /* Responsive */
//     @media (max-width: 1024px) {
//       .player-layout {
//         grid-template-columns: 1fr;
//         padding: 0;
//         height: calc(100vh - 64px);
//         overflow-y: auto;
//       }
      
//       .content-area {
//         padding: var(--spacing-md);
//         overflow: visible;
//       }

//       .syllabus-sidebar {
//         position: fixed;
//         top: 64px;
//         right: -100%;
//         width: 320px;
//         height: calc(100vh - 64px);
//         z-index: var(--z-fixed);
//         border-radius: 0;
//         transition: right 0.3s ease;
//         box-shadow: var(--shadow-2xl);
        
//         &.mobile-open { right: 0; }
//       }

//       .hidden-mobile { display: none; }
//       .mobile-only { display: block; }
//     }
//   `]
// })
// export class CoursePlayerComponent implements OnInit {
//   // Angular 21 Input Binding from Route (e.g. /learning/:courseId)
//   courseId = input.required<string>();

//   // Services
//   private courseService = inject(CourseService);
//   private enrollmentService = inject(EnrollmentService);
//   private messageService = inject(MessageService);
//   private location = inject(Location);
//   private sanitizer = inject(DomSanitizer);
//   private destroyRef = inject(DestroyRef);

//   // State Signals
//   isLoading = signal<boolean>(true);
//   courseTitle = signal<string>('Loading Course...');
//   sections = signal<any[]>([]); // Array of Sections with populated Lessons
//   activeLesson = signal<any | null>(null);
//   activeSection = signal<any | null>(null);
  
//   // Progress State
//   courseProgress = signal<number>(0);
//   completedLessonIds = signal<Set<string>>(new Set());
  
//   // UI State
//   sidebarVisible = signal<boolean>(false);
//   safeVideoUrl = signal<SafeResourceUrl | null>(null);

//   constructor() {
//     // Reactively load course data when the courseId route param changes
//     effect(() => {
//       const id = this.courseId();
//       if (id) {
//         this.loadCourseEnvironment(id);
//       }
//     }, { allowSignalWrites: true });
//   }

//   ngOnInit(): void {}

//   private loadCourseEnvironment(id: string): void {
//     this.isLoading.set(true);

//     // Ideally, you fetch the course structure AND the user's progress simultaneously
//     // Let's assume you fetch course details first, then progress
//     this.courseService.getSections(id) // Or a dedicated 'getCourseForPlayer' endpoint
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           // Assuming your API returns populated sections -> lessons
//           const loadedSections = res.data || [];
//           this.sections.set(loadedSections);
          
//           if (loadedSections.length > 0) {
//              this.courseTitle.set(loadedSections[0].course?.title || 'Course');
//           }

//           // Now fetch the progress mapping (which lessons are completed)
//           this.fetchProgress(id);
//         },
//         error: () => {
//           this.showError('Failed to load course content.');
//           this.isLoading.set(false);
//         }
//       });
//   }

//   private fetchProgress(courseId: string): void {
//     this.enrollmentService.getEnrollmentProgress(courseId)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           const progressData: EnrollmentProgress = res.data;
          
//           this.courseProgress.set(progressData.progress || 0);
//           this.completedLessonIds.set(new Set(progressData.completedLessons || []));

//           // Auto-select the last accessed lesson OR the first lesson
//           this.autoSelectLesson(progressData.lastLessonId);
//           this.isLoading.set(false);
//         },
//         error: () => {
//           // Fallback if progress fails, still allow them to view the first lesson
//           this.autoSelectLesson();
//           this.isLoading.set(false);
//         }
//       });
//   }

//   // --- Core Player Logic ---

//   private autoSelectLesson(lastLessonId?: string): void {
//     const allSections = this.sections();
//     if (!allSections || allSections.length === 0) return;

//     if (lastLessonId) {
//       for (const section of allSections) {
//         const found = section.lessons?.find((l: any) => l._id === lastLessonId);
//         if (found) {
//           this.selectLesson(found, section);
//           return;
//         }
//       }
//     }
    
//     // Fallback: Select very first lesson
//     if (allSections[0].lessons?.length > 0) {
//       this.selectLesson(allSections[0].lessons[0], allSections[0]);
//     }
//   }

//   selectLesson(lesson: any, section: any): void {
//     this.activeLesson.set(lesson);
//     this.activeSection.set(section);
    
//     // Safely sanitize the video URL if it's a video type
//     if (lesson.type === 'video' && lesson.content?.video?.url) {
//       // E.g. Convert standard YouTube link to embed link if necessary, then sanitize
//       let url = lesson.content.video.url;
//       if (url.includes('youtube.com/watch?v=')) {
//          url = url.replace('watch?v=', 'embed/');
//       }
//       this.safeVideoUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
//     } else {
//       this.safeVideoUrl.set(null);
//     }

//     // On mobile, close sidebar after selection
//     if (window.innerWidth <= 1024) {
//       this.sidebarVisible.set(false);
//     }
//   }

//   // --- Progress & Tracking Logic ---

//   isLessonCompleted(lessonId: string | undefined): boolean {
//     if (!lessonId) return false;
//     return this.completedLessonIds().has(lessonId);
//   }

//   getCompletedLessonsCount(section: any): number {
//     if (!section.lessons) return 0;
//     const completedSet = this.completedLessonIds();
//     return section.lessons.filter((l: any) => completedSet.has(l._id)).length;
//   }

//   toggleLessonCompletion(): void {
//     const lesson = this.activeLesson();
//     if (!lesson) return;

//     const isCurrentlyCompleted = this.isLessonCompleted(lesson._id);
//     const newStatus = !isCurrentlyCompleted;

//     // Optimistically update UI
//     const updatedSet = new Set(this.completedLessonIds());
//     if (newStatus) {
//       updatedSet.add(lesson._id);
//     } else {
//       updatedSet.delete(lesson._id);
//     }
//     this.completedLessonIds.set(updatedSet);

//     // Calculate new local percentage
//     this.recalculateTotalProgress();

//     // Call API
//     this.enrollmentService.updateLessonProgress(this.courseId(), lesson._id, newStatus)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           // Sync with server truth
//           this.courseProgress.set(res.data?.progress || this.courseProgress());
//           if (newStatus) {
//             this.messageService.add({ severity: 'success', summary: 'Completed', detail: 'Progress saved.', life: 2000 });
//           }
//         },
//         error: () => {
//           // Rollback on error
//           this.showError('Failed to save progress.');
//           this.fetchProgress(this.courseId()); 
//         }
//       });
//   }

//   private recalculateTotalProgress(): void {
//     let totalLessons = 0;
//     this.sections().forEach(s => totalLessons += (s.lessons?.length || 0));
    
//     if (totalLessons === 0) return;
    
//     const completed = this.completedLessonIds().size;
//     const percentage = Math.round((completed / totalLessons) * 100);
//     this.courseProgress.set(percentage);
//   }

//   // --- Navigation Helpers ---

//   isFirstLesson(): boolean {
//     const section = this.activeSection();
//     const lesson = this.activeLesson();
//     if (!section || !lesson) return true;

//     const isFirstSection = this.sections()[0]._id === section._id;
//     const isFirstLessonInSection = section.lessons[0]._id === lesson._id;

//     return isFirstSection && isFirstLessonInSection;
//   }

//   isLastLesson(): boolean {
//     const section = this.activeSection();
//     const lesson = this.activeLesson();
//     if (!section || !lesson) return true;

//     const sections = this.sections();
//     const isLastSection = sections[sections.length - 1]._id === section._id;
//     const isLastLessonInSection = section.lessons[section.lessons.length - 1]._id === lesson._id;

//     return isLastSection && isLastLessonInSection;
//   }

//   playNext(): void {
//     const currentSection = this.activeSection();
//     const currentLesson = this.activeLesson();
//     if (!currentSection || !currentLesson) return;

//     const lessonIndex = currentSection.lessons.findIndex((l: any) => l._id === currentLesson._id);
    
//     // If there is another lesson in the current section
//     if (lessonIndex < currentSection.lessons.length - 1) {
//       this.selectLesson(currentSection.lessons[lessonIndex + 1], currentSection);
//     } else {
//       // Jump to the first lesson of the NEXT section
//       const sectionIndex = this.sections().findIndex(s => s._id === currentSection._id);
//       if (sectionIndex < this.sections().length - 1) {
//         const nextSection = this.sections()[sectionIndex + 1];
//         if (nextSection.lessons && nextSection.lessons.length > 0) {
//           this.selectLesson(nextSection.lessons[0], nextSection);
//         }
//       }
//     }
//   }

//   playPrevious(): void {
//     const currentSection = this.activeSection();
//     const currentLesson = this.activeLesson();
//     if (!currentSection || !currentLesson) return;

//     const lessonIndex = currentSection.lessons.findIndex((l: any) => l._id === currentLesson._id);
    
//     // If there is a previous lesson in the current section
//     if (lessonIndex > 0) {
//       this.selectLesson(currentSection.lessons[lessonIndex - 1], currentSection);
//     } else {
//       // Jump to the LAST lesson of the PREVIOUS section
//       const sectionIndex = this.sections().findIndex(s => s._id === currentSection._id);
//       if (sectionIndex > 0) {
//         const prevSection = this.sections()[sectionIndex - 1];
//         if (prevSection.lessons && prevSection.lessons.length > 0) {
//           this.selectLesson(prevSection.lessons[prevSection.lessons.length - 1], prevSection);
//         }
//       }
//     }
//   }

//   isSectionActive(section: any): boolean {
//     return this.activeSection()?._id === section._id;
//   }

//   toggleSidebar(): void {
//     this.sidebarVisible.update(v => !v);
//   }

//   goBack(): void {
//     this.location.back();
//   }

//   private showError(msg: string): void {
//     this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
//   }
// }