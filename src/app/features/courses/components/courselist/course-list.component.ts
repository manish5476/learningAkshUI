import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router'; // <-- Added Router
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
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AuthService } from "../../../../core/services/auth.service"; 
import { AppMessageService } from "../../../../core/utils/message.service";
import { DynamicDropdownComponent } from '../../../../shared/components/dynamic-select/dynamic-select.component';
import { PaginatorModule } from 'primeng/paginator';
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
    PaginatorModule, // <-- Added here
    PropertyCourseCardComponent,
    DynamicDropdownComponent // <-- Added here
  ],
  providers: [MessageService],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss']
})
export class CourseListComponent implements OnInit {

  private courseService = inject(CourseService);
  private messageService = inject(AppMessageService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router); // <-- Inject Router

  filters: CourseQueryParams = {
    page: 1,
    limit: 12,
    sort: '-createdAt',
    language: '',
    search: '',
    category: '',
    level: ''
  };

  courses = signal<Course[]>([]);
  loading = signal<boolean>(true);
  currentUser = signal<any>(null);

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

  // ngOnInit(): void {
  //   this.authService.currentUser$
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe(user => this.currentUser.set(user));

  //   // Listen to URL changes to load courses
  //   this.route.queryParams
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe(params => {
  //       this.filters.category = params['category'] || '';
  //       this.filters.search = params['search'] || '';
  //       this.filters.level = params['level'] || '';
  //       this.filters.language = params['language'] || '';
  //       this.filters.sort = params['sort'] || '-createdAt';
  //       this.filters.page = Number(params['page']) || 1;
  //       this.filters.limit = Number(params['limit']) || 12;
        
  //       this.loadCourses();
  //     });
  // }

// Add these new properties for PrimeNG Paginator state
  first: number = 0;
  rows: number = 12;

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => this.currentUser.set(user));

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const page = Number(params['page']) || 1;
        const limit = Number(params['limit']) || 12;

        // Sync standard filters
        this.filters.category = params['category'] || '';
        this.filters.search = params['search'] || '';
        this.filters.level = params['level'] || '';
        this.filters.language = params['language'] || '';
        this.filters.sort = params['sort'] || '-createdAt';
        
        // Sync API filters
        this.filters.page = page;
        this.filters.limit = limit;

        // ✅ SYNC PRIMENG PAGINATOR STATE
        this.rows = limit;
        this.first = (page - 1) * limit;
        
        this.loadCourses();
      });
  }

  // ✅ UPDATED PAGINATOR METHOD
  onPageChange(event: any): void {
    // 1. Update PrimeNG internal state tracking variables
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 12;

    // 2. Update your API filters (PrimeNG 'page' is 0-indexed, so we add 1)
    this.filters.page = (event.page ?? 0) + 1;
    this.filters.limit = this.rows;

    // 3. Update the URL (which triggers the data fetch)
    this.updateUrl();
  }
    loadCourses(): void {
    this.loading.set(true);
    
    // Clean up empty parameters before sending to backend
    const queryParams: any = {};
    Object.keys(this.filters).forEach(key => {
      const val = (this.filters as any)[key];
      if (val !== '' && val !== null && val !== undefined) {
        queryParams[key] = val;
      }
    });

    this.courseService.getAllCourses({ params: queryParams })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const coursesData = response?.data?.data || response?.data || response || [];
          this.courses.set(Array.isArray(coursesData) ? coursesData : []);
          
          if (response?.pagination) {
            this.pagination.set(response.pagination);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.messageService.showError('Failed to load courses');
        }
      });
  }
  
  // Updates the URL, which automatically triggers the route subscription to load courses
  updateUrl(): void {
    const queryParams: any = {};
    Object.keys(this.filters).forEach(key => {
      const val = (this.filters as any)[key];
      if (val !== '' && val !== null && val !== undefined) {
        queryParams[key] = val;
      }
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge' // Keeps existing params we aren't changing
    });
  }

  onFilterChange(): void {
    this.filters.page = 1; // Reset to page 1 when a new filter is applied
    this.updateUrl();
  }

  // onPageChange(event: any): void {
  //   // PrimeNG Paginator event: { first: 0, rows: 12, page: 0, pageCount: ... }
  //   this.filters.page = event.page + 1; // PrimeNG is 0-indexed, our API is 1-indexed
  //   this.filters.limit = event.rows;
  //   this.updateUrl();
  // }

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
    // Navigating with empty query params clears the URL
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.search || this.filters.category || this.filters.level || this.filters.language || this.filters.sort !== '-createdAt');
  }
}

// import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, ActivatedRoute } from '@angular/router'; // <-- Added ActivatedRoute
// import { FormsModule } from '@angular/forms';

// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { SkeletonModule } from 'primeng/skeleton';
// import { ToastModule } from 'primeng/toast';
// import { MessageService } from 'primeng/api';
// import { SelectModule } from 'primeng/select';

// import { CourseService } from '../../../../core/services/course.service';
// import { Course, CourseQueryParams } from '../../../../core/models/course.model';
// import { PropertyCourseCardComponent } from '../../../../shared/components/course-card.component';
// import { CategoryService } from "../../../../core/services/category.service";
// import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
// import { AuthService } from "../../../../core/services/auth.service"; 
// import { AppMessageService } from "../../../../core/utils/message.service";
// import { forkJoin } from "rxjs";
// import { MasterApiService } from "../../../../core/services/master-list.service";

// @Component({
//   selector: 'app-course-list',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     FormsModule,
//     ButtonModule,
//     InputTextModule,
//     SelectModule,
//     SkeletonModule,
//     ToastModule,
//     PropertyCourseCardComponent
//   ],
//   providers: [MessageService],
//   templateUrl: './course-list.component.html',
//   styleUrls: ['./course-list.component.scss']
// })
// export class CourseListComponent implements OnInit {

//   private courseService = inject(CourseService);
//   private categoryService = inject(CategoryService); 
//   private masterApiService = inject(MasterApiService);
//   private messageService = inject(AppMessageService);
//   private destroyRef = inject(DestroyRef);
//   private authService = inject(AuthService);
//   private route = inject(ActivatedRoute); // <-- Inject ActivatedRoute

//   /* ========================
//      FILTER STATE
//   ======================== */
//   filters: CourseQueryParams = {
//     page: 1,
//     limit: 12,
//     sort: '-createdAt',
//     language: '',
//     search: '',
//     category: '',
//     level: ''
//   };

//   /* ========================
//      SIGNALS
//   ======================== */
//   courses = signal<Course[]>([]);
//   loading = signal<boolean>(true);
//   categories = signal<any[]>([]);
//   currentUser = signal<any>(null);
//   levelOptions = signal<any>(null);
//   languages = signal<any>(null);

//   pagination = signal({
//     page: 1,
//     limit: 12,
//     totalResults: 0,
//     totalPages: 1,
//     hasNextPage: false,
//     hasPrevPage: false
//   });

//   canManageCourses = computed(() => {
//     const user = this.currentUser();
//     return user && (user.role === 'admin' || user.role === 'instructor');
//   });

//   sortOptions = [
//     { label: 'Newest First', value: '-createdAt' },
//     { label: 'Price: Low → High', value: 'price' },
//     { label: 'Price: High → Low', value: '-price' },
//     { label: 'Most Popular', value: '-totalEnrollments' },
//     { label: 'Top Rated', value: '-rating' }
//   ];

//   ngOnInit(): void {
//     this.loadCategories2();
//     // 1. Listen to Auth State
//     this.authService.currentUser$
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(user => this.currentUser.set(user));

//     // 2. Load the dropdown options
//     this.loadCategories();

//     // 3. THE FIX: Read the URL parameters, update the filters, THEN load courses
//     this.route.queryParams
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(params => {
//         if (params['category']) this.filters.category = params['category'];
//         if (params['search']) this.filters.search = params['search'];
//         if (params['level']) this.filters.level = params['level'];
//         if (params['language']) this.filters.language = params['language'];
//         if (params['page']) this.filters.page = Number(params['page']);
//         this.loadCourses();
//       });
//   }

//   private loadCategories(): void {
//     forkJoin({
//       // categories: this.masterApiService.getPublicValues('course_category'),
//       levels: this.masterApiService.getPublicValues('course_level'),
//       languages: this.masterApiService.getPublicValues('language'),
//     }).pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res) => {
//           // this.categories.set(res.categories.data || []);
//           this.levelOptions.set(res.levels.data || []);
//           this.languages.set(res.languages.data || []);
//         },
//         error: (err) => {
//           console.error('Failed to load master dropdowns', err);
//         }
//       });
//   }
//     private loadCategories2(): void {
//     this.categoryService.getAllCategories({ isActive: true })
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) =>this.categories.set(res.data),//(this.mapToDropdownOptions(res.data,'name','_id')
//         error: (error: any) => console.error('Failed to load categories', error)
//       });
//   }
//   /**
//    * Maps an array of objects to PrimeNG dropdown option format.
//    * 
//    * @param items - The original array of data.
//    * @param labelKey - The object key to use for the dropdown label.
//    * @param valueKey - The object key to use for the dropdown value.
//    * @returns An array of { label, value } objects.
//    */
//     mapToDropdownOptions<T>(
//     items: T[], 
//     labelKey: keyof T, 
//     valueKey: keyof T
//   ) {
//     if (!items || !Array.isArray(items)) return [];
  
//     return items.map(item => ({
//       label: item[labelKey],
//       value: item[valueKey]
//     }));
//   }


//   loadCourses(): void {
//     this.loading.set(true);
    
//     const queryParams: any = {};
    
//     const currentFilters: any = { ...this.filters };
//     Object.keys(currentFilters).forEach(key => {
//       if (currentFilters[key] !== '' && currentFilters[key] !== null && currentFilters[key] !== undefined) {
//         queryParams[key] = currentFilters[key];
//       }
//     });

//     this.courseService.getAllCourses({ params: queryParams })
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (response: any) => {
//           const coursesData = response?.data?.data || response?.data || response || [];
//           const finalArray = Array.isArray(coursesData) ? coursesData : [];
          
//           this.courses.set(finalArray);
          
//           if (response?.pagination) {
//             this.pagination.set(response.pagination);
//           } else {
//             this.pagination.set({
//               page: 1, limit: 12, totalResults: finalArray.length,
//               totalPages: 1, hasNextPage: false, hasPrevPage: false
//             });
//           }
//           this.loading.set(false);
//         },
//         error: (err) => {
//           this.loading.set(false);
//           console.error('Fetch error:', err);
//           this.messageService.showError('Failed to load courses');
//         }
//       });
//   }
  
//   onFilterChange(): void {
//     this.filters.page = 1;
//     this.loadCourses();
//   }

//   clearFilters(): void {
//     this.filters = {
//       page: 1,
//       limit: 12,
//       sort: '-createdAt',
//       search: '',
//       category: '',
//       level: '',
//       language: ''
//     };
//     this.loadCourses();
//   }

//   changePage(page: number): void {
//     this.filters.page = page;
//     this.loadCourses();
//   }

//   hasActiveFilters(): boolean {
//     return !!(this.filters.search || this.filters.category || this.filters.level || this.filters.language);
//   }
// }
