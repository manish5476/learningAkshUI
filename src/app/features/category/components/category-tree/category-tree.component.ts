import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TreeNode } from 'primeng/api';

import { CategoryService } from '../../../../core/services/category.service';
import { Toast } from "primeng/toast";

@Component({
  selector: 'app-category-tree',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    // DatePipe,
    NgClass,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    Toast
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
  originalData = signal<any[]>([]);
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
          this.treeData.set(JSON.parse(JSON.stringify(builtNodes))); // Deep clone for reactive search

          this.calculateStats(categories);
          this.loading.set(false);

          if (this.searchTerm()) this.executeSearchFilter();
        },
        error: (error) => {
          console.error('Failed to load category tree', error);
          this.loading.set(false);
        }
      });
  }

  private buildTreeNodes(categories: any[], level: number = 0): any[] {
    return categories.map(cat => ({
      _id: cat._id,
      name: cat.name || 'Unnamed',
      description: cat.description || '',
      slug: cat.slug || '',
      icon: cat.icon || '',
      image: cat.image || '',
      isActive: cat.isActive !== false,
      createdAt: cat.createdAt || new Date().toISOString(),
      expanded: level < 1,
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

  toggleNode(node: any): void {
    if (node.children && node.children.length > 0) {
      node.expanded = !node.expanded;
      // Signal update trigger
      this.treeData.set([...this.treeData()]);
    }
  }

  expandAll(): void {
    const data = [...this.treeData()];
    const expand = (nodes: any[]) => {
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
    const collapse = (nodes: any[]) => {
      nodes.forEach(node => {
        node.expanded = false;
        if (node.children?.length) collapse(node.children);
      });
    };
    collapse(data);
    this.treeData.set(data);
  }

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
    const data = [...this.treeData()];

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
