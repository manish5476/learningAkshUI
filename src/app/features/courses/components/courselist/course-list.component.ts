import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router'; // <-- Added ActivatedRoute
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
import { AuthService } from "../../../../core/services/auth.service"; 
import { AppMessageService } from "../../../../core/utils/message.service";
import { forkJoin } from "rxjs";
import { MasterApiService } from "../../../../core/services/master-list.service";

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
  private masterApiService = inject(MasterApiService);
  private messageService = inject(AppMessageService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute); // <-- Inject ActivatedRoute

  /* ========================
     FILTER STATE
  ======================== */
  filters: CourseQueryParams = {
    page: 1,
    limit: 12,
    sort: '-createdAt',
    language: '',
    search: '',
    category: '',
    level: ''
  };

  /* ========================
     SIGNALS
  ======================== */
  courses = signal<Course[]>([]);
  loading = signal<boolean>(true);
  categories = signal<any[]>([]);
  currentUser = signal<any>(null);
  levelOptions = signal<any>(null);
  languages = signal<any>(null);

  pagination = signal({
    page: 1,
    limit: 12,
    totalResults: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  canManageCourses = computed(() => {
    const user = this.currentUser();
    return user && (user.role === 'admin' || user.role === 'instructor');
  });

  sortOptions = [
    { label: 'Newest First', value: '-createdAt' },
    { label: 'Price: Low → High', value: 'price' },
    { label: 'Price: High → Low', value: '-price' },
    { label: 'Most Popular', value: '-totalEnrollments' },
    { label: 'Top Rated', value: '-rating' }
  ];

  ngOnInit(): void {
    // 1. Listen to Auth State
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => this.currentUser.set(user));

    // 2. Load the dropdown options
    this.loadCategories();

    // 3. THE FIX: Read the URL parameters, update the filters, THEN load courses
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        // Pre-fill the filters object with any parameters found in the URL
        if (params['category']) this.filters.category = params['category'];
        if (params['search']) this.filters.search = params['search'];
        if (params['level']) this.filters.level = params['level'];
        if (params['language']) this.filters.language = params['language'];
        if (params['page']) this.filters.page = Number(params['page']);

        // Fetch the data automatically using the newly assigned filters
        this.loadCourses();
      });
  }

  private loadCategories(): void {
    forkJoin({
      categories: this.masterApiService.getPublicValues('course_category'),
      levels: this.masterApiService.getPublicValues('course_level'),
      languages: this.masterApiService.getPublicValues('language'),
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.categories.set(res.categories.data || []);
          this.levelOptions.set(res.levels.data || []);
          this.languages.set(res.languages.data || []);
        },
        error: (err) => {
          console.error('Failed to load master dropdowns', err);
        }
      });
  }

  loadCourses(): void {
    this.loading.set(true);
    
    const queryParams: any = {};
    
    const currentFilters: any = { ...this.filters };
    Object.keys(currentFilters).forEach(key => {
      if (currentFilters[key] !== '' && currentFilters[key] !== null && currentFilters[key] !== undefined) {
        queryParams[key] = currentFilters[key];
      }
    });

    this.courseService.getAllCourses({ params: queryParams })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const coursesData = response?.data?.data || response?.data || response || [];
          const finalArray = Array.isArray(coursesData) ? coursesData : [];
          
          this.courses.set(finalArray);
          
          if (response?.pagination) {
            this.pagination.set(response.pagination);
          } else {
            this.pagination.set({
              page: 1, limit: 12, totalResults: finalArray.length,
              totalPages: 1, hasNextPage: false, hasPrevPage: false
            });
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          console.error('Fetch error:', err);
          this.messageService.showError('Failed to load courses');
        }
      });
  }
  
  onFilterChange(): void {
    this.filters.page = 1;
    this.loadCourses();
  }

  clearFilters(): void {
    this.filters = {
      page: 1,
      limit: 12,
      sort: '-createdAt',
      search: '',
      category: '',
      level: '',
      language: ''
    };
    this.loadCourses();
  }

  changePage(page: number): void {
    this.filters.page = page;
    this.loadCourses();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.search || this.filters.category || this.filters.level || this.filters.language);
  }
}
