import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="forgot-password">
      <div class="icon">
        <i class="fas fa-lock"></i>
      </div>
      
      <h2>Forgot Password?</h2>
      <p class="description">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" *ngIf="!emailSent">
        <div class="form-group">
          <label for="email">Email Address</label>
          <div class="input-wrapper">
            <i class="fas fa-envelope"></i>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              placeholder="Enter your email"
              [class.error]="isFieldInvalid('email')">
          </div>
          <div class="error-message" *ngIf="isFieldInvalid('email')">
            Please enter a valid email address
          </div>
        </div>

        <button 
          type="submit" 
          class="btn-primary" 
          [disabled]="forgotForm.invalid || isLoading">
          <span *ngIf="!isLoading">Send Reset Link</span>
          <span *ngIf="isLoading" class="spinner"></span>
        </button>
      </form>

      <div class="success-message" *ngIf="emailSent">
        <i class="fas fa-check-circle"></i>
        <h3>Check Your Email</h3>
        <p>We've sent a password reset link to <strong>{{ email }}</strong></p>
        <p class="note">Didn't receive the email? Check your spam folder or <a href="#" (click)="resendEmail($event)">click here to resend</a></p>
      </div>

      <div class="alert alert-error" *ngIf="errorMessage">
        <i class="fas fa-exclamation-circle"></i>
        {{ errorMessage }}
      </div>

      <div class="back-to-login">
        <a routerLink="/auth/login">
          <i class="fas fa-arrow-left"></i>
          Back to Login
        </a>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password {
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
        line-height: var(--line-height-relaxed);
      }

      .form-group {
        margin-bottom: var(--spacing-xl);
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
        }

        .error-message {
          color: var(--color-error);
          font-size: var(--font-size-xs);
          margin-top: var(--spacing-xs);
          text-align: left;
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
        margin-bottom: var(--spacing-lg);

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
          margin-bottom: var(--spacing-sm);

          strong {
            color: var(--text-primary);
          }

          &.note {
            font-size: var(--font-size-xs);
            color: var(--text-tertiary);

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

      .alert {
        padding: var(--spacing-md);
        border-radius: var(--ui-border-radius);
        margin: var(--spacing-lg) 0;
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

      .back-to-login {
        margin-top: var(--spacing-xl);

        a {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: var(--font-size-sm);
          transition: var(--transition-colors);

          i {
            margin-right: var(--spacing-xs);
          }

          &:hover {
            color: var(--accent-primary);
          }
        }
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  forgotForm: FormGroup;
  isLoading = false;
  emailSent = false;
  errorMessage = '';
  email = '';

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.email = this.forgotForm.value.email;

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.emailSent = true;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Failed to send reset email. Please try again.';
      }
    });
  }

  resendEmail(event: Event): void {
    event.preventDefault();
    this.onSubmit();
  }
}