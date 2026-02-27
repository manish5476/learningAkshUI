import { Component, OnInit, OnDestroy, inject, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';
import { Course, Category } from '../../../../core/models/course.model';
import { CategoryService } from '../../../../core/services/category.service';
import { CourseService } from '../../../../core/services/course.service';


@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-titles">
          <h1 class="title">{{ isInstructorMode ? 'My Courses' : 'Browse Courses' }}</h1>
          <p class="subtitle">{{ isInstructorMode ? 'Manage, monitor, and publish your courses' : 'Discover the perfect course for your learning journey' }}</p>
        </div>
        
        <!-- Only show Create button if in Instructor Mode -->
        <button *ngIf="isInstructorMode" routerLink="/courses/instructor/new" class="btn-primary">
          <i class="pi pi-plus"></i> Create New Course
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon icon-primary"><i class="pi pi-book"></i></div>
          <div class="stat-content">
            <p class="stat-label">Total Courses</p>
            <p class="stat-value">{{ stats.total }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon icon-success"><i class="pi pi-users"></i></div>
          <div class="stat-content">
            <p class="stat-label">Total Students</p>
            <p class="stat-value">{{ stats.students }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon icon-warning"><i class="pi pi-star-fill"></i></div>
          <div class="stat-content">
            <p class="stat-label">Avg Rating</p>
            <p class="stat-value">{{ stats.rating | number:'1.1-1' }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon icon-info"><i class="pi pi-wallet"></i></div>
          <div class="stat-content">
            <p class="stat-label">Estimated Revenue</p>
            <p class="stat-value">{{ stats.revenue | currency:'INR' }}</p>
          </div>
        </div>
      </div>

      <!-- Data Table Container -->
      <div class="table-container">
        
        <!-- Table Toolbar -->
        <div class="table-toolbar">
          <span class="toolbar-title">Course Directory</span>
          <div class="toolbar-actions">
            <button (click)="clearFilters()" class="btn-secondary">
              <i class="pi pi-filter-slash"></i> Clear
            </button>
            <div class="search-input-wrapper">
              <i class="pi pi-search search-icon"></i>
              <input 
                type="text" 
                placeholder="Search courses..." 
                (input)="onGlobalFilter($event)"
                class="search-input"
              >
            </div>
          </div>
        </div>

        <!-- Table Loading State -->
        <div *ngIf="isLoading" class="loading-state">
          <i class="pi pi-spin pi-spinner loading-icon"></i>
          <p>Loading your courses...</p>
        </div>

        <!-- Table Structure -->
        <div *ngIf="!isLoading" class="custom-table-wrapper">
          <table class="custom-table">
            <thead>
              <tr>
                <th class="col-expander"></th>
                <th class="col-sortable" (click)="sortBy('title')">
                  <div class="th-content">Course Title <i class="pi pi-sort"></i></div>
                </th>
                <th>
                  <div class="th-filter-content">
                    <span>Category</span>
                    <select class="filter-select custom-input" (change)="onCategoryFilter($event)">
                      <option value="">Any Category</option>
                      <option *ngFor="let cat of categories" [value]="cat.name">{{ cat.name }}</option>
                    </select>
                  </div>
                </th>
                <th class="col-sortable" (click)="sortBy('price')">
                  <div class="th-content">Price <i class="pi pi-sort"></i></div>
                </th>
                <th>
                  <div class="th-filter-content">
                    <span>Level</span>
                    <select class="filter-select custom-input" (change)="onLevelFilter($event)">
                      <option value="">Any Level</option>
                      <option *ngFor="let lvl of levels" [value]="lvl">{{ lvl | titlecase }}</option>
                    </select>
                  </div>
                </th>
                <th>Status</th>
                <!-- Only show Actions header in Instructor Mode -->
                <th *ngIf="isInstructorMode" class="text-center">Actions</th>
              </tr>
            </thead>
            
            <tbody>
              <ng-container *ngFor="let course of filteredCourses">
                <!-- Main Row -->
                <tr class="table-row">
                  <td class="text-center">
                    <button (click)="toggleRow(course)" class="btn-expander">
                      <i class="pi" [ngClass]="course.expanded ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
                    </button>
                  </td>
                  <td>
                    <div class="course-cell-info">
                      <div class="course-thumbnail">
                        <img 
                          *ngIf="course.thumbnail || course.previewVideo"
                          [src]="course.thumbnail || course.previewVideo" 
                          [alt]="course.title" 
                          (error)="$event.target.src='https://via.placeholder.com/150x85?text=No+Image'"
                        />
                        <div *ngIf="!course.thumbnail && !course.previewVideo" class="no-img">No Img</div>
                      </div>
                      <div class="course-meta">
                        <span class="course-title-text" [routerLink]="isInstructorMode ? ['/courses/instructor', course._id] : ['/courses', course.slug || course._id]" style="cursor: pointer;">
                          {{ course.title }}
                        </span>
                        <span class="course-instructor">{{ course.instructor.firstName }} {{ course.instructor.lastName }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="category-badge">
                      {{ course.category.name || 'Uncategorized' }}
                    </span>
                  </td>
                  <td>
                    <div class="price-cell">
                      <span *ngIf="course.isFree" class="price-free">FREE</span>
                      <span *ngIf="!course.isFree" class="price-value">{{ course.price | currency:course.currency }}</span>
                      <span *ngIf="course.discountPrice" class="price-discount">{{ course.discountPrice | currency:course.currency }}</span>
                    </div>
                  </td>
                  <td class="level-cell">
                    {{ course.level }}
                  </td>
                  <td>
                    <span class="status-badge" [ngClass]="getStatusClasses(course)">
                      {{ getCourseStatusLabel(course) }}
                    </span>
                  </td>
                  <!-- Only show Actions cell in Instructor Mode -->
                  <td *ngIf="isInstructorMode">
                    <div class="action-buttons">
                      <button [routerLink]="['/courses/instructor', course._id, 'edit']" title="Edit" class="btn-icon btn-icon-info">
                        <i class="pi pi-pencil"></i>
                      </button>
                      <button *ngIf="!course.isPublished" (click)="publishCourse(course)" title="Publish" class="btn-icon btn-icon-success">
                        <i class="pi pi-rocket"></i>
                      </button>
                      <button (click)="deleteCourse(course)" title="Delete" class="btn-icon btn-icon-danger">
                        <i class="pi pi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Expanded Details Row -->
                <tr *ngIf="course.expanded" class="expanded-row">
                  <!-- Adjust colspan dynamically based on mode -->
                  <td [attr.colspan]="isInstructorMode ? 7 : 6">
                    <div class="expanded-content">
                      <h4 class="expanded-title">
                        <i [routerLink]="isInstructorMode ? ['/courses/instructor', course._id] : ['/courses', course.slug || course._id]" class="pi pi-info-circle text-primary cursor-pointer"></i> Course Details
                      </h4>
                      
                      <div class="expanded-grid">
                        <!-- Left Column: Description & Metrics -->
                        <div class="expanded-col">
                          <h5 class="section-heading">Description</h5>
                          <p class="description-text">{{ course.description || 'No description provided.' }}</p>
                          
                          <h5 class="section-heading mt-lg">Metrics</h5>
                          <div class="metrics-container">
                            <div class="metric-badge">
                              <i  class="pi pi-video icon-primary"></i> {{ course.totalLessons || 0 }} Lessons
                            </div>
                            <div class="metric-badge">
                              <i class="pi pi-clock icon-success"></i> {{ course.totalDuration || 0 }} mins
                            </div>
                            <div class="metric-badge">
                              <i class="pi pi-users icon-info"></i> {{ course.totalEnrollments || 0 }} Students
                            </div>
                          </div>
                        </div>

                        <!-- Right Column: Learning Outcomes & Requirements -->
                        <div class="expanded-col">
                          <!-- What you will learn -->
                          <div class="outcomes-box">
                            <h5 class="section-heading">What you'll learn</h5>
                            <ul class="outcomes-list">
                              <li *ngFor="let item of course.whatYouWillLearn" class="outcome-item">
                                <i class="pi pi-check-circle icon-success"></i>
                                <span>{{ item }}</span>
                              </li>
                              <li *ngIf="!course.whatYouWillLearn.length" class="text-muted italic">No outcomes specified</li>
                            </ul>
                          </div>
                          
                          <!-- Requirements -->
                          <div class="mt-lg">
                            <h5 class="section-heading">Requirements</h5>
                            <div class="tags-container">
                              <span *ngFor="let req of course.requirements" class="tag-outline">
                                {{ req }}
                              </span>
                              <span *ngIf="!course.requirements.length" class="text-muted italic">No requirements specified</span>
                            </div>
                          </div>

                          <!-- Tags -->
                          <div class="mt-lg" *ngIf="course.tags.length">
                            <h5 class="section-heading">Tags</h5>
                            <div class="tags-container">
                              <span *ngFor="let tag of course.tags" class="tag-primary">
                                #{{ tag }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-container>

              <!-- Empty State -->
              <tr *ngIf="filteredCourses.length === 0">
                <td [attr.colspan]="isInstructorMode ? 7 : 6">
                  <div class="empty-state">
                    <div class="empty-icon-wrapper">
                      <i class="pi pi-inbox"></i>
                    </div>
                    <h3 class="empty-title">No courses found</h3>
                    <p class="empty-subtitle">Try adjusting your search or filters to find what you're looking for.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination Footer -->
        <div *ngIf="!isLoading && filteredCourses.length > 0" class="table-footer">
          <span>Showing {{ filteredCourses.length }} entries</span>
          <div class="pagination-controls">
            <button class="page-btn"><i class="pi pi-angle-left"></i></button>
            <button class="page-btn active">1</button>
            <button class="page-btn"><i class="pi pi-angle-right"></i></button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       THEME VARIABLES & CANONICAL MAPPING
       ========================================================================== */
    :host {
    width: 100%;
    height:100%
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

    /* ==========================================================================
       COMPONENT STYLES
       ========================================================================== */
    .page-container {
      padding: var(--spacing-3xl);
      max-width: 1280px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-4xl);
      gap: var(--spacing-xl);
    }
    @media (min-width: 640px) {
      .page-header { flex-direction: row; align-items: center; }
    }

    .header-titles .title {
      font-family: var(--font-heading);
      font-size: var(--font-size-4xl);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xs) 0;
    }
    .header-titles .subtitle {
      font-size: var(--font-size-md);
      color: var(--text-secondary);
      margin: 0;
    }

    /* Buttons */
    .btn-primary {
      display: inline-flex; align-items: center; gap: var(--spacing-sm);
      background-color: var(--color-primary); color: #ffffff;
      padding: var(--spacing-sm) var(--spacing-xl);
      border-radius: var(--ui-border-radius-lg);
      font-family: var(--font-heading); font-size: var(--font-size-md); font-weight: 500;
      border: none; cursor: pointer; box-shadow: var(--shadow-sm); transition: var(--transition-base);
    }
    .btn-primary:hover { background-color: var(--color-primary-dark); box-shadow: var(--shadow-md); }

    .btn-secondary {
      display: inline-flex; align-items: center; gap: var(--spacing-sm);
      background-color: transparent; color: var(--text-secondary);
      padding: var(--spacing-sm) var(--spacing-xl);
      border-radius: var(--ui-border-radius-lg);
      font-size: var(--font-size-md); font-weight: 500;
      border: var(--ui-border-width) solid var(--border-primary);
      cursor: pointer; transition: var(--transition-base);
    }
    .btn-secondary:hover { background-color: var(--bg-secondary); color: var(--text-primary); }

    /* Stats Grid */
    .stats-grid {
      display: grid; grid-template-columns: 1fr; gap: var(--spacing-xl); margin-bottom: var(--spacing-4xl);
    }
    @media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }

    .stat-card {
      background-color: var(--bg-primary); padding: var(--spacing-2xl);
      border-radius: var(--ui-border-radius-xl); border: var(--ui-border-width) solid var(--border-primary);
      box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: var(--spacing-xl);
      transition: var(--transition-base);
    }
    .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

    .stat-icon {
      padding: var(--spacing-xl); border-radius: var(--ui-border-radius-lg);
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon i { font-size: var(--font-size-xl); }
    .icon-primary { background-color: var(--color-primary-bg); color: var(--color-primary); }
    .icon-success { background-color: var(--color-success-bg); color: var(--color-success); }
    .icon-warning { background-color: var(--color-warning-bg); color: var(--color-warning); }
    .icon-info { background-color: var(--color-info-bg); color: var(--color-info); }

    .stat-label { font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: 500; margin: 0 0 var(--spacing-xs) 0; }
    .stat-value { font-family: var(--font-heading); font-size: var(--font-size-3xl); font-weight: 700; color: var(--text-primary); margin: 0; }

    /* Table Container */
    .table-container {
      background-color: var(--bg-primary); border-radius: var(--ui-border-radius-xl);
      border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-sm); overflow: hidden;
    }

    .table-toolbar {
      display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start;
      padding: var(--spacing-xl); border-bottom: var(--ui-border-width) solid var(--border-primary); gap: var(--spacing-xl);
    }
    @media (min-width: 640px) { .table-toolbar { flex-direction: row; align-items: center; } }

    .toolbar-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: 600; color: var(--text-primary); }
    .toolbar-actions { display: flex; align-items: center; gap: var(--spacing-lg); width: 100%; }
    @media (min-width: 640px) { .toolbar-actions { width: auto; } }

    .search-input-wrapper { position: relative; width: 100%; }
    @media (min-width: 640px) { .search-input-wrapper { width: 250px; } }
    .search-icon { position: absolute; left: var(--spacing-lg); top: 50%; transform: translateY(-50%); color: var(--text-muted); }
    
    .search-input, .custom-input {
      width: 100%; padding: var(--spacing-md) var(--spacing-xl);
      border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg);
      background-color: var(--bg-primary); color: var(--text-primary); font-size: var(--font-size-md); outline: none; transition: var(--transition-base);
    }
    .search-input { padding-left: 2.5rem; }
    .search-input:focus, .custom-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg); }

    /* Custom Table Styling */
    .custom-table-wrapper { overflow-x: auto; width: 100%; }
    .custom-table { width: 100%; border-collapse: collapse; text-align: left; font-size: var(--font-size-md); }
    .custom-table th {
      background-color: var(--bg-secondary); color: var(--text-secondary); font-weight: 500;
      padding: var(--spacing-xl); border-bottom: var(--ui-border-width) solid var(--border-primary);
    }
    
    .col-sortable { cursor: pointer; transition: var(--transition-base); }
    .col-sortable:hover { background-color: var(--border-secondary); }
    .th-content { display: flex; align-items: center; gap: var(--spacing-sm); }
    .th-content i { color: var(--text-muted); font-size: var(--font-size-sm); }
    
    .th-filter-content { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .filter-select {
      font-size: var(--font-size-xs); padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--ui-border-radius-sm); appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right var(--spacing-xs) center; background-size: 1em 1em;
      padding-right: var(--spacing-2xl);
    }

    .table-row {
      border-bottom: var(--ui-border-width) solid var(--border-primary); transition: var(--transition-base); background-color: var(--bg-primary);
    }
    .table-row:hover { background-color: var(--bg-secondary); }
    .table-row td { padding: var(--spacing-lg) var(--spacing-xl); }

    /* Cells */
    .btn-expander {
      width: 32px; height: 32px; border-radius: 50%; border: none; background: transparent; color: var(--text-secondary);
      cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: var(--transition-base);
    }
    .btn-expander:hover { background-color: var(--border-secondary); color: var(--text-primary); }

    .course-cell-info { display: flex; align-items: center; gap: var(--spacing-xl); }
    .course-thumbnail {
      width: 64px; height: 40px; border-radius: var(--ui-border-radius); background-color: var(--border-secondary);
      overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    }
    .course-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
    .no-img { color: var(--text-muted); font-size: var(--font-size-xs); }
    
    .course-meta { display: flex; flex-direction: column; max-width: 250px; overflow: hidden; }
    .course-title-text { font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .course-instructor { font-size: var(--font-size-xs); color: var(--text-secondary); }

    .category-badge {
      display: inline-block; padding: var(--spacing-xs) var(--spacing-md); background-color: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl);
      font-size: var(--font-size-xs); font-weight: 500; color: var(--text-secondary);
    }

    .price-cell { display: flex; flex-direction: column; }
    .price-free { font-weight: 700; color: var(--color-success); }
    .price-value { font-weight: 600; color: var(--text-primary); }
    .price-discount { font-size: var(--font-size-xs); text-decoration: line-through; color: var(--text-muted); }

    .level-cell { text-transform: capitalize; color: var(--text-secondary); }

    .status-badge {
      display: inline-flex; align-items: center; padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--ui-border-radius); font-size: var(--font-size-xs); font-weight: 500; border: var(--ui-border-width) solid transparent;
    }
    .status-published { background-color: var(--color-success-bg); color: var(--color-success); border-color: color-mix(in srgb, var(--color-success) 30%, transparent); }
    .status-pending { background-color: var(--color-warning-bg); color: var(--color-warning); border-color: color-mix(in srgb, var(--color-warning) 30%, transparent); }
    .status-draft { background-color: var(--bg-secondary); color: var(--text-secondary); border-color: var(--border-primary); }

    .action-buttons { display: flex; align-items: center; justify-content: center; gap: var(--spacing-xs); }
    .btn-icon {
      width: 32px; height: 32px; border-radius: 50%; border: none; background: transparent;
      display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-fast);
    }
    .btn-icon-info { color: var(--color-primary); }
    .btn-icon-info:hover { background-color: var(--color-primary-bg); }
    .btn-icon-success { color: var(--color-success); }
    .btn-icon-success:hover { background-color: var(--color-success-bg); }
    .btn-icon-danger { color: var(--color-error); }
    .btn-icon-danger:hover { background-color: var(--color-error-bg); }

    /* Expanded Row */
    .expanded-row { background-color: var(--bg-secondary); border-bottom: var(--ui-border-width) solid var(--border-primary); }
    .expanded-content {
      margin: var(--spacing-xl) var(--spacing-2xl); padding: var(--spacing-3xl); background-color: var(--bg-primary);
      border-radius: var(--ui-border-radius-xl); border: var(--ui-border-width) solid var(--border-primary); box-shadow: var(--shadow-xs);
    }
    
    .expanded-title {
      font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary);
      margin: 0 0 var(--spacing-2xl) 0; display: flex; align-items: center; gap: var(--spacing-md);
    }
    
    .expanded-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-4xl); white-space: normal; }
    @media (min-width: 768px) { .expanded-grid { grid-template-columns: repeat(2, 1fr); } }

    .section-heading {
      font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;
      color: var(--text-muted); margin: 0 0 var(--spacing-lg) 0;
    }
    
    .description-text { font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.5; margin: 0; }

    .metrics-container { display: flex; flex-wrap: wrap; gap: var(--spacing-lg); }
    .metric-badge {
      display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md) var(--spacing-lg);
      background-color: var(--bg-secondary); border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg); font-size: var(--font-size-sm); color: var(--text-primary);
    }

    .outcomes-box {
      background-color: var(--color-primary-bg); padding: var(--spacing-2xl); border-radius: var(--ui-border-radius-lg);
      border: var(--ui-border-width) solid color-mix(in srgb, var(--color-primary) 20%, transparent);
    }
    .outcomes-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--spacing-md); }
    .outcome-item { display: flex; align-items: flex-start; gap: var(--spacing-md); font-size: var(--font-size-sm); color: var(--text-secondary); }
    .outcome-item i { margin-top: 2px; }

    .tags-container { display: flex; flex-wrap: wrap; gap: var(--spacing-md); }
    .tag-outline {
      padding: var(--spacing-xs) var(--spacing-lg); border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius); font-size: var(--font-size-xs); color: var(--text-secondary); background-color: var(--bg-primary);
    }
    .tag-primary {
      padding: var(--spacing-xs) var(--spacing-lg); background-color: var(--color-info-bg); color: var(--color-info);
      border: var(--ui-border-width) solid color-mix(in srgb, var(--color-info) 30%, transparent);
      border-radius: var(--ui-border-radius-xl); font-size: var(--font-size-xs);
    }

    /* Empty & Loading States */
    .loading-state, .empty-state {
      padding: var(--spacing-5xl); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
    }
    .loading-icon { font-size: var(--font-size-4xl); color: var(--color-primary); margin-bottom: var(--spacing-xl); }
    
    .empty-icon-wrapper {
      width: 64px; height: 64px; border-radius: 50%; background-color: var(--bg-secondary);
      display: flex; align-items: center; justify-content: center; margin-bottom: var(--spacing-xl);
    }
    .empty-icon-wrapper i { font-size: var(--font-size-2xl); color: var(--text-muted); }
    .empty-title { font-family: var(--font-heading); font-size: var(--font-size-xl); color: var(--text-primary); margin: 0 0 var(--spacing-xs) 0; }
    .empty-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; max-width: 300px; }

    /* Footer */
    .table-footer {
      padding: var(--spacing-xl); border-top: var(--ui-border-width) solid var(--border-primary);
      display: flex; align-items: center; justify-content: space-between; font-size: var(--font-size-sm); color: var(--text-secondary);
    }
    .pagination-controls { display: flex; gap: var(--spacing-xs); }
    .page-btn {
      padding: var(--spacing-xs) var(--spacing-lg); border: var(--ui-border-width) solid var(--border-primary);
      background-color: var(--bg-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius-sm);
      cursor: pointer; transition: var(--transition-fast);
    }
    .page-btn:hover { background-color: var(--bg-secondary); }
    .page-btn.active { background-color: var(--color-primary-bg); color: var(--color-primary); border-color: var(--color-primary); }

    /* Utility */
    .mt-lg { margin-top: var(--spacing-xl); }
    .text-center { text-align: center; }
    .text-muted { color: var(--text-muted); }
    .italic { font-style: italic; }
    .cursor-pointer { cursor: pointer; }
  `]
})
export class CourseListComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private courseService = inject(CourseService);
  private categoryService = inject(CategoryService);

  courses: Course[] = [];
  filteredCourses: Course[] = [];
  categories: Category[] = [];
  isLoading = true;
  isInstructorMode = false;

  stats = {
    total: 0,
    students: 0,
    rating: 0,
    revenue: 0
  };

  levels = ['beginner', 'intermediate', 'advanced', 'all-levels'];
  sortConfig = { field: '', order: 1 };

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.isInstructorMode = this.router.url.includes('/instructor');
    this.loadCategories();
    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadCategories(): void {
    const sub = this.categoryService.getAll({ isActive: true }).subscribe({
      next: (res: any) => {
        this.categories = res?.data?.data || res?.data || [];
      }
    });
    this.subscriptions.push(sub);
  }

  private loadCourses(): void {
    this.isLoading = true;
    const queryParams = this.isInstructorMode ? {} : { isPublished: true };
    const sub = this.courseService.getAll(queryParams).subscribe({
      next: (res: any) => {
        const payload = res?.data;
        const coursesData = payload?.data || payload || [];
        this.courses = Array.isArray(coursesData) ? coursesData : [];
        this.filteredCourses = [...this.courses];
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Failed to load courses', error);
        this.isLoading = false;
        this.courses = [];
        this.filteredCourses = [];
      }
    });
    this.subscriptions.push(sub);
  }

  private calculateStats(): void {
    this.stats.total = this.courses.length;
    this.stats.students = this.courses.reduce((acc, c) => acc + (c.totalEnrollments || 0), 0);
    const avgRating = this.courses.reduce((acc, c) => acc + (c.rating || 0), 0) / (this.courses.length || 1);
    this.stats.rating = isNaN(avgRating) ? 0 : avgRating;
    this.stats.revenue = this.courses.reduce((acc, c) => {
      return acc + ((c.totalEnrollments || 0) * (c.price || 0));
    }, 0);
  }

  toggleRow(course: Course) {
    course.expanded = !course.expanded;
  }

  clearFilters() {
    this.filteredCourses = [...this.courses];
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) searchInput.value = '';
    const selects = document.querySelectorAll('select');
    selects.forEach(select => select.value = '');
  }

  onGlobalFilter(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFilters(term);
  }

  onCategoryFilter(event: Event) {
    const term = (event.target as HTMLSelectElement).value;
    if (!term) {
      this.filteredCourses = [...this.courses];
    } else {
      this.filteredCourses = this.courses.filter(c => c.category?.name === term);
    }
  }

  onLevelFilter(event: Event) {
    const term = (event.target as HTMLSelectElement).value;
    if (!term) {
      this.filteredCourses = [...this.courses];
    } else {
      this.filteredCourses = this.courses.filter(c => c.level === term);
    }
  }

  private applyFilters(searchTerm: string) {
    if (!searchTerm) {
      this.filteredCourses = [...this.courses];
      return;
    }
    this.filteredCourses = this.courses.filter(c =>
      c.title?.toLowerCase().includes(searchTerm) ||
      c.category?.name?.toLowerCase().includes(searchTerm) ||
      c.instructor?.firstName?.toLowerCase().includes(searchTerm) ||
      c.level?.toLowerCase().includes(searchTerm)
    );
  }

  sortBy(field: keyof Course) {
    this.sortConfig.order = this.sortConfig.field === field ? this.sortConfig.order * -1 : 1;
    this.sortConfig.field = field;

    this.filteredCourses.sort((a: any, b: any) => {
      const valA = a[field];
      const valB = b[field];
      if (valA < valB) return -1 * this.sortConfig.order;
      if (valA > valB) return 1 * this.sortConfig.order;
      return 0;
    });
  }

  getCourseStatusLabel(course: Course): string {
    if (course.isPublished && course.isApproved) return 'Published';
    if (course.isPublished && !course.isApproved) return 'Pending';
    return 'Draft';
  }

  getStatusClasses(course: Course): string {
    if (course.isPublished && course.isApproved) return 'status-published';
    if (course.isPublished && !course.isApproved) return 'status-pending';
    return 'status-draft';
  }

  publishCourse(course: Course): void {
    if (!confirm(`Are you sure you want to publish "${course.title}"?`)) return;

    const sub = this.courseService.publish(course._id).subscribe({
      next: () => {
        course.isPublished = true;
      },
      error: (error: any) => {
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
      error: (error: any) => {
        console.error('Failed to delete course', error);
      }
    });
    this.subscriptions.push(sub);
  }
}

// import { Component, OnInit, OnDestroy, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { Observable, Subscription } from 'rxjs';

// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { IconFieldModule } from 'primeng/iconfield';
// import { InputIconModule } from 'primeng/inputicon';
// import { SelectModule } from 'primeng/select';
// import { InputTextModule } from 'primeng/inputtext';
// import { TooltipModule } from 'primeng/tooltip';
// import { RippleModule } from 'primeng/ripple';
// import { Course, Category } from '../../../../core/models/course.model';
// import { CategoryService } from '../../../../core/services/category.service';
// import { CourseService } from '../../../../core/services/course.service';

// @Component({
//   selector: 'app-course-list',
//   standalone: true,
//   imports: [CommonModule, RouterModule, FormsModule, TableModule, ButtonModule, TagModule, IconFieldModule, InputIconModule, SelectModule, InputTextModule, TooltipModule, RippleModule],
//   template: `
//     <div class="page-container">
//       <!-- Header -->
//       <div class="page-header">
//         <div class="header-titles">
//           <h1 class="title">{{ isInstructorMode ? 'My Courses' : 'Browse Courses' }}</h1>
//           <p class="subtitle">{{ isInstructorMode ? 'Manage, monitor, and publish your courses' : 'Discover the perfect course for your learning journey' }}</p>
//         </div>
        
//         <!-- Only show Create button if in Instructor Mode -->
//         <button *ngIf="isInstructorMode" routerLink="/courses/instructor/new" class="btn-primary">
//           <i class="pi pi-plus"></i> Create New Course
//         </button>
//       </div>

//       <!-- Stats Cards -->
//       <div class="stats-grid">
//         <div class="stat-card">
//           <div class="stat-icon icon-primary"><i class="pi pi-book"></i></div>
//           <div class="stat-content">
//             <p class="stat-label">Total Courses</p>
//             <p class="stat-value">{{ stats.total }}</p>
//           </div>
//         </div>
//         <div class="stat-card">
//           <div class="stat-icon icon-success"><i class="pi pi-users"></i></div>
//           <div class="stat-content">
//             <p class="stat-label">Total Students</p>
//             <p class="stat-value">{{ stats.students }}</p>
//           </div>
//         </div>
//         <div class="stat-card">
//           <div class="stat-icon icon-warning"><i class="pi pi-star-fill"></i></div>
//           <div class="stat-content">
//             <p class="stat-label">Avg Rating</p>
//             <p class="stat-value">{{ stats.rating | number:'1.1-1' }}</p>
//           </div>
//         </div>
//         <div class="stat-card">
//           <div class="stat-icon icon-info"><i class="pi pi-wallet"></i></div>
//           <div class="stat-content">
//             <p class="stat-label">Estimated Revenue</p>
//             <p class="stat-value">{{ stats.revenue | currency:'INR' }}</p>
//           </div>
//         </div>
//       </div>

//       <!-- Data Table Container -->
//       <div class="table-container">
        
//         <!-- Table Toolbar -->
//         <div class="table-toolbar">
//           <span class="toolbar-title">Course Directory</span>
//           <div class="toolbar-actions">
//             <button (click)="clearFilters()" class="btn-secondary">
//               <i class="pi pi-filter-slash"></i> Clear
//             </button>
//             <div class="search-input-wrapper">
//               <i class="pi pi-search search-icon"></i>
//               <input 
//                 type="text" 
//                 placeholder="Search courses..." 
//                 (input)="onGlobalFilter($event)"
//                 class="search-input"
//               >
//             </div>
//           </div>
//         </div>

//         <!-- Table Loading State -->
//         <div *ngIf="isLoading" class="loading-state">
//           <i class="pi pi-spin pi-spinner loading-icon"></i>
//           <p>Loading your courses...</p>
//         </div>

//         <!-- Table Structure -->
//         <div *ngIf="!isLoading" class="custom-table-wrapper">
//           <table class="custom-table">
//             <thead>
//               <tr>
//                 <th class="col-expander"></th>
//                 <th class="col-sortable" (click)="sortBy('title')">
//                   <div class="th-content">Course Title <i class="pi pi-sort"></i></div>
//                 </th>
//                 <th>
//                   <div class="th-filter-content">
//                     <span>Category</span>
//                     <select class="filter-select" (change)="onCategoryFilter($event)">
//                       <option value="">Any Category</option>
//                       <option *ngFor="let cat of categories" [value]="cat.name">{{ cat.name }}</option>
//                     </select>
//                   </div>
//                 </th>
//                 <th class="col-sortable" (click)="sortBy('price')">
//                   <div class="th-content">Price <i class="pi pi-sort"></i></div>
//                 </th>
//                 <th>
//                   <div class="th-filter-content">
//                     <span>Level</span>
//                     <select class="filter-select" (change)="onLevelFilter($event)">
//                       <option value="">Any Level</option>
//                       <option *ngFor="let lvl of levels" [value]="lvl">{{ lvl | titlecase }}</option>
//                     </select>
//                   </div>
//                 </th>
//                 <th>Status</th>
//                 <!-- Only show Actions header in Instructor Mode -->
//                 <th *ngIf="isInstructorMode" class="text-center">Actions</th>
//               </tr>
//             </thead>
            
//             <tbody>
//               <ng-container *ngFor="let course of filteredCourses">
//                 <!-- Main Row -->
//                 <tr class="table-row">
//                   <td class="text-center">
//                     <button (click)="toggleRow(course)" class="btn-expander">
//                       <i class="pi" [ngClass]="course.expanded ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
//                     </button>
//                   </td>
//                   <td>
//                     <div class="course-cell-info">
//                       <div class="course-thumbnail">
//                         <img 
//                           *ngIf="course.thumbnail || course.previewVideo"
//                           [src]="course.thumbnail || course.previewVideo" 
//                           [alt]="course.title" 
//                           (error)="$event.target.src='https://via.placeholder.com/150x85?text=No+Image'"
//                         />
//                         <div *ngIf="!course.thumbnail && !course.previewVideo" class="no-img">No Img</div>
//                       </div>
//                       <div class="course-meta">
//                         <span class="course-title-text" [routerLink]="['/courses', course._id]" style="cursor: pointer;">
//                           {{ course.title }}
//                         </span>
//                         <span class="course-instructor">{{ course.instructor.firstName }} {{ course.instructor.lastName }}</span>
//                       </div>
//                     </div>
//                   </td>
//                   <td>
//                     <span class="category-badge">
//                       {{ course.category.name || 'Uncategorized' }}
//                     </span>
//                   </td>
//                   <td>
//                     <div class="price-cell">
//                       <span *ngIf="course.isFree" class="price-free">FREE</span>
//                       <span *ngIf="!course.isFree" class="price-value">{{ course.price | currency:course.currency }}</span>
//                       <span *ngIf="course.discountPrice" class="price-discount">{{ course.discountPrice | currency:course.currency }}</span>
//                     </div>
//                   </td>
//                   <td class="level-cell">
//                     {{ course.level }}
//                   </td>
//                   <td>
//                     <span class="status-badge" [ngClass]="getStatusClasses(course)">
//                       {{ getCourseStatusLabel(course) }}
//                     </span>
//                   </td>
//                   <!-- Only show Actions cell in Instructor Mode -->
//                   <td *ngIf="isInstructorMode">
//                     <div class="action-buttons">
//                       <button [routerLink]="['/courses/instructor', course._id, 'edit']" title="Edit" class="btn-icon btn-icon-info">
//                         <i class="pi pi-pencil"></i>
//                       </button>
//                       <button *ngIf="!course.isPublished" (click)="publishCourse(course)" title="Publish" class="btn-icon btn-icon-success">
//                         <i class="pi pi-rocket"></i>
//                       </button>
//                       <button (click)="deleteCourse(course)" title="Delete" class="btn-icon btn-icon-danger">
//                         <i class="pi pi-trash"></i>
//                       </button>
//                     </div>
//                   </td>
//                 </tr>

//                 <!-- Expanded Details Row -->
//                 <tr *ngIf="course.expanded" class="expanded-row">
//                   <!-- Adjust colspan dynamically based on mode -->
//                   <td [attr.colspan]="isInstructorMode ? 7 : 6">
//                     <div class="expanded-content">
//                       <h4 class="expanded-title">
//                         <i [routerLink]="['/courses', course._id]" class="pi pi-info-circle text-primary cursor-pointer"></i> Course Details
//                       </h4>
                      
//                       <div class="expanded-grid">
//                         <!-- Left Column: Description & Metrics -->
//                         <div class="expanded-col">
//                           <h5 class="section-heading">Description</h5>
//                           <p class="description-text">{{ course.description || 'No description provided.' }}</p>
                          
//                           <h5 class="section-heading mt-lg">Metrics</h5>
//                           <div class="metrics-container">
//                             <div class="metric-badge">
//                               <i  class="pi pi-video icon-primary"></i> {{ course.totalLessons || 0 }} Lessons
//                             </div>
//                             <div class="metric-badge">
//                               <i class="pi pi-clock icon-success"></i> {{ course.totalDuration || 0 }} mins
//                             </div>
//                             <div class="metric-badge">
//                               <i class="pi pi-users icon-info"></i> {{ course.totalEnrollments || 0 }} Students
//                             </div>
//                           </div>
//                         </div>

//                         <!-- Right Column: Learning Outcomes & Requirements -->
//                         <div class="expanded-col">
//                           <!-- What you will learn -->
//                           <div class="outcomes-box">
//                             <h5 class="section-heading">What you'll learn</h5>
//                             <ul class="outcomes-list">
//                               <li *ngFor="let item of course.whatYouWillLearn" class="outcome-item">
//                                 <i class="pi pi-check-circle icon-success"></i>
//                                 <span>{{ item }}</span>
//                               </li>
//                               <li *ngIf="!course.whatYouWillLearn.length" class="text-muted italic">No outcomes specified</li>
//                             </ul>
//                           </div>
                          
//                           <!-- Requirements -->
//                           <div class="mt-lg">
//                             <h5 class="section-heading">Requirements</h5>
//                             <div class="tags-container">
//                               <span *ngFor="let req of course.requirements" class="tag-outline">
//                                 {{ req }}
//                               </span>
//                               <span *ngIf="!course.requirements.length" class="text-muted italic">No requirements specified</span>
//                             </div>
//                           </div>

//                           <!-- Tags -->
//                           <div class="mt-lg" *ngIf="course.tags.length">
//                             <h5 class="section-heading">Tags</h5>
//                             <div class="tags-container">
//                               <span *ngFor="let tag of course.tags" class="tag-primary">
//                                 #{{ tag }}
//                               </span>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </td>
//                 </tr>
//               </ng-container>

//               <!-- Empty State -->
//               <tr *ngIf="filteredCourses.length === 0">
//                 <td [attr.colspan]="isInstructorMode ? 7 : 6">
//                   <div class="empty-state">
//                     <div class="empty-icon-wrapper">
//                       <i class="pi pi-inbox"></i>
//                     </div>
//                     <h3 class="empty-title">No courses found</h3>
//                     <p class="empty-subtitle">Try adjusting your search or filters to find what you're looking for.</p>
//                   </div>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
        
//         <!-- Pagination Footer -->
//         <div *ngIf="!isLoading && filteredCourses.length > 0" class="table-footer">
//           <span>Showing {{ filteredCourses.length }} entries</span>
//           <div class="pagination-controls">
//             <button class="page-btn"><i class="pi pi-angle-left"></i></button>
//             <button class="page-btn active">1</button>
//             <button class="page-btn"><i class="pi pi-angle-right"></i></button>
//           </div>
//         </div>

//       </div>
//     </div>
//   `,
//   styleUrl:'./course-list.component.scss'
// })
// export class CourseListComponent implements OnInit, OnDestroy {
//   private router = inject(Router);
//   private courseService = inject(CourseService);
//   private categoryService = inject(CategoryService);

//   courses: Course[] = [];
//   filteredCourses: Course[] = [];
//   categories: Category[] = [];
//   isLoading = true;
//   isInstructorMode = false; // Add this flag to determine context

//   stats = {
//     total: 0,
//     students: 0,
//     rating: 0,
//     revenue: 0
//   };

//   levels = ['beginner', 'intermediate', 'advanced', 'all-levels'];
//   sortConfig = { field: '', order: 1 };

//   private subscriptions: Subscription[] = [];

//   ngOnInit(): void {
//     // Check if the current URL contains '/instructor'
//     this.isInstructorMode = this.router.url.includes('/instructor');

//     this.loadCategories();
//     this.loadCourses();
//   }

//   ngOnDestroy(): void {
//     this.subscriptions.forEach(sub => sub.unsubscribe());
//   }

//   private loadCategories(): void {
//     const sub = this.categoryService.getAll({ isActive: true }).subscribe({
//       next: (res: any) => {
//         this.categories = res?.data?.data || res?.data || [];
//       }
//     });
//     this.subscriptions.push(sub);
//   }

//   private loadCourses(): void {
//     this.isLoading = true;

//     // Optional: If you only want Public users to see published courses, 
//     // you could pass a query param like { isPublished: true } if your API supports it.
//     const queryParams = this.isInstructorMode ? {} : { isPublished: true };

//     const sub = this.courseService.getAll(queryParams).subscribe({
//       next: (res: any) => {
//         const payload = res?.data;
//         const coursesData = payload?.data || payload || [];
//         this.courses = Array.isArray(coursesData) ? coursesData : [];
//         this.filteredCourses = [...this.courses];

//         this.calculateStats();
//         this.isLoading = false;
//       },
//       error: (error: any) => {
//         console.error('Failed to load courses', error);
//         this.isLoading = false;
//         this.courses = [];
//         this.filteredCourses = [];
//       }
//     });
//     this.subscriptions.push(sub);
//   }

//   private calculateStats(): void {
//     this.stats.total = this.courses.length;
//     this.stats.students = this.courses.reduce((acc, c) => acc + (c.totalEnrollments || 0), 0);
//     const avgRating = this.courses.reduce((acc, c) => acc + (c.rating || 0), 0) / (this.courses.length || 1);
//     this.stats.rating = isNaN(avgRating) ? 0 : avgRating;
//     this.stats.revenue = this.courses.reduce((acc, c) => {
//       return acc + ((c.totalEnrollments || 0) * (c.price || 0));
//     }, 0);
//   }

//   toggleRow(course: Course) {
//     course.expanded = !course.expanded;
//   }

//   clearFilters() {
//     this.filteredCourses = [...this.courses];
//     const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
//     if (searchInput) searchInput.value = '';
//     const selects = document.querySelectorAll('select');
//     selects.forEach(select => select.value = '');
//   }

//   onGlobalFilter(event: Event) {
//     const term = (event.target as HTMLInputElement).value.toLowerCase();
//     this.applyFilters(term);
//   }

//   onCategoryFilter(event: Event) {
//     const term = (event.target as HTMLSelectElement).value;
//     if (!term) {
//       this.filteredCourses = [...this.courses];
//     } else {
//       this.filteredCourses = this.courses.filter(c => c.category?.name === term);
//     }
//   }

//   onLevelFilter(event: Event) {
//     const term = (event.target as HTMLSelectElement).value;
//     if (!term) {
//       this.filteredCourses = [...this.courses];
//     } else {
//       this.filteredCourses = this.courses.filter(c => c.level === term);
//     }
//   }

//   private applyFilters(searchTerm: string) {
//     if (!searchTerm) {
//       this.filteredCourses = [...this.courses];
//       return;
//     }
//     this.filteredCourses = this.courses.filter(c =>
//       c.title?.toLowerCase().includes(searchTerm) ||
//       c.category?.name?.toLowerCase().includes(searchTerm) ||
//       c.instructor?.firstName?.toLowerCase().includes(searchTerm) ||
//       c.level?.toLowerCase().includes(searchTerm)
//     );
//   }

//   sortBy(field: keyof Course) {
//     this.sortConfig.order = this.sortConfig.field === field ? this.sortConfig.order * -1 : 1;
//     this.sortConfig.field = field;

//     this.filteredCourses.sort((a: any, b: any) => {
//       const valA = a[field];
//       const valB = b[field];
//       if (valA < valB) return -1 * this.sortConfig.order;
//       if (valA > valB) return 1 * this.sortConfig.order;
//       return 0;
//     });
//   }

//   getCourseStatusLabel(course: Course): string {
//     if (course.isPublished && course.isApproved) return 'Published';
//     if (course.isPublished && !course.isApproved) return 'Pending';
//     return 'Draft';
//   }

//   getStatusClasses(course: Course): string {
//     if (course.isPublished && course.isApproved) return 'status-published';
//     if (course.isPublished && !course.isApproved) return 'status-pending';
//     return 'status-draft';
//   }

//   publishCourse(course: Course): void {
//     if (!confirm(`Are you sure you want to publish "${course.title}"?`)) return;

//     const sub = this.courseService.publish(course._id).subscribe({
//       next: () => {
//         course.isPublished = true;
//       },
//       error: (error: any) => {
//         console.error('Failed to publish course', error);
//       }
//     });
//     this.subscriptions.push(sub);
//   }

//   deleteCourse(course: Course): void {
//     if (!confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) return;

//     const sub = this.courseService.delete(course._id).subscribe({
//       next: () => {
//         this.courses = this.courses.filter(c => c._id !== course._id);
//         this.filteredCourses = this.filteredCourses.filter(c => c._id !== course._id);
//         this.calculateStats();
//       },
//       error: (error: any) => {
//         console.error('Failed to delete course', error);
//       }
//     });
//     this.subscriptions.push(sub);
//   }
// }

// // import { Component, OnInit, OnDestroy, inject, Injectable } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormsModule } from '@angular/forms';
// // import { Router, RouterModule } from '@angular/router';
// // import { Observable, of, Subscription } from 'rxjs';

// // import { TableModule } from 'primeng/table';
// // import { ButtonModule } from 'primeng/button';
// // import { TagModule } from 'primeng/tag';
// // import { IconFieldModule } from 'primeng/iconfield';
// // import { InputIconModule } from 'primeng/inputicon';
// // import { SelectModule } from 'primeng/select';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { RippleModule } from 'primeng/ripple';
// // import { Course, Category } from '../../../../core/models/course.model';
// // import { CategoryService } from '../../../../core/services/category.service';
// // import { CourseService } from '../../../../core/services/course.service';

// // @Component({
// //   selector: 'app-course-list',
// //   standalone: true,
// //   imports: [CommonModule, RouterModule, FormsModule, TableModule, ButtonModule, TagModule, IconFieldModule, InputIconModule, SelectModule, InputTextModule, TooltipModule, RippleModule],
// //   templateUrl: './course-list.component.html',
// //   styleUrl: './course-list.component.scss'
// // })
// // export class CourseListComponent implements OnInit, OnDestroy {
// //   private courseService = inject(CourseService);
// //   private categoryService = inject(CategoryService);

// //   courses: Course[] = [];
// //   filteredCourses: Course[] = [];
// //   categories: Category[] = [];
// //   isLoading = true;

// //   stats = {
// //     total: 0,
// //     students: 0,
// //     rating: 0,
// //     revenue: 0
// //   };

// //   levels = ['beginner', 'intermediate', 'advanced', 'all-levels'];
// //   sortConfig = { field: '', order: 1 };

// //   private subscriptions: Subscription[] = [];

// //   ngOnInit(): void {
// //     this.loadCategories();
// //     this.loadCourses();
// //   }

// //   ngOnDestroy(): void {
// //     this.subscriptions.forEach(sub => sub.unsubscribe());
// //   }

// //   private loadCategories(): void {
// //     const sub = this.categoryService.getAll({ isActive: true }).subscribe({
// //       next: (res: any) => {
// //         this.categories = res?.data?.data || res?.data || [];
// //       }
// //     });
// //     this.subscriptions.push(sub);
// //   }

// //   private loadCourses(): void {
// //     this.isLoading = true;
// //     const sub = this.courseService.getAll().subscribe({
// //       next: (res: any) => {
// //         const payload = res?.data;
// //         const coursesData = payload?.data || payload || [];
// //         this.courses = Array.isArray(coursesData) ? coursesData : [];
// //         this.filteredCourses = [...this.courses];

// //         this.calculateStats();
// //         this.isLoading = false;
// //       },
// //       error: (error: any) => {
// //         console.error('Failed to load courses', error);
// //         this.isLoading = false;
// //         this.courses = [];
// //         this.filteredCourses = [];
// //       }
// //     });
// //     this.subscriptions.push(sub);
// //   }

// //   private calculateStats(): void {
// //     this.stats.total = this.courses.length;
// //     this.stats.students = this.courses.reduce((acc, c) => acc + (c.totalEnrollments || 0), 0);
// //     const avgRating = this.courses.reduce((acc, c) => acc + (c.rating || 0), 0) / (this.courses.length || 1);
// //     this.stats.rating = isNaN(avgRating) ? 0 : avgRating;
// //     this.stats.revenue = this.courses.reduce((acc, c) => {
// //       return acc + ((c.totalEnrollments || 0) * (c.price || 0));
// //     }, 0);
// //   }

// //   toggleRow(course: Course) {
// //     course.expanded = !course.expanded;
// //   }

// //   clearFilters() {
// //     this.filteredCourses = [...this.courses];
// //     const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
// //     if (searchInput) searchInput.value = '';
// //     const selects = document.querySelectorAll('select');
// //     selects.forEach(select => select.value = '');
// //   }

// //   onGlobalFilter(event: Event) {
// //     const term = (event.target as HTMLInputElement).value.toLowerCase();
// //     this.applyFilters(term);
// //   }

// //   onCategoryFilter(event: Event) {
// //     const term = (event.target as HTMLSelectElement).value;
// //     if (!term) {
// //       this.filteredCourses = [...this.courses];
// //     } else {
// //       this.filteredCourses = this.courses.filter(c => c.category?.name === term);
// //     }
// //   }

// //   onLevelFilter(event: Event) {
// //     const term = (event.target as HTMLSelectElement).value;
// //     if (!term) {
// //       this.filteredCourses = [...this.courses];
// //     } else {
// //       this.filteredCourses = this.courses.filter(c => c.level === term);
// //     }
// //   }

// //   private applyFilters(searchTerm: string) {
// //     if (!searchTerm) {
// //       this.filteredCourses = [...this.courses];
// //       return;
// //     }
// //     this.filteredCourses = this.courses.filter(c =>
// //       c.title?.toLowerCase().includes(searchTerm) ||
// //       c.category?.name?.toLowerCase().includes(searchTerm) ||
// //       c.instructor?.firstName?.toLowerCase().includes(searchTerm) ||
// //       c.level?.toLowerCase().includes(searchTerm)
// //     );
// //   }

// //   sortBy(field: keyof Course) {
// //     this.sortConfig.order = this.sortConfig.field === field ? this.sortConfig.order * -1 : 1;
// //     this.sortConfig.field = field;

// //     this.filteredCourses.sort((a: any, b: any) => {
// //       const valA = a[field];
// //       const valB = b[field];
// //       if (valA < valB) return -1 * this.sortConfig.order;
// //       if (valA > valB) return 1 * this.sortConfig.order;
// //       return 0;
// //     });
// //   }

// //   getCourseStatusLabel(course: Course): string {
// //     if (course.isPublished && course.isApproved) return 'Published';
// //     if (course.isPublished && !course.isApproved) return 'Pending';
// //     return 'Draft';
// //   }

// //   getStatusClasses(course: Course): string {
// //     if (course.isPublished && course.isApproved) return 'status-published';
// //     if (course.isPublished && !course.isApproved) return 'status-pending';
// //     return 'status-draft';
// //   }

// //   publishCourse(course: Course): void {
// //     if (!confirm(`Are you sure you want to publish "${course.title}"?`)) return;

// //     const sub = this.courseService.publish(course._id).subscribe({
// //       next: () => {
// //         course.isPublished = true;
// //       },
// //       error: (error: any) => {
// //         console.error('Failed to publish course', error);
// //       }
// //     });
// //     this.subscriptions.push(sub);
// //   }

// //   deleteCourse(course: Course): void {
// //     if (!confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) return;

// //     const sub = this.courseService.delete(course._id).subscribe({
// //       next: () => {
// //         this.courses = this.courses.filter(c => c._id !== course._id);
// //         this.filteredCourses = this.filteredCourses.filter(c => c._id !== course._id);
// //         this.calculateStats();
// //       },
// //       error: (error: any) => {
// //         console.error('Failed to delete course', error);
// //       }
// //     });
// //     this.subscriptions.push(sub);
// //   }

// //   courseDetails() {
// //     // this.router.navigate([paymentId], { relativeTo: this.route })
// //   }

// // }