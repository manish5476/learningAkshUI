import { Component, OnInit, OnDestroy, inject, Injectable, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of, Subscription } from 'rxjs';

import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CategoryDetailComponent } from './category-detail.component';
import { CategoryFormComponent } from './category-form.component';
import { CategoryService } from '../../../core/services/category.service';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,RouterModule,
    FormsModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    CategoryFormComponent,
    CategoryDetailComponent
  ],
  providers: [ConfirmationService, MessageService, DatePipe],
  template: `
    <div class="page-container">
      <p-toast position="top-right"></p-toast>
      <p-confirmDialog [style]="{width: '450px'}"></p-confirmDialog>

      <!-- Header -->
      <div class="page-header">
        <div class="header-titles">
          <h1 class="title">Category Management</h1>
          <p class="subtitle">Organize and structure your educational content catalog</p>
        </div>
        <button (click)="openNewCategoryDialog()" class="btn-primary">
          <i class="pi pi-plus"></i> Add Category
        </button>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon icon-primary"><i class="pi pi-tags"></i></div>
          <div class="stat-content">
            <p class="stat-label">Total Categories</p>
            <p class="stat-value">{{ stats.total }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon icon-success"><i class="pi pi-check-circle"></i></div>
          <div class="stat-content">
            <p class="stat-label">Active Categories</p>
            <p class="stat-value">{{ stats.active }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon icon-warning"><i class="pi pi-pause-circle"></i></div>
          <div class="stat-content">
            <p class="stat-label">Inactive Categories</p>
            <p class="stat-value">{{ stats.inactive }}</p>
          </div>
        </div>
      </div>

      <!-- Data Table Container -->
      <div class="table-container">
        
        <!-- Table Toolbar -->
        <div class="table-toolbar">
          <span class="toolbar-title">Categories Directory</span>
          <div class="toolbar-actions">
            <button (click)="clearFilters()" class="btn-secondary">
              <i class="pi pi-filter-slash"></i> Clear
            </button>
            <div class="search-input-wrapper">
              <i class="pi pi-search search-icon"></i>
              <input 
                type="text" 
                [(ngModel)]="filters.search" 
                (ngModelChange)="onSearchChange()"
                placeholder="Search categories..." 
                class="search-input"
              >
            </div>
          </div>
        </div>

        <!-- Table Loading State -->
        <div *ngIf="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner loading-icon"></i>
          <p>Loading your categories...</p>
        </div>

        <!-- Table Structure -->
        <div *ngIf="!loading" class="custom-table-wrapper">
          <table class="custom-table">
            <thead>
              <tr>
                <th class="col-sortable w-1/3" (click)="sortBy('name')">
                  <div class="th-content">Category Info <i class="pi pi-sort"></i></div>
                </th>
                <th class="w-1/4">Description</th>
                <th class="w-1/6">
                  <div class="th-filter-content">
                    <span>Status</span>
                    <select class="filter-select" [(ngModel)]="filters.status" (change)="loadCategories()">
                      <option [ngValue]="null">All Statuses</option>
                      <option [ngValue]="true">Active</option>
                      <option [ngValue]="false">Inactive</option>
                    </select>
                  </div>
                </th>
                <th class="col-sortable w-1/6" (click)="sortBy('createdAt')">
                  <div class="th-content">Created At <i class="pi pi-sort"></i></div>
                </th>
                <th class="text-center w-1/6">Actions</th>
              </tr>
            </thead>
            
            <tbody>
              <ng-container *ngFor="let category of filteredCategories">
                <tr class="table-row">
                  <!-- Category Info -->
                  <td>
                    <div class="category-cell-info">
                      <div class="category-thumbnail">
                        <img 
                          *ngIf="category.image"
                          [src]="category.image" 
                          [alt]="category.name" 
                          (error)="$event.target.src='https://via.placeholder.com/150x85?text=No+Image'"
                        />
                        <div *ngIf="!category.image" class="no-img">
                          <i [class]="category.icon || 'pi pi-folder'"></i>
                        </div>
                      </div>
                      <div class="category-meta">
                        <span class="category-title-text">{{ category.name }}</span>
                        <span class="category-slug">/{{ category.slug }}</span>
                      </div>
                    </div>
                  </td>

                  <!-- Description -->
                  <td>
                    <p class="description-text">{{ category.description || 'No description provided.' }}</p>
                  </td>

                  <!-- Status -->
                  <td>
                    <span class="status-badge" [ngClass]="category.isActive ? 'status-active' : 'status-inactive'">
                      {{ category.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>

                  <!-- Created At -->
                  <td class="date-cell">
                    {{ category.createdAt | date:'mediumDate' }}
                  </td>

                  <!-- Actions -->
                  <td>
                    <div class="action-buttons">
                      <!-- (click)="viewCategory(category)" -->
                      <button [routerLink]="['/categories/admin', category._id]"  title="View" class="btn-icon btn-icon-secondary">
                        <i class="pi pi-eye"></i>
                      </button>
                      <button (click)="editCategory(category)" title="Edit" class="btn-icon btn-icon-info">
                        <i class="pi pi-pencil"></i>
                      </button>
                      <button (click)="addSubCategory(category)" title="Add Subcategory" class="btn-icon btn-icon-success">
                        <i class="pi pi-sitemap"></i>
                      </button>
                      <button (click)="deleteCategory(category)" title="Delete" class="btn-icon btn-icon-danger">
                        <i class="pi pi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-container>

              <!-- Empty State -->
              <tr *ngIf="filteredCategories.length === 0">
                <td colspan="5">
                  <div class="empty-state">
                    <div class="empty-icon-wrapper">
                      <i class="pi pi-tags"></i>
                    </div>
                    <h3 class="empty-title">No categories found</h3>
                    <p class="empty-subtitle">Get started by creating your first category.</p>
                    <button (click)="openNewCategoryDialog()" class="btn-primary mt-lg">
                      <i class="pi pi-plus"></i> Add Category
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination Footer -->
        <div *ngIf="!loading && filteredCategories.length > 0" class="table-footer">
          <span>Showing {{ filteredCategories.length }} entries</span>
          <div class="pagination-controls">
            <button class="page-btn"><i class="pi pi-angle-left"></i></button>
            <button class="page-btn active">1</button>
            <button class="page-btn"><i class="pi pi-angle-right"></i></button>
          </div>
        </div>
      </div>

      <!-- Category Form Dialog -->
      <p-dialog appendTo="body" 
        [(visible)]="showFormDialog" 
        [style]="{width: '80%'}" 
        [header]="dialogTitle"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [closeOnEscape]="true"
        [dismissableMask]="true">
        <app-category-form 
          [categoryId]="selectedCategoryId"
          [parentCategoryId]="parentCategoryId"
          (saved)="onCategorySaved($event)"
          (cancelled)="closeDialog()">
        </app-category-form>
      </p-dialog>

      <!-- Category Detail Dialog -->
      <p-dialog appendTo="body" 
        [(visible)]="showDetailDialog" 
 [style]="{width: '80%'}"
         header="Category Details"
        [modal]="true"
        [draggable]="false"
        [resizable]="false">
        
        <app-category-detail *ngIf="selectedCategory"
          [category]="selectedCategory"
          (edit)="editFromDetail()"
          (close)="closeDetailDialog()">
        </app-category-detail>
      </p-dialog>

    </div>
  `,
  styles: [`
    /* ==========================================================================
       THEME VARIABLES & CANONICAL MAPPING
       ========================================================================== */
    :host {
      // --font-body: 'Inter', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      // --font-heading: 'Poppins', -apple-system, system-ui, sans-serif;

      // --font-size-xs: 0.65rem;
      // --font-size-sm: 0.75rem;
      // --font-size-base: 0.8125rem;
      // --font-size-md: 0.875rem;
      // --font-size-lg: 0.9375rem;
      // --font-size-xl: 1rem;
      // --font-size-2xl: 1.125rem;
      // --font-size-3xl: 1.375rem;
      // --font-size-4xl: 1.75rem;

      // --line-height-tight: 1.1;
      // --line-height-normal: 1.3;
      // --line-height-relaxed: 1.5;

      // --font-weight-light: 300;
      // --font-weight-normal: 400;
      // --font-weight-medium: 500;
      // --font-weight-semibold: 600;
      // --font-weight-bold: 700;

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
      // --ui-border-radius-sm: 3px;
      // --ui-border-width: 1px;

      // --shadow-xs: 0 0.5px 1px rgba(0, 0, 0, 0.04);
      // --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
      // --shadow-md: 0 2px 6px rgba(0, 0, 0, 0.08);

      // --transition-fast: all 0.12s cubic-bezier(0.23, 1, 0.32, 1);
      // --transition-base: all 0.22s cubic-bezier(0.2, 0.9, 0.2, 1);
      
      // /* Base Theme Fallbacks */
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

      // /* Canonical Mapping Application */
      // --bg-primary: var(--theme-bg-primary);
      // --bg-secondary: var(--theme-bg-secondary);
      // --text-primary: var(--theme-text-primary);
      // --text-secondary: var(--theme-text-secondary);
      // --text-muted: var(--theme-text-tertiary);
      // --border-primary: var(--theme-border-primary);
      // --border-secondary: var(--theme-border-secondary);
      
      // --color-primary: var(--theme-accent-primary);
      // --color-primary-dark: var(--theme-accent-hover);
      // --color-primary-bg: color-mix(in srgb, var(--theme-accent-primary) 10%, transparent 90%);
      
      // --color-success: var(--theme-success);
      // --color-success-bg: color-mix(in srgb, var(--theme-success) 10%, transparent 90%);
      
      // --color-warning: var(--theme-warning);
      // --color-warning-bg: color-mix(in srgb, var(--theme-warning) 10%, transparent 90%);
      
      // --color-error: var(--theme-error);
      // --color-error-bg: color-mix(in srgb, var(--theme-error) 10%, transparent 90%);

      // font-family: var(--font-body);
      // color: var(--text-primary);
    }

    /* Dark Mode Defaults */
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
      font-weight: var(--font-weight-bold);
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
      font-family: var(--font-heading); font-size: var(--font-size-md); font-weight: var(--font-weight-medium);
      border: none; cursor: pointer; box-shadow: var(--shadow-sm); transition: var(--transition-base);
    }
    .btn-primary:hover { background-color: var(--color-primary-dark); box-shadow: var(--shadow-md); }

    .btn-secondary {
      display: inline-flex; align-items: center; gap: var(--spacing-sm);
      background-color: transparent; color: var(--text-secondary);
      padding: var(--spacing-sm) var(--spacing-xl);
      border-radius: var(--ui-border-radius-lg);
      font-size: var(--font-size-md); font-weight: var(--font-weight-medium);
      border: var(--ui-border-width) solid var(--border-primary);
      cursor: pointer; transition: var(--transition-base);
    }
    .btn-secondary:hover { background-color: var(--bg-secondary); color: var(--text-primary); }

    /* Stats Grid */
    .stats-grid {
      display: grid; grid-template-columns: 1fr; gap: var(--spacing-xl); margin-bottom: var(--spacing-4xl);
    }
    @media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }

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

    .stat-label { font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: var(--font-weight-medium); margin: 0 0 var(--spacing-xs) 0; }
    .stat-value { font-family: var(--font-heading); font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--text-primary); margin: 0; }

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

    .toolbar-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); color: var(--text-primary); }
    .toolbar-actions { display: flex; align-items: center; gap: var(--spacing-lg); width: 100%; }
    @media (min-width: 640px) { .toolbar-actions { width: auto; } }

    .search-input-wrapper { position: relative; width: 100%; }
    @media (min-width: 640px) { .search-input-wrapper { width: 250px; } }
    .search-icon { position: absolute; left: var(--spacing-lg); top: 50%; transform: translateY(-50%); color: var(--text-muted); }
    .search-input {
      width: 100%; padding: var(--spacing-md) var(--spacing-xl) var(--spacing-md) 2.5rem;
      border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg);
      background-color: var(--bg-primary); color: var(--text-primary); font-size: var(--font-size-md); outline: none; transition: var(--transition-base);
    }
    .search-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg); }

    /* Custom Table Styling */
    .custom-table-wrapper { overflow-x: auto; width: 100%; }
    .custom-table { width: 100%; border-collapse: collapse; text-align: left; font-size: var(--font-size-md); }
    
    .w-1\\/3 { width: 33.333%; }
    .w-1\\/4 { width: 25%; }
    .w-1\\/6 { width: 16.666%; }

    .custom-table th {
      background-color: var(--bg-secondary); color: var(--text-secondary); font-weight: var(--font-weight-medium);
      padding: var(--spacing-xl); border-bottom: var(--ui-border-width) solid var(--border-primary);
    }
    
    .col-sortable { cursor: pointer; transition: var(--transition-base); }
    .col-sortable:hover { background-color: var(--border-secondary); }
    .th-content { display: flex; align-items: center; gap: var(--spacing-sm); }
    .th-content i { color: var(--text-muted); font-size: var(--font-size-sm); }
    
    .th-filter-content { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .filter-select {
      font-size: var(--font-size-xs); font-family: var(--font-body); padding: var(--spacing-xs) var(--spacing-sm);
      border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-sm);
      background-color: var(--bg-primary); color: var(--text-primary); outline: none;
    }

    .table-row {
      border-bottom: var(--ui-border-width) solid var(--border-primary); transition: var(--transition-base); background-color: var(--bg-primary);
    }
    .table-row:hover { background-color: var(--bg-secondary); }
    .table-row td { padding: var(--spacing-lg) var(--spacing-xl); }

    /* Cells */
    .category-cell-info { display: flex; align-items: center; gap: var(--spacing-xl); }
    .category-thumbnail {
      width: 48px; height: 48px; border-radius: var(--ui-border-radius);
      background-color: var(--color-primary-bg); color: var(--color-primary);
      overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    }
    .category-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
    .no-img i { font-size: var(--font-size-xl); }

    .category-meta { display: flex; flex-direction: column; max-width: 250px; overflow: hidden; }
    .category-title-text { font-weight: var(--font-weight-semibold); color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .category-slug { font-size: var(--font-size-xs); color: var(--text-secondary); }

    .description-text {
      font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }

    .date-cell { color: var(--text-secondary); font-size: var(--font-size-sm); }

    .status-badge {
      display: inline-flex; align-items: center; padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--ui-border-radius-xl); font-size: var(--font-size-xs); font-weight: var(--font-weight-medium);
      border: var(--ui-border-width) solid transparent;
    }
    .status-active { background-color: var(--color-success-bg); color: var(--color-success); border-color: color-mix(in srgb, var(--color-success) 30%, transparent); }
    .status-inactive { background-color: var(--color-warning-bg); color: var(--color-warning); border-color: color-mix(in srgb, var(--color-warning) 30%, transparent); }

    .action-buttons { display: flex; align-items: center; justify-content: center; gap: var(--spacing-xs); }
    .btn-icon {
      width: 32px; height: 32px; border-radius: 50%; border: none; background: transparent;
      display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-fast);
    }
    .btn-icon-secondary { color: var(--text-secondary); }
    .btn-icon-secondary:hover { background-color: var(--border-primary); color: var(--text-primary); }
    .btn-icon-info { color: var(--color-primary); }
    .btn-icon-info:hover { background-color: var(--color-primary-bg); }
    .btn-icon-success { color: var(--color-success); }
    .btn-icon-success:hover { background-color: var(--color-success-bg); }
    .btn-icon-danger { color: var(--color-error); }
    .btn-icon-danger:hover { background-color: var(--color-error-bg); }

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

    /* Utilities */
    .mt-lg { margin-top: var(--spacing-xl); }
    .text-center { text-align: center; }
  `]
})
export class CategoryListComponent implements OnInit, OnDestroy {
  private categoryService = inject(CategoryService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  categories: any[] = [];
  filteredCategories: any[] = [];

  loading = false;

  stats = {
    total: 0,
    active: 0,
    inactive: 0
  };

  showFormDialog = false;
  showDetailDialog = false;
  selectedCategoryId: string | null = null;
  selectedCategory: any = null;
  parentCategoryId: string | null = null;
  dialogTitle = 'Add New Category';

  filters = {
    search: '',
    status: null as boolean | null
  };

  sortConfig = { field: '', order: 1 };

  private subscriptions: Subscription[] = [];
  private searchTimeout: any;

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  loadCategories(): void {
    this.loading = true;
    const params: any = {};
    if (this.filters.search) {
      params.search = this.filters.search;
    }
    if (this.filters.status !== null) {
      params.isActive = this.filters.status;
    }

    const sub = this.categoryService.getAll(params).subscribe({
      next: (res: any) => {
        // Safe extraction identical to course-list structure
        const payload = res?.data.data;
        const categoriesData = payload?.data || payload || [];

        this.categories = Array.isArray(categoriesData) ? categoriesData : [];
        this.filteredCategories = [...this.categories];

        this.calculateStats();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Failed to load categories', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load categories'
        });
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private calculateStats(): void {
    this.stats.total = this.categories.length;
    this.stats.active = this.categories.filter(c => c.isActive).length;
    this.stats.inactive = this.stats.total - this.stats.active;
  }

  // --- Filtering & Sorting ---

  onSearchChange(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: null
    };
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.categories];

    // Local filter by search term
    if (this.filters.search) {
      const term = this.filters.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term) ||
        c.slug?.toLowerCase().includes(term)
      );
    }

    // Local filter by status if not already handled by API
    if (this.filters.status !== null) {
      filtered = filtered.filter(c => c.isActive === this.filters.status);
    }

    this.filteredCategories = filtered;
  }

  sortBy(field: string) {
    this.sortConfig.order = this.sortConfig.field === field ? this.sortConfig.order * -1 : 1;
    this.sortConfig.field = field;

    this.filteredCategories.sort((a: any, b: any) => {
      const valA = a[field];
      const valB = b[field];
      if (valA < valB) return -1 * this.sortConfig.order;
      if (valA > valB) return 1 * this.sortConfig.order;
      return 0;
    });
  }

  // --- Dialog & Actions ---

  openNewCategoryDialog(): void {
    this.selectedCategoryId = null;
    this.parentCategoryId = null;
    this.dialogTitle = 'Add New Category';
    this.showFormDialog = true;
  }

  addSubCategory(parentCategory: any): void {
    this.selectedCategoryId = null;
    this.parentCategoryId = parentCategory._id;
    this.dialogTitle = `Add Subcategory under ${parentCategory.name}`;
    this.showFormDialog = true;
  }

  viewCategory(category: any): void {
    this.selectedCategory = category;
    this.showDetailDialog = true;
  }

  editCategory(category: any): void {
    this.selectedCategoryId = category._id;
    this.parentCategoryId = category.parentCategory;
    this.dialogTitle = 'Edit Category';
    this.showFormDialog = true;
  }

  deleteCategory(category: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${category.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const sub = this.categoryService.delete(category._id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Category deleted successfully'
            });
            this.loadCategories();
          },
          error: (error: any) => {
            console.error('Failed to delete category', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.message || 'Failed to delete category'
            });
          }
        });
        this.subscriptions.push(sub);
      }
    });
  }

  onCategorySaved(category: any): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `Category ${this.selectedCategoryId ? 'updated' : 'created'} successfully`
    });
    this.closeDialog();
    this.loadCategories();
  }

  closeDialog(): void {
    this.showFormDialog = false;
    this.selectedCategoryId = null;
    this.parentCategoryId = null;
  }

  editFromDetail(): void {
    this.closeDetailDialog();
    setTimeout(() => {
      this.dialogTitle = 'Edit Category';
      this.showFormDialog = true;
    });
  }

  closeDetailDialog(): void {
    this.showDetailDialog = false;
    this.selectedCategory = null;
  }
}

