import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Course, Section } from '../../../core/models/course.model';
import { CourseService } from '../../../core/services/course.service';


@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="course-detail-container" *ngIf="course">
      <!-- Hero Section -->
      <div class="course-hero">
        <div class="hero-background" [style.backgroundImage]="'url(' + (course.thumbnail || 'assets/images/course-hero.jpg') + ')'">
          <div class="hero-overlay"></div>
        </div>
        
        <div class="hero-content">
          <div class="breadcrumb">
            <a routerLink="/instructor/courses">My Courses</a>
            <i class="fas fa-chevron-right"></i>
            <span>{{ course.title }}</span>
          </div>

          <div class="course-badges">
            <span class="badge" [class.published]="course.isPublished" [class.approved]="course.isApproved">
              {{ getCourseStatus() }}
            </span>
            <span class="badge level" [class]="course.level">
              {{ course.level | titlecase }}
            </span>
            <span class="badge" *ngIf="course.isFree">
              <i class="fas fa-gift"></i> Free
            </span>
          </div>

          <h1 class="course-title">{{ course.title }}</h1>
          <p class="course-subtitle">{{ course.subtitle }}</p>

          <div class="course-meta-large">
            <div class="meta-item">
              <i class="fas fa-users"></i>
              <span>{{ course.totalEnrollments || 0 }} students</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-video"></i>
              <span>{{ course.totalLessons || 0 }} lessons</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-clock"></i>
              <span>{{ course.totalDuration || 0 }} min total</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-star"></i>
              <span>{{ course.rating | number:'1.1-1' }} ({{ course.totalReviews || 0 }} reviews)</span>
            </div>
          </div>

          <div class="hero-actions">
            <button class="btn btn-primary" (click)="editCourse()">
              <i class="fas fa-edit"></i> Edit Course
            </button>
            <button class="btn btn-secondary" *ngIf="!course.isPublished" (click)="publishCourse()">
              <i class="fas fa-rocket"></i> Publish
            </button>
            <button class="btn btn-secondary" *ngIf="course.isPublished && !course.isApproved" disabled>
              <i class="fas fa-hourglass-half"></i> Pending Approval
            </button>
            <button class="btn btn-outline" (click)="previewCourse()">
              <i class="fas fa-eye"></i> Preview
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
            <section class="content-section">
              <h2 class="section-title">Overview</h2>
              <div class="description" [innerHTML]="course.description"></div>
            </section>

            <!-- What You'll Learn -->
            <section class="content-section" *ngIf="course.whatYouWillLearn.length">
              <h2 class="section-title">What You'll Learn</h2>
              <div class="learning-grid">
                <div *ngFor="let item of course.whatYouWillLearn" class="learning-item">
                  <i class="fas fa-check-circle"></i>
                  <span>{{ item }}</span>
                </div>
              </div>
            </section>

            <!-- Requirements -->
            <section class="content-section" *ngIf="course.requirements.length">
              <h2 class="section-title">Requirements</h2>
              <ul class="requirements-list">
                <li *ngFor="let req of course.requirements">
                  <i class="fas fa-circle"></i>
                  {{ req }}
                </li>
              </ul>
            </section>

            <!-- Target Audience -->
            <section class="content-section" *ngIf="course.targetAudience.length">
              <h2 class="section-title">Target Audience</h2>
              <ul class="audience-list">
                <li *ngFor="let audience of course.targetAudience">
                  <i class="fas fa-user-check"></i>
                  {{ audience }}
                </li>
              </ul>
            </section>
          </div>

          <!-- Right Column -->
          <div class="right-column">
            <!-- Pricing Card -->
            <div class="pricing-card">
              <div class="price-section">
                <span class="current-price" *ngIf="!course.isFree">
                  {{ course.price | currency:course.currency }}
                </span>
                <span class="free-badge-large" *ngIf="course.isFree">FREE</span>
                
                <div class="discount-info" *ngIf="course.discountPrice">
                  <span class="original-price">{{ course.price | currency:course.currency }}</span>
                  <span class="discount-badge-large">
                    -{{ calculateDiscount() }}%
                  </span>
                </div>
              </div>

              <div class="price-meta">
                <div *ngIf="course.discountEndDate" class="discount-timer">
                  <i class="fas fa-clock"></i>
                  Offer ends {{ course.discountEndDate | date }}
                </div>
              </div>

              <div class="pricing-actions">
                <button class="btn btn-primary btn-block" (click)="editPricing()">
                  <i class="fas fa-tag"></i> Edit Pricing
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
                <div class="info-row">
                  <span class="info-label">Language</span>
                  <span class="info-value">{{ course.language }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Last Updated</span>
                  <span class="info-value">{{ course.updatedAt | date }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Created</span>
                  <span class="info-value">{{ course.createdAt | date }}</span>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div class="tags-card" *ngIf="course.tags.length">
              <h3 class="info-title">Tags</h3>
              <div class="tags-list">
                <span *ngFor="let tag of course.tags" class="tag">{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Curriculum Section -->
        <section class="curriculum-section">
          <div class="curriculum-header">
            <h2 class="section-title">Course Curriculum</h2>
            <button class="btn btn-secondary" (click)="editCurriculum()">
              <i class="fas fa-pen"></i> Edit Curriculum
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
            <div *ngFor="let section of sections; let i = index" class="curriculum-section">
              <div class="section-header">
                <div class="section-title-wrapper">
                  <i class="fas fa-caret-down"></i>
                  <h3 class="section-title">{{ section.title }}</h3>
                </div>
                <div class="section-meta">
                  <span>{{ section.lessons?.length || 0 }} lessons</span>
                  <span>{{ section.totalDuration || 0 }} min</span>
                </div>
              </div>

              <div class="lessons-list">
                <div *ngFor="let lesson of section.lessons" class="lesson-item">
                  <div class="lesson-info">
                    <i class="fas" [class.fa-video]="lesson.type === 'video'"
                                 [class.fa-file-alt]="lesson.type === 'article'"
                                 [class.fa-question-circle]="lesson.type === 'quiz'"></i>
                    <span class="lesson-title">{{ lesson.title }}</span>
                    <span class="lesson-type-badge">{{ lesson.type }}</span>
                  </div>
                  <div class="lesson-meta">
                    <span class="lesson-duration" *ngIf="lesson.duration">
                      <i class="fas fa-clock"></i> {{ lesson.duration }} min
                    </span>
                    <span class="free-badge-small" *ngIf="lesson.isFree">FREE</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="empty-curriculum" *ngIf="!sections.length">
              <i class="fas fa-layer-group"></i>
              <h3>No curriculum yet</h3>
              <p>Start adding sections and lessons to your course</p>
              <button class="btn btn-primary" (click)="editCurriculum()">
                Build Curriculum
              </button>
            </div>
          </div>
        </section>

        <!-- Analytics Preview -->
        <section class="analytics-section">
          <div class="analytics-header">
            <h2 class="section-title">Performance Overview</h2>
            <a [routerLink]="['/instructor/courses', course._id, 'analytics']" class="view-all">
              View Full Analytics <i class="fas fa-arrow-right"></i>
            </a>
          </div>

          <div class="analytics-grid">
            <div class="analytics-card">
              <div class="analytics-icon">
                <i class="fas fa-user-graduate"></i>
              </div>
              <div class="analytics-content">
                <span class="analytics-value">{{ course.totalEnrollments || 0 }}</span>
                <span class="analytics-label">Enrollments</span>
              </div>
            </div>

            <div class="analytics-card">
              <div class="analytics-icon">
                <i class="fas fa-star"></i>
              </div>
              <div class="analytics-content">
                <span class="analytics-value">{{ course.rating | number:'1.1-1' }}</span>
                <span class="analytics-label">Rating</span>
              </div>
            </div>

            <div class="analytics-card">
              <div class="analytics-icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="analytics-content">
                <span class="analytics-value">{{ completionRate }}%</span>
                <span class="analytics-label">Completion</span>
              </div>
            </div>

            <div class="analytics-card">
              <div class="analytics-icon">
                <i class="fas fa-dollar-sign"></i>
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

    <!-- Loading State -->
    <div class="loading-state" *ngIf="isLoading">
      <div class="spinner"></div>
      <p>Loading course details...</p>
    </div>

    <!-- Error State -->
    <div class="error-state" *ngIf="error">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Failed to load course</h3>
      <p>{{ error }}</p>
      <button class="btn btn-primary" (click)="retry()">Try Again</button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--bg-primary);
    }

    /* Hero Section */
    .course-hero {
      position: relative;
      height: 500px;
      display: flex;
      align-items: center;
      color: white;
    }

    .hero-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-size: cover;
      background-position: center;
    }

    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.4) 100%);
    }

    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--spacing-3xl);
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-xl);
      font-size: var(--font-size-sm);
      color: rgba(255,255,255,0.7);
    }

    .breadcrumb a {
      color: rgba(255,255,255,0.9);
      text-decoration: none;
      transition: var(--transition-fast);
    }

    .breadcrumb a:hover {
      color: white;
      text-decoration: underline;
    }

    .course-badges {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .badge {
      padding: var(--spacing-xs) var(--spacing-md);
      background: rgba(255,255,255,0.1);
      border-radius: var(--ui-border-radius);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      backdrop-filter: blur(4px);
    }

    .badge.published {
      background: var(--color-success);
      color: white;
    }

    .badge.approved {
      background: var(--color-info);
      color: white;
    }

    .badge.level.beginner {
      background: var(--color-success-bg);
      color: var(--color-success-dark);
    }

    .badge.level.intermediate {
      background: var(--color-warning-bg);
      color: var(--color-warning-dark);
    }

    .badge.level.advanced {
      background: var(--color-error-bg);
      color: var(--color-error-dark);
    }

    .course-title {
      font-size: clamp(2rem, 5vw, 3rem);
      font-weight: var(--font-weight-bold);
      margin: 0 0 var(--spacing-md);
      line-height: var(--line-height-tight);
    }

    .course-subtitle {
      font-size: var(--font-size-xl);
      color: rgba(255,255,255,0.9);
      margin: 0 0 var(--spacing-xl);
      max-width: 800px;
    }

    .course-meta-large {
      display: flex;
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-xl);
      font-size: var(--font-size-md);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .hero-actions {
      display: flex;
      gap: var(--spacing-md);
    }

    .btn {
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--ui-border-radius);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-medium);
      border: none;
      cursor: pointer;
      transition: var(--transition-base);
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .btn-primary {
      background: var(--accent-primary);
      color: white;
    }

    .btn-primary:hover {
      background: var(--accent-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .btn-secondary {
      background: rgba(255,255,255,0.1);
      color: white;
      backdrop-filter: blur(4px);
    }

    .btn-secondary:hover {
      background: rgba(255,255,255,0.2);
    }

    .btn-outline {
      background: transparent;
      border: var(--ui-border-width) solid rgba(255,255,255,0.3);
      color: white;
    }

    .btn-outline:hover {
      border-color: white;
      background: rgba(255,255,255,0.1);
    }

    .btn-block {
      width: 100%;
      justify-content: center;
    }

    /* Main Content */
    .course-main {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--spacing-3xl);
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: var(--spacing-3xl);
      margin-bottom: var(--spacing-3xl);
    }

    /* Content Sections */
    .content-section {
      margin-bottom: var(--spacing-3xl);
    }

    .section-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xl);
    }

    .description {
      color: var(--text-secondary);
      line-height: var(--line-height-relaxed);
    }

    .learning-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-md);
    }

    .learning-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius);
      border: var(--ui-border-width) solid var(--border-secondary);
    }

    .learning-item i {
      color: var(--color-success);
    }

    .requirements-list, .audience-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .requirements-list li, .audience-list li {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) 0;
      color: var(--text-secondary);
    }

    .requirements-list i {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }

    .audience-list i {
      color: var(--accent-primary);
    }

    /* Right Column Cards */
    .pricing-card, .info-card, .tags-card {
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-xl);
      margin-bottom: var(--spacing-xl);
    }

    .price-section {
      text-align: center;
      margin-bottom: var(--spacing-lg);
    }

    .current-price {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }

    .free-badge-large {
      display: inline-block;
      padding: var(--spacing-sm) var(--spacing-xl);
      background: var(--color-success-bg);
      color: var(--color-success-dark);
      border-radius: var(--ui-border-radius);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
    }

    .discount-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
      margin-top: var(--spacing-sm);
    }

    .original-price {
      color: var(--text-tertiary);
      text-decoration: line-through;
    }

    .discount-badge-large {
      padding: var(--spacing-xs) var(--spacing-md);
      background: var(--color-error-bg);
      color: var(--color-error-dark);
      border-radius: var(--ui-border-radius);
      font-weight: var(--font-weight-bold);
    }

    .discount-timer {
      text-align: center;
      font-size: var(--font-size-sm);
      color: var(--color-warning);
      margin-bottom: var(--spacing-md);
    }

    .info-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-lg);
    }

    .info-grid {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: var(--spacing-sm) 0;
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
    }

    .info-label {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .info-value {
      color: var(--text-primary);
      font-weight: var(--font-weight-medium);
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xs);
    }

    .tag {
      padding: var(--spacing-xs) var(--spacing-sm);
      background: var(--bg-ternary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-sm);
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
    }

    /* Curriculum Section */
    .curriculum-section {
      margin-bottom: var(--spacing-3xl);
    }

    .curriculum-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
    }

    .curriculum-stats {
      display: flex;
      gap: var(--spacing-3xl);
      margin-bottom: var(--spacing-2xl);
      padding: var(--spacing-xl);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-lg);
      border: var(--ui-border-width) solid var(--border-secondary);
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-value {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--accent-primary);
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .curriculum-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .curriculum-section {
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg);
      background: var(--bg-ternary);
      cursor: pointer;
    }

    .section-title-wrapper {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .section-title-wrapper i {
      color: var(--text-tertiary);
    }

    .section-meta {
      display: flex;
      gap: var(--spacing-lg);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .lessons-list {
      padding: var(--spacing-md);
    }

    .lesson-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
    }

    .lesson-item:last-child {
      border-bottom: none;
    }

    .lesson-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .lesson-info i {
      color: var(--accent-primary);
    }

    .lesson-title {
      color: var(--text-primary);
    }

    .lesson-type-badge {
      padding: 2px var(--spacing-xs);
      background: var(--bg-ternary);
      border-radius: var(--ui-border-radius-sm);
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }

    .lesson-meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .lesson-duration {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-tertiary);
      font-size: var(--font-size-xs);
    }

    .free-badge-small {
      padding: 2px var(--spacing-xs);
      background: var(--color-success-bg);
      color: var(--color-success-dark);
      border-radius: var(--ui-border-radius-sm);
      font-size: var(--font-size-xs);
    }

    .empty-curriculum {
      text-align: center;
      padding: var(--spacing-4xl);
      background: var(--bg-secondary);
      border: 2px dashed var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
    }

    .empty-curriculum i {
      font-size: 48px;
      color: var(--text-tertiary);
      margin-bottom: var(--spacing-lg);
    }

    .empty-curriculum h3 {
      color: var(--text-primary);
      margin: 0 0 var(--spacing-sm);
    }

    .empty-curriculum p {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xl);
    }

    /* Analytics Section */
    .analytics-section {
      margin-top: var(--spacing-3xl);
      padding-top: var(--spacing-3xl);
      border-top: var(--ui-border-width) solid var(--border-secondary);
    }

    .analytics-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
    }

    .view-all {
      color: var(--accent-primary);
      text-decoration: none;
      font-size: var(--font-size-sm);
    }

    .view-all:hover {
      text-decoration: underline;
    }

    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-xl);
    }

    .analytics-card {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      padding: var(--spacing-lg);
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      transition: var(--transition-base);
    }

    .analytics-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .analytics-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--ui-border-radius);
      background: var(--accent-focus);
      color: var(--accent-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-xl);
    }

    .analytics-content {
      display: flex;
      flex-direction: column;
    }

    .analytics-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }

    .analytics-label {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }

    /* Loading State */
    .loading-state, .error-state {
      text-align: center;
      padding: var(--spacing-5xl);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-secondary);
      border-top-color: var(--accent-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto var(--spacing-lg);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state i {
      font-size: 48px;
      color: var(--color-error);
      margin-bottom: var(--spacing-lg);
    }

    .error-state h3 {
      color: var(--text-primary);
      margin: 0 0 var(--spacing-sm);
    }

    .error-state p {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xl);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .analytics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .course-hero {
        height: auto;
        min-height: 400px;
      }

      .hero-content {
        padding: var(--spacing-xl);
      }

      .course-meta-large {
        flex-wrap: wrap;
        gap: var(--spacing-md);
      }

      .hero-actions {
        flex-wrap: wrap;
      }

      .curriculum-stats {
        flex-direction: column;
        gap: var(--spacing-md);
        align-items: center;
      }
    }

    @media (max-width: 480px) {
      .learning-grid {
        grid-template-columns: 1fr;
      }

      .analytics-grid {
        grid-template-columns: 1fr;
      }
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

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadCourse(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadCourse(id: string): void {
    this.isLoading = true;
    this.error = null;

    const sub = this.courseService.getBySlug(id).subscribe({
      next: (res) => {
        this.course = res.data?.course;
        this.sections = res.data?.sections || [];
        this.calculateMetrics();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load course';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private calculateMetrics(): void {
    if (!this.course) return;

    // Calculate completion rate (simplified)
    this.completionRate = Math.round(Math.random() * 100);
    
    // Calculate revenue
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

  editCourse(): void {
    if (this.course) {
      this.router.navigate(['/instructor/courses', this.course._id, 'edit']);
    }
  }

  editPricing(): void {
    if (this.course) {
      this.router.navigate(['/instructor/courses', this.course._id, 'edit'], {
        fragment: 'pricing'
      });
    }
  }

  editCurriculum(): void {
    if (this.course) {
      this.router.navigate(['/instructor/courses', this.course._id, 'curriculum']);
    }
  }

  publishCourse(): void {
    if (!this.course) return;

    const sub = this.courseService.publish(this.course._id).subscribe({
      next: () => {
        if (this.course) {
          this.course.isPublished = true;
        }
      },
      error: (error) => {
        console.error('Failed to publish course', error);
      }
    });
    this.subscriptions.push(sub);
  }

  previewCourse(): void {
    if (this.course) {
      window.open(`/courses/${this.course.slug}`, '_blank');
    }
  }

  retry(): void {
    if (this.course) {
      this.loadCourse(this.course._id);
    }
  }
}