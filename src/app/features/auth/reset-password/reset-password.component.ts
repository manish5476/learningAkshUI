import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="reset-password">
      <div class="icon">
        <i class="fas fa-key"></i>
      </div>
      
      <h2>Reset Password</h2>
      <p class="description">
        Enter your new password below.
      </p>

      <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" *ngIf="!passwordReset">
        <div class="form-group">
          <label for="password">New Password</label>
          <div class="input-wrapper">
            <i class="fas fa-lock"></i>
            <input 
              [type]="showPassword ? 'text' : 'password'" 
              id="password" 
              formControlName="password" 
              placeholder="Enter new password"
              [class.error]="isFieldInvalid('password')">
            <button 
              type="button" 
              class="password-toggle" 
              (click)="showPassword = !showPassword">
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
          <label for="confirmPassword">Confirm New Password</label>
          <div class="input-wrapper">
            <i class="fas fa-lock"></i>
            <input 
              [type]="showConfirmPassword ? 'text' : 'password'" 
              id="confirmPassword" 
              formControlName="confirmPassword" 
              placeholder="Confirm new password"
              [class.error]="isFieldInvalid('confirmPassword')">
            <button 
              type="button" 
              class="password-toggle" 
              (click)="showConfirmPassword = !showConfirmPassword">
              <i [class]="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <div class="error-message" *ngIf="resetForm.hasError('mismatch') && resetForm.get('confirmPassword')?.touched">
            Passwords do not match
          </div>
        </div>

        <button 
          type="submit" 
          class="btn-primary" 
          [disabled]="resetForm.invalid || isLoading">
          <span *ngIf="!isLoading">Reset Password</span>
          <span *ngIf="isLoading" class="spinner"></span>
        </button>
      </form>

      <div class="success-message" *ngIf="passwordReset">
        <i class="fas fa-check-circle"></i>
        <h3>Password Reset Successful!</h3>
        <p>Your password has been successfully reset.</p>
        <button class="btn-primary" (click)="goToLogin()">Go to Login</button>
      </div>

      <div class="alert alert-error" *ngIf="errorMessage">
        <i class="fas fa-exclamation-circle"></i>
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .reset-password {
      text-align: center;

      .icon {
        width: 80px;
        height: 80px;
        margin: 0 auto var(--spacing-xl);
        background: var(--accent-focus);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 36px;
          color: var(--accent-primary);
        }
      }

      h2 {
        color: var(--text-primary);
        margin-bottom: var(--spacing-sm);
      }

      .description {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        margin-bottom: var(--spacing-xl);
      }

      .form-group {
        margin-bottom: var(--spacing-lg);
        text-align: left;

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
          }

          input {
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
        margin: var(--spacing-lg) 0;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: var(--shadow-lg);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      }

      .success-message {
        padding: var(--spacing-xl) 0;

        i {
          font-size: 48px;
          color: var(--color-success);
          margin-bottom: var(--spacing-lg);
        }

        h3 {
          color: var(--text-primary);
          margin-bottom: var(--spacing-md);
        }

        p {
          color: var(--text-secondary);
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-xl);
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
        text-align: left;

        i {
          font-size: var(--font-size-lg);
        }

        &.alert-error {
          background: var(--color-error-bg);
          color: var(--color-error-dark);
          border: 1px solid var(--color-error-border);
        }
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  resetForm!: FormGroup;
  token = '';
  isLoading = false;
  passwordReset = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength: { score: number; text: string } | null = null;

  ngOnInit(): void {
    this.token = this.route.snapshot.params['token'];
    this.initForm();
    this.setupPasswordStrength();
  }

  private initForm(): void {
    this.resetForm = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
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
    this.resetForm.get('password')?.valueChanges.subscribe(password => {
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
    
    score = Math.min(score, 100);
    
    let text = 'Weak';
    if (score >= 75) text = 'Strong';
    else if (score >= 50) text = 'Medium';
    
    return { score, text };
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  onSubmit(): void {
    if (this.resetForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const resetData = {
      password: this.resetForm.value.password,
      passwordConfirm: this.resetForm.value.confirmPassword
    };

    this.authService.resetPassword(this.token, resetData).subscribe({
      next: () => {
        this.isLoading = false;
        this.passwordReset = true;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Failed to reset password. Please try again.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}