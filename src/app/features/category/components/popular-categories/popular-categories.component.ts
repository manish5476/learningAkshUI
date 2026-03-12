
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
        const categories = response?.data || [];
        
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
        const newCategories = response?.data || [];
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

