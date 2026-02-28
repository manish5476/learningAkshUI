import { Component, OnInit, ChangeDetectionStrategy, inject, signal, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { input, output } from '@angular/core';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';

// Core
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    PasswordModule,
    DividerModule
  ],
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="user-form">
      
      @if (isLoading()) {
        <div class="form-loading-overlay">
          <i class="pi pi-spin pi-spinner text-primary" style="font-size: 2rem"></i>
        </div>
      }

      <div class="form-scroll-container" [class.opacity-50]="isLoading()">
        
        <h3 class="section-title"><i class="pi pi-user mr-2"></i> Personal Information</h3>
        <div class="form-grid">
          <div class="form-group">
            <label class="input-label">First Name <span class="required">*</span></label>
            <input pInputText formControlName="firstName" placeholder="Enter first name" class="w-full"
                   [class.ng-invalid]="isFieldInvalid('firstName')" [class.ng-dirty]="isFieldInvalid('firstName')">
            @if (isFieldInvalid('firstName')) { <small class="error-message">First name is required</small> }
          </div>

          <div class="form-group">
            <label class="input-label">Last Name <span class="required">*</span></label>
            <input pInputText formControlName="lastName" placeholder="Enter last name" class="w-full"
                   [class.ng-invalid]="isFieldInvalid('lastName')" [class.ng-dirty]="isFieldInvalid('lastName')">
            @if (isFieldInvalid('lastName')) { <small class="error-message">Last name is required</small> }
          </div>

          <div class="form-group">
            <label class="input-label">Phone Number</label>
            <input pInputText formControlName="phoneNumber" placeholder="+1 (555) 000-0000" class="w-full">
          </div>

          <div class="form-group">
            <label class="input-label">Gender</label>
            <p-select formControlName="gender" [options]="genderOptions" optionLabel="label" optionValue="value"
                      placeholder="Select gender" styleClass="w-full" [showClear]="true">
            </p-select>
          </div>

          <div class="form-group full-width">
            <label class="input-label">Date of Birth</label>
            <input pInputText type="date" formControlName="dateOfBirth" class="w-full">
          </div>
        </div>

        <p-divider></p-divider>

        <h3 class="section-title"><i class="pi pi-lock mr-2"></i> Account & Security</h3>
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="input-label">Email <span class="required">*</span></label>
            <input pInputText type="email" formControlName="email" placeholder="user@example.com" class="w-full"
                   [class.ng-invalid]="isFieldInvalid('email')" [class.ng-dirty]="isFieldInvalid('email')">
            @if (isFieldInvalid('email')) { <small class="error-message">A valid email is required</small> }
          </div>

          @if (!userId()) {
            <div class="form-group full-width fade-in">
              <label class="input-label">Password <span class="required">*</span></label>
              <p-password formControlName="password" [toggleMask]="true" [feedback]="true" placeholder="Create a strong password"
                          styleClass="w-full" inputStyleClass="w-full"
                          [class.ng-invalid]="isFieldInvalid('password')" [class.ng-dirty]="isFieldInvalid('password')">
              </p-password>
              @if (isFieldInvalid('password')) { <small class="error-message">Password must be at least 6 characters</small> }
            </div>
          }

          <div class="form-group">
            <label class="input-label">System Role <span class="required">*</span></label>
            <p-select formControlName="role" [options]="roleOptions" optionLabel="label" optionValue="value"
                      placeholder="Assign a role" styleClass="w-full"
                      [class.ng-invalid]="isFieldInvalid('role')" [class.ng-dirty]="isFieldInvalid('role')">
            </p-select>
          </div>

          <div class="form-group toggle-group flex-col justify-center">
            <label class="input-label">Account Status</label>
            <div class="flex gap-4 mt-2">
              <div class="flex align-items-center gap-2 custom-checkbox">
                <p-checkbox formControlName="isActive" [binary]="true" inputId="isActive"></p-checkbox>
                <label for="isActive" class="text-sm font-medium cursor-pointer" [class.text-success]="userForm.get('isActive')?.value">Active Account</label>
              </div>
              <div class="flex align-items-center gap-2 custom-checkbox">
                <p-checkbox formControlName="isEmailVerified" [binary]="true" inputId="isEmailVerified"></p-checkbox>
                <label for="isEmailVerified" class="text-sm font-medium cursor-pointer" [class.text-info]="userForm.get('isEmailVerified')?.value">Email Verified</label>
              </div>
            </div>
          </div>
        </div>

        <p-divider></p-divider>

        <h3 class="section-title"><i class="pi pi-map-marker mr-2"></i> Address Details</h3>
        <div class="form-grid" formGroupName="address">
          <div class="form-group full-width">
            <label class="input-label">Street Address</label>
            <input pInputText formControlName="street" placeholder="123 Main St, Apt 4B" class="w-full">
          </div>
          <div class="form-group">
            <label class="input-label">City</label>
            <input pInputText formControlName="city" placeholder="City" class="w-full">
          </div>
          <div class="form-group">
            <label class="input-label">State / Province</label>
            <input pInputText formControlName="state" placeholder="State" class="w-full">
          </div>
          <div class="form-group">
            <label class="input-label">Country</label>
            <input pInputText formControlName="country" placeholder="Country" class="w-full">
          </div>
          <div class="form-group">
            <label class="input-label">Zip / Postal Code</label>
            <input pInputText formControlName="zipCode" placeholder="Postal Code" class="w-full">
          </div>
        </div>

      </div>

      <div class="form-actions glass-panel-footer">
        <button pButton pRipple type="button" label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary" (click)="onCancel()"></button>
        <button pButton pRipple type="submit" [label]="userId() ? 'Update Profile' : 'Create User'" icon="pi pi-check" 
                class="p-button-primary shadow-btn" [loading]="isLoading()"></button>
      </div>
    </form>
  `,
  styles: [`
    .user-form {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 80vh; /* Prevents dialog from overflowing viewport */
    }

    .form-loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(var(--bg-primary-rgb, 255, 255, 255), 0.7);
      backdrop-filter: blur(4px);
      z-index: var(--z-modal);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--ui-border-radius-lg);
    }

    .form-scroll-container {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-xl) var(--spacing-2xl);
      transition: var(--transition-base);
      
      /* Custom Scrollbar */
      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: var(--scroll-thumb);
        border-radius: 10px;
      }
    }

    .section-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: var(--spacing-xl) 0 var(--spacing-lg) 0;
      display: flex;
      align-items: center;
      
      i { color: var(--color-primary); }
      &:first-child { margin-top: 0; }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-xl) var(--spacing-lg);
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .input-label {
      font-family: var(--font-heading);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xs);
    }

    .required {
      color: var(--color-error);
      font-weight: var(--font-weight-bold);
    }

    .error-message {
      position: absolute;
      bottom: -18px;
      left: 0;
      color: var(--color-error);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      animation: slideDown var(--transition-fast);
    }

    /* Checkbox styling */
    .custom-checkbox label {
      transition: var(--transition-colors);
      color: var(--text-secondary);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      padding: var(--spacing-lg) var(--spacing-2xl);
      background: var(--component-surface-raised);
      border-top: var(--ui-border-width) solid var(--border-secondary);
      border-radius: 0 0 var(--ui-border-radius-lg) var(--ui-border-radius-lg);
      margin-top: auto;
    }

    .shadow-btn { box-shadow: var(--shadow-md); }
    .text-success { color: var(--color-success) !important; }
    .text-info { color: var(--color-info) !important; }

    /* PrimeNG Overrides */
    :host ::ng-deep {
      .p-password, .p-password-input { width: 100%; }
      .p-inputtext, .p-select {
        background: var(--bg-primary);
        border-color: var(--border-secondary);
        transition: var(--transition-colors);
        
        &:enabled:hover, &:enabled:focus {
          border-color: var(--accent-primary);
        }
      }
      .p-divider {
        margin: var(--spacing-2xl) 0;
        .p-divider-solid.p-divider-horizontal:before {
          border-top-color: var(--border-tertiary);
        }
      }
    }

    .fade-in { animation: fadeIn var(--transition-base); }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .form-scroll-container { padding: var(--spacing-lg); }
      .form-actions { padding: var(--spacing-md) var(--spacing-lg); }
    }
  `]
})
export class UserFormComponent implements OnInit {
  // Signal Inputs/Outputs (Angular 21+)
  userId = input<string | null>(null);
  saved = output<any>();
  cancelled = output<void>();

  // Services
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);

  // State
  userForm!: FormGroup;
  isLoading = signal<boolean>(false);

  // Constants mapping to Mongoose Enum
  readonly roleOptions = [
    { label: 'Student', value: 'student' },
    { label: 'Instructor', value: 'instructor' },
    { label: 'Admin', value: 'admin' }
  ];

  readonly genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
    { label: 'Prefer not to say', value: 'prefer-not-to-say' }
  ];

  constructor() {
    // Angular 18/21 Effect to reactively load user when input changes
    effect(() => {
      const id = this.userId();
      if (id) {
        this.loadUser(id);
      } else {
        // Reset form to defaults if switching back to "New User" mode
        if (this.userForm) {
          this.userForm.reset({
            role: 'student',
            isActive: true,
            isEmailVerified: false
          });
          this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
          this.userForm.get('password')?.updateValueAndValidity();
        }
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]], // Conditionally cleared below
      phoneNumber: [''],
      dateOfBirth: [''],
      gender: [null],
      
      // Embedded Address Schema
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        country: [''],
        zipCode: ['']
      }),

      role: ['student', [Validators.required]],
      isActive: [true],
      isEmailVerified: [false]
    });
  }

  private loadUser(id: string): void {
    this.isLoading.set(true);
    
    this.userService.getUserById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const user = res.data?.data || res.data || {};
          
          // Format date for native date input (YYYY-MM-DD)
          let formattedDob = '';
          if (user.dateOfBirth) {
            formattedDob = new Date(user.dateOfBirth).toISOString().split('T')[0];
          }

          this.userForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            gender: user.gender,
            dateOfBirth: formattedDob,
            role: user.role,
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified,
            address: {
              street: user.address?.street || '',
              city: user.address?.city || '',
              state: user.address?.state || '',
              country: user.address?.country || '',
              zipCode: user.address?.zipCode || ''
            }
          });

          // Remove password requirement for existing users
          const passwordControl = this.userForm.get('password');
          passwordControl?.clearValidators();
          passwordControl?.updateValueAndValidity();
          
          this.isLoading.set(false);
        },
        error: (error: any) => {
          console.error('Failed to load user', error);
          this.isLoading.set(false);
        }
      });
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

    this.isLoading.set(true);
    const formData = { ...this.userForm.value };

    // Clean up empty fields to prevent saving bad data
    if (!formData.password) {
      delete formData.password;
    }
    if (!formData.dateOfBirth) {
      delete formData.dateOfBirth;
    }

    const currentUserId = this.userId();
    
    // Choose creation vs update based on the presence of an ID
    const request$ = currentUserId
      ? this.userService.updateUser(currentUserId, formData)
      : this.userService.createUser(formData); // Assuming createUser exists in your service

    request$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.isLoading.set(false);
          this.saved.emit(res.data);
        },
        error: (error: any) => {
          console.error('Failed to save user', error);
          this.isLoading.set(false);
        }
      });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}