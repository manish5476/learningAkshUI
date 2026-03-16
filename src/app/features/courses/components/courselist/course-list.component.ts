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
  private categoryService = inject(CategoryService); // Kept if you plan to use it later
  private masterApiService = inject(MasterApiService);
  private messageService = inject(AppMessageService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

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

  // <-- COMPUTED SIGNAL FOR PERMISSIONS
  canManageCourses = computed(() => {
    const user = this.currentUser();
    return user && (user.role === 'admin' || user.role === 'instructor');
  });

  /* ========================
     OPTIONS
  ======================== */
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
    
    const params: any = { ...this.filters };
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    this.courseService.getAllCourses(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          console.log("RAW API RESPONSE:", response); 

          // Ultra-safe extraction (covers all bases)
          const coursesData = response?.data?.data || response?.data || response || [];
          
          // Ensure it's actually an array before setting
          const finalArray = Array.isArray(coursesData) ? coursesData : [];
          console.log("FINAL ARRAY SAVED TO SIGNAL:", finalArray); 
          
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
  // loadCourses(): void {
  //   this.loading.set(true);
    
  //   // Clean up empty params before sending them to the service
  //   const params: any = { ...this.filters };
  //   Object.keys(params).forEach(key => {
  //     if (params[key] === '' || params[key] === null || params[key] === undefined) {
  //       delete params[key];
  //     }
  //   });

  //   this.courseService.getAllCourses(params)
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe({
  //       next: (response: any) => {
  //         const coursesData = response?.data || [];
  //         this.courses.set(coursesData);
          
  //         if (response?.pagination) {
  //           this.pagination.set(response.pagination);
  //         } else {
  //           // Safe fallback if pagination isn't returned
  //           this.pagination.set({
  //             page: 1,
  //             limit: 12,
  //             totalResults: coursesData.length,
  //             totalPages: 1,
  //             hasNextPage: false,
  //             hasPrevPage: false
  //           });
  //         }
  //         this.loading.set(false);
  //       },
  //       error: (err) => {
  //         this.loading.set(false);
  //         console.error('Fetch error:', err);
  //         this.messageService.showError('Failed to load courses');
  //       }
  //     });
  // }

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

// import { Category } from "./../../../../core/models/course.model";
// import { Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
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
// import { AuthService } from "../../../../core/services/auth.service"; // <-- IMPORT AUTH SERVICE
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

//   /* ========================
//      FILTER STATE
//   ======================== */
//   filters: CourseQueryParams = {
//     page: 1,
//     limit: 12,
//     sort: '-createdAt',
//     isPublished: false,
//     isApproved: false,
//     language: '',
//   };

//   /* ========================
//      SIGNALS
//   ======================== */
//   courses = signal<Course[]>([]);
//   loading = signal<boolean>(true);
//   categories = signal<any[]>([]);
//   currentUser = signal<any>(null);
//   levelOptions = signal<any>(null)
//   languages = signal<any>(null)

//   pagination = signal({
//     page: 1,
//     limit: 12,
//     totalResults: 0,
//     totalPages: 1,
//     hasNextPage: false,
//     hasPrevPage: false
//   });

//   // <-- COMPUTED SIGNAL FOR PERMISSIONS
//   canManageCourses = computed(() => {
//     const user = this.currentUser();
//     return user && (user.role === 'admin' || user.role === 'instructor');
//   });

//   /* ========================
//      OPTIONS
//   ======================== */

//   sortOptions = [
//     { label: 'Newest First', value: '-createdAt' },
//     { label: 'Price: Low → High', value: 'price' },
//     { label: 'Price: High → Low', value: '-price' },
//     { label: 'Most Popular', value: '-totalEnrollments' },
//     { label: 'Top Rated', value: '-rating' }
//   ];

//   ngOnInit(): void {
//     // Listen to Auth State
//     this.authService.currentUser$
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(user => this.currentUser.set(user));

//     this.loadCategories();
//     this.loadCourses();
//   }


//   private loadCategories(): void {
//     forkJoin({
//       categories: this.masterApiService.getPublicValues('course_category'),
//       levels: this.masterApiService.getPublicValues('course_level'),
//       languages: this.masterApiService.getPublicValues('language'),
//       // currencies: this.masterApiService.getPublicValues('currency'),
//       // lessonTypes: this.masterApiService.getPublicValues('lesson_type')
//     }).pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res) => {
//           // 2. Set the dropdown signals
//           this.categories.set(res.categories.data || []);
//           this.levelOptions.set(res.levels.data || []);
//           this.languages.set(res.languages.data || []);
//           // this.currencies.set(res.currencies.data || []);
//           // this.lessonTypes.set(res.lessonTypes.data || []);

//           // 3. NOW that dropdowns are ready, load the Course!

//         },
//         error: (err) => {
//           console.error('Failed to load master dropdowns', err);
//         }
//       });

//   }

//   // loadCourses(): void {
//   //   this.loading.set(true);
//   //   const params: CourseQueryParams = {};
//   //   Object.entries(this.filters).forEach(([key, value]) => {
//   //     if (value !== null && value !== undefined && value !== '') {
//   //       (params as any)[key] = value;
//   //     }
//   //   });

//   //   this.courseService.getAllCourses(params)
//   //     .pipe(takeUntilDestroyed(this.destroyRef))
//   //     .subscribe({
//   //       next: (response: any) => {
//   //         // 1. Safely extract the array (handles variations in backend nesting)
//   //         const coursesData = response?.data?.data || response?.data?.courses || response?.data || response || [];
//   //         this.courses.set(Array.isArray(coursesData) ? coursesData : []);

//   //         // 2. THE FIX: Provide a safe fallback so pagination is NEVER undefined
//   //         const safePagination = response?.pagination || {
//   //           page: 1,
//   //           limit: 12,
//   //           totalResults: this.courses().length || 0,
//   //           totalPages: 1,
//   //           hasNextPage: false,
//   //           hasPrevPage: false
//   //         };

//   //         this.pagination.set(safePagination);
//   //         this.loading.set(false);
//   //       },
//   //       error: () => {
//   //         this.loading.set(false);
//   //         this.messageService.showError('Failed to load courses');
//   //       }
//   //     });
//   // }
//   loadCourses(): void {
//     this.loading.set(true);
//     const params: any = { ...this.filters };
//     Object.keys(params).forEach(key => {
//       if (params[key] === '' || params[key] === null || params[key] === undefined) {
//         delete params[key];
//       }
//     });

//     this.courseService.getAllCourses(params)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (response: any) => {
//           // const coursesData = response?.data?.data || response?.data?.courses || response?.data || response || [];
//           // this.courses.set(Array.isArray(coursesData) ? coursesData : []);
//           const coursesData = response?.data || [];
//           this.courses.set(coursesData);
//           if (response.pagination) {
//             this.pagination.set(response.pagination);
//           } else {
//             this.pagination.set({
//               page: 1,
//               limit: 12,
//               totalResults: this.courses().length,
//               totalPages: 1,
//               hasNextPage: false,
//               hasPrevPage: false
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
//       isPublished: true,
//       isApproved: true,
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