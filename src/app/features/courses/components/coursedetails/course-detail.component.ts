import { Component, OnInit, OnDestroy, inject, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, of, Subscription, delay } from 'rxjs';
import { Course, Section } from '../../../../core/models/course.model';
import { CourseService } from '../../../../core/services/course.service';


@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Loading State -->
    <div class="loading-state" *ngIf="isLoading">
      <div class="spinner"></div>
      <p>Loading course details...</p>
    </div>

    <!-- Error State -->
    <div class="error-state" *ngIf="error && !isLoading">
      <i class="pi pi-exclamation-circle text-error"></i>
      <h3>Failed to load course</h3>
      <p>{{ error }}</p>
      <button class="btn btn-primary" (click)="retry()">Try Again</button>
    </div>

    <!-- Main Detail View -->
    <div class="course-detail-container" *ngIf="course && !isLoading">
      <div class="course-hero">
        <div class="hero-background" [style.backgroundImage]="'url(' + (course.thumbnail || 'https://via.placeholder.com/1200x500') + ')'">
          <div class="hero-overlay"></div>
        </div>
        
        <div class="hero-content">
          <div class="breadcrumb">
            <a [routerLink]="isInstructorMode ? '/courses/instructor' : '/courses'">
              {{ isInstructorMode ? 'My Courses' : 'Browse Courses' }}
            </a>
            <i class="pi pi-chevron-right" style="font-size: 0.7rem;"></i>
            <span>{{ course.title }}</span>
          </div>

          <div class="course-badges">
            <span *ngIf="isInstructorMode" class="badge" [class.published]="course.isPublished" [class.approved]="course.isApproved">
              {{ getCourseStatus() }}
            </span>
            <span class="badge level" [class]="course.level">
              {{ course.level | titlecase }}
            </span>
            <span class="badge" *ngIf="course.isFree">
              <i class="pi pi-gift"></i> Free
            </span>
          </div>

          <h1 class="course-title">{{ course.title }}</h1>
          <p class="course-subtitle">{{ course.subtitle }}</p>

          <div class="course-meta-large">
            <div class="meta-item">
              <i class="pi pi-users"></i>
              <span>{{ course.totalEnrollments || 0 }} students</span>
            </div>
            <div class="meta-item">
              <i class="pi pi-video"></i>
              <span>{{ course.totalLessons || 0 }} lessons</span>
            </div>
            <div class="meta-item">
              <i class="pi pi-clock"></i>
              <span>{{ course.totalDuration || 0 }} min total</span>
            </div>
            <div class="meta-item">
              <i class="pi pi-star-fill text-yellow"></i>
              <span>{{ course.rating | number:'1.1-1' }} ({{ course.totalReviews || 0 }} reviews)</span>
            </div>
          </div>

          <!-- INSTRUCTOR ACTIONS -->
          <div class="hero-actions" *ngIf="isInstructorMode">
            <button class="btn btn-primary" (click)="editCourse()">
              <i class="pi pi-pencil"></i> Edit Course
            </button>
            
            <button class="btn btn-success"  (click)="approve()">
              <i class="pi pi-rocket"></i> approve
            </button>
            <button class="btn btn-success" *ngIf="!course.isPublished" (click)="publishCourse()">
              <i class="pi pi-rocket"></i> Publish
            </button>
            
            <button class="btn btn-warning" *ngIf="course.isPublished" (click)="unpublishCourse()">
              <i class="pi pi-eye-slash"></i> Unpublish
            </button>

            <button class="btn btn-secondary" *ngIf="course.isPublished && !course.isApproved" disabled>
              <i class="pi pi-hourglass"></i> Pending Approval
            </button>

            <button class="btn btn-outline" (click)="previewCourse()">
              <i class="pi pi-external-link"></i> Public Preview
            </button>
          </div>

          <!-- PUBLIC ACTIONS -->
          <div class="hero-actions" *ngIf="!isInstructorMode">
             <button class="btn btn-primary">
              <i class="pi pi-play-circle"></i> {{ course.isFree ? 'Enroll for Free' : 'Buy Now' }}
            </button>
          </div>

        </div>
      </div>

      <!-- Main Content -->
      <div class="course-main">
        <div class="content-grid">
          
          <!-- Left Column -->
          <div class="left-column">
            <!-- Overview -->
            <section class="content-section" *ngIf="course.description">
              <h2 class="section-title">Overview</h2>
              <div class="description" [innerHTML]="course.description"></div>
            </section>

            <!-- What You'll Learn -->
            <section class="content-section" *ngIf="course.whatYouWillLearn && course.whatYouWillLearn.length">
              <h2 class="section-title">What You'll Learn</h2>
              <div class="learning-grid">
                <div *ngFor="let item of course.whatYouWillLearn" class="learning-item">
                  <i class="pi pi-check-circle"></i>
                  <span>{{ item }}</span>
                </div>
              </div>
            </section>

            <!-- Requirements -->
            <section class="content-section" *ngIf="course.requirements && course.requirements.length">
              <h2 class="section-title">Requirements</h2>
              <ul class="requirements-list">
                <li *ngFor="let req of course.requirements">
                  <i class="pi pi-circle-fill"></i>
                  {{ req }}
                </li>
              </ul>
            </section>

            <!-- Target Audience -->
            <section class="content-section" *ngIf="course.targetAudience && course.targetAudience.length">
              <h2 class="section-title">Target Audience</h2>
              <ul class="audience-list">
                <li *ngFor="let audience of course.targetAudience">
                  <i class="pi pi-user-plus"></i>
                  {{ audience }}
                </li>
              </ul>
            </section>
          </div>

          <!-- Right Column (Sidebar) -->
          <div class="right-column">
            
            <!-- Pricing Card -->
            <div class="pricing-card">
              <div class="price-section">
                <span class="current-price" *ngIf="!course.isFree">
                  {{ course.discountPrice ? (course.discountPrice | currency:course.currency) : (course.price | currency:course.currency) }}
                </span>
                <span class="free-badge-large" *ngIf="course.isFree">FREE</span>
                
                <div class="discount-info" *ngIf="course.discountPrice && !course.isFree">
                  <span class="original-price">{{ course.price | currency:course.currency }}</span>
                  <span class="discount-badge-large">
                    -{{ calculateDiscount() }}%
                  </span>
                </div>
              </div>

              <div class="price-meta" *ngIf="course.discountPrice && course.discountEndDate">
                <div class="discount-timer">
                  <i class="pi pi-clock"></i> Offer ends {{ course.discountEndDate | date }}
                </div>
              </div>

              <div class="pricing-actions">
                <button *ngIf="isInstructorMode" class="btn btn-primary btn-block" (click)="editPricing()">
                  <i class="pi pi-tag"></i> Edit Pricing
                </button>
                <button *ngIf="!isInstructorMode" class="btn btn-primary btn-block">
                  {{ course.isFree ? 'Enroll Now' : 'Purchase Course' }}
                </button>
              </div>
            </div>

            <!-- Course Info Card -->
            <div class="info-card">
              <h3 class="info-title">Course Information</h3>
              
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">Category</span>
                  <span class="info-value">{{ getCategoryName() }}</span>
                </div>
                <div class="info-row" *ngIf="!isInstructorMode">
                  <span class="info-label">Instructor</span>
                  <span class="info-value">{{ course.instructor?.firstName }} {{ course.instructor?.lastName }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Language</span>
                  <span class="info-value">{{ course.language }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Last Updated</span>
                  <span class="info-value">{{ course.updatedAt | date:'mediumDate' }}</span>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div class="tags-card" *ngIf="course.tags && course.tags.length">
              <h3 class="info-title">Tags</h3>
              <div class="tags-list">
                <span *ngFor="let tag of course.tags" class="tag">#{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Curriculum Section -->
        <section class="curriculum-section">
          <div class="curriculum-header">
            <h2 class="section-title">Course Curriculum</h2>
            <button *ngIf="isInstructorMode" class="btn btn-secondary" (click)="editCurriculum()">
              <i class="pi pi-pencil"></i> Edit Curriculum
            </button>
          </div>

          <div class="curriculum-stats">
            <div class="stat">
              <span class="stat-value">{{ course.totalSections || 0 }}</span>
              <span class="stat-label">Sections</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ course.totalLessons || 0 }}</span>
              <span class="stat-label">Lessons</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ course.totalDuration || 0 }}</span>
              <span class="stat-label">Minutes</span>
            </div>
          </div>

          <div class="curriculum-list">
            <div *ngFor="let section of sections; let i = index" class="curriculum-section-box">
              
              <div class="section-header">
                <div class="section-title-wrapper">
                  <i class="pi pi-angle-down"></i>
                  <h3 class="section-title-text">{{ section.title }}</h3>
                </div>
                <div class="section-meta">
                  <span>{{ section.lessons?.length || 0 }} lessons</span>
                  <span>{{ section.totalDuration || 0 }} min</span>
                </div>
              </div>

              <div class="lessons-list">
                <div *ngFor="let lesson of section.lessons" class="lesson-item">
                  <div class="lesson-info">
                    <i class="pi" 
                       [class.pi-video]="lesson.type === 'video'"
                       [class.pi-file]="lesson.type === 'article'"
                       [class.pi-question-circle]="lesson.type === 'quiz'"></i>
                    <span class="lesson-title">{{ lesson.title }}</span>
                    <span class="lesson-type-badge">{{ lesson.type }}</span>
                  </div>
                  <div class="lesson-meta">
                    <span class="lesson-duration" *ngIf="lesson.duration">
                      <i class="pi pi-clock"></i> {{ lesson.duration }} min
                    </span>
                    <span class="free-badge-small" *ngIf="lesson.isFree">PREVIEW</span>
                  </div>
                </div>
              </div>

            </div>

            <div class="empty-curriculum" *ngIf="!sections.length">
              <i class="pi pi-list"></i>
              <h3>No curriculum yet</h3>
              <p>{{ isInstructorMode ? 'Start adding sections and lessons to your course' : 'The instructor is currently building this curriculum.' }}</p>
              <button *ngIf="isInstructorMode" class="btn btn-primary mt-sm" (click)="editCurriculum()">
                Build Curriculum
              </button>
            </div>
          </div>
        </section>

        <!-- Analytics Preview (Only visible to Instructors) -->
        <section class="analytics-section" *ngIf="isInstructorMode">
          <div class="analytics-header">
            <h2 class="section-title">Performance Overview</h2>
            <a [routerLink]="['/instructor/courses', course._id, 'analytics']" class="view-all">
              View Full Analytics <i class="pi pi-arrow-right" style="font-size: 0.8rem; margin-left: 4px;"></i>
            </a>
          </div>

          <div class="analytics-grid">
            <div class="analytics-card">
              <div class="analytics-icon">
                <i class="pi pi-graduation-cap"></i>
              </div>
              <div class="analytics-content">
                <span class="analytics-value">{{ course.totalEnrollments || 0 }}</span>
                <span class="analytics-label">Enrollments</span>
              </div>
            </div>

            <div class="analytics-card">
              <div class="analytics-icon">
                <i class="pi pi-star-fill text-yellow"></i>
              </div>
              <div class="analytics-content">
                <span class="analytics-value">{{ course.rating | number:'1.1-1' }}</span>
                <span class="analytics-label">Rating</span>
              </div>
            </div>

            <div class="analytics-card">
              <div class="analytics-icon">
                <i class="pi pi-check-circle text-success"></i>
              </div>
              <div class="analytics-content">
                <span class="analytics-value">{{ completionRate }}%</span>
                <span class="analytics-label">Completion</span>
              </div>
            </div>

            <div class="analytics-card">
              <div class="analytics-icon">
                <i class="pi pi-dollar"></i>
              </div>
              <div class="analytics-content">
                <span class="analytics-value">{{ revenue | currency:course.currency }}</span>
                <span class="analytics-label">Revenue</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       THEME VARIABLES & CANONICAL MAPPING
       ========================================================================== */
    :host {
      display: block;
      min-height: 100vh;
      background: var(--bg-primary);

      // --font-body: 'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      // --font-heading: 'Poppins', -apple-system, system-ui, sans-serif;

      // --font-size-xs: 0.65rem;
      // --font-size-sm: 0.75rem;
      // --font-size-md: 0.875rem;
      // --font-size-lg: 0.9375rem;
      // --font-size-xl: 1rem;
      // --font-size-2xl: 1.125rem;
      // --font-size-3xl: 1.375rem;
      // --font-size-4xl: 1.75rem;

      // --spacing-xs: 0.25rem;
      // --spacing-sm: 0.375rem;
      // --spacing-md: 0.5rem;
      // --spacing-lg: 0.75rem;
      // --spacing-xl: 1rem;
      // --spacing-2xl: 1.5rem;
      // --spacing-3xl: 2rem;
      // --spacing-4xl: 2.75rem;
      // --spacing-5xl: 3.5rem;

      // --ui-border-radius: 5px;
      // --ui-border-radius-lg: 10px;
      // --ui-border-radius-xl: 16px;
      // --ui-border-width: 1px;

      // --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
      // --shadow-md: 0 2px 6px rgba(0, 0, 0, 0.08);
      // --transition-base: all 0.22s cubic-bezier(0.2, 0.9, 0.2, 1);
      
      // --theme-bg-primary: #ffffff;
      // --theme-bg-secondary: #f8fafc;
      // --theme-text-primary: #0f172a;
      // --theme-text-secondary: #475569;
      // --theme-text-tertiary: #94a3b8;
      // --theme-border-primary: #e2e8f0;
      // --theme-border-secondary: #f1f5f9;
      
      // --theme-accent-primary: #3b82f6;
      // --theme-accent-hover: #2563eb;
      // --theme-success: #10b981;
      // --theme-warning: #f59e0b;
      // --theme-error: #ef4444;
      // --theme-info: #8b5cf6;

      // /* Mappings */
      // --bg-primary: var(--theme-bg-primary);
      // --bg-secondary: var(--theme-bg-secondary);
      // --text-primary: var(--theme-text-primary);
      // --text-secondary: var(--theme-text-secondary);
      // --text-tertiary: var(--theme-text-tertiary);
      // --border-primary: var(--theme-border-primary);
      // --border-secondary: var(--theme-border-secondary);
      // --accent-primary: var(--theme-accent-primary);
      // --accent-hover: var(--theme-accent-hover);
      // --color-success: var(--theme-success);
      // --color-warning: var(--theme-warning);
      // --color-error: var(--theme-error);
      // --color-info: var(--theme-info);
      
      // --color-success-bg: color-mix(in srgb, var(--theme-success) 15%, transparent);
      // --color-warning-bg: color-mix(in srgb, var(--theme-warning) 15%, transparent);
      // --color-error-bg: color-mix(in srgb, var(--theme-error) 15%, transparent);
      // --color-success-dark: color-mix(in srgb, var(--theme-success) 80%, black);
      // --color-warning-dark: color-mix(in srgb, var(--theme-warning) 80%, black);
      // --color-error-dark: color-mix(in srgb, var(--theme-error) 80%, black);
      font-family: var(--font-body);
      color: var(--text-primary);
    }

    :host-context(.dark) {
      --theme-bg-primary: #0f172a;
      --theme-bg-secondary: #1e293b;
      --theme-text-primary: #f8fafc;
      --theme-text-secondary: #cbd5e1;
      --theme-text-tertiary: #64748b;
      --theme-border-primary: #334155;
      --theme-border-secondary: #1e293b;
    }

    .text-yellow { color: #facc15; }
    .text-success { color: var(--color-success); }
    .text-error { color: var(--color-error); }
    .mt-sm { margin-top: var(--spacing-sm); }

    /* Loading & Error */
    .loading-state, .error-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 50vh; text-align: center; color: var(--text-secondary);
    }
    .spinner {
      width: 40px; height: 40px; border: 3px solid var(--border-secondary);
      border-top-color: var(--accent-primary); border-radius: 50%;
      animation: spin 0.8s linear infinite; margin-bottom: var(--spacing-lg);
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-state i { font-size: 3rem; margin-bottom: var(--spacing-md); }

    /* Hero Section */
    .course-hero {
      position: relative; height: auto; min-height: 400px;
      display: flex; align-items: center; color: white; overflow: hidden;
    }
    .hero-background {
      position: absolute; inset: 0;
      background-size: cover; background-position: center;
    }
    .hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(90deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.8) 50%, rgba(15,23,42,0.4) 100%);
    }
    .hero-content {
      position: relative; z-index: 1; width: 100%; max-width: 1280px;
      margin: 0 auto; padding: var(--spacing-4xl) var(--spacing-3xl);
    }

    .breadcrumb {
      display: flex; align-items: center; gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg); font-size: var(--font-size-sm); color: rgba(255,255,255,0.7);
    }
    .breadcrumb a { color: rgba(255,255,255,0.9); text-decoration: none; transition: var(--transition-base); }
    .breadcrumb a:hover { color: white; text-decoration: underline; }

    .course-badges { display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-xl); }
    .badge {
      padding: var(--spacing-xs) var(--spacing-md); background: rgba(255,255,255,0.1);
      border-radius: var(--ui-border-radius); font-size: var(--font-size-xs);
      font-weight: 600; backdrop-filter: blur(4px); text-transform: uppercase; letter-spacing: 0.5px;
    }
    .badge.published { background: var(--color-success); color: white; }
    .badge.approved { background: var(--color-info); color: white; }
    .badge.level.beginner { background: var(--color-success-bg); color: var(--color-success-dark); border: 1px solid var(--color-success); }
    .badge.level.intermediate { background: var(--color-warning-bg); color: var(--color-warning-dark); border: 1px solid var(--color-warning); }
    .badge.level.advanced { background: var(--color-error-bg); color: var(--color-error-dark); border: 1px solid var(--color-error); }

    .course-title {
      font-family: var(--font-heading); font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 700; margin: 0 0 var(--spacing-sm); line-height: 1.2; text-wrap: balance;
    }
    .course-subtitle {
      font-size: var(--font-size-lg); color: rgba(255,255,255,0.85);
      margin: 0 0 var(--spacing-2xl); max-width: 800px; line-height: 1.5;
    }

    .course-meta-large {
      display: flex; flex-wrap: wrap; gap: var(--spacing-2xl);
      margin-bottom: var(--spacing-2xl); font-size: var(--font-size-sm); color: rgba(255,255,255,0.9);
    }
    .meta-item { display: flex; align-items: center; gap: var(--spacing-sm); }
    .meta-item i { font-size: 1.1rem; opacity: 0.9; }

    /* Buttons */
    .hero-actions { display: flex; flex-wrap: wrap; gap: var(--spacing-md); }
    .btn {
      padding: var(--spacing-md) var(--spacing-xl); border-radius: var(--ui-border-radius-lg);
      font-size: var(--font-size-sm); font-weight: 600; border: none; cursor: pointer;
      transition: var(--transition-base); display: inline-flex; align-items: center; gap: var(--spacing-sm);
    }
    .btn-primary { background: var(--accent-primary); color: white; }
    .btn-primary:hover:not(:disabled) { background: var(--accent-hover); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .btn-success { background: var(--color-success); color: white; }
    .btn-success:hover { background: color-mix(in srgb, var(--color-success) 80%, black); transform: translateY(-2px); }
    .btn-warning { background: var(--color-warning); color: white; }
    .btn-warning:hover { background: color-mix(in srgb, var(--color-warning) 80%, black); transform: translateY(-2px); }
    
    .btn-secondary { background: rgba(255,255,255,0.15); color: white; backdrop-filter: blur(4px); }
    .btn-secondary:hover:not(:disabled) { background: rgba(255,255,255,0.25); }
    .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.4); color: white; }
    .btn-outline:hover { background: rgba(255,255,255,0.1); border-color: white; }
    .btn-block { width: 100%; justify-content: center; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Main Layout */
    .course-main { max-width: 1280px; margin: 0 auto; padding: var(--spacing-4xl) var(--spacing-3xl); }
    .content-grid { display: grid; grid-template-columns: 1fr 380px; gap: var(--spacing-4xl); margin-bottom: var(--spacing-4xl); align-items: start; }
    
    /* Content Sections */
    .content-section { margin-bottom: var(--spacing-4xl); }
    .section-title { font-family: var(--font-heading); font-size: var(--font-size-2xl); font-weight: 700; color: var(--text-primary); margin: 0 0 var(--spacing-xl); }
    .description { color: var(--text-secondary); line-height: 1.7; font-size: var(--font-size-md); }

    .learning-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: var(--spacing-md); }
    .learning-item {
      display: flex; align-items: flex-start; gap: var(--spacing-md);
      padding: var(--spacing-lg); background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-lg); border: 1px solid var(--border-secondary); color: var(--text-secondary); font-size: var(--font-size-sm);
    }
    .learning-item i { color: var(--color-success); margin-top: 2px; font-size: 1rem; }

    .requirements-list, .audience-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--spacing-md); }
    .requirements-list li, .audience-list li { display: flex; align-items: flex-start; gap: var(--spacing-md); color: var(--text-secondary); font-size: var(--font-size-sm); }
    .requirements-list i { font-size: 0.5rem; color: var(--text-tertiary); margin-top: 6px; }
    .audience-list i { color: var(--accent-primary); margin-top: 2px; }

    /* Right Sidebar Cards */
    .pricing-card, .info-card, .tags-card {
      background: var(--bg-primary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl); padding: var(--spacing-2xl); margin-bottom: var(--spacing-xl); box-shadow: var(--shadow-sm);
    }

    .price-section { text-align: center; margin-bottom: var(--spacing-lg); }
    .current-price { font-family: var(--font-heading); font-size: 2.5rem; font-weight: 700; color: var(--text-primary); }
    .free-badge-large {
      display: inline-block; padding: var(--spacing-sm) var(--spacing-xl); background: var(--color-success-bg);
      color: var(--color-success-dark); border-radius: var(--ui-border-radius-lg); font-size: var(--font-size-xl); font-weight: 700;
    }
    .discount-info { display: flex; align-items: center; justify-content: center; gap: var(--spacing-md); margin-top: var(--spacing-sm); }
    .original-price { color: var(--text-tertiary); text-decoration: line-through; font-size: var(--font-size-md); }
    .discount-badge-large {
      padding: 2px var(--spacing-md); background: var(--color-error-bg); color: var(--color-error-dark);
      border-radius: var(--ui-border-radius); font-weight: 700; font-size: var(--font-size-sm);
    }
    .discount-timer { text-align: center; font-size: var(--font-size-sm); color: var(--color-warning); margin-bottom: var(--spacing-lg); font-weight: 500;}

    .info-title { font-family: var(--font-heading); font-size: var(--font-size-lg); font-weight: 600; color: var(--text-primary); margin: 0 0 var(--spacing-lg); }
    .info-grid { display: flex; flex-direction: column; gap: 0; }
    .info-row { display: flex; justify-content: space-between; padding: var(--spacing-md) 0; border-bottom: 1px solid var(--border-secondary); }
    .info-row:last-child { border-bottom: none; padding-bottom: 0; }
    .info-label { color: var(--text-secondary); font-size: var(--font-size-sm); }
    .info-value { color: var(--text-primary); font-weight: 500; font-size: var(--font-size-sm); text-align: right; max-width: 60%; }

    .tags-list { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); }
    .tag {
      padding: 4px var(--spacing-md); background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: 999px; font-size: var(--font-size-xs); color: var(--text-secondary); font-weight: 500;
    }

    /* Curriculum Section */
    .curriculum-section { margin-bottom: var(--spacing-4xl); max-width: 850px; }
    .curriculum-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xl); flex-wrap: wrap; gap: var(--spacing-md); }
    
    .curriculum-stats {
      display: flex; gap: var(--spacing-3xl); margin-bottom: var(--spacing-2xl); padding: var(--spacing-xl) var(--spacing-2xl);
      background: var(--bg-secondary); border-radius: var(--ui-border-radius-xl); border: 1px solid var(--border-secondary);
    }
    .stat { display: flex; flex-direction: column; align-items: flex-start; }
    .stat-value { font-family: var(--font-heading); font-size: var(--font-size-2xl); font-weight: 700; color: var(--accent-primary); }
    .stat-label { font-size: var(--font-size-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;}

    .curriculum-list { display: flex; flex-direction: column; gap: var(--spacing-lg); }
    .curriculum-section-box {
      background: var(--bg-primary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg); overflow: hidden; box-shadow: var(--shadow-sm);
    }
    .section-header {
      display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-secondary); cursor: pointer; border-bottom: 1px solid var(--border-primary);
    }
    .section-title-wrapper { display: flex; align-items: center; gap: var(--spacing-md); }
    .section-title-wrapper i { color: var(--text-tertiary); font-size: 0.9rem; }
    .section-title-text { margin: 0; font-size: var(--font-size-md); font-weight: 600; color: var(--text-primary); }
    .section-meta { display: flex; gap: var(--spacing-lg); color: var(--text-secondary); font-size: var(--font-size-xs); font-weight: 500;}

    .lessons-list { display: flex; flex-direction: column; }
    .lesson-item {
      display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-md) var(--spacing-xl);
      border-bottom: 1px solid var(--border-secondary); background: var(--bg-primary); transition: var(--transition-base);
    }
    .lesson-item:hover { background: var(--bg-secondary); }
    .lesson-item:last-child { border-bottom: none; }
    
    .lesson-info { display: flex; align-items: center; gap: var(--spacing-md); }
    .lesson-info i { color: var(--text-tertiary); font-size: 1.1rem; }
    .lesson-title { color: var(--text-primary); font-size: var(--font-size-sm); font-weight: 500; }
    .lesson-type-badge {
      padding: 2px 8px; background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: 999px; font-size: 0.65rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 600;
    }
    .lesson-meta { display: flex; align-items: center; gap: var(--spacing-md); }
    .lesson-duration { display: flex; align-items: center; gap: 4px; color: var(--text-secondary); font-size: var(--font-size-xs); }
    .free-badge-small {
      padding: 2px 8px; background: var(--color-success-bg); color: var(--color-success-dark);
      border-radius: 999px; font-size: 0.65rem; font-weight: 700; border: 1px solid var(--color-success);
    }

    .empty-curriculum {
      text-align: center; padding: var(--spacing-5xl); background: var(--bg-secondary);
      border: 2px dashed var(--border-primary); border-radius: var(--ui-border-radius-xl);
    }
    .empty-curriculum i { font-size: 3rem; color: var(--text-tertiary); margin-bottom: var(--spacing-md); }
    .empty-curriculum h3 { color: var(--text-primary); margin: 0 0 var(--spacing-sm); font-family: var(--font-heading); font-size: var(--font-size-xl);}
    .empty-curriculum p { color: var(--text-secondary); margin-bottom: 0; font-size: var(--font-size-sm); }

    /* Analytics Section */
    .analytics-section {
      margin-top: var(--spacing-5xl); padding-top: var(--spacing-4xl); border-top: 1px solid var(--border-primary); max-width: 850px;
    }
    .analytics-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-2xl); }
    .view-all { color: var(--accent-primary); text-decoration: none; font-size: var(--font-size-sm); font-weight: 600; display: flex; align-items: center;}
    .view-all:hover { text-decoration: underline; }

    .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-xl); }
    .analytics-card {
      display: flex; align-items: center; gap: var(--spacing-lg); padding: var(--spacing-xl);
      background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-sm); transition: var(--transition-base);
    }
    .analytics-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
    
    .analytics-icon {
      width: 48px; height: 48px; border-radius: 50%; background: var(--bg-secondary); border: 1px solid var(--border-primary);
      color: var(--text-secondary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;
    }
    .analytics-content { display: flex; flex-direction: column; gap: 2px; }
    .analytics-value { font-family: var(--font-heading); font-size: var(--font-size-2xl); font-weight: 700; color: var(--text-primary); }
    .analytics-label { font-size: var(--font-size-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;}

    /* Responsive */
    @media (max-width: 1024px) {
      .content-grid { grid-template-columns: 1fr; }
      .right-column { order: -1; } /* Bring pricing card to top on mobile */
      .curriculum-section, .analytics-section { max-width: 100%; }
    }

    @media (max-width: 768px) {
      .hero-content { padding: var(--spacing-2xl) var(--spacing-xl); }
      .course-meta-large { flex-direction: column; gap: var(--spacing-md); }
      .curriculum-stats { flex-wrap: wrap; gap: var(--spacing-xl); }
      .section-header { flex-direction: column; align-items: flex-start; gap: var(--spacing-sm); }
      .lesson-item { flex-direction: column; align-items: flex-start; gap: var(--spacing-md); }
    }
  `]
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);

  course?: Course;
  sections: Section[] = [];
  isLoading = true;
  error: string | null = null;
  completionRate = 0;
  revenue = 0;

  private subscriptions: Subscription[] = [];
  isInstructorMode: boolean = false;

  ngOnInit(): void {
    // 1. Determine the mode (Instructor vs Public)
    this.isInstructorMode = this.router.url.includes('/instructor');

    // 2. Extract ID or Slug from route
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadCourse(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadCourse(identifier: string): void {
    this.isLoading = true;
    this.error = null;
    let sub: Subscription;
    
    // 3. Fetch data securely based on the mode
    if (this.isInstructorMode) {
       // Instructors fetch by MongoDB _id (can see drafts)
       sub = this.courseService.getById(identifier).subscribe({
        next: (res) => {
          this.course = res.data?.data;
          this.sections = res.data?.sections || [];
          this.calculateMetrics();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.error?.message || err.message || 'Failed to load course details';
          this.isLoading = false;
        }
      });
    } else {
       // Students fetch by Slug (only published/approved courses)
       sub = this.courseService.getBySlug(identifier).subscribe({
        next: (res) => {
          this.course = res.data?.course;
          this.sections = res.data?.sections || [];
          this.calculateMetrics();
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.error?.message || err.message || 'Course not found or unavailable';
          this.isLoading = false;
        }
      });
    }

    this.subscriptions.push(sub);
  }

  private calculateMetrics(): void {
    if (!this.course) return;

    // Calculate completion rate mock (Simplified for UI)
    this.completionRate = Math.round(Math.random() * 100);

    // Calculate mock revenue based on total enrollments
    this.revenue = (this.course.totalEnrollments || 0) * (this.course.price || 0);
  }

  getCourseStatus(): string {
    if (!this.course) return '';
    if (this.course.isPublished && this.course.isApproved) return 'Published';
    if (this.course.isPublished) return 'Pending Approval';
    return 'Draft';
  }

  getCategoryName(): string {
    if (!this.course?.category) return 'N/A';
    if (typeof this.course.category === 'object') {
      return this.course.category.name;
    }
    return 'Loading...';
  }

  calculateDiscount(): number {
    if (!this.course?.discountPrice || !this.course?.price) return 0;
    return Math.round(((this.course.price - this.course.discountPrice) / this.course.price) * 100);
  }

  // --- ACTIONS ---

  editCourse(): void {
    if (this.course) {
      this.router.navigate(['/courses/instructor', this.course._id, 'edit']);
    }
  }

  editPricing(): void {
    if (this.course) {
      this.router.navigate(['/courses/instructor', this.course._id, 'edit'], {
        fragment: 'pricing'
      });
    }
  }

  editCurriculum(): void {
    if (this.course) {
      this.router.navigate(['/courses/instructor', this.course._id, 'curriculum']);
    }
  }

  approve(): void {
    if (!this.course) return;
    if (!confirm(`Are you sure you want to approve "${this.course.title}"?`)) return;

    const sub = this.courseService.approve(this.course._id).subscribe({
      next: () => {
        if (this.course) this.course.isPublished = true;
      },
      error: (error) => {
        console.error('Failed to approve course', error);
      }
    });
    this.subscriptions.push(sub);
  }
  publishCourse(): void {
    if (!this.course) return;
    if (!confirm(`Are you sure you want to publish "${this.course.title}"?`)) return;

    const sub = this.courseService.publish(this.course._id).subscribe({
      next: () => {
        if (this.course) this.course.isPublished = true;
      },
      error: (error) => {
        console.error('Failed to publish course', error);
      }
    });
    this.subscriptions.push(sub);
  }

  unpublishCourse(): void {
    if (!this.course) return;
    if (!confirm(`Are you sure you want to unpublish "${this.course.title}"? It will be hidden from students.`)) return;

    const sub = this.courseService.publish(this.course._id).subscribe({
      next: () => {
        if (this.course) this.course.isPublished = false;
      },
      error: (error) => {
        console.error('Failed to unpublish course', error);
      }
    });
    this.subscriptions.push(sub);
  }

  previewCourse(): void {
    if (this.course && this.course.slug) {
      // Opens the public view of the course
      window.open(`/courses/${this.course.slug}`, '_blank');
    }
  }

  retry(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadCourse(id);
    }
  }
}
