import { Category } from "./../../../../core/models/course.model";
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
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

  pagination = signal({
    page: 1,
    limit: 12,
    totalResults: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
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
    this.loadCategories();
    this.loadCourses();
  }

  /* ========================
     LOAD CATEGORIES
  ======================== */
  private loadCategories(): void {
    this.categoryService.getAllCategories({ isActive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.categories.set(res?.data?.data || res?.data || []);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load categories'
          });
        }
      });
  }

  /* ========================
     LOAD COURSES
  ======================== */
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
          this.courses.set(response?.data?.data || []);
          this.pagination.set(response?.pagination);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load courses'
          });
        }
      });
  }

  /* ========================
     FILTER ACTIONS
  ======================== */
  onFilterChange(): void {
    this.filters.page = 1;
    this.loadCourses();
  }

  clearFilters(): void {
    this.filters = {
      page: 1,
      limit: 12,
      sort: '-createdAt',
      isPublished: true,
      isApproved: true
    };
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