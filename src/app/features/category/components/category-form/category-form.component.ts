import { Component, OnInit, inject, DestroyRef, signal, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DividerModule } from 'primeng/divider';
import { CategoryService } from '../../../../core/services/category.service';

// Services
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
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent implements OnInit {
  // Modern Signal Inputs & Outputs
  categoryId = input<any>();
  parentCategoryId = input<string | null>(null);
  
  saved = output<any>();
  cancelled = output<void>();

  // Injectors
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private destroyRef = inject(DestroyRef);

  // Reactive State Signals
  categories = signal<any[]>([]);
  parentCategory = signal<any>(null);
  isLoading = signal<boolean>(false);
  
  baseUrl = window.location.origin;
  private slugTimeout: any;

  // Initialize form immediately so effects can safely patch it
  categoryForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.pattern(/^[a-z0-9-]+$/)],
    description: [''],
    icon: ['pi pi-folder'],
    image: [''],
    parentCategory: [null as string | null],
    isActive: [true]
  });

  constructor() {
    // Effect: React to input changes (replaces ngOnChanges)
    effect(() => {
      const cId = this.categoryId();
      const pId = this.parentCategoryId();

      if (cId) {
        this.loadCategory(cId);
      } else {
        // Reset form for new category, applying parent ID if provided
        this.categoryForm.reset({ 
          icon: 'pi pi-folder', 
          isActive: true, 
          parentCategory: pId 
        });
        if (pId) this.loadParentCategory(pId);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.setupAutoSlug();
  }

  private setupAutoSlug(): void {
    this.categoryForm.get('name')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(name => {
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
  }

  private loadCategories(): void {
    this.categoryService.getCategoryTree({ isActive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const payload = res?.data?.data || res?.data || [];
          const currentId = this.categoryId();
          
          const filtered = (Array.isArray(payload) ? payload : []).filter((cat: any) =>
            !currentId || (cat._id !== currentId)
          );
          this.categories.set(filtered);
        },
        error: (error) => console.error('Failed to load categories list', error)
      });
  }

  private loadCategory(id: string): void {
    this.isLoading.set(true);
    this.categoryService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const payload = res?.data?.data || res?.data;
          const category = Array.isArray(payload) ? payload.find((c: any) => c._id === id) : payload;

          if (category) {
            this.categoryForm.patchValue({
              name: category.name,
              slug: category.slug,
              description: category.description,
              icon: category.icon || 'pi pi-folder',
              image: category.image,
              parentCategory: category.parentCategory,
              isActive: category.isActive !== false
            });
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load category', error);
          this.isLoading.set(false);
        }
      });
  }

  private loadParentCategory(id: string): void {
    this.categoryService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const payload = res?.data?.data || res?.data;
          const parent = Array.isArray(payload) ? payload.find((c: any) => c._id === id) : payload;
          this.parentCategory.set(parent);
        },
        error: (error) => console.error('Failed to load parent category', error)
      });
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

    this.isLoading.set(true);
    const formData = { ...this.categoryForm.value };

    if (!formData.parentCategory) {
      delete formData.parentCategory;
    }

    const cId = this.categoryId();
    let request$: Observable<any>;

    // Type casting logic to match your service's typical architecture
    if (cId && (this.categoryService as any).update) {
      request$ = (this.categoryService as any).update(cId, formData);
    } else if ((this.categoryService as any).create) {
      request$ = (this.categoryService as any).create(formData);
    } else {
      request$ = of({ data: formData });
    }

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.saved.emit(res?.data || formData);
      },
      error: (error: any) => {
        console.error('Failed to save category', error);
        this.isLoading.set(false);
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
