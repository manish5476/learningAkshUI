import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DatePipe,
    NgClass,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit {
  // Injectors
  private categoryService = inject(CategoryService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // Reactive State Signals
  loading = signal<boolean>(false);
  categories = signal<any[]>([]);
  
  // Filters & Sorting Signals
  searchQuery = signal<string>('');
  statusFilter = signal<boolean | null>(null);
  sortConfig = signal<{ field: string, order: number }>({ field: 'createdAt', order: -1 });
  
  // Pagination Signals
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Computed State (Automatically updates when dependencies change)
  stats = computed(() => {
    const cats = this.categories();
    const total = cats.length;
    const active = cats.filter(c => c.isActive).length;
    return { total, active, inactive: total - active };
  });

  filteredAndSortedCategories = computed(() => {
    let result = this.categories();
    const search = this.searchQuery().toLowerCase();
    const status = this.statusFilter();
    const sort = this.sortConfig();

    // Search filter
    if (search) {
      result = result.filter(c => 
        c.name?.toLowerCase().includes(search) || 
        c.description?.toLowerCase().includes(search) || 
        c.slug?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (status !== null) {
      result = result.filter(c => c.isActive === status);
    }

    // Sorting
    return result.sort((a, b) => {
      const valA = a[sort.field] ?? '';
      const valB = b[sort.field] ?? '';
      if (valA < valB) return -1 * sort.order;
      if (valA > valB) return 1 * sort.order;
      return 0;
    });
  });

  // Pagination Computed
  totalPages = computed(() => Math.ceil(this.filteredAndSortedCategories().length / this.pageSize()) || 1);
  
  paginatedCategories = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredAndSortedCategories().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    // API Call
    this.categoryService.getAllCategory({}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        const payload = res?.data?.data || res?.data || [];
        this.categories.set(Array.isArray(payload) ? payload : []);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load categories', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load categories' });
        this.loading.set(false);
      }
    });
  }

  // --- Actions & Filters ---

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  onStatusChange(value: boolean | null): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set(null);
    this.currentPage.set(1);
  }

  sortBy(field: string): void {
    const current = this.sortConfig();
    const order = current.field === field ? current.order * -1 : 1;
    this.sortConfig.set({ field, order });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  // --- Dialog Handlers (Removed) ---
  // openNewCategoryDialog, addSubCategory, viewCategory, editCategory, etc., 
  // have been removed since navigation is now handled via routerLink in HTML.

  deleteCategory(category: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${category.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.categoryService.deleteCategory(category._id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Category deleted successfully' });
            this.loadCategories();
          },
          error: (error: any) => {
            console.error('Failed to delete category', error);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'Failed to delete category' });
          }
        });
      }
    });
  }
}

// import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule, DatePipe, NgClass } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterModule } from '@angular/router';

// // PrimeNG
// import { DialogModule } from 'primeng/dialog';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ToastModule } from 'primeng/toast';
// import { ConfirmationService, MessageService } from 'primeng/api';
// import { CategoryService } from '../../../../core/services/category.service';
// import { CategoryDetailComponent } from '../category-detail/category-detail.component';
// import { CategoryFormComponent } from '../category-form/category-form.component';

// // Local Components & Services

// @Component({
//   selector: 'app-category-list',
//   standalone: true,
//   imports: [
//     RouterModule,
//     FormsModule,
//     DatePipe,
//     NgClass,
//     DialogModule,
//     ConfirmDialogModule,
//     ToastModule,
//     CategoryFormComponent,
//     CategoryDetailComponent
//   ],
//   providers: [ConfirmationService, MessageService],
//   templateUrl: './category-list.component.html',
//   styleUrls: ['./category-list.component.scss']
// })
// export class CategoryListComponent implements OnInit {
//   // Injectors
//   private categoryService = inject(CategoryService);
//   private confirmationService = inject(ConfirmationService);
//   private messageService = inject(MessageService);
//   private destroyRef = inject(DestroyRef);

//   // Reactive State Signals
//   loading = signal<boolean>(false);
//   categories = signal<any[]>([]);
  
//   // Filters & Sorting Signals
//   searchQuery = signal<string>('');
//   statusFilter = signal<boolean | null>(null);
//   sortConfig = signal<{ field: string, order: number }>({ field: 'createdAt', order: -1 });
  
//   // Pagination Signals
//   currentPage = signal<number>(1);
//   pageSize = signal<number>(10);

//   // Dialog State Signals
//   showFormDialog = signal<boolean>(false);
//   showDetailDialog = signal<boolean>(false);
//   selectedCategoryId = signal<string | null>(null);
//   selectedCategory = signal<any>(null);
//   parentCategoryId = signal<string | null>(null);
//   dialogTitle = signal<string>('Add New Category');

//   // Computed State (Automatically updates when dependencies change)
//   stats = computed(() => {
//     const cats = this.categories();
//     const total = cats.length;
//     const active = cats.filter(c => c.isActive).length;
//     return { total, active, inactive: total - active };
//   });

//   filteredAndSortedCategories = computed(() => {
//     let result = this.categories();
//     const search = this.searchQuery().toLowerCase();
//     const status = this.statusFilter();
//     const sort = this.sortConfig();

//     // Search filter
//     if (search) {
//       result = result.filter(c => 
//         c.name?.toLowerCase().includes(search) || 
//         c.description?.toLowerCase().includes(search) || 
//         c.slug?.toLowerCase().includes(search)
//       );
//     }

//     // Status filter
//     if (status !== null) {
//       result = result.filter(c => c.isActive === status);
//     }

//     // Sorting
//     return result.sort((a, b) => {
//       const valA = a[sort.field] ?? '';
//       const valB = b[sort.field] ?? '';
//       if (valA < valB) return -1 * sort.order;
//       if (valA > valB) return 1 * sort.order;
//       return 0;
//     });
//   });

//   // Pagination Computed
//   totalPages = computed(() => Math.ceil(this.filteredAndSortedCategories().length / this.pageSize()) || 1);
  
//   paginatedCategories = computed(() => {
//     const start = (this.currentPage() - 1) * this.pageSize();
//     return this.filteredAndSortedCategories().slice(start, start + this.pageSize());
//   });

//   ngOnInit(): void {
//     this.loadCategories();
//   }

//   loadCategories(): void {
//     this.loading.set(true);
//     // API Call
//     this.categoryService.getAllCategory({}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
//       next: (res: any) => {
//         const payload = res?.data?.data || res?.data || [];
//         this.categories.set(Array.isArray(payload) ? payload : []);
//         this.loading.set(false);
//       },
//       error: (error: any) => {
//         console.error('Failed to load categories', error);
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load categories' });
//         this.loading.set(false);
//       }
//     });
//   }

//   // --- Actions & Filters ---


//   // :id/edit
//   onSearchChange(value: string): void {
//     this.searchQuery.set(value);
//     this.currentPage.set(1);
//   }

//   onStatusChange(value: boolean | null): void {
//     this.statusFilter.set(value);
//     this.currentPage.set(1);
//   }

//   clearFilters(): void {
//     this.searchQuery.set('');
//     this.statusFilter.set(null);
//     this.currentPage.set(1);
//   }

//   sortBy(field: string): void {
//     const current = this.sortConfig();
//     const order = current.field === field ? current.order * -1 : 1;
//     this.sortConfig.set({ field, order });
//   }

//   changePage(page: number): void {
//     if (page >= 1 && page <= this.totalPages()) {
//       this.currentPage.set(page);
//     }
//   }

//   // --- Dialog Handlers ---

//   openNewCategoryDialog(): void {
//     this.selectedCategoryId.set(null);
//     this.parentCategoryId.set(null);
//     this.dialogTitle.set('Add New Category');
//     this.showFormDialog.set(true);
//   }

//   addSubCategory(parentCategory: any): void {
//     this.selectedCategoryId.set(null);
//     this.parentCategoryId.set(parentCategory._id);
//     this.dialogTitle.set(`Add Subcategory under ${parentCategory.name}`);
//     this.showFormDialog.set(true);
//   }

//   viewCategory(category: any): void {
//     this.selectedCategory.set(category);
//     this.showDetailDialog.set(true);
//   }

//   editCategory(category: any): void {
//     this.selectedCategoryId.set(category._id);
//     this.parentCategoryId.set(category.parentCategory);
//     this.dialogTitle.set('Edit Category');
//     this.showFormDialog.set(true);
//   }

//   deleteCategory(category: any): void {
//     this.confirmationService.confirm({
//       message: `Are you sure you want to delete "${category.name}"?`,
//       header: 'Confirm Delete',
//       icon: 'pi pi-exclamation-triangle',
//       accept: () => {
//         this.categoryService.deleteCategory(category._id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
//           next: () => {
//             this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Category deleted successfully' });
//             this.loadCategories();
//           },
//           error: (error: any) => {
//             console.error('Failed to delete category', error);
//             this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'Failed to delete category' });
//           }
//         });
//       }
//     });
//   }

//   onCategorySaved(category: any): void {
//     this.messageService.add({
//       severity: 'success',
//       summary: 'Success',
//       detail: `Category ${this.selectedCategoryId() ? 'updated' : 'created'} successfully`
//     });
//     this.closeFormDialog();
//     this.loadCategories();
//   }

//   closeFormDialog(): void {
//     this.showFormDialog.set(false);
//     this.selectedCategoryId.set(null);
//     this.parentCategoryId.set(null);
//   }

//   editFromDetail(): void {
//     this.closeDetailDialog();
//     setTimeout(() => {
//       this.dialogTitle.set('Edit Category');
//       this.showFormDialog.set(true);
//     }, 150);
//   }

//   closeDetailDialog(): void {
//     this.showDetailDialog.set(false);
//     this.selectedCategory.set(null);
//   }
// }
