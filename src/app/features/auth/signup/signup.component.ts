import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="signup-form">
      <!-- Role Selection -->
      <div class="role-selector">
        <button 
          type="button"
          class="role-btn"
          [class.active]="signupForm.get('role')?.value === 'student'"
          (click)="setRole('student')">
          <i class="fas fa-user-graduate"></i>
          <span>Student</span>
        </button>
        <button 
          type="button"
          class="role-btn"
          [class.active]="signupForm.get('role')?.value === 'instructor'"
          (click)="setRole('instructor')">
          <i class="fas fa-chalkboard-teacher"></i>
          <span>Instructor</span>
        </button>
      </div>

      <!-- Name Fields -->
      <div class="form-row">
        <div class="form-group">
          <label for="firstName">First Name</label>
          <div class="input-wrapper">
            <i class="fas fa-user"></i>
            <input 
              type="text" 
              id="firstName" 
              formControlName="firstName" 
              placeholder="John"
              [class.error]="isFieldInvalid('firstName')">
          </div>
          <div class="error-message" *ngIf="isFieldInvalid('firstName')">
            First name is required
          </div>
        </div>

        <div class="form-group">
          <label for="lastName">Last Name</label>
          <div class="input-wrapper">
            <i class="fas fa-user"></i>
            <input 
              type="text" 
              id="lastName" 
              formControlName="lastName" 
              placeholder="Doe"
              [class.error]="isFieldInvalid('lastName')">
          </div>
          <div class="error-message" *ngIf="isFieldInvalid('lastName')">
            Last name is required
          </div>
        </div>
      </div>

      <!-- Email -->
      <div class="form-group">
        <label for="email">Email Address</label>
        <div class="input-wrapper">
          <i class="fas fa-envelope"></i>
          <input 
            type="email" 
            id="email" 
            formControlName="email" 
            placeholder="john.doe@example.com"
            [class.error]="isFieldInvalid('email')">
        </div>
        <div class="error-message" *ngIf="isFieldInvalid('email')">
          Please enter a valid email address
        </div>
      </div>

      <!-- Phone (Optional) -->
      <div class="form-group">
        <label for="phoneNumber">Phone Number (Optional)</label>
        <div class="input-wrapper">
          <i class="fas fa-phone"></i>
          <input 
            type="tel" 
            id="phoneNumber" 
            formControlName="phoneNumber" 
            placeholder="+1234567890">
        </div>
      </div>

      <!-- Password Fields -->
      <div class="form-group">
        <label for="password">Password</label>
        <div class="input-wrapper">
          <i class="fas fa-lock"></i>
          <input 
            [type]="showPassword ? 'text' : 'password'" 
            id="password" 
            formControlName="password" 
            placeholder="Create a password"
            [class.error]="isFieldInvalid('password')">
          <button 
            type="button" 
            class="password-toggle" 
            (click)="togglePassword('password')">
            <i [class]="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          </button>
        </div>
        <div class="password-strength" *ngIf="passwordStrength">
          <div class="strength-bar" [style.width.%]="passwordStrength.score"></div>
          <span class="strength-text">{{ passwordStrength.text }}</span>
        </div>
        <div class="error-message" *ngIf="isFieldInvalid('password')">
          Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number
        </div>
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <div class="input-wrapper">
          <i class="fas fa-lock"></i>
          <input 
            [type]="showConfirmPassword ? 'text' : 'password'" 
            id="confirmPassword" 
            formControlName="confirmPassword" 
            placeholder="Confirm your password"
            [class.error]="isFieldInvalid('confirmPassword')">
          <button 
            type="button" 
            class="password-toggle" 
            (click)="togglePassword('confirm')">
            <i [class]="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          </button>
        </div>
        <div class="error-message" *ngIf="signupForm.hasError('mismatch') && signupForm.get('confirmPassword')?.touched">
          Passwords do not match
        </div>
      </div>

      <!-- Instructor-specific fields -->
      <div *ngIf="signupForm.get('role')?.value === 'instructor'" class="instructor-fields">
        <div class="form-group">
          <label for="bio">Bio</label>
          <textarea 
            id="bio" 
            formControlName="bio" 
            rows="3" 
            placeholder="Tell us about yourself and your expertise"></textarea>
        </div>

        <div class="form-group">
          <label for="expertise">Areas of Expertise</label>
          <div class="expertise-selector">
            <button 
              *ngFor="let area of expertiseOptions"
              type="button"
              class="expertise-btn"
              [class.selected]="isExpertiseSelected(area)"
              (click)="toggleExpertise(area)">
              {{ area }}
            </button>
          </div>
        </div>
      </div>

      <!-- Student-specific fields -->
      <div *ngIf="signupForm.get('role')?.value === 'student'" class="student-fields">
        <div class="form-group">
          <label for="interests">Learning Interests</label>
          <div class="interests-selector">
            <button 
              *ngFor="let interest of interestOptions"
              type="button"
              class="interest-btn"
              [class.selected]="isInterestSelected(interest)"
              (click)="toggleInterest(interest)">
              {{ interest }}
            </button>
          </div>
        </div>
      </div>

      <!-- Terms & Conditions -->
      <div class="form-group terms">
        <label class="checkbox">
          <input type="checkbox" formControlName="terms">
          <span>I agree to the <a href="#" target="_blank">Terms of Service</a> and <a href="#" target="_blank">Privacy Policy</a></span>
        </label>
        <div class="error-message" *ngIf="isFieldInvalid('terms')">
          You must agree to the terms and conditions
        </div>
      </div>

      <!-- Submit Button -->
      <button 
        type="submit" 
        class="btn-primary" 
        [disabled]="signupForm.invalid || isLoading">
        <span *ngIf="!isLoading">Create Account</span>
        <span *ngIf="isLoading" class="spinner"></span>
      </button>

      <!-- Error Message -->
      <div class="alert alert-error" *ngIf="errorMessage">
        <i class="fas fa-exclamation-circle"></i>
        {{ errorMessage }}
      </div>

      <!-- Login Link -->
      <div class="login-prompt">
        Already have an account? 
        <a routerLink="/auth/login">Login</a>
      </div>
    </form>
  `,
  styles: [`
    .signup-form {
      .role-selector {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-xl);

        .role-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-lg);
          background: var(--bg-secondary);
          border: 2px solid var(--border-primary);
          border-radius: var(--ui-border-radius-lg);
          color: var(--text-primary);
          cursor: pointer;
          transition: var(--transition-base);

          i {
            font-size: var(--font-size-2xl);
            color: var(--text-secondary);
          }

          span {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
          }

          &:hover {
            border-color: var(--accent-primary);
            background: var(--component-bg-hover);
          }

          &.active {
            border-color: var(--accent-primary);
            background: var(--accent-focus);

            i {
              color: var(--accent-primary);
            }
          }
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md);
      }

      .form-group {
        margin-bottom: var(--spacing-lg);

        label {
          display: block;
          margin-bottom: var(--spacing-sm);
          color: var(--text-primary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }

        .input-wrapper {
          position: relative;

          i {
            position: absolute;
            left: var(--spacing-md);
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-tertiary);
            font-size: var(--font-size-sm);
            transition: var(--transition-colors);
            pointer-events: none;
          }

          input, textarea {
            width: 100%;
            padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) calc(var(--spacing-xl) + var(--spacing-md));
            background: var(--bg-secondary);
            border: 1px solid var(--border-primary);
            border-radius: var(--ui-border-radius);
            color: var(--text-primary);
            font-size: var(--font-size-sm);
            transition: var(--transition-base);

            &:focus {
              outline: none;
              border-color: var(--accent-primary);
              box-shadow: 0 0 0 3px var(--accent-focus);
            }

            &.error {
              border-color: var(--color-error);
            }

            &::placeholder {
              color: var(--text-tertiary);
            }
          }

          textarea {
            resize: vertical;
            min-height: 80px;
          }

          .password-toggle {
            position: absolute;
            right: var(--spacing-md);
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-tertiary);
            cursor: pointer;
            padding: var(--spacing-xs);
            transition: var(--transition-colors);

            &:hover {
              color: var(--accent-primary);
            }
          }
        }

        .password-strength {
          margin-top: var(--spacing-xs);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);

          .strength-bar {
            height: 4px;
            background: linear-gradient(90deg, var(--color-error) 0%, var(--color-warning) 50%, var(--color-success) 100%);
            border-radius: 2px;
            transition: width 0.3s ease;
          }

          .strength-text {
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
          }
        }

        .error-message {
          color: var(--color-error);
          font-size: var(--font-size-xs);
          margin-top: var(--spacing-xs);
        }

        &.terms {
          .checkbox {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            color: var(--text-secondary);
            font-size: var(--font-size-sm);
            cursor: pointer;

            input[type="checkbox"] {
              width: 16px;
              height: 16px;
              cursor: pointer;
              accent-color: var(--accent-primary);
            }

            a {
              color: var(--accent-primary);
              text-decoration: none;

              &:hover {
                text-decoration: underline;
              }
            }
          }
        }
      }

      .expertise-selector, .interests-selector {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-sm);

        .expertise-btn, .interest-btn {
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--ui-border-radius);
          color: var(--text-secondary);
          font-size: var(--font-size-xs);
          cursor: pointer;
          transition: var(--transition-base);

          &:hover {
            border-color: var(--accent-primary);
            color: var(--accent-primary);
          }

          &.selected {
            background: var(--accent-primary);
            border-color: var(--accent-primary);
            color: white;
          }
        }
      }

      .btn-primary {
        width: 100%;
        padding: var(--spacing-md);
        background: var(--accent-gradient);
        border: none;
        border-radius: var(--ui-border-radius);
        color: white;
        font-size: var(--font-size-md);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: var(--transition-base);
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: var(--shadow-lg);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      }

      .alert {
        padding: var(--spacing-md);
        border-radius: var(--ui-border-radius);
        margin-top: var(--spacing-lg);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-size: var(--font-size-sm);

        i {
          font-size: var(--font-size-lg);
        }

        &.alert-error {
          background: var(--color-error-bg);
          color: var(--color-error-dark);
          border: 1px solid var(--color-error-border);
        }
      }

      .login-prompt {
        text-align: center;
        margin-top: var(--spacing-xl);
        color: var(--text-secondary);
        font-size: var(--font-size-sm);

        a {
          color: var(--accent-primary);
          text-decoration: none;
          font-weight: var(--font-weight-medium);
          margin-left: var(--spacing-xs);

          &:hover {
            color: var(--accent-hover);
            text-decoration: underline;
          }
        }
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .signup-form {
        .form-row {
          grid-template-columns: 1fr;
          gap: 0;
        }
      }
    }
  `]
})
export class SignupComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  signupForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';

  expertiseOptions = [
    'Web Development', 'Data Science', 'Mobile Development', 'DevOps',
    'Cloud Computing', 'AI/ML', 'Cybersecurity', 'Database', 'Programming Languages'
  ];

  interestOptions = [
    'Web Development', 'Data Science', 'Mobile Development', 'DevOps',
    'Cloud Computing', 'AI/ML', 'Cybersecurity'
  ];

  selectedExpertise: string[] = [];
  selectedInterests: string[] = [];
  passwordStrength: { score: number; text: string } | null = null;

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.initForm();
    this.setupPasswordStrength();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initForm(): void {
    this.signupForm = this.fb.group({
      role: ['student'],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required],
      bio: [''],
      expertise: [[]],
      interests: [[]],
      terms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { mismatch: true };
    }
    return null;
  }

  private setupPasswordStrength(): void {
    this.signupForm.get('password')?.valueChanges.subscribe(password => {
      if (password) {
        this.passwordStrength = this.calculatePasswordStrength(password);
      } else {
        this.passwordStrength = null;
      }
    });
  }

  private calculatePasswordStrength(password: string): { score: number; text: string } {
    let score = 0;
    
    if (password.length >= 8) score += 25;
    if (/[a-z]/.test(password)) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/\d/.test(password)) score += 25;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 25;
    
    // Cap at 100
    score = Math.min(score, 100);
    
    let text = 'Weak';
    if (score >= 75) text = 'Strong';
    else if (score >= 50) text = 'Medium';
    
    return { score, text };
  }

  setRole(role: 'student' | 'instructor'): void {
    this.signupForm.patchValue({ role });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.signupForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  togglePassword(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  toggleExpertise(area: string): void {
    const index = this.selectedExpertise.indexOf(area);
    if (index === -1) {
      this.selectedExpertise.push(area);
    } else {
      this.selectedExpertise.splice(index, 1);
    }
    this.signupForm.patchValue({ expertise: this.selectedExpertise });
  }

  isExpertiseSelected(area: string): boolean {
    return this.selectedExpertise.includes(area);
  }

  toggleInterest(interest: string): void {
    const index = this.selectedInterests.indexOf(interest);
    if (index === -1) {
      this.selectedInterests.push(interest);
    } else {
      this.selectedInterests.splice(index, 1);
    }
    this.signupForm.patchValue({ interests: this.selectedInterests });
  }

  isInterestSelected(interest: string): boolean {
    return this.selectedInterests.includes(interest);
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      Object.keys(this.signupForm.controls).forEach(key => {
        this.signupForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const signupData = {
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
      firstName: this.signupForm.value.firstName,
      lastName: this.signupForm.value.lastName,
      role: this.signupForm.value.role,
      phoneNumber: this.signupForm.value.phoneNumber,
      ...(this.signupForm.value.role === 'instructor' && {
        expertise: this.selectedExpertise,
        bio: this.signupForm.value.bio
      }),
      ...(this.signupForm.value.role === 'student' && {
        interests: this.selectedInterests
      })
    };

    this.subscriptions.push(
      this.authService.signup(signupData).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Signup failed. Please try again.';
        }
      })
    );
  }
}