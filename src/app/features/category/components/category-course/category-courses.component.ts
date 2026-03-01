import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-courses',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    NgClass
  ],
  templateUrl: './category-courses.component.html',
  styleUrls: ['./category-courses.component.scss']
})
export class CategoryCoursesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private categoryService = inject(CategoryService);
  private destroyRef = inject(DestroyRef);

  // State Signals
  loading = signal<boolean>(true);
  category = signal<any>(null);
  courses = signal<any[]>([]);

  // Filter & Pagination Signals
  searchQuery = signal<string>('');
  selectedLevel = signal<string | null>(null);
  selectedSort = signal<string>('newest');
  currentPage = signal<number>(1);
  pageSize = signal<number>(12);

  // Dropdown Options
  levelOptions = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
    { label: 'All Levels', value: 'all-levels' }
  ];

  sortOptions = [
    { label: 'Newest', value: 'newest' },
    { label: 'Popular', value: 'popular' },
    { label: 'Highest Rated', value: 'rating' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' }
  ];

  // Computed Derived State (Automatically reacts to signal changes)
  filteredAndSortedCourses = computed(() => {
    let filtered = this.courses();
    const search = this.searchQuery().toLowerCase();
    const level = this.selectedLevel();
    const sort = this.selectedSort();

    if (search) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(search) ||
        course.subtitle?.toLowerCase().includes(search) ||
        course.description?.toLowerCase().includes(search)
      );
    }

    if (level && level !== 'all-levels') {
      filtered = filtered.filter(course => course.level === level);
    }

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'newest':
          if (!a.createdAt || !b.createdAt) return a.title.localeCompare(b.title);
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'popular': return (b.totalEnrollments || 0) - (a.totalEnrollments || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'price_asc': return (a.isFree ? 0 : a.price) - (b.isFree ? 0 : b.price);
        case 'price_desc': return (b.isFree ? 0 : b.price) - (a.isFree ? 0 : a.price);
        default: return 0;
      }
    });
  });

  totalPages = computed(() => Math.ceil(this.filteredAndSortedCourses().length / this.pageSize()) || 1);
  
  paginatedCourses = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredAndSortedCourses().slice(start, start + this.pageSize());
  });

  visiblePages = computed(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage() - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages(), start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const categoryId = params['id'];
      if (categoryId) this.loadCategoryWithCourses(categoryId);
    });
  }

  loadCategoryWithCourses(categoryId: string): void {
    this.loading.set(true);
    this.categoryService.getCategoryWithCourses(categoryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.category.set(res.data?.category || null);
          this.courses.set(res.data?.courses || []);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to load category courses', error);
          this.loading.set(false);
        }
      });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  onLevelChange(value: string | null): void {
    this.selectedLevel.set(value);
    this.currentPage.set(1);
  }

  onSortChange(value: string): void {
    this.selectedSort.set(value);
    this.currentPage.set(1);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      document.querySelector('.ultimate-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}