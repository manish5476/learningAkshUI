import { AuthService } from "./../../core/services/auth.service";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { Component, inject, Input, OnInit, OnDestroy, ChangeDetectionStrategy } from "@angular/core";
import { RouterModule } from "@angular/router";
import { Course } from "../../core/models/course.model";
import { map, Observable, Subject, takeUntil } from "rxjs";

@Component({
  selector: 'app-property-course-card',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  // template: `
  //   <div class="card-wrapper">
  //     <a [routerLink]="['/courses', course.slug || course._id]"
  //        class="property-card"
  //        [attr.aria-label]="'View details for ' + course.title">

  //       <div class="image-wrapper" [style.background]="getGradient()">
  //         @if (getValidImage()) {
  //           <img [ngSrc]="getValidImage()!" 
  //                [alt]="course.title" 
  //                fill
  //                class="property-image"
  //                (error)="handleImageError($event)">
  //         }

  //         <div class="badge-container">
  //           @if (course.isFree) {
  //             <span class="badge free-badge">FREE</span>
  //           } @else if (course.discountPrice) {
  //             <span class="badge discount-badge">-{{ calculateDiscount() }}%</span>
  //           }
  //         </div>
  //       </div>

  //       <div class="content-wrapper">
  //         <div class="meta-row">
  //           <span class="category-tag">{{ course.category.name || 'Uncategorized' }}</span>
  //           <div class="rating-group">
  //             <i class="pi pi-star-fill star-icon" aria-hidden="true"></i>
  //             <span class="rating-value">{{ course.rating > 0 ? course.rating.toFixed(1) : 'New' }}</span>
  //           </div>
  //         </div>

  //         <dl>
  //           <div class="price-block">
  //             <dt class="sr-only">Price</dt>
  //             <dd class="price-text">
  //               @if (course.isFree) {
  //                 <span class="text-success">Free Enrollment</span>
  //               } @else {
  //                 <span class="current-price">{{ formatCurrency(course.discountPrice || course.price) }}</span>
  //                 @if (course.discountPrice) {
  //                   <span class="original-price" aria-label="Original price">{{ formatCurrency(course.price) }}</span>
  //                 }
  //               }
  //             </dd>
  //           </div>

  //           <div class="title-block">
  //             <dt class="sr-only">Title</dt>
  //             <dd class="title-text">{{ course.title }}</dd>
  //           </div>
  //         </dl>

  //         <div class="stats-footer">
  //           <div class="stat-item">
  //             <svg class="stat-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
  //               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  //             </svg>
  //             <div class="stat-text-group">
  //               <p class="stat-label">Duration</p>
  //               <p class="stat-value">{{ formatDuration(course.totalDuration) }}</p>
  //             </div>
  //           </div>

  //           <div class="stat-item">
  //             <svg class="stat-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
  //               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  //             </svg>
  //             <div class="stat-text-group">
  //               <p class="stat-label">Content</p>
  //               <p class="stat-value">{{ course.totalLessons || 0 }} Lessons</p>
  //             </div>
  //           </div>

  //           <div class="stat-item">
  //             <svg class="stat-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
  //               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  //             </svg>
  //             <div class="stat-text-group">
  //               <p class="stat-label">Students</p>
  //               <p class="stat-value">{{ course.totalEnrollments || 0 }} Enrolled</p>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </a>

  //     @if (showEditButton) {
  //       <div class="floating-admin-actions">
  //         <a [routerLink]="['/courses', course.slug || course._id]" class="fab-btn view-btn" title="View Course">
  //           <i class="pi pi-eye"></i>
  //         </a>
  //         <a [routerLink]="['/instructor/courses', course._id, 'edit']" class="fab-btn edit-btn" title="Edit Course">
  //           <i class="pi pi-pencil"></i>
  //         </a>
  //       </div>
  //     }
  //   </div>
  // `,
  changeDetection: ChangeDetectionStrategy.OnPush, // <-- Added for major performance boost
  template: `
    <div class="card-wrapper">
      <a [routerLink]="['/courses', course.slug || course._id]"
         class="property-card"
         [attr.aria-label]="'View details for ' + course.title">
        
        <div class="image-wrapper" [style.background]="gradient">
          @if (validImage) {
            <img [ngSrc]="validImage" 
                 [alt]="course.title" 
                 fill
                 class="property-image"
                 (error)="handleImageError($event)">
          }
          
          <div class="badge-container">
            @if (course.isFree) {
              <span class="badge free-badge">FREE</span>
            } @else if (course.discountPrice) {
              <span class="badge discount-badge">-{{ discountPercentage }}%</span>
            }
          </div>
        </div>

        <div class="content-wrapper">
          <div class="meta-row">
            <span class="category-tag">{{ course.category.name || 'Uncategorized' }}</span>
            <div class="rating-group">
              <i class="pi pi-star-fill star-icon" aria-hidden="true"></i>
              <span class="rating-value">{{ course.rating > 0 ? course.rating.toFixed(1) : 'New' }}</span>
            </div>
          </div>

          <dl>
            <div class="price-block">
              <dt class="sr-only">Price</dt>
              <dd class="price-text">
                @if (course.isFree) {
                  <span class="text-success">Free Enrollment</span>
                } @else {
                  <span class="current-price">{{ formattedPrice }}</span>
                  @if (course.discountPrice) {
                    <span class="original-price" aria-label="Original price">{{ formattedOriginalPrice }}</span>
                  }
                }
              </dd>
            </div>

            <div class="title-block">
              <dt class="sr-only">Title</dt>
              <dd class="title-text">{{ course.title }}</dd>
            </div>
          </dl>

          <div class="stats-footer">
            <div class="stat-item">
              <svg class="stat-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="stat-text-group">
                <p class="stat-label">Duration</p>
                <p class="stat-value">{{ formattedDuration }}</p>
              </div>
            </div>

            <div class="stat-item">
              <svg class="stat-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <div class="stat-text-group">
                <p class="stat-label">Content</p>
                <p class="stat-value">{{ course.totalLessons || 0 }} Lessons</p>
              </div>
            </div>

            <div class="stat-item">
              <svg class="stat-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div class="stat-text-group">
                <p class="stat-label">Students</p>
                <p class="stat-value">{{ course.totalEnrollments || 0 }} Enrolled</p>
              </div>
            </div>
          </div>
        </div>
      </a>

      @if (showEditButton$ | async) {
        <div class="floating-admin-actions">
          <a [routerLink]="['/courses', course.slug || course._id]" class="fab-btn view-btn" title="View Course">
            <i class="pi pi-eye"></i>
          </a>
          <a [routerLink]="['/instructor/courses', course._id, 'edit']" class="fab-btn edit-btn" title="Edit Course">
            <i class="pi pi-pencil"></i>
          </a>
        </div>
      }
    </div>
  `, styles: [`
    @use '../../../styles/mixins' as *;

    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }

    /* NEW: Wrapper relative positioning */
    .card-wrapper {
      position: relative;
      height: 100%;
      display: block;
    }

    /* NEW: Floating actions */
    .floating-admin-actions {
      position: absolute;
      top: var(--spacing-sm);
      right: var(--spacing-sm);
      z-index: 10;
      display: flex;
      gap: 8px;
    }

    .fab-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--bg-primary, #ffffff);
      color: var(--text-primary);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid var(--border-primary);

      &:hover {
        transform: translateY(-2px) scale(1.05);
      }

      &.view-btn:hover {
        background: var(--color-info-dark, #2196F3);
        color: white;
        border-color: transparent;
      }

      &.edit-btn:hover {
        background: var(--color-warning-dark, #FF9800);
        color: white;
        border-color: transparent;
      }
    }

    .property-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: var(--spacing-lg); 
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-xl);
      border: var(--ui-border-width) solid var(--border-primary);
      text-decoration: none;
      transition: var(--transition-base);
      outline: none;
      box-shadow: 0 4px 20px -2px var(--theme-accent-focus), 0 0 3px rgba(0,0,0,0.05);

      &:hover, &:focus-visible {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px -4px var(--theme-accent-focus);
        border-color: var(--color-primary-light);
      }
    }

    /* ... [Keep all your existing CSS for image-wrapper, content-wrapper, meta-row, etc. exactly as they were] ... */
    
    .image-wrapper {
      position: relative;
      width: 100%;
      height: 14rem; 
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;
      margin-bottom: var(--spacing-md);

      .property-image { object-fit: cover; transition: var(--transition-slow); z-index: 1; }
    }

    .property-card:hover .property-image { transform: scale(1.05); }

    .badge-container {
      position: absolute; top: var(--spacing-sm); left: var(--spacing-sm); z-index: 2;
      .badge {
        padding: var(--spacing-xs) var(--spacing-md); border-radius: var(--ui-border-radius-lg);
        font-family: var(--font-heading); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
        &.free-badge { background: var(--color-success-bg); color: var(--color-success-dark); border: var(--ui-border-width) solid var(--color-success-border); }
        &.discount-badge { background: var(--color-warning-bg); color: var(--color-warning-dark); border: var(--ui-border-width) solid var(--color-warning-border); }
      }
    }

    .content-wrapper { display: flex; flex-direction: column; flex-grow: 1; }

    .meta-row {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-xs);
      .category-tag { font-family: var(--font-body); font-size: var(--font-size-xs); color: var(--color-primary); font-weight: var(--font-weight-semibold); background: var(--color-primary-bg); padding: 2px var(--spacing-sm); border-radius: var(--ui-border-radius-sm); }
      .rating-group { display: flex; align-items: center; gap: 4px; .star-icon { color: var(--color-warning); font-size: var(--font-size-xs); } .rating-value { font-family: var(--font-body); font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); color: var(--text-primary); } }
    }

    dl { margin: 0; }
    .price-block { margin-bottom: var(--spacing-xs); }
    .price-text {
      font-family: var(--font-body); font-size: var(--font-size-sm); color: var(--text-tertiary); margin: 0; display: flex; align-items: baseline; gap: var(--spacing-xs);
      .current-price { font-family: var(--font-heading); font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--text-primary); }
      .original-price { font-size: var(--font-size-xs); text-decoration: line-through; }
      .text-success { font-family: var(--font-heading); font-weight: var(--font-weight-bold); color: var(--color-success); }
    }
    .title-block { margin-bottom: var(--spacing-xl); }
    .title-text { font-family: var(--font-heading); font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--text-primary); margin: 0; line-height: var(--line-height-normal); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .stats-footer {
      margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-sm); padding-top: var(--spacing-md); border-top: 1px solid var(--component-divider);
    }

    .stat-item {
      display: flex; flex-direction: column; gap: var(--spacing-xs);
      .stat-icon { width: 1.25rem; height: 1.25rem; color: var(--color-primary); }
    }

    .stat-text-group {
      margin-top: var(--spacing-xs); font-family: var(--font-body); font-size: var(--font-size-xs);
      .stat-label { color: var(--text-tertiary); margin: 0; line-height: var(--line-height-tight); }
      .stat-value { font-weight: var(--font-weight-semibold); color: var(--text-primary); margin: 0; line-height: var(--line-height-tight); }
    }
  `]
})export class PropertyCourseCardComponent {
  private auth = inject(AuthService);

  // Computed Properties (Calculated once per input change)
  validImage: string | null = null;
  gradient: string = '';
  discountPercentage: number = 0;
  formattedDuration: string = '0m';
  formattedPrice: string = '';
  formattedOriginalPrice: string = '';

  private _course!: Course;
  
  // Intercept Input to pre-calculate values rather than calling functions in the HTML
  @Input({ required: true }) 
  set course(value: Course) {
    this._course = value;
    this.calculateDerivedProperties();
  }
  get course(): Course {
    return this._course;
  }

  private gradients = ['var(--theme-accent-gradient)', 'linear-gradient(135deg, var(--color-info-light) 0%, var(--color-info-dark) 100%)'];

  // Declarative approach: No more ngOnInit/ngOnDestroy or manual unsubscribing
  showEditButton$: Observable<boolean> = this.auth.currentUser$.pipe(
    map((user:any) => !!user && (
      user.role === 'admin' ||
      (user.role === 'instructor' && user.id === this._course?.instructor?._id)
    ))
  );

  private calculateDerivedProperties(): void {
    if (!this._course) return;

    // 1. Image & Gradient
    const img = this._course.thumbnail || this._course.previewVideo;
    this.validImage = img && img.trim() !== '' ? img : null;
    this.gradient = this.validImage 
      ? 'var(--bg-ternary)' 
      : this.gradients[(this._course.title?.length || 0) % this.gradients.length];

    // 2. Discount
    if (this._course.discountPrice && this._course.price) {
      this.discountPercentage = Math.round(((this._course.price - this._course.discountPrice) / this._course.price) * 100);
    } else {
      this.discountPercentage = 0;
    }

    // 3. Duration
    const minutes = this._course.totalDuration;
    if (!minutes) {
      this.formattedDuration = '0m';
    } else if (minutes < 60) {
      this.formattedDuration = `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      this.formattedDuration = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }

    // 4. Currency
    const currency = this._course.currency || 'INR';
    const formatter = new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency, 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
    this.formattedPrice = formatter.format(this._course.discountPrice || this._course.price || 0);
    this.formattedOriginalPrice = this._course.price ? formatter.format(this._course.price) : '';
  }

  handleImageError(event: Event): void { 
    (event.target as HTMLImageElement).style.display = 'none'; 
  }
}
// export class PropertyCourseCardComponent implements OnInit, OnDestroy {
//   @Input({ required: true }) course!: Course;
//   private auth = inject(AuthService)
//   private destroy$ = new Subject<void>();

//   private gradients = ['var(--theme-accent-gradient)', 'linear-gradient(135deg, var(--color-info-light) 0%, var(--color-info-dark) 100%)'];

//   currentUser: any = null;

//   ngOnInit(): void {
//     this.auth.currentUser$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(user => {
//         this.currentUser = user;
//       });
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   // Determine if the floating action buttons should be visible
//   get showEditButton(): boolean {
//     const user = this.currentUser;
//     return !!user && (
//       user.role === 'admin' ||
//       (user.role === 'instructor' && user.id === this.course.instructor?._id)
//     );
//   }

//   getValidImage(): string | null {
//     const img = this.course.thumbnail || this.course.previewVideo;
//     return img && img.trim() !== '' ? img : null;
//   }

//   getGradient(): string {
//     if (this.getValidImage()) return 'var(--bg-ternary)';
//     const index = (this.course.title?.length || 0) % this.gradients.length;
//     return this.gradients[index];
//   }

//   calculateDiscount(): number {
//     if (!this.course.discountPrice || !this.course.price) return 0;
//     return Math.round(((this.course.price - this.course.discountPrice) / this.course.price) * 100);
//   }

//   formatDuration(minutes: number): string {
//     if (!minutes) return '0m';
//     if (minutes < 60) return `${minutes}m`;
//     const hours = Math.floor(minutes / 60);
//     const mins = minutes % 60;
//     return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
//   }

//   formatCurrency(amount: number): string {
//     const currency = this.course.currency || 'INR';
//     return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
//   }

//   handleImageError(event: Event): void {
//     (event.target as HTMLImageElement).style.display = 'none';
//   }
// }
