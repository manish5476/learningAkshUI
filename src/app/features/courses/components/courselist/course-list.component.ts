import { Category } from "./../../../../core/models/course.model";
import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';

import { CourseService } from '../../../../core/services/course.service';
import { Course, CourseQueryParams } from '../../../../core/models/course.model';
import { PropertyCourseCardComponent } from '../../../../shared/components/course-card.component';
import { CategoryService } from "../../../../core/services/category.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AuthService } from "../../../../core/services/auth.service"; // <-- IMPORT AUTH SERVICE

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    SkeletonModule,
    ToastModule,
    PropertyCourseCardComponent
  ],
  providers: [MessageService],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss']
})
export class CourseListComponent implements OnInit {

  private courseService = inject(CourseService);
  private categoryService = inject(CategoryService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService); // <-- INJECT AUTH SERVICE

  /* ========================
     FILTER STATE
  ======================== */
  filters: CourseQueryParams = {
    page: 1,
    limit: 12,
    sort: '-createdAt',
    isPublished: true,
    isApproved: true
  };

  /* ========================
     SIGNALS
  ======================== */
  courses = signal<Course[]>([]);
  loading = signal<boolean>(true);
  categories = signal<Category[]>([]);
  currentUser = signal<any>(null); // <-- STORE CURRENT USER

  pagination = signal({
    page: 1,
    limit: 12,
    totalResults: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  // <-- COMPUTED SIGNAL FOR PERMISSIONS
  canManageCourses = computed(() => {
    const user = this.currentUser();
    return user && (user.role === 'admin' || user.role === 'instructor');
  });

  /* ========================
     OPTIONS
  ======================== */
  levelOptions = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Advanced', value: 'advanced' },
    { label: 'All Levels', value: 'all-levels' }
  ];

  sortOptions = [
    { label: 'Newest First', value: '-createdAt' },
    { label: 'Price: Low → High', value: 'price' },
    { label: 'Price: High → Low', value: '-price' },
    { label: 'Most Popular', value: '-totalEnrollments' },
    { label: 'Top Rated', value: '-rating' }
  ];

  ngOnInit(): void {
    // Listen to Auth State
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => this.currentUser.set(user));

    this.loadCategories();
    this.loadCourses();
  }


  private loadCategories(): void {
    this.categoryService.getAllCategories({ isActive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.categories.set(res?.data?.data || res?.data || []);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load categories' });
        }
      });
  }

loadCourses(): void {
    this.loading.set(true);
    const params: CourseQueryParams = {};
    Object.entries(this.filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        (params as any)[key] = value;
      }
    });

    this.courseService.getAllCourses(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          // 1. Safely extract the array (handles variations in backend nesting)
          const coursesData = response?.data?.data || response?.data?.courses || response?.data || response || [];
          this.courses.set(Array.isArray(coursesData) ? coursesData : []);

          // 2. THE FIX: Provide a safe fallback so pagination is NEVER undefined
          const safePagination = response?.pagination || {
            page: 1,
            limit: 12,
            totalResults: this.courses().length || 0,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          };
          
          this.pagination.set(safePagination);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load courses' });
        }
      });
  }
  onFilterChange(): void {
    this.filters.page = 1;
    this.loadCourses();
  }

  clearFilters(): void {
    this.filters = { page: 1, limit: 12, sort: '-createdAt', isPublished: true, isApproved: true };
    this.loadCourses();
  }

  changePage(page: number): void {
    this.filters.page = page;
    this.loadCourses();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.search || this.filters.category || this.filters.level);
  }
}