import { Component, OnInit, inject, DestroyRef, signal, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; 
import { Observable } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';

import { CategoryService } from '../../../../core/services/category.service';

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
    TagModule
  ],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent implements OnInit {
  // Inputs for modal/child component usage
  categoryId = input<string | undefined>();
  parentCategoryId = input<string | null>(null);
  
  // Outputs
  saved = output<any>();
  cancelled = output<void>();

  // Injectors
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute); 
  private router = inject(Router);        
  private destroyRef = inject(DestroyRef);

  // State Signals
  resolvedCategoryId = signal<string | null>(null); 
  categories = signal<any[]>([]);
  parentCategory = signal<any>(null);
  isLoading = signal<boolean>(false);
  
  baseUrl = window.location.origin;
  private slugTimeout: any;

  categoryForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.pattern(/^[a-z0-9-]+$/)],
    description: [''],
    icon: ['pi pi-folder'],
    image: [''],
    parentCategory: [null as string | null],
    isActive: [true]
  });

  ngOnInit(): void {
    this.loadCategories();
    this.setupAutoSlug();

    const routeId = this.route.snapshot.params['id'];
    const inputId = this.categoryId();
    const activeId = routeId || inputId;

    if (activeId) {
      this.resolvedCategoryId.set(activeId);
      this.loadCategory(activeId);
    } else {
      const pId = this.parentCategoryId();
      this.categoryForm.patchValue({ 
        icon: 'pi pi-folder', 
        isActive: true, 
        parentCategory: pId 
      });
      if (pId) this.loadParentCategory(pId);
    }
  }

  private setupAutoSlug(): void {
    this.categoryForm.get('name')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(name => {
        if (name && !this.categoryForm.get('slug')?.dirty && !this.resolvedCategoryId()) {
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
    this.categoryService.getAllCategory({ isActive: true }) 
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const payload = res?.data?.data || res?.data || res; 
          const currentId = this.resolvedCategoryId();
          
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
    this.categoryService.getcategoryById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const category = res?.data?.category || res?.data || res;

          if (category && category.name) {
            this.categoryForm.patchValue({
              name: category.name,
              slug: category.slug,
              description: category.description,
              icon: category.icon || 'pi pi-folder',
              image: category.image,
              parentCategory: category.parentCategory?._id || category.parentCategory || null,
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
    this.categoryService.getcategoryById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const parent = res?.data?.category || res?.data || res;
          this.parentCategory.set(parent);
        }
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
      formData.parentCategory = null; 
    }

    const cId = this.resolvedCategoryId();
    let request$: Observable<any>;

    if (cId) {
      request$ = this.categoryService.updateCategory(cId, formData);
    } else {
      request$ = this.categoryService.createCategory(formData);
    }

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.saved.emit(res?.data || formData);
        
        if (this.route.snapshot.params['id'] || this.route.snapshot.url.length > 0) {
          this.router.navigate(['/categories/admin']);
        }
      },
      error: (error: any) => {
        console.error('Failed to save category', error);
        this.isLoading.set(false);
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
    if (this.route.snapshot.params['id'] || this.route.snapshot.url.length > 0) {
      this.router.navigate(['/categories/admin']);
    }
  }
}


// import { Component, OnInit, inject, DestroyRef, signal, input, output } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router'; // <-- ADDED for routing support
// import { Observable, of } from 'rxjs';

// // PrimeNG Imports
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { TextareaModule } from 'primeng/textarea';
// import { SelectModule } from 'primeng/select';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { DividerModule } from 'primeng/divider';
// import { CategoryService } from '../../../../core/services/category.service';

// @Component({
//   selector: 'app-category-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     ButtonModule,
//     InputTextModule,
//     TextareaModule,
//     SelectModule,
//     ToggleSwitchModule,
//     DividerModule
//   ],
//   templateUrl: './category-form.component.html',
//   styleUrls: ['./category-form.component.scss']
// })
// export class CategoryFormComponent implements OnInit {
//   // Inputs for modal/child component usage
//   categoryId = input<string | undefined>();
//   parentCategoryId = input<string | null>(null);
  
//   // Outputs
//   saved = output<any>();
//   cancelled = output<void>();

//   // Injectors
//   private fb = inject(FormBuilder);
//   private categoryService = inject(CategoryService);
//   private route = inject(ActivatedRoute); //
//   private router = inject(Router);        
//   private destroyRef = inject(DestroyRef);

//   // State Signals
//   resolvedCategoryId = signal<string | null>(null); // Stores the final ID (from route or input)
//   categories = signal<any[]>([]);
//   parentCategory = signal<any>(null);
//   isLoading = signal<boolean>(false);
  
//   baseUrl = window.location.origin;
//   private slugTimeout: any;

//   categoryForm: FormGroup = this.fb.group({
//     name: ['', Validators.required],
//     slug: ['', Validators.pattern(/^[a-z0-9-]+$/)],
//     description: [''],
//     icon: ['pi pi-folder'],
//     image: [''],
//     parentCategory: [null as string | null],
//     isActive: [true]
//   });

//   ngOnInit(): void {
//     this.loadCategories();
//     this.setupAutoSlug();

//     // 1. Determine ID from Router (priority) OR Component Input
//     const routeId = this.route.snapshot.params['id'];
//     const inputId = this.categoryId();
//     const activeId = routeId || inputId;

//     if (activeId) {
//       // EDIT MODE
//       this.resolvedCategoryId.set(activeId);
//       this.loadCategory(activeId);
//     } else {
//       // CREATE MODE
//       const pId = this.parentCategoryId();
//       this.categoryForm.patchValue({ 
//         icon: 'pi pi-folder', 
//         isActive: true, 
//         parentCategory: pId 
//       });
//       if (pId) this.loadParentCategory(pId);
//     }
//   }

//   private setupAutoSlug(): void {
//     this.categoryForm.get('name')?.valueChanges
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(name => {
//         // Only auto-generate if the user hasn't manually touched the slug field
//         if (name && !this.categoryForm.get('slug')?.dirty && !this.resolvedCategoryId()) {
//           if (this.slugTimeout) clearTimeout(this.slugTimeout);
//           this.slugTimeout = setTimeout(() => {
//             const slug = name
//               .toLowerCase()
//               .replace(/[^a-z0-9]+/g, '-')
//               .replace(/^-|-$/g, '');
//             this.categoryForm.get('slug')?.setValue(slug, { emitEvent: false });
//           }, 500);
//         }
//       });
//   }

//   private loadCategories(): void {
//     this.categoryService.getAllCategory({ isActive: true }) // Using getAll from your service
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           const payload = res?.data?.data || res?.data || res; // Robust payload checking
//           const currentId = this.resolvedCategoryId();
          
//           // Filter out the current category so it cannot be its own parent
//           const filtered = (Array.isArray(payload) ? payload : []).filter((cat: any) =>
//             !currentId || (cat._id !== currentId)
//           );
//           this.categories.set(filtered);
//         },
//         error: (error) => console.error('Failed to load categories list', error)
//       });
//   }

//   private loadCategory(id: string): void {
//     this.isLoading.set(true);
//     this.categoryService.getcategoryById(id)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           // Robust payload extraction. Backend usually sends res.data as the actual object.
//           const category = res?.data?.category || res?.data || res;

//           if (category && category.name) {
//             this.categoryForm.patchValue({
//               name: category.name,
//               slug: category.slug,
//               description: category.description,
//               icon: category.icon || 'pi pi-folder',
//               image: category.image,
//               // IMPORTANT: If backend populated parentCategory, extract the _id, otherwise use as string
//               parentCategory: category.parentCategory?._id || category.parentCategory || null,
//               isActive: category.isActive !== false
//             });
//           }
//           this.isLoading.set(false);
//         },
//         error: (error) => {
//           console.error('Failed to load category', error);
//           this.isLoading.set(false);
//         }
//       });
//   }

//   private loadParentCategory(id: string): void {
//     this.categoryService.getcategoryById(id)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           const parent = res?.data?.category || res?.data || res;
//           this.parentCategory.set(parent);
//         }
//       });
//   }

//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.categoryForm.get(fieldName);
//     return field ? (field.invalid && (field.dirty || field.touched)) : false;
//   }

//   onSubmit(): void {
//     if (this.categoryForm.invalid) {
//       this.categoryForm.markAllAsTouched();
//       return;
//     }

//     this.isLoading.set(true);
//     const formData = { ...this.categoryForm.value };

//     if (!formData.parentCategory) {
//       formData.parentCategory = null; // Ensure null is sent to detach parent if cleared
//     }

//     const cId = this.resolvedCategoryId();
//     let request$: Observable<any>;

//     if (cId) {
//       request$ = this.categoryService.updateCategory(cId, formData);
//     } else {
//       request$ = this.categoryService.createCategory(formData);
//     }

//     request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
//       next: (res: any) => {
//         this.isLoading.set(false);
//         this.saved.emit(res?.data || formData);
        
//         // If used as a standalone page (routed), automatically navigate back
//         if (this.route.snapshot.params['id'] || this.route.snapshot.url.length > 0) {
//           this.router.navigate(['/categories/admin']);
//         }
//       },
//       error: (error: any) => {
//         console.error('Failed to save category', error);
//         this.isLoading.set(false);
//       }
//     });
//   }

//   onCancel(): void {
//     this.cancelled.emit();
//     // If used as a standalone page (routed), automatically navigate back
//     if (this.route.snapshot.params['id'] || this.route.snapshot.url.length > 0) {
//       this.router.navigate(['/categories/admin']);
//     }
//   }
// }