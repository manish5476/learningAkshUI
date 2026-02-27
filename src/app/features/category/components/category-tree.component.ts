// category-tree.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { TreeModule } from 'primeng/tree';
import { TreeTableModule } from 'primeng/treetable';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { TreeNode, MessageService } from 'primeng/api';
import { CategoryService } from '../../../core/services/category.service';
import { DurationPipe } from '../../../core/pipes/duration.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TreeModule,
    TreeTableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    BreadcrumbModule,
    DurationPipe,FormsModule
  ],
  providers: [MessageService],
  template: `
    <div class="category-tree-container">
      <p-toast position="top-right"></p-toast>

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">
            <i class="pi pi-sitemap"></i>
            Category Tree
          </h1>
          <p-breadcrumb [model]="breadcrumbItems" [home]="home"></p-breadcrumb>
        </div>
        <div class="header-actions">
          <button pButton pRipple 
                  icon="pi pi-refresh" 
                  label="Refresh" 
                  class="p-button-outlined p-button-sm"
                  (click)="loadCategoryTree()">
          </button>
          <button pButton pRipple 
                  icon="pi pi-expand" 
                  label="Expand All" 
                  class="p-button-outlined p-button-sm"
                  (click)="expandAll()">
          </button>
          <button pButton pRipple 
                  icon="pi pi-minus" 
                  label="Collapse All" 
                  class="p-button-outlined p-button-sm"
                  (click)="collapseAll()">
          </button>
        </div>
      </div>

      <!-- Search -->
      <div class="search-section">
        <span class="p-input-icon-left search-wrapper">
          <i class="pi pi-search"></i>
          <input pInputText 
                 type="text" 
                 [(ngModel)]="searchTerm" 
                 (ngModelChange)="filterTree()"
                 placeholder="Search categories..." 
                 class="search-input">
        </span>
        <span class="stats-badge">
          <i class="pi pi-tags"></i>
          {{ totalCategories }} categories
        </span>
      </div>

      <!-- Loading State -->
      @if (loading) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading category tree...</p>
        </div>
      } @else {
        <!-- Tree View -->
        <div class="tree-view">
          <p-tree 
            [value]="filteredTree" 
            [loading]="loading"
            loadingMode="icon"
            [loadingIcon]="'pi pi-spin pi-spinner'"
            [filter]="true"
            filterMode="lenient"
            [filterBy]="'data.name'"
            [propagateSelectionUp]="false"
            [propagateSelectionDown]="false"
            class="category-tree"
            [(selection)]="selectedNode"
            selectionMode="single"
            (onNodeSelect)="onNodeSelect($event)">
            
            <ng-template let-node pTemplate="default">
              <div class="tree-node-content">
                <div class="node-info">
                  @if (node.data.icon) {
                    <i class="node-icon" [class]="node.data.icon"></i>
                  } @else {
                    <i class="pi pi-folder node-icon" 
                       [class.has-children]="node.children && node.children.length"></i>
                  }
                  
                  <span class="node-name">{{ node.data.name }}</span>
                  
                  @if (node.data.slug) {
                    <span class="node-slug">({{ node.data.slug }})</span>
                  }

                  @if (!node.data.isActive) {
                    <p-tag value="Inactive" severity="danger" [rounded]="true" styleClass="node-status"></p-tag>
                  }
                </div>

                <div class="node-meta">
                  <span class="meta-item" pTooltip="Courses" tooltipPosition="top">
                    <i class="pi pi-book"></i>
                    {{ node.data.courseCount || 0 }}
                  </span>
                  
                  @if (node.data.createdAt) {
                    <span class="meta-item" pTooltip="Created" tooltipPosition="top">
                      <i class="pi pi-calendar"></i>
                      {{ node.data.createdAt | date:'shortDate' }}
                    </span>
                  }

                  <div class="node-actions">
                    <button pButton pRipple 
                            icon="pi pi-eye" 
                            class="p-button-rounded p-button-text p-button-sm"
                            [routerLink]="['/categories', node.data._id, 'courses']"
                            pTooltip="View Courses">
                    </button>
                  </div>
                </div>
              </div>
            </ng-template>
          </p-tree>
        </div>

        <!-- Empty State -->
        @if (filteredTree.length === 0) {
          <div class="empty-state">
            <i class="pi pi-sitemap" style="font-size: 4rem; color: var(--text-tertiary)"></i>
            <h3>No Categories Found</h3>
            <p>{{ searchTerm ? 'No matching categories found.' : 'The category tree is empty.' }}</p>
            @if (!searchTerm) {
              <button pButton pRipple 
                      label="Refresh" 
                      icon="pi pi-refresh" 
                      (click)="loadCategoryTree()">
              </button>
            }
          </div>
        }

        <!-- Stats Footer -->
        <div class="tree-footer">
          <div class="footer-stats">
            <div class="stat">
              <span class="stat-label">Total Categories:</span>
              <span class="stat-value">{{ totalCategories }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Top Level:</span>
              <span class="stat-value">{{ topLevelCount }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Active:</span>
              <span class="stat-value">{{ activeCount }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Inactive:</span>
              <span class="stat-value">{{ inactiveCount }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .category-tree-container {
      padding: var(--spacing-2xl);
      min-height: 100vh;
      background: var(--bg-primary);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
      flex-wrap: wrap;
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .page-title i {
      color: var(--accent-primary);
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-sm);
    }

    /* Search Section */
    .search-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .search-wrapper {
      flex: 1;
      max-width: 400px;
    }

    .search-input {
      width: 100%;
      padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) 2.5rem;
    }

    .stats-badge {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-lg);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius);
      color: var(--text-primary);
      font-weight: var(--font-weight-medium);
    }

    .stats-badge i {
      color: var(--accent-primary);
    }

    /* Loading State */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-3xl);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-lg);
      color: var(--text-secondary);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-secondary);
      border-top-color: var(--accent-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: var(--spacing-md);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Tree View */
    .tree-view {
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg);
      min-height: 400px;
    }

    :host ::ng-deep .category-tree {
      border: none;
      background: transparent;
    }

    :host ::ng-deep .p-tree .p-tree-container .p-treenode {
      padding: var(--spacing-xs) 0;
    }

    :host ::ng-deep .p-tree .p-tree-container .p-treenode .p-treenode-content {
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--ui-border-radius);
      transition: var(--transition-base);
    }

    :host ::ng-deep .p-tree .p-tree-container .p-treenode .p-treenode-content:hover {
      background: var(--bg-hover);
    }

    :host ::ng-deep .p-tree .p-tree-container .p-treenode .p-treenode-content.p-highlight {
      background: var(--accent-focus);
      color: var(--text-primary);
    }

    :host ::ng-deep .p-tree .p-tree-toggler {
      color: var(--text-tertiary);
    }

    :host ::ng-deep .p-tree .p-tree-toggler:hover {
      color: var(--accent-primary);
    }

    /* Tree Node Content */
    .tree-node-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: var(--spacing-md);
    }

    .node-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .node-icon {
      font-size: var(--font-size-lg);
      color: var(--text-tertiary);
    }

    .node-icon.has-children {
      color: var(--accent-primary);
    }

    .node-name {
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
    }

    .node-slug {
      color: var(--text-tertiary);
      font-size: var(--font-size-xs);
    }

    .node-status {
      margin-left: var(--spacing-sm);
    }

    .node-meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
    }

    .meta-item i {
      font-size: var(--font-size-xs);
    }

    .node-actions {
      opacity: 0;
      transition: var(--transition-fast);
    }

    .p-treenode-content:hover .node-actions {
      opacity: 1;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--spacing-3xl);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-lg);
    }

    .empty-state h3 {
      color: var(--text-primary);
      margin: var(--spacing-md) 0 var(--spacing-xs);
    }

    .empty-state p {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xl);
    }

    /* Footer */
    .tree-footer {
      margin-top: var(--spacing-xl);
      padding: var(--spacing-lg);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-lg);
    }

    .footer-stats {
      display: flex;
      gap: var(--spacing-xl);
      flex-wrap: wrap;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .stat-label {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .stat-value {
      color: var(--text-primary);
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-lg);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .category-tree-container {
        padding: var(--spacing-md);
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .tree-node-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .node-meta {
        width: 100%;
        justify-content: space-between;
      }

      .node-actions {
        opacity: 1;
      }

      .footer-stats {
        flex-direction: column;
        gap: var(--spacing-md);
      }
    }
  `]
})
export class CategoryTreeComponent implements OnInit, OnDestroy {
  private categoryService = inject(CategoryService);
  private messageService = inject(MessageService);

  categories: any[] = [];
  filteredTree: TreeNode[] = [];
  originalTree: TreeNode[] = [];
  selectedNode: any = null;
  loading = true;
  searchTerm = '';

  totalCategories = 0;
  topLevelCount = 0;
  activeCount = 0;
  inactiveCount = 0;

  breadcrumbItems = [
    { label: 'Categories', routerLink: '/categories' },
    { label: 'Tree', routerLink: '/categories/tree' }
  ];
  
  home = { icon: 'pi pi-home', routerLink: '/' };

  private subscriptions: Subscription[] = [];
  private searchTimeout: any;

  ngOnInit(): void {
    this.loadCategoryTree();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  loadCategoryTree(): void {
    this.loading = true;
    const sub = this.categoryService.getCategoryTree().subscribe({
      next: (res) => {
        this.categories = res.data?.categories || [];
        this.originalTree = this.buildTreeNodes(res.data?.categories || []);
        this.filteredTree = [...this.originalTree];
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load category tree', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load category tree'
        });
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private buildTreeNodes(categories: any[], level: number = 0): TreeNode[] {
    return categories.map(cat => ({
      label: cat.name,
      data: {
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        image: cat.image,
        isActive: cat.isActive,
        courseCount: cat.courseCount || 0,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt
      },
      children: cat.children?.length ? this.buildTreeNodes(cat.children, level + 1) : [],
      expanded: level < 2,
      leaf: !cat.children?.length,
      key: cat._id
    }));
  }

  private calculateStats(): void {
    this.totalCategories = this.countCategories(this.categories);
    this.topLevelCount = this.categories.length;
    this.activeCount = this.countActive(this.categories);
    this.inactiveCount = this.totalCategories - this.activeCount;
  }

  private countCategories(categories: any[]): number {
    let count = categories.length;
    categories.forEach(cat => {
      if (cat.children) {
        count += this.countCategories(cat.children);
      }
    });
    return count;
  }

  private countActive(categories: any[]): number {
    let count = categories.filter(cat => cat.isActive).length;
    categories.forEach(cat => {
      if (cat.children) {
        count += this.countActive(cat.children);
      }
    });
    return count;
  }

  filterTree(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      if (!this.searchTerm.trim()) {
        this.filteredTree = [...this.originalTree];
        return;
      }

      const searchLower = this.searchTerm.toLowerCase();
      this.filteredTree = this.filterNodes(this.originalTree, searchLower);
    }, 300);
  }

  private filterNodes(nodes: TreeNode[], searchTerm: string): TreeNode[] {
    return nodes.reduce<TreeNode[]>((acc, node) => {
      const matches = node.data?.name?.toLowerCase().includes(searchTerm) ||
                     node.data?.slug?.toLowerCase().includes(searchTerm) ||
                     node.data?.description?.toLowerCase().includes(searchTerm);

      if (matches) {
        acc.push(node);
      } else if (node.children?.length) {
        const filteredChildren = this.filterNodes(node.children, searchTerm);
        if (filteredChildren.length) {
          acc.push({ ...node, children: filteredChildren, expanded: true });
        }
      }

      return acc;
    }, []);
  }

  expandAll(): void {
    this.originalTree.forEach(node => this.expandNode(node));
    this.filteredTree = [...this.originalTree];
  }

  private expandNode(node: TreeNode): void {
    node.expanded = true;
    if (node.children) {
      node.children.forEach(child => this.expandNode(child));
    }
  }

  collapseAll(): void {
    this.originalTree.forEach(node => node.expanded = false);
    this.filteredTree = [...this.originalTree];
  }

  onNodeSelect(event: any): void {
    // Handle node selection if needed
  }
}