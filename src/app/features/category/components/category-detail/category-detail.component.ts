import { Component, OnInit, inject, DestroyRef, signal, effect, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [DatePipe, NgClass],
  templateUrl: './category-detail.component.html',
  styleUrls: ['./category-detail.component.scss']
})
export class CategoryDetailComponent implements OnInit {
  // Modern Signal Inputs & Outputs
  categoryInput = input<any>(null, { alias: 'category' });
  edit = output<void>();
  close = output<void>();

  // Injectors
  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Reactive State
  fullCategory = signal<any>(null);
  isLoading = signal<boolean>(false);
  isRouted = signal<boolean>(false);

  constructor() {
    // Automatically react to input changes when used inside a modal
    effect(() => {
      const cat = this.categoryInput();
      if (cat?._id && !this.isRouted()) {
        this.loadFullDetails(cat._id);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    if (routeId) {
      this.isRouted.set(true);
      this.loadFullDetails(routeId);
    }
  }

  loadFullDetails(id: string): void {
    this.isLoading.set(true);
    this.categoryService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          // Extracts data based on the provided JSON structure (data.data)
          const payload = res?.data?.data || res?.data || this.categoryInput();
          this.fullCategory.set(payload);
          this.isLoading.set(false);
        },
        error: (error: any) => {
          console.error('Failed to load category details', error);
          this.fullCategory.set(this.categoryInput()); // Fallback to input
          this.isLoading.set(false);
        }
      });
  }

  onEdit(): void {
    if (this.isRouted()) {
      this.router.navigate(['/categories/admin', this.fullCategory()._id, 'edit']);
    } else {
      this.edit.emit();
    }
  }

  onClose(): void {
    if (this.isRouted()) {
      this.goBack();
    } else {
      this.close.emit();
    }
  }

  goBack(): void {
    this.router.navigate(['/categories/admin']);
  }
}
// import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, Injectable } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { Observable, of, delay } from 'rxjs';
// import { CategoryService } from '../../../../core/services/category.service';


// @Component({
//   selector: 'app-category-detail',
//   standalone: true,
//   imports: [CommonModule],
//   providers: [DatePipe],
//   template: `
//     <div class="detail-container">
      
//       <!-- Loading State -->
//       <div *ngIf="isLoading" class="loading-overlay">
//         <i class="pi pi-spin pi-spinner loading-spinner"></i>
//         <p>Fetching complete details...</p>
//       </div>

//       <!-- Not Found State -->
//       <div *ngIf="!isLoading && !fullCategory" class="not-found-state">
//         <i class="pi pi-exclamation-circle text-4xl text-muted mb-md"></i>
//         <h3>Category not found</h3>
//         <p class="text-secondary">The category you are looking for does not exist or has been removed.</p>
//         <button type="button" class="btn-primary mt-lg" (click)="goBack()">Go Back</button>
//       </div>

//       <ng-container *ngIf="!isLoading && fullCategory">
        
//         <!-- Cover Banner -->
//         <div class="cover-banner" [style.backgroundImage]="'url(' + (fullCategory.image || 'https://via.placeholder.com/800x200?text=No+Cover+Image') + ')'">
//           <div class="cover-overlay"></div>
          
//           <!-- Back button for routed view -->
//           <button *ngIf="isRouted" class="back-btn" (click)="goBack()">
//             <i class="pi pi-arrow-left"></i> Back to List
//           </button>
//         </div>

//         <div class="detail-content-wrapper">
//           <!-- Header (Overlaps Banner) -->
//           <div class="detail-header">
//             <div class="header-icon-wrapper">
//               <i [class]="fullCategory.icon || 'pi pi-folder'"></i>
//             </div>
            
//             <div class="header-main-info">
//               <div class="flex items-center gap-md">
//                 <h2 class="category-title">{{ fullCategory.name }}</h2>
//                 <span class="status-badge" [ngClass]="fullCategory.isActive ? 'status-active' : 'status-inactive'">
//                   {{ fullCategory.isActive ? 'Active' : 'Inactive' }}
//                 </span>
//               </div>
//               <p class="category-slug" *ngIf="fullCategory.slug">
//                 <i class="pi pi-link"></i> /{{ fullCategory.slug }}
//               </p>
//             </div>
//           </div>

//           <!-- Data Grid -->
//           <div class="details-grid">
            
//             <!-- Description spanning full width -->
//             <div class="detail-block full-width" *ngIf="fullCategory.description">
//               <span class="detail-label">
//                 <i class="pi pi-align-left"></i> Description
//               </span>
//               <p class="detail-value description-text">{{ fullCategory.description }}</p>
//             </div>

//             <!-- Standard details -->
//             <div class="detail-block">
//               <span class="detail-label">
//                 <i class="pi pi-hashtag"></i> Category ID
//               </span>
//               <code class="detail-value mono-text">{{ fullCategory._id }}</code>
//             </div>

//             <div class="detail-block" *ngIf="fullCategory.parentCategory">
//               <span class="detail-label">
//                 <i class="pi pi-sitemap"></i> Parent Category
//               </span>
//               <span class="detail-value flex items-center gap-xs">
//                 <i class="pi pi-folder text-primary"></i>
//                 {{ fullCategory.parentCategory.name || fullCategory.parentCategory }}
//               </span>
//             </div>

//             <div class="detail-block" *ngIf="!fullCategory.parentCategory">
//               <span class="detail-label">
//                 <i class="pi pi-sitemap"></i> Hierarchy Level
//               </span>
//               <span class="detail-value text-muted italic">Root Category</span>
//             </div>

//             <div class="detail-block">
//               <span class="detail-label">
//                 <i class="pi pi-calendar-plus"></i> Date Created
//               </span>
//               <span class="detail-value">{{ fullCategory.createdAt | date:'medium' }}</span>
//             </div>

//             <div class="detail-block">
//               <span class="detail-label">
//                 <i class="pi pi-sync"></i> Last Updated
//               </span>
//               <span class="detail-value">{{ fullCategory.updatedAt | date:'medium' }}</span>
//             </div>

//             <div class="detail-block">
//               <span class="detail-label">
//                 <i class="pi pi-tag"></i> UI Icon Class
//               </span>
//               <div class="detail-value flex items-center gap-md">
//                 <code class="mono-text bg-secondary px-xs py-[2px] rounded">{{ fullCategory.icon || 'None' }}</code>
//               </div>
//             </div>

//           </div>
//         </div>
//       </ng-container>

//       <!-- Actions Footer -->
//       <div class="detail-actions" *ngIf="!isLoading && fullCategory">
//         <button type="button" class="btn-secondary" (click)="onClose()" [disabled]="isLoading">
//           <i [class]="isRouted ? 'pi pi-arrow-left' : 'pi pi-times'"></i> {{ isRouted ? 'Back' : 'Close' }}
//         </button>
//         <button type="button" class="btn-primary" (click)="onEdit()" [disabled]="isLoading">
//           <i class="pi pi-pencil"></i> Edit Category
//         </button>
//       </div>

//     </div>
//   `,
//   styles: [`
//     /* ==========================================================================
//        THEME VARIABLES & CANONICAL MAPPING
//        ========================================================================== */
//     :host {
//       height: 100%;
//       width:100%
//     }

//     /* Dark Mode Defaults */
//     :host-context(.dark) {
//       --theme-bg-primary: #0f172a;
//       --theme-bg-secondary: #1e293b;
//       --theme-text-primary: #f8fafc;
//       --theme-text-secondary: #cbd5e1;
//       --theme-text-tertiary: #64748b;
//       --theme-border-primary: #334155;
//       --theme-border-secondary: #1e293b;
//     }

//     /* ==========================================================================
//        COMPONENT STYLES
//        ========================================================================== */
//     .detail-container {
//       background: var(--bg-primary);
//       position: relative;
//       min-height: 300px;
//     }

//     /* Utilities */
//     .flex { display: flex; }
//     .items-center { align-items: center; }
//     .gap-xs { gap: var(--spacing-xs); }
//     .gap-md { gap: var(--spacing-md); }
//     .text-primary { color: var(--color-primary); }
//     .text-secondary { color: var(--text-secondary); }
//     .text-muted { color: var(--text-muted); }
//     .italic { font-style: italic; }
//     .bg-secondary { background-color: var(--bg-secondary); }
//     .px-xs { padding-left: var(--spacing-xs); padding-right: var(--spacing-xs); }
//     .py-\\[2px\\] { padding-top: 2px; padding-bottom: 2px; }
//     .rounded { border-radius: var(--ui-border-radius); }
//     .mt-md { margin-top: var(--spacing-md); }
//     .mt-lg { margin-top: var(--spacing-lg); }
//     .mb-md { margin-bottom: var(--spacing-md); }
//     .text-4xl { font-size: var(--font-size-4xl); }

//     /* Loading & Not Found Overlays */
//     .loading-overlay, .not-found-state {
//       position: absolute; inset: 0;
//       display: flex; flex-direction: column; align-items: center; justify-content: center;
//       background: var(--bg-primary); z-index: 10;
//       color: var(--text-secondary);
//       text-align: center;
//     }
//     .not-found-state {
//       position: relative;
//       padding: var(--spacing-5xl) var(--spacing-2xl);
//     }
//     .not-found-state h3 { font-family: var(--font-heading); color: var(--text-primary); margin-bottom: var(--spacing-xs); }
//     .loading-spinner { font-size: 2.5rem; color: var(--color-primary); margin-bottom: var(--spacing-md); }

//     /* Cover Banner */
//     .cover-banner {
//       height: 140px;
//       background-size: cover;
//       background-position: center;
//       position: relative;
//       border-radius: var(--ui-border-radius-lg) var(--ui-border-radius-lg) 0 0;
//     }
//     .cover-overlay {
//       position: absolute; inset: 0;
//       background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%);
//       border-radius: var(--ui-border-radius-lg) var(--ui-border-radius-lg) 0 0;
//     }

//     .back-btn {
//       position: absolute;
//       top: var(--spacing-xl);
//       left: var(--spacing-xl);
//       background: rgba(0,0,0,0.4);
//       backdrop-filter: blur(4px);
//       color: white;
//       border: 1px solid rgba(255,255,255,0.2);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-sm) var(--spacing-lg);
//       display: flex; align-items: center; gap: var(--spacing-xs);
//       cursor: pointer; font-size: var(--font-size-sm); font-weight: 500;
//       transition: var(--transition-base); z-index: 5;
//     }
//     .back-btn:hover { background: rgba(0,0,0,0.6); }

//     /* Main Content Wrapper */
//     .detail-content-wrapper {
//       padding: 0 var(--spacing-2xl) var(--spacing-xl);
//     }

//     /* Header & Overlapping Avatar */
//     .detail-header {
//       display: flex;
//       align-items: flex-end;
//       gap: var(--spacing-xl);
//       margin-top: -40px; /* Overlaps banner */
//       margin-bottom: var(--spacing-xl);
//       position: relative;
//       z-index: 2;
//     }

//     .header-icon-wrapper {
//       width: 80px;
//       height: 80px;
//       border-radius: 50%;
//       background: var(--bg-primary);
//       border: 4px solid var(--bg-primary);
//       box-shadow: var(--shadow-md);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       flex-shrink: 0;
//     }
//     .header-icon-wrapper i {
//       font-size: 2.5rem;
//       color: var(--color-primary);
//     }

//     .header-main-info {
//       flex: 1;
//       padding-bottom: var(--spacing-sm);
//     }
//     .category-title {
//       font-family: var(--font-heading);
//       font-size: var(--font-size-3xl);
//       font-weight: 700;
//       color: var(--text-primary);
//       margin: 0;
//     }
//     .category-slug {
//       display: flex; align-items: center; gap: 4px;
//       color: var(--text-secondary);
//       font-size: var(--font-size-sm);
//       margin: var(--spacing-xs) 0 0 0;
//     }
//     .category-slug i { font-size: 0.8em; }

//     /* Status Badges */
//     .status-badge {
//       display: inline-flex; align-items: center;
//       padding: 2px var(--spacing-md);
//       border-radius: 999px;
//       font-size: var(--font-size-xs);
//       font-weight: 600;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//     }
//     .status-active { background-color: var(--color-success-bg); color: var(--color-success); border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent); }
//     .status-inactive { background-color: var(--color-error-bg); color: var(--color-error); border: 1px solid color-mix(in srgb, var(--color-error) 30%, transparent); }

//     /* Details Grid */
//     .details-grid {
//       display: grid;
//       grid-template-columns: repeat(1, 1fr);
//       gap: var(--spacing-2xl) var(--spacing-xl);
//       padding: var(--spacing-xl) 0;
//       border-top: var(--ui-border-width) solid var(--border-secondary);
//     }
//     @media (min-width: 640px) {
//       .details-grid { grid-template-columns: repeat(2, 1fr); }
//     }

//     .detail-block {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-sm);
//     }
//     .detail-block.full-width {
//       grid-column: 1 / -1;
//     }

//     .detail-label {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xs);
//       color: var(--text-muted);
//       font-size: var(--font-size-xs);
//       font-weight: 600;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//     }
//     .detail-label i { font-size: 1.1em; }

//     .detail-value {
//       color: var(--text-primary);
//       font-size: var(--font-size-md);
//       word-break: break-word;
//       line-height: var(--line-height-normal);
//     }
//     .description-text {
//       line-height: var(--line-height-relaxed);
//       color: var(--text-secondary);
//     }
//     .mono-text {
//       font-family: var(--font-mono);
//       font-size: 0.9em;
//       color: var(--text-secondary);
//     }

//     /* Actions Footer */
//     .detail-actions {
//       display: flex;
//       justify-content: flex-end;
//       gap: var(--spacing-md);
//       padding: var(--spacing-xl) var(--spacing-2xl);
//       background-color: var(--bg-secondary);
//       border-top: var(--ui-border-width) solid var(--border-primary);
//       border-radius: 0 0 var(--ui-border-radius-xl) var(--ui-border-radius-xl);
//     }

//     .btn-primary, .btn-secondary {
//       display: inline-flex; align-items: center; justify-content: center; gap: var(--spacing-sm);
//       padding: var(--spacing-md) var(--spacing-xl);
//       font-size: var(--font-size-md); font-weight: 600;
//       border-radius: var(--ui-border-radius-lg);
//       cursor: pointer; transition: var(--transition-base); border: none;
//     }
//     .btn-secondary {
//       background: transparent; color: var(--text-secondary); border: var(--ui-border-width) solid var(--border-primary);
//     }
//     .btn-secondary:hover:not(:disabled) { background: var(--bg-primary); color: var(--text-primary); border-color: var(--text-secondary); }
//     .btn-primary {
//       background: var(--color-primary); color: #fff; box-shadow: var(--shadow-sm);
//     }
//     .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); box-shadow: var(--shadow-md); transform: translateY(-1px); }
//     .btn-primary:disabled, .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

//     @media (max-width: 640px) {
//       .detail-header { flex-direction: column; align-items: flex-start; margin-top: -30px; gap: var(--spacing-md); }
//       .detail-actions { flex-direction: column-reverse; }
//       .btn-primary, .btn-secondary { width: 100%; }
//     }
//   `]
// })
// export class CategoryDetailComponent implements OnInit, OnChanges {
//   // Input received when the component is rendered inside a dialog/modal
//   @Input() category: any; 
  
//   // Events triggered for dialog usage
//   @Output() edit = new EventEmitter<void>();
//   @Output() close = new EventEmitter<void>();

//   private categoryService = inject(CategoryService);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);

//   fullCategory: any = null;
//   isLoading = false;
//   isRouted = false; // Flag to determine how the component was loaded

//   ngOnInit(): void {
//     // Check if the component was loaded via Angular Router directly
//     const routeId = this.route.snapshot.paramMap.get('id');
    
//     if (routeId) {
//       this.isRouted = true;
//       this.loadFullDetails(routeId);
//     }
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     // Check if the component was loaded via Input (inside a Modal Dialog)
//     if (changes['category'] && this.category?._id && !this.isRouted) {
//       this.loadFullDetails(this.category._id);
//     }
//   }

//   loadFullDetails(id: string): void {
//     this.isLoading = true;
//     this.categoryService.getById(id).subscribe({
//       next: (res: any) => {
//         // Extract from typical standard ApiResponse wrappers
//         const payload = res?.data;
//         this.fullCategory = payload?.data || payload || this.category;
//         this.isLoading = false;
//       },
//       error: (error: any) => {
//         console.error('Failed to load category details', error);
//         // Fallback to the partial input data if the API call fails
//         this.fullCategory = this.category || null; 
//         this.isLoading = false;
//       }
//     });
//   }

//   onEdit(): void {
//     if (this.isRouted) {
//       // If loaded via route, navigate to the edit route
//       this.router.navigate(['/categories/admin', this.fullCategory._id, 'edit']);
//     } else {
//       // If in a modal, emit the event to the parent container
//       this.edit.emit();
//     }
//   }

//   onClose(): void {
//     if (this.isRouted) {
//       // If loaded via route, navigate back to the list
//       this.goBack();
//     } else {
//       // If in a modal, emit close event
//       this.close.emit();
//     }
//   }

//   goBack(): void {
//     this.router.navigate(['/categories/admin']);
//   }
// }