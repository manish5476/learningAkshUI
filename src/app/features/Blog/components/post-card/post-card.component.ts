import { CommonModule, NgOptimizedImage } from "@angular/common";
import { Component, inject, Input, ChangeDetectionStrategy, Output, EventEmitter } from "@angular/core";
import { RouterModule, Router } from "@angular/router";
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from "../../../../core/services/auth.service";
import { Post } from "../../../../core/services/post.service";
import { map, Observable } from "rxjs";

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card-wrapper">
      <a [routerLink]="['/blog', post?.slug || post?._id]" class="post-card" [class.featured]="post?.isFeatured">
        
        <!-- Status Badge (Only for admin view) -->
        @if (isAdminView) {
          <div class="status-badge" [class]="post?.status">
            <i [class]="getStatusIcon()"></i>
            <span>{{ post?.status | uppercase }}</span>
          </div>
        }

        <!-- Featured Badge -->
        @if (post?.isFeatured) {
          <div class="featured-badge">
            <i class="pi pi-star-fill"></i>
            <span>Featured</span>
          </div>
        }

        <!-- Image Section -->
        <div class="image-wrapper">
          @if (validImage) {
            <img [ngSrc]="validImage" 
                 [alt]="post?.title || 'Blog Post'" 
                 fill
                 class="post-image"
                 (error)="handleImageError($event)">
          } @else {
            <div class="image-placeholder">
              <i class="pi pi-image"></i>
            </div>
          }
          
          <div class="image-overlay">
            <div class="overlay-stats">
              <span class="read-time">
                <i class="pi pi-clock"></i>
                {{ post?.readTime || 1 }} min read
              </span>
              <span class="views">
                <i class="pi pi-eye"></i>
                {{ post?.views || 0 }}
              </span>
            </div>
          </div>
        </div>

        <!-- Content Section -->
        <div class="content-wrapper">
          <div class="meta-row">
            <span class="category-tag">
              <i class="pi pi-folder"></i>
              {{ post?.category?.name || 'Uncategorized' }}
            </span>
            <span class="date-tag">
              <i class="pi pi-calendar"></i>
              {{ (post?.eventDate || post?.createdAt) | date:'MMM d, yyyy' }}
            </span>
          </div>

          <h3 class="title-text">
            {{ post?.title }}
          </h3>
          
          <p class="excerpt-text">
            {{ post?.excerpt || truncateText(stripHtmlTags(post?.content), 100) }}
          </p>

          <!-- Author Section -->
          <div class="author-section">
            <div class="author-avatar">
              <img [src]="post?.author?.avatar || 'assets/images/default-avatar.png'" 
                   [alt]="post?.author?.firstName || 'Author'">
            </div>
            <div class="author-info">
              <span class="author-name">
                {{ post?.author?.firstName }} {{ post?.author?.lastName }}
              </span>
              <span class="author-role">Author</span>
            </div>
          </div>

          <!-- Stats Footer -->
          <div class="stats-footer">
            <div class="stat-item">
              <i class="pi pi-heart"></i>
              <span>{{ post?.likes || 0 }}</span>
            </div>
            <div class="stat-item">
              <i class="pi pi-comment"></i>
              <span>{{ post?.comments || 0 }}</span>
            </div>
            <div class="stat-item">
              <i class="pi pi-share-alt"></i>
              <span>{{ post?.shares || 0 }}</span>
            </div>
          </div>
        </div>
      </a>

      <!-- Floating Admin Actions (Only shows if User is Admin or the Author) -->
      @if (showAdminActions$ | async) {
        <div class="floating-admin-actions">
          <button class="fab-btn view-btn" 
                  pTooltip="View Post" 
                  tooltipPosition="top"
                  (click)="onView($event)">
            <i class="pi pi-eye"></i>
          </button>
          <button class="fab-btn edit-btn" 
                  pTooltip="Edit Post" 
                  tooltipPosition="top"
                  (click)="onEdit($event)">
            <i class="pi pi-pencil"></i>
          </button>

          @if (post?.status === 'draft' || post?.status === 'archived') {
            <button class="fab-btn publish-btn" 
                    pTooltip="Publish" 
                    tooltipPosition="top"
                    (click)="onPublish($event)">
              <i class="pi pi-upload"></i>
            </button>
          } @else if (post?.status === 'published') {
            <button class="fab-btn unpublish-btn" 
                    pTooltip="Unpublish" 
                    tooltipPosition="top"
                    (click)="onUnpublish($event)">
              <i class="pi pi-download"></i>
            </button>
          }

          <button class="fab-btn feature-btn" 
                  [pTooltip]="post?.isFeatured ? 'Unfeature' : 'Feature'" 
                  tooltipPosition="top" 
                  (click)="onToggleFeature($event)">
            <i class="pi" [ngClass]="post?.isFeatured ? 'pi-star-fill' : 'pi-star'"></i>
          </button>

          <!-- Button used here because delete triggers an action, not a navigation -->
          <button class="fab-btn delete-btn" 
                  pTooltip="Delete Post" 
                  tooltipPosition="top" 
                  (click)="onDelete($event)">
            <i class="pi pi-trash"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @use '../../../../../styles/mixins' as *;

    .card-wrapper {
      position: relative;
      height: 100%;
      display: block;
    }

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
      transition: all 0.2s ease;
      border: 1px solid var(--border-primary);
      cursor: pointer;
      text-decoration: none; /* Crucial for anchor tags */

      &:hover {
        transform: translateY(-2px) scale(1.05);
      }

      &.view-btn:hover { background: var(--color-info, #2196F3); color: white; border-color: transparent; }
      &.edit-btn:hover { background: var(--color-warning, #FF9800); color: white; border-color: transparent; }
      &.delete-btn:hover { background: var(--color-error, #f44336); color: white; border-color: transparent; }
      &.publish-btn:hover { background: var(--color-success, #4CAF50); color: white; border-color: transparent; }
      &.unpublish-btn:hover { background: var(--color-warning, #FF9800); color: white; border-color: transparent; }
      &.feature-btn:hover { background: #FFC107; color: white; border-color: transparent; }
    }

    .post-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius-xl);
      border: 1px solid var(--border-primary);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      cursor: pointer;
      position: relative;
      text-decoration: none; /* Prevents underline on entire card text */

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
        border-color: var(--color-primary-light);
      }

      &.featured {
        border: 2px solid var(--color-primary);
        box-shadow: 0 8px 20px -6px rgba(var(--color-primary-rgb), 0.2);
      }
    }

    .status-badge {
      position: absolute;
      top: var(--spacing-md);
      left: var(--spacing-md);
      z-index: 2;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      color: white;
      padding: 4px 8px;
      border-radius: var(--ui-border-radius-full);
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;

      &.published { background: rgba(34, 197, 94, 0.9); }
      &.draft { background: rgba(107, 114, 128, 0.9); }
      &.scheduled { background: rgba(59, 130, 246, 0.9); }
      &.archived { background: rgba(239, 68, 68, 0.9); }
    }

    .featured-badge {
      position: absolute;
      top: var(--spacing-md);
      right: var(--spacing-md); /* Only applies if no admin actions over it */
      z-index: 2;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 4px 8px;
      border-radius: var(--ui-border-radius-full);
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .image-wrapper {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
      background: var(--bg-tertiary);

      .post-image {
        object-fit: cover;
        transition: transform 0.4s ease;
      }

      .image-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
        i { font-size: 3rem; color: var(--text-tertiary); }
      }

      .image-overlay {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
        padding: var(--spacing-lg) var(--spacing-md) var(--spacing-sm);
        opacity: 0;
        transition: opacity 0.3s ease;

        .overlay-stats {
          display: flex;
          justify-content: space-between;
          color: white;
          font-size: 11px;
        }
      }
    }

    .post-card:hover .post-image { transform: scale(1.05); }
    .post-card:hover .image-overlay { opacity: 1; }

    .content-wrapper { padding: var(--spacing-lg); display: flex; flex-direction: column; flex: 1; }

    .meta-row {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md); font-size: 12px;
      .category-tag {
        display: flex; align-items: center; gap: 4px; color: var(--color-primary); font-weight: 600;
        background: rgba(var(--color-primary-rgb), 0.1); padding: 4px 8px; border-radius: var(--ui-border-radius-full);
      }
      .date-tag { display: flex; align-items: center; gap: 4px; color: var(--text-tertiary); }
    }

    .title-text {
      font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--text-primary);
      margin: 0 0 var(--spacing-sm) 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; transition: color 0.2s ease;
    }

    .post-card:hover .title-text { color: var(--color-primary); }

    .excerpt-text {
      font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.5; margin-bottom: var(--spacing-lg);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }

    .author-section {
      display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-lg);
      padding: var(--spacing-sm) 0; border-top: 1px solid var(--border-secondary); border-bottom: 1px solid var(--border-secondary);
      .author-avatar { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; img { width: 100%; height: 100%; object-fit: cover; } }
      .author-info {
        flex: 1;
        .author-name { display: block; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--text-primary); margin-bottom: 2px; }
        .author-role { font-size: 10px; color: var(--text-tertiary); }
      }
    }

    .stats-footer {
      display: flex; justify-content: space-around; margin-top: auto; padding-top: var(--spacing-sm);
      .stat-item {
        display: flex; align-items: center; gap: 6px; font-size: var(--font-size-sm); color: var(--text-tertiary);
        i { font-size: var(--font-size-base); transition: color 0.2s ease; }
        &:hover i { color: var(--color-primary); }
      }
    }
  `]
})
export class PostCardComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  @Input() isAdminView = false;
  @Output() delete = new EventEmitter<string>();
  @Output() publish = new EventEmitter<string>();
  @Output() unpublish = new EventEmitter<string>();
  @Output() toggleFeature = new EventEmitter<string>();

  // 1. Better reactivity using Input Setters exactly like your course card
  private _post!: Post | any;
  validImage: string | null = null;

  @Input({ required: true })
  set post(value: Post | any) {
    this._post = value;
    const img = this._post?.thumbnail;
    this.validImage = img && img.trim() !== '' ? img : null;
  }

  get post(): Post | any {
    return this._post;
  }

  // 2. Logic matching PropertyCourseCardComponent exactly
  showAdminActions$: Observable<boolean> = this.auth.currentUser$.pipe(
    map((user: any) => {
      if (!user) return false;

      const currentUserId = user._id || user.id;
      const authorId = this._post?.author?._id || this._post?.author;

      // Unlocked if they are an admin, OR if they are the instructor who authored it
      return user.role === 'admin' || (user.role === 'instructor' && currentUserId === authorId);
    })
  );

  getStatusIcon(): string {
    switch (this.post?.status?.toLowerCase()) {
      case 'published': return 'pi pi-check-circle';
      case 'draft': return 'pi pi-pencil';
      case 'scheduled': return 'pi pi-clock';
      case 'archived': return 'pi pi-archive';
      default: return 'pi pi-question-circle';
    }
  }

  truncateText(text: string, length: number): string {
    if (!text) return '';
    return text.length <= length ? text : text.substring(0, length) + '...';
  }

  stripHtmlTags(html: string): string {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  onDelete(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    // Emits the ID up to the parent component (PostListComponent) to handle actual deletion
    this.delete.emit(this.post._id);
  }

  onView(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(['/blog', this.post?.slug || this.post?._id]);
  }

  onEdit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(['/blog/admin/edit', this.post?._id]);
  }

  onPublish(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.publish.emit(this.post._id);
  }

  onUnpublish(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.unpublish.emit(this.post._id);
  }

  onToggleFeature(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.toggleFeature.emit(this.post._id);
  }

  handleImageError(event: Event) {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}