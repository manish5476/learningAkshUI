
import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
// import { CategoryService } from '../../../core//category.service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
// import { selectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { SelectModule } from 'primeng/select';
import { CategoryService } from '../../../../core/services/category.service';

interface PopularCategory {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  courseCount: number;
  description?: string;
  parentCategory?: string;
  isActive?: boolean;
  subcategories?: number;
  totalStudents?: number;
  avgRating?: number;
  trending?: boolean;
}

@Component({
  selector: 'app-popular-categories',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    SkeletonModule,
    TooltipModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ProgressBarModule,
    AvatarModule,
    AvatarGroupModule
  ],
templateUrl:'./popular-categories.component.html',
  styleUrl: './popular-categories.component.scss'
})
export class PopularCategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  
  // Data signals
  categories = signal<PopularCategory[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
    protected readonly Math = Math; 

  // Filter signals
  searchQuery = signal('');
  selectedSort = signal<any>('popular');
  selectedLimit = signal<number>(6);
  showTrendingOnly = signal(false);
  page = signal(1);
  
  // Favorites
  favorites = signal<Set<string>>(new Set());
  
  // Computed values
  totalCategories = computed(() => this.categories().length);
  totalCourses = computed(() => 
    this.categories().reduce((sum, cat) => sum + cat.courseCount, 0)
  );
  avgCoursesPerCategory = computed(() => 
    Math.round(this.totalCourses() / this.totalCategories()) || 0
  );
  
  filteredCategories = computed(() => {
    let filtered = this.categories();
    
    // Apply search filter
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(query) ||
        cat.slug.toLowerCase().includes(query)
      );
    }
    
    // Apply trending filter
    if (this.showTrendingOnly()) {
      filtered = filtered.filter(cat => cat.trending);
    }
    
    // Apply sorting
    switch (this.selectedSort()) {
      case 'popular':
        filtered = [...filtered].sort((a, b) => b.courseCount - a.courseCount);
        break;
      case 'alphabetical':
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        // Assuming you have a createdAt field
        filtered = [...filtered];
        break;
    }
    
    return filtered;
  });
  
  hasActiveFilters = computed(() => 
    !!this.searchQuery() || 
    !!this.selectedSort() || 
    this.showTrendingOnly()
  );
  
  hasMorePages = computed(() => 
    this.filteredCategories().length >= this.selectedLimit() * this.page()
  );
  
  sortOptions = [
    { label: 'Most Popular', value: 'popular' },
    { label: 'Alphabetical', value: 'alphabetical' },
    { label: 'Newest First', value: 'newest' }
  ];
  
  limitOptions = [
    { label: '6 per page', value: 6 },
    { label: '12 per page', value: 12 },
    { label: '24 per page', value: 24 }
  ];

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    const params: any = {
      limit: this.selectedLimit(),
      page: this.page()
    };
    
    if (this.selectedSort()) {
      params.sort = this.selectedSort();
    }
    
    this.categoryService.getPopularCategories(params).subscribe({
      next: (response: any) => {
        const categories = response?.data?.categories || [];
        
        // Enhance categories with mock data (replace with real data from API)
        const enhancedCategories = categories.map((cat: PopularCategory, index: number) => ({
          ...cat,
          subcategories: Math.floor(Math.random() * 5) + 1,
          avgRating: (4 + Math.random()).toFixed(1),
          trending: index < 2 ? true : false
        }));
        
        this.categories.set(enhancedCategories);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.page.set(1);
    // Implement debounced search
  }

  onSortChange(): void {
    this.page.set(1);
    this.loadCategories();
  }

  onLimitChange(): void {
    this.page.set(1);
    this.loadCategories();
  }

  onFilterChange(): void {
    this.page.set(1);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedSort.set('popular');
    this.selectedLimit.set(6);
    this.showTrendingOnly.set(false);
    this.page.set(1);
    this.loadCategories();
  }

  loadMore(): void {
    this.loadingMore.set(true);
    this.page.update(p => p + 1);
    
    // Load more categories
    this.categoryService.getPopularCategories({
      limit: this.selectedLimit(),
      page: this.page()
    }).subscribe({
      next: (response: any) => {
        const newCategories = response?.data?.categories || [];
        this.categories.update(current => [...current, ...newCategories]);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
      }
    });
  }

  getSortLabel(value: string): string {
    const option = this.sortOptions.find(opt => opt.value === value);
    return option ? option.label : '';
  }

  getPopularityPercentage(category: PopularCategory): number {
    const maxCourses = Math.max(...this.categories().map(c => c.courseCount));
    return Math.round((category.courseCount / maxCourses) * 100);
  }

  getMediaClass(category: PopularCategory): string {
    return category.image ? 'with-image' : 'with-gradient';
  }

  getGradient(category: PopularCategory): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    ];
    const index = category.name.length % gradients.length;
    return gradients[index];
  }

  getTrendingColor(category: PopularCategory): string {
    const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6'];
    const index = category.name.length % colors.length;
    return colors[index];
  }

  getDefaultIcon(category: PopularCategory): string {
    const icons: { [key: string]: string } = {
      'Development': 'pi pi-code',
      'Business': 'pi pi-briefcase',
      'Finance': 'pi pi-dollar',
      'Design': 'pi pi-pencil',
      'Marketing': 'pi pi-megaphone',
      'Music': 'pi pi-volume-up',
      'Photography': 'pi pi-camera'
    };
    
    return icons[category.name] || 'pi pi-folder';
  }

  getSampleCourseName(category: PopularCategory, index: number): any {
    const templates = [`
      \`Complete \${category.name} Masterclass\`,
      \`\${category.name} for Beginners\`,
      \`Advanced \${category.name} Techniques\`,
      \`\${category.name} Certification Guide\`,
      \`Practical \${category.name} Projects\`
    `];
    return templates[(index - 1) % templates.length];
  }

  toggleFavorite(category: PopularCategory): void {
    const favorites = this.favorites();
    if (favorites.has(category._id)) {
      favorites.delete(category._id);
    } else {
      favorites.add(category._id);
    }
    this.favorites.set(new Set(favorites));
  }

  isFavorite(category: PopularCategory): boolean {
    return this.favorites().has(category._id);
  }
}



// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TooltipModule } from 'primeng/tooltip';
// import { CategoryService } from '../../../../core/services/category.service';

// interface PopularCategory {
//   _id: string;
//   name: string;
//   slug: string;
//   icon?: string;
//   image?: string;
//   courseCount: number;
// }

// @Component({
//   selector: 'app-popular-categories',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ButtonModule,
//     SkeletonModule,
//     TooltipModule
//   ],
//   template: `
//     <div class="popular-categories-container fade-in">
      
//       <!-- Section Header -->
//       <div class="section-header flex-between flex-wrap gap-lg mb-4xl">
//         <div class="header-left">
//           <h2 class="section-title font-heading text-2xl md:text-3xl text-primary font-bold m-0 mb-sm">
//             Popular Categories
//           </h2>
//           <p class="section-subtitle text-secondary text-md m-0">
//             Most enrolled courses by category
//           </p>
//         </div>
        
//         @if (categories().length > 0) {
//           <div class="header-right">
//             <a [routerLink]="['/categories']" class="view-all-link flex align-items-center gap-sm text-info hover:text-primary transition-base text-decoration-none">
//               <span class="font-bold">View All Categories</span>
//               <i class="pi pi-arrow-right text-sm"></i>
//             </a>
//           </div>
//         }
//       </div>

//       <!-- Loading State -->
//       @if (loading()) {
//         <div class="categories-grid">
//           @for (item of [1,2,3,4]; track item) {
//             <div class="category-card glass-panel p-xl">
//               <div class="card-header flex align-items-center gap-lg mb-lg">
//                 <p-skeleton shape="circle" size="48px" styleClass="mr-2"></p-skeleton>
//                 <div class="flex-grow-1">
//                   <p-skeleton width="80%" height="24px" styleClass="mb-sm"></p-skeleton>
//                   <p-skeleton width="40%" height="16px"></p-skeleton>
//                 </div>
//               </div>
//               <p-skeleton width="100%" height="120px" styleClass="mb-lg"></p-skeleton>
//               <div class="card-footer flex-between">
//                 <p-skeleton width="60px" height="20px"></p-skeleton>
//                 <p-skeleton width="80px" height="32px" borderRadius="16px"></p-skeleton>
//               </div>
//             </div>
//           }
//         </div>
//       } @else {
//         <!-- Categories Grid -->
//         <div class="categories-grid">
//           @for (category of categories(); track category._id) {
//             <div class="category-card glass-panel surface-raised overflow-hidden">
              
//               <!-- Card Header with Icon/Image -->
//               <div class="card-header p-xl pb-lg">
//                 <div class="flex align-items-center gap-lg">
//                   <!-- Icon or Image -->
//                   <div class="category-icon-wrapper" [class.has-image]="category.image">
//                     @if (category.image) {
//                       <img [src]="category.image" [alt]="category.name" class="category-image" loading="lazy">
//                     } @else {
//                       <div class="category-icon" [ngClass]="getIconClass(category)">
//                         <i [class]="category.icon || 'pi pi-folder'"></i>
//                       </div>
//                     }
//                   </div>
                  
//                   <!-- Category Info -->
//                   <div class="category-info flex-grow-1">
//                     <h3 class="category-name font-heading text-xl text-primary font-bold m-0 mb-xs line-clamp-1" 
//                         [title]="category.name">
//                       {{ category.name }}
//                     </h3>
//                     <div class="category-meta flex align-items-center gap-sm">
//                       <span class="course-count-badge font-mono text-xs font-bold">
//                         <i class="pi pi-book mr-xs"></i>
//                         {{ category.courseCount }} {{ category.courseCount === 1 ? 'Course' : 'Courses' }}
//                       </span>
//                       <span class="category-slug text-tertiary text-xs">/{{ category.slug }}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <!-- Card Body (Optional - you can add description if available) -->
//               <div class="card-body px-xl pb-xl">
//                 <div class="category-stats flex align-items-center gap-lg">
//                   <div class="stat-item">
//                     <span class="stat-label text-tertiary text-xs uppercase tracking-widest font-bold">Courses</span>
//                     <span class="stat-value text-primary font-bold text-2xl">{{ category.courseCount }}</span>
//                   </div>
//                   <div class="stat-divider"></div>
//                   <div class="stat-item">
//                     <span class="stat-label text-tertiary text-xs uppercase tracking-widest font-bold">Students</span>
//                     <span class="stat-value text-primary font-bold text-2xl">{{ category.courseCount * 150 | number }}</span>
//                   </div>
//                 </div>
//               </div>

//               <!-- Card Footer -->
//               <div class="card-footer bg-ternary border-top-subtle p-xl flex-between flex-wrap gap-md">
//                 <span class="popularity-badge flex align-items-center gap-xs">
//                   <i class="pi pi-star-fill text-warning text-sm"></i>
//                   <span class="text-secondary text-xs font-bold">Popular Choice</span>
//                 </span>
                
//                 <a [routerLink]="['/categories', category.slug]" 
//                    class="explore-link flex align-items-center gap-sm text-info hover:text-primary transition-base text-decoration-none">
//                   <span class="font-bold text-sm">Explore</span>
//                   <i class="pi pi-arrow-right text-xs"></i>
//                 </a>
//               </div>
//             </div>
//           } @empty {
//             <!-- Empty State -->
//             <div class="empty-state glass-panel col-span-full flex-col flex-center text-center py-5xl">
//               <div class="empty-icon-wrapper flex-center border-radius-full bg-ternary mb-2xl">
//                 <i class="pi pi-sitemap text-5xl text-tertiary"></i>
//               </div>
//               <h3 class="font-heading text-2xl text-primary font-bold m-0 mb-xs">No categories found</h3>
//               <p class="text-secondary m-0 mb-xl max-w-prose">Categories will appear here once courses are added.</p>
//             </div>
//           }
//         </div>

//         <!-- View All Link (Mobile) -->
//         @if (categories().length > 0) {
//           <div class="view-all-mobile text-center mt-4xl lg-hidden">
//             <a [routerLink]="['/categories']" class="view-all-btn inline-flex align-items-center gap-sm text-info hover:text-primary transition-base text-decoration-none">
//               <span class="font-bold">Browse All Categories</span>
//               <i class="pi pi-arrow-right"></i>
//             </a>
//           </div>
//         }
//       }
//     </div>
//   `,
//   styles: [`
//     @use '../../../../../styles/mixins' as *;

//     .popular-categories-container {
//       padding: var(--spacing-xl) var(--spacing-md);
//       max-width: 1400px;
//       margin: 0 auto;
      
//       @include lg {
//         padding: var(--spacing-3xl) var(--spacing-2xl);
//       }
//     }

//     .section-header {
//       .view-all-link {
//         padding: var(--spacing-sm) var(--spacing-lg);
//         border-radius: var(--ui-border-radius-full);
//         background: var(--color-info-bg);
//         transition: var(--transition-base);
        
//         &:hover {
//           background: var(--color-info);
          
//           span, i {
//             color: white;
//           }
//         }
//       }
//     }

//     .glass-panel {
//       background: var(--glass-bg-c);
//       backdrop-filter: blur(var(--glass-blur-c));
//       border: var(--ui-border-width) solid var(--glass-border-c);
//       border-radius: var(--ui-border-radius-xl);
//     }

//     .surface-raised {
//       box-shadow: var(--shadow-lg);
//       transition: var(--transition-base);
      
//       &:hover {
//         transform: translateY(-4px);
//         box-shadow: var(--shadow-2xl);
//         border-color: var(--color-primary);
//       }
//     }

//     .categories-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-xl);
      
//       @include sm {
//         grid-template-columns: repeat(2, 1fr);
//       }
      
//       @include lg {
//         grid-template-columns: repeat(4, 1fr);
//         gap: var(--spacing-2xl);
//       }
//     }

//     .category-card {
//       display: flex;
//       flex-direction: column;
//       height: 100%;
      
//       .card-header {
//         .category-icon-wrapper {
//           width: clamp(48px, 10vw, 64px);
//           height: clamp(48px, 10vw, 64px);
//           border-radius: var(--ui-border-radius-lg);
//           overflow: hidden;
//           flex-shrink: 0;
          
//           &.has-image {
//             background: var(--bg-ternary);
//           }
          
//           .category-image {
//             width: 100%;
//             height: 100%;
//             object-fit: cover;
//             transition: transform 0.3s ease;
            
//             &:hover {
//               transform: scale(1.1);
//             }
//           }
          
//           .category-icon {
//             width: 100%;
//             height: 100%;
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             background: var(--color-primary-bg);
//             color: var(--color-primary);
//             font-size: var(--font-size-2xl);
//             border-radius: inherit;
            
//             &.has-bg {
//               background: linear-gradient(135deg, var(--color-primary-bg) 0%, var(--color-primary-light) 100%);
//             }
//           }
//         }
        
//         .category-name {
//           font-size: var(--font-size-lg);
          
//           @include md {
//             font-size: var(--font-size-xl);
//           }
//         }
        
//         .course-count-badge {
//           display: inline-flex;
//           align-items: center;
//           padding: var(--spacing-xs) var(--spacing-sm);
//           background: var(--color-success-bg);
//           color: var(--color-success);
//           border-radius: var(--ui-border-radius-sm);
//           border: 1px solid var(--color-success-border);
//         }
        
//         .category-slug {
//           font-family: var(--font-mono);
//           opacity: 0.7;
//         }
//       }
      
//       .card-body {
//         .category-stats {
//           display: flex;
//           align-items: center;
//           justify-content: space-around;
//           padding: var(--spacing-md) 0;
          
//           .stat-item {
//             text-align: center;
//             flex: 1;
            
//             .stat-label {
//               display: block;
//               margin-bottom: var(--spacing-xs);
//             }
            
//             .stat-value {
//               line-height: 1;
//             }
//           }
          
//           .stat-divider {
//             width: 1px;
//             height: 30px;
//             background: var(--border-secondary);
//           }
//         }
//       }
      
//       .card-footer {
//         margin-top: auto;
        
//         .popularity-badge {
//           padding: var(--spacing-xs) var(--spacing-sm);
//           background: var(--color-warning-bg);
//           border-radius: var(--ui-border-radius-sm);
//           border: 1px solid var(--color-warning-border);
//         }
        
//         .explore-link {
//           padding: var(--spacing-xs) var(--spacing-md);
//           border-radius: var(--ui-border-radius-full);
//           background: var(--color-info-bg);
//           transition: var(--transition-base);
          
//           &:hover {
//             background: var(--color-info);
            
//             span, i {
//               color: white;
//             }
//           }
//         }
//       }
//     }

//     .empty-state {
//       .empty-icon-wrapper {
//         width: clamp(80px, 15vw, 100px);
//         height: clamp(80px, 15vw, 100px);
//         background: var(--bg-ternary);
//       }
//     }

//     .view-all-mobile {
//       .view-all-btn {
//         padding: var(--spacing-md) var(--spacing-2xl);
//         background: var(--color-info-bg);
//         border-radius: var(--ui-border-radius-full);
//         font-weight: var(--font-weight-bold);
//         transition: var(--transition-base);
        
//         &:hover {
//           background: var(--color-info);
//           color: white;
          
//           i {
//             color: white;
//           }
//         }
//       }
//     }

//     // Utility Classes
//     .flex { display: flex; }
//     .flex-wrap { flex-wrap: wrap; }
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-center { display: flex; align-items: center; justify-content: center; }
//     .flex-between { display: flex; justify-content: space-between; align-items: center; }
//     .flex-grow-1 { flex-grow: 1; }
//     .align-items-center { align-items: center; }
//     .justify-content-center { justify-content: center; }
//     .text-center { text-align: center; }
    
//     // Spacing
//     .m-0 { margin: 0; }
//     .mb-xs { margin-bottom: var(--spacing-xs); }
//     .mb-sm { margin-bottom: var(--spacing-sm); }
//     .mb-lg { margin-bottom: var(--spacing-lg); }
//     .mb-xl { margin-bottom: var(--spacing-xl); }
//     .mb-2xl { margin-bottom: var(--spacing-2xl); }
//     .mb-4xl { margin-bottom: var(--spacing-2xl); @include md { margin-bottom: var(--spacing-4xl); } }
//     .mt-4xl { margin-top: var(--spacing-2xl); @include md { margin-top: var(--spacing-4xl); } }
//     .p-xl { padding: var(--spacing-xl); }
//     .px-xl { padding-left: var(--spacing-xl); padding-right: var(--spacing-xl); }
//     .pb-xl { padding-bottom: var(--spacing-xl); }
//     .py-5xl { padding-top: var(--spacing-4xl); padding-bottom: var(--spacing-4xl); @include md { padding-top: var(--spacing-5xl); padding-bottom: var(--spacing-5xl); } }
//     .gap-xs { gap: var(--spacing-xs); }
//     .gap-sm { gap: var(--spacing-sm); }
//     .gap-md { gap: var(--spacing-md); }
//     .gap-lg { gap: var(--spacing-lg); }
//     .gap-xl { gap: var(--spacing-xl); }
//     .mr-xs { margin-right: var(--spacing-xs); }
    
//     // Typography
//     .font-heading { font-family: var(--font-heading); }
//     .font-mono { font-family: var(--font-mono); }
//     .font-bold { font-weight: var(--font-weight-bold); }
//     .text-xs { font-size: var(--font-size-xs); }
//     .text-sm { font-size: var(--font-size-sm); }
//     .text-md { font-size: var(--font-size-base); @include md { font-size: var(--font-size-md); } }
//     .text-lg { font-size: var(--font-size-base); @include md { font-size: var(--font-size-lg); } }
//     .text-xl { font-size: var(--font-size-lg); @include md { font-size: var(--font-size-xl); } }
//     .text-2xl { font-size: var(--font-size-xl); @include md { font-size: var(--font-size-2xl); } }
//     .text-3xl { font-size: var(--font-size-2xl); @include md { font-size: var(--font-size-3xl); } }
//     .text-5xl { font-size: var(--font-size-4xl); @include md { font-size: var(--font-size-5xl); } }
//     .uppercase { text-transform: uppercase; }
//     .tracking-widest { letter-spacing: 0.1em; }
//     .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
//     .text-decoration-none { text-decoration: none; }
//     .max-w-prose { max-width: 65ch; }
//     .mx-auto { margin-left: auto; margin-right: auto; }
    
//     // Colors
//     .text-primary { color: var(--text-primary); }
//     .text-secondary { color: var(--text-secondary); }
//     .text-tertiary { color: var(--text-tertiary); }
//     .text-info { color: var(--color-info); }
//     .text-warning { color: var(--color-warning); }
//     .text-success { color: var(--color-success); }
//     .bg-ternary { background: var(--bg-ternary); }
    
//     // Borders
//     .border-top-subtle { border-top: var(--ui-border-width) solid var(--border-secondary); }
//     .border-radius-full { border-radius: 9999px; }
//     .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    
//     // Transitions
//     .transition-base { transition: var(--transition-base); }
    
//     // Animation
//     .fade-in {
//       animation: fadeIn 0.3s ease;
//     }
    
//     @keyframes fadeIn {
//       from { opacity: 0; transform: translateY(10px); }
//       to { opacity: 1; transform: translateY(0); }
//     }
    
//     // Responsive
//     .col-span-full { grid-column: 1 / -1; }
    
//     .lg-hidden {
//       @include lg {
//         display: none;
//       }
//     }
//   `]
// })
// export class PopularCategoriesComponent implements OnInit {
//   private categoryService = inject(CategoryService);
  
//   categories = signal<PopularCategory[]>([]);
//   loading = signal(true);

//   ngOnInit(): void {
//     this.loadPopularCategories();
//   }

//   private loadPopularCategories(): void {
//     this.loading.set(true);
//     this.categoryService.getPopularCategories().subscribe({
//       next: (response: any) => {
//         // Handle the API response structure
//         const categories = response?.data?.categories || [];
//         this.categories.set(categories);
//         this.loading.set(false);
//       },
//       error: (error) => {
//         console.error('Error loading popular categories:', error);
//         this.loading.set(false);
//       }
//     });
//   }

//   getIconClass(category: PopularCategory): string {
//     // You can add logic to assign different background colors based on category name
//     const colors = ['bg-primary-light', 'bg-success-light', 'bg-warning-light', 'bg-info-light', 'bg-error-light'];
//     const index = category.name.length % colors.length;
//     return colors[index];
//   }
// }