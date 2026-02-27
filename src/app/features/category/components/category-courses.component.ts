// category-courses.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { CardModule } from 'primeng/card';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { CategoryService } from '../../../core/services/category.service';
import { DurationPipe } from '../../../core/pipes/duration.pipe';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-category-courses',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TableModule,
        ButtonModule, SelectModule, FormsModule,
        TagModule,
        RatingModule,
        CardModule,
        BreadcrumbModule,
        SkeletonModule,
        TooltipModule,
        DurationPipe
    ],
    template: `
    <div class="category-courses-container">
      <!-- Loading State -->
      @if (loading) {
        <div class="loading-section">
          <div class="skeleton-header">
            <p-skeleton width="200px" height="2rem" styleClass="mb-2"></p-skeleton>
            <p-skeleton width="300px" height="1.5rem"></p-skeleton>
          </div>
          <div class="skeleton-grid">
            @for (item of [1,2,3,4,5,6]; track item) {
              <p-card class="course-skeleton">
                <div class="skeleton-card">
                  <p-skeleton width="100%" height="160px" styleClass="mb-3"></p-skeleton>
                  <p-skeleton width="80%" height="1.5rem" styleClass="mb-2"></p-skeleton>
                  <p-skeleton width="60%" height="1rem" styleClass="mb-3"></p-skeleton>
                  <div class="skeleton-footer">
                    <p-skeleton width="100px" height="1rem"></p-skeleton>
                    <p-skeleton width="80px" height="1rem"></p-skeleton>
                  </div>
                </div>
              </p-card>
            }
          </div>
        </div>
      } @else {
        <!-- Category Info -->
        <div class="category-header">
          <div class="header-left">
            <p-breadcrumb [model]="breadcrumbItems" [home]="home"></p-breadcrumb>
            <h1 class="category-title">
              @if (category?.icon) {
                <i class="category-icon" [class]="category.icon"></i>
              } @else {
                <i class="pi pi-folder category-icon"></i>
              }
              {{ category?.name }}
            </h1>
            @if (category?.description) {
              <p class="category-description">{{ category.description }}</p>
            }
          </div>
          <div class="header-right">
            <div class="category-stats">
              <div class="stat-item">
                <span class="stat-label">Courses</span>
                <span class="stat-value">{{ courses.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Slug</span>
                <span class="stat-value slug">{{ category?.slug }}</span>
              </div>
              <p-tag 
                [value]="category?.isActive ? 'Active' : 'Inactive'" 
                [severity]="category?.isActive ? 'success' : 'danger'"
                [rounded]="true">
              </p-tag>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <div class="filter-group">
            <span class="p-input-icon-left">
              <i class="pi pi-search"></i>
              <input pInputText 
                     [(ngModel)]="filters.search" 
                     (ngModelChange)="applyFilters()"
                     placeholder="Search courses..." 
                     class="filter-input">
            </span>

            <p-select 
              [options]="levelOptions" 
              [(ngModel)]="filters.level" 
              (onChange)="applyFilters()"
              placeholder="All Levels"
              optionLabel="label"
              optionValue="value"
              [showClear]="true"
              styleClass="filter-select">
            </p-select>

            <p-select 
              [options]="sortOptions" 
              [(ngModel)]="filters.sort" 
              (onChange)="applyFilters()"
              placeholder="Sort by"
              optionLabel="label"
              optionValue="value"
              styleClass="filter-select">
            </p-select>
          </div>
        </div>

        <!-- Courses Grid -->
        @if (filteredCourses.length > 0) {
          <div class="courses-grid">
            @for (course of filteredCourses; track course._id) {
              <div class="course-card" [routerLink]="['/courses', course._id]">
                <div class="course-thumbnail">
                  @if (course.thumbnail) {
                    <img [src]="course.thumbnail" [alt]="course.title">
                  } @else {
                    <div class="thumbnail-placeholder">
                      <i class="pi pi-video"></i>
                    </div>
                  }
                  
                  @if (course.isFree) {
                    <span class="free-badge">FREE</span>
                  } @else if (course.discountPrice) {
                    <span class="discount-badge">SALE</span>
                  }
                </div>

                <div class="course-content">
                  <h3 class="course-title">{{ course.title }}</h3>
                  
                  @if (course.subtitle) {
                    <p class="course-subtitle">{{ course.subtitle | slice:0:80 }}...</p>
                  }

                  <div class="course-meta">
                    <div class="meta-left">
                      <span class="meta-item">
                        <i class="pi pi-signal"></i>
                        {{ course.level | titlecase }}
                      </span>
                      <span class="meta-item">
                        <i class="pi pi-clock"></i>
                        {{ course.totalDuration | duration }}
                      </span>
                    </div>
                    
                    @if (course.rating > 0) {
                      <div class="rating">
                        <span class="rating-value">{{ course.rating | number:'1.1-1' }}</span>
                        <i class="pi pi-star-fill rating-star"></i>
                        <span class="rating-count">({{ course.totalRatings }})</span>
                      </div>
                    }
                  </div>

                  <div class="course-footer">
                    <div class="instructor">
                      <i class="pi pi-user"></i>
                      {{ course.instructor?.firstName }} {{ course.instructor?.lastName }}
                    </div>
                    
                    <div class="price">
                      @if (course.discountPrice) {
                        <span class="original-price">{{ course.price | currency:course.currency }}</span>
                        <span class="discount-price">{{ course.discountPrice | currency:course.currency }}</span>
                      } @else if (!course.isFree) {
                        <span class="regular-price">{{ course.price | currency:course.currency }}</span>
                      } @else {
                        <span class="free-price">Free</span>
                      }
                    </div>
                  </div>

                  @if (!course.isPublished || !course.isApproved) {
                    <div class="status-overlay">
                      <p-tag 
                        [value]="!course.isPublished ? 'Draft' : 'Pending Approval'" 
                        [severity]="!course.isPublished ? 'warn' : 'info'">
                      </p-tag>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages > 1) {
            <div class="pagination">
              <button pButton pRipple 
                      icon="pi pi-chevron-left" 
                      class="p-button-rounded p-button-text"
                      [disabled]="currentPage === 1"
                      (click)="changePage(currentPage - 1)">
              </button>
              
              @for (page of getPageNumbers(); track page) {
                  <!-- [label]="page"  -->
                <button pButton pRipple 
                        class="p-button-rounded"
                        [class.p-button-outlined]="page !== currentPage"
                        [class.p-button-primary]="page === currentPage"
                        (click)="changePage(page)">
                </button>
              }
              
              <button pButton pRipple 
                      icon="pi pi-chevron-right" 
                      class="p-button-rounded p-button-text"
                      [disabled]="currentPage === totalPages"
                      (click)="changePage(currentPage + 1)">
              </button>
            </div>
          }
        } @else {
          <div class="empty-state">
            <i class="pi pi-book"></i>
            <h3>No Courses Found</h3>
            <p>{{ filters.search ? 'No matching courses found.' : 'This category has no courses yet.' }}</p>
            <button pButton pRipple 
                    label="Browse All Courses" 
                    icon="pi pi-search"
                    [routerLink]="['/courses']">
            </button>
          </div>
        }
      }
    </div>
  `,
    styles: [`
    .category-courses-container {
      padding: var(--spacing-2xl);
      min-height: 100vh;
      background: var(--bg-primary);
    }

    /* Category Header */
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-xl);
      padding-bottom: var(--spacing-xl);
      border-bottom: 1px solid var(--border-secondary);
      flex-wrap: wrap;
      gap: var(--spacing-xl);
    }

    .category-title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: var(--spacing-lg) 0 var(--spacing-md);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .category-icon {
      color: var(--accent-primary);
      font-size: var(--font-size-2xl);
    }

    .category-description {
      color: var(--text-secondary);
      font-size: var(--font-size-lg);
      line-height: 1.6;
      max-width: 800px;
    }

    .category-stats {
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
      background: var(--bg-secondary);
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--ui-border-radius-lg);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-label {
      color: var(--text-tertiary);
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      color: var(--text-primary);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
    }

    .stat-value.slug {
      font-size: var(--font-size-sm);
      font-weight: normal;
      color: var(--text-secondary);
    }

    /* Filters */
    .filters-section {
      margin-bottom: var(--spacing-xl);
    }

    .filter-group {
      display: flex;
      gap: var(--spacing-md);
      flex-wrap: wrap;
    }

    .filter-input {
      width: 300px;
    }

    .filter-select {
      width: 200px;
    }

    /* Courses Grid */
    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: var(--spacing-xl);
      margin-bottom: var(--spacing-xl);
    }

    .course-card {
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;
      transition: var(--transition-base);
      cursor: pointer;
      position: relative;
      border: 1px solid var(--border-secondary);
    }

    .course-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--accent-primary);
    }

    .course-thumbnail {
      position: relative;
      width: 100%;
      height: 180px;
      overflow: hidden;
    }

    .course-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: var(--transition-base);
    }

    .course-card:hover .course-thumbnail img {
      transform: scale(1.05);
    }

    .thumbnail-placeholder {
      width: 100%;
      height: 100%;
      background: var(--bg-ternary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .thumbnail-placeholder i {
      font-size: 3rem;
      color: var(--text-tertiary);
    }

    .free-badge, .discount-badge {
      position: absolute;
      top: var(--spacing-md);
      right: var(--spacing-md);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--ui-border-radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      z-index: 1;
    }

    .free-badge {
      background: var(--color-success);
      color: white;
    }

    .discount-badge {
      background: var(--color-danger);
      color: white;
    }

    .course-content {
      padding: var(--spacing-lg);
    }

    .course-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xs);
      line-height: 1.4;
    }

    .course-subtitle {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      margin-bottom: var(--spacing-md);
      line-height: 1.6;
    }

    .course-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);
    }

    .meta-left {
      display: flex;
      gap: var(--spacing-md);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-tertiary);
      font-size: var(--font-size-xs);
    }

    .rating {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    .rating-value {
      color: var(--text-primary);
      font-weight: var(--font-weight-bold);
    }

    .rating-star {
      color: #FFD700;
      font-size: var(--font-size-xs);
    }

    .rating-count {
      color: var(--text-tertiary);
      font-size: var(--font-size-xs);
    }

    .course-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--border-secondary);
    }

    .instructor {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .price {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .original-price {
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
      text-decoration: line-through;
    }

    .discount-price {
      color: var(--color-success);
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-lg);
    }

    .regular-price {
      color: var(--text-primary);
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-lg);
    }

    .free-price {
      color: var(--color-success);
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-lg);
    }

    .status-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      gap: var(--spacing-xs);
      margin-top: var(--spacing-xl);
    }

    /* Loading Skeleton */
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: var(--spacing-xl);
      margin-top: var(--spacing-xl);
    }

    .skeleton-card {
      padding: var(--spacing-lg);
    }

    .skeleton-footer {
      display: flex;
      justify-content: space-between;
      margin-top: var(--spacing-md);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--spacing-3xl);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-lg);
    }

    .empty-state i {
      font-size: 4rem;
      color: var(--text-tertiary);
      margin-bottom: var(--spacing-lg);
    }

    .empty-state h3 {
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
    }

    .empty-state p {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xl);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .category-courses-container {
        padding: var(--spacing-md);
      }

      .category-header {
        flex-direction: column;
      }

      .category-stats {
        width: 100%;
        justify-content: space-around;
      }

      .filter-group {
        flex-direction: column;
      }

      .filter-input,
      .filter-select {
        width: 100%;
      }

      .courses-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CategoryCoursesComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private categoryService = inject(CategoryService);

    category: any = null;
    courses: any[] = [];
    filteredCourses: any[] = [];
    loading = true;

    // Pagination
    currentPage = 1;
    pageSize = 12;
    totalPages = 1;

    // Filters
    filters = {
        search: '',
        level: null,
        sort: 'newest'
    };

    levelOptions = [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
        { label: 'All Levels', value: 'all-levels' }
    ];

    sortOptions = [
        { label: 'Newest', value: 'newest' },
        { label: 'Popular', value: 'popular' },
        { label: 'Highest Rated', value: 'rating' },
        { label: 'Price: Low to High', value: 'price_asc' },
        { label: 'Price: High to Low', value: 'price_desc' }
    ];

    breadcrumbItems = [
        { label: 'Categories', routerLink: '/categories' },
        { label: 'Tree', routerLink: '/categories/tree' }
    ];

    home = { icon: 'pi pi-home', routerLink: '/' };

    private subscriptions: Subscription[] = [];
    private categoryId: string = '';

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.categoryId = params['id'];
            this.loadCategoryWithCourses();
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    loadCategoryWithCourses(): void {
        this.loading = true;
        const sub = this.categoryService.getCategoryWithCourses(this.categoryId).subscribe({
            next: (res) => {
                this.category = res.data?.category;
                this.courses = res.data?.courses || [];

                // Update breadcrumb
                this.breadcrumbItems = [
                    { label: 'Categories', routerLink: '/categories' },
                    { label: this.category?.name || 'Category', routerLink: `/categories/${this.categoryId}/courses` }
                ];

                this.applyFilters();
                this.loading = false;
            },
            error: (error) => {
                console.error('Failed to load category courses', error);
                this.loading = false;
            }
        });
        this.subscriptions.push(sub);
    }

    applyFilters(): void {
        let filtered = [...this.courses];

        // Apply search filter
        if (this.filters.search) {
            const searchLower = this.filters.search.toLowerCase();
            filtered = filtered.filter(course =>
                course.title.toLowerCase().includes(searchLower) ||
                course.subtitle?.toLowerCase().includes(searchLower) ||
                course.description?.toLowerCase().includes(searchLower)
            );
        }

        // Apply level filter
        if (this.filters.level) {
            filtered = filtered.filter(course => course.level === this.filters.level);
        }

        // Apply sorting
        filtered = this.sortCourses(filtered, this.filters.sort);

        // Update pagination
        this.totalPages = Math.ceil(filtered.length / this.pageSize);
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.filteredCourses = filtered.slice(start, end);
    }

    private sortCourses(courses: any[], sortBy: string): any[] {
        return courses.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'popular':
                    return (b.totalEnrollments || 0) - (a.totalEnrollments || 0);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'price_asc':
                    return (a.isFree ? 0 : a.price) - (b.isFree ? 0 : b.price);
                case 'price_desc':
                    return (b.isFree ? 0 : b.price) - (a.isFree ? 0 : a.price);
                default:
                    return 0;
            }
        });
    }

    changePage(page: number): void {
        this.currentPage = page;
        this.applyFilters();
    }

    getPageNumbers(): number[] {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(this.totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }
}