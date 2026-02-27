import { Component, OnInit, OnDestroy, inject, Injectable, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, of, delay, Subscription } from 'rxjs';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-category-courses',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
  ],
  template: `
    <div class="category-courses-container">
      
      <!-- Loading State (Skeleton) -->
      <div *ngIf="loading" class="loading-section">
        <div class="skeleton-header animate-pulse">
          <div class="skeleton-line w-1/4 h-8 mb-md"></div>
          <div class="skeleton-line w-1/2 h-4"></div>
        </div>
        <div class="courses-grid">
          <div *ngFor="let item of [1,2,3]" class="uiverse-card skeleton-card animate-pulse">
             <div class="skeleton-layer"></div>
          </div>
        </div>
      </div> 

      <!-- Main Content -->
      <ng-container *ngIf="!loading">
        <!-- Category Info Header -->
        <div class="category-header">
          <div class="header-left">
            <!-- Custom Breadcrumb -->
            <nav class="breadcrumb">
              <a routerLink="/" class="bc-link"><i class="pi pi-home"></i></a>
              <span class="bc-sep">/</span>
              <a routerLink="/categories" class="bc-link">Categories</a>
              <span class="bc-sep">/</span>
              <span class="bc-current">{{ category?.name }}</span>
            </nav>

            <h1 class="category-title">
              <i [class]="category?.icon || 'pi pi-folder'" class="category-icon"></i>
              {{ category?.name }}
            </h1>
            <p *ngIf="category?.description" class="category-description">{{ category.description }}</p>
          </div>

          <div class="header-right">
            <div class="category-stats">
              <div class="stat-item">
                <span class="stat-label">Courses</span>
                <span class="stat-value">{{ courses.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Status</span>
                <span class="status-badge" [ngClass]="category?.isActive ? 'status-active' : 'status-inactive'">
                  {{ category?.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters Section -->
        <div class="filters-section">
          <div class="filter-group">
            <div class="search-wrapper">
              <i class="pi pi-search search-icon"></i>
              <input 
                type="text" 
                [(ngModel)]="filters.search" 
                (ngModelChange)="applyFilters()"
                placeholder="Search courses..." 
                class="custom-input search-input">
            </div>

            <select [(ngModel)]="filters.level" (change)="applyFilters()" class="custom-input filter-select">
              <option [ngValue]="null">All Levels</option>
              <option *ngFor="let opt of levelOptions" [value]="opt.value">{{ opt.label }}</option>
            </select>

            <select [(ngModel)]="filters.sort" (change)="applyFilters()" class="custom-input filter-select">
              <option *ngFor="let opt of sortOptions" [value]="opt.value">{{ opt.label }}</option>
            </select>
          </div>
        </div>

        <!-- UIverse Courses Grid -->
        <div *ngIf="filteredCourses.length > 0" class="courses-grid">
          <div *ngFor="let course of filteredCourses; trackBy: trackById" class="uiverse-card" [routerLink]="['/courses', course._id]">
            
            <!-- Base background block with curved cutouts -->
            <div class="card-bg-base">
              <div class="card-bg-cutout">
                <img *ngIf="course.thumbnail" [src]="course.thumbnail" class="course-bg-img" alt="cover">
              </div>
            </div>

            <!-- Animated Blob Layer -->
            <div class="card-glass-layer">
              <div class="animated-blob"></div>
            </div>

            <!-- Content Layer -->
            <div class="card-content-layer">
              
              <!-- Left Glass Panel -->
              <div class="card-left-panel">
                <span class="course-title">{{ course.title }}</span>
                <span class="course-instructor">By {{ course.instructor?.firstName }} {{ course.instructor?.lastName }}</span>
                
                <div class="course-bottom-info">
                  <span class="course-price">
                     <ng-container *ngIf="course.isFree">Free</ng-container>
                     <ng-container *ngIf="!course.isFree">
                        <span *ngIf="course.discountPrice">{{ course.discountPrice | currency:course.currency:'symbol':'1.0-0' }}</span>
                        <span *ngIf="!course.discountPrice">{{ course.price | currency:course.currency:'symbol':'1.0-0' }}</span>
                     </ng-container>
                  </span>
                </div>
              </div>

              <!-- Right Side Details -->
              <div class="card-right-panel">
                <span class="right-text">{{ course.level }}</span>
                <span class="right-text flex items-center gap-xs mt-xs">
                  <i class="pi pi-star-fill text-yellow"></i> {{ course.rating | number:'1.1-1' }}
                </span>
                
                <div class="arrow-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" class="w-4 h-4">
                    <path d="M4.646 2.146a.5.5 0 0 0 0 .708L7.793 6L4.646 9.146a.5.5 0 1 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z" fill="currentColor"></path>
                  </svg>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredCourses.length === 0" class="empty-state">
          <i class="pi pi-book"></i>
          <h3>No Courses Found</h3>
          <p>{{ filters.search ? 'No matching courses found.' : 'This category has no courses yet.' }}</p>
          <button routerLink="/courses" class="btn-primary mt-md">
            <i class="pi pi-search"></i> Browse All Courses
          </button>
        </div>

        <!-- Pagination -->
        <div *ngIf="totalPages > 1" class="pagination">
          <button class="page-btn" [disabled]="currentPage === 1" (click)="changePage(currentPage - 1)">
            <i class="pi pi-chevron-left"></i>
          </button>
          
          <button *ngFor="let page of getPageNumbers()" 
                  class="page-btn" 
                  [class.active]="page === currentPage" 
                  (click)="changePage(page)">
            {{ page }}
          </button>
          
          <button class="page-btn" [disabled]="currentPage === totalPages" (click)="changePage(currentPage + 1)">
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       THEME VARIABLES
       ========================================================================== */
    :host {
    height: 100%;
    }

    :host-context(.dark) {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --bg-ternary: #0b1120;
      --text-primary: #f8fafc;
      --text-secondary: #cbd5e1;
      --text-tertiary: #64748b;
      --border-primary: #334155;
      --border-secondary: #1e293b;
    }

    /* Utilities */
    .flex { display: flex; }
    .items-center { align-items: center; }
    .gap-xs { gap: var(--spacing-xs); }
    .gap-md { gap: var(--spacing-md); }
    .text-yellow { color: #facc15; }
    .w-1\\/4 { width: 25%; }
    .w-1\\/2 { width: 50%; }
    .h-4 { height: 1rem; }
    .h-8 { height: 2rem; }
    .mb-md { margin-bottom: var(--spacing-md); }
    .mt-md { margin-top: var(--spacing-md); }
    .mt-xs { margin-top: var(--spacing-xs); }

    /* Layout */
    .category-courses-container {
      padding: var(--spacing-3xl);
      min-height: 100vh;
      background: var(--bg-primary);
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Skeletons */
    .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
    .skeleton-line { background: var(--bg-ternary); border-radius: var(--ui-border-radius); }
    .skeleton-layer { position: absolute; inset: 0; background: var(--bg-ternary); }

    /* Breadcrumb */
    .breadcrumb {
      display: flex; align-items: center; gap: var(--spacing-sm);
      font-size: var(--font-size-sm); margin-bottom: var(--spacing-lg);
    }
    .bc-link { color: var(--text-tertiary); text-decoration: none; transition: var(--transition-base); }
    .bc-link:hover { color: var(--color-primary); }
    .bc-sep { color: var(--border-primary); }
    .bc-current { color: var(--text-secondary); font-weight: 500; }

    /* Category Header */
    .category-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: var(--spacing-2xl); padding-bottom: var(--spacing-xl);
      border-bottom: var(--ui-border-width) solid var(--border-secondary); flex-wrap: wrap; gap: var(--spacing-xl);
    }
    .category-title {
      font-family: var(--font-heading); font-size: var(--font-size-4xl); font-weight: 700;
      color: var(--text-primary); margin: 0 0 var(--spacing-sm); display: flex; align-items: center; gap: var(--spacing-md);
    }
    .category-icon { color: var(--color-primary); font-size: var(--font-size-3xl); }
    .category-description { color: var(--text-secondary); font-size: var(--font-size-md); line-height: 1.6; max-width: 800px; margin: 0; }

    .category-stats {
      display: flex; align-items: center; gap: var(--spacing-xl);
      background: var(--bg-secondary); padding: var(--spacing-md) var(--spacing-xl);
      border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl);
    }
    .stat-item { display: flex; flex-direction: column; align-items: center; }
    .stat-label { color: var(--text-tertiary); font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;}
    .stat-value { color: var(--text-primary); font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: 700; }

    .status-badge {
      display: inline-flex; align-items: center; padding: 2px var(--spacing-md); margin-top: 4px;
      border-radius: 999px; font-size: var(--font-size-xs); font-weight: 600; text-transform: uppercase;
    }
    .status-active { background-color: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success); border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent); }
    .status-inactive { background-color: color-mix(in srgb, var(--color-error) 15%, transparent); color: var(--color-error); border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent); }

    /* Filters Section */
    .filters-section { margin-bottom: var(--spacing-2xl); }
    .filter-group { display: flex; gap: var(--spacing-md); flex-wrap: wrap; }
    
    .search-wrapper { position: relative; flex: 1; min-width: 250px; }
    .search-icon { position: absolute; left: var(--spacing-md); top: 50%; transform: translateY(-50%); color: var(--text-tertiary); }
    .search-input { padding-left: 2.5rem !important; width: 100%; }
    
    .custom-input {
      padding: var(--spacing-sm) var(--spacing-lg);
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      color: var(--text-primary);
      font-size: var(--font-size-sm);
      outline: none; transition: var(--transition-base);
    }
    .custom-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
      background: var(--bg-primary);
    }
    .filter-select { min-width: 180px; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right var(--spacing-md) center; background-size: 1.2em 1.2em; }

    /* ==========================================================================
       UIVERSE CUSTOM CARD DESIGN 
       ========================================================================== */
    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--spacing-2xl);
      margin-bottom: var(--spacing-2xl);
    }

    .uiverse-card {
      width: 100%;
      aspect-ratio: 10 / 13; /* Similar to 200/300 proportion but responsive */
      min-height: 320px;
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.15); /* Light border for glass effect */
      border-radius: 1.25rem;
      overflow: hidden;
      cursor: pointer;
      background-color: #111; /* Dark base always to pop colors */
      transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s ease;
    }
    .uiverse-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      border-color: rgba(255, 255, 255, 0.3);
    }

    /* Background Setup */
    .card-bg-base {
      position: absolute; inset: 0; padding: 4px;
      background-color: var(--color-primary); /* Primary theme color edge */
    }
    .card-bg-cutout {
      width: 100%; height: 100%;
      background-color: #1a1a1a;
      border-radius: 1rem;
      border-top-right-radius: 100px;
      border-bottom-right-radius: 40px;
      overflow: hidden;
      position: relative;
    }
    .course-bg-img {
      width: 100%; height: 100%; object-fit: cover; 
      opacity: 0.25; mix-blend-mode: luminosity;
      transition: opacity 0.5s ease;
    }
    .uiverse-card:hover .course-bg-img { opacity: 0.45; mix-blend-mode: normal; }

    /* Animated Blur Layer */
    .card-glass-layer {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 1.25rem;
    }
    .animated-blob {
      width: 10rem; height: 10rem; border-radius: 50%;
      background: linear-gradient(to top right, var(--color-primary), #fdba74);
      animation: spinBlob 12s linear infinite;
      opacity: 0.8;
      filter: blur(10px);
    }
    @keyframes spinBlob { 100% { transform: rotate(360deg); } }

    /* Foreground Content Layout */
    .card-content-layer {
      position: absolute; inset: 0; padding: 10px;
      display: flex; justify-content: space-between;
      z-index: 2;
    }

    /* Left Panel (Glass) */
    .card-left-panel {
      width: 62%;
      padding: 16px 12px 10px;
      display: flex; flex-direction: column;
      border-radius: 1rem;
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      background-color: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #f3f4f6; /* Force light text for dark card */
      font-family: var(--font-mono);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .course-title {
      font-size: 1.15rem; font-weight: 600; line-height: 1.3;
      margin-bottom: 6px; font-family: var(--font-heading);
      display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
    }
    .course-instructor { font-size: 0.7rem; color: rgba(255,255,255,0.65); letter-spacing: 0.5px; }
    
    .course-bottom-info {
      margin-top: auto; width: 100%;
      display: flex; align-items: center; justify-content: center;
      padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);
    }
    .course-price { font-size: 0.9rem; font-weight: 700; color: rgba(255,255,255,0.9); }

    /* Right Panel (Minimalist Text) */
    .card-right-panel {
      height: 100%; padding-top: 12px; padding-right: 4px;
      display: flex; flex-direction: column; align-items: flex-end;
      color: rgba(255, 255, 255, 0.6);
      font-family: var(--font-mono);
    }
    .right-text { font-size: 11px; line-height: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
    .arrow-btn {
      width: 2.25rem; height: 2.25rem;
      margin-top: auto; margin-bottom: 4px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      background-color: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.1);
      transition: all 0.3s ease;
      color: rgba(255,255,255,0.9);
    }
    .uiverse-card:hover .arrow-btn { background-color: rgba(255,255,255,0.25); transform: scale(1.05); }
    .w-4 { width: 1rem; } .h-4 { height: 1rem; }

    /* Empty State */
    .empty-state {
      text-align: center; padding: var(--spacing-5xl); background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-xl); border: var(--ui-border-width) solid var(--border-primary);
    }
    .empty-state i { font-size: 4rem; color: var(--text-tertiary); margin-bottom: var(--spacing-lg); }
    .empty-state h3 { color: var(--text-primary); margin: 0 0 var(--spacing-sm); font-family: var(--font-heading); font-size: var(--font-size-2xl); }
    .empty-state p { color: var(--text-secondary); margin-bottom: var(--spacing-2xl); }
    
    .btn-primary {
      display: inline-flex; align-items: center; gap: var(--spacing-sm); background: var(--color-primary); color: #fff;
      padding: var(--spacing-md) var(--spacing-2xl); border-radius: var(--ui-border-radius-lg); font-weight: 600; border: none; cursor: pointer; transition: var(--transition-base);
    }
    .btn-primary:hover { background: var(--color-primary-dark); }

    /* Pagination */
    .pagination { display: flex; justify-content: center; gap: var(--spacing-xs); margin-top: var(--spacing-2xl); }
    .page-btn {
      width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
      border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg);
      background: var(--bg-primary); color: var(--text-primary); cursor: pointer; transition: var(--transition-base); font-weight: 500;
    }
    .page-btn:hover:not(:disabled) { background: var(--bg-secondary); }
    .page-btn.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Responsive */
    @media (max-width: 768px) {
      .category-courses-container { padding: var(--spacing-lg); }
      .category-header { flex-direction: column; }
      .filter-group { flex-direction: column; }
      .custom-input { width: 100%; }
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

    private subscriptions: Subscription[] = [];
    private categoryId: string = '';

    ngOnInit(): void {
        const sub = this.route.params.subscribe(params => {
            this.categoryId = params['id'];
            this.loadCategoryWithCourses();
        });
        this.subscriptions.push(sub);
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
        this.totalPages = Math.ceil(filtered.length / this.pageSize) || 1;
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.filteredCourses = filtered.slice(start, end);
    }

    private sortCourses(courses: any[], sortBy: string): any[] {
        return courses.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    // Fallback to title if createdAt is missing in mock data
                    if (!a.createdAt || !b.createdAt) return a.title.localeCompare(b.title);
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
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.applyFilters();
            // Scroll to top of grid
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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

    trackById(index: number, item: any): string {
        return item._id;
    }
}