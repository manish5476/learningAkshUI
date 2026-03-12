import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

interface TopRatedCourse {
  _id: string;
  title: string;
  slug: string;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
  };
  level: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  thumbnail: string;
  price: number;
  discountPrice: number | null;
  rating: number;
  totalRatings: number;
  totalEnrollments: number;
}

@Component({
  selector: 'app-top-rated-course-card',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    NgOptimizedImage,
    TooltipModule,
    TagModule
  ],
  template: `
    <div class="card-wrapper">
      <a [routerLink]="['/courses', course.slug || course._id]"
         class="top-rated-card"
         [attr.aria-label]="'View details for ' + course.title">
        
        <!-- Thumbnail Section -->
        <div class="thumbnail-section" [style.background]="gradient">
          @if (hasValidImage) {
            <img [ngSrc]="course.thumbnail" 
                 [alt]="course.title" 
                 fill
                 class="course-thumbnail"
                 (error)="handleImageError($event)">
          }
          
          <!-- Level Badge -->
          <div class="badge-container">
            <p-tag 
              [severity]="getLevelSeverity()" 
              [value]="getLevelLabel()"
              class="level-badge">
            </p-tag>
          </div>
        </div>

        <!-- Content Section -->
        <div class="content-section">
          <!-- Instructor Info -->
          <div class="instructor-row">
            <div class="instructor-avatar">
              @if (course.instructor.profilePicture) {
                <img [src]="course.instructor.profilePicture" 
                     [alt]="getInstructorName()"
                     class="avatar-img">
              } @else {
                <div class="avatar-placeholder">
                  {{ getInstructorInitials() }}
                </div>
              }
            </div>
            <span class="instructor-name" [attr.title]="getInstructorName()">
              {{ getInstructorName() }}
            </span>
          </div>

          <!-- Course Title -->
          <h3 class="course-title" [attr.title]="course.title">
            {{ course.title }}
          </h3>

          <!-- Rating Row -->
          <div class="rating-row">
            <div class="stars">
              @for (star of [1,2,3,4,5]; track star) {
                <i class="pi" [ngClass]="{
                  'pi-star-fill': course.rating >= star,
                  'pi-star': course.rating < star
                }"></i>
              }
            </div>
            <span class="rating-value">
              {{ course.rating > 0 ? course.rating.toFixed(1) : 'New' }}
            </span>
            @if (course.totalRatings > 0) {
              <span class="rating-count">
                ({{ course.totalRatings }})
              </span>
            }
          </div>

          <!-- Stats Footer -->
          <div class="stats-footer">
            <div class="stat-item" pTooltip="Enrolled Students" tooltipPosition="top">
              <i class="pi pi-users"></i>
              <span>{{ course.totalEnrollments }}</span>
            </div>

            <div class="stat-item" pTooltip="Course Level" tooltipPosition="top">
              <i class="pi pi-signal"></i>
              <span>{{ getLevelShortLabel() }}</span>
            </div>
          </div>
        </div>

        <!-- Price Section (at bottom) -->
        <div class="price-section">
          @if (isFree()) {
            <span class="free-price">Free</span>
          } @else {
            @if (hasDiscount()) {
              <div class="discount-wrapper">
                <span class="current-price">{{ formatPrice(getCurrentPrice()) }}</span>
                <span class="original-price">{{ formatPrice(course.price) }}</span>
                <span class="discount-badge">-{{ getDiscountPercentage() }}%</span>
              </div>
            } @else {
              <span class="regular-price">{{ formatPrice(course.price) }}</span>
            }
          }
          
          <span class="view-details">
            View Details
            <i class="pi pi-arrow-right"></i>
          </span>
        </div>
      </a>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/mixins' as *;

    .card-wrapper {
      position: relative;
      height: 100%;
      display: block;
    }

    .top-rated-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--glass-bg-c);
      backdrop-filter: blur(var(--glass-blur-c));
      -webkit-backdrop-filter: blur(var(--glass-blur-c));
      border: var(--ui-border-width) solid var(--glass-border-c);
      border-radius: var(--ui-border-radius-xl);
      text-decoration: none;
      transition: var(--transition-base);
      overflow: hidden;
      box-shadow: var(--shadow-sm);

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: var(--border-secondary);
        
        .course-thumbnail {
          transform: scale(1.05);
        }
        
        .view-details i {
          transform: translateX(4px);
        }
      }

      &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
      }
    }

    /* Thumbnail Section */
    .thumbnail-section {
      position: relative;
      width: 100%;
      aspect-ratio: 16/9;
      overflow: hidden;
      background: var(--bg-ternary);

      .course-thumbnail {
        object-fit: cover;
        transition: transform var(--transition-slow);
        z-index: 1;
      }

      .badge-container {
        position: absolute;
        top: var(--spacing-sm);
        left: var(--spacing-sm);
        z-index: 2;
      }
    }

    /* Level Badge */
    ::ng-deep .level-badge {
      .p-tag {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--ui-border-radius-lg);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        border: var(--ui-border-width) solid transparent;

        &.p-tag-success {
          background: var(--color-success-bg);
          color: var(--color-success-dark);
          border-color: var(--color-success-border);
        }

        &.p-tag-info {
          background: var(--color-info-bg);
          color: var(--color-info-dark);
          border-color: var(--color-info-border);
        }

        &.p-tag-warning {
          background: var(--color-warning-bg);
          color: var(--color-warning-dark);
          border-color: var(--color-warning-border);
        }

        &.p-tag-secondary {
          background: var(--bg-ternary);
          color: var(--text-secondary);
          border-color: var(--border-primary);
        }
      }
    }

    /* Content Section */
    .content-section {
      padding: var(--spacing-lg);
      flex: 1;
    }

    .instructor-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);

      .instructor-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        overflow: hidden;
        background: var(--color-primary-bg);
        border: var(--ui-border-width) solid var(--border-primary);
        flex-shrink: 0;

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-heading);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary);
          background: var(--color-primary-bg);
        }
      }

      .instructor-name {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        
        @include sm-down {
          font-size: var(--font-size-xs);
        }
      }
    }

    .course-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-md) 0;
      line-height: var(--line-height-normal);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 3em;
      
      @include lg-down {
        font-size: var(--font-size-base);
      }
      
      @include sm-down {
        font-size: var(--font-size-md);
      }
    }

    /* Rating Row */
    .rating-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-md);
      flex-wrap: wrap;

      .stars {
        display: flex;
        gap: 2px;

        i {
          font-size: var(--font-size-sm);
          
          @include sm-down {
            font-size: var(--font-size-xs);
          }

          &.pi-star-fill {
            color: var(--color-warning);
          }

          &.pi-star {
            color: var(--text-tertiary);
          }
        }
      }

      .rating-value {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        
        @include sm-down {
          font-size: var(--font-size-xs);
        }
      }

      .rating-count {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
        
        @include sm-down {
          font-size: var(--font-size-2xs);
        }
      }
    }

    /* Stats Footer */
    .stats-footer {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      padding-top: var(--spacing-md);
      border-top: var(--ui-border-width) solid var(--border-primary);

      .stat-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        
        @include sm-down {
          font-size: var(--font-size-xs);
        }

        i {
          color: var(--color-primary);
          font-size: var(--font-size-sm);
          
          @include sm-down {
            font-size: var(--font-size-xs);
          }
        }

        span {
          font-weight: var(--font-weight-medium);
        }
      }
    }

    /* Price Section */
    .price-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg);
      background: var(--bg-secondary);
      border-top: var(--ui-border-width) solid var(--border-primary);

      .free-price {
        font-family: var(--font-heading);
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-success);
        
        @include lg-down {
          font-size: var(--font-size-base);
        }
      }

      .regular-price {
        font-family: var(--font-heading);
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
        
        @include lg-down {
          font-size: var(--font-size-base);
        }
      }

      .discount-wrapper {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        flex-wrap: wrap;

        .current-price {
          font-family: var(--font-heading);
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          
          @include lg-down {
            font-size: var(--font-size-base);
          }
        }

        .original-price {
          font-size: var(--font-size-sm);
          color: var(--text-tertiary);
          text-decoration: line-through;
          
          @include sm-down {
            font-size: var(--font-size-xs);
          }
        }

        .discount-badge {
          background: var(--color-warning-bg);
          color: var(--color-warning-dark);
          padding: 2px var(--spacing-xs);
          border-radius: var(--ui-border-radius-sm);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          border: var(--ui-border-width) solid var(--color-warning-border);
        }
      }

      .view-details {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        color: var(--color-primary);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        transition: var(--transition-base);

        i {
          font-size: var(--font-size-xs);
          transition: transform var(--transition-fast);
        }

        &:hover {
          color: var(--color-primary-dark);
        }
      }
    }

    /* Responsive adjustments */
    @include sm-down {
      .content-section {
        padding: var(--spacing-md);
      }

      .price-section {
        padding: var(--spacing-md);
      }
    }
  `]
})
export class TopRatedCourseCardComponent implements OnInit {
  @Input({ required: true }) course!: any;

  // Derived properties
  hasValidImage: boolean = false;
  gradient: string = '';

  private gradients = [
    'linear-gradient(135deg, var(--color-primary-bg) 0%, var(--color-primary-light) 100%)',
    'linear-gradient(135deg, var(--color-info-bg) 0%, var(--color-info-light) 100%)',
    'linear-gradient(135deg, var(--color-success-bg) 0%, var(--color-success-light) 100%)',
    'linear-gradient(135deg, var(--color-warning-bg) 0%, var(--color-warning-light) 100%)'
  ];

  ngOnInit() {
    this.hasValidImage = !!(this.course.thumbnail && this.course.thumbnail.trim() !== '');
    // Use title length to pick a consistent gradient
    const gradientIndex = (this.course.title?.length || 0) % this.gradients.length;
    this.gradient = this.gradients[gradientIndex];
  }

  getInstructorName(): string {
    return `${this.course.instructor.firstName} ${this.course.instructor.lastName}`;
  }

  getInstructorInitials(): string {
    return `${this.course.instructor.firstName.charAt(0)}${this.course.instructor.lastName.charAt(0)}`;
  }

  getLevelSeverity(): 'success' | 'info' | 'warn' | 'secondary' {
    switch (this.course.level) {
      case 'beginner': return 'success';
      case 'intermediate': return 'info';
      case 'advanced': return 'warn';
      default: return 'secondary';
    }
  }

  getLevelLabel(): string {
    switch (this.course.level) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      case 'all-levels': return 'All Levels';
      default: return this.course.level;
    }
  }

  getLevelShortLabel(): string {
    switch (this.course.level) {
      case 'beginner': return 'Beg';
      case 'intermediate': return 'Int';
      case 'advanced': return 'Adv';
      case 'all-levels': return 'All';
      default: return this.course.level
    }
  }

  isFree(): boolean {
    return this.course.price === 0;
  }

  hasDiscount(): boolean {
    return !!this.course.discountPrice && this.course.discountPrice < this.course.price;
  }

  getCurrentPrice(): number {
    return this.course.discountPrice || this.course.price;
  }

  getDiscountPercentage(): number {
    if (!this.course.discountPrice) return 0;
    return Math.round(((this.course.price - this.course.discountPrice) / this.course.price) * 100);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  handleImageError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
    this.hasValidImage = false;
  }
}