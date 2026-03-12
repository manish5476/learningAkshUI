import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG Modules
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
import { Course, Category } from '../../../core/models/course.model';
import { CategoryService } from '../../../core/services/category.service';
import { CourseService } from '../../../core/services/course.service';
import { PropertyCourseCardComponent } from '../../../shared/components/course-card.component';
import { FormsModule } from '@angular/forms';
import { TopRatedCourseCardComponent } from "../../courses/components/top-rated-courses/top-rated-course-card.component";
import { TopRatedCoursesComponent } from "../../courses/components/top-rated-courses/top-rated-courses";
import { CourseListComponent } from "../../courses/components/courselist/course-list.component";
import { Dialog } from "primeng/dialog";

// Services


interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
}

interface Statistic {
  value: string;
  label: string;
  icon: string;
}

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
    PropertyCourseCardComponent,
    TopRatedCoursesComponent,
    CourseListComponent,
],
  templateUrl: './home-screen.html',
  styleUrls: ['./home-screen.scss']
})
export class HomeScreen implements OnInit {
onSubscribe() {
throw new Error('Method not implemented.');
}
subscriptionSuccess() {
return true
}
emailSubscription: any;
totalStudents() {
return 4000
}
  private courseService = inject(CourseService);
  private categoryService = inject(CategoryService);
  private destroyRef = inject(DestroyRef);

  // State Signals
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Data Signals
  featuredCourses = signal<Course[]>([]);
  topRatedCourses = signal<Course[]>([]);
  recentCourses = signal<Course[]>([]);
  categories = signal<any[]>([]);

  // Search
  searchQuery = signal<string>('');

  // Testimonials
  testimonials: any[] = [
    {
      id: '1',
      name: 'Priya Sharma',
      role: 'Software Developer',
      content: 'The courses here transformed my career. I went from a beginner to landing my dream job as a full-stack developer!',
      avatar: 'https://i.pravatar.cc/150?img=1',
      rating: 5
    },
    {
      id: '2',
      name: 'Rahul Verma',
      role: 'Data Scientist',
      content: 'Excellent content and knowledgeable instructors. The data science masterclass was exactly what I needed to upskill.',
      avatar: 'https://i.pravatar.cc/150?img=2',
      rating: 5
    },
    {
      id: '3',
      name: 'Anjali Patel',
      role: 'Digital Marketer',
      content: 'The digital marketing course is comprehensive and practical. I\'ve already implemented strategies that doubled our traffic.',
      avatar: 'https://i.pravatar.cc/150?img=3',
      rating: 4
    },
    {
      id: '4',
      name: 'Vikram Singh',
      role: 'Entrepreneur',
      content: 'As a business owner, the entrepreneurship course gave me the tools to scale my startup. Highly recommended!',
      avatar: 'https://i.pravatar.cc/150?img=4',
      rating: 5
    }
  ];
  adBanners = signal<any[]>([
    {
      id: '1',
      title: 'Summer Learning Sale!',
      subtitle: 'Get 40% off on all courses',
      description: 'Limited time offer. Upgrade your skills today!',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
      ctaText: 'Shop Now',
      ctaLink: '/courses',
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      discount: '40% OFF'
    },
    {
      id: '2',
      title: 'Become an Instructor',
      subtitle: 'Share your knowledge',
      description: 'Join our community of expert instructors and earn while you teach',
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655',
      ctaText: 'Start Teaching',
      ctaLink: '/become-instructor',
      backgroundColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      discount: 'Earn 70%'
    },
    {
      id: '3',
      title: 'Enterprise Solutions',
      subtitle: 'For teams of 10+',
      description: 'Get custom learning paths and analytics for your organization',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978',
      ctaText: 'Contact Sales',
      ctaLink: '/enterprise',
      backgroundColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ]);

  currentAdIndex = signal<number>(0);
  showAdModal = signal<boolean>(false);
  selectedAd = signal<any | null>(null);

  // Auto-rotate ads

  // Methods for ad interactions
  openAdModal(ad: any): void {
    this.selectedAd.set(ad);
    this.showAdModal.set(true);
  }

  closeAdModal(): void {
    this.showAdModal.set(false);
    this.selectedAd.set(null);
  }

  trackAdClick(ad: any): void {
    console.log('Ad clicked:', ad);
    // Track analytics here
  }
  // Statistics
  statistics: any[] = [
    { value: '50K+', label: 'Active Students', icon: 'pi pi-users' },
    { value: '200+', label: 'Expert Instructors', icon: 'pi pi-star' },
    { value: '500+', label: 'Courses', icon: 'pi pi-book' },
    { value: '95%', label: 'Satisfaction Rate', icon: 'pi pi-heart' }
  ];

  // Carousel responsive options
  carouselResponsiveOptions = [
    { breakpoint: '1400px', numVisible: 4, numScroll: 1 },
    { breakpoint: '1199px', numVisible: 3, numScroll: 1 },
    { breakpoint: '767px', numVisible: 2, numScroll: 1 },
    { breakpoint: '575px', numVisible: 1, numScroll: 1 }
  ];

  // Derived Signals
  hasData = computed(() =>
    this.featuredCourses().length > 0 ||
    this.topRatedCourses().length > 0 ||
    this.recentCourses().length > 0
  );

  // Skeleton arrays
  skeletonArray = Array(4).fill(0);

  ngOnInit(): void {
    this.loadHomepageData();

    // Rotate ads every 8 seconds
    setInterval(() => {
      this.currentAdIndex.set((this.currentAdIndex() + 1) % this.adBanners().length);
    }, 8000);
  }

  private loadHomepageData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Load categories first
    this.categoryService.getAllCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const categories = response.data?.categories || response.data || [];
          this.categories.set(categories.slice(0, 6)); // Show top 6 categories
        },
        error: (err) => console.error('Failed to load categories', err)
      });

    // Load featured courses (using top-rated as featured for now)
    this.courseService.getTopRatedCourses(4)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const courses = response.data?.courses || response.data || [];
          this.featuredCourses.set(courses);
        },
        error: (err) => console.error('Failed to load featured courses', err)
      });

    // Load top rated courses
    this.courseService.getTopRatedCourses(8)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const courses = response.data?.courses || response.data || [];
          this.topRatedCourses.set(courses);
        },
        error: (err) => console.error('Failed to load top rated courses', err)
      });

    // Load recent courses (you might need to add this endpoint)
    this.courseService.getAllCourses({ limit: 4, sort: '-createdAt' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          const courses = response.data?.courses || response.data || [];
          this.recentCourses.set(courses);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load recent courses', err);
          this.error.set('Unable to load courses. Please try again later.');
          this.isLoading.set(false);
        }
      });
  }

  onSearch(): void {
    if (this.searchQuery().trim()) {
      // Navigate to search page with query
      // this.router.navigate(['/courses'], { queryParams: { q: this.searchQuery() } });
      console.log('Searching for:', this.searchQuery());
    }
  }

  getCategoryIcon(categoryName: string): string {
    const icons: Record<string, string> = {
      'Web Development': 'pi pi-code',
      'Data Science': 'pi pi-chart-line',
      'Marketing': 'pi pi-megaphone',
      'Design': 'pi pi-pencil',
      'Business': 'pi pi-briefcase',
      'Photography': 'pi pi-camera'
    };
    return icons[categoryName] || 'pi pi-folder';
  }

  scrollToSection(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  retry(): void {
    this.loadHomepageData();
  }

  trackByCourseId(index: number, course: Course): string {
    return course._id;
  }

  trackByCategoryId(index: number, category: Category): string {
    return category._id;
  }
}

// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-home-screen',
//   imports: [],
//   templateUrl: './home-screen.html',
//   styleUrl: './home-screen.scss',
// })
// export class HomeScreen {

// }
