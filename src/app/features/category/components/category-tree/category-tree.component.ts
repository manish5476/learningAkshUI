import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Models & Services
import { TreeNode } from 'primeng/api';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DatePipe,
    NgClass
  ],
  providers: [DatePipe],
  templateUrl: './category-tree.component.html',
  styleUrls: ['./category-tree.component.scss']
})
export class CategoryTreeComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private destroyRef = inject(DestroyRef);

  // Reactive State
  loading = signal<boolean>(true);
  searchTerm = signal<string>('');
  
  // Tree Data Signals
  originalData = signal<TreeNode[]>([]);
  treeData = signal<any[]>([]);
  hasVisibleNodes = signal<boolean>(true);

  // Stats Signal
  stats = signal({ total: 0, active: 0, inactive: 0 });

  private searchTimeout: any;

  ngOnInit(): void {
    this.loadCategoryTree();
  }

  loadCategoryTree(): void {
    this.loading.set(true);
    
    this.categoryService.getCategoryTree()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const rawCategories = res?.data?.categories || res?.data || [];
          const categories = Array.isArray(rawCategories) ? rawCategories : [];
          
          const builtNodes = this.buildTreeNodes(categories);
          
          this.originalData.set(builtNodes);
          this.treeData.set(JSON.parse(JSON.stringify(builtNodes))); // Deep clone for UI
          
          this.calculateStats(categories);
          this.loading.set(false);
          
          // Re-apply existing search filter if present
          if (this.searchTerm()) this.executeSearchFilter();
        },
        error: (error) => {
          console.error('Failed to load category tree', error);
          this.loading.set(false);
        }
      });
  }

  private buildTreeNodes(categories: any[], level: number = 0): TreeNode[] {
    return categories.map(cat => ({
      _id: cat._id,
      name: cat.name || 'Unnamed',
      description: cat.description || '',
      slug: cat.slug || '',
      icon: cat.icon || '',
      image: cat.image || '',
      isActive: cat.isActive !== false,
      createdAt: cat.createdAt || new Date().toISOString(),
      expanded: level < 1, // Auto expand top-level nodes
      hidden: false,
      children: cat.children?.length ? this.buildTreeNodes(cat.children, level + 1) : []
    }));
  }

  private calculateStats(categories: any[]): void {
    let total = 0;
    let active = 0;

    const countNodes = (nodes: any[]) => {
      for (const node of nodes) {
        total++;
        if (node.isActive !== false) active++;
        if (node.children?.length) countNodes(node.children);
      }
    };

    countNodes(categories);
    this.stats.set({ total, active, inactive: total - active });
  }

  // --- Tree Interactions ---

  toggleNode(node: TreeNode): void {
    if (node.children && node.children.length > 0) {
      node.expanded = !node.expanded;
      // Force trigger update for Angular to catch the deep mutation
      this.treeData.set([...this.treeData()]); 
    }
  }

  expandAll(): void {
    const data = [...this.treeData()];
    const expand = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.children?.length) {
          node.expanded = true;
          expand(node.children);
        }
      });
    };
    expand(data);
    this.treeData.set(data);
  }

  collapseAll(): void {
    const data = [...this.treeData()];
    const collapse = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        node.expanded = false;
        if (node.children?.length) collapse(node.children);
      });
    };
    collapse(data);
    this.treeData.set(data);
  }

  // --- Search Filtering ---

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.executeSearchFilter();
    }, 300);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.executeSearchFilter();
  }

  private executeSearchFilter(): void {
    const term = this.searchTerm().toLowerCase().trim();
    const data = [...this.treeData()]; // Work on a clone to trigger signal update
    
    if (!term) {
      const resetHidden = (nodes: any[]) => {
        nodes.forEach(n => {
          n.hidden = false;
          if (n.children) resetHidden(n.children);
        });
      };
      resetHidden(data);
      this.treeData.set(data);
      this.hasVisibleNodes.set(data.length > 0);
      return;
    }

    const filterRecursive = (nodes: any[]): boolean => {
      let hasVisibleChildInArray = false;

      for (const node of nodes) {
        const matches = 
          node.name.toLowerCase().includes(term) ||
          node.slug.toLowerCase().includes(term) ||
          node.description.toLowerCase().includes(term);

        const childrenHasMatch = node.children?.length ? filterRecursive(node.children) : false;

        node.hidden = !(matches || childrenHasMatch);

        if (!node.hidden) {
          hasVisibleChildInArray = true;
          if (childrenHasMatch) node.expanded = true; 
        }
      }
      return hasVisibleChildInArray;
    };

    const anyVisible = filterRecursive(data);
    this.treeData.set(data);
    this.hasVisibleNodes.set(anyVisible);
  }
}
// import { Component, OnInit, OnDestroy, inject, Injectable } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { Observable, of, delay, Subscription } from 'rxjs';
// import { TreeNode } from 'primeng/api';
// import { CategoryService } from '../../../../core/services/category.service';


// @Component({
//   selector: 'app-category-tree',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     FormsModule
//   ],
//   providers: [DatePipe],
//   template: `
//     <div class="page-container">

//       <!-- Header -->
//       <div class="page-header">
//         <div class="header-left">
//           <!-- Custom Breadcrumb -->
//           <nav class="breadcrumb">
//             <a routerLink="/" class="bc-link"><i class="pi pi-home"></i></a>
//             <span class="bc-sep">/</span>
//             <a routerLink="/categories" class="bc-link">Categories</a>
//             <span class="bc-sep">/</span>
//             <span class="bc-current">Hierarchy Tree</span>
//           </nav>

//           <h1 class="page-title">
//             <div class="title-icon"><i class="pi pi-sitemap"></i></div>
//             Category Tree
//           </h1>
//         </div>
        
//         <div class="header-actions">
//           <button class="btn-secondary" (click)="loadCategoryTree()" [disabled]="loading">
//             <i class="pi" [ngClass]="loading ? 'pi-spin pi-spinner' : 'pi-refresh'"></i> Refresh
//           </button>
//           <button class="btn-secondary" (click)="expandAll()" [disabled]="loading">
//             <i class="pi pi-expand"></i> Expand All
//           </button>
//           <button class="btn-secondary" (click)="collapseAll()" [disabled]="loading">
//             <i class="pi pi-compress"></i> Collapse All
//           </button>
//         </div>
//       </div>

//       <!-- Search & Stats Toolbar -->
//       <div class="toolbar-section">
//         <div class="search-wrapper">
//           <i class="pi pi-search search-icon"></i>
//           <input 
//             type="text" 
//             [(ngModel)]="searchTerm" 
//             (ngModelChange)="filterTree()"
//             placeholder="Search categories..." 
//             class="search-input">
//         </div>
//         <div class="stats-badges">
//           <span class="stat-badge bg-primary-light text-primary">
//             <i class="pi pi-tags"></i> Total: {{ stats.total }}
//           </span>
//           <span class="stat-badge bg-success-light text-success">
//             <i class="pi pi-check-circle"></i> Active: {{ stats.active }}
//           </span>
//           <span class="stat-badge bg-error-light text-error">
//             <i class="pi pi-times-circle"></i> Inactive: {{ stats.inactive }}
//           </span>
//         </div>
//       </div>

//       <!-- Content Area -->
//       <div class="tree-container">
        
//         <!-- Loading State -->
//         <div *ngIf="loading" class="loading-state">
//           <i class="pi pi-spin pi-spinner text-4xl text-primary mb-md"></i>
//           <p class="text-secondary">Building category hierarchy...</p>
//         </div>

//         <!-- Empty State (No Search Results) -->
//         <div *ngIf="!loading && treeData.length > 0 && !hasVisibleNodes" class="empty-state">
//           <i class="pi pi-search text-4xl text-muted mb-md block"></i>
//           <h3 class="text-lg font-medium text-primary mb-xs">No matches found</h3>
//           <p class="text-secondary">No categories matched your search for "{{ searchTerm }}"</p>
//           <button class="btn-primary mt-md" (click)="searchTerm = ''; filterTree()">Clear Search</button>
//         </div>

//         <!-- Empty State (No Data) -->
//         <div *ngIf="!loading && treeData.length === 0" class="empty-state">
//           <i class="pi pi-folder-open text-4xl text-muted mb-md block"></i>
//           <h3 class="text-lg font-medium text-primary mb-xs">Tree is empty</h3>
//           <p class="text-secondary">No categories exist in the system yet.</p>
//         </div>

//         <!-- Custom Recursive Tree -->
//         <div *ngIf="!loading && hasVisibleNodes" class="custom-tree">
//           <ng-container *ngFor="let node of treeData">
//             <ng-container *ngTemplateOutlet="treeNodeTemplate; context: { $implicit: node, level: 0 }"></ng-container>
//           </ng-container>
//         </div>

//       </div>
//     </div>

//     <!-- RECURSIVE NODE TEMPLATE -->
//     <ng-template #treeNodeTemplate let-node let-level="level">
//       <div class="node-wrapper" *ngIf="!node.hidden">
        
//         <!-- Node Row -->
//         <div class="node-row" [style.padding-left.rem]="level * 1.5">
          
//           <!-- Expand/Collapse Toggle -->
//           <button 
//             class="node-toggle" 
//             [class.invisible]="!node.children || node.children.length === 0"
//             (click)="toggleNode(node)">
//             <i class="pi" [ngClass]="node.expanded ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
//           </button>

//           <!-- Node Content Card -->
//           <div class="node-content">
            
//             <div class="node-info-main">
//               <!-- Thumbnail/Icon -->
//               <div class="node-thumbnail" *ngIf="node.image">
//                 <img [src]="node.image" [alt]="node.name">
//               </div>
//               <div class="node-icon-box" *ngIf="!node.image">
//                 <i [class]="node.icon || 'pi pi-folder'"></i>
//               </div>

//               <!-- Details -->
//               <div class="node-text">
//                 <div class="node-header">
//                   <span class="node-name">{{ node.name }}</span>
//                   <span class="status-indicator" [ngClass]="node.isActive ? 'bg-success' : 'bg-error'" [title]="node.isActive ? 'Active' : 'Inactive'"></span>
//                 </div>
//                 <div class="node-meta">
//                   <span class="node-slug">/{{ node.slug }}</span>
//                   <span class="meta-dot" *ngIf="node.children?.length">•</span>
//                   <span class="node-children-count" *ngIf="node.children?.length">
//                     {{ node.children.length }} subcategor{{ node.children.length === 1 ? 'y' : 'ies' }}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <!-- Actions -->
//             <div class="node-actions">
//               <span class="date-created hidden md:block" title="Created At">
//                 <i class="pi pi-calendar"></i> {{ node.createdAt | date:'MMM d, y' }}
//               </span>
//               <a [routerLink]="['/categories', node._id, 'courses']" class="btn-view-courses">
//                 View Courses <i class="pi pi-arrow-right"></i>
//               </a>
//             </div>

//           </div>
//         </div>

//         <!-- Recursive Children Rendering -->
//         <div class="node-children" *ngIf="node.expanded && node.children && node.children.length > 0">
//           <ng-container *ngFor="let child of node.children">
//             <ng-container *ngTemplateOutlet="treeNodeTemplate; context: { $implicit: child, level: level + 1 }"></ng-container>
//           </ng-container>
//         </div>

//       </div>
//     </ng-template>
//   `,
//   styles: [`
//     /* ==========================================================================
//        THEME VARIABLES
//        ========================================================================== */
//     :host {
//   width: 100%;
//   height:100%
//     }

//     /* Utilities */
//     .invisible { visibility: hidden; }
//     .hidden { display: none; }
//     @media (min-width: 768px) { .md\\:block { display: block; } }
//     .text-4xl { font-size: 2.25rem; }
//     .text-lg { font-size: 1.125rem; }
//     .text-primary { color: var(--text-primary); }
//     .text-secondary { color: var(--text-secondary); }
//     .text-muted { color: var(--text-tertiary); }
//     .font-medium { font-weight: 500; }
//     .mb-xs { margin-bottom: var(--spacing-xs); }
//     .mb-md { margin-bottom: var(--spacing-md); }
//     .mt-md { margin-top: var(--spacing-md); }
//     .block { display: block; }

//     /* Layout */
//     .page-container {
//       padding: var(--spacing-3xl);
//       max-width: 1400px;
//       margin: 0 auto;
//       min-height: 100vh;
//     }

//     /* Breadcrumb */
//     .breadcrumb {
//       display: flex; align-items: center; gap: var(--spacing-sm);
//       font-size: 0.875rem; margin-bottom: var(--spacing-md);
//     }
//     .bc-link { color: var(--text-tertiary); text-decoration: none; transition: var(--transition-base); }
//     .bc-link:hover { color: var(--color-primary); }
//     .bc-sep { color: var(--border-primary); }
//     .bc-current { color: var(--text-secondary); font-weight: 500; }

//     /* Header */
//     .page-header {
//       display: flex; justify-content: space-between; align-items: flex-end;
//       margin-bottom: var(--spacing-2xl); flex-wrap: wrap; gap: var(--spacing-xl);
//     }
//     .page-title {
//       font-family: var(--font-heading); font-size: 2rem; font-weight: 700;
//       color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: var(--spacing-md);
//     }
//     .title-icon {
//       width: 48px; height: 48px; border-radius: var(--ui-border-radius-lg);
//       background: color-mix(in srgb, var(--color-primary) 10%, transparent);
//       color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
//     }

//     /* Buttons */
//     .header-actions { display: flex; gap: var(--spacing-sm); flex-wrap: wrap; }
//     .btn-primary, .btn-secondary {
//       display: inline-flex; align-items: center; gap: var(--spacing-xs);
//       padding: var(--spacing-sm) var(--spacing-lg); font-size: 0.875rem; font-weight: 500;
//       border-radius: var(--ui-border-radius); cursor: pointer; transition: var(--transition-base);
//     }
//     .btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border: var(--ui-border-width) solid var(--border-primary); }
//     .btn-secondary:hover:not(:disabled) { background: var(--bg-ternary); }
//     .btn-primary { background: var(--color-primary); color: #fff; border: none; }
//     .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
//     .btn-secondary:disabled, .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

//     /* Toolbar Section */
//     .toolbar-section {
//       display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;
//       gap: var(--spacing-xl); margin-bottom: var(--spacing-2xl); padding: var(--spacing-lg);
//       background: var(--bg-secondary); border-radius: var(--ui-border-radius-lg); border: var(--ui-border-width) solid var(--border-primary);
//     }
//     .search-wrapper { position: relative; flex: 1; min-width: 280px; max-width: 400px; }
//     .search-icon { position: absolute; left: var(--spacing-md); top: 50%; transform: translateY(-50%); color: var(--text-tertiary); }
//     .search-input {
//       width: 100%; padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) 2.5rem;
//       background: var(--bg-primary); border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--ui-border-radius); color: var(--text-primary); font-size: 0.875rem; outline: none; transition: var(--transition-base);
//     }
//     .search-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 15%, transparent); }

//     .stats-badges { display: flex; gap: var(--spacing-sm); flex-wrap: wrap; }
//     .stat-badge {
//       display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px;
//       border-radius: 999px; font-size: 0.75rem; font-weight: 600;
//     }
//     .bg-primary-light { background: color-mix(in srgb, var(--color-primary) 15%, transparent); }
//     .text-primary { color: var(--color-primary); }
//     .bg-success-light { background: color-mix(in srgb, var(--color-success) 15%, transparent); }
//     .text-success { color: var(--color-success); }
//     .bg-error-light { background: color-mix(in srgb, var(--color-error) 15%, transparent); }
//     .text-error { color: var(--color-error); }

//     /* Main Container & States */
//     .tree-container {
//       background: var(--bg-primary); border-radius: var(--ui-border-radius-lg);
//       border: var(--ui-border-width) solid var(--border-primary); min-height: 400px;
//     }
//     .loading-state, .empty-state {
//       display: flex; flex-direction: column; align-items: center; justify-content: center;
//       padding: var(--spacing-5xl) var(--spacing-xl); text-align: center;
//     }

//     /* Custom Tree Hierarchy Styling */
//     .custom-tree { padding: var(--spacing-lg) 0; }
//     .node-wrapper { position: relative; }
    
//     .node-row {
//       display: flex; align-items: center; padding: var(--spacing-xs) var(--spacing-xl);
//       gap: var(--spacing-sm); transition: var(--transition-base);
//     }
//     .node-row:hover .node-content { border-color: var(--color-primary); box-shadow: var(--shadow-sm); }
//     .node-row:hover .node-content { background-color: var(--bg-secondary); }

//     /* Toggle Button */
//     .node-toggle {
//       width: 28px; height: 28px; border-radius: 4px; display: flex; align-items: center; justify-content: center;
//       background: transparent; border: none; cursor: pointer; color: var(--text-tertiary); transition: var(--transition-base); flex-shrink: 0;
//     }
//     .node-toggle:hover { background: var(--border-primary); color: var(--text-primary); }

//     /* Node Content Card */
//     .node-content {
//       flex: 1; display: flex; justify-content: space-between; align-items: center;
//       padding: var(--spacing-sm) var(--spacing-xl); background: var(--bg-primary);
//       border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg);
//       transition: var(--transition-base);
//     }

//     .node-info-main { display: flex; align-items: center; gap: var(--spacing-lg); }
    
//     .node-thumbnail {
//       width: 48px; height: 48px; border-radius: var(--ui-border-radius);
//       overflow: hidden; flex-shrink: 0; border: 1px solid var(--border-secondary);
//     }
//     .node-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
    
//     .node-icon-box {
//       width: 48px; height: 48px; border-radius: var(--ui-border-radius);
//       background: var(--bg-ternary); color: var(--text-secondary);
//       display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;
//     }

//     .node-text { display: flex; flex-direction: column; justify-content: center; }
//     .node-header { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: 2px; }
//     .node-name { font-size: 1rem; font-weight: 600; color: var(--text-primary); font-family: var(--font-heading); }
    
//     .status-indicator { width: 8px; height: 8px; border-radius: 50%; }
//     .bg-success { background-color: var(--color-success); }
//     .bg-error { background-color: var(--color-error); }

//     .node-meta { display: flex; align-items: center; gap: var(--spacing-xs); font-size: 0.75rem; color: var(--text-tertiary); }
//     .meta-dot { font-size: 0.5rem; opacity: 0.5; }
//     .node-children-count { color: var(--color-primary); font-weight: 500; }

//     /* Node Actions */
//     .node-actions { display: flex; align-items: center; gap: var(--spacing-xl); }
//     .date-created { font-size: 0.75rem; color: var(--text-tertiary); }
//     .date-created i { font-size: 0.7rem; margin-right: 2px; }
    
//     .btn-view-courses {
//       display: inline-flex; align-items: center; gap: var(--spacing-xs);
//       padding: var(--spacing-xs) var(--spacing-md);
//       font-size: 0.75rem; font-weight: 600; color: var(--color-primary);
//       background: color-mix(in srgb, var(--color-primary) 10%, transparent);
//       border-radius: 999px; text-decoration: none; transition: var(--transition-base);
//     }
//     .btn-view-courses:hover { background: var(--color-primary); color: #fff; }

//     /* Children Indentation Lines */
//     .node-children { position: relative; }
    
//     @media (max-width: 768px) {
//       .page-container { padding: var(--spacing-lg); }
//       .toolbar-section { flex-direction: column; align-items: stretch; }
//       .search-wrapper { max-width: none; }
//       .node-content { flex-direction: column; align-items: flex-start; gap: var(--spacing-md); }
//       .node-actions { width: 100%; justify-content: flex-end; border-top: 1px solid var(--border-secondary); padding-top: var(--spacing-sm); }
//     }
//   `]
// })
// export class CategoryTreeComponent implements OnInit, OnDestroy {
//   private categoryService = inject(CategoryService);

//   // Core Data
//   originalData: TreeNode[] = [];
//   treeData: TreeNode[] = [];
  
//   // State
//   loading = true;
//   searchTerm = '';
//   hasVisibleNodes = true;

//   // Stats
//   stats = {
//     total: 0,
//     active: 0,
//     inactive: 0
//   };

//   private subscriptions: Subscription[] = [];
//   private searchTimeout: any;

//   ngOnInit(): void {
//     this.loadCategoryTree();
//   }

//   ngOnDestroy(): void {
//     this.subscriptions.forEach(sub => sub.unsubscribe());
//     if (this.searchTimeout) clearTimeout(this.searchTimeout);
//   }

//   loadCategoryTree(): void {
//     this.loading = true;
//     const sub = this.categoryService.getCategoryTree().subscribe({
//       next: (res) => {
//         // Extract array correctly based on API shape
//         const rawCategories = res?.data?.categories || res?.data || [];
//         const categories = Array.isArray(rawCategories) ? rawCategories : [];
        
//         // Transform the raw API array into our UI TreeNode structure
//         this.originalData = this.buildTreeNodes(categories);
//         this.treeData = JSON.parse(JSON.stringify(this.originalData)); // Deep clone for UI state separation
        
//         this.calculateStats(categories);
//         this.filterTree(); // Apply any existing filters immediately
//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Failed to load category tree', error);
//         this.loading = false;
//       }
//     });
//     this.subscriptions.push(sub);
//   }

//   /**
//    * Recursively transform raw API data into UI nodes.
//    * Auto-expands the first two levels by default.
//    */
//   private buildTreeNodes(categories: any[], level: number = 0): TreeNode[] {
//     return categories.map(cat => ({
//       _id: cat._id,
//       name: cat.name || 'Unnamed',
//       description: cat.description || '',
//       slug: cat.slug || '',
//       icon: cat.icon || '',
//       image: cat.image || '',
//       isActive: cat.isActive !== false,
//       createdAt: cat.createdAt || new Date().toISOString(),
//       expanded: level < 1, // Auto expand top-level nodes
//       hidden: false,
//       children: cat.children?.length ? this.buildTreeNodes(cat.children, level + 1) : []
//     }));
//   }

//   /**
//    * Calculate exact recursive stats directly from raw data
//    */
//   private calculateStats(categories: any[]): void {
//     let total = 0;
//     let active = 0;

//     const countNodes = (nodes: any[]) => {
//       for (const node of nodes) {
//         total++;
//         if (node.isActive !== false) active++;
//         if (node.children?.length) countNodes(node.children);
//       }
//     };

//     countNodes(categories);

//     this.stats = {
//       total,
//       active,
//       inactive: total - active
//     };
//   }

//   /**
//    * Toggle expanded state of a specific node
//    */
//   toggleNode(node: TreeNode): void {
//     if (node.children && node.children.length > 0) {
//       node.expanded = !node.expanded;
//     }
//   }

//   /**
//    * Expand all nodes recursively
//    */
//   expandAll(): void {
//     const expand = (nodes: TreeNode[]) => {
//       nodes.forEach(node => {
//         if (node.children?.length) {
//           node.expanded = true;
//           expand(node.children);
//         }
//       });
//     };
//     expand(this.treeData);
//   }

//   /**
//    * Collapse all nodes recursively
//    */
//   collapseAll(): void {
//     const collapse = (nodes: TreeNode[]) => {
//       nodes.forEach(node => {
//         node.expanded = false;
//         if (node.children?.length) collapse(node.children);
//       });
//     };
//     collapse(this.treeData);
//   }

//   /**
//    * Recursively filter tree based on search term.
//    * If a child matches, its parents must be kept visible and auto-expanded.
//    */
//   filterTree(): void {
//     if (this.searchTimeout) clearTimeout(this.searchTimeout);
    
//     this.searchTimeout = setTimeout(() => {
//       if (!this.searchTerm || !this.searchTerm.trim()) {
//         // Reset all hidden flags
//         const resetHidden = (nodes: any[]) => {
//           nodes.forEach(n => {
//             n.hidden = false;
//             if (n.children) resetHidden(n.children);
//           });
//         };
//         resetHidden(this.treeData);
//         this.hasVisibleNodes = this.treeData.length > 0;
//         return;
//       }

//       const term = this.searchTerm.toLowerCase().trim();
//       let anyVisible = false;

//       const filterRecursive = (nodes: any[]): boolean => {
//         let hasVisibleChildInArray = false;

//         for (const node of nodes) {
//           // Check if current node matches
//           const matches = 
//             node.name.toLowerCase().includes(term) ||
//             node.slug.toLowerCase().includes(term) ||
//             node.description.toLowerCase().includes(term);

//           // Recursively check children
//           const childrenHasMatch = node.children?.length ? filterRecursive(node.children) : false;

//           // Node is visible if it matches OR if any of its children match
//           node.hidden = !(matches || childrenHasMatch);

//           if (!node.hidden) {
//             hasVisibleChildInArray = true;
//             // Auto-expand if a child matched so the user can see the result
//             if (childrenHasMatch) node.expanded = true; 
//           }
//         }

//         return hasVisibleChildInArray;
//       };

//       anyVisible = filterRecursive(this.treeData);
//       this.hasVisibleNodes = anyVisible;
      
//     }, 300);
//   }
// }

