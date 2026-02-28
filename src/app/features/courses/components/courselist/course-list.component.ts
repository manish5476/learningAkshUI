import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DecimalPipe, TitleCasePipe, NgClass } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Models & Services
import { Course, Category } from '../../../../core/models/course.model';
import { CategoryService } from '../../../../core/services/category.service';
import { CourseService } from '../../../../core/services/course.service';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    TitleCasePipe,
    NgClass
  ],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss']
})
export class CourseListComponent implements OnInit {
  private router = inject(Router);
  private courseService = inject(CourseService);
  private categoryService = inject(CategoryService);
  private destroyRef = inject(DestroyRef);

  // State Signals
  courses = signal<Course[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(true);
  isInstructorMode = signal<boolean>(false);
  expandedRows = signal<Set<string>>(new Set());

  // Filter & Sort Signals
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('');
  selectedLevel = signal<string>('');
  sortConfig = signal<{ field: keyof Course | '', order: number }>({ field: '', order: 1 });

  levels = ['beginner', 'intermediate', 'advanced', 'all-levels'];

  // Computed: Stats dynamically derived from the courses array
  stats = computed(() => {
    const data = this.courses();
    const total = data.length;
    const students = data.reduce((acc, c) => acc + (c.totalEnrollments || 0), 0);
    const avgRating = data.reduce((acc, c) => acc + (c.rating || 0), 0) / (total || 1);
    const revenue = data.reduce((acc, c) => acc + ((c.totalEnrollments || 0) * (c.price || 0)), 0);

    return { 
      total, 
      students, 
      rating: isNaN(avgRating) ? 0 : avgRating, 
      revenue 
    };
  });

  // Computed: Auto-filters and sorts the table based on signals
  filteredAndSortedCourses = computed(() => {
    let result = this.courses();
    const search = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    const level = this.selectedLevel();
    const sort = this.sortConfig();

    if (search) {
      result = result.filter(c => 
        c.title?.toLowerCase().includes(search) ||
        c.category?.name?.toLowerCase().includes(search) ||
        c.instructor?.firstName?.toLowerCase().includes(search) ||
        c.level?.toLowerCase().includes(search)
      );
    }

    if (category) {
      result = result.filter(c => c.category?.name === category);
    }

    if (level) {
      result = result.filter(c => c.level === level);
    }

    if (sort.field) {
      result = [...result].sort((a: any, b: any) => {
        const valA = a[sort.field];
        const valB = b[sort.field];
        if (valA < valB) return -1 * sort.order;
        if (valA > valB) return 1 * sort.order;
        return 0;
      });
    }

    return result;
  });

  ngOnInit(): void {
    this.isInstructorMode.set(this.router.url.includes('/instructor'));
    this.loadCategories();
    this.loadCourses();
  }

  private loadCategories(): void {
    this.categoryService.getAll({ isActive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.categories.set(res?.data?.data || res?.data || []);
        }
      });
  }

  private loadCourses(): void {
    this.isLoading.set(true);
    const queryParams = this.isInstructorMode() ? {} : { isPublished: true };
    
    this.courseService.getAll(queryParams)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const payload = res?.data;
          const coursesData = payload?.data || payload || [];
          this.courses.set(Array.isArray(coursesData) ? coursesData : []);
          this.isLoading.set(false);
        },
        error: (error: any) => {
          console.error('Failed to load courses', error);
          this.courses.set([]);
          this.isLoading.set(false);
        }
      });
  }

  // --- Handlers ---

  toggleRow(courseId: string | undefined): void {
    if (!courseId) return;
    const current = new Set(this.expandedRows());
    if (current.has(courseId)) {
      current.delete(courseId);
    } else {
      current.add(courseId);
    }
    this.expandedRows.set(current);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.selectedLevel.set('');
    this.sortConfig.set({ field: '', order: 1 });
  }

  onGlobalFilter(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onCategoryFilter(event: Event): void {
    this.selectedCategory.set((event.target as HTMLSelectElement).value);
  }

  onLevelFilter(event: Event): void {
    this.selectedLevel.set((event.target as HTMLSelectElement).value);
  }

  sortBy(field: keyof Course): void {
    const current = this.sortConfig();
    const order = current.field === field ? current.order * -1 : 1;
    this.sortConfig.set({ field, order });
  }

  // --- Helpers & Actions ---

  getCourseStatusLabel(course: Course): string {
    if (course.isPublished && course.isApproved) return 'Published';
    if (course.isPublished && !course.isApproved) return 'Pending';
    return 'Draft';
  }

  getStatusClasses(course: Course): string {
    if (course.isPublished && course.isApproved) return 'status-published';
    if (course.isPublished && !course.isApproved) return 'status-pending';
    return 'status-draft';
  }

  publishCourse(course: Course): void {
    if (!confirm(`Are you sure you want to publish "${course.title}"?`)) return;

    this.courseService.publish(course._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Reactively update the specific course in the signal array
          this.courses.update(courses => 
            courses.map(c => c._id === course._id ? { ...c, isPublished: true } : c)
          );
        },
        error: (error: any) => console.error('Failed to publish course', error)
      });
  }

  deleteCourse(course: Course): void {
    if (!confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) return;

    this.courseService.delete(course._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.courses.update(courses => courses.filter(c => c._id !== course._id));
        },
        error: (error: any) => console.error('Failed to delete course', error)
      });
  }
}