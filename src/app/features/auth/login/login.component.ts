import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
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

      <div class="form-group">
        <label for="password">Password</label>
        <div class="input-wrapper">
          <i class="fas fa-lock"></i>
          <input 
            [type]="showPassword ? 'text' : 'password'" 
            id="password" 
            formControlName="password" 
            placeholder="Enter your password"
            [class.error]="isFieldInvalid('password')">
          <button 
            type="button" 
            class="password-toggle" 
            (click)="togglePassword()">
            <i [class]="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          </button>
        </div>
        <div class="error-message" *ngIf="isFieldInvalid('password')">
          Password is required
        </div>
      </div>

      <div class="form-options">
        <label class="checkbox">
          <input type="checkbox" formControlName="rememberMe">
          <span>Remember me</span>
        </label>
        <a routerLink="/auth/forgot-password" class="forgot-link">Forgot Password?</a>
      </div>

      <button 
        type="submit" 
        class="btn-primary" 
        [disabled]="loginForm.invalid || isLoading">
        <span *ngIf="!isLoading">Login</span>
        <span *ngIf="isLoading" class="spinner"></span>
      </button>

      <div class="alert alert-error" *ngIf="errorMessage">
        <i class="fas fa-exclamation-circle"></i>
        {{ errorMessage }}
      </div>

      <div class="alert alert-success" *ngIf="sessionExpired">
        <i class="fas fa-info-circle"></i>
        Your session has expired. Please login again.
      </div>

      <div class="signup-prompt">
        Don't have an account? 
        <a routerLink="/auth/signup">Sign up</a>
      </div>
    </form>
  `,
  styles: [`
    .login-form {
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

            &::placeholder {
              color: var(--text-tertiary);
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
            transition: var(--transition-colors);

            &:hover {
              color: var(--accent-primary);
            }
          }
        }

        .error-message {
          color: var(--color-error);
          font-size: var(--font-size-xs);
          margin-top: var(--spacing-xs);
        }
      }

      .form-options {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-xl);

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
        }

        .forgot-link {
          color: var(--accent-primary);
          font-size: var(--font-size-sm);
          text-decoration: none;
          transition: var(--transition-colors);

          &:hover {
            color: var(--accent-hover);
            text-decoration: underline;
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

        &.alert-success {
          background: var(--color-success-bg);
          color: var(--color-success-dark);
          border: 1px solid var(--color-success-border);
        }
      }

      .signup-prompt {
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
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  errorMessage = '';
  sessionExpired = false;
  
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.initForm();
    this.checkQueryParams();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  private checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      this.sessionExpired = params['sessionExpired'] === 'true';
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.subscriptions.push(
      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (this.loginForm.value.rememberMe) {
            // Handle remember me - extend token expiry
          }
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Login failed. Please check your credentials.';
        }
      })
    );
  }
}