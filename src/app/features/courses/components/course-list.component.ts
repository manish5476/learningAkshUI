import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Course, Category } from '../../../core/models/course.model';
import { CategoryService } from '../../../core/services/category.service';
import { CourseService } from '../../../core/services/course.service';


@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="course-list-container">
      <!-- Header -->
      <div class="list-header">
        <div class="header-left">
          <h1 class="page-title">My Courses</h1>
          <p class="page-subtitle">Manage and monitor your courses</p>
        </div>
        <button class="btn btn-primary" routerLink="/instructor/courses/new">
          <i class="fas fa-plus"></i> Create New Course
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Search courses..." 
            (input)="onSearch($event)"
            class="search-input"
          >
        </div>

        <div class="filter-group">
          <select class="filter-select" (change)="onCategoryFilter($event)">
            <option value="">All Categories</option>
            <option *ngFor="let cat of categories" [value]="cat._id">
              {{ cat.name }}
            </option>
          </select>

          <select class="filter-select" (change)="onLevelFilter($event)">
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="all-levels">All Levels</option>
          </select>

          <select class="filter-select" (change)="onStatusFilter($event)">
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-book-open"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Courses</span>
            <span class="stat-value">{{ stats.total }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Students</span>
            <span class="stat-value">{{ stats.students }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-star"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Avg Rating</span>
            <span class="stat-value">{{ stats.rating | number:'1.1-1' }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total Revenue</span>
            <span class="stat-value">{{ stats.revenue | currency }}</span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Loading your courses...</p>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && courses.length === 0">
        <i class="fas fa-chalkboard-teacher"></i>
        <h3>No courses yet</h3>
        <p>Create your first course and start teaching</p>
        <button class="btn btn-primary" routerLink="/instructor/courses/new">
          Create Your First Course
        </button>
      </div>

      <!-- Course Grid -->
      <div class="course-grid" *ngIf="!isLoading && courses.length > 0">
        <div *ngFor="let course of filteredCourses" class="course-card">
          <div class="card-header">
            <div class="thumbnail" [style.backgroundImage]="'url(' + (course.thumbnail || 'assets/images/course-placeholder.jpg') + ')'">
              <div class="status-badge" [class.published]="course.isPublished" [class.approved]="course.isApproved">
                {{ getCourseStatus(course) }}
              </div>
            </div>
          </div>

          <div class="card-body">
            <h3 class="course-title">{{ course.title }}</h3>
            <p class="course-subtitle">{{ course.subtitle || 'No subtitle' }}</p>

            <div class="course-meta">
              <span class="meta-item">
                <i class="fas fa-signal"></i> {{ course.level | titlecase }}
              </span>
              <span class="meta-item">
                <i class="fas fa-video"></i> {{ course.totalLessons || 0 }} lessons
              </span>
              <span class="meta-item">
                <i class="fas fa-clock"></i> {{ course.totalDuration || 0 }} min
              </span>
            </div>

            <div class="course-stats">
              <div class="rating">
                <i class="fas fa-star"></i>
                <span>{{ course.rating | number:'1.1-1' }}</span>
                <span class="reviews">({{ course.totalReviews || 0 }})</span>
              </div>
              <div class="students">
                <i class="fas fa-users"></i>
                <span>{{ course.totalEnrollments || 0 }}</span>
              </div>
            </div>

            <div class="price-section">
              <span *ngIf="!course.isFree" class="price">
                {{ course.price | currency:course.currency }}
              </span>
              <span *ngIf="course.isFree" class="free-badge">FREE</span>
              <span *ngIf="course.discountPrice" class="discount-badge">
                -{{ calculateDiscount(course) }}%
              </span>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn btn-text" [routerLink]="['/instructor/courses', course._id]">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="btn btn-text" [routerLink]="['/instructor/courses', course._id, 'edit']">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-text" *ngIf="!course.isPublished" (click)="publishCourse(course)">
              <i class="fas fa-rocket"></i> Publish
            </button>
            <button class="btn btn-text text-error" (click)="deleteCourse(course)">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages > 1">
        <button class="page-btn" [disabled]="currentPage === 1" (click)="changePage(currentPage - 1)">
          <i class="fas fa-chevron-left"></i>
        </button>
        
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>

        <button class="page-btn" [disabled]="currentPage === totalPages" (click)="changePage(currentPage + 1)">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--bg-primary);
    }

    .course-list-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: var(--spacing-3xl);
    }

    /* Header */
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-2xl);
    }

    .page-title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xs);
    }

    .page-subtitle {
      font-size: var(--font-size-base);
      color: var(--text-secondary);
      margin: 0;
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

    .btn-text {
      background: transparent;
      color: var(--text-secondary);
      padding: var(--spacing-sm) var(--spacing-md);
    }

    .btn-text:hover {
      background: var(--bg-hover);
      color: var(--accent-primary);
    }

    .text-error:hover {
      color: var(--color-error) !important;
    }

    /* Filters */
    .filters-section {
      display: flex;
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-2xl);
      padding: var(--spacing-lg);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-lg);
      border: var(--ui-border-width) solid var(--border-secondary);
    }

    .search-box {
      flex: 1;
      position: relative;
    }

    .search-box i {
      position: absolute;
      left: var(--spacing-md);
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
    }

    .search-input {
      width: 100%;
      padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) calc(var(--spacing-xl) * 2);
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      color: var(--text-primary);
      font-size: var(--font-size-md);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 var(--focus-ring-width) var(--accent-focus);
    }

    .filter-group {
      display: flex;
      gap: var(--spacing-md);
    }

    .filter-select {
      padding: var(--spacing-md) var(--spacing-xl);
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      color: var(--text-primary);
      font-size: var(--font-size-sm);
      cursor: pointer;
      min-width: 140px;
    }

    .filter-select:focus {
      outline: none;
      border-color: var(--accent-primary);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-2xl);
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      padding: var(--spacing-xl);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-lg);
      border: var(--ui-border-width) solid var(--border-secondary);
      transition: var(--transition-base);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--accent-primary);
    }

    .stat-icon {
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

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      margin-bottom: var(--spacing-xs);
    }

    .stat-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }

    /* Loading State */
    .loading-state {
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

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--spacing-5xl);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-lg);
      border: 2px dashed var(--border-secondary);
    }

    .empty-state i {
      font-size: 64px;
      color: var(--text-tertiary);
      margin-bottom: var(--spacing-xl);
    }

    .empty-state h3 {
      font-size: var(--font-size-xl);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-sm);
    }

    .empty-state p {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xl);
    }

    /* Course Grid */
    .course-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-2xl);
    }

    .course-card {
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;
      transition: var(--transition-base);
    }

    .course-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--accent-primary);
    }

    .card-header {
      position: relative;
    }

    .thumbnail {
      height: 160px;
      background-size: cover;
      background-position: center;
      background-color: var(--bg-ternary);
      position: relative;
    }

    .status-badge {
      position: absolute;
      top: var(--spacing-md);
      right: var(--spacing-md);
      padding: var(--spacing-xs) var(--spacing-sm);
      background: var(--bg-primary);
      border-radius: var(--ui-border-radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      border: var(--ui-border-width) solid var(--border-secondary);
    }

    .status-badge.published {
      background: var(--color-success-bg);
      color: var(--color-success-dark);
      border-color: var(--color-success);
    }

    .status-badge.approved {
      background: var(--color-info-bg);
      color: var(--color-info-dark);
      border-color: var(--color-info);
    }

    .card-body {
      padding: var(--spacing-lg);
    }

    .course-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xs);
      line-height: var(--line-height-normal);
    }

    .course-subtitle {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin: 0 0 var(--spacing-md);
      line-height: var(--line-height-normal);
    }

    .course-meta {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .course-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--spacing-md);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
    }

    .rating {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: #fbbf24;
    }

    .rating span {
      color: var(--text-secondary);
    }

    .reviews {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }

    .students {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-secondary);
    }

    .price-section {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .price {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }

    .free-badge {
      padding: var(--spacing-xs) var(--spacing-sm);
      background: var(--color-success-bg);
      color: var(--color-success-dark);
      border-radius: var(--ui-border-radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
    }

    .discount-badge {
      padding: var(--spacing-xs) var(--spacing-sm);
      background: var(--color-error-bg);
      color: var(--color-error-dark);
      border-radius: var(--ui-border-radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
    }

    .card-footer {
      display: flex;
      gap: var(--spacing-xs);
      padding: var(--spacing-md) var(--spacing-lg);
      background: var(--bg-ternary);
      border-top: var(--ui-border-width) solid var(--border-secondary);
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: var(--spacing-lg);
      margin-top: var(--spacing-2xl);
    }

    .page-btn {
      padding: var(--spacing-sm) var(--spacing-lg);
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      color: var(--text-primary);
      cursor: pointer;
      transition: var(--transition-base);
    }

    .page-btn:hover:not(:disabled) {
      background: var(--accent-primary);
      color: white;
      border-color: var(--accent-primary);
    }

    .page-btn:disabled {
      opacity: var(--state-disabled-opacity);
      cursor: not-allowed;
    }

    .page-info {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .course-list-container {
        padding: var(--spacing-xl);
      }

      .list-header {
        flex-direction: column;
        gap: var(--spacing-md);
        align-items: flex-start;
      }

      .filters-section {
        flex-direction: column;
      }

      .filter-group {
        flex-wrap: wrap;
      }

      .filter-select {
        flex: 1;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CourseListComponent implements OnInit, OnDestroy {
  private courseService = inject(CourseService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  courses: Course[] = [];
  filteredCourses: Course[] = [];
  categories: Category[] = [];
  isLoading = true;

  stats = {
    total: 0,
    students: 0,
    rating: 0,
    revenue: 0
  };

  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 12;

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.loadCategories();
    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadCategories(): void {
    const sub = this.categoryService.getAll({ isActive: true }).subscribe({
      next: (res) => {
        this.categories = res.data || [];
      }
    });
    this.subscriptions.push(sub);
  }

  private loadCourses(): void {
    this.isLoading = true;
    const sub = this.courseService.getMyCourses().subscribe({
      next: (res) => {
        this.courses = res.data || [];
        this.filteredCourses = this.courses;
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load courses', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private calculateStats(): void {
    this.stats.total = this.courses.length;
    this.stats.students = this.courses.reduce((acc, c) => acc + (c.totalEnrollments || 0), 0);
    
    const avgRating = this.courses.reduce((acc, c) => acc + (c.rating || 0), 0) / this.courses.length;
    this.stats.rating = isNaN(avgRating) ? 0 : avgRating;
    
    // Calculate revenue (assuming each enrollment = price)
    this.stats.revenue = this.courses.reduce((acc, c) => {
      return acc + ((c.totalEnrollments || 0) * (c.price || 0));
    }, 0);
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredCourses = this.courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm) ||
      course.subtitle?.toLowerCase().includes(searchTerm) ||
      course.description.toLowerCase().includes(searchTerm)
    );
  }

  onCategoryFilter(event: Event): void {
    const categoryId = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  onLevelFilter(event: Event): void {
    const level = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  onStatusFilter(event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  private applyFilters(): void {
    // Implement filtering logic
    this.filteredCourses = this.courses; // Simplified for now
  }

  getCourseStatus(course: Course): string {
    if (course.isPublished && course.isApproved) return 'Published';
    if (course.isPublished) return 'Pending Approval';
    return 'Draft';
  }

  calculateDiscount(course: Course): number {
    if (!course.discountPrice || course.discountPrice >= course.price) return 0;
    return Math.round(((course.price - course.discountPrice) / course.price) * 100);
  }

  publishCourse(course: Course): void {
    if (!confirm(`Are you sure you want to publish "${course.title}"?`)) return;

    const sub = this.courseService.publish(course._id).subscribe({
      next: () => {
        course.isPublished = true;
      },
      error: (error) => {
        console.error('Failed to publish course', error);
      }
    });
    this.subscriptions.push(sub);
  }

  deleteCourse(course: Course): void {
    if (!confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) return;

    const sub = this.courseService.delete(course._id).subscribe({
      next: () => {
        this.courses = this.courses.filter(c => c._id !== course._id);
        this.filteredCourses = this.filteredCourses.filter(c => c._id !== course._id);
        this.calculateStats();
      },
      error: (error) => {
               console.error('Failed to delete course', error);
      }
    });
    this.subscriptions.push(sub);
  }

  changePage(page: number): void {
    this.currentPage = page;
    // Implement pagination logic
  }
}