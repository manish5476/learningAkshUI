import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChartModule } from 'primeng/chart';
import { MessageService } from 'primeng/api';

// Services
import { CourseService } from '../../../core/services/course.service';
import { MockTestService } from '../../../core/services/mock-test.service';
import { AppMessageService } from '../../../core/utils/message.service';
import { PostService } from '../../../core/services/post.service';
import { DropdownService } from '../../../core/services/dropdown.service'; // <-- Imported DropdownService

// Components
import { PropertyCourseCardComponent } from '../../../shared/components/course-card.component';

@Component({
  selector: 'app-home-screen',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    CarouselModule,
    CardModule,
    TagModule,
    SkeletonModule,
    InputTextModule,
    AvatarModule,
    TooltipModule,
    RippleModule,
    DividerModule,
    SelectModule,
    ToastModule,
    ProgressBarModule,
    ChartModule,
    PropertyCourseCardComponent,
  ],
  providers: [MessageService],
  templateUrl: './home-screen.html',
  styleUrls: ['./home-screen.scss']
})
export class HomeScreen implements OnInit {
  // Injectors
  private courseService = inject(CourseService);
  private mockTestService = inject(MockTestService);
  private messageService = inject(AppMessageService);
  private postService = inject(PostService);
  private dropdownService = inject(DropdownService); // <-- Injected
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  // State Signals
  isLoading = signal<boolean>(true);
  featuredCourses = signal<any[]>([]);
  popularCourses = signal<any[]>([]);
  recentCourses = signal<any[]>([]);
  categories = signal<any[]>([]);
  featuredMockTests = signal<any[]>([]);
  recentPosts = signal<any[]>([]);

  // Stats
  totalCourses = signal<number>(0);
  totalStudents = signal<number>(0);
  totalMockTests = signal<number>(0);
  totalInstructors = signal<number>(0);

  // Search
  searchQuery = signal<string>('');

  ngOnInit(): void {
    this.loadHomeData();
  }

  private loadHomeData(): void {
    this.isLoading.set(true);

    const extractData = (res: any) => {
      const raw = res?.data?.data || res?.data || res || [];
      return Array.isArray(raw) ? raw : [];
    };

    forkJoin({
      featuredCourses: this.courseService.getAllCourses({ limit: 8 }).pipe(
        catchError((err) => { console.error(err); return of({ data: [] }); })
      ),
      recentCourses: this.courseService.getAllCourses({ limit: 8 }).pipe(
        catchError((err) => { console.error(err); return of({ data: [] }); })
      ),

      // NEW: Use DropdownService for Categories. 
      // It hits /dropdown/category and returns an array directly.
      categories: this.dropdownService.getOptions('category').pipe(
        catchError((err) => { console.error('Failed to load categories:', err); return of([]); })
      ),

      mockTests: this.mockTestService.getAll({ isPublished: true, limit: 4, sort: '-attemptsCount' }).pipe(
        catchError((err) => { console.error(err); return of({ data: [] }); })
      ),
      recentPosts: this.postService.getPublishedPosts({ limit: 3, status: 'published' }).pipe(
        catchError((err) => { console.error(err); return of({ data: [] }); })
      ),
      stats: of({
        totalCourses: 150,
        totalStudents: 5000,
        totalMockTests: 45,
        totalInstructors: 25
      }).pipe(
        catchError((err) => { console.error(err); return of({}); })
      )
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          const featured = extractData(results.featuredCourses);
          const recent = extractData(results.recentCourses);
          const mocks = extractData(results.mockTests);
          const posts = extractData(results.recentPosts);

          // DropdownService maps the response, so results.categories is already the array we need
          const cats = Array.isArray(results.categories) ? results.categories : [];

          this.featuredCourses.set(featured);
          this.recentCourses.set(recent);
          this.popularCourses.set(featured.slice(0, 4));
          this.categories.set(cats); // Set perfectly mapped DropdownOptions
          this.featuredMockTests.set(mocks.slice(0, 4));
          this.recentPosts.set(posts.slice(0, 3));

          const st = results.stats as any;
          this.totalCourses.set(st?.totalCourses || 150);
          this.totalStudents.set(st?.totalStudents || 5000);
          this.totalMockTests.set(st?.totalMockTests || 45);
          this.totalInstructors.set(st?.totalInstructors || 25);

          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Critical failure in home data load:', err);
          this.messageService.showError('Failed to load homepage content');
          this.isLoading.set(false);
        }
      });
  }

  // Navigation Methods
  searchCourses(): void {
    if (this.searchQuery().trim()) {
      this.router.navigate(['/courses'], { queryParams: { search: this.searchQuery().trim() } });
    }
  }

  viewAllCourses(): void { this.router.navigate(['/courses']); }
  viewAllMockTests(): void { this.router.navigate(['/mock-tests']); }

  viewCategory(categoryId: string, categoryName: string): void {
    // Navigate using the 'value' (ID) passed from the template
    this.router.navigate(['/courses'], { queryParams: { category: categoryId } });
  }

  viewAllPosts(): void { this.router.navigate(['/blog']); }
  viewPost(post: any): void {
    const routeParam = post.slug || post._id;
    this.router.navigate(['/blog', routeParam]);
  }

  // Updated Helper for Exam-based Icons
  getCategoryIcon(label: string): string {
    if (!label) return 'pi-folder';
    const lower = label.toLowerCase();

    if (lower.includes('bank') || lower.includes('ibps') || lower.includes('sbi') || lower.includes('rbi')) return 'pi-building';
    if (lower.includes('upsc') || lower.includes('psc') || lower.includes('bpsc')) return 'pi-briefcase';
    if (lower.includes('defence') || lower.includes('nda') || lower.includes('cds') || lower.includes('afcat') || lower.includes('agniveer')) return 'pi-shield';
    if (lower.includes('railway') || lower.includes('rrb')) return 'pi-ticket';
    if (lower.includes('ssc')) return 'pi-id-card';
    if (lower.includes('teach') || lower.includes('tet') || lower.includes('kvs') || lower.includes('dsssb')) return 'pi-book';
    if (lower.includes('police') || lower.includes('constable') || lower.includes('inspector')) return 'pi-star-fill';
    if (lower.includes('gate') || lower.includes('engineer') || lower.includes('ese') || lower.includes('drdo') || lower.includes('isro')) return 'pi-cog';
    if (lower.includes('judici') || lower.includes('law') || lower.includes('apo')) return 'pi-building-columns';

    return 'pi-folder';
  }

  getLevelSeverity(level: string): any {
    const map: Record<string, string> = {
      'BEGINNER': 'success', 'INTERMEDIATE': 'info', 'ADVANCED': 'warning', 'EXPERT': 'danger'
    };
    return map[level?.toUpperCase()] || 'info';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
// import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { forkJoin, of } from 'rxjs';
// import { catchError } from 'rxjs/operators';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { CarouselModule } from 'primeng/carousel';
// import { CardModule } from 'primeng/card';
// import { TagModule } from 'primeng/tag';
// import { SkeletonModule } from 'primeng/skeleton';
// import { InputTextModule } from 'primeng/inputtext';
// import { AvatarModule } from 'primeng/avatar';
// import { TooltipModule } from 'primeng/tooltip';
// import { RippleModule } from 'primeng/ripple';
// import { DividerModule } from 'primeng/divider';
// import { SelectModule } from 'primeng/select';
// import { ToastModule } from 'primeng/toast';
// import { ProgressBarModule } from 'primeng/progressbar';
// import { ChartModule } from 'primeng/chart';
// import { MessageService } from 'primeng/api';

// // Services
// import { CourseService } from '../../../core/services/course.service';
// import { MockTestService } from '../../../core/services/mock-test.service';
// import { MasterApiService } from '../../../core/services/master-list.service';
// import { AppMessageService } from '../../../core/utils/message.service';
// import { PostService } from '../../../core/services/post.service'; // Added PostService

// // Components
// import { PropertyCourseCardComponent } from '../../../shared/components/course-card.component';

// @Component({
//   selector: 'app-home-screen',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     FormsModule,
//     ButtonModule,
//     CarouselModule,
//     CardModule,
//     TagModule,
//     SkeletonModule,
//     InputTextModule,
//     AvatarModule,
//     TooltipModule,
//     RippleModule,
//     DividerModule,
//     SelectModule,
//     ToastModule,
//     ProgressBarModule,
//     ChartModule,
//     PropertyCourseCardComponent,
//   ],
//   providers: [MessageService],
//   templateUrl: './home-screen.html',
//   styleUrls: ['./home-screen.scss']
// })
// export class HomeScreen implements OnInit {
//   // Injectors
//   private courseService = inject(CourseService);
//   private mockTestService = inject(MockTestService);
//   private masterApiService = inject(MasterApiService);
//   private messageService = inject(AppMessageService);
//   private postService = inject(PostService); // Injected
//   private destroyRef = inject(DestroyRef);
//   private router = inject(Router);

//   // State Signals
//   isLoading = signal<boolean>(true);
//   featuredCourses = signal<any[]>([]);
//   popularCourses = signal<any[]>([]);
//   recentCourses = signal<any[]>([]);
//   categories = signal<any[]>([]);
//   featuredMockTests = signal<any[]>([]);
//   recentPosts = signal<any[]>([]); // Added Posts Signal

//   // Stats
//   totalCourses = signal<number>(0);
//   totalStudents = signal<number>(0);
//   totalMockTests = signal<number>(0);
//   totalInstructors = signal<number>(0);

//   // Search
//   searchQuery = signal<string>('');

//   // Carousel responsive options
//   carouselResponsiveOptions = [
//     { breakpoint: '1400px', numVisible: 4, numScroll: 1 },
//     { breakpoint: '1199px', numVisible: 3, numScroll: 1 },
//     { breakpoint: '767px', numVisible: 2, numScroll: 1 },
//     { breakpoint: '575px', numVisible: 1, numScroll: 1 }
//   ];

//   ngOnInit(): void {
//     this.loadHomeData();
//   }

//   private loadHomeData(): void {
//     this.isLoading.set(true);

//     const extractData = (res: any) => {
//       const raw = res?.data?.data || res?.data || res || [];
//       return Array.isArray(raw) ? raw : [];
//     };

//     forkJoin({
//       featuredCourses: this.courseService.getAllCourses({ limit: 8 }).pipe(
//         catchError((err) => { console.error(err); return of({ data: [] }); })
//       ),
//       recentCourses: this.courseService.getAllCourses({ limit: 8 }).pipe(
//         catchError((err) => { console.error(err); return of({ data: [] }); })
//       ),
//       categories: this.masterApiService.getPublicValues('course_category').pipe(
//         catchError((err) => { console.error(err); return of({ data: [] }); })
//       ),
//       mockTests: this.mockTestService.getAll({ isPublished: true, limit: 4, sort: '-attemptsCount' }).pipe(
//         catchError((err) => { console.error(err); return of({ data: [] }); })
//       ),
//       // NEW: Fetch latest 3 published blog posts
//       recentPosts: this.postService.getPublishedPosts({ limit: 6, status: 'published' }).pipe(
//         catchError((err) => { console.error(err); return of({ data: [] }); })
//       ),
//       stats: of({
//         totalCourses: 150,
//         totalStudents: 5000,
//         totalMockTests: 45,
//         totalInstructors: 25
//       }).pipe(
//         catchError((err) => { console.error(err); return of({}); })
//       )
//     })
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (results) => {
//           const featured = extractData(results.featuredCourses);
//           const recent = extractData(results.recentCourses);
//           const cats = extractData(results.categories);
//           const mocks = extractData(results.mockTests);
//           const posts = extractData(results.recentPosts);

//           this.featuredCourses.set(featured);
//           this.recentCourses.set(recent);
//           this.popularCourses.set(featured.slice(0, 4));
//           this.categories.set(cats);
//           this.featuredMockTests.set(mocks.slice(0, 4));
//           this.recentPosts.set(posts.slice(0, 3)); // Store top 3 posts

//           const st = results.stats as any;
//           this.totalCourses.set(st?.totalCourses || 150);
//           this.totalStudents.set(st?.totalStudents || 5000);
//           this.totalMockTests.set(st?.totalMockTests || 45);
//           this.totalInstructors.set(st?.totalInstructors || 25);

//           this.isLoading.set(false);
//         },
//         error: (err) => {
//           console.error('Critical failure in home data load:', err);
//           this.messageService.showError('Failed to load homepage content');
//           this.isLoading.set(false);
//         }
//       });
//   }
//   // In your component class
//   takeMockTest(testId: string) {
//     this.router.navigate(['/mock-tests/take', testId]);
//   }

//   // Navigation Methods
//   searchCourses(): void {
//     if (this.searchQuery().trim()) {
//       this.router.navigate(['/courses'], { queryParams: { search: this.searchQuery().trim() } });
//     }
//   }

//   viewAllCourses(): void { this.router.navigate(['/courses']); }
//   viewAllMockTests(): void { this.router.navigate(['/mock-tests']); }
//   viewCategory(categoryId: string, categoryName: string): void {
//     this.router.navigate(['/courses'], { queryParams: { category: categoryId } });
//   }

//   // Blog Navigation
//   viewAllPosts(): void { this.router.navigate(['/blog']); }
//   viewPost(post: any): void {
//     const routeParam = post.slug || post._id;
//     this.router.navigate(['/blog', routeParam]);
//   }

//   // Helpers
//   getCategoryIcon(categoryName: string): string {
//     const icons: Record<string, string> = {
//       'Development': 'pi-code', 'Business': 'pi-briefcase', 'Finance': 'pi-chart-line',
//       'IT & Software': 'pi-desktop', 'Office Productivity': 'pi-file', 'Personal Development': 'pi-user',
//       'Design': 'pi-pencil', 'Marketing': 'pi-megaphone', 'Health & Fitness': 'pi-heart', 'Music': 'pi-volume-up'
//     };
//     return icons[categoryName] || 'pi-folder';
//   }

//   getLevelSeverity(level: string): any {
//     const map: Record<string, string> = {
//       'BEGINNER': 'success', 'INTERMEDIATE': 'info', 'ADVANCED': 'warning', 'EXPERT': 'danger'
//     };
//     return map[level?.toUpperCase()] || 'info';
//   }

//   formatDate(date: string): string {
//     return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
//   }
// }