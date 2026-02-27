// category-form.component.ts
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { CategoryService } from '../../../core/services/category.service';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule,
    DividerModule
  ],
  template: `
    <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()" class="category-form">
      @if (parentCategory && !categoryId) {
        <div class="parent-info">
          <i class="pi pi-sitemap"></i>
          <span>Adding subcategory under: <strong>{{ parentCategory.name }}</strong></span>
        </div>
        <p-divider></p-divider>
      }

      <div class="form-grid">
        <!-- Category Name -->
        <div class="form-group full-width">
          <label class="input-label">
            Category Name <span class="required">*</span>
            <span class="hint">(Will be used to generate slug)</span>
          </label>
          <input 
            pInputText 
            formControlName="name"
            placeholder="e.g., Web Development"
            class="w-full"
            [class.ng-invalid]="isFieldInvalid('name')"
            [class.ng-dirty]="isFieldInvalid('name')">
          @if (isFieldInvalid('name')) {
            <small class="error-message">Category name is required</small>
          }
        </div>

        <!-- Slug (Auto-generated but can be edited) -->
        <div class="form-group full-width">
          <label class="input-label">
            Slug
            <span class="hint">(URL-friendly version)</span>
          </label>
          <div class="slug-input-group">
            <span class="slug-prefix">{{ baseUrl }}/categories/</span>
            <input 
              pInputText 
              formControlName="slug"
              placeholder="web-development"
              class="slug-input">
          </div>
          @if (categoryForm.get('slug')?.value && categoryForm.get('name')?.value && !categoryForm.get('slug')?.dirty) {
            <small class="auto-generated">Auto-generated from name</small>
          }
        </div>

        <!-- Description -->
        <div class="form-group full-width">
          <label class="input-label">Description</label>
          <textarea 
            pInputTextarea 
            formControlName="description"
            placeholder="Describe this category..."
            [rows]="4"
            class="w-full">
          </textarea>
        </div>

        <!-- Icon and Image -->
        <div class="form-group">
          <label class="input-label">Icon Class</label>
          <div class="icon-input-group">
            <span class="icon-preview" [class]="categoryForm.get('icon')?.value || 'pi pi-folder'"></span>
            <input 
              pInputText 
              formControlName="icon"
              placeholder="e.g., pi pi-code"
              class="icon-input">
          </div>
          <small class="hint">Font Awesome or PrimeNG icon class</small>
        </div>

        <div class="form-group">
          <label class="input-label">Image URL</label>
          <input 
            pInputText 
            formControlName="image"
            placeholder="https://example.com/image.jpg"
            class="w-full">
        </div>

        <!-- Parent Category (for subcategories) -->
        <div class="form-group full-width">
          <label class="input-label">Parent Category</label>
          <p-select 
            formControlName="parentCategory"
            [options]="categories"
            [filter]="true"
            filterBy="name"
            optionLabel="name"
            optionValue="_id"
            placeholder="Select parent category (optional)"
            styleClass="w-full"
            [showClear]="true">
            <ng-template let-category pTemplate="item">
              <div class="category-option">
                <i class="pi pi-folder mr-2"></i>
                <span>{{ category.name }}</span>
                @if (category.slug) {
                  <small class="ml-2 text-secondary">({{ category.slug }})</small>
                }
              </div>
            </ng-template>
          </p-select>
          <small class="hint">Leave empty to create a top-level category</small>
        </div>

        <!-- Status -->
        <div class="form-group">
          <label class="input-label">Status</label>
          <div class="status-toggle">
            <p-inputSwitch formControlName="isActive"></p-inputSwitch>
            <span class="ml-2">{{ categoryForm.get('isActive')?.value ? 'Active' : 'Inactive' }}</span>
          </div>
        </div>
      </div>

      <!-- Preview Section -->
      @if (categoryForm.get('name')?.value || categoryForm.get('icon')?.value) {
        <div class="preview-section">
          <h4 class="preview-title">
            <i class="pi pi-eye"></i>
            Preview
          </h4>
          <div class="preview-card">
            <div class="preview-icon">
              <i class="preview-icon-display" [class]="categoryForm.get('icon')?.value || 'pi pi-folder'"></i>
            </div>
            <div class="preview-details">
              <span class="preview-name">{{ categoryForm.get('name')?.value || 'Category Name' }}</span>
              @if (categoryForm.get('slug')?.value) {
                <span class="preview-slug">/{{ categoryForm.get('slug')?.value }}</span>
              }
            </div>
          </div>
        </div>
      }

      <!-- Form Actions -->
      <div class="form-actions">
        <button pButton pRipple type="button" label="Cancel" icon="pi pi-times" class="p-button-outlined" (click)="onCancel()"></button>
        <button pButton pRipple type="submit" [label]="categoryId ? 'Update' : 'Create'" icon="pi pi-check" [disabled]="categoryForm.invalid || isLoading"></button>
      </div>
    </form>
  `,
  styles: [`
    .category-form {
      padding: var(--spacing-lg);
    }

    .parent-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background: var(--accent-focus);
      color: var(--accent-primary);
      border-radius: var(--ui-border-radius);
      margin-bottom: var(--spacing-md);
    }

    .parent-info i {
      font-size: var(--font-size-lg);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-lg);
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-group {
      margin-bottom: var(--spacing-md);
    }

    .input-label {
      display: block;
      font-weight: var(--font-weight-medium);
      margin-bottom: var(--spacing-xs);
      color: var(--text-primary);
    }

    .required {
      color: var(--color-error);
    }

    .hint {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      margin-left: var(--spacing-sm);
      font-weight: normal;
    }

    .error-message {
      color: var(--color-error);
      font-size: var(--font-size-xs);
      margin-top: var(--spacing-xs);
      display: block;
    }

    /* Slug Input */
    .slug-input-group {
      display: flex;
      align-items: center;
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      overflow: hidden;
    }

    .slug-prefix {
      background: var(--bg-secondary);
      padding: var(--spacing-sm) var(--spacing-md);
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
      border-right: 1px solid var(--border-secondary);
    }

    .slug-input {
      flex: 1;
      border: none;
      padding: var(--spacing-sm) var(--spacing-md);
      background: transparent;
      color: var(--text-primary);
    }

    .slug-input:focus {
      outline: none;
    }

    .auto-generated {
      display: block;
      margin-top: var(--spacing-xs);
      color: var(--color-success);
      font-size: var(--font-size-xs);
    }

    /* Icon Input */
    .icon-input-group {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .icon-preview {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      color: var(--accent-primary);
      font-size: var(--font-size-xl);
    }

    .icon-input {
      flex: 1;
    }

    /* Status Toggle */
    .status-toggle {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    /* Category Option */
    .category-option {
      display: flex;
      align-items: center;
      padding: var(--spacing-xs) 0;
    }

    /* Preview Section */
    .preview-section {
      margin: var(--spacing-xl) 0;
      padding: var(--spacing-lg);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius);
    }

    .preview-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin: 0 0 var(--spacing-lg);
      color: var(--text-primary);
      font-size: var(--font-size-md);
    }

    .preview-card {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      padding: var(--spacing-lg);
      background: var(--bg-primary);
      border-radius: var(--ui-border-radius);
      box-shadow: var(--shadow-sm);
    }

    .preview-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--accent-focus);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preview-icon-display {
      font-size: var(--font-size-3xl);
      color: var(--accent-primary);
    }

    .preview-details {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .preview-name {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }

    .preview-slug {
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      padding-top: var(--spacing-xl);
      border-top: 1px solid var(--border-secondary);
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .slug-input-group {
        flex-direction: column;
        align-items: stretch;
      }

      .slug-prefix {
        border-right: none;
        border-bottom: 1px solid var(--border-secondary);
      }
    }
  `]
})
export class CategoryFormComponent implements OnInit, OnDestroy {
  @Input() categoryId?: string;
  @Input() parentCategoryId?: string | null;
  @Output() saved = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);

  categoryForm!: FormGroup;
  categories: any
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

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.slugTimeout) clearTimeout(this.slugTimeout);
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.pattern(/^[a-z0-9-]+$/)],
      description: [''],
      icon: [''],
      image: [''],
      parentCategory: [this.parentCategoryId || null],
      isActive: [true]
    });

    // Auto-generate slug from name
    this.categoryForm.get('name')?.valueChanges.subscribe(name => {
      if (name && !this.categoryForm.get('slug')?.dirty) {
        if (this.slugTimeout) clearTimeout(this.slugTimeout);
        this.slugTimeout = setTimeout(() => {
          const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          this.categoryForm.get('slug')?.setValue(slug);
        }, 500);
      }
    });
  }

  private loadCategories(): void {
    const sub = this.categoryService.getAll({ isActive: true }).subscribe({
      next: (res) => {
        // Filter out current category and its descendants for edit mode
        this.categories = res.data?.filter((cat: any) => 
          !this.categoryId || (cat._id !== this.categoryId)
        ) || [];
      },
      error: (error) => console.error('Failed to load categories', error)
    });
    this.subscriptions.push(sub);
  }

  private loadCategory(): void {
    if (!this.categoryId) return;

    this.isLoading = true;
    const sub = this.categoryService.getById(this.categoryId).subscribe({
      next: (res) => {
        const category = res.data;
        if (category) {
          this.categoryForm.patchValue({
            name: category.name,
            slug: category.slug,
            description: category.description,
            icon: category.icon,
            image: category.image,
            parentCategory:  category.parentCategory,
            // category.parentCategory?._id ||
            isActive: category.isActive
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

    const sub = this.categoryService.getById(this.parentCategoryId).subscribe({
      next: (res) => {
        this.parentCategory = res.data;
      },
      error: (error) => console.error('Failed to load parent category', error)
    });
    this.subscriptions.push(sub);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.categoryForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = this.categoryForm.value;

    // Remove parentCategory if empty
    if (!formData.parentCategory) {
      delete formData.parentCategory;
    }

    const request = this.categoryId
      ? this.categoryService.update(this.categoryId, formData)
      : this.categoryService.create(formData);

    const sub = (request as any).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.saved.emit(res.data);
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