// user-detail.component.ts
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TagModule, 
    DividerModule,
    AvatarModule,
    AvatarGroupModule,
    CardModule,
    TooltipModule,
    BadgeModule,
    SkeletonModule
  ],
  template: `
    <div class="user-detail-container">
      @if (loading) {
        <!-- Loading Skeleton -->
        <div class="loading-skeleton">
          <div class="skeleton-header">
            <p-skeleton shape="circle" size="6rem" styleClass="mr-3"></p-skeleton>
            <div style="flex: 1">
              <p-skeleton width="60%" height="2rem" styleClass="mb-2"></p-skeleton>
              <p-skeleton width="40%" height="1.5rem"></p-skeleton>
            </div>
          </div>
          <p-divider></p-divider>
          <div class="skeleton-grid">
            @for (item of [1,2,3,4,5,6,7,8]; track item) {
              <div class="skeleton-item">
                <p-skeleton width="40%" height="1rem" styleClass="mb-2"></p-skeleton>
                <p-skeleton width="100%" height="1.5rem"></p-skeleton>
              </div>
            }
          </div>
        </div>
      } @else if (user) {
        <!-- User Profile Card -->
        <div class="profile-card">
          <!-- Cover Photo (optional) -->
          <div class="profile-cover">
            <div class="cover-gradient" [ngStyle]="{'background': getCoverGradient()}"></div>
          </div>

          <!-- Profile Header -->
          <div class="profile-header">
            <div class="avatar-wrapper">
              @if (user.profilePicture) {
                <img [src]="user.profilePicture" [alt]="user.firstName" class="profile-avatar">
              } @else {
                <div class="profile-avatar placeholder" 
                     [ngStyle]="{'background-color': getAvatarColor(user.firstName)}">
                  <span class="avatar-initials">{{ getInitials(user.firstName, user.lastName) }}</span>
                </div>
              }
              <div class="avatar-badge">
                <i class="pi" [class.pi-check-circle]="user.isActive" 
                   [class.pi-times-circle]="!user.isActive"
                   [class.active]="user.isActive"
                   [class.inactive]="!user.isActive"></i>
              </div>
            </div>

            <div class="profile-title">
              <h1>{{ user.firstName }} {{ user.lastName }}</h1>
              <div class="title-meta">
                <span class="role-badge" [class]="'role-' + user.role">
                  <i class="pi" [class.pi-shield]="user.role === 'admin'"
                     [class.pi-user-edit]="user.role === 'instructor'"
                     [class.pi-user]="user.role === 'student'"></i>
                  {{ user.role | titlecase }}
                </span>
                @if (user.lastLogin) {
                  <span class="last-login" pTooltip="Last Login" tooltipPosition="top">
                    <i class="pi pi-clock"></i>
                    {{ user.lastLogin | date:'medium' }}
                  </span>
                }
              </div>
            </div>
          </div>

          <!-- Stats Cards -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-calendar"></i>
              </div>
              <div class="stat-content">
                <span class="stat-label">Member Since</span>
                <span class="stat-value">{{ user.createdAt | date:'MMM d, y' }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-sync"></i>
              </div>
              <div class="stat-content">
                <span class="stat-label">Last Updated</span>
                <span class="stat-value">{{ user.updatedAt | date:'MMM d, y' }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-hashtag"></i>
              </div>
              <div class="stat-content">
                <span class="stat-label">Version</span>
                <span class="stat-value">v{{ user.__v || 0 }}</span>
              </div>
            </div>
          </div>

          <p-divider></p-divider>

          <!-- User Details Grid -->
          <div class="details-section">
            <h3 class="section-title">
              <i class="pi pi-info-circle"></i>
              Account Information
            </h3>

            <div class="details-grid">
              <!-- Email -->
              <div class="detail-item">
                <span class="detail-label">
                  <i class="pi pi-envelope"></i>
                  Email Address
                </span>
                <div class="detail-value-group">
                  <span class="detail-value">{{ user.email }}</span>
                  <p-tag 
                    [value]="user.isEmailVerified ? 'Verified' : 'Unverified'" 
                    [severity]="user.isEmailVerified ? 'success' : 'warn'"
                    [rounded]="true"
                    styleClass="email-tag">
                  </p-tag>
                </div>
              </div>

              <!-- Account Status -->
              <div class="detail-item">
                <span class="detail-label">
                  <i class="pi pi-shield"></i>
                  Account Status
                </span>
                <div class="detail-value-group">
                  <p-tag 
                    [value]="user.isActive ? 'Active' : 'Inactive'" 
                    [severity]="user.isActive ? 'success' : 'danger'"
                    [rounded]="true">
                  </p-tag>
                </div>
              </div>

              <!-- User ID -->
              <div class="detail-item full-width">
                <span class="detail-label">
                  <i class="pi pi-id-card"></i>
                  User ID
                </span>
                <div class="detail-value id-value">
                  <code>{{ user._id }}</code>
                  <button class="copy-btn" (click)="copyToClipboard(user._id)" pTooltip="Copy to clipboard">
                    <i class="pi pi-copy"></i>
                  </button>
                </div>
              </div>

              <!-- Deletion Status -->
              <div class="detail-item">
                <span class="detail-label">
                  <i class="pi pi-trash"></i>
                  Deletion Status
                </span>
                <div class="detail-value-group">
                  <p-tag 
                    [value]="user.isDeleted ? 'Deleted' : 'Not Deleted'" 
                    [severity]="user.isDeleted ? 'danger' : 'success'"
                    [rounded]="true">
                  </p-tag>
                </div>
              </div>

              @if (user.deletedAt) {
                <div class="detail-item">
                  <span class="detail-label">
                    <i class="pi pi-calendar-times"></i>
                    Deleted At
                  </span>
                  <span class="detail-value">{{ user.deletedAt | date:'medium' }}</span>
                </div>
              }

              <!-- Account Age -->
              <div class="detail-item">
                <span class="detail-label">
                  <i class="pi pi-hourglass"></i>
                  Account Age
                </span>
                <span class="detail-value">{{ getAccountAge() }}</span>
              </div>
            </div>
          </div>

          <!-- JSON View (optional, for debugging) -->
          @if (showJsonView) {
            <div class="json-section">
              <p-divider></p-divider>
              <div class="section-header">
                <h3 class="section-title">
                  <i class="pi pi-code"></i>
                  Raw Data
                </h3>
                <button class="toggle-json-btn" (click)="toggleJsonView()">
                  <i class="pi pi-eye-slash"></i>
                </button>
              </div>
              <pre class="json-view">{{ user | json }}</pre>
            </div>
          } @else {
            <div class="json-toggle">
              <button class="toggle-json-btn" (click)="toggleJsonView()">
                <i class="pi pi-code"></i>
                Show Raw Data
              </button>
            </div>
          }
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button pButton pRipple 
                  label="Edit User" 
                  icon="pi pi-pencil" 
                  class="p-button-rounded p-button-primary"
                  (click)="onEdit()">
          </button>
          <button pButton pRipple 
                  label="Close" 
                  icon="pi pi-times" 
                  class="p-button-rounded p-button-outlined p-button-secondary"
                  (click)="onClose()">
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .user-detail-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: var(--spacing-lg);
    }

    /* Loading Skeleton */
    .loading-skeleton {
      padding: var(--spacing-lg);
    }

    .skeleton-header {
      display: flex;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-xl);
    }

    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-lg);
      margin-top: var(--spacing-lg);
    }

    .skeleton-item {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    /* Profile Card */
    .profile-card {
      background: var(--bg-primary);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      position: relative;
      margin-bottom: var(--spacing-xl);
    }

    .profile-cover {
      height: 120px;
      background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
      position: relative;
    }

    .cover-gradient {
      width: 100%;
      height: 100%;
      opacity: 0.8;
    }

    /* Profile Header */
    .profile-header {
      display: flex;
      gap: var(--spacing-xl);
      padding: 0 var(--spacing-xl) var(--spacing-xl) var(--spacing-xl);
      margin-top: -40px;
      position: relative;
      align-items: flex-end;
    }

    .avatar-wrapper {
      position: relative;
      width: 100px;
      height: 100px;
    }

    .profile-avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid var(--bg-primary);
      background: white;
      box-shadow: var(--shadow-md);
    }

    .profile-avatar.placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      color: white;
      font-size: 2.5rem;
      font-weight: var(--font-weight-bold);
    }

    .avatar-initials {
      text-transform: uppercase;
    }

    .avatar-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-sm);
    }

    .avatar-badge i {
      font-size: 14px;
    }

    .avatar-badge i.active {
      color: var(--color-success);
    }

    .avatar-badge i.inactive {
      color: var(--color-warning);
    }

    .profile-title {
      flex: 1;
      padding-bottom: var(--spacing-md);
    }

    .profile-title h1 {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xs);
      line-height: 1.2;
    }

    .title-meta {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
      flex-wrap: wrap;
    }

    /* Role Badge */
    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-lg);
      border-radius: 100px;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
    }

    .role-badge i {
      font-size: var(--font-size-sm);
    }

    .role-admin {
      background: var(--accent-focus);
      color: var(--accent-primary);
    }

    .role-instructor {
      background: var(--color-success-bg);
      color: var(--color-success-dark);
    }

    .role-student {
      background: var(--bg-secondary);
      color: var(--text-secondary);
    }

    .last-login {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-lg);
      padding: var(--spacing-xl);
      background: var(--bg-secondary);
      margin: var(--spacing-lg) var(--spacing-xl);
      border-radius: var(--ui-border-radius);
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-primary);
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
    }

    /* Sections */
    .section-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-lg);
    }

    .section-title i {
      color: var(--accent-primary);
    }

    .details-section {
      padding: var(--spacing-xl);
    }

    /* Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-xl);
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .detail-item.full-width {
      grid-column: 1 / -1;
    }

    .detail-label {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .detail-label i {
      font-size: var(--font-size-md);
      color: var(--accent-primary);
    }

    .detail-value-group {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex-wrap: wrap;
    }

    .detail-value {
      font-size: var(--font-size-md);
      color: var(--text-primary);
      font-weight: var(--font-weight-medium);
    }

    .id-value {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      background: var(--bg-secondary);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--ui-border-radius);
      font-family: monospace;
      font-size: var(--font-size-sm);
    }

    .copy-btn {
      background: transparent;
      border: none;
      color: var(--text-tertiary);
      cursor: pointer;
      padding: var(--spacing-xs);
      border-radius: var(--ui-border-radius-sm);
      transition: var(--transition-fast);
    }

    .copy-btn:hover {
      color: var(--accent-primary);
      background: var(--accent-focus);
    }

    /* Email Tag */
    :host ::ng-deep .email-tag {
      margin-left: auto;
    }

    /* JSON View */
    .json-section {
      padding: var(--spacing-xl);
      border-top: 1px solid var(--border-secondary);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
    }

    .json-view {
      background: var(--bg-secondary);
      padding: var(--spacing-lg);
      border-radius: var(--ui-border-radius);
      font-size: var(--font-size-sm);
      max-height: 300px;
      overflow: auto;
      color: var(--text-primary);
    }

    .json-toggle {
      text-align: center;
      padding: var(--spacing-lg);
    }

    .toggle-json-btn {
      background: transparent;
      border: 1px solid var(--border-secondary);
      color: var(--text-secondary);
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--ui-border-radius);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      transition: var(--transition-base);
    }

    .toggle-json-btn:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      padding: 0 var(--spacing-xl) var(--spacing-xl) var(--spacing-xl);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .user-detail-container {
        padding: var(--spacing-md);
      }

      .profile-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
        margin-top: -60px;
        padding: 0 var(--spacing-md) var(--spacing-md);
      }

      .profile-title {
        text-align: center;
      }

      .title-meta {
        justify-content: center;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        margin: var(--spacing-md);
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .detail-value-group {
        flex-direction: column;
        align-items: flex-start;
      }

      :host ::ng-deep .email-tag {
        margin-left: 0;
      }
    }
  `]
})
export class UserDetailComponent implements OnInit, OnDestroy, OnChanges {
  @Input() userId!: any;
  @Output() edit = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private userService = inject(UserService);

  user: any = null;
  loading = true;
  showJsonView = false;
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    if (this.userId) {
      this.loadUser();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && !changes['userId'].firstChange) {
      this.loadUser();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadUser(): void {
    this.loading = true;
    const sub = this.userService.getUserById(this.userId).subscribe({
      next: (res: any) => {
        this.user = res.data.data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Failed to load user', error);
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const index = name?.charCodeAt(0) || 0;
    return colors[index % colors.length];
  }

  getCoverGradient(): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    ];
    const index = this.user?.role?.charCodeAt(0) || 0;
    return gradients[index % gradients.length];
  }

  getAccountAge(): string {
    if (!this.user?.createdAt) return 'N/A';
    
    const created = new Date(this.user.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''} ${months ? `, ${months} month${months > 1 ? 's' : ''}` : ''}`;
    }
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  toggleJsonView(): void {
    this.showJsonView = !this.showJsonView;
  }

  onEdit(): void {
    this.edit.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}