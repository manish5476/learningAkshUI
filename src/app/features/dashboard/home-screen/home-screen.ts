import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
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
import { MasterApiService } from '../../../core/services/master-list.service';
import { AppMessageService } from '../../../core/utils/message.service';

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
  private masterApiService = inject(MasterApiService);
  private messageService = inject(AppMessageService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  // State Signals
  isLoading = signal<boolean>(true);
  featuredCourses = signal<any[]>([]);
  popularCourses = signal<any[]>([]);
  recentCourses = signal<any[]>([]);
  categories = signal<any[]>([]);
  featuredMockTests = signal<any[]>([]);
  
  // Stats
  totalCourses = signal<number>(0);
  totalStudents = signal<number>(0);
  totalMockTests = signal<number>(0);
  totalInstructors = signal<number>(0);

  // Search
  searchQuery = signal<string>('');

  // Carousel responsive options
  carouselResponsiveOptions = [
    { breakpoint: '1400px', numVisible: 4, numScroll: 1 },
    { breakpoint: '1199px', numVisible: 3, numScroll: 1 },
    { breakpoint: '767px', numVisible: 2, numScroll: 1 },
    { breakpoint: '575px', numVisible: 1, numScroll: 1 }
  ];

  ngOnInit(): void {
    this.loadHomeData();
  }

private loadHomeData(): void {
    this.isLoading.set(true);

    // Helper function for bulletproof array extraction
    const extractData = (res: any) => {
      const raw = res?.data?.data || res?.data || res || [];
      return Array.isArray(raw) ? raw : [];
    };

    forkJoin({
         featuredCourses: this.courseService.getAllCourses({ 
        limit: 8, 
        // sort: '-rating,-totalEnrollments',
        // isPublished: true 
      }).pipe(
        catchError((err) => {
          console.error('Failed to load featured courses:', err);
          return of({ data: [] });
        })
      ),
      
      // 2. Get 8 recent courses
      recentCourses: this.courseService.getAllCourses({ 
        limit: 8, 
        // sort: '-createdAt',
        // isPublished: true 
      }).pipe(
        catchError((err) => {
          console.error('Failed to load recent courses:', err);
          return of({ data: [] });
        })
      ),
      
      // 3. Get categories
      categories: this.masterApiService.getPublicValues('course_category').pipe(
        catchError((err) => {
          console.error('Failed to load categories:', err);
          return of({ data: [] });
        })
      ),
      
      // 4. Get 4 featured mock tests
      mockTests: this.mockTestService.getAll({ 
        isPublished: true,
        limit: 4,
        sort: '-attemptsCount'
      }).pipe(
        catchError((err) => {
          console.error('Failed to load mock tests:', err);
          return of({ data: [] });
        })
      ),
      
      // 5. Get stats
      stats: of({ 
        totalCourses: 150, 
        totalStudents: 5000, 
        totalMockTests: 45, 
        totalInstructors: 25 
      }).pipe(
        catchError((err) => {
          console.error('Failed to load stats:', err);
          return of({});
        })
      )
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (results) => {
        // 1. Safely extract arrays using the helper function
        const featured = extractData(results.featuredCourses);
        const recent = extractData(results.recentCourses);
        const cats = extractData(results.categories);
        const mocks = extractData(results.mockTests);

        // 2. Set the Signals
        this.featuredCourses.set(featured);
        this.recentCourses.set(recent);
        this.popularCourses.set(featured.slice(0, 4));
        this.categories.set(cats);
        this.featuredMockTests.set(mocks.slice(0, 4));
        
        // 3. Set Stats safely
        const st = results.stats as any;
        this.totalCourses.set(st?.totalCourses || 150);
        this.totalStudents.set(st?.totalStudents || 5000);
        this.totalMockTests.set(st?.totalMockTests || 45);
        this.totalInstructors.set(st?.totalInstructors || 25);
        
        this.isLoading.set(false);
      },
      error: (err) => {
        // This will only trigger if forkJoin itself completely crashes
        console.error('Critical failure in home data load:', err);
        this.messageService.showError('Failed to load homepage content');
        this.isLoading.set(false);
      }
    });
  }

  // Navigation
  searchCourses(): void {
    if (this.searchQuery().trim()) {
      this.router.navigate(['/courses'], { 
        queryParams: { search: this.searchQuery().trim() }
      });
    }
  }

  viewAllCourses(): void {
    this.router.navigate(['/courses']);
  }

  viewAllMockTests(): void {
    this.router.navigate(['/mock-tests']);
  }

  viewCategory(categoryId: string, categoryName: string): void {
    this.router.navigate(['/courses'], { 
      queryParams: { category: categoryId }
    });
  }

  // Helper methods
  getCategoryIcon(categoryName: string): string {
    const icons: Record<string, string> = {
      'Development': 'pi-code',
      'Business': 'pi-briefcase',
      'Finance': 'pi-chart-line',
      'IT & Software': 'pi-desktop',
      'Office Productivity': 'pi-file',
      'Personal Development': 'pi-user',
      'Design': 'pi-pencil',
      'Marketing': 'pi-megaphone',
      'Health & Fitness': 'pi-heart',
      'Music': 'pi-volume-up'
    };
    
    return icons[categoryName] || 'pi-folder';
  }

  getLevelSeverity(level: string): any {
    const map: Record<string, string> = {
      'BEGINNER': 'success',
      'INTERMEDIATE': 'info',
      'ADVANCED': 'warning',
      'EXPERT': 'danger'
    };
    return map[level?.toUpperCase()] || 'info';
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}
// import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
// import { RouterModule, Router } from '@angular/router';
// import { FormsModule } from '@angular/forms';
// import { forkJoin, of } from 'rxjs';
// import { catchError } from 'rxjs/operators';

// // PrimeNG Modules
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
// import { Dialog } from "primeng/dialog";
// import { SelectModule } from 'primeng/select';
// import { ToastModule } from 'primeng/toast';
// import { MessageService } from 'primeng/api';
// import { ProgressBarModule } from 'primeng/progressbar';
// import { ChartModule } from 'primeng/chart';

// // Components
// import { PropertyCourseCardComponent } from '../../../shared/components/course-card.component';

// // Services
// import { CategoryService } from '../../../core/services/category.service';
// import { CourseService } from '../../../core/services/course.service';
// import { MockTestService } from '../../../core/services/mock-test.service';
// import { EnrollmentService } from '../../../core/services/enrollment.service';
// import { AuthService } from '../../../core/services/auth.service';

// // Models
// import { Course, Category } from '../../../core/models/course.model';

// interface Testimonial {
//   id: string;
//   name: string;
//   role: string;
//   content: string;
//   avatar: string;
//   rating: number;
// }

// interface AdBanner {
//   id: string;
//   title: string;
//   subtitle: string;
//   description: string;
//   image: string;
//   ctaText: string;
//   ctaLink: string;
//   backgroundColor: string;
//   discount?: string;
//   icon?: string;
// }

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
//     // MockTestCardComponent
//   ],
//   providers: [MessageService],
//   templateUrl: './home-screen.html',
//   styleUrls: ['./home-screen.scss']
// })
// export class HomeScreen implements OnInit {
//   // Injectors
//   private courseService = inject(CourseService);
//   private categoryService = inject(CategoryService);
//   private mockTestService = inject(MockTestService);
//   private enrollmentService = inject(EnrollmentService);
//   private authService = inject(AuthService);
//   private router = inject(Router);
//   private destroyRef = inject(DestroyRef);
//   private messageService = inject(MessageService);

//   // State Signals
//   isLoading = signal<boolean>(true);
//   error = signal<string | null>(null);
//   activeCategoryFilter = signal<string>('all');
//   activeTab = signal<'courses' | 'mocktests'>('courses');
//   showNewsletterModal = signal<boolean>(false);

//   // Data Signals
//   featuredCourses = signal<Course[]>([]);
//   topRatedCourses = signal<Course[]>([]);
//   recentCourses = signal<Course[]>([]);
//   popularMockTests = signal<any[]>([]);
//   categories = signal<any[]>([]);
//   userEnrollments = signal<any[]>([]);
//   currentUser = signal<any>(null);

//   // Filtered Data
//   filteredCourses = computed(() => {
//     const category = this.activeCategoryFilter();
//     if (category === 'all') return this.featuredCourses();
//     return this.featuredCourses().filter(course => 
//       (String(course.category) === category) || (course.category?._id === category)
//     );
//   });

//   // Search
//   searchQuery = signal<string>('');
//   searchSuggestions = signal<string[]>([]);
//   showSearchSuggestions = signal<boolean>(false);

//   // Newsletter
//   emailSubscription = signal<string>('');
//   subscriptionSuccess = signal<boolean>(false);

//   // Statistics
//   statistics = signal<any[]>([
//     { value: '50K+', label: 'Active Students', icon: 'pi pi-users', trend: '+25% this year' },
//     { value: '200+', label: 'Expert Instructors', icon: 'pi pi-star', trend: 'Top 1% educators' },
//     { value: '500+', label: 'Courses', icon: 'pi pi-book', trend: 'Updated weekly' },
//     { value: '95%', label: 'Satisfaction Rate', icon: 'pi pi-heart', trend: 'From 10K+ reviews' }
//   ]);

//   // Testimonials
//   testimonials = signal<Testimonial[]>([
//     {
//       id: '1',
//       name: 'Priya Sharma',
//       role: 'Software Developer',
//       content: 'The courses here transformed my career. I went from a beginner to landing my dream job as a full-stack developer!',
//       avatar: 'https://i.pravatar.cc/150?img=1',
//       rating: 5
//     },
//     {
//       id: '2',
//       name: 'Rahul Verma',
//       role: 'Data Scientist',
//       content: 'Excellent content and knowledgeable instructors. The data science masterclass was exactly what I needed to upskill.',
//       avatar: 'https://i.pravatar.cc/150?img=2',
//       rating: 5
//     },
//     {
//       id: '3',
//       name: 'Anjali Patel',
//       role: 'Digital Marketer',
//       content: 'The digital marketing course is comprehensive and practical. I\'ve already implemented strategies that doubled our traffic.',
//       avatar: 'https://i.pravatar.cc/150?img=3',
//       rating: 4
//     },
//     {
//       id: '4',
//       name: 'Vikram Singh',
//       role: 'Entrepreneur',
//       content: 'As a business owner, the entrepreneurship course gave me the tools to scale my startup. Highly recommended!',
//       avatar: 'https://i.pravatar.cc/150?img=4',
//       rating: 5
//     },
//     {
//       id: '5',
//       name: 'Neha Gupta',
//       role: 'Marketing Manager',
//       content: 'The mock tests were incredibly helpful for my certification preparation. Highly recommended!',
//       avatar: 'https://i.pravatar.cc/150?img=5',
//       rating: 5
//     },
//     {
//       id: '6',
//       name: 'Arjun Reddy',
//       role: 'Tech Lead',
//       content: 'The platform\'s UI is fantastic and the learning experience is seamless. Best investment in my career.',
//       avatar: 'https://i.pravatar.cc/150?img=6',
//       rating: 5
//     }
//   ]);

//   // Ad Banners
//   adBanners = signal<AdBanner[]>([
//     {
//       id: '1',
//       title: 'Summer Learning Sale!',
//       subtitle: 'Get 40% off on all courses',
//       description: 'Limited time offer. Upgrade your skills today!',
//       image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
//       ctaText: 'Shop Now',
//       ctaLink: '/courses',
//       backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//       discount: '40% OFF',
//       icon: 'pi pi-gift'
//     },
//     {
//       id: '2',
//       title: 'Become an Instructor',
//       subtitle: 'Share your knowledge',
//       description: 'Join our community of expert instructors and earn while you teach',
//       image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
//       ctaText: 'Start Teaching',
//       ctaLink: '/become-instructor',
//       backgroundColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
//       discount: 'Earn 70%',
//       icon: 'pi pi-users'
//     },
//     {
//       id: '3',
//       title: 'Mock Test Prep',
//       subtitle: 'Ace your exams',
//       description: 'Practice with our comprehensive mock tests and track your progress',
//       image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
//       ctaText: 'Start Testing',
//       ctaLink: '/mock-tests',
//       backgroundColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
//       discount: 'Free Access',
//       icon: 'pi pi-question-circle'
//     }
//   ]);

//   // Current ad index for rotation
//   currentAdIndex = signal<number>(0);
//   showAdModal = signal<boolean>(false);
//   selectedAd = signal<AdBanner | null>(null);

//   // Carousel responsive options
//   carouselResponsiveOptions = [
//     { breakpoint: '1400px', numVisible: 4, numScroll: 1 },
//     { breakpoint: '1199px', numVisible: 3, numScroll: 1 },
//     { breakpoint: '767px', numVisible: 2, numScroll: 1 },
//     { breakpoint: '575px', numVisible: 1, numScroll: 1 }
//   ];

//   // Category icons mapping
//   categoryIcons: Record<string, string> = {
//     'Web Development': 'pi pi-code',
//     'Data Science': 'pi pi-chart-line',
//     'Marketing': 'pi pi-megaphone',
//     'Design': 'pi pi-pencil',
//     'Business': 'pi pi-briefcase',
//     'Photography': 'pi pi-camera',
//     'Music': 'pi pi-volume-up',
//     'Health': 'pi pi-heart',
//     'Language': 'pi pi-globe',
//     'IT & Software': 'pi pi-desktop',
//     'Mobile Development': 'pi pi-mobile',
//     'Game Development': 'pi pi-play'
//   };

//   // Skeleton arrays
//   skeletonArray = Array(6).fill(0);
//   categorySkeletonArray = Array(8).fill(0);

//   // Computed Signals
//   hasData = computed(() =>
//     this.featuredCourses().length > 0 ||
//     this.topRatedCourses().length > 0 ||
//     this.recentCourses().length > 0 ||
//     this.popularMockTests().length > 0
//   );

//   trendingTopics = computed(() => {
//     const categories = this.categories();
//     return categories.slice(0, 5).map(c => ({
//       name: c.name,
//       count: Math.floor(Math.random() * 50) + 20,
//       icon: this.getCategoryIcon(c.name)
//     }));
//   });

//   userProgress = computed(() => {
//     const enrollments = this.userEnrollments();
//     if (enrollments.length === 0) return 0;
//     const total = enrollments.reduce((acc, curr) => acc + (curr.progress || 0), 0);
//     return Math.round(total / enrollments.length);
//   });

//   ngOnInit(): void {
//     this.loadHomepageData();
//     this.loadUserData();

//     // Rotate ads every 8 seconds
//     setInterval(() => {
//       this.currentAdIndex.set((this.currentAdIndex() + 1) % this.adBanners().length);
//     }, 8000);
//   }

//   private loadHomepageData(): void {
//     this.isLoading.set(true);
//     this.error.set(null);

//     // Load all data in parallel
//     forkJoin({
//       categories: this.categoryService.getAllCategories().pipe(
//         catchError(err => {
//           console.error('Failed to load categories', err);
//           return of({ data: [] });
//         })
//       ),
//       featured: this.courseService.getPublishedCourses({ 
//         params: { 
//           sort: '-ratingsAverage', 
//           limit: 8,
//           isPublished: true 
//         } 
//       }).pipe(
//         catchError(err => {
//           console.error('Failed to load featured courses', err);
//           return of({ data: [] });
//         })
//       ),
//       recent: this.courseService.getPublishedCourses({ 
//         params: { 
//           sort: '-createdAt', 
//           limit: 4,
//           isPublished: true 
//         } 
//       }).pipe(
//         catchError(err => {
//           console.error('Failed to load recent courses', err);
//           return of({ data: [] });
//         })
//       ),
//       mockTests: this.mockTestService.getAll({ 
//         isPublished: true,
//         limit: 6 
//       }).pipe(
//         catchError(err => {
//           console.error('Failed to load mock tests', err);
//           return of({ data: [] });
//         })
//       )
//     })
//     .pipe(takeUntilDestroyed(this.destroyRef))
//     .subscribe({
//       next: (responses:any) => {
//         // Process categories
//         const categoriesData = responses.categories?.data?.categories || 
//                               responses.categories?.data || [];
//         this.categories.set(Array.isArray(categoriesData) ? categoriesData.slice(0, 8) : []);

//         // Process featured courses
//         const featuredData = responses.featured?.data?.data || 
//                             responses.featured?.data || [];
//         this.featuredCourses.set(Array.isArray(featuredData) ? featuredData : []);
        
//         // Also set top rated as featured for now
//         this.topRatedCourses.set(Array.isArray(featuredData) ? featuredData.slice(0, 4) : []);

//         // Process recent courses
//         const recentData = responses.recent?.data?.data || 
//                           responses.recent?.data || [];
//         this.recentCourses.set(Array.isArray(recentData) ? recentData : []);

//         // Process mock tests
//         const mockTestsData = responses.mockTests?.data?.data || 
//                              responses.mockTests?.data || [];
//         this.popularMockTests.set(Array.isArray(mockTestsData) ? mockTestsData : []);

//         this.isLoading.set(false);
//       },
//       error: (err) => {
//         console.error('Failed to load homepage data', err);
//         this.error.set('Unable to load content. Please try again later.');
//         this.isLoading.set(false);
//       }
//     });
//   }

//   private loadUserData(): void {
//     this.authService.currentUser$
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(user => {
//         this.currentUser.set(user);
//         if (user) {
//           this.loadUserEnrollments();
//         }
//       });
//   }

//   private loadUserEnrollments(): void {
//     this.enrollmentService.getMyEnrollments({ limit: 5 })
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (response: any) => {
//           const enrollments = response?.data?.enrollments || response?.data || [];
//           this.userEnrollments.set(Array.isArray(enrollments) ? enrollments : []);
//         },
//         error: (err) => console.error('Failed to load enrollments', err)
//       });
//   }

//   onSearch(): void {
//     if (this.searchQuery().trim()) {
//       this.router.navigate(['/courses'], { 
//         queryParams: { search: this.searchQuery().trim() } 
//       });
//       this.showSearchSuggestions.set(false);
//     }
//   }

//   onSearchInput(): void {
//     const query = this.searchQuery().toLowerCase();
//     if (query.length > 1) {
//       // Generate suggestions from categories and course titles
//       const categorySuggestions = this.categories()
//         .filter(c => c.name.toLowerCase().includes(query))
//         .map(c => c.name);
      
//       const courseSuggestions = this.featuredCourses()
//         .filter(c => c.title.toLowerCase().includes(query))
//         .map(c => c.title)
//         .slice(0, 3);

//       this.searchSuggestions.set([...new Set([...categorySuggestions, ...courseSuggestions])]);
//       this.showSearchSuggestions.set(true);
//     } else {
//       this.showSearchSuggestions.set(false);
//     }
//   }

//   selectSuggestion(suggestion: string): void {
//     this.searchQuery.set(suggestion);
//     this.showSearchSuggestions.set(false);
//     this.onSearch();
//   }

//   onSubscribe(): void {
//     const email = this.emailSubscription().trim();
//     if (email && this.isValidEmail(email)) {
//       // Simulate API call
//       setTimeout(() => {
//         this.subscriptionSuccess.set(true);
//         this.messageService.add({
//           severity: 'success',
//           summary: 'Subscribed!',
//           detail: 'Thank you for subscribing to our newsletter.'
//         });
//         setTimeout(() => this.subscriptionSuccess.set(false), 3000);
//         this.emailSubscription.set('');
//         this.showNewsletterModal.set(false);
//       }, 1000);
//     } else {
//       this.messageService.add({
//         severity: 'error',
//         summary: 'Invalid Email',
//         detail: 'Please enter a valid email address.'
//       });
//     }
//   }

//   isValidEmail(email: string): boolean {
//     const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return re.test(email);
//   }

//   filterByCategory(categoryId: string): void {
//     this.activeCategoryFilter.set(categoryId);
//     this.router.navigate(['/courses'], { 
//       queryParams: { category: categoryId === 'all' ? null : categoryId } 
//     });
//   }

//   getCategoryIcon(categoryName: string): string {
//     return this.categoryIcons[categoryName] || 'pi pi-folder';
//   }

//   getLevelSeverity(level: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
//     const map: Record<string, any> = {
//       'beginner': 'success',
//       'intermediate': 'info',
//       'advanced': 'danger'
//     };
//     return map[level?.toLowerCase()] || 'info';
//   }

//   formatDuration(minutes: number): string {
//     if (!minutes) return '0m';
//     const hrs = Math.floor(minutes / 60);
//     const mins = minutes % 60;
//     return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
//   }

//   calculateDiscount(price: number, discountPrice?: number): number {
//     if (!discountPrice || !price) return 0;
//     return Math.round(((price - discountPrice) / price) * 100);
//   }

//   openAdModal(ad: AdBanner): void {
//     this.selectedAd.set(ad);
//     this.showAdModal.set(true);
//   }

//   closeAdModal(): void {
//     this.showAdModal.set(false);
//     this.selectedAd.set(null);
//   }

//   trackAdClick(ad: AdBanner): void {
//     console.log('Ad clicked:', ad);
//     // Track analytics here
//   }

//   scrollToSection(elementId: string): void {
//     const element = document.getElementById(elementId);
//     if (element) {
//       element.scrollIntoView({ behavior: 'smooth', block: 'start' });
//     }
//   }

//   startMockTest(testId: string): void {
//     if (this.currentUser()) {
//       this.router.navigate(['/mock-tests/take', testId]);
//     } else {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Login Required',
//         detail: 'Please login to start the mock test.'
//       });
//       this.router.navigate(['/login'], { 
//         queryParams: { returnUrl: `/mock-tests/take/${testId}` } 
//       });
//     }
//   }

//   retry(): void {
//     this.loadHomepageData();
//   }

//   trackByCourseId(index: number, course: Course): string {
//     return course._id!;
//   }

//   trackByCategoryId(index: number, category: any): string {
//     return category._id || index;
//   }

//   trackByTestId(index: number, test: any): string {
//     return test._id || index;
//   }

//   trackByTestimonialId(index: number, testimonial: Testimonial): string {
//     return testimonial.id;
//   }
// }

// // import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
// // import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// // import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
// // import { RouterModule } from '@angular/router';
// // import { FormsModule } from '@angular/forms';

// // // PrimeNG Modules
// // import { ButtonModule } from 'primeng/button';
// // import { CarouselModule } from 'primeng/carousel';
// // import { CardModule } from 'primeng/card';
// // import { TagModule } from 'primeng/tag';
// // import { SkeletonModule } from 'primeng/skeleton';
// // import { InputTextModule } from 'primeng/inputtext';
// // import { AvatarModule } from 'primeng/avatar';
// // import { TooltipModule } from 'primeng/tooltip';
// // import { RippleModule } from 'primeng/ripple';
// // import { DividerModule } from 'primeng/divider';
// // import { Dialog } from "primeng/dialog";

// // // Components & Models
// // import { Course, Category } from '../../../core/models/course.model';
// // import { PropertyCourseCardComponent } from '../../../shared/components/course-card.component';
// // import { TopRatedCourseCardComponent } from "../../courses/components/top-rated-courses/top-rated-course-card.component";
// // import { TopRatedCoursesComponent } from "../../courses/components/top-rated-courses/top-rated-courses";
// // import { CourseListComponent } from "../../courses/components/courselist/course-list.component";

// // // Services
// // import { CategoryService } from '../../../core/services/category.service';
// // import { CourseService } from '../../../core/services/course.service';


// // interface Testimonial {
// //   id: string;
// //   name: string;
// //   role: string;
// //   content: string;
// //   avatar: string;
// //   rating: number;
// // }

// // interface Statistic {
// //   value: string;
// //   label: string;
// //   icon: string;
// // }

// // @Component({
// //   selector: 'app-home-screen',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     RouterModule,
// //     FormsModule,
// //     ButtonModule,
// //     CarouselModule,
// //     CardModule,
// //     TagModule,
// //     SkeletonModule,
// //     InputTextModule,
// //     AvatarModule,
// //     TooltipModule,
// //     RippleModule,
// //     DividerModule,
// //     PropertyCourseCardComponent,
// //     TopRatedCoursesComponent,
// //     CourseListComponent,
// //   ],
// //   templateUrl: './home-screen.html',
// //   styleUrls: ['./home-screen.scss']
// // })
// // export class HomeScreen implements OnInit {
// //   onSubscribe() {
// //     throw new Error('Method not implemented.');
// //   }
// //   subscriptionSuccess() {
// //     return true
// //   }
// //   emailSubscription: any;
// //   totalStudents() {
// //     return 4000
// //   }

// //   // Injectors
// //   private courseApiService = inject(CourseService); // <-- Updated Injection
// //   private categoryService = inject(CategoryService);
// //   private destroyRef = inject(DestroyRef);

// //   // State Signals
// //   isLoading = signal<boolean>(true);
// //   error = signal<string | null>(null);

// //   // Data Signals
// //   featuredCourses = signal<Course[]>([]);
// //   topRatedCourses = signal<Course[]>([]);
// //   recentCourses = signal<Course[]>([]);
// //   categories = signal<any[]>([]);

// //   // Search
// //   searchQuery = signal<string>('');

// //   // Testimonials
// //   testimonials: any[] = [
// //     {
// //       id: '1',
// //       name: 'Priya Sharma',
// //       role: 'Software Developer',
// //       content: 'The courses here transformed my career. I went from a beginner to landing my dream job as a full-stack developer!',
// //       avatar: 'https://i.pravatar.cc/150?img=1',
// //       rating: 5
// //     },
// //     {
// //       id: '2',
// //       name: 'Rahul Verma',
// //       role: 'Data Scientist',
// //       content: 'Excellent content and knowledgeable instructors. The data science masterclass was exactly what I needed to upskill.',
// //       avatar: 'https://i.pravatar.cc/150?img=2',
// //       rating: 5
// //     },
// //     {
// //       id: '3',
// //       name: 'Anjali Patel',
// //       role: 'Digital Marketer',
// //       content: 'The digital marketing course is comprehensive and practical. I\'ve already implemented strategies that doubled our traffic.',
// //       avatar: 'https://i.pravatar.cc/150?img=3',
// //       rating: 4
// //     },
// //     {
// //       id: '4',
// //       name: 'Vikram Singh',
// //       role: 'Entrepreneur',
// //       content: 'As a business owner, the entrepreneurship course gave me the tools to scale my startup. Highly recommended!',
// //       avatar: 'https://i.pravatar.cc/150?img=4',
// //       rating: 5
// //     }
// //   ];
  
// //   adBanners = signal<any[]>([
// //     {
// //       id: '1',
// //       title: 'Summer Learning Sale!',
// //       subtitle: 'Get 40% off on all courses',
// //       description: 'Limited time offer. Upgrade your skills today!',
// //       image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
// //       ctaText: 'Shop Now',
// //       ctaLink: '/courses',
// //       backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
// //       discount: '40% OFF'
// //     },
// //     {
// //       id: '2',
// //       title: 'Become an Instructor',
// //       subtitle: 'Share your knowledge',
// //       description: 'Join our community of expert instructors and earn while you teach',
// //       image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655',
// //       ctaText: 'Start Teaching',
// //       ctaLink: '/become-instructor',
// //       backgroundColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
// //       discount: 'Earn 70%'
// //     },
// //     {
// //       id: '3',
// //       title: 'Enterprise Solutions',
// //       subtitle: 'For teams of 10+',
// //       description: 'Get custom learning paths and analytics for your organization',
// //       image: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
// //       ctaText: 'Contact Sales',
// //       ctaLink: '/enterprise',
// //       backgroundColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
// //     }
// //   ]);

// //   currentAdIndex = signal<number>(0);
// //   showAdModal = signal<boolean>(false);
// //   selectedAd = signal<any | null>(null);

// //   // Methods for ad interactions
// //   openAdModal(ad: any): void {
// //     this.selectedAd.set(ad);
// //     this.showAdModal.set(true);
// //   }

// //   closeAdModal(): void {
// //     this.showAdModal.set(false);
// //     this.selectedAd.set(null);
// //   }

// //   trackAdClick(ad: any): void {
// //     console.log('Ad clicked:', ad);
// //     // Track analytics here
// //   }
  
// //   // Statistics
// //   statistics: any[] = [
// //     { value: '50K+', label: 'Active Students', icon: 'pi pi-users' },
// //     { value: '200+', label: 'Expert Instructors', icon: 'pi pi-star' },
// //     { value: '500+', label: 'Courses', icon: 'pi pi-book' },
// //     { value: '95%', label: 'Satisfaction Rate', icon: 'pi pi-heart' }
// //   ];

// //   // Carousel responsive options
// //   carouselResponsiveOptions = [
// //     { breakpoint: '1400px', numVisible: 4, numScroll: 1 },
// //     { breakpoint: '1199px', numVisible: 3, numScroll: 1 },
// //     { breakpoint: '767px', numVisible: 2, numScroll: 1 },
// //     { breakpoint: '575px', numVisible: 1, numScroll: 1 }
// //   ];

// //   // Derived Signals
// //   hasData = computed(() =>
// //     this.featuredCourses().length > 0 ||
// //     this.topRatedCourses().length > 0 ||
// //     this.recentCourses().length > 0
// //   );

// //   // Skeleton arrays
// //   skeletonArray = Array(4).fill(0);

// //   ngOnInit(): void {
// //     this.loadHomepageData();

// //     // Rotate ads every 8 seconds
// //     setInterval(() => {
// //       this.currentAdIndex.set((this.currentAdIndex() + 1) % this.adBanners().length);
// //     }, 8000);
// //   }

// //   private loadHomepageData(): void {
// //     this.isLoading.set(true);
// //     this.error.set(null);

// //     // Load categories first
// //     this.categoryService.getAllCategories()
// //       .pipe(takeUntilDestroyed(this.destroyRef))
// //       .subscribe({
// //         next: (response: any) => {
// //           // Assuming CategoryService will eventually be updated to use the new ApiResponse structure too
// //           const categories = response.data?.categories || response.data || [];
// //           this.categories.set(categories.slice(0, 6)); 
// //         },
// //         error: (err) => console.error('Failed to load categories', err)
// //       });

// //     // <-- Updated: Load featured courses using getPublishedCourses with query params
// //     this.courseApiService.getPublishedCourses({ params: { sort: '-ratingsAverage', limit: 4 } })
// //       .pipe(takeUntilDestroyed(this.destroyRef))
// //       .subscribe({
// //         next: (response: any) => {
// //           this.featuredCourses.set(response.data || []);
// //         },
// //         error: (err) => console.error('Failed to load featured courses', err)
// //       });

// //     // <-- Updated: Load top rated courses using getPublishedCourses with query params
// //     this.courseApiService.getPublishedCourses({ params: { sort: '-ratingsAverage', limit: 8 } })
// //       .pipe(takeUntilDestroyed(this.destroyRef))
// //       .subscribe({
// //         next: (response: any) => {
// //           this.topRatedCourses.set(response.data || []);
// //         },
// //         error: (err) => console.error('Failed to load top rated courses', err)
// //       });

// //     this.courseApiService.getPublishedCourses({ params: { limit: 4, sort: '-createdAt' } })
// //       .pipe(takeUntilDestroyed(this.destroyRef))
// //       .subscribe({
// //         next: (response: any) => {
// //           this.recentCourses.set(response.data || []);
// //           this.isLoading.set(false);
// //         },
// //         error: (err) => {
// //           console.error('Failed to load recent courses', err);
// //           this.error.set('Unable to load courses. Please try again later.');
// //           this.isLoading.set(false);
// //         }
// //       });
// //   }

// //   onSearch(): void {
// //     if (this.searchQuery().trim()) {
// //       // Navigate to search page with query
// //       // this.router.navigate(['/courses'], { queryParams: { q: this.searchQuery() } });
// //       console.log('Searching for:', this.searchQuery());
// //     }
// //   }

// //   getCategoryIcon(categoryName: string): string {
// //     const icons: Record<string, string> = {
// //       'Web Development': 'pi pi-code',
// //       'Data Science': 'pi pi-chart-line',
// //       'Marketing': 'pi pi-megaphone',
// //       'Design': 'pi pi-pencil',
// //       'Business': 'pi pi-briefcase',
// //       'Photography': 'pi pi-camera'
// //     };
// //     return icons[categoryName] || 'pi pi-folder';
// //   }

// //   scrollToSection(elementId: string): void {
// //     const element = document.getElementById(elementId);
// //     if (element) {
// //       element.scrollIntoView({ behavior: 'smooth' });
// //     }
// //   }

// //   retry(): void {
// //     this.loadHomepageData();
// //   }

// //   trackByCourseId(index: number, course: Course): string {
// //     return course._id!;
// //   }

// //   trackByCategoryId(index: number, category: Category): string {
// //     return category._id!;
// //   }
// // }
