import { Component, OnInit, ChangeDetectionStrategy, ViewChild, inject, signal, DestroyRef, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';

// PrimeNG
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

// Core & Components
import { User } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { UserFormComponent } from "./user-form.component";
import { UserDetailComponent } from "./user-detail.component";
import { AppMessageService } from '../../core/utils/message.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    ToolbarModule,
    DialogModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    UserFormComponent,
    UserDetailComponent
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="user-list-container fade-in">
      <p-toast position="top-right"></p-toast>
      <p-confirmDialog [style]="{width: '450px'}"></p-confirmDialog>
      
      <div class="glass-panel toolbar">
        <div class="toolbar-left">
          <div class="header-content">
            <div class="icon-circle bg-primary-bg border-primary text-primary flex-center border-radius-lg shadow-xs" style="width: 48px; height: 48px;">
              <i class="pi pi-users text-xl"></i>
            </div>
            <div>
              <h2 class="page-title">User Management</h2>
              <span class="text-sm text-secondary font-medium">Manage your platform's members</span>
            </div>
          </div>
        </div>
        <div class="toolbar-right flex align-items-center gap-md">
          <span class="total-count shadow-xs">{{ totalRecords() }} total users</span>
          <div class="divider-vertical"></div>
          <button pButton pRipple label="Export" icon="pi pi-download" class="p-button-outlined p-button-secondary"></button>
          <button pButton pRipple label="Add User" icon="pi pi-plus" class="p-button-primary shadow-btn" (click)="openNewUserDialog()"></button>
        </div>
      </div>

     <div class="filters-section glass-panel">
  <div class="filters-container">
    <!-- Search Input with Icon -->
    <div class="search-wrapper">
      <span class="p-input-icon-left w-full">
        <!-- <i class="pi pi-search"></i> -->
        <input 
          pInputText 
          [ngModel]="searchQuery()" 
          (ngModelChange)="onSearchChange($event)"
          placeholder="Search by name or email..." 
          class="search-input">
      </span>
    </div>

    <!-- Filter Controls -->
    <div class="filter-controls">
      <!-- Role Filter -->
      <p-select 
        appendTo="body" 
        [options]="roleOptions" 
        [ngModel]="selectedRole()" 
        (ngModelChange)="onRoleChange($event)"
        placeholder="All Roles"
        optionLabel="label"
        optionValue="value"
        styleClass="filter-select"
        [showClear]="true">
        <ng-template pTemplate="selectedItem">
          <div class="selected-filter" *ngIf="selectedRole()">
            <i class="pi pi-users mr-1"></i>
            <span>{{ getRoleLabel(selectedRole()) }}</span>
          </div>
          <span *ngIf="!selectedRole()" class="filter-placeholder">
            <i class="pi pi-users mr-1"></i>
            All Roles
          </span>
        </ng-template>
      </p-select>

      <!-- Status Filter -->
      <p-select 
        appendTo="body" 
        [options]="statusOptions" 
        [ngModel]="selectedStatus()" 
        (ngModelChange)="onStatusChange($event)"
        placeholder="All Status"
        optionLabel="label"
        optionValue="value"
        styleClass="filter-select"
        [showClear]="true">
        <ng-template pTemplate="selectedItem">
          <div class="selected-filter" *ngIf="selectedStatus()">
            <i class="pi" [class.pi-check-circle]="selectedStatus() === 'active'" 
                         [class.pi-times-circle]="selectedStatus() === 'inactive'"
                         [class.pi-exclamation-triangle]="selectedStatus() === 'pending'"
                         [style.color]="getStatusColor(selectedStatus())"></i>
            <span>{{ getStatusLabel(selectedStatus()) }}</span>
          </div>
          <span *ngIf="!selectedStatus()" class="filter-placeholder">
            <i class="pi pi-filter mr-1"></i>
            All Status
          </span>
        </ng-template>
      </p-select>

      <!-- Clear Filters Button -->
      <button 
        pButton 
        pRipple 
        type="button"
        icon="pi pi-filter-slash" 
        class="p-button-rounded p-button-text p-button-secondary clear-filters-btn"
        pTooltip="Clear all filters"
        tooltipPosition="top"
        (click)="clearFilters()"
        [disabled]="!hasActiveFilters()">
      </button>
    </div>
  </div>

  <!-- Active Filters Display -->
  @if (hasActiveFilters()) {
    <div class="active-filters">
      <span class="active-filters-label">Active filters:</span>
      <div class="filter-chips">
        @if (selectedRole()) {
          <span class="filter-chip">
            <i class="pi pi-users"></i>
            {{ getRoleLabel(selectedRole()) }}
            <i class="pi pi-times-circle filter-chip-remove" 
               (click)="onRoleChange(null)"></i>
          </span>
        }
        @if (selectedStatus()) {
          <span class="filter-chip">
            <i class="pi" [class.pi-check-circle]="selectedStatus() === 'active'" 
                         [class.pi-times-circle]="selectedStatus() === 'inactive'"
                         [class.pi-exclamation-triangle]="selectedStatus() === 'pending'"></i>
            {{ getStatusLabel(selectedStatus()) }}
            <i class="pi pi-times-circle filter-chip-remove" 
               (click)="onStatusChange(null)"></i>
          </span>
        }
        @if (searchQuery()) {
          <span class="filter-chip">
            <i class="pi pi-search"></i>
            "{{ searchQuery() }}"
            <i class="pi pi-times-circle filter-chip-remove" 
               (click)="onSearchChange('')"></i>
          </span>
        }
      </div>
    </div>
  }
</div>
      <div class="glass-panel table-container shadow-sm border-radius-xl overflow-hidden">
        <p-table 
          #dt
          [value]="users()"
          [lazy]="true"
          (onLazyLoad)="onLazyLoad($event)"
          [paginator]="true"
          [rows]="rowsPerPage()"
          [totalRecords]="totalRecords()"
          [loading]="loading()"
          [rowsPerPageOptions]="[10, 25, 50]"
          responsiveLayout="stack"
          [scrollable]="true"
          scrollHeight="flex"
          dataKey="_id"
          class="custom-table h-full">

          <ng-template pTemplate="header">
            <tr>
              <th style="min-width: 4rem" class="text-center">#</th>
              <th style="min-width: 250px">User</th>
              <th style="min-width: 250px">Contact Info</th>
              <th style="min-width: 150px">Role</th>
              <th style="min-width: 150px">Status</th>
              <th style="min-width: 150px">Joined</th>
              <th style="min-width: 150px" class="text-center align-right pr-xl">Actions</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-user let-i="rowIndex">
            <tr class="table-row-hover transition-colors">
              <td class="text-center font-medium text-tertiary">{{ i + 1 + firstRow() }}</td>
              <td>
                <div class="user-info">
                  <div class="user-avatar shadow-xs">
                    @if (user.profilePicture) {
                      <img [src]="user.profilePicture" [alt]="user.firstName" loading="lazy">
                    } @else {
                      <div class="avatar-placeholder" [ngStyle]="{'background-color': getAvatarColor(user.firstName)}">
                        {{ getInitials(user.firstName, user.lastName) }}
                      </div>
                    }
                  </div>
                  <div class="user-details">
                    <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
                    <span class="user-id">ID: {{ user._id | slice:0:8 }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="contact-info">
                  <span class="email-text">{{ user.email }}</span>
                  @if (user.isEmailVerified) {
                    <i class="pi pi-check-circle text-success" pTooltip="Verified Email"></i>
                  } @else {
                    <i class="pi pi-exclamation-circle text-warning" pTooltip="Unverified"></i>
                  }
                </div>
              </td>
              <td>
                <span class="role-badge" [class]="'role-' + user.role">
                  {{ user.role | titlecase }}
                </span>
              </td>
              <td>
                <div class="status-wrapper">
                  <span class="status-dot" [class.active]="user.isActive"></span>
                  <span class="status-text">{{ user.isActive ? 'Active' : 'Inactive' }}</span>
                </div>
              </td>
              <td class="text-tertiary font-medium text-sm">{{ user.createdAt | date:'MMM d, yyyy' }}</td>
              <td class="text-center">
                <div class="action-buttons">
                  <button pButton pRipple icon="pi pi-eye" class="p-button-rounded p-button-text p-button-info" 
                          (click)="viewUser(user)" pTooltip="View Details" tooltipPosition="top"></button>
                  <button pButton pRipple icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-success" 
                          (click)="editUser(user)" pTooltip="Edit User" tooltipPosition="top"></button>
                  <button pButton pRipple icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" 
                          (click)="deleteUser(user)" pTooltip="Delete User" tooltipPosition="top"></button>
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="text-center p-0">
                <div class="empty-state">
                  <div class="empty-icon-wrapper">
                    <i class="pi pi-users"></i>
                  </div>
                  <h3>No users found</h3>
                  <p class="text-muted">Try adjusting your search filters or add a new user to the system.</p>
                  <button pButton pRipple label="Add New User" icon="pi pi-plus" class="p-button-primary mt-3" (click)="openNewUserDialog()"></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <p-dialog appendTo="body"  appendTo="body" 
        [visible]="showFormDialog()" 
        (visibleChange)="showFormDialog.set($event)"
        [style]="{width: '80%', height:'75%'}" 
        [header]="dialogTitle()"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        styleClass="custom-dialog shadow-3xl">
        <app-user-form 
          [userId]="selectedUserId()"
          (saved)="onUserSaved()"
          (cancelled)="closeDialog()">
        </app-user-form>
      </p-dialog>

      <p-dialog appendTo="body"  appendTo="body" 
        [visible]="showDetailDialog()" 
        (visibleChange)="showDetailDialog.set($event)"
        [style]="{width: '80%', height:'95%'}" 
        header="User Profile"
        [modal]="true"
        [draggable]="false"
        [resizable]="false"
        styleClass="custom-dialog shadow-3xl">
        <app-user-detail 
          [userId]="selectedUserId()"
          (edit)="editFromDetail()"
          (close)="closeDetailDialog()">
        </app-user-detail>
      </p-dialog>
    </div>
  `,
  styles: [`
    /* =========================================================
       SCROLL FIX & LAYOUT ARCHITECTURE
       ========================================================= */
    .user-list-container {
      /* Lock the container to the viewport height */
      display: flex;
      flex-direction: column;
      height: 100vh;         /* Or 100% if inside a router-outlet with fixed height */
      max-height: 100vh;
      overflow: hidden;      /* NO page-level scrolling allowed */
      padding: var(--spacing-xl);
      gap: var(--spacing-md);
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-body);
    }

    /* Keep toolbars from shrinking or growing */
    .toolbar, .filters-section {
      flex-shrink: 0;
    }

    /* The table container takes up all remaining vertical space */
    .table-container {
      flex: 1;
      min-height: 0;         /* CRITICAL: Allows flex child to scroll internally */
      display: flex;
      flex-direction: column;
    }

    /* Target PrimeNG internals to enforce flex scrolling */
    :host ::ng-deep {
      .custom-table {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .custom-table .p-datatable-wrapper {
        flex: 1;             /* The actual tbody area scrolls */
        overflow-y: auto;
      }
      /* Keep the header sticky at the top of the scrolling body */
      .custom-table .p-datatable-thead {
        position: sticky;
        top: 0;
        z-index: 10;
      }
    }

    /* =========================================================
       UI & STYLING (Glassmorphism & Modernization)
       ========================================================= */
    .glass-panel {
      background: var(--component-surface-raised);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-sm);
    }

    /* Toolbar Styles */
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md) var(--spacing-xl);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
    }

    .page-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0 0 2px 0;
      letter-spacing: -0.02em;
    }

    .total-count {
      color: var(--color-primary-dark);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      background: var(--color-primary-bg);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--ui-border-radius-full);
      border: var(--ui-border-width) solid var(--color-primary-border);
    }

    .divider-vertical {
      width: 1px;
      height: 24px;
      background: var(--border-secondary);
      margin: 0 var(--spacing-sm);
    }

    /* Filters Section */
    .filters-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md) var(--spacing-xl);
      gap: var(--spacing-xl);
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex-wrap: wrap;
    }

    .search-wrapper {
      flex: 1;
      min-width: 300px;
      max-width: 450px;
    }

    /* Table Styling */
    // :host ::ng-deep {
    //   .custom-table .p-datatable-thead > tr > th {
    //     background: var(--bg-secondary);
    //     color: var(--text-secondary);
    //     font-weight: var(--font-weight-bold);
    //     font-size: var(--font-size-xs);
    //     border-bottom: 2px solid var(--border-secondary);
    //     padding: var(--spacing-lg) var(--spacing-md);
    //     text-transform: uppercase;
    //     letter-spacing: 0.05em;
    //     white-space: nowrap;
    //   }

    //   .custom-table .p-datatable-tbody > tr > td {
    //     padding: var(--spacing-md);
    //     border-bottom: 1px solid var(--component-divider);
    //     color: var(--text-primary);
    //     font-size: var(--font-size-sm);
    //   }
      
    //   .custom-table .p-paginator {
    //     background: var(--bg-secondary);
    //     border-top: 1px solid var(--border-secondary);
    //     padding: var(--spacing-sm);
    //     border-bottom-left-radius: var(--ui-border-radius-xl);
    //     border-bottom-right-radius: var(--ui-border-radius-xl);
    //   }
    // }

    .table-row-hover:hover {
      background: var(--bg-hover) !important;
    }

    /* User Info Cell */
    .user-info { display: flex; align-items: center; gap: var(--spacing-md); }
    .user-avatar {
      width: 40px; height: 40px; border-radius: 50%; overflow: hidden;
      border: 2px solid var(--bg-primary); flex-shrink: 0;
    }
    .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-placeholder {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      color: white; font-family: var(--font-heading); font-weight: var(--font-weight-bold);
      font-size: var(--font-size-sm); text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }

    .user-details { display: flex; flex-direction: column; gap: 2px; }
    .user-name { font-weight: var(--font-weight-bold); color: var(--text-primary); font-size: var(--font-size-sm); }
    .user-id { font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-tertiary); }

    /* Contact Info */
    .contact-info { display: flex; align-items: center; gap: var(--spacing-sm); }
    .email-text { color: var(--text-secondary); font-weight: var(--font-weight-medium); }

    /* Canonical Role Badges */
    .role-badge {
      display: inline-flex; align-items: center; padding: 4px 10px; border-radius: var(--ui-border-radius-full);
      font-size: 0.65rem; font-weight: var(--font-weight-bold); letter-spacing: 0.05em; text-transform: uppercase;
    }
    .role-admin { background: var(--color-primary-bg); color: var(--color-primary-dark); border: 1px solid var(--color-primary-border); }
    .role-instructor { background: var(--color-info-bg); color: var(--color-info-dark); border: 1px solid var(--color-info-border); }
    .role-student { background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-secondary); }

    /* Status Dot */
    .status-wrapper { display: flex; align-items: center; gap: var(--spacing-sm); }
    .status-dot {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%;
      background: var(--color-error); box-shadow: 0 0 0 2px var(--color-error-bg);
    }
    .status-dot.active { background: var(--color-success); box-shadow: 0 0 0 2px var(--color-success-bg); }
    .status-text { font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); color: var(--text-secondary); }

    /* Action Buttons (Hover Reveal) */
    .action-buttons {
      display: flex; gap: 4px; justify-content: flex-end; opacity: 0.4; transition: var(--transition-base);
    }
    .table-row-hover:hover .action-buttons { opacity: 1; }

    /* Empty State */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: var(--spacing-5xl) var(--spacing-xl); background: var(--bg-primary); height: 100%;
    }
    .empty-icon-wrapper {
      width: 72px; height: 72px; margin-bottom: var(--spacing-xl); background: var(--bg-secondary);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      border: 2px dashed var(--border-secondary);
    }
    .empty-icon-wrapper i { font-size: 2rem; color: var(--text-tertiary); }
    .empty-state h3 { font-family: var(--font-heading); color: var(--text-primary); font-size: var(--font-size-xl); margin: 0 0 var(--spacing-sm) 0; }
    .text-muted { color: var(--text-tertiary); }

    /* Animations & Dialog Overrides */
    .fade-in { animation: fadeIn var(--transition-base); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

    // :host ::ng-deep .custom-dialog .p-dialog-header {
    //   background: var(--component-surface-raised); border-bottom: 1px solid var(--border-secondary); padding: var(--spacing-lg) var(--spacing-xl);
    // }
    // :host ::ng-deep .custom-dialog .p-dialog-content {
    //   background: var(--bg-primary); padding: var(--spacing-xl);
    // }

    /* Responsive adjustments */
    @media (max-width: 992px) {
      .user-list-container {
        height: auto;
        overflow-y: auto; /* Turn off 100vh lock on mobile */
      }
      .toolbar, .filters-section { flex-direction: column; align-items: stretch; gap: var(--spacing-md); }
      .toolbar-right { justify-content: space-between; margin-top: var(--spacing-sm); }
      .search-wrapper { max-width: 100%; }
      .table-container { min-height: 600px; /* Fallback for mobile */ }
    }

    .filters-section {
  background: var(--bg-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-secondary);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &.glass-panel {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
}

.filters-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;

  @media (min-width: 1024px) {
    flex-wrap: nowrap;
  }
}

/* Search Wrapper */
.search-wrapper {
  flex: 2;
  min-width: 250px;

  .p-input-icon-left {
    width: 100%;
    position: relative;

    i {
      color: var(--text-tertiary);
      font-size: var(--font-size-base);
    }

    .search-input {
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md) var(--spacing-sm) calc(var(--spacing-xl) + 0.5rem);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      font-size: var(--font-size-base);
      transition: all 0.2s ease;
      background: var(--bg-primary);

      &:hover {
        border-color: var(--accent-secondary);
      }

      &:focus {
        outline: none;
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 3px var(--focus-ring-color);
      }

      // &::placeholder {
      //   color: var(--text-tertiary);
      //   opacity: 0.8;
      // }
    }
  }
}

/* Filter Controls */
.filter-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 3;
  justify-content: flex-end;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
}

// /* Filter Select Styling */
// :host ::ng-deep {
//   .filter-select {
//     min-width: 160px;

//     .p-select-label {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xs);
//       padding: var(--spacing-sm) var(--spacing-md);
//     }

//     .p-select-trigger {
//       width: 2.5rem;
//     }

//     &:hover {
//       border-color: var(--accent-secondary);
//     }

//     &.p-focus {
//       border-color: var(--accent-primary);
//       box-shadow: 0 0 0 3px var(--focus-ring-color);
//     }
//   }

//   .p-select-dropdown {
//     .selected-filter {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xs);
//       color: var(--text-primary);

//       i {
//         font-size: var(--font-size-sm);
//       }
//     }

//     .filter-placeholder {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xs);
//       color: var(--text-tertiary);

//       i {
//         font-size: var(--font-size-sm);
//       }
//     }
//   }

//   /* Dropdown Panel Styling */
//   .p-select-panel {
//     border-radius: var(--ui-border-radius);
//     box-shadow: var(--shadow-lg);
//     border: 1px solid var(--border-secondary);
//     background: var(--bg-primary);
//     padding: var(--spacing-xs) 0;
//     max-height: 300px;

//     .p-select-option {
//       padding: var(--spacing-sm) var(--spacing-md);
//       transition: all 0.2s ease;
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);

//       &:hover {
//         background: var(--bg-secondary);
//       }

//       &.p-select-option-selected {
//         background: var(--accent-focus);
//         color: var(--accent-primary);
//       }

//       i {
//         font-size: var(--font-size-sm);
//         width: 16px;
//       }
//     }
//   }
// }

/* Clear Filters Button */
.clear-filters-btn {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 50%;
  transition: all 0.2s ease;
  margin-left: var(--spacing-xs);

  &:hover:not(:disabled) {
    background: var(--accent-focus);
    color: var(--accent-primary);
    transform: rotate(15deg);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* Active Filters Section */
.active-filters {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-secondary);
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}

.active-filters-label {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  flex: 1;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 20px;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  transition: all 0.2s ease;

  i:not(.filter-chip-remove) {
    color: var(--accent-primary);
    font-size: var(--font-size-xs);
  }

  .filter-chip-remove {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: var(--spacing-xs);
    padding: 2px;

    &:hover {
      color: var(--color-error);
      transform: scale(1.1);
    }
  }

  &:hover {
    background: var(--bg-primary);
    border-color: var(--accent-secondary);
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .filters-section.glass-panel {
    background: rgba(30, 30, 30, 0.9);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .search-input {
    background: var(--bg-secondary) !important;
    color: var(--text-primary) !important;
  }

  .filter-chip {
    background: var(--bg-tertiary);
    border-color: var(--border-secondary);
  }
}

/* Responsive Adjustments */
@media (max-width: 1024px) {
  .filters-container {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    width: 100%;
  }

  .filter-controls {
    width: 100%;
    justify-content: space-between;
  }

  :host ::ng-deep .filter-select {
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .filters-section {
    padding: var(--spacing-md);
  }

  .filter-controls {
    flex-wrap: wrap;
    gap: var(--spacing-sm);

    :host ::ng-deep .filter-select {
      width: calc(50% - 30px);
      min-width: 120px;
    }
  }

  .clear-filters-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
  }

  .filter-chips {
    width: 100%;
  }
}

/* Animation for filter chips */
.filter-chip {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading state for filters */
.filters-section.loading {
  opacity: 0.7;
  pointer-events: none;

  .search-input,
  .filter-select {
    background: linear-gradient(90deg, 
      var(--bg-secondary) 25%, 
      var(--bg-tertiary) 50%, 
      var(--bg-secondary) 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

  `]
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(AppMessageService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('dt') table: any;

  // Signal State Management
  users = signal<User[]>([]);
  totalRecords = signal<number>(0);
  loading = signal<boolean>(false);
  firstRow = signal<number>(0);
  rowsPerPage = signal<number>(10);

  searchQuery = signal<string>('');
  selectedRole = signal<any>(null);
  selectedStatus = signal<any>(null);

  showFormDialog = signal<boolean>(false);
  showDetailDialog = signal<boolean>(false);
  selectedUserId = signal<string | null>(null);
  dialogTitle = signal<string>('Add New User');

  private searchSubject = new Subject<string>();

  readonly roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Instructor', value: 'instructor' },
    { label: 'Student', value: 'student' }
  ];

  readonly statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ];
// Helper methods for the filter UI
getRoleLabel(role: string): string {
  const roleMap: Record<string, string> = {
    'admin': 'Admin',
    'instructor': 'Instructor',
    'student': 'Student'
  };
  return roleMap[role] || role;
}

getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'active': 'Active',
    'inactive': 'Inactive',
    'pending': 'Pending'
  };
  return statusMap[status] || status;
}

getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'active': 'var(--color-success)',
    'inactive': 'var(--color-warning)',
    'pending': 'var(--color-info)'
  };
  return colorMap[status] || 'var(--text-secondary)';
}

hasActiveFilters = computed(() => {
  return !!(this.selectedRole() || this.selectedStatus() || this.searchQuery());
});
  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.resetPaginationAndLoad();
    });

    this.loadUsers();
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const page = event.first! / event.rows! + 1;
    this.firstRow.set(event.first || 0);
    this.rowsPerPage.set(event.rows || 10);
    this.loadUsers(page, this.rowsPerPage());
  }

  private resetPaginationAndLoad(): void {
    this.firstRow.set(0);
    if (this.table) this.table.first = 0; 
    this.loadUsers(1, this.rowsPerPage());
  }

  loadUsers(page: number = 1, limit: number = this.rowsPerPage()): void {
    this.loading.set(true);

    const params: any = { page, limit };
    if (this.searchQuery()) params.search = this.searchQuery();
    if (this.selectedRole()) params.role = this.selectedRole();
    if (this.selectedStatus() !== null) params.isActive = this.selectedStatus();

    this.userService.getAllUsers(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.users.set(res.data || []);
          this.totalRecords.set(res.pagination?.totalResults || 0);
          this.loading.set(false);
        },
        error: (error: any) => {
          console.error('Failed to load users', error);
          this.showToast('error', 'Error', 'Failed to retrieve users. Please try again.');
          this.loading.set(false);
        }
      });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onRoleChange(role: string | null): void {
    this.selectedRole.set(role);
    this.resetPaginationAndLoad();
  }

  onStatusChange(status: boolean | null): void {
    this.selectedStatus.set(status);
    this.resetPaginationAndLoad();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedRole.set(null);
    this.selectedStatus.set(null);
    this.resetPaginationAndLoad();
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#F7DC6F', '#DDA0DD', '#98D8C8'];
    const index = name?.charCodeAt(0) || 0;
    return colors[index % colors.length];
  }

  private showToast(severity: string, summary: string, detail: string): void {
    this.messageService.showWarn( detail);
  }

  openNewUserDialog(): void {
    this.selectedUserId.set(null);
    this.dialogTitle.set('Add New User');
    this.showFormDialog.set(true);
  }

  viewUser(user: User): void {
    this.selectedUserId.set(user._id);
    this.showDetailDialog.set(true);
  }

  editUser(user: User): void {
    this.selectedUserId.set(user._id);
    this.dialogTitle.set('Edit User Profile');
    this.showFormDialog.set(true);
  }

  deleteUser(user: User): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete <b class="text-primary">${user.firstName} ${user.lastName}</b>? This action cannot be undone.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle text-error',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.userService.deleteUser(user._id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.showToast('success', 'Deleted', 'User removed successfully.');
              this.loadUsers(Math.floor(this.firstRow() / this.rowsPerPage()) + 1, this.rowsPerPage());
            },
            error: (error: any) => {
              console.error('Failed to delete user', error);
              this.showToast('error', 'Error', 'Failed to delete user.');
            }
          });
      }
    });
  }

  onUserSaved(): void {
    const isNew = !this.selectedUserId();
    this.showToast('success', 'Success', `User ${isNew ? 'created' : 'updated'} successfully.`);
    this.closeDialog();
    this.loadUsers(Math.floor(this.firstRow() / this.rowsPerPage()) + 1, this.rowsPerPage());
  }

  closeDialog(): void {
    this.showFormDialog.set(false);
    this.selectedUserId.set(null);
  }

  editFromDetail(): void {
    this.closeDetailDialog();
    setTimeout(() => {
      this.dialogTitle.set('Edit User Profile');
      this.showFormDialog.set(true);
    }, 150);
  }

  closeDetailDialog(): void {
    this.showDetailDialog.set(false);
    this.selectedUserId.set(null);
  }
}


  // import { Component, OnInit, ChangeDetectionStrategy, ViewChild, inject, signal, DestroyRef } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule } from '@angular/common';
// import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { RouterModule } from '@angular/router';
// import { Subject, debounceTime } from 'rxjs';

// // PrimeNG
// import { TableModule, TableLazyLoadEvent } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { TagModule } from 'primeng/tag';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';
// import { ToastModule } from 'primeng/toast';
// import { ToolbarModule } from 'primeng/toolbar';
// import { DialogModule } from 'primeng/dialog';
// import { SelectModule } from 'primeng/select';
// import { TooltipModule } from 'primeng/tooltip';
// import { ConfirmationService, MessageService } from 'primeng/api';

// // Core & Components
// import { User } from '../../core/services/auth.service';
// import { UserService } from '../../core/services/user.service';
// import { UserFormComponent } from "./user-form.component";
// import { UserDetailComponent } from "./user-detail.component";

// @Component({
//   selector: 'app-user-list',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
//     RouterModule,
//     TableModule,
//     ButtonModule,
//     InputTextModule,
//     SelectModule,
//     TagModule,
//     ConfirmDialogModule,
//     ToastModule,
//     ToolbarModule,
//     DialogModule,
//     TooltipModule,
//     UserFormComponent,
//     UserDetailComponent
//   ],
//   providers: [ConfirmationService, MessageService],
//   template: `
//     <div class="user-list-container fade-in">
//       <p-toast position="top-right"></p-toast>
//       <p-confirmDialog [style]="{width: '450px'}"></p-confirmDialog>
//       <div class="glass-panel toolbar">
//         <div class="toolbar-left">
//           <div class="header-content">
//             <h2 class="page-title">User Management</h2>
//             <span class="total-count">{{ totalRecords() }} total users</span>
//           </div>
//         </div>
//         <div class="toolbar-right">
//           <button pButton pRipple label="Export" icon="pi pi-download" class="p-button-outlined p-button-secondary mr-3"></button>
//           <button pButton pRipple label="Add User" icon="pi pi-plus" class="p-button-primary shadow-btn" (click)="openNewUserDialog()"></button>
//         </div>
//       </div>

//       <div class=" filters-section">
//         <div class="filter-item search-wrapper">
//           <span class="p-input-icon-left w-full">
//             <!-- <i class="pi pi-search text-muted"></i> -->
//             <input pInputText 
//                    [ngModel]="searchQuery()" 
//                    (ngModelChange)="onSearchChange($event)"
//                    placeholder="Search by name or email..." 
//                    class="search-input w-full">
//           </span>
//         </div>
//         <div class="filter-group">
//           <div class="filter-item">
//             <p-select appendTo='body' 
//               [options]="roleOptions" 
//               [ngModel]="selectedRole()" 
//               (ngModelChange)="onRoleChange($event)"
//               placeholder="Filter by Role"
//               optionLabel="label"
//               optionValue="value"
//               [showClear]="true">
//             </p-select>
//           </div>
//           <div class="filter-item">
//             <p-select appendTo='body' 
//               [options]="statusOptions" 
//               [ngModel]="selectedStatus()" 
//               (ngModelChange)="onStatusChange($event)"
//               placeholder="Filter by Status"
//               optionLabel="label"
//               optionValue="value"
//               [showClear]="true">
//             </p-select>
//           </div>
//           <button pButton pRipple icon="pi pi-filter-slash" class="p-button-text p-button-secondary" pTooltip="Clear Filters" (click)="clearFilters()"></button>
//         </div>
//       </div>

//       <div class="glass-panel table-container">
//         <p-table 
//           #dt
//           [value]="users()"
//           [lazy]="true"
//           (onLazyLoad)="onLazyLoad($event)"
//           [paginator]="true"
//           [rows]="rowsPerPage()"
//           [totalRecords]="totalRecords()"
//           [loading]="loading()"
//           [rowsPerPageOptions]="[10, 25, 50]"
//           responsiveLayout="scroll"
//           dataKey="_id"
//           class="custom-table">

//           <ng-template pTemplate="header">
//             <tr>
//               <th style="width: 4rem" class="text-center">#</th>
//               <th>User</th>
//               <th>Contact Info</th>
//               <th>Role</th>
//               <th>Status</th>
//               <th>Joined</th>
//               <th style="width: 12rem" class="text-right">Actions</th>
//             </tr>
//           </ng-template>

//           <ng-template pTemplate="body" let-user let-i="rowIndex">
//             <tr class="table-row-hover">
//               <td class="text-center text-muted">{{ i + 1 + firstRow() }}</td>
//               <td>
//                 <div class="user-info">
//                   <div class="user-avatar shadow-sm">
//                     @if (user.profilePicture) {
//                       <img [src]="user.profilePicture" [alt]="user.firstName" loading="lazy">
//                     } @else {
//                       <div class="avatar-placeholder" [ngStyle]="{'background-color': getAvatarColor(user.firstName)}">
//                         {{ getInitials(user.firstName, user.lastName) }}
//                       </div>
//                     }
//                   </div>
//                   <div class="user-details">
//                     <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
//                     <span class="user-id">ID: {{ user._id | slice:0:8 }}</span>
//                   </div>
//                 </div>
//               </td>
//               <td>
//                 <div class="contact-info">
//                   <span class="email-text">{{ user.email }}</span>
//                   @if (user.isEmailVerified) {
//                     <i class="pi pi-check-circle text-success" pTooltip="Verified Email"></i>
//                   } @else {
//                     <i class="pi pi-exclamation-circle text-warning" pTooltip="Unverified"></i>
//                   }
//                 </div>
//               </td>
//               <td>
//                 <span class="role-badge" [class]="'role-' + user.role">
//                   {{ user.role | titlecase }}
//                 </span>
//               </td>
//               <td>
//                 <span class="status-dot" [class.active]="user.isActive"></span>
//                 <span class="status-text">{{ user.isActive ? 'Active' : 'Inactive' }}</span>
//               </td>
//               <td class="text-muted">{{ user.createdAt | date:'MMM d, yyyy' }}</td>
//               <td>
//                 <div class="action-buttons justify-end">
//                   <button pButton pRipple icon="pi pi-eye" class="p-button-rounded p-button-text p-button-info" 
//                           (click)="viewUser(user)" pTooltip="View Details" tooltipPosition="top"></button>
//                   <button pButton pRipple icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-success" 
//                           (click)="editUser(user)" pTooltip="Edit User" tooltipPosition="top"></button>
//                   <button pButton pRipple icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" 
//                           (click)="deleteUser(user)" pTooltip="Delete User" tooltipPosition="top"></button>
//                 </div>
//               </td>
//             </tr>
//           </ng-template>

//           <ng-template pTemplate="emptymessage">
//             <tr>
//               <td colspan="7">
//                 <div class="empty-state">
//                   <div class="empty-icon-wrapper">
//                     <i class="pi pi-users"></i>
//                   </div>
//                   <h3>No users found</h3>
//                   <p class="text-muted">Try adjusting your search filters or add a new user to the system.</p>
//                   <button pButton pRipple label="Add New User" icon="pi pi-plus" class="p-button-primary mt-3" (click)="openNewUserDialog()"></button>
//                 </div>
//               </td>
//             </tr>
//           </ng-template>
//         </p-table>
//       </div>

//       <p-dialog appendTo="body"  appendTo="body" 
//         [visible]="showFormDialog()" 
//         (visibleChange)="showFormDialog.set($event)"
//         [style]="{width: '80%',height:'75%'}" 
//         [header]="dialogTitle()"
//         [modal]="true"
//         [draggable]="false"
//         [resizable]="false"
//         styleClass="custom-dialog">
//         <app-user-form 
//           [userId]="selectedUserId()"
//           (saved)="onUserSaved()"
//           (cancelled)="closeDialog()">
//         </app-user-form>
//       </p-dialog>

//       <p-dialog appendTo="body"  appendTo="body" 
//         [visible]="showDetailDialog()" 
//         (visibleChange)="showDetailDialog.set($event)"
//         [style]="{width: '80%',height:'95%'}" 
//         header="User Profile"
//         [modal]="true"
//         [draggable]="false"
//         [resizable]="false"
//         styleClass="custom-dialog">
//         <app-user-detail 
//           [userId]="selectedUserId()"
//           (edit)="editFromDetail()"
//           (close)="closeDetailDialog()">
//         </app-user-detail>
//       </p-dialog>
//     </div>
//   `,
//   styles: [`
//     /* Using your provided Canonical Mappings & Scale */
//     .user-list-container {
//       padding: var(--spacing-2xl);
//       background: var(--bg-primary);
//       min-height: 100vh;
//       color: var(--text-primary);
//       font-family: var(--font-body);
//     }

//     .glass-panel {
//       background: var(--component-surface-raised);
//       border: var(--ui-border-width) solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-xl);
//       box-shadow: var(--shadow-sm);
//       transition: var(--transition-base);
//     }

//     .toolbar {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: var(--spacing-xl) var(--spacing-2xl);
//       margin-bottom: var(--spacing-xl);
//     }

//     .header-content {
//       display: flex;
//       align-items: baseline;
//       gap: var(--spacing-md);
//     }

//     .page-title {
//       font-family: var(--font-heading);
//       font-size: var(--font-size-2xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0;
//       letter-spacing: -0.02em;
//     }

//     .total-count {
//       color: var(--text-secondary);
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-medium);
//       background: var(--bg-secondary);
//       padding: var(--spacing-xs) var(--spacing-md);
//       border-radius: var(--ui-border-radius-lg);
//       border: var(--ui-border-width) solid var(--border-tertiary);
//     }

//     .filters-section {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: var(--spacing-md) var(--spacing-xl);
//       margin-bottom: var(--spacing-xl);
//       gap: var(--spacing-xl);
//       flex-wrap: wrap;
//     }

//     .filter-group {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//       flex-wrap: wrap;
//     }

//     .search-wrapper {
//       flex: 1;
//       min-width: 300px;
//       max-width: 450px;
//     }

//     .table-container {
//       overflow: hidden;
//     }

//     /* Customizing PrimeNG Table internals to match theme */
//     :host ::ng-deep .custom-table .p-datatable-header,
//     :host ::ng-deep .custom-table .p-datatable-thead > tr > th {
//       background: var(--bg-secondary);
//       color: var(--text-secondary);
//       font-weight: var(--font-weight-semibold);
//       font-size: var(--font-size-sm);
//       border-bottom: var(--ui-border-width) solid var(--border-tertiary);
//       padding: var(--spacing-lg) var(--spacing-xl);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//     }

//     :host ::ng-deep .custom-table .p-datatable-tbody > tr > td {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       border-bottom: var(--ui-border-width) solid var(--component-divider);
//       color: var(--text-primary);
//       font-size: var(--font-size-md);
//     }

//     .table-row-hover:hover {
//       background: var(--bg-hover) !important;
//     }

//     /* User Info Cell */
//     .user-info {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-lg);
//     }

//     .user-avatar {
//       width: 42px;
//       height: 42px;
//       border-radius: 50%;
//       overflow: hidden;
//       border: var(--ui-border-width-lg) solid var(--bg-primary);
//       flex-shrink: 0;
//     }

//     .user-avatar img {
//       width: 100%;
//       height: 100%;
//       object-fit: cover;
//     }

//     .avatar-placeholder {
//       width: 100%;
//       height: 100%;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       color: white;
//       font-family: var(--font-heading);
//       font-weight: var(--font-weight-bold);
//       font-size: var(--font-size-md);
//       text-shadow: 0 1px 2px rgba(0,0,0,0.2);
//     }

//     .user-details {
//       display: flex;
//       flex-direction: column;
//       gap: 2px;
//     }

//     .user-name {
//       font-weight: var(--font-weight-semibold);
//       color: var(--text-primary);
//       font-size: var(--font-size-md);
//     }

//     .user-id {
//       font-family: var(--font-mono);
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//     }

//     /* Contact Info */
//     .contact-info {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//     }
    
//     .email-text {
//       color: var(--text-secondary);
//     }

//     /* Canonical Role Badges */
//     .role-badge {
//       display: inline-flex;
//       align-items: center;
//       padding: var(--spacing-xs) var(--spacing-md);
//       border-radius: var(--ui-border-radius-xl);
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       letter-spacing: 0.03em;
//       text-transform: uppercase;
//     }

//     .role-admin {
//       background: var(--color-primary-bg);
//       color: var(--color-primary);
//       border: 1px solid var(--color-primary-border);
//     }

//     .role-instructor {
//       background: var(--color-info-bg);
//       color: var(--color-info-light);
//       border: 1px solid var(--color-info-border);
//     }

//     .role-student {
//       background: var(--bg-secondary);
//       color: var(--text-secondary);
//       border: 1px solid var(--border-secondary);
//     }

//     /* Status Dot */
//     .status-dot {
//       display: inline-block;
//       width: 8px;
//       height: 8px;
//       border-radius: 50%;
//       background: var(--color-error);
//       margin-right: var(--spacing-sm);
//       box-shadow: 0 0 0 2px var(--color-error-bg);
//     }
//     .status-dot.active {
//       background: var(--color-success);
//       box-shadow: 0 0 0 2px var(--color-success-bg);
//     }
//     .status-text {
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-medium);
//       color: var(--text-secondary);
//     }

//     /* Utilities */
//     .text-muted { color: var(--text-tertiary); }
//     .text-success { color: var(--color-success); }
//     .text-warning { color: var(--color-warning); }
//     .justify-end { justify-content: flex-end; }
//     .shadow-btn { box-shadow: var(--shadow-md); }
    
//     .action-buttons {
//       display: flex;
//       gap: var(--spacing-xs);
//       opacity: 0.7;
//       transition: var(--transition-fast);
//     }
//     .table-row-hover:hover .action-buttons {
//       opacity: 1;
//     }

//     /* Empty State */
//     .empty-state {
//       text-align: center;
//       padding: var(--spacing-5xl) var(--spacing-2xl);
//     }

//     .empty-icon-wrapper {
//       width: 80px;
//       height: 80px;
//       margin: 0 auto var(--spacing-xl);
//       background: var(--bg-secondary);
//       border-radius: 50%;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       border: var(--ui-border-width-lg) dashed var(--border-secondary);
//     }

//     .empty-icon-wrapper i {
//       font-size: var(--font-size-4xl);
//       color: var(--text-tertiary);
//     }

//     .empty-state h3 {
//       font-family: var(--font-heading);
//       color: var(--text-primary);
//       font-size: var(--font-size-xl);
//       margin: 0 0 var(--spacing-sm) 0;
//     }

//     /* Dialog styling overrides */
//     :host ::ng-deep .custom-dialog .p-dialog-header {
//       background: var(--component-surface-raised);
//       border-bottom: 1px solid var(--border-tertiary);
//       padding: var(--spacing-xl);
//     }
//     :host ::ng-deep .custom-dialog .p-dialog-content {
//       background: var(--bg-primary);
//       padding: var(--spacing-xl);
//     }

//     .fade-in {
//       animation: fadeIn var(--transition-slow);
//     }
//     @keyframes fadeIn {
//       from { opacity: 0; transform: translateY(10px); }
//       to { opacity: 1; transform: translateY(0); }
//     }

//     /* Responsive */
//     @media (max-width: 992px) {
//       .toolbar, .filters-section {
//         flex-direction: column;
//         align-items: stretch;
//       }
//       .toolbar-right, .filter-group {
//         margin-top: var(--spacing-md);
//         justify-content: flex-start;
//       }
//       .search-wrapper {
//         max-width: 100%;
//       }
//     }
//   `]
// })
// export class UserListComponent implements OnInit {
//   // Services
//   private userService = inject(UserService);
//   private confirmationService = inject(ConfirmationService);
//   private messageService = inject(AppMessageService);
//   private destroyRef = inject(DestroyRef); // Replaces NgOnDestroy

//   // ViewChild
//   @ViewChild('dt') table: any;

//   // Signal State Management (Replaces standard properties)
//   users = signal<User[]>([]);
//   totalRecords = signal<number>(0);
//   loading = signal<boolean>(false);
//   firstRow = signal<number>(0);
//   rowsPerPage = signal<number>(10);

//   searchQuery = signal<string>('');
//   selectedRole = signal<string | null>(null);
//   selectedStatus = signal<boolean | null>(null);

//   showFormDialog = signal<boolean>(false);
//   showDetailDialog = signal<boolean>(false);
//   selectedUserId = signal<string | null>(null);
//   dialogTitle = signal<string>('Add New User');

//   // Subjects for Debouncing
//   private searchSubject = new Subject<string>();

//   // Static Data
//   readonly roleOptions = [
//     { label: 'Admin', value: 'admin' },
//     { label: 'Instructor', value: 'instructor' },
//     { label: 'Student', value: 'student' }
//   ];

//   readonly statusOptions = [
//     { label: 'Active', value: true },
//     { label: 'Inactive', value: false }
//   ];

//   ngOnInit(): void {
//     // Setup debounced search utilizing modern takeUntilDestroyed
//     this.searchSubject.pipe(
//       debounceTime(400),
//       takeUntilDestroyed(this.destroyRef)
//     ).subscribe(query => {
//       this.searchQuery.set(query);
//       this.resetPaginationAndLoad();
//     });

//     this.loadUsers();
//   }

//   // --- Data Loading ---

//   onLazyLoad(event: TableLazyLoadEvent): void {
//     const page = event.first! / event.rows! + 1;
//     this.firstRow.set(event.first || 0);
//     this.rowsPerPage.set(event.rows || 10);

//     this.loadUsers(page, this.rowsPerPage());
//   }

//   private resetPaginationAndLoad(): void {
//     this.firstRow.set(0);
//     if (this.table) {
//       this.table.first = 0; // Reset PrimeNG table internally
//     }
//     this.loadUsers(1, this.rowsPerPage());
//   }

//   loadUsers(page: number = 1, limit: number = this.rowsPerPage()): void {
//     this.loading.set(true);

//     const params: any = { page, limit };

//     if (this.searchQuery()) params.search = this.searchQuery();
//     if (this.selectedRole()) params.role = this.selectedRole();
//     if (this.selectedStatus() !== null) params.isActive = this.selectedStatus();

//     this.userService.getAllUsers(params)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           this.users.set(res.data || []);
//           this.totalRecords.set(res.pagination?.totalResults || 0);
//           this.loading.set(false);
//         },
//         error: (error: any) => {
//           console.error('Failed to load users', error);
//           this.showToast('error', 'Error', 'Failed to retrieve users. Please try again.');
//           this.loading.set(false);
//         }
//       });
//   }

//   // --- Filter Event Handlers ---

//   onSearchChange(query: string): void {
//     this.searchSubject.next(query);
//   }

//   onRoleChange(role: string | null): void {
//     this.selectedRole.set(role);
//     this.resetPaginationAndLoad();
//   }

//   onStatusChange(status: boolean | null): void {
//     this.selectedStatus.set(status);
//     this.resetPaginationAndLoad();
//   }

//   clearFilters(): void {
//     this.searchQuery.set('');
//     this.selectedRole.set(null);
//     this.selectedStatus.set(null);
//     this.resetPaginationAndLoad();
//   }

//   // --- UI Helpers ---

//   getInitials(firstName: string, lastName: string): string {
//     return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
//   }

//   getAvatarColor(name: string): string {
//     // Beautiful canonical-friendly hex colors
//     const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#F7DC6F', '#DDA0DD', '#98D8C8'];
//     const index = name?.charCodeAt(0) || 0;
//     return colors[index % colors.length];
//   }

//   private showToast(severity: string, summary: string, detail: string): void {
//     this.messageService.add({ severity, summary, detail, life: 3000 });
//   }

//   // --- Dialog & Actions ---

//   openNewUserDialog(): void {
//     this.selectedUserId.set(null);
//     this.dialogTitle.set('Add New User');
//     this.showFormDialog.set(true);
//   }

//   viewUser(user: User): void {
//     this.selectedUserId.set(user._id);
//     this.showDetailDialog.set(true);
//   }

//   editUser(user: User): void {
//     this.selectedUserId.set(user._id);
//     this.dialogTitle.set('Edit User Profile');
//     this.showFormDialog.set(true);
//   }

//   deleteUser(user: User): void {
//     this.confirmationService.confirm({
//       message: `Are you sure you want to delete <b class="text-primary">${user.firstName} ${user.lastName}</b>? This action cannot be undone.`,
//       header: 'Confirm Deletion',
//       icon: 'pi pi-exclamation-triangle text-error',
//       acceptButtonStyleClass: 'p-button-danger',
//       rejectButtonStyleClass: 'p-button-text p-button-secondary',
//       accept: () => {
//         this.userService.deleteUser(user._id)
//           .pipe(takeUntilDestroyed(this.destroyRef))
//           .subscribe({
//             next: () => {
//               this.showToast('success', 'Deleted', 'User removed successfully.');
//               this.loadUsers(Math.floor(this.firstRow() / this.rowsPerPage()) + 1, this.rowsPerPage());
//             },
//             error: (error: any) => {
//               console.error('Failed to delete user', error);
//               this.showToast('error', 'Error', 'Failed to delete user.');
//             }
//           });
//       }
//     });
//   }

//   onUserSaved(): void {
//     const isNew = !this.selectedUserId();
//     this.showToast('success', 'Success', `User ${isNew ? 'created' : 'updated'} successfully.`);
//     this.closeDialog();
//     this.loadUsers(Math.floor(this.firstRow() / this.rowsPerPage()) + 1, this.rowsPerPage());
//   }

//   closeDialog(): void {
//     this.showFormDialog.set(false);
//     this.selectedUserId.set(null);
//   }

//   editFromDetail(): void {
//     this.closeDetailDialog();
//     // Tiny delay to prevent dialog animation overlap
//     setTimeout(() => {
//       this.dialogTitle.set('Edit User Profile');
//       this.showFormDialog.set(true);
//     }, 150);
//   }

//   closeDetailDialog(): void {
//     this.showDetailDialog.set(false);
//     this.selectedUserId.set(null);
//   }
// }