import { Component, OnInit, inject, DestroyRef, signal, computed, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { CarouselModule } from 'primeng/carousel';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';

// Models & Components
import { Course } from '../../../../core/models/course.model';
import { PropertyCourseCardComponent } from '../../../../shared/components/course-card.component';
import { TopRatedCourseCardComponent } from "./top-rated-course-card.component";
import { CourseService } from '../../../../core/services/course.service';

// Services

@Component({
  selector: 'app-top-rated-courses',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    SkeletonModule,
    TooltipModule,
    CarouselModule,
    RatingModule,
    TopRatedCourseCardComponent
  ],
  templateUrl: './top-rated-courses.html',
  styleUrls: ['./top-rated-courses.scss']
})
export class TopRatedCoursesComponent implements OnInit {
  private courseApiService = inject(CourseService); // <-- Updated Injection
  private destroyRef = inject(DestroyRef);

  // Inputs
  @Input() limit: number = 8;
  @Input() showHeader: boolean = true;
  @Input() title: string = 'Top Rated Courses';
  @Input() subtitle: string = 'Most popular courses loved by our students';
  @Input() viewAllLink: string = '/courses';
  @Input() gridCols: number = 4; // For responsive grid

  // State Signals
  courses = signal<Course[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Responsive grid classes
  gridClass = computed(() => {
    const cols = this.gridCols;
    return {
      'grid-4': cols === 4,
      'grid-3': cols === 3,
      'grid-2': cols === 2,
      'grid-1': cols === 1
    };
  });

  // Carousel responsive options
  carouselResponsiveOptions = [
    {
      breakpoint: '1400px',
      numVisible: 4,
      numScroll: 1
    },
    {
      breakpoint: '1199px',
      numVisible: 3,
      numScroll: 1
    },
    {
      breakpoint: '767px',
      numVisible: 2,
      numScroll: 1
    },
    {
      breakpoint: '575px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  // Derived Signals
  hasCourses = computed(() => this.courses().length > 0);
  
  // Skeleton array for loading state
  skeletonArray = Array(4).fill(0);

  ngOnInit(): void {
    this.fetchTopRatedCourses();
  }

  private fetchTopRatedCourses(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // <-- Updated to use getPublishedCourses with dynamic params based on @Input()
    this.courseApiService.getPublishedCourses({ params: { sort: '-ratingsAverage', limit: this.limit } })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          // Standardized unwrapping
          this.courses.set(response.data || []);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load top-rated courses', err);
          this.error.set('Unable to load courses. Please try again later.');
          this.isLoading.set(false);
        }
      });
  }

  retry(): void {
    this.fetchTopRatedCourses();
  }

  // TrackBy for better performance
  trackByCourseId(index: number, course: Course): string {
    return course._id!;
  }
}

// import { Component, OnInit, inject, DestroyRef, signal, computed, Input } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
// import { RouterModule } from '@angular/router';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TooltipModule } from 'primeng/tooltip';
// import { CarouselModule } from 'primeng/carousel';
// import { RatingModule } from 'primeng/rating';
// import { FormsModule } from '@angular/forms';

// // Local Components

// // Services
// import { CourseService } from '../../../../core/services/course.service';

// // Models
// import { Course } from '../../../../core/models/course.model';
// import { PropertyCourseCardComponent } from '../../../../shared/components/course-card.component';
// import { TopRatedCourseCardComponent } from "./top-rated-course-card.component";

// @Component({
//   selector: 'app-top-rated-courses',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     FormsModule,
//     ButtonModule,
//     SkeletonModule,
//     TooltipModule,
//     CarouselModule,
//     RatingModule
//     ,
//     TopRatedCourseCardComponent
// ],
//   templateUrl: './top-rated-courses.html',
//   styleUrls: ['./top-rated-courses.scss']
// })
// export class TopRatedCoursesComponent implements OnInit {
//   private courseService = inject(CourseService);
//   private destroyRef = inject(DestroyRef);

//   // Inputs
//   @Input() limit: number = 8;
//   @Input() showHeader: boolean = true;
//   @Input() title: string = 'Top Rated Courses';
//   @Input() subtitle: string = 'Most popular courses loved by our students';
//   @Input() viewAllLink: string = '/courses';
//   @Input() gridCols: number = 4; // For responsive grid

//   // State Signals
//   courses = signal<Course[]>([]);
//   isLoading = signal<boolean>(true);
//   error = signal<string | null>(null);

//   // Responsive grid classes
//   gridClass = computed(() => {
//     const cols = this.gridCols;
//     return {
//       'grid-4': cols === 4,
//       'grid-3': cols === 3,
//       'grid-2': cols === 2,
//       'grid-1': cols === 1
//     };
//   });

//   // Carousel responsive options
//   carouselResponsiveOptions = [
//     {
//       breakpoint: '1400px',
//       numVisible: 4,
//       numScroll: 1
//     },
//     {
//       breakpoint: '1199px',
//       numVisible: 3,
//       numScroll: 1
//     },
//     {
//       breakpoint: '767px',
//       numVisible: 2,
//       numScroll: 1
//     },
//     {
//       breakpoint: '575px',
//       numVisible: 1,
//       numScroll: 1
//     }
//   ];

//   // Derived Signals
//   hasCourses = computed(() => this.courses().length > 0);
  
//   // Skeleton array for loading state
//   skeletonArray = Array(4).fill(0);

//   ngOnInit(): void {
//     this.fetchTopRatedCourses();
//   }

//   private fetchTopRatedCourses(): void {
//     this.isLoading.set(true);
//     this.error.set(null);

//     this.courseService.getTopRatedCourses(this.limit)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (response: any) => {
//           // Handle the response structure
//           const courses = response.data?.courses || response.data || [];
//           this.courses.set(courses);
//           this.isLoading.set(false);
//         },
//         error: (err) => {
//           console.error('Failed to load top-rated courses', err);
//           this.error.set('Unable to load courses. Please try again later.');
//           this.isLoading.set(false);
//         }
//       });
//   }

//   retry(): void {
//     this.fetchTopRatedCourses();
//   }

//   // TrackBy for better performance
//   trackByCourseId(index: number, course: Course): string {
//     return course._id;
//   }
// }

