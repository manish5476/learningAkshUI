// user-list.component.ts
import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Select } from 'primeng/select';
import { User } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { UserFormComponent } from "./user-form.component";
import { UserDetailComponent } from "./user-detail.component";


@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    Select,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    ToolbarModule,
    DialogModule,
    UserFormComponent,
    UserDetailComponent
],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="user-list-container">
      <p-toast position="top-right"></p-toast>
      <p-confirmDialog></p-confirmDialog>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <h2 class="page-title">User Management</h2>
          <span class="total-count">{{ totalRecords }} total users</span>
        </div>
        <div class="toolbar-right">
          <button pButton pRipple label="Export" icon="pi pi-download" class="p-button-outlined mr-2"></button>
          <button pButton pRipple label="Add User" icon="pi pi-plus" class="p-button-success" (click)="openNewUserDialog()"></button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-item">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input pInputText 
                   [(ngModel)]="filters.search" 
                   (ngModelChange)="onSearchChange()"
                   placeholder="Search by name or email" 
                   class="search-input">
          </span>
        </div>
        <div class="filter-item">
          <p-select 
            [options]="roleOptions" 
            [(ngModel)]="filters.role" 
            (onChange)="loadUsers()"
            placeholder="Filter by Role"
            optionLabel="label"
            optionValue="value"
            [showClear]="true">
          </p-select>
        </div>
        <div class="filter-item">
          <p-select 
            [options]="statusOptions" 
            [(ngModel)]="filters.status" 
            (onChange)="loadUsers()"
            placeholder="Filter by Status"
            optionLabel="label"
            optionValue="value"
            [showClear]="true">
          </p-select>
        </div>
        <button pButton pRipple icon="pi pi-filter-slash" label="Clear" class="p-button-outlined" (click)="clearFilters()"></button>
      </div>

      <!-- Users Table -->
      <p-table 
        #dt
        [value]="users"
        [lazy]="true"
        (onLazyLoad)="loadUsers($event)"
        [paginator]="true"
        [rows]="rowsPerPage"
        [totalRecords]="totalRecords"
        [loading]="loading"
        [rowsPerPageOptions]="[10, 25, 50]"
        responsiveLayout="scroll"
        dataKey="_id"
        class="users-table"
        [globalFilterFields]="['firstName', 'lastName', 'email', 'role']">

        <ng-template pTemplate="header">
          <tr>
            <th style="width: 3rem">#</th>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Verified</th>
            <th>Joined</th>
            <th style="width: 10rem">Actions</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-user let-i="rowIndex">
          <tr>
            <td>{{ i + 1 + (firstRow) }}</td>
            <td>
              <div class="user-info">
                <div class="user-avatar">
                  @if (user.profilePicture) {
                    <img [src]="user.profilePicture" [alt]="user.firstName">
                  } @else {
                    <div class="avatar-placeholder" [ngStyle]="{'background-color': getAvatarColor(user.firstName)}">
                      {{ getInitials(user.firstName, user.lastName) }}
                    </div>
                  }
                </div>
                <div class="user-details">
                  <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
                  <span class="user-id">ID: {{ user._id | slice:0:8 }}...</span>
                </div>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <span class="role-badge" [class]="'role-' + user.role">
                {{ user.role | titlecase }}
              </span>
            </td>
            <td>
              <p-tag 
                [value]="user.isActive ? 'Active' : 'Inactive'" 
                [severity]="user.isActive ? 'success' : 'danger'">
              </p-tag>
            </td>
            <td>
              <p-tag 
                [value]="user.isEmailVerified ? 'Verified' : 'Unverified'" 
                [severity]="user.isEmailVerified ? 'info' : 'warn'">
              </p-tag>
            </td>
            <td>{{ user.createdAt | date:'mediumDate' }}</td>
            <td>
              <div class="action-buttons">
                <button pButton pRipple icon="pi pi-eye" class="p-button-rounded p-button-outlined p-button-info" 
                        (click)="viewUser(user)" pTooltip="View Details"></button>
                <button pButton pRipple icon="pi pi-pencil" class="p-button-rounded p-button-outlined p-button-success" 
                        (click)="editUser(user)" pTooltip="Edit User"></button>
                <button pButton pRipple icon="pi pi-trash" class="p-button-rounded p-button-outlined p-button-danger" 
                        (click)="deleteUser(user)" pTooltip="Delete User"></button>
              </div>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="8" class="text-center p-4">
              <div class="empty-state">
                <i class="pi pi-users" style="font-size: 3rem; color: var(--text-secondary)"></i>
                <h3>No users found</h3>
                <p>Try adjusting your filters or add a new user.</p>
                <button pButton pRipple label="Add User" icon="pi pi-plus" (click)="openNewUserDialog()"></button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- User Form Dialog -->
      <p-dialog appendTo="body" 
        [(visible)]="showFormDialog" 
        [style]="{width: '600px'}" 
        [header]="dialogTitle"
        [modal]="true"
        [draggable]="false"
        [resizable]="false">
        <app-user-form 
          [userId]="selectedUserId"
          (saved)="onUserSaved($event)"
          (cancelled)="closeDialog()">
        </app-user-form>
      </p-dialog>

      <!-- User Detail Dialog -->
      <p-dialog appendTo="body" 
        [(visible)]="showDetailDialog" 
        [style]="{width: '800px'}" 
        header="User Details"
        [modal]="true"
        [draggable]="false"
        [resizable]="false">
        <app-user-detail 
          [userId]="selectedUserId"
          (edit)="editFromDetail()"
          (close)="closeDetailDialog()">
        </app-user-detail>
      </p-dialog>
    </div>
  `,
  styles: [`
    .user-list-container {
      padding: var(--spacing-xl);
      background: var(--bg-primary);
      min-height: 100vh;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
    }

    .total-count {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      background: var(--bg-secondary);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--ui-border-radius);
    }

    .filters-section {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
      flex-wrap: wrap;
    }

    .filter-item {
      min-width: 200px;
    }

    .search-input {
      width: 300px;
    }

    /* User Info */
    .user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
    }

    .user-avatar img {
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
      color: white;
      font-weight: var(--font-weight-medium);
      font-size: var(--font-size-sm);
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
    }

    .user-id {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }

    /* Role Badge */
    .role-badge {
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--ui-border-radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
    }

    .role-admin {
      background: var(--accent-focus);
      color: var(--accent-primary);
    }

    .role-instructor {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    .role-student {
      background: var(--bg-secondary);
      color: var(--text-secondary);
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: var(--spacing-xs);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--spacing-3xl);
    }

    .empty-state h3 {
      color: var(--text-primary);
      margin: var(--spacing-md) 0 var(--spacing-xs);
    }

    .empty-state p {
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xl);
    }

    @media (max-width: 768px) {
      .user-list-container {
        padding: var(--spacing-md);
      }

      .toolbar {
        flex-direction: column;
        gap: var(--spacing-md);
        align-items: flex-start;
      }

      .filters-section {
        flex-direction: column;
      }

      .search-input {
        width: 100%;
      }
    }
  `]
})
export class UserListComponent implements OnInit, OnDestroy {
  @ViewChild('dt') table: any;

  private userService = inject(UserService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  users: any
  totalRecords = 0;
  rowsPerPage = 10;
  firstRow = 0;
  loading = false;
  
  showFormDialog = false;
  showDetailDialog = false;
  selectedUserId: string | null = null;
  dialogTitle = 'Add New User';

  filters = {
    search: '',
    role: null,
    status: null
  };

  roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Instructor', value: 'instructor' },
    { label: 'Student', value: 'student' }
  ];

  statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ];

  private subscriptions: Subscription[] = [];
  private searchTimeout: any;

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  loadUsers(event?: any): void {
    this.loading = true;
    
    const params: any = {
      page: event ? Math.floor(event.first / event.rows) + 1 : 1,
      limit: event ? event.rows : this.rowsPerPage
    };

    if (event) {
      this.firstRow = event.first;
    }

    if (this.filters.search) {
      params.search = this.filters.search;
    }
    if (this.filters.role) {
      params.role = this.filters.role;
    }
    if (this.filters.status !== null) {
      params.isActive = this.filters.status;
    }

    const sub = this.userService.getAllUsers(params).subscribe({
      next: (res) => {
        this.users = res.data?.data || [];
        this.totalRecords = res.pagination?.totalResults || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load users', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users'
        });
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onSearchChange(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadUsers();
    }, 500);
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      role: null,
      status: null
    };
    this.loadUsers();
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const index = name?.charCodeAt(0) || 0;
    return colors[index % colors.length];
  }

  // Dialog Actions
  openNewUserDialog(): void {
    this.selectedUserId = null;
    this.dialogTitle = 'Add New User';
    this.showFormDialog = true;
  }

  viewUser(user: User): void {
    this.selectedUserId = user._id;
    this.showDetailDialog = true;
  }

  editUser(user: User): void {
    this.selectedUserId = user._id;
    this.dialogTitle = 'Edit User';
    this.showFormDialog = true;
  }

  deleteUser(user: User): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const sub = this.userService.deleteUser(user._id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'User deleted successfully'
            });
            this.loadUsers();
          },
          error: (error) => {
            console.error('Failed to delete user', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete user'
            });
          }
        });
        this.subscriptions.push(sub);
      }
    });
  }

  onUserSaved(user: User): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `User ${this.selectedUserId ? 'updated' : 'created'} successfully`
    });
    this.closeDialog();
    this.loadUsers();
  }

  closeDialog(): void {
    this.showFormDialog = false;
    this.selectedUserId = null;
  }

  editFromDetail(): void {
    this.closeDetailDialog();
    setTimeout(() => {
      this.dialogTitle = 'Edit User';
      this.showFormDialog = true;
    });
  }

  closeDetailDialog(): void {
    this.showDetailDialog = false;
    this.selectedUserId = null;
  }
}