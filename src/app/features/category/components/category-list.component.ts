// category-list.component.ts
import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { TreeTableModule } from 'primeng/treetable';
import { TreeModule } from 'primeng/tree';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService, TreeNode } from 'primeng/api';
import { SelectModule } from 'primeng/select';

import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ApiService } from '../../../core/services/master-service';
import { CategoryService } from '../../../core/services/category.service';

@Component({
    selector: 'app-category-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        TreeTableModule,
        TreeModule,
        ButtonModule,
        InputTextModule,
        TagModule,
        ConfirmDialogModule,
        ToastModule,
        ToolbarModule,
        DialogModule,
        SelectModule,
        ToggleSwitchModule    // CategoryFormComponent
    ],
    providers: [ConfirmationService, MessageService],
    template: `
    <div class="category-list-container">
      <p-toast position="top-right"></p-toast>
      <p-confirmDialog></p-confirmDialog>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <h2 class="page-title">Category Management</h2>
          <span class="total-count">{{ totalCategories }} total categories</span>
        </div>
        <div class="toolbar-right">
          <button pButton pRipple label="Expand All" icon="pi pi-plus" class="p-button-outlined mr-2" (click)="expandAll()"></button>
          <button pButton pRipple label="Collapse All" icon="pi pi-minus" class="p-button-outlined mr-2" (click)="collapseAll()"></button>
          <button pButton pRipple label="Add Category" icon="pi pi-plus" class="p-button-success" (click)="openNewCategoryDialog()"></button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-item">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input pInputText 
                   [(ngModel)]="filters.search" 
                   (ngModelChange)="onSearchChange()"
                   placeholder="Search categories..." 
                   class="search-input">
          </span>
        </div>
        <div class="filter-item">
          <p-select 
            [options]="statusOptions" 
            [(ngModel)]="filters.status" 
            (onChange)="loadCategories()"
            placeholder="Filter by Status"
            optionLabel="label"
            optionValue="value"
            [showClear]="true">
          </p-select>
        </div>
        <button pButton pRipple icon="pi pi-filter-slash" label="Clear" class="p-button-outlined" (click)="clearFilters()"></button>
      </div>

      <!-- Category Tree Table -->
      <p-treeTable 
        #tt
        [value]="categoryTree"
        [columns]="cols"
        [loading]="loading"
        [scrollable]="true"
        [scrollHeight]="'calc(100vh - 300px)'"
        [paginator]="false"
        styleClass="p-treetable-sm"
        dataKey="_id"
        [(selection)]="selectedCategories"
        (onNodeExpand)="onNodeExpand($event)"
        (onNodeCollapse)="onNodeCollapse($event)">

        <ng-template pTemplate="caption">
          <div class="table-header">
            <div class="header-left">
              <i class="pi pi-tags"></i>
              <span>Category Hierarchy</span>
            </div>
            <div class="header-right">
              <span class="expanded-nodes">{{ expandedNodes }} nodes expanded</span>
            </div>
          </div>
        </ng-template>

        <ng-template pTemplate="header">
          <tr>
            <th *ngFor="let col of cols" [style.width]="col.width">{{ col.header }}</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-rowNode let-rowData="rowData">
          <tr [ttRow]="rowNode" [ttSelectableRow]="rowNode" >
            <!-- [ttSelectableRowIndex]="rowData.index" -->
            <td *ngFor="let col of cols; let i = index" [style.width]="col.width">
              <div class="category-cell" [class.has-children]="rowNode.children && rowNode.children.length">
                @if (i === 0) {
                  <p-treeTableToggler [rowNode]="rowNode" class="mr-2"></p-treeTableToggler>
                }
                
                @if (col.field === 'name') {
                  <div class="category-info">
                    @if (rowData.icon) {
                      <i class="category-icon" [class]="rowData.icon"></i>
                    } @else {
                      <i class="pi pi-folder category-icon"></i>
                    }
                    <span class="category-name">{{ rowData.name }}</span>
                    @if (rowData.slug) {
                      <span class="category-slug">({{ rowData.slug }})</span>
                    }
                  </div>
                }

                @if (col.field === 'isActive') {
                  <p-tag 
                    [value]="rowData.isActive ? 'Active' : 'Inactive'" 
                    [severity]="rowData.isActive ? 'success' : 'danger'"
                    [rounded]="true">
                  </p-tag>
                }

                @if (col.field === 'courses') {
                  <span class="course-count">
                    <i class="pi pi-book"></i>
                    {{ rowData.courseCount || 0 }}
                  </span>
                }

                @if (col.field === 'createdAt') {
                  <span class="date-cell">{{ rowData.createdAt | date:'mediumDate' }}</span>
                }

                @if (col.field === 'actions') {
                  <div class="action-buttons">
                    <button pButton pRipple icon="pi pi-eye" class="p-button-rounded p-button-outlined p-button-info" 
                            (click)="viewCategory(rowData)" pTooltip="View Details"></button>
                    <button pButton pRipple icon="pi pi-pencil" class="p-button-rounded p-button-outlined p-button-success" 
                            (click)="editCategory(rowData)" pTooltip="Edit Category"></button>
                    <button pButton pRipple icon="pi pi-plus" class="p-button-rounded p-button-outlined p-button-primary" 
                            (click)="addSubCategory(rowData)" pTooltip="Add Subcategory"></button>
                    <button pButton pRipple icon="pi pi-trash" class="p-button-rounded p-button-outlined p-button-danger" 
                            (click)="deleteCategory(rowData)" pTooltip="Delete Category"></button>
                  </div>
                }
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="cols.length" class="text-center p-4">
              <div class="empty-state">
                <i class="pi pi-tags" style="font-size: 3rem; color: var(--text-secondary)"></i>
                <h3>No categories found</h3>
                <p>Get started by creating your first category.</p>
                <button pButton pRipple label="Add Category" icon="pi pi-plus" (click)="openNewCategoryDialog()"></button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-treeTable>

      <!-- Category Form Dialog -->
      <p-dialog 
        [(visible)]="showFormDialog" 
        [style]="{width: '600px'}" 
        [header]="dialogTitle"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        [closeOnEscape]="true"
        [dismissableMask]="true">
        <!-- <app-category-form 
          [categoryId]="selectedCategoryId"
          [parentCategoryId]="parentCategoryId"
          (saved)="onCategorySaved($event)"
          (cancelled)="closeDialog()">
        </app-category-form> -->
      </p-dialog>

      <!-- Category Detail Dialog -->
      <p-dialog 
        [(visible)]="showDetailDialog" 
        [style]="{width: '700px'}" 
        header="Category Details"
        [modal]="true"
        [draggable]="false"
        [resizable]="false">
        @if (selectedCategory) {
          <!-- <app-category-detail 
            [category]="selectedCategory"
            (edit)="editFromDetail()"
            (close)="closeDetailDialog()">
          </app-category-detail> -->
        }
      </p-dialog>
    </div>
  `,
    styles: [`
    .category-list-container {
      padding: var(--spacing-xl);
      background: var(--bg-primary);
      min-height: 100vh;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
    }

    .total-count {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      background: var(--bg-secondary);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--ui-border-radius);
    }

    .filters-section {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
      flex-wrap: wrap;
    }

    .search-input {
      width: 300px;
    }

    /* Table Header */
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--text-primary);
      font-weight: var(--font-weight-medium);
    }

    .header-right {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    /* Category Cell */
    .category-cell {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      min-height: 40px;
    }

    .category-cell.has-children {
      font-weight: var(--font-weight-medium);
    }

    .category-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .category-icon {
      color: var(--accent-primary);
      font-size: var(--font-size-lg);
    }

    .category-name {
      color: var(--text-primary);
    }

    .category-slug {
      color: var(--text-tertiary);
      font-size: var(--font-size-xs);
    }

    .course-count {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .date-cell {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: var(--spacing-xs);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--spacing-3xl);
    }

    .empty-state h3 {
      color: var(--text-primary);
      margin: var(--spacing-md) 0 var(--spacing-xs);
    }

    .empty-state p {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xl);
    }

    /* PrimeNG Overrides */
    :host ::ng-deep {
      .p-treetable .p-treetable-tbody > tr {
        background: var(--bg-primary);
        transition: var(--transition-fast);
      }

      .p-treetable .p-treetable-tbody > tr:hover {
        background: var(--bg-hover);
      }

      .p-treetable .p-treetable-tbody > tr.p-highlight {
        background: var(--accent-focus);
      }

      .p-treetable .p-treetable-thead > tr > th {
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-weight: var(--font-weight-medium);
        padding: var(--spacing-md);
      }

      .p-treetable .p-treetable-tbody > tr > td {
        padding: var(--spacing-md);
        border-color: var(--border-secondary);
      }

      .p-tree-table-toggler {
        color: var(--text-secondary);
      }

      .p-tree-table-toggler:hover {
        color: var(--accent-primary);
      }
    }

    @media (max-width: 768px) {
      .category-list-container {
        padding: var(--spacing-md);
      }

      .toolbar {
        flex-direction: column;
        gap: var(--spacing-md);
        align-items: flex-start;
      }

      .filters-section {
        flex-direction: column;
      }

      .search-input {
        width: 100%;
      }

      .action-buttons {
        flex-wrap: wrap;
      }
    }
  `]
})
export class CategoryListComponent implements OnInit, OnDestroy {
    @ViewChild('tt') treeTable: any;

    private categoryService = inject(CategoryService);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);

    categoryTree:any
    selectedCategories: any[] = [];
    totalCategories = 0;
    expandedNodes = 0;
    loading = false;

    showFormDialog = false;
    showDetailDialog = false;
    selectedCategoryId: string | null = null;
    selectedCategory: any = null;
    parentCategoryId: string | null = null;
    dialogTitle = 'Add New Category';

    cols = [
        { field: 'name', header: 'Category Name', width: '30%' },
        { field: 'isActive', header: 'Status', width: '10%' },
        { field: 'courses', header: 'Courses', width: '15%' },
        { field: 'createdAt', header: 'Created', width: '20%' },
        { field: 'actions', header: 'Actions', width: '25%' }
    ];

    filters = {
        search: '',
        status: null
    };

    statusOptions = [
        { label: 'Active', value: true },
        { label: 'Inactive', value: false }
    ];

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

        const sub = this.categoryService.getCategoryTree(params).subscribe({
            next: (res) => {
                this.categoryTree = this.buildTreeNodes(res?.data?.categories);
                this.totalCategories = this.countCategories(res?.data?.categories);
                this.loading = false;
            },
            error: (error) => {
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

    private buildTreeNodes(categories: any, level: number = 0): TreeNode[] {
        return categories.map((cat:any) => ({
            data: {
                _id: cat._id,
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                icon: cat.icon,
                image: cat.image,
                isActive: cat.isActive,
                parentCategory: cat.parentCategory,
                courseCount: cat.courseCount || 0,
                createdAt: cat.createdAt,
                updatedAt: cat.updatedAt
            },
            children: cat.children?.length ? this.buildTreeNodes(cat.children, level + 1) : [],
            expanded: level < 2, // Auto-expand first two levels
            leaf: !cat.children?.length
        }));
    }

    private countCategories(categories: any): number {
        let count = categories.length;
        categories.forEach((cat:any) => {
            if (cat.children) {
                count += this.countCategories(cat.children);
            }
        });
        return count;
    }

    onNodeExpand(event: any): void {
        this.expandedNodes++;
    }

    onNodeCollapse(event: any): void {
        this.expandedNodes--;
    }

    expandAll(): void {
        this.categoryTree.forEach((node:any) => {
            this.expandNode(node);
        });
    }

    private expandNode(node: TreeNode): void {
        node.expanded = true;
        if (node.children) {
            node.children.forEach(child => this.expandNode(child));
        }
    }

    collapseAll(): void {
        this.categoryTree.forEach((node:any) => {
            node.expanded = false;
        });
        this.expandedNodes = 0;
    }

    onSearchChange(): void {
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.loadCategories();
        }, 500);
    }

    clearFilters(): void {
        this.filters = {
            search: '',
            status: null
        };
        this.loadCategories();
    }

    // Dialog Actions
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
                    error: (error) => {
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