// user-detail.component.ts
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Subscription, switchMap, of, catchError, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import { UserService } from '../../core/services/user.service';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
  profilePicture?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  lastLogin?: string;
  __v?: number;
  permissions?: string[];
  department?: string;
  phoneNumber?: string;
  timezone?: string;
  preferredLanguage?: string;
  twoFactorEnabled?: boolean;
}

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
    SkeletonModule,
    ToastModule,
    ProgressSpinnerModule,
    RippleModule,
    StyleClassModule
  ],
  providers: [MessageService],
  template: `
    <div class="user-detail-container" [class.loading]="loading()">
      <!-- Header with navigation -->
      <div class="detail-header">
        <div class="header-left">
          <button pButton pRipple 
                  icon="pi pi-arrow-left"
                  class="p-button-rounded p-button-text p-button-sm"
                  (click)="onClose()"
                  pTooltip="Go back"
                  tooltipPosition="right">
          </button>
          <div class="header-title">
            <h2>User Profile</h2>
            @if (user(); as user) {
              <p-badge 
                [value]="user.role | titlecase"
                [severity]="getRoleSeverity(user.role)"
               >
              </p-badge>
            }
          </div>
        </div>
        <div class="header-actions">
          <button pButton pRipple
                  icon="pi pi-refresh"
                  class="p-button-rounded p-button-text p-button-sm"
                  (click)="refresh()"
                  [disabled]="loading()"
                  pTooltip="Refresh data"
                  tooltipPosition="left">
          </button>
          <button pButton pRipple
                  icon="pi pi-pencil"
                  label="Edit"
                  class="p-button-rounded p-button-primary"
                  (click)="onEdit()"
                  [disabled]="loading() || !canEdit()">
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <p-progressSpinner 
            strokeWidth="3"
            animationDuration=".8s"
            styleClass="custom-spinner">
          </p-progressSpinner>
          <p class="loading-text">Loading user profile...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="error-state">
          <div class="error-icon">
            <i class="pi pi-exclamation-circle"></i>
          </div>
          <h3>Oops! Something went wrong</h3>
          <p>{{ error() }}</p>
          <button pButton pRipple
                  label="Try Again"
                  icon="pi pi-refresh"
                  class="p-button-rounded p-button-outlined"
                  (click)="refresh()">
          </button>
        </div>
      }

      <!-- User Profile Content -->
      @if (user(); as user) {
        <div class="profile-content" [@fadeAnimation]>
          <!-- Profile Card -->
          <p-card class="profile-card" styleClass="shadow-2xl">
            <ng-template pTemplate="header">
              <div class="profile-cover">
  <img 
    src="https://images.unsplash.com/photo-1751517298236-b9150faa3dfd?q=80&w=1632&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
    alt="Profile Cover"
    class="cover-image"
    loading="lazy">
  <div class="cover-overlay"></div>
</div>
            </ng-template>

            <div class="profile-header">
              <!-- Avatar with status -->
              <div class="avatar-container">
                <div class="avatar-wrapper" 
                     [class.verified]="user.isEmailVerified"
                     [class.unverified]="!user.isEmailVerified">
                  @if (user.profilePicture) {
                    <img [src]="user.profilePicture" 
                         [alt]="fullName()" 
                         class="profile-avatar"
                         (error)="handleImageError($event)">
                  } @else {
                    <div class="profile-avatar placeholder" 
                         [style.background]="avatarColor()">
                      <span class="avatar-initials">{{ initials() }}</span>
                    </div>
                  }
                </div>
                
                <!-- Status Badge -->
                <div class="status-badge" 
                     [class.online]="user.isActive"
                     [class.offline]="!user.isActive"
                     pTooltip="{{ user.isActive ? 'Active' : 'Inactive' }}"
                     tooltipPosition="top">
                </div>

                <!-- Email Verification -->
                @if (user.isEmailVerified) {
                  <div class="verification-badge verified" 
                       pTooltip="Email Verified"
                       tooltipPosition="top">
                    <i class="pi pi-check-circle"></i>
                  </div>
                }
              </div>

              <!-- User Info -->
              <div class="user-info">
                <h1 class="user-name">{{ fullName() }}</h1>
                
                <div class="user-meta">
                  <span class="role-tag" [class]="'role-' + user.role">
                    <i class="pi" [class.pi-shield]="user.role === 'admin'"
                       [class.pi-user-edit]="user.role === 'instructor'"
                       [class.pi-user]="user.role === 'student'"></i>
                    {{ user.role | titlecase }}
                  </span>
                  
                  @if (user.department) {
                    <span class="department-tag">
                      <i class="pi pi-building"></i>
                      {{ user.department }}
                    </span>
                  }
                </div>

                <!-- Contact Info -->
                <div class="contact-info">
                  <div class="contact-item" pTooltip="Email Address" tooltipPosition="top">
                    <i class="pi pi-envelope"></i>
                    <a href="mailto:{{ user.email }}" class="contact-link">{{ user.email }}</a>
                  </div>
                  
                  @if (user.phoneNumber) {
                    <div class="contact-item" pTooltip="Phone Number" tooltipPosition="top">
                      <i class="pi pi-phone"></i>
                      <a href="tel:{{ user.phoneNumber }}" class="contact-link">{{ user.phoneNumber }}</a>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-calendar"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Member since</span>
                  <span class="stat-value">{{ user.createdAt | date:'mediumDate' }}</span>
                  <span class="stat-sub">{{ accountAge() }}</span>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-clock"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Last active</span>
                  <span class="stat-value">{{ (user.lastLogin | date:'mediumDate' )|| 'Never' }}</span>
                  @if (user.lastLogin) {
                    <span class="stat-sub">{{ user.lastLogin | date:'shortTime' }}</span>
                  }
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-icon">
                  <i class="pi pi-shield"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Security</span>
                  <span class="stat-value">
                    @if (user.twoFactorEnabled) {
                      <span class="security-badge enabled">2FA Enabled</span>
                    } @else {
                      <span class="security-badge disabled">2FA Disabled</span>
                    }
                  </span>
                </div>
              </div>
            </div>

            <p-divider></p-divider>

            <!-- Detailed Information -->
            <div class="details-section">
              <h3 class="section-title">
                <i class="pi pi-info-circle"></i>
                Account Details
              </h3>

              <div class="details-grid">
                <!-- User ID -->
                <div class="detail-item highlight">
                  <span class="detail-label">User ID</span>
                  <div class="id-copy-group">
                    <code class="user-id">{{ user._id }}</code>
                    <button class="copy-btn" 
                            (click)="copyToClipboard(user._id)"
                            pTooltip="Copy to clipboard"
                            [class.copied]="copiedId() === user._id">
                      <i class="pi" [class.pi-copy]="copiedId() !== user._id" 
                                   [class.pi-check]="copiedId() === user._id"></i>
                    </button>
                  </div>
                </div>

                <!-- Account Status -->
                <div class="detail-item">
                  <span class="detail-label">Account Status</span>
                  <div class="status-indicators">
                    <p-tag 
                      [value]="user.isActive ? 'Active' : 'Inactive'" 
                      [severity]="user.isActive ? 'success' : 'danger'"
                      [rounded]="true">
                    </p-tag>
                    
                    <p-tag 
                      [value]="user.isDeleted ? 'Deleted' : 'Active'" 
                      [severity]="user.isDeleted ? 'danger' : 'success'"
                      [rounded]="true">
                    </p-tag>
                  </div>
                </div>

                <!-- Verification Status -->
                <div class="detail-item">
                  <span class="detail-label">Email Verification</span>
                  <div class="verification-status">
                    <p-tag 
                      [value]="user.isEmailVerified ? 'Verified' : 'Unverified'" 
                      [severity]="user.isEmailVerified ? 'success' : 'warn'"
                      [rounded]="true">
                    </p-tag>
                  </div>
                </div>

                <!-- Timezone -->
                <div class="detail-item">
                  <span class="detail-label">Timezone</span>
                  <span class="detail-value">
                    <i class="pi pi-globe"></i>
                    {{ user.timezone || 'Not specified' }}
                  </span>
                </div>

                <!-- Language -->
                <div class="detail-item">
                  <span class="detail-label">Preferred Language</span>
                  <span class="detail-value">
                    <i class="pi pi-language"></i>
                    {{ user.preferredLanguage || 'English (default)' }}
                  </span>
                </div>

                <!-- Version -->
                <div class="detail-item">
                  <span class="detail-label">Data Version</span>
                  <span class="detail-value">
                    <i class="pi pi-tag"></i>
                    v{{ user.__v || 0 }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Permissions Section -->
            @if (user.permissions?.length) {
              <div class="permissions-section">
                <p-divider></p-divider>
                <h3 class="section-title">
                  <i class="pi pi-lock"></i>
                  Permissions
                </h3>
                
                <div class="permissions-grid">
                  @for (permission of user.permissions; track permission) {
                    <span class="permission-badge">
                      <i class="pi pi-check-circle"></i>
                      {{ permission }}
                    </span>
                  }
                </div>
              </div>
            }

            <!-- Raw Data Section -->
            <div class="raw-data-section">
              <p-divider></p-divider>
              <div class="section-header" (click)="toggleJsonView()">
                <h3 class="section-title">
                  <i class="pi pi-code"></i>
                  Raw Data
                </h3>
                <button class="toggle-btn" 
                        pRipple
                        [class.expanded]="showJsonView()">
                  <i class="pi" [class.pi-chevron-down]="!showJsonView()" 
                               [class.pi-chevron-up]="showJsonView()"></i>
                </button>
              </div>
              
              @if (showJsonView()) {
                <div class="json-viewer">
                  <pre><code>{{ user | json }}</code></pre>
                </div>
              }
            </div>
          </p-card>
        </div>
      }

      <!-- Toast for notifications -->
      <p-toast position="bottom-right"></p-toast>
    </div>
  `,
  styles: [`
    /* Container */
    .user-detail-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--spacing-xl);
      min-height: 100vh;
      background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
      transition: all 0.3s ease;
    }

    /* Header */
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-2xl);
      padding: var(--spacing-md) 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .header-title h2 {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-sm);
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      background: var(--bg-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-3xl);
    }

    .custom-spinner {
      width: 60px;
      height: 60px;
      margin-bottom: var(--spacing-lg);
    }

    .loading-text {
      color: var(--text-secondary);
      font-size: var(--font-size-lg);
      margin: 0;
    }

    /* Error State */
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      background: var(--bg-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-3xl);
      text-align: center;
    }

    .error-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--color-error-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--spacing-lg);
    }

    .error-icon i {
      font-size: 40px;
      color: var(--color-error);
    }

    .error-state h3 {
      font-size: var(--font-size-xl);
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
    }

    .error-state p {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xl);
      max-width: 400px;
    }

    /* Profile Card */
    .profile-card {
      background: var(--bg-primary);
      border-radius: var(--ui-border-radius-xl);
      overflow: hidden;
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-secondary);
    }

    .profile-cover {
      height: 200px;
      position: relative;
      transition: all 0.3s ease;
    }

    .cover-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 50%);
    }

    /* Avatar Container */
    .avatar-container {
      position: relative;
      width: 120px;
      height: 120px;
      margin-right: var(--spacing-xl);
    }

    .avatar-wrapper {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      overflow: hidden;
      border: 4px solid var(--bg-primary);
      box-shadow: var(--shadow-lg);
      transition: all 0.3s ease;
    }

    .avatar-wrapper.verified {
      border-color: var(--color-success);
    }

    .avatar-wrapper.unverified {
      border-color: var(--color-warning);
    }

    .profile-avatar {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-avatar.placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 3rem;
      font-weight: var(--font-weight-bold);
    }

    .avatar-initials {
      text-transform: uppercase;
    }

    .status-badge {
      position: absolute;
      bottom: 10px;
      right: 10px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid var(--bg-primary);
      transition: all 0.3s ease;
    }

    .status-badge.online {
      background: var(--color-success);
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.3);
      animation: pulse 2s infinite;
    }

    .status-badge.offline {
      background: var(--text-tertiary);
    }

    .verification-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--bg-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-md);
    }

    .verification-badge.verified i {
      color: var(--color-success);
      font-size: 14px;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
      100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }

    /* Profile Header */
    .profile-header {
      display: flex;
      align-items: flex-start;
      padding: var(--spacing-xl);
      margin-top: -60px;
      position: relative;
    }

    .user-info {
      flex: 1;
    }

    .user-name {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xs);
    }

    .user-meta {
      display: flex;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }

    .role-tag {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: 20px;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
    }

    .role-tag i {
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

    .department-tag {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: 20px;
      background: var(--bg-secondary);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .contact-item i {
      color: var(--accent-primary);
    }

    .contact-link {
      color: inherit;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .contact-link:hover {
      color: var(--accent-primary);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-lg);
      padding: var(--spacing-xl);
      background: linear-gradient(145deg, var(--bg-secondary), transparent);
      border-radius: var(--ui-border-radius-lg);
      margin: 0 var(--spacing-xl) var(--spacing-xl);
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: var(--bg-primary);
      border-radius: var(--ui-border-radius);
      box-shadow: var(--shadow-sm);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      display: block;
    }

    .stat-sub {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }

    .security-badge {
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: 12px;
      font-size: var(--font-size-xs);
    }

    .security-badge.enabled {
      background: var(--color-success-bg);
      color: var(--color-success-dark);
    }

    .security-badge.disabled {
      background: var(--color-warning-bg);
      color: var(--color-warning-dark);
    }

    /* Details Section */
    .details-section {
      padding: var(--spacing-xl);
    }

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

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-xl);
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      padding: var(--spacing-md);
      border-radius: var(--ui-border-radius);
      transition: all 0.2s ease;
    }

    .detail-item:hover {
      background: var(--bg-secondary);
    }

    .detail-item.highlight {
      grid-column: 1 / -1;
      background: linear-gradient(145deg, var(--accent-focus), transparent);
    }

    .detail-label {
      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
      font-weight: var(--font-weight-medium);
    }

    .detail-value {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-md);
      color: var(--text-primary);
    }

    .detail-value i {
      color: var(--accent-primary);
    }

    .id-copy-group {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      background: var(--bg-primary);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--ui-border-radius);
      border: 1px solid var(--border-secondary);
    }

    .user-id {
      font-family: monospace;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      flex: 1;
    }

    .copy-btn {
      background: transparent;
      border: none;
      color: var(--text-tertiary);
      cursor: pointer;
      padding: var(--spacing-xs);
      border-radius: var(--ui-border-radius-sm);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .copy-btn:hover {
      color: var(--accent-primary);
      background: var(--accent-focus);
    }

    .copy-btn.copied {
      color: var(--color-success);
    }

    .status-indicators {
      display: flex;
      gap: var(--spacing-sm);
    }

    /* Permissions Section */
    .permissions-section {
      padding: var(--spacing-xl);
    }

    .permissions-grid {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-md);
    }

    .permission-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-md);
      background: var(--bg-secondary);
      border-radius: 20px;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      transition: all 0.2s ease;
    }

    .permission-badge i {
      color: var(--color-success);
      font-size: var(--font-size-xs);
    }

    .permission-badge:hover {
      background: var(--accent-focus);
      color: var(--accent-primary);
      transform: translateY(-1px);
    }

    /* Raw Data Section */
    .raw-data-section {
      padding: var(--spacing-xl);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      padding: var(--spacing-md) 0;
      user-select: none;
    }

    .toggle-btn {
      background: transparent;
      border: none;
      color: var(--text-tertiary);
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .toggle-btn:hover {
      background: var(--bg-secondary);
      color: var(--accent-primary);
    }

    .toggle-btn.expanded i {
      transform: rotate(180deg);
    }

    .json-viewer {
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-lg);
      margin-top: var(--spacing-md);
      overflow: auto;
      max-height: 400px;
      border: 1px solid var(--border-secondary);
    }

    .json-viewer pre {
      margin: 0;
      font-family: monospace;
      font-size: var(--font-size-sm);
      color: var(--text-primary);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .user-detail-container {
        padding: var(--spacing-md);
      }

      .profile-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .avatar-container {
        margin-right: 0;
        margin-bottom: var(--spacing-md);
      }

      .user-meta {
        justify-content: center;
      }

      .contact-info {
        justify-content: center;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        margin: var(--spacing-md);
      }

      .details-grid {
        grid-template-columns: 1fr;
      }

      .detail-item.highlight {
        grid-column: auto;
      }

      .id-copy-group {
        flex-direction: column;
        align-items: stretch;
      }

      .copy-btn {
        align-self: flex-end;
      }
    }

    @media (max-width: 480px) {
      .header-title h2 {
        font-size: var(--font-size-lg);
      }

      .user-name {
        font-size: var(--font-size-2xl);
      }

      .contact-info {
        flex-direction: column;
      }
    }

    .profile-cover {
  height: 200px;
  position: relative;
  overflow: hidden;
  border-radius: var(--ui-border-radius-xl) var(--ui-border-radius-xl) 0 0;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.6s cubic-bezier(0.2, 0.9, 0.4, 1);
}

.profile-card:hover .cover-image {
  transform: scale(1.05);
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, 
    rgba(0,0,0,0.1) 0%, 
    rgba(0,0,0,0.3) 50%,
    rgba(0,0,0,0.6) 100%);
  pointer-events: none;
}
  `]
})
export class UserDetailComponent implements OnInit {
  @Input() set userId(value: any) {
    this.userIdSignal.set(value);
  }
  
  @Output() edit = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private destroy$ = new Subscription();

  // Signals
  private userIdSignal = signal<any>(null);
  private userDataSignal = signal<User | null>(null);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);
  private showJsonViewSignal = signal(false);
  private copiedIdSignal = signal<string | null>(null);

  // Computed signals
  user = computed(() => this.userDataSignal());
  loading = computed(() => this.loadingSignal());
  error = computed(() => this.errorSignal());
  showJsonView = computed(() => this.showJsonViewSignal());
  copiedId = computed(() => this.copiedIdSignal());

  fullName = computed(() => {
    const user = this.user();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  initials = computed(() => {
    const user = this.user();
    if (!user) return '';
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  });

  avatarColor = computed(() => {
    const user = this.user();
    if (!user) return '#4ECDC4';
    
    const colors = [
      'linear-gradient(135deg, #FF6B6B, #FF8E8E)',
      'linear-gradient(135deg, #4ECDC4, #6EE7E7)',
      'linear-gradient(135deg, #45B7D1, #76D7EA)',
      'linear-gradient(135deg, #96CEB4, #B8E0C2)',
      'linear-gradient(135deg, #FFEAA7, #FFF2C6)',
      'linear-gradient(135deg, #DDA0DD, #E8B8E8)',
      'linear-gradient(135deg, #98D8C8, #B8E8D8)',
      'linear-gradient(135deg, #F7DC6F, #FAE8A3)'
    ];
    
    const index = user.firstName?.charCodeAt(0) || 0;
    return colors[index % colors.length];
  });

  coverGradient = computed(() => {
    const user = this.user();
    if (!user) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    ];
    
    const index = user.role?.charCodeAt(0) || 0;
    return gradients[index % gradients.length];
  });

  accountAge = computed(() => {
    const user = this.user();
    if (!user?.createdAt) return 'N/A';
    
    const created = new Date(user.createdAt);
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
      return `${years} year${years > 1 ? 's' : ''}${months ? `, ${months} month${months > 1 ? 's' : ''}` : ''}`;
    }
  });

  canEdit = computed(() => {
    const user = this.user();
    return user && !user.isDeleted;
  });

  constructor() {
    // Effect to load user when userId changes
    effect(() => {
      const id = this.userIdSignal();
      if (id) {
        this.loadUser();
      }
    });
  }

  ngOnInit(): void {
    // Initial load if userId is already set
    if (this.userIdSignal()) {
      this.loadUser();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.unsubscribe();
  }

  private loadUser(): void {
    const userId = this.userIdSignal();
    if (!userId) return;

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
this.userDataSignal.set(null)
    const sub = this.userService.getUserById(userId).subscribe({
      next: (res: any) => {
        this.userDataSignal.set(res.data);
        this.loadingSignal.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load user', error);
        this.errorSignal.set(error.message || 'Failed to load user profile');
        this.loadingSignal.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load user profile'
        });
      }
    });

    this.destroy$.add(sub);
  }

  refresh(): void {
    this.loadUser();
  }

  getRoleSeverity(role: string): any {
    switch (role) {
      case 'admin': return 'danger';
      case 'instructor': return 'success';
      default: return 'info';
    }
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copiedIdSignal.set(text);
      this.messageService.add({
        severity: 'success',
        summary: 'Copied!',
        detail: 'User ID copied to clipboard',
        life: 2000
      });
      
      setTimeout(() => {
        if (this.copiedIdSignal() === text) {
          this.copiedIdSignal.set(null);
        }
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy to clipboard'
      });
    }
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    // Fallback to placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'profile-avatar placeholder';
    placeholder.style.background = this.avatarColor();
    placeholder.innerHTML = `<span class="avatar-initials">${this.initials()}</span>`;
    img.parentElement?.appendChild(placeholder);
  }

  toggleJsonView(): void {
    this.showJsonViewSignal.update(value => !value);
  }

  onEdit(): void {
    this.edit.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}
// // user-detail.component.ts
// import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Subscription } from 'rxjs';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { DividerModule } from 'primeng/divider';
// import { AvatarModule } from 'primeng/avatar';
// import { AvatarGroupModule } from 'primeng/avatargroup';
// import { CardModule } from 'primeng/card';
// import { TooltipModule } from 'primeng/tooltip';
// import { BadgeModule } from 'primeng/badge';
// import { SkeletonModule } from 'primeng/skeleton';
// import { UserService } from '../../core/services/user.service';

// @Component({
//   selector: 'app-user-detail',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ButtonModule, 
//     TagModule, 
//     DividerModule,
//     AvatarModule,
//     AvatarGroupModule,
//     CardModule,
//     TooltipModule,
//     BadgeModule,
//     SkeletonModule
//   ],
//   template: `
//     <div class="user-detail-container">
//       @if (loading) {
//         <!-- Loading Skeleton -->
//         <div class="loading-skeleton">
//           <div class="skeleton-header">
//             <p-skeleton shape="circle" size="6rem" styleClass="mr-3"></p-skeleton>
//             <div style="flex: 1">
//               <p-skeleton width="60%" height="2rem" styleClass="mb-2"></p-skeleton>
//               <p-skeleton width="40%" height="1.5rem"></p-skeleton>
//             </div>
//           </div>
//           <p-divider></p-divider>
//           <div class="skeleton-grid">
//             @for (item of [1,2,3,4,5,6,7,8]; track item) {
//               <div class="skeleton-item">
//                 <p-skeleton width="40%" height="1rem" styleClass="mb-2"></p-skeleton>
//                 <p-skeleton width="100%" height="1.5rem"></p-skeleton>
//               </div>
//             }
//           </div>
//         </div>
//       } @else if (user) {
//         <!-- User Profile Card -->
//         <div class="profile-card">
//           <!-- Cover Photo (optional) -->
//           <div class="profile-cover">
//             <div class="cover-gradient" [ngStyle]="{'background': getCoverGradient()}"></div>
//           </div>

//           <!-- Profile Header -->
//           <div class="profile-header">
//             <div class="avatar-wrapper">
//               @if (user.profilePicture) {
//                 <img [src]="user.profilePicture" [alt]="user.firstName" class="profile-avatar">
//               } @else {
//                 <div class="profile-avatar placeholder" 
//                      [ngStyle]="{'background-color': getAvatarColor(user.firstName)}">
//                   <span class="avatar-initials">{{ getInitials(user.firstName, user.lastName) }}</span>
//                 </div>
//               }
//               <div class="avatar-badge">
//                 <i class="pi" [class.pi-check-circle]="user.isActive" 
//                    [class.pi-times-circle]="!user.isActive"
//                    [class.active]="user.isActive"
//                    [class.inactive]="!user.isActive"></i>
//               </div>
//             </div>

//             <div class="profile-title">
//               <h1>{{ user.firstName }} {{ user.lastName }}</h1>
//               <div class="title-meta">
//                 <span class="role-badge" [class]="'role-' + user.role">
//                   <i class="pi" [class.pi-shield]="user.role === 'admin'"
//                      [class.pi-user-edit]="user.role === 'instructor'"
//                      [class.pi-user]="user.role === 'student'"></i>
//                   {{ user.role | titlecase }}
//                 </span>
//                 @if (user.lastLogin) {
//                   <span class="last-login" pTooltip="Last Login" tooltipPosition="top">
//                     <i class="pi pi-clock"></i>
//                     {{ user.lastLogin | date:'medium' }}
//                   </span>
//                 }
//               </div>
//             </div>
//           </div>

//           <!-- Stats Cards -->
//           <div class="stats-grid">
//             <div class="stat-card">
//               <div class="stat-icon">
//                 <i class="pi pi-calendar"></i>
//               </div>
//               <div class="stat-content">
//                 <span class="stat-label">Member Since</span>
//                 <span class="stat-value">{{ user.createdAt | date:'MMM d, y' }}</span>
//               </div>
//             </div>

//             <div class="stat-card">
//               <div class="stat-icon">
//                 <i class="pi pi-sync"></i>
//               </div>
//               <div class="stat-content">
//                 <span class="stat-label">Last Updated</span>
//                 <span class="stat-value">{{ user.updatedAt | date:'MMM d, y' }}</span>
//               </div>
//             </div>

//             <div class="stat-card">
//               <div class="stat-icon">
//                 <i class="pi pi-hashtag"></i>
//               </div>
//               <div class="stat-content">
//                 <span class="stat-label">Version</span>
//                 <span class="stat-value">v{{ user.__v || 0 }}</span>
//               </div>
//             </div>
//           </div>

//           <p-divider></p-divider>

//           <!-- User Details Grid -->
//           <div class="details-section">
//             <h3 class="section-title">
//               <i class="pi pi-info-circle"></i>
//               Account Information
//             </h3>

//             <div class="details-grid">
//               <!-- Email -->
//               <div class="detail-item">
//                 <span class="detail-label">
//                   <i class="pi pi-envelope"></i>
//                   Email Address
//                 </span>
//                 <div class="detail-value-group">
//                   <span class="detail-value">{{ user.email }}</span>
//                   <p-tag 
//                     [value]="user.isEmailVerified ? 'Verified' : 'Unverified'" 
//                     [severity]="user.isEmailVerified ? 'success' : 'warn'"
//                     [rounded]="true"
//                     styleClass="email-tag">
//                   </p-tag>
//                 </div>
//               </div>

//               <!-- Account Status -->
//               <div class="detail-item">
//                 <span class="detail-label">
//                   <i class="pi pi-shield"></i>
//                   Account Status
//                 </span>
//                 <div class="detail-value-group">
//                   <p-tag 
//                     [value]="user.isActive ? 'Active' : 'Inactive'" 
//                     [severity]="user.isActive ? 'success' : 'danger'"
//                     [rounded]="true">
//                   </p-tag>
//                 </div>
//               </div>

//               <!-- User ID -->
//               <div class="detail-item full-width">
//                 <span class="detail-label">
//                   <i class="pi pi-id-card"></i>
//                   User ID
//                 </span>
//                 <div class="detail-value id-value">
//                   <code>{{ user._id }}</code>
//                   <button class="copy-btn" (click)="copyToClipboard(user._id)" pTooltip="Copy to clipboard">
//                     <i class="pi pi-copy"></i>
//                   </button>
//                 </div>
//               </div>

//               <!-- Deletion Status -->
//               <div class="detail-item">
//                 <span class="detail-label">
//                   <i class="pi pi-trash"></i>
//                   Deletion Status
//                 </span>
//                 <div class="detail-value-group">
//                   <p-tag 
//                     [value]="user.isDeleted ? 'Deleted' : 'Not Deleted'" 
//                     [severity]="user.isDeleted ? 'danger' : 'success'"
//                     [rounded]="true">
//                   </p-tag>
//                 </div>
//               </div>

//               @if (user.deletedAt) {
//                 <div class="detail-item">
//                   <span class="detail-label">
//                     <i class="pi pi-calendar-times"></i>
//                     Deleted At
//                   </span>
//                   <span class="detail-value">{{ user.deletedAt | date:'medium' }}</span>
//                 </div>
//               }

//               <!-- Account Age -->
//               <div class="detail-item">
//                 <span class="detail-label">
//                   <i class="pi pi-hourglass"></i>
//                   Account Age
//                 </span>
//                 <span class="detail-value">{{ getAccountAge() }}</span>
//               </div>
//             </div>
//           </div>

//           <!-- JSON View (optional, for debugging) -->
//           @if (showJsonView) {
//             <div class="json-section">
//               <p-divider></p-divider>
//               <div class="section-header">
//                 <h3 class="section-title">
//                   <i class="pi pi-code"></i>
//                   Raw Data
//                 </h3>
//                 <button class="toggle-json-btn" (click)="toggleJsonView()">
//                   <i class="pi pi-eye-slash"></i>
//                 </button>
//               </div>
//               <pre class="json-view">{{ user | json }}</pre>
//             </div>
//           } @else {
//             <div class="json-toggle">
//               <button class="toggle-json-btn" (click)="toggleJsonView()">
//                 <i class="pi pi-code"></i>
//                 Show Raw Data
//               </button>
//             </div>
//           }
//         </div>

//         <!-- Action Buttons -->
//         <div class="action-buttons">
//           <button pButton pRipple 
//                   label="Edit User" 
//                   icon="pi pi-pencil" 
//                   class="p-button-rounded p-button-primary"
//                   (click)="onEdit()">
//           </button>
//           <button pButton pRipple 
//                   label="Close" 
//                   icon="pi pi-times" 
//                   class="p-button-rounded p-button-outlined p-button-secondary"
//                   (click)="onClose()">
//           </button>
//         </div>
//       }
//     </div>
//   `,
//   styles: [`
//     .user-detail-container {
//       max-width: 1000px;
//       margin: 0 auto;
//       padding: var(--spacing-lg);
//     }

//     /* Loading Skeleton */
//     .loading-skeleton {
//       padding: var(--spacing-lg);
//     }

//     .skeleton-header {
//       display: flex;
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-xl);
//     }

//     .skeleton-grid {
//       display: grid;
//       grid-template-columns: repeat(2, 1fr);
//       gap: var(--spacing-lg);
//       margin-top: var(--spacing-lg);
//     }

//     .skeleton-item {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//     }

//     /* Profile Card */
//     .profile-card {
//       background: var(--bg-primary);
//       border-radius: var(--ui-border-radius-lg);
//       box-shadow: var(--shadow-lg);
//       overflow: hidden;
//       position: relative;
//       margin-bottom: var(--spacing-xl);
//     }

//     .profile-cover {
//       height: 120px;
//       background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
//       position: relative;
//     }

//     .cover-gradient {
//       width: 100%;
//       height: 100%;
//       opacity: 0.8;
//     }

//     /* Profile Header */
//     .profile-header {
//       display: flex;
//       gap: var(--spacing-xl);
//       padding: 0 var(--spacing-xl) var(--spacing-xl) var(--spacing-xl);
//       margin-top: -40px;
//       position: relative;
//       align-items: flex-end;
//     }

//     .avatar-wrapper {
//       position: relative;
//       width: 100px;
//       height: 100px;
//     }

//     .profile-avatar {
//       width: 100px;
//       height: 100px;
//       border-radius: 50%;
//       object-fit: cover;
//       border: 4px solid var(--bg-primary);
//       background: white;
//       box-shadow: var(--shadow-md);
//     }

//     .profile-avatar.placeholder {
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
//       color: white;
//       font-size: 2.5rem;
//       font-weight: var(--font-weight-bold);
//     }

//     .avatar-initials {
//       text-transform: uppercase;
//     }

//     .avatar-badge {
//       position: absolute;
//       bottom: 8px;
//       right: 8px;
//       background: white;
//       border-radius: 50%;
//       width: 24px;
//       height: 24px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       box-shadow: var(--shadow-sm);
//     }

//     .avatar-badge i {
//       font-size: 14px;
//     }

//     .avatar-badge i.active {
//       color: var(--color-success);
//     }

//     .avatar-badge i.inactive {
//       color: var(--color-warning);
//     }

//     .profile-title {
//       flex: 1;
//       padding-bottom: var(--spacing-md);
//     }

//     .profile-title h1 {
//       font-size: var(--font-size-3xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0 0 var(--spacing-xs);
//       line-height: 1.2;
//     }

//     .title-meta {
//       display: flex;
//       gap: var(--spacing-md);
//       align-items: center;
//       flex-wrap: wrap;
//     }

//     /* Role Badge */
//     .role-badge {
//       display: inline-flex;
//       align-items: center;
//       gap: var(--spacing-xs);
//       padding: var(--spacing-xs) var(--spacing-lg);
//       border-radius: 100px;
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-medium);
//       text-transform: uppercase;
//     }

//     .role-badge i {
//       font-size: var(--font-size-sm);
//     }

//     .role-admin {
//       background: var(--accent-focus);
//       color: var(--accent-primary);
//     }

//     .role-instructor {
//       background: var(--color-success-bg);
//       color: var(--color-success-dark);
//     }

//     .role-student {
//       background: var(--bg-secondary);
//       color: var(--text-secondary);
//     }

//     .last-login {
//       display: inline-flex;
//       align-items: center;
//       gap: var(--spacing-xs);
//       color: var(--text-tertiary);
//       font-size: var(--font-size-sm);
//     }

//     /* Stats Grid */
//     .stats-grid {
//       display: grid;
//       grid-template-columns: repeat(3, 1fr);
//       gap: var(--spacing-lg);
//       padding: var(--spacing-xl);
//       background: var(--bg-secondary);
//       margin: var(--spacing-lg) var(--spacing-xl);
//       border-radius: var(--ui-border-radius);
//     }

//     .stat-card {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//     }

//     .stat-icon {
//       width: 40px;
//       height: 40px;
//       border-radius: 50%;
//       background: var(--bg-primary);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       color: var(--accent-primary);
//     }

//     .stat-content {
//       display: flex;
//       flex-direction: column;
//     }

//     .stat-label {
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//       text-transform: uppercase;
//       letter-spacing: 0.5px;
//     }

//     .stat-value {
//       font-size: var(--font-size-md);
//       font-weight: var(--font-weight-medium);
//       color: var(--text-primary);
//     }

//     /* Sections */
//     .section-title {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       font-size: var(--font-size-lg);
//       font-weight: var(--font-weight-semibold);
//       color: var(--text-primary);
//       margin: 0 0 var(--spacing-lg);
//     }

//     .section-title i {
//       color: var(--accent-primary);
//     }

//     .details-section {
//       padding: var(--spacing-xl);
//     }

//     /* Details Grid */
//     .details-grid {
//       display: grid;
//       grid-template-columns: repeat(2, 1fr);
//       gap: var(--spacing-xl);
//     }

//     .detail-item {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//     }

//     .detail-item.full-width {
//       grid-column: 1 / -1;
//     }

//     .detail-label {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xs);
//       font-size: var(--font-size-sm);
//       color: var(--text-secondary);
//       font-weight: var(--font-weight-medium);
//       text-transform: uppercase;
//       letter-spacing: 0.3px;
//     }

//     .detail-label i {
//       font-size: var(--font-size-md);
//       color: var(--accent-primary);
//     }

//     .detail-value-group {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//       flex-wrap: wrap;
//     }

//     .detail-value {
//       font-size: var(--font-size-md);
//       color: var(--text-primary);
//       font-weight: var(--font-weight-medium);
//     }

//     .id-value {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//       background: var(--bg-secondary);
//       padding: var(--spacing-sm) var(--spacing-md);
//       border-radius: var(--ui-border-radius);
//       font-family: monospace;
//       font-size: var(--font-size-sm);
//     }

//     .copy-btn {
//       background: transparent;
//       border: none;
//       color: var(--text-tertiary);
//       cursor: pointer;
//       padding: var(--spacing-xs);
//       border-radius: var(--ui-border-radius-sm);
//       transition: var(--transition-fast);
//     }

//     .copy-btn:hover {
//       color: var(--accent-primary);
//       background: var(--accent-focus);
//     }

//     /* Email Tag */
//     :host ::ng-deep .email-tag {
//       margin-left: auto;
//     }

//     /* JSON View */
//     .json-section {
//       padding: var(--spacing-xl);
//       border-top: 1px solid var(--border-secondary);
//     }

//     .section-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       margin-bottom: var(--spacing-lg);
//     }

//     .json-view {
//       background: var(--bg-secondary);
//       padding: var(--spacing-lg);
//       border-radius: var(--ui-border-radius);
//       font-size: var(--font-size-sm);
//       max-height: 300px;
//       overflow: auto;
//       color: var(--text-primary);
//     }

//     .json-toggle {
//       text-align: center;
//       padding: var(--spacing-lg);
//     }

//     .toggle-json-btn {
//       background: transparent;
//       border: 1px solid var(--border-secondary);
//       color: var(--text-secondary);
//       padding: var(--spacing-sm) var(--spacing-lg);
//       border-radius: var(--ui-border-radius);
//       cursor: pointer;
//       display: inline-flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       transition: var(--transition-base);
//     }

//     .toggle-json-btn:hover {
//       background: var(--bg-secondary);
//       color: var(--text-primary);
//     }

//     /* Action Buttons */
//     .action-buttons {
//       display: flex;
//       justify-content: flex-end;
//       gap: var(--spacing-md);
//       padding: 0 var(--spacing-xl) var(--spacing-xl) var(--spacing-xl);
//     }

//     /* Responsive */
//     @media (max-width: 768px) {
//       .user-detail-container {
//         padding: var(--spacing-md);
//       }

//       .profile-header {
//         flex-direction: column;
//         align-items: center;
//         text-align: center;
//         margin-top: -60px;
//         padding: 0 var(--spacing-md) var(--spacing-md);
//       }

//       .profile-title {
//         text-align: center;
//       }

//       .title-meta {
//         justify-content: center;
//       }

//       .stats-grid {
//         grid-template-columns: 1fr;
//         margin: var(--spacing-md);
//       }

//       .details-grid {
//         grid-template-columns: 1fr;
//       }

//       .detail-value-group {
//         flex-direction: column;
//         align-items: flex-start;
//       }

//       :host ::ng-deep .email-tag {
//         margin-left: 0;
//       }
//     }
//   `]
// })
// export class UserDetailComponent implements OnInit, OnDestroy, OnChanges {
//   @Input() userId!: any;
//   @Output() edit = new EventEmitter<void>();
//   @Output() close = new EventEmitter<void>();

//   private userService = inject(UserService);

//   user: any = null;
//   loading = true;
//   showJsonView = false;
//   private subscriptions: Subscription[] = [];

//   ngOnInit(): void {
//     if (this.userId) {
//       this.loadUser();
//     }
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['userId'] && !changes['userId'].firstChange) {
//       this.loadUser();
//     }
//   }

//   ngOnDestroy(): void {
//     this.subscriptions.forEach(sub => sub.unsubscribe());
//   }

//   private loadUser(): void {
//     this.loading = true;
//     const sub = this.userService.getUserById(this.userId).subscribe({
//       next: (res: any) => {
//         this.user = res.data.data;
//         this.loading = false;
//       },
//       error: (error: any) => {
//         console.error('Failed to load user', error);
//         this.loading = false;
//       }
//     });
//     this.subscriptions.push(sub);
//   }

//   getInitials(firstName: string, lastName: string): string {
//     return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
//   }

//   getAvatarColor(name: string): string {
//     const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
//     const index = name?.charCodeAt(0) || 0;
//     return colors[index % colors.length];
//   }

//   getCoverGradient(): string {
//     const gradients = [
//       'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//       'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
//       'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
//       'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
//       'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
//       'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
//     ];
//     const index = this.user?.role?.charCodeAt(0) || 0;
//     return gradients[index % gradients.length];
//   }

//   getAccountAge(): string {
//     if (!this.user?.createdAt) return 'N/A';
    
//     const created = new Date(this.user.createdAt);
//     const now = new Date();
//     const diffTime = Math.abs(now.getTime() - created.getTime());
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
//     if (diffDays < 30) {
//       return `${diffDays} days`;
//     } else if (diffDays < 365) {
//       const months = Math.floor(diffDays / 30);
//       return `${months} month${months > 1 ? 's' : ''}`;
//     } else {
//       const years = Math.floor(diffDays / 365);
//       const months = Math.floor((diffDays % 365) / 30);
//       return `${years} year${years > 1 ? 's' : ''} ${months ? `, ${months} month${months > 1 ? 's' : ''}` : ''}`;
//     }
//   }

//   async copyToClipboard(text: string): Promise<void> {
//     try {
//       await navigator.clipboard.writeText(text);
//       // You could add a toast notification here
//     } catch (err) {
//       console.error('Failed to copy:', err);
//     }
//   }

//   toggleJsonView(): void {
//     this.showJsonView = !this.showJsonView;
//   }

//   onEdit(): void {
//     this.edit.emit();
//   }

//   onClose(): void {
//     this.close.emit();
//   }
// }