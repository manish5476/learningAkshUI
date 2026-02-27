// user-form.component.ts
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    PasswordModule
  ],
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="user-form">
      <div class="form-grid">
        <!-- First Name -->
        <div class="form-group">
          <label class="input-label">First Name <span class="required">*</span></label>
          <input 
            pInputText 
            formControlName="firstName"
            placeholder="Enter first name"
            class="w-full"
            [class.ng-invalid]="isFieldInvalid('firstName')"
            [class.ng-dirty]="isFieldInvalid('firstName')">
          @if (isFieldInvalid('firstName')) {
            <small class="error-message">First name is required</small>
          }
        </div>

        <!-- Last Name -->
        <div class="form-group">
          <label class="input-label">Last Name <span class="required">*</span></label>
          <input 
            pInputText 
            formControlName="lastName"
            placeholder="Enter last name"
            class="w-full"
            [class.ng-invalid]="isFieldInvalid('lastName')"
            [class.ng-dirty]="isFieldInvalid('lastName')">
          @if (isFieldInvalid('lastName')) {
            <small class="error-message">Last name is required</small>
          }
        </div>

        <!-- Email -->
        <div class="form-group full-width">
          <label class="input-label">Email <span class="required">*</span></label>
          <input 
            pInputText 
            type="email"
            formControlName="email"
            placeholder="Enter email address"
            class="w-full"
            [class.ng-invalid]="isFieldInvalid('email')"
            [class.ng-dirty]="isFieldInvalid('email')">
          @if (isFieldInvalid('email')) {
            <small class="error-message">Valid email is required</small>
          }
        </div>

        <!-- Password (only for new users) -->
        @if (!userId) {
          <div class="form-group full-width">
            <label class="input-label">Password <span class="required">*</span></label>
            <p-password 
              formControlName="password"
              [toggleMask]="true"
              [feedback]="true"
              placeholder="Enter password"
              styleClass="w-full"
              inputStyleClass="w-full"
              [class.ng-invalid]="isFieldInvalid('password')"
              [class.ng-dirty]="isFieldInvalid('password')">
            </p-password>
            @if (isFieldInvalid('password')) {
              <small class="error-message">Password must be at least 6 characters</small>
            }
          </div>
        }

        <!-- Role -->
        <div class="form-group">
          <label class="input-label">Role <span class="required">*</span></label>
          <p-select 
            formControlName="role"
            [options]="roleOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a role"
            styleClass="w-full"
            [class.ng-invalid]="isFieldInvalid('role')"
            [class.ng-dirty]="isFieldInvalid('role')">
          </p-select>
        </div>

        <!-- Status -->
        <div class="form-group">
          <label class="input-label">Status</label>
          <div class="flex align-items-center gap-2">
            <p-checkbox 
              formControlName="isActive"
              [binary]="true"
              inputId="isActive">
            </p-checkbox>
            <label for="isActive" class="ml-2">Active</label>
          </div>
        </div>

        <!-- Email Verified -->
        <div class="form-group">
          <label class="input-label">Email Verification</label>
          <div class="flex align-items-center gap-2">
            <p-checkbox 
              formControlName="isEmailVerified"
              [binary]="true"
              inputId="isEmailVerified">
            </p-checkbox>
            <label for="isEmailVerified" class="ml-2">Email Verified</label>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button pButton pRipple type="button" label="Cancel" icon="pi pi-times" class="p-button-outlined" (click)="onCancel()"></button>
        <button pButton pRipple type="submit" label="{{ userId ? 'Update' : 'Create' }}" icon="pi pi-check" [disabled]="userForm.invalid || isLoading"></button>
      </div>
    </form>
  `,
  styles: [`
    .user-form {
      padding: var(--spacing-lg);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-group {
      margin-bottom: var(--spacing-md);
    }

    .input-label {
      display: block;
      font-weight: var(--font-weight-medium);
      margin-bottom: var(--spacing-xs);
      color: var(--text-primary);
    }

    .required {
      color: var(--color-error);
    }

    .error-message {
      color: var(--color-error);
      font-size: var(--font-size-xs);
      margin-top: var(--spacing-xs);
      display: block;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--border-secondary);
    }

    :host ::ng-deep {
      .p-password {
        width: 100%;
      }
      
      .p-password-input {
        width: 100%;
      }
    }
  `]
})
export class UserFormComponent implements OnInit, OnDestroy {
  @Input() userId?: any;
  @Output() saved = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  userForm!: FormGroup;
  isLoading = false;
  roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Instructor', value: 'instructor' },
    { label: 'Student', value: 'student' }
  ];

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.initForm();
    if (this.userId) {
      this.loadUser();
    }
  }
  ngOnChanges() {
    if (this.userId) {
      this.loadUser();
    }
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', this.userId ? [] : [Validators.required, Validators.minLength(6)]],
      role: ['student', Validators.required],
      isActive: [true],
      isEmailVerified: [false]
    });
  }

  private loadUser(): void {
    if (!this.userId) return;

    this.isLoading = true;
    const sub = this.userService.getUserById(this.userId).subscribe({
      next: (res) => {
        const user = res.data ? res.data.data : []
        if (user) {
          this.userForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified
          });
          this.userForm.get('password')?.clearValidators();
          this.userForm.get('password')?.updateValueAndValidity();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load user', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formData = this.userForm.value;

    // Remove password from update if empty
    if (this.userId && !formData.password) {
      delete formData.password;
    }

    const request = this.userId
      ? this.userService.updateUser(this.userId, formData)
      : this.userService.updateUser(this.userId, formData)
    //   : this.userService.(formData);

    const sub = (request as any).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.saved.emit(res.data);
      },
      error: (error: any) => {
        console.error('Failed to save user', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}