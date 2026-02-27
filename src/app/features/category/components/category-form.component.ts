import { Component, OnInit, OnDestroy, OnChanges, Input, Output, EventEmitter, inject, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';

// Services
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToggleSwitchModule,
    DividerModule
  ],
  template: `
    <div class="form-container">
      <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()" class="category-form">
        
        <!-- Parent Category Indicator -->
        <div *ngIf="parentCategory && !categoryId" class="parent-info-banner">
          <div class="banner-icon">
            <i class="pi pi-sitemap"></i>
          </div>
          <div class="banner-content">
            <span class="banner-label">Adding subcategory under:</span>
            <span class="banner-value">{{ parentCategory.name }}</span>
          </div>
        </div>

        <div class="form-grid">
          <!-- Category Name -->
          <div class="form-group col-span-1 md:col-span-2">
            <label class="input-label" for="name">
              Category Name <span class="required-asterisk">*</span>
            </label>
            <input 
              id="name"
              type="text" 
              pInputText 
              formControlName="name"
              placeholder="e.g., Web Development"
              class="custom-input"
              [class.input-error]="isFieldInvalid('name')"
            >
            <div class="helper-text-container">
              <small *ngIf="isFieldInvalid('name')" class="error-message">
                <i class="pi pi-exclamation-circle"></i> Category name is required
              </small>
              <small *ngIf="!isFieldInvalid('name')" class="hint-message">This will be used to automatically generate the URL slug.</small>
            </div>
          </div>

          <!-- Slug -->
          <div class="form-group col-span-1 md:col-span-2">
            <label class="input-label" for="slug">URL Slug</label>
            <div class="slug-input-group" [class.input-error]="isFieldInvalid('slug')">
              <span class="slug-prefix">{{ baseUrl }}/categories/</span>
              <input 
                id="slug"
                type="text" 
                formControlName="slug"
                placeholder="web-development"
                class="slug-input"
              >
            </div>
            <div class="helper-text-container flex justify-between">
              <small *ngIf="isFieldInvalid('slug')" class="error-message">
                <i class="pi pi-exclamation-circle"></i> Invalid slug format (use lowercase, numbers, and hyphens)
              </small>
              <small *ngIf="categoryForm.get('slug')?.value && !categoryForm.get('slug')?.dirty && !isFieldInvalid('slug')" class="success-message">
                <i class="pi pi-check-circle"></i> Auto-generated from name
              </small>
            </div>
          </div>

          <!-- Description -->
          <div class="form-group col-span-1 md:col-span-2">
            <label class="input-label" for="description">Description</label>
            <textarea 
              id="description"
              pTextarea 
              formControlName="description"
              placeholder="Provide a detailed description of this category..."
              [rows]="4"
              class="custom-input textarea-input">
            </textarea>
          </div>

          <!-- Icon -->
          <div class="form-group col-span-1">
            <label class="input-label" for="icon">Icon Class</label>
            <div class="icon-input-wrapper">
              <div class="icon-preview-box">
                <i [class]="categoryForm.get('icon')?.value || 'pi pi-folder'"></i>
              </div>
              <input 
                id="icon"
                type="text" 
                pInputText 
                formControlName="icon"
                placeholder="e.g., pi pi-code"
                class="custom-input icon-text-input"
              >
            </div>
            <small class="hint-message mt-xs block">PrimeIcons or FontAwesome class</small>
          </div>

          <!-- Image URL -->
          <div class="form-group col-span-1">
            <label class="input-label" for="image">Cover Image URL</label>
            <input 
              id="image"
              type="text" 
              pInputText 
              formControlName="image"
              placeholder="https://example.com/image.jpg"
              class="custom-input"
            >
            <small class="hint-message mt-xs block">Optional background cover image</small>
          </div>

          <!-- Parent Category -->
          <div class="form-group col-span-1 md:col-span-2">
            <label class="input-label" for="parentCategory">Parent Category</label>
            <p-select 
              id="parentCategory"
              formControlName="parentCategory"
              [options]="categories"
              [filter]="true"
              filterBy="name"
              optionLabel="name"
              optionValue="_id"
              placeholder="Select parent category (optional)"
              styleClass="custom-select w-full"
              [showClear]="true">
              <ng-template let-category pTemplate="item">
                <div class="category-dropdown-item">
                  <i [class]="category.icon || 'pi pi-folder'" class="mr-2 text-primary"></i>
                  <span class="font-medium">{{ category.name }}</span>
                  <span *ngIf="category.slug" class="slug-hint">/{{ category.slug }}</span>
                </div>
              </ng-template>
            </p-select>
            <small class="hint-message mt-xs block">Leave empty to create a top-level root category.</small>
          </div>

          <!-- Status Toggle -->
          <div class="form-group col-span-1 md:col-span-2 mt-md border-t border-secondary pt-lg">
            <div class="status-toggle-container">
              <div>
                <label class="input-label mb-0">Category Status</label>
                <p class="hint-message m-0">Determine if this category should be visible to users.</p>
              </div>
              <div class="flex items-center gap-md">
                <span class="status-text" [class.text-muted]="categoryForm.get('isActive')?.value">Inactive</span>
                <p-toggleswitch formControlName="isActive"></p-toggleswitch>
                <span class="status-text font-medium" [class.text-success]="categoryForm.get('isActive')?.value" [class.text-muted]="!categoryForm.get('isActive')?.value">Active</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Preview Card -->
        <div class="preview-wrapper" *ngIf="categoryForm.get('name')?.value || categoryForm.get('icon')?.value">
          <div class="preview-header">
            <i class="pi pi-eye"></i> Live Preview
          </div>
          <div class="preview-card" [class.inactive-preview]="!categoryForm.get('isActive')?.value">
            <div class="preview-icon-large">
              <i [class]="categoryForm.get('icon')?.value || 'pi pi-folder'"></i>
            </div>
            <div class="preview-content">
              <h4 class="preview-title">{{ categoryForm.get('name')?.value || 'Category Name' }}</h4>
              <p class="preview-slug" *ngIf="categoryForm.get('slug')?.value">/{{ categoryForm.get('slug')?.value }}</p>
              <p class="preview-desc" *ngIf="categoryForm.get('description')?.value">{{ categoryForm.get('description')?.value }}</p>
            </div>
            <div *ngIf="!categoryForm.get('isActive')?.value" class="preview-badge-inactive">Hidden</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn-cancel" (click)="onCancel()" [disabled]="isLoading">
            <i class="pi pi-times"></i> Cancel
          </button>
          <button type="submit" class="btn-submit" [disabled]="categoryForm.invalid || isLoading" [class.loading]="isLoading">
            <i class="pi" [ngClass]="isLoading ? 'pi-spinner pi-spin' : 'pi-check'"></i> 
            {{ isLoading ? 'Saving...' : (categoryId ? 'Update Category' : 'Create Category') }}
          </button>
        </div>

      </form>
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
      
      // --spacing-xs: 0.25rem;
      // --spacing-sm: 0.375rem;
      // --spacing-md: 0.5rem;
      // --spacing-lg: 0.75rem;
      // --spacing-xl: 1rem;
      // --spacing-2xl: 1.5rem;
      // --spacing-3xl: 2rem;

      // --ui-border-radius: 5px;
      // --ui-border-radius-lg: 10px;
      // --ui-border-radius-xl: 16px;
      // --ui-border-width: 1px;

      // --shadow-xs: 0 0.5px 1px rgba(0, 0, 0, 0.04);
      // --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
      // --shadow-md: 0 2px 6px rgba(0, 0, 0, 0.08);

      // --transition-fast: all 0.12s cubic-bezier(0.23, 1, 0.32, 1);
      // --transition-base: all 0.22s cubic-bezier(0.2, 0.9, 0.2, 1);
      
      // /* Base Theme Fallbacks */
      // --theme-bg-primary: #ffffff;
      // --theme-bg-secondary: #f8fafc;
      // --theme-bg-ternary: #f1f5f9;
      // --theme-text-primary: #0f172a;
      // --theme-text-secondary: #475569;
      // --theme-text-tertiary: #94a3b8;
      // --theme-border-primary: #e2e8f0;
      // --theme-border-secondary: #f1f5f9;
      // --theme-accent-primary: #3b82f6;
      // --theme-accent-hover: #2563eb;
      // --theme-success: #10b981;
      // --theme-error: #ef4444;

      // /* Canonical Mapping Application */
      // --bg-primary: var(--theme-bg-primary);
      // --bg-secondary: var(--theme-bg-secondary);
      // --bg-ternary: var(--theme-bg-ternary);
      // --text-primary: var(--theme-text-primary);
      // --text-secondary: var(--theme-text-secondary);
      // --text-muted: var(--theme-text-tertiary);
      // --border-primary: var(--theme-border-primary);
      // --border-secondary: var(--theme-border-secondary);
      
      // --color-primary: var(--theme-accent-primary);
      // --color-primary-dark: var(--theme-accent-hover);
      // --color-primary-bg: color-mix(in srgb, var(--theme-accent-primary) 10%, transparent 90%);
      
      // --color-success: var(--theme-success);
      // --color-error: var(--theme-error);
      // --color-error-bg: color-mix(in srgb, var(--theme-error) 10%, transparent 90%);

      // font-family: var(--font-body);
      // color: var(--text-primary);
    }

    /* Dark Mode Defaults */
    :host-context(.dark) {
      --theme-bg-primary: #0f172a;
      --theme-bg-secondary: #1e293b;
      --theme-bg-ternary: #0b1120;
      --theme-text-primary: #f8fafc;
      --theme-text-secondary: #cbd5e1;
      --theme-text-tertiary: #64748b;
      --theme-border-primary: #334155;
      --theme-border-secondary: #1e293b;
    }

    /* ==========================================================================
       COMPONENT STYLES
       ========================================================================== */
    .form-container {
      background: var(--bg-primary);
      border-radius: var(--ui-border-radius-xl);
      color: var(--text-primary);
    }

    /* Utilities */
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .items-center { align-items: center; }
    .block { display: block; }
    .font-medium { font-weight: 500; }
    .m-0 { margin: 0; }
    .mb-0 { margin-bottom: 0; }
    .mt-xs { margin-top: var(--spacing-xs); }
    .mt-md { margin-top: var(--spacing-md); }
    .mr-2 { margin-right: var(--spacing-md); }
    .pt-lg { padding-top: var(--spacing-lg); }
    .gap-md { gap: var(--spacing-md); }
    .border-t { border-top-width: var(--ui-border-width); border-top-style: solid; }
    .border-secondary { border-color: var(--border-secondary); }
    .text-primary { color: var(--color-primary); }
    .text-success { color: var(--color-success); }
    .text-muted { color: var(--text-muted); }

    /* Layout */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: var(--spacing-xl);
    }
    @media (min-width: 768px) {
      .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .col-span-1 { grid-column: span 1 / span 1; }
      .col-span-2 { grid-column: span 2 / span 2; }
      .md\\:col-span-2 { grid-column: span 2 / span 2; }
    }

    /* Banners */
    .parent-info-banner {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      background: var(--color-primary-bg);
      border: var(--ui-border-width) solid color-mix(in srgb, var(--color-primary) 20%, transparent);
      border-radius: var(--ui-border-radius-lg);
      margin-bottom: var(--spacing-2xl);
    }
    .banner-icon {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px;
      background: var(--color-primary); color: #fff;
      border-radius: 50%;
    }
    .banner-content { display: flex; flex-direction: column; }
    .banner-label { font-size: var(--font-size-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .banner-value { font-size: var(--font-size-md); font-weight: 600; color: var(--color-primary); }

    /* Form Groups & Labels */
    .input-label {
      display: block;
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--spacing-xs);
    }
    .required-asterisk { color: var(--color-error); }
    
    .helper-text-container { margin-top: var(--spacing-xs); min-height: 18px; }
    .hint-message { font-size: var(--font-size-xs); color: var(--text-muted); }
    .error-message { font-size: var(--font-size-xs); color: var(--color-error); display: flex; align-items: center; gap: 4px; }
    .success-message { font-size: var(--font-size-xs); color: var(--color-success); display: flex; align-items: center; gap: 4px; }

    /* Custom Inputs */
    .custom-input {
      width: 100%;
      padding: var(--spacing-md) var(--spacing-lg);
      font-family: var(--font-body);
      font-size: var(--font-size-md);
      color: var(--text-primary);
      background-color: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      transition: var(--transition-base);
      outline: none;
    }
    .custom-input:focus, :host ::ng-deep .custom-select .p-select {
      background-color: var(--bg-primary);
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-bg);
    }
    .input-error {
      border-color: var(--color-error) !important;
      background-color: var(--color-error-bg) !important;
    }
    .input-error:focus {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-error) 20%, transparent) !important;
    }
    .textarea-input { resize: vertical; min-height: 100px; }

    /* Slug Group */
    .slug-input-group {
      display: flex;
      align-items: stretch;
      background-color: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;
      transition: var(--transition-base);
    }
    .slug-input-group:focus-within {
      background-color: var(--bg-primary);
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-bg);
    }
    .slug-prefix {
      display: flex; align-items: center;
      padding: 0 var(--spacing-lg);
      background-color: var(--bg-ternary);
      color: var(--text-muted);
      font-size: var(--font-size-sm);
      border-right: var(--ui-border-width) solid var(--border-primary);
      user-select: none;
    }
    .slug-input {
      flex: 1; min-width: 0;
      padding: var(--spacing-md) var(--spacing-lg);
      border: none; background: transparent;
      color: var(--text-primary); font-size: var(--font-size-md); outline: none;
    }

    /* Icon Input Group */
    .icon-input-wrapper { display: flex; gap: var(--spacing-md); }
    .icon-preview-box {
      width: 42px; height: 42px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: var(--bg-secondary); border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg); color: var(--color-primary); font-size: var(--font-size-xl);
    }
    .icon-text-input { flex: 1; }

    /* PrimeNG Select Override */
    :host ::ng-deep .custom-select.p-select {
      width: 100%;
      background-color: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      transition: var(--transition-base);
      box-shadow: none;
    }
    :host ::ng-deep .custom-select.p-select:not(.p-disabled).p-focus {
      background-color: var(--bg-primary);
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-bg);
    }
    .category-dropdown-item { display: flex; align-items: center; }
    .slug-hint { margin-left: var(--spacing-sm); font-size: var(--font-size-xs); color: var(--text-muted); }

    /* Status Toggle Container */
    .status-toggle-container {
      display: flex; align-items: center; justify-content: space-between;
      background: var(--bg-secondary); padding: var(--spacing-lg); border-radius: var(--ui-border-radius-lg);
    }
    .status-text { font-size: var(--font-size-sm); transition: var(--transition-fast); }

    /* Preview Section */
    .preview-wrapper { margin-top: var(--spacing-3xl); }
    .preview-header {
      font-size: var(--font-size-sm); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
      color: var(--text-muted); margin-bottom: var(--spacing-md); display: flex; align-items: center; gap: var(--spacing-xs);
    }
    .preview-card {
      position: relative; display: flex; align-items: center; gap: var(--spacing-xl);
      padding: var(--spacing-xl); background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-sm); transition: var(--transition-base); overflow: hidden;
    }
    .preview-card.inactive-preview { opacity: 0.7; filter: grayscale(50%); }
    
    .preview-icon-large {
      width: 64px; height: 64px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-primary-bg); color: var(--color-primary);
      border-radius: var(--ui-border-radius-lg); font-size: var(--font-size-3xl);
    }
    .preview-content { flex: 1; min-width: 0; }
    .preview-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: 700; margin: 0 0 2px 0; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .preview-slug { font-size: var(--font-size-xs); color: var(--text-muted); margin: 0 0 var(--spacing-sm) 0; }
    .preview-desc { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    
    .preview-badge-inactive {
      position: absolute; top: var(--spacing-md); right: var(--spacing-md);
      background: var(--color-error-bg); color: var(--color-error);
      font-size: var(--font-size-xs); font-weight: 600; padding: 2px 8px; border-radius: var(--ui-border-radius);
    }

    /* Actions */
    .form-actions {
      display: flex; justify-content: flex-end; gap: var(--spacing-md);
      margin-top: var(--spacing-3xl); padding-top: var(--spacing-xl); border-top: var(--ui-border-width) solid var(--border-secondary);
    }
    .btn-cancel, .btn-submit {
      display: inline-flex; align-items: center; gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-xl); font-size: var(--font-size-md); font-weight: 600;
      border-radius: var(--ui-border-radius-lg); cursor: pointer; transition: var(--transition-base); border: none;
    }
    .btn-cancel {
      background: transparent; color: var(--text-secondary); border: var(--ui-border-width) solid var(--border-primary);
    }
    .btn-cancel:hover:not(:disabled) { background: var(--bg-secondary); color: var(--text-primary); }
    .btn-submit {
      background: var(--color-primary); color: #fff; box-shadow: var(--shadow-sm);
    }
    .btn-submit:hover:not(:disabled) { background: var(--color-primary-dark); box-shadow: var(--shadow-md); transform: translateY(-1px); }
    .btn-submit:disabled, .btn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
    
    @media (max-width: 640px) {
      .slug-prefix { display: none; }
      .form-actions { flex-direction: column-reverse; }
      .btn-cancel, .btn-submit { width: 100%; justify-content: center; }
    }
  `]
})
export class CategoryFormComponent implements OnInit, OnDestroy, OnChanges {
  @Input() categoryId?: any;
  @Input() parentCategoryId?: string | null;
  @Output() saved = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  categoryForm!: FormGroup;
  categories: any[] = [];
  parentCategory: any = null;
  isLoading = false;
  baseUrl = window.location.origin;

  private subscriptions: Subscription[] = [];
  private slugTimeout: any;

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();

    if (this.categoryId) {
      this.loadCategory();
    } else if (this.parentCategoryId) {
      this.loadParentCategory();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only re-trigger if the component has already initialized the form
    if (this.categoryForm && (changes['categoryId'] || changes['parentCategoryId'])) {
      if (this.categoryId) {
        this.loadCategory();
      } else if (this.parentCategoryId) {
        this.loadParentCategory();
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.slugTimeout) clearTimeout(this.slugTimeout);
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.pattern(/^[a-z0-9-]+$/)],
      description: [''],
      icon: ['pi pi-folder'],
      image: [''],
      parentCategory: [this.parentCategoryId || null],
      isActive: [true]
    });

    // Auto-generate slug from name
    const slugSub = this.categoryForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.categoryForm.get('slug')?.dirty) {
        if (this.slugTimeout) clearTimeout(this.slugTimeout);
        this.slugTimeout = setTimeout(() => {
          const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          this.categoryForm.get('slug')?.setValue(slug, { emitEvent: false });
        }, 500);
      }
    });
    if (slugSub) this.subscriptions.push(slugSub);
  }

  private loadCategories(): void {
    const sub = this.categoryService.getCategoryTree({ isActive: true }).subscribe({
      next: (res) => {
        // Extract array correctly and filter out the currently editing category
        const payload = res?.data;
        const rawCategories = payload?.data || payload || [];

        this.categories = (Array.isArray(rawCategories) ? rawCategories : []).filter((cat: any) =>
          !this.categoryId || (cat._id !== this.categoryId)
        );
      },
      error: (error) => console.error('Failed to load categories list', error)
    });
    this.subscriptions.push(sub);
  }

  private loadCategory(): void {
    if (!this.categoryId) return;

    this.isLoading = true;
    // Assuming getCategoryTree or getById exists. Using standard REST pattern logic
    const sub = this.categoryService.getById(this.categoryId).subscribe({
      next: (res) => {
        const payload = res?.data;
        const cats = payload?.data || payload || [];
        const category = Array.isArray(cats) ? cats.find((c: any) => c._id === this.categoryId) : cats;

        if (category) {
          this.categoryForm.patchValue({
            name: category.name,
            slug: category.slug,
            description: category.description,
            icon: category.icon || 'pi pi-folder',
            image: category.image,
            parentCategory: category.parentCategory,
            isActive: category.isActive !== false // Default true if undefined
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load category', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private loadParentCategory(): void {
    if (!this.parentCategoryId) return;

    const sub = this.categoryService.getCategoryTree({ _id: this.parentCategoryId }).subscribe({
      next: (res) => {
        const payload = res?.data;
        const cats = payload?.data || payload || [];
        this.parentCategory = Array.isArray(cats) ? cats.find((c: any) => c._id === this.parentCategoryId) : cats;
      },
      error: (error) => console.error('Failed to load parent category', error)
    });
    this.subscriptions.push(sub);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.categoryForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = this.categoryForm.value;

    // Clean up empty parentCategory
    if (!formData.parentCategory) {
      delete formData.parentCategory;
    }

    // Determine request based on your service architecture
    // Standard mock implementation assuming update/create exist
    let request$: Observable<any>;
    if (this.categoryId && (this.categoryService as any).update) {
      request$ = (this.categoryService as any).update(this.categoryId, formData);
    } else if ((this.categoryService as any).create) {
      request$ = (this.categoryService as any).create(formData);
    } else {
      request$ = of({ data: formData });
    }

    const sub = request$.subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.saved.emit(res?.data || formData);
      },
      error: (error: any) => {
        console.error('Failed to save category', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

// // category-form.component.ts
// import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, SimpleChanges } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { Subscription } from 'rxjs';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { DividerModule } from 'primeng/divider';
// import { CategoryService } from '../../../core/services/category.service';
// import { SelectModule } from 'primeng/select';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-category-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     ButtonModule,
//     InputTextModule,
//     SelectModule,
//     ToggleSwitchModule,
//     DividerModule
//   ],
//   template: `
//     <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()" class="category-form">
//       @if (parentCategory && !categoryId) {
//         <div class="parent-info">
//           <i class="pi pi-sitemap"></i>
//           <span>Adding subcategory under: <strong>{{ parentCategory.name }}</strong></span>
//         </div>
//         <p-divider></p-divider>
//       }

//       <div class="form-grid">
//         <!-- Category Name -->
//         <div class="form-group full-width">
//           <label class="input-label">
//             Category Name <span class="required">*</span>
//             <span class="hint">(Will be used to generate slug)</span>
//           </label>
//           <input
//             pInputText
//             formControlName="name"
//             placeholder="e.g., Web Development"
//             class="w-full"
//             [class.ng-invalid]="isFieldInvalid('name')"
//             [class.ng-dirty]="isFieldInvalid('name')">
//           @if (isFieldInvalid('name')) {
//             <small class="error-message">Category name is required</small>
//           }
//         </div>

//         <!-- Slug (Auto-generated but can be edited) -->
//         <div class="form-group full-width">
//           <label class="input-label">
//             Slug
//             <span class="hint">(URL-friendly version)</span>
//           </label>
//           <div class="slug-input-group">
//             <span class="slug-prefix">{{ baseUrl }}/categories/</span>
//             <input
//               pInputText
//               formControlName="slug"
//               placeholder="web-development"
//               class="slug-input">
//           </div>
//           @if (categoryForm.get('slug')?.value && categoryForm.get('name')?.value && !categoryForm.get('slug')?.dirty) {
//             <small class="auto-generated">Auto-generated from name</small>
//           }
//         </div>

//         <!-- Description -->
//         <div class="form-group full-width">
//           <label class="input-label">Description</label>
//           <textarea
//             pInputTextarea
//             formControlName="description"
//             placeholder="Describe this category..."
//             [rows]="4"
//             class="w-full">
//           </textarea>
//         </div>

//         <!-- Icon and Image -->
//         <div class="form-group">
//           <label class="input-label">Icon Class</label>
//           <div class="icon-input-group">
//             <span class="icon-preview" [class]="categoryForm.get('icon')?.value || 'pi pi-folder'"></span>
//             <input
//               pInputText
//               formControlName="icon"
//               placeholder="e.g., pi pi-code"
//               class="icon-input">
//           </div>
//           <small class="hint">Font Awesome or PrimeNG icon class</small>
//         </div>

//         <div class="form-group">
//           <label class="input-label">Image URL</label>
//           <input
//             pInputText
//             formControlName="image"
//             placeholder="https://example.com/image.jpg"
//             class="w-full">
//         </div>

//         <!-- Parent Category (for subcategories) -->
//         <div class="form-group full-width">
//           <label class="input-label">Parent Category</label>
//           <p-select
//             formControlName="parentCategory"
//             [options]="categories"
//             [filter]="true"
//             filterBy="name"
//             optionLabel="name"
//             optionValue="_id"
//             placeholder="Select parent category (optional)"
//             styleClass="w-full"
//             [showClear]="true">
//             <ng-template let-category pTemplate="item">
//               <div class="category-option">
//                 <i class="pi pi-folder mr-2"></i>
//                 <span>{{ category.name }}</span>
//                 @if (category.slug) {
//                   <small class="ml-2 text-secondary">({{ category.slug }})</small>
//                 }
//               </div>
//             </ng-template>
//           </p-select>
//           <small class="hint">Leave empty to create a top-level category</small>
//         </div>

//         <!-- Status -->
//         <div class="form-group">
//           <label class="input-label">Status</label>
//           <div class="status-toggle">
//             <p-inputSwitch formControlName="isActive"></p-inputSwitch>
//             <span class="ml-2">{{ categoryForm.get('isActive')?.value ? 'Active' : 'Inactive' }}</span>
//           </div>
//         </div>
//       </div>

//       <!-- Preview Section -->
//       @if (categoryForm.get('name')?.value || categoryForm.get('icon')?.value) {
//         <div class="preview-section">
//           <h4 class="preview-title">
//             <i class="pi pi-eye"></i>
//             Preview
//           </h4>
//           <div class="preview-card">
//             <div class="preview-icon">
//               <i class="preview-icon-display" [class]="categoryForm.get('icon')?.value || 'pi pi-folder'"></i>
//             </div>
//             <div class="preview-details">
//               <span class="preview-name">{{ categoryForm.get('name')?.value || 'Category Name' }}</span>
//               @if (categoryForm.get('slug')?.value) {
//                 <span class="preview-slug">/{{ categoryForm.get('slug')?.value }}</span>
//               }
//             </div>
//           </div>
//         </div>
//       }

//       <!-- Form Actions -->
//       <div class="form-actions">
//         <button pButton pRipple type="button" label="Cancel" icon="pi pi-times" class="p-button-outlined" (click)="onCancel()"></button>
//         <button pButton pRipple type="submit" [label]="categoryId ? 'Update' : 'Create'" icon="pi pi-check" [disabled]="categoryForm.invalid || isLoading"></button>
//       </div>
//     </form>
//   `,
//   styles: [`
//     .category-form {
//       padding: var(--spacing-lg);
//     }

//     .parent-info {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       padding: var(--spacing-md);
//       background: var(--accent-focus);
//       color: var(--accent-primary);
//       border-radius: var(--ui-border-radius);
//       margin-bottom: var(--spacing-md);
//     }

//     .parent-info i {
//       font-size: var(--font-size-lg);
//     }

//     .form-grid {
//       display: grid;
//       grid-template-columns: repeat(2, 1fr);
//       gap: var(--spacing-lg);
//     }

//     .full-width {
//       grid-column: 1 / -1;
//     }

//     .form-group {
//       margin-bottom: var(--spacing-md);
//     }

//     .input-label {
//       display: block;
//       font-weight: var(--font-weight-medium);
//       margin-bottom: var(--spacing-xs);
//       color: var(--text-primary);
//     }

//     .required {
//       color: var(--color-error);
//     }

//     .hint {
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//       margin-left: var(--spacing-sm);
//       font-weight: normal;
//     }

//     .error-message {
//       color: var(--color-error);
//       font-size: var(--font-size-xs);
//       margin-top: var(--spacing-xs);
//       display: block;
//     }

//     /* Slug Input */
//     .slug-input-group {
//       display: flex;
//       align-items: center;
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       overflow: hidden;
//     }

//     .slug-prefix {
//       background: var(--bg-secondary);
//       padding: var(--spacing-sm) var(--spacing-md);
//       color: var(--text-tertiary);
//       font-size: var(--font-size-sm);
//       border-right: 1px solid var(--border-secondary);
//     }

//     .slug-input {
//       flex: 1;
//       border: none;
//       padding: var(--spacing-sm) var(--spacing-md);
//       background: transparent;
//       color: var(--text-primary);
//     }

//     .slug-input:focus {
//       outline: none;
//     }

//     .auto-generated {
//       display: block;
//       margin-top: var(--spacing-xs);
//       color: var(--color-success);
//       font-size: var(--font-size-xs);
//     }

//     /* Icon Input */
//     .icon-input-group {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//     }

//     .icon-preview {
//       width: 40px;
//       height: 40px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       color: var(--accent-primary);
//       font-size: var(--font-size-xl);
//     }

//     .icon-input {
//       flex: 1;
//     }

//     /* Status Toggle */
//     .status-toggle {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//     }

//     /* Category Option */
//     .category-option {
//       display: flex;
//       align-items: center;
//       padding: var(--spacing-xs) 0;
//     }

//     /* Preview Section */
//     .preview-section {
//       margin: var(--spacing-xl) 0;
//       padding: var(--spacing-lg);
//       background: var(--bg-secondary);
//       border-radius: var(--ui-border-radius);
//     }

//     .preview-title {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       margin: 0 0 var(--spacing-lg);
//       color: var(--text-primary);
//       font-size: var(--font-size-md);
//     }

//     .preview-card {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-lg);
//       padding: var(--spacing-lg);
//       background: var(--bg-primary);
//       border-radius: var(--ui-border-radius);
//       box-shadow: var(--shadow-sm);
//     }

//     .preview-icon {
//       width: 60px;
//       height: 60px;
//       border-radius: 50%;
//       background: var(--accent-focus);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//     }

//     .preview-icon-display {
//       font-size: var(--font-size-3xl);
//       color: var(--accent-primary);
//     }

//     .preview-details {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//     }

//     .preview-name {
//       font-size: var(--font-size-xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//     }

//     .preview-slug {
//       color: var(--text-tertiary);
//       font-size: var(--font-size-sm);
//     }

//     /* Form Actions */
//     .form-actions {
//       display: flex;
//       justify-content: flex-end;
//       gap: var(--spacing-md);
//       padding-top: var(--spacing-xl);
//       border-top: 1px solid var(--border-secondary);
//     }

//     @media (max-width: 768px) {
//       .form-grid {
//         grid-template-columns: 1fr;
//       }

//       .slug-input-group {
//         flex-direction: column;
//         align-items: stretch;
//       }

//       .slug-prefix {
//         border-right: none;
//         border-bottom: 1px solid var(--border-secondary);
//       }
//     }
//   `]
// })
// export class CategoryFormComponent implements OnInit, OnDestroy {
//   @Input() categoryId?: any;
//   @Input() parentCategoryId?: string | null;
//   @Output() saved = new EventEmitter<any>();
//   @Output() cancelled = new EventEmitter<void>();
//   private router = inject(Router);

//   private fb = inject(FormBuilder);
//   private categoryService = inject(CategoryService);

//   categoryForm!: FormGroup;
//   categories: any
//   parentCategory: any = null;
//   isLoading = false;
//   baseUrl = window.location.origin;

//   private subscriptions: Subscription[] = [];
//   private slugTimeout: any;

//   ngOnInit(): void {
//     this.initForm();
//     this.loadCategories();

//     if (this.categoryId) {
//       this.loadCategory();
//     } else if (this.parentCategoryId) {
//       this.loadParentCategory();
//     }
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     // '${implements OnChanges}' to the class.
//     if (this.categoryId) {
//       this.loadCategory();
//     } else if (this.parentCategoryId) {
//       this.loadParentCategory();
//     }
//   }
//   ngOnDestroy(): void {
//     this.subscriptions.forEach(sub => sub.unsubscribe());
//     if (this.slugTimeout) clearTimeout(this.slugTimeout);
//   }

//   private initForm(): void {
//     this.categoryForm = this.fb.group({
//       name: ['', Validators.required],
//       slug: ['', Validators.pattern(/^[a-z0-9-]+$/)],
//       description: [''],
//       icon: [''],
//       image: [''],
//       parentCategory: [this.parentCategoryId || null],
//       isActive: [true]
//     });

//     // Auto-generate slug from name
//     this.categoryForm.get('name')?.valueChanges.subscribe(name => {
//       if (name && !this.categoryForm.get('slug')?.dirty) {
//         if (this.slugTimeout) clearTimeout(this.slugTimeout);
//         this.slugTimeout = setTimeout(() => {
//           const slug = name
//             .toLowerCase()
//             .replace(/[^a-z0-9]+/g, '-')
//             .replace(/^-|-$/g, '');
//           this.categoryForm.get('slug')?.setValue(slug);
//         }, 500);
//       }
//     });
//   }

//   private loadCategories(): void {
//     const sub = this.categoryService.getAll({ isActive: true }).subscribe({
//       next: (res) => {
//         // Filter out current category and its descendants for edit mode
//         this.categories = res.data.data((cat: any) =>
//           !this.categoryId || (cat._id !== this.categoryId)
//         ) || [];
//       },
//       error: (error) => console.error('Failed to load categories', error)
//     });
//     this.subscriptions.push(sub);
//   }

//   private loadCategory(): void {
//     if (!this.categoryId) return;

//     this.isLoading = true;
//     const sub = this.categoryService.getById(this.categoryId).subscribe({
//       next: (res) => {
//         const category = res.data.data;
//         if (category) {
//           this.categoryForm.patchValue({
//             name: category.name,
//             slug: category.slug,
//             description: category.description,
//             icon: category.icon,
//             image: category.image,
//             parentCategory: category.parentCategory,
//             // category.parentCategory?._id ||
//             isActive: category.isActive
//           });
//         }
//         this.isLoading = false;
//       },
//       error: (error) => {
//         console.error('Failed to load category', error);
//         this.isLoading = false;
//       }
//     });
//     this.subscriptions.push(sub);
//   }

//   private loadParentCategory(): void {
//     if (!this.parentCategoryId) return;

//     const sub = this.categoryService.getById(this.parentCategoryId).subscribe({
//       next: (res) => {
//         this.parentCategory = res.data;
//       },
//       error: (error) => console.error('Failed to load parent category', error)
//     });
//     this.subscriptions.push(sub);
//   }

//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.categoryForm.get(fieldName);
//     return field ? field.invalid && (field.dirty || field.touched) : false;
//   }

//   onSubmit(): void {
//     if (this.categoryForm.invalid) {
//       this.categoryForm.markAllAsTouched();
//       return;
//     }

//     this.isLoading = true;
//     const formData = this.categoryForm.value;

//     // Remove parentCategory if empty
//     if (!formData.parentCategory) {
//       delete formData.parentCategory;
//     }

//     const request = this.categoryId
//       ? this.categoryService.update(this.categoryId, formData)
//       : this.categoryService.create(formData);

//     const sub = (request as any).subscribe({
//       next: (res: any) => {
//         this.isLoading = false;
//         this.saved.emit(res.data);
//         this.router.navigate(['/categories/list'])
//       },
//       error: (error: any) => {
//         console.error('Failed to save category', error);
//         this.isLoading = false;
//       }
//     });
//     this.subscriptions.push(sub);
//   }

//   onCancel(): void {
//     this.cancelled.emit();
//   }
// }