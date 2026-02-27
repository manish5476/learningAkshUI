// course-player.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { AccordionModule } from 'primeng/accordion';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CourseService } from '../../../core/services/course.service';
import { LessonService } from '../../../core/services/lesson.service';
import { DurationPipe } from '../../../core/pipes/duration.pipe';

@Component({
  selector: 'app-course-player',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    PanelModule,
    AccordionModule,
    ProgressBarModule,
    TagModule,
    AvatarModule,
    BadgeModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule,
    // drawerModule,
    DurationPipe
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="course-player-container" [class.sidebar-collapsed]="!sidebarVisible">
      <p-toast position="top-right"></p-toast>
      <p-confirmDialog></p-confirmDialog>

      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading course...</p>
        </div>
      } @else if (error) {
        <div class="error-state">
          <i class="pi pi-exclamation-triangle"></i>
          <h3>Access Denied</h3>
          <p>{{ error }}</p>
          <button pButton pRipple 
                  label="Go to My Learning" 
                  icon="pi pi-arrow-left"
                  (click)="goToMyLearning()">
          </button>
        </div>
      } @else if (course) {
        <!-- Main Layout -->
        <div class="player-layout">
          <!-- Sidebar Toggle (Mobile) -->
          <button class="sidebar-toggle" (click)="toggleSidebar()">
            <i class="pi" [class.pi-chevron-right]="!sidebarVisible" [class.pi-chevron-left]="sidebarVisible"></i>
          </button>

          <!-- Course Content Sidebar -->
          <div class="course-sidebar" [class.visible]="sidebarVisible">
            <div class="sidebar-header">
              <h3 class="course-title">{{ course.title }}</h3>
              <div class="course-progress">
                <div class="progress-header">
                  <span class="progress-label">Your Progress</span>
                  <span class="progress-percent">{{ courseProgress }}%</span>
                </div>
                <p-progressBar [value]="courseProgress" [showValue]="false" styleClass="progress-bar"></p-progressBar>
              </div>
            </div>

            <div class="sidebar-content">
              <p-accordion [multiple]="true" [activeIndex]="[0]">
                @for (section of course.sections; track section._id; let i = $index) {
                  <p-accordionTab [header]="section.title" [selected]="i === 0">
                    <div class="section-info">
                      <span class="section-meta">
                        <i class="pi pi-file"></i> {{ section.totalLessons }} lessons
                        <i class="pi pi-clock ml-3"></i> {{ section.totalDuration | duration }}
                      </span>
                    </div>

                    <div class="lessons-list">
                      @for (lesson of section.lessons; track lesson._id) {
                        <div class="lesson-item" 
                             [class.active]="currentLesson?._id === lesson._id"
                             [class.completed]="isLessonCompleted(lesson._id)"
                             (click)="selectLesson(lesson)">
                          <div class="lesson-status">
                            @if (isLessonCompleted(lesson._id)) {
                              <i class="pi pi-check-circle text-success"></i>
                            } @else if (currentLesson?._id === lesson._id) {
                              <i class="pi pi-play-circle text-primary"></i>
                            } @else {
                              <i class="pi pi-circle"></i>
                            }
                          </div>

                          <div class="lesson-info">
                            <span class="lesson-title">{{ lesson.title }}</span>
                            <span class="lesson-meta">
                              <i class="pi pi-clock"></i> {{ lesson.duration | duration }}
                              @if (lesson.isFree) {
                                <p-tag value="Free" severity="success" [rounded]="true" styleClass="ml-2"></p-tag>
                              }
                            </span>
                          </div>

                          <div class="lesson-type">
                            @switch (lesson.type) {
                              @case ('video') {
                                <i class="pi pi-video" pTooltip="Video Lesson"></i>
                              }
                              @case ('article') {
                                <i class="pi pi-file" pTooltip="Article"></i>
                              }
                              @case ('quiz') {
                                <i class="pi pi-question-circle" pTooltip="Quiz"></i>
                              }
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </p-accordionTab>
                }
              </p-accordion>
            </div>
          </div>

          <!-- Main Content Area -->
          <div class="main-content">
            @if (currentLesson) {
              <!-- Lesson Header -->
              <div class="lesson-header">
                <div class="lesson-header-left">
                  <h2 class="lesson-title">{{ currentLesson.title }}</h2>
                  <div class="lesson-meta">
                    <span class="meta-item">
                      <i class="pi pi-tag"></i>
                      {{ currentLesson.type | titlecase }}
                    </span>
                    <span class="meta-item">
                      <i class="pi pi-clock"></i>
                      {{ currentLesson.duration | duration }}
                    </span>
                    @if (currentLesson.isFree) {
                      <p-tag value="Free Preview" severity="success" [rounded]="true"></p-tag>
                    }
                  </div>
                </div>
                <div class="lesson-header-right">
                  <button pButton pRipple 
                          icon="pi pi-check-circle"
                          [label]="isCurrentLessonCompleted ? 'Completed' : 'Mark Complete'"
                          [class]="isCurrentLessonCompleted ? 'p-button-success' : 'p-button-outlined'"
                          (click)="toggleLessonComplete()">
                  </button>
                </div>
              </div>

              <!-- Lesson Content -->
              <div class="lesson-content">
                @if (currentLesson.type === 'video') {
                  <div class="video-container">
                    <iframe 
                      *ngIf="currentLesson.content?.video?.provider === 'youtube'"
                      [src]="getYouTubeEmbedUrl(currentLesson.content.video.url)"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen>
                    </iframe>
                    
                    <iframe 
                      *ngIf="currentLesson.content?.video?.provider === 'vimeo'"
                      [src]="getVimeoEmbedUrl(currentLesson.content.video.url)"
                      frameborder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowfullscreen>
                    </iframe>

                    <video *ngIf="currentLesson.content?.video?.provider === 'local'" 
                           controls [src]="currentLesson.content.video.url" #videoPlayer></video>
                  </div>
                }

                @if (currentLesson.type === 'article') {
                  <div class="article-container">
                    <div class="article-content" [innerHTML]="currentLesson.content?.article?.body"></div>
                  </div>
                }

                @if (currentLesson.type === 'quiz') {
                  <div class="quiz-container">
                    <p-panel header="Quiz" [toggleable]="true">
                      <div class="quiz-content">
                        <p>Quiz content would be displayed here</p>
                      </div>
                    </p-panel>
                  </div>
                }

                <!-- Lesson Resources -->
                @if (currentLesson.resources?.length > 0) {
                  <div class="lesson-resources">
                    <h3>Resources</h3>
                    <div class="resources-list">
                      @for (resource of currentLesson.resources; track resource) {
                        <a [href]="resource.url" target="_blank" class="resource-item">
                          <i class="pi" [class.pi-file-pdf]="resource.type === 'pdf'"
                                     [class.pi-file-code]="resource.type === 'code'"
                                     [class.pi-link]="resource.type === 'link'"
                                     [class.pi-image]="resource.type === 'image'"></i>
                          <span class="resource-title">{{ resource.title }}</span>
                          <span class="resource-type">{{ resource.type | titlecase }}</span>
                          <i class="pi pi-download"></i>
                        </a>
                      }
                    </div>
                  </div>
                }

                <!-- Lesson Navigation -->
                <div class="lesson-navigation">
                  <button pButton pRipple 
                          label="Previous Lesson" 
                          icon="pi pi-chevron-left" 
                          class="p-button-outlined"
                          [disabled]="!prevLesson"
                          (click)="navigateToLesson(prevLesson)">
                  </button>
                  <button pButton pRipple 
                          label="Next Lesson" 
                          icon="pi pi-chevron-right" 
                          iconPos="right"
                          class="p-button-outlined"
                          [disabled]="!nextLesson"
                          (click)="navigateToLesson(nextLesson)">
                  </button>
                </div>
              </div>
            } @else {
              <div class="no-lesson-selected">
                <i class="pi pi-play-circle"></i>
                <h3>Select a lesson to start learning</h3>
                <p>Choose a lesson from the sidebar to begin your learning journey.</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .course-player-container {
      height: 100vh;
      overflow: hidden;
      background: var(--bg-primary);
    }

    /* Loading & Error States */
    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid var(--border-secondary);
      border-top-color: var(--accent-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: var(--spacing-lg);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state i {
      font-size: 4rem;
      color: var(--color-error);
      margin-bottom: var(--spacing-lg);
    }

    /* Layout */
    .player-layout {
      display: flex;
      height: 100%;
      position: relative;
    }

    /* Sidebar Toggle */
    .sidebar-toggle {
      position: fixed;
      left: 380px;
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 48px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-secondary);
      border-left: none;
      border-radius: 0 var(--ui-border-radius) var(--ui-border-radius) 0;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 100;
      color: var(--text-secondary);
      transition: var(--transition-base);
    }

    .sidebar-toggle:hover {
      background: var(--bg-hover);
      color: var(--accent-primary);
    }

    /* Sidebar */
    .course-sidebar {
      width: 380px;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border-secondary);
      display: flex;
      flex-direction: column;
      transition: var(--transition-base);
    }

    .sidebar-header {
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--border-secondary);
    }

    .course-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-md);
    }

    .course-progress {
      margin-bottom: var(--spacing-md);
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--spacing-xs);
    }

    .progress-label {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .progress-percent {
      color: var(--accent-primary);
      font-weight: var(--font-weight-medium);
    }

    :host ::ng-deep .progress-bar .p-progressbar {
      height: 8px;
      background: var(--bg-ternary);
    }

    :host ::ng-deep .progress-bar .p-progressbar .p-progressbar-value {
      background: var(--accent-primary);
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-md);
    }

    /* Section Styles */
    .section-info {
      padding: var(--spacing-xs) 0 var(--spacing-md);
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
    }

    .section-meta i {
      margin-right: var(--spacing-xs);
    }

    /* Lessons List */
    .lessons-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .lesson-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
      border-radius: var(--ui-border-radius);
      cursor: pointer;
      transition: var(--transition-base);
    }

    .lesson-item:hover {
      background: var(--bg-hover);
    }

    .lesson-item.active {
      background: var(--accent-focus);
      border-left: 3px solid var(--accent-primary);
    }

    .lesson-item.completed {
      opacity: 0.8;
    }

    .lesson-status {
      width: 20px;
      text-align: center;
    }

    .lesson-status i {
      font-size: var(--font-size-md);
    }

    .text-success {
      color: var(--color-success);
    }

    .text-primary {
      color: var(--accent-primary);
    }

    .lesson-info {
      flex: 1;
    }

    .lesson-title {
      display: block;
      color: var(--text-primary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      margin-bottom: var(--spacing-xs);
    }

    .lesson-meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-tertiary);
      font-size: var(--font-size-xs);
    }

    .lesson-meta i {
      font-size: var(--font-size-xs);
    }

    .lesson-type {
      color: var(--text-tertiary);
    }

    /* Main Content */
    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-xl);
    }

    .no-lesson-selected {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary);
    }

    .no-lesson-selected i {
      font-size: 4rem;
      margin-bottom: var(--spacing-lg);
    }

    /* Lesson Header */
    .lesson-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
      padding-bottom: var(--spacing-lg);
      border-bottom: 1px solid var(--border-secondary);
    }

    .lesson-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-sm);
    }

    .lesson-meta {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    /* Lesson Content */
    .lesson-content {
      max-width: 1000px;
      margin: 0 auto;
    }

    .video-container {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;
      margin-bottom: var(--spacing-xl);
    }

    .video-container iframe,
    .video-container video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .article-container {
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-xl);
      margin-bottom: var(--spacing-xl);
    }

    .article-content {
      color: var(--text-primary);
      line-height: 1.8;
      font-size: var(--font-size-lg);
    }

    .quiz-container {
      margin-bottom: var(--spacing-xl);
    }

    /* Resources */
    .lesson-resources {
      margin-top: var(--spacing-xl);
    }

    .lesson-resources h3 {
      color: var(--text-primary);
      margin-bottom: var(--spacing-md);
    }

    .resources-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .resource-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius);
      color: var(--text-primary);
      text-decoration: none;
      transition: var(--transition-base);
    }

    .resource-item:hover {
      background: var(--bg-hover);
      color: var(--accent-primary);
    }

    .resource-title {
      flex: 1;
    }

    .resource-type {
      color: var(--text-tertiary);
      font-size: var(--font-size-xs);
      margin-right: var(--spacing-sm);
    }

    /* Navigation */
    .lesson-navigation {
      display: flex;
      justify-content: space-between;
      margin-top: var(--spacing-xl);
      padding-top: var(--spacing-xl);
      border-top: 1px solid var(--border-secondary);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .sidebar-toggle {
        display: flex;
      }

      .course-sidebar {
        position: fixed;
        left: -380px;
        top: 0;
        bottom: 0;
        z-index: 99;
      }

      .course-sidebar.visible {
        left: 0;
      }

      .course-player-container.sidebar-collapsed .main-content {
        margin-left: 0;
      }

      .lesson-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-md);
      }

      .lesson-navigation {
        flex-direction: column;
        gap: var(--spacing-md);
      }
    }
  `]
})
export class CoursePlayerComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);
  private lessonService = inject(LessonService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  course: any = null;
  currentLesson: any = null;
  loading = true;
  error: string | null = null;
  
  // Progress tracking
  courseProgress = 0;
  completedLessons: Set<string> = new Set();
  
  // Navigation
  prevLesson: any = null;
  nextLesson: any = null;
  
  // UI State
  sidebarVisible = true;
  isCurrentLessonCompleted = false;

  private courseId: string = '';
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = params['id'];
      this.loadCourse();
    });

    // Check screen size for sidebar
    if (window.innerWidth <= 768) {
      this.sidebarVisible = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadCourse(): void {
    this.loading = true;
    const sub = this.courseService.getCourseWithCurriculum(this.courseId).subscribe({
      next: (res) => {
        this.course = res.data;
        this.loadProgress();
        this.setFirstLesson();
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load course', error);
        this.error = 'You do not have access to this course';
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadProgress(): void {
    const sub = this.enrollmentService.getEnrollmentProgress(this.courseId).subscribe({
      next: (res) => {
        this.completedLessons = new Set(res.data?.completedLessons || []);
        this.courseProgress = res.data?.progress || 0;
        this.updateCurrentLessonStatus();
      },
      error: (error) => console.error('Failed to load progress', error)
    });
    this.subscriptions.push(sub);
  }

  setFirstLesson(): void {
    if (this.course?.sections?.length > 0) {
      const firstSection = this.course.sections[0];
      if (firstSection.lessons?.length > 0) {
        this.selectLesson(firstSection.lessons[0]);
      }
    }
  }

  selectLesson(lesson: any): void {
    this.currentLesson = lesson;
    this.updateNavigation();
    this.updateCurrentLessonStatus();

    // Load lesson details if needed
    if (!lesson.content) {
      this.loadLessonDetails(lesson._id);
    }
  }

  loadLessonDetails(lessonId: string): void {
    const sub = this.lessonService.getLessonWithAccess(lessonId).subscribe({
      next: (res) => {
        if (this.currentLesson?._id === lessonId) {
          this.currentLesson = res.data;
        }
      },
      error: (error) => console.error('Failed to load lesson details', error)
    });
    this.subscriptions.push(sub);
  }

  updateNavigation(): void {
    if (!this.course?.sections || !this.currentLesson) return;

    let found = false;
    this.prevLesson = null;
    this.nextLesson = null;

    for (let i = 0; i < this.course.sections.length; i++) {
      const section = this.course.sections[i];
      for (let j = 0; j < section.lessons.length; j++) {
        const lesson = section.lessons[j];
        
        if (found) {
          this.nextLesson = lesson;
          return;
        }

        if (lesson._id === this.currentLesson._id) {
          found = true;
          // Check previous lesson
          if (j > 0) {
            this.prevLesson = section.lessons[j - 1];
          } else if (i > 0 && this.course.sections[i - 1].lessons.length > 0) {
            const prevSection = this.course.sections[i - 1];
            this.prevLesson = prevSection.lessons[prevSection.lessons.length - 1];
          }
        }
      }
    }
  }

  updateCurrentLessonStatus(): void {
    if (this.currentLesson) {
      this.isCurrentLessonCompleted = this.completedLessons.has(this.currentLesson._id);
    }
  }

  isLessonCompleted(lessonId: string): boolean {
    return this.completedLessons.has(lessonId);
  }

  toggleLessonComplete(): void {
    if (this.isCurrentLessonCompleted) {
      this.confirmationService.confirm({
        message: 'Are you sure you want to mark this lesson as incomplete?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.markLessonIncomplete();
        }
      });
    } else {
      this.markLessonComplete();
    }
  }

  markLessonComplete(): void {
    if (!this.currentLesson) return;

    const sub = this.lessonService.markAsCompleted(this.currentLesson._id).subscribe({
      next: () => {
        this.completedLessons.add(this.currentLesson._id);
        this.isCurrentLessonCompleted = true;
        this.courseProgress = Math.round((this.completedLessons.size / this.getTotalLessons()) * 100);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Great job!',
          detail: 'Lesson marked as completed'
        });

        // Auto-navigate to next lesson
        if (this.nextLesson) {
          setTimeout(() => {
            this.navigateToLesson(this.nextLesson);
          }, 1500);
        }
      },
      error: (error) => {
        console.error('Failed to mark lesson complete', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to mark lesson as complete'
        });
      }
    });
    this.subscriptions.push(sub);
  }

  markLessonIncomplete(): void {
    if (!this.currentLesson) return;

    // API call to mark incomplete
    this.completedLessons.delete(this.currentLesson._id);
    this.isCurrentLessonCompleted = false;
    this.courseProgress = Math.round((this.completedLessons.size / this.getTotalLessons()) * 100);

    this.messageService.add({
      severity: 'info',
      summary: 'Updated',
      detail: 'Lesson marked as incomplete'
    });
  }

  getTotalLessons(): number {
    return this.course?.sections?.reduce((total: number, section: any) => 
      total + (section.lessons?.length || 0), 0) || 0;
  }

  navigateToLesson(lesson: any): void {
    if (lesson) {
      this.selectLesson(lesson);
      
      // Scroll to top on mobile
      if (window.innerWidth <= 768) {
        document.querySelector('.main-content')?.scrollTo(0, 0);
        this.sidebarVisible = false;
      }
    }
  }

  // YouTube/Vimeo Embed URLs
  getYouTubeEmbedUrl(url: string): string {
    const videoId = this.extractYouTubeVideoId(url);
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&rel=0`;
  }

  getVimeoEmbedUrl(url: string): string {
    const videoId = this.extractVimeoVideoId(url);
    return `https://player.vimeo.com/video/${videoId}?autoplay=0&title=0&byline=0&portrait=0`;
  }

  private extractYouTubeVideoId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  }

  private extractVimeoVideoId(url: string): string {
    const regExp = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[5] : url;
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  goToMyLearning(): void {
    this.router.navigate(['/my-learning']);
  }
}