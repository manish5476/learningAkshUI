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
    <div class="immersive-auth">
      
      <div class="bg-visual" style="background-image: url('https://images.pexels.com/photos/33784246/pexels-photo-33784246.jpeg')">
        <div class="bg-overlay"></div>
      </div>

      <div class="layout-grid">
        
        <div class="hero-panel">
          <div class="brand-header">
            <div class="logo-mark">
              <i class="fas fa-graduation-cap"></i>
            </div>
            <span class="brand-name">Apex Learning</span>
          </div>

          <div class="hero-content">
            <div class="badge-pill">
              <span class="dot"></span> Welcome Back
            </div>
            <h1 class="display-title">
              Continue Your <br>
              <span class="text-gradient">Journey.</span>
            </h1>
            <p class="hero-desc">
              Log in to access your personalized learning dashboard, pick up where you left off, and discover new courses.
            </p>
            
            <div class="social-proof">
              <div class="avatars">
                <span class="avatar-img"><i class="fas fa-check"></i></span>
              </div>
              <div class="proof-details">
                <span class="proof-title">Secure & Fast</span>
                <span class="proof-subtitle">Your data is always protected</span>
              </div>
            </div>
          </div>

          <div class="hero-footer">
            <span>© 2026 Apex Learning Inc.</span>
            <div class="footer-links">
              <a href="#">Terms</a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
        </div>

        <div class="form-panel glass-sidebar">
          <div class="form-scroll-container">
            <div class="form-content-wrapper">
              
              <div class="auth-header">
                <h2 class="auth-title">Sign In</h2>
                <p class="auth-subtitle">Enter your credentials to access your account.</p>
              </div>

              <div class="alert alert-success mb-xl" *ngIf="sessionExpired">
                <i class="fas fa-info-circle"></i>
                <span>Your session has expired. Please log in again.</span>
              </div>

              <div class="alert alert-error mb-xl" *ngIf="errorMessage">
                <i class="fas fa-exclamation-circle"></i>
                <span>{{ errorMessage }}</span>
              </div>

              <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
                
                <div class="form-group">
                  <label class="input-label">Email Address</label>
                  <div class="input-wrapper">
                    <i class="field-icon fas fa-envelope"></i>
                    <input type="email" formControlName="email" placeholder="you@example.com" class="glass-input-field" 
                           [class.invalid]="isFieldInvalid('email')"/>
                  </div>
                  <small class="error-text" *ngIf="isFieldInvalid('email')">Please enter a valid email.</small>
                </div>

                <div class="form-group">
                  <label class="input-label">Password</label>
                  <div class="input-wrapper">
                    <i class="field-icon fas fa-lock"></i>
                    <input [type]="showPassword ? 'text' : 'password'" formControlName="password" placeholder="••••••••" class="glass-input-field pr-10" 
                           [class.invalid]="isFieldInvalid('password')"/>
                    <button type="button" class="eye-btn" (click)="togglePassword()">
                      <i [class]="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </button>
                  </div>
                  <small class="error-text" *ngIf="isFieldInvalid('password')">Password is required.</small>
                </div>

                <div class="form-options mt-sm">
                  <label class="checkbox-container">
                    <input type="checkbox" formControlName="rememberMe" class="custom-checkbox">
                    <span class="checkbox-text">Remember me</span>
                  </label>
                  <a routerLink="/auth/forgot-password" class="highlight-link text-sm">Forgot Password?</a>
                </div>

                <button type="submit" class="submit-btn mt-md" [disabled]="loginForm.invalid || isLoading">
                  <span *ngIf="!isLoading">Log In <i class="fas fa-sign-in-alt ml-xs"></i></span>
                  <span *ngIf="isLoading" class="spinner"></span>
                </button>

              </form>

              <div class="auth-footer-text">
                Don't have an account? <a routerLink="/auth/signup" class="highlight-link">Sign up here</a>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* =========================================
       IMMERSIVE LOGIN THEME
       ========================================= */
    :host {
      display: block;
    }

    .immersive-auth {
      --glass-bg: rgba(15, 15, 20, 0.65);
      --glass-border: rgba(255, 255, 255, 0.08);
      --glass-blur: 50px;
      --text-primary: #ffffff;
      --text-secondary: rgba(255, 255, 255, 0.6);
      --accent-color: #818cf8;
      --accent-glow: rgba(129, 140, 248, 0.4);
      --error-color: #f87171;
      --success-color: #34d399;

      position: relative;
     width: 100%; 
      
      /* 3. CHANGE 100vh to 100dvh (Dynamic Viewport Height - fixes mobile glitches) 
            OR change to 100% if you have a top navbar */
      height: 100dvh;
      overflow: hidden;
      background-color: #0f172a;
      font-family: var(--font-body, 'Inter', sans-serif);
      box-sizing: border-box;
    }

    *, *::before, *::after { box-sizing: border-box; }

    /* --- 1. Background Layer --- */
    .bg-visual {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      z-index: 0;
    }
    .bg-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg, 
        rgba(15, 23, 42, 0.85) 0%,   
        rgba(30, 27, 75, 0.4) 50%,   
        rgba(15, 23, 42, 0.95) 100% 
      );
    }

    /* --- 2. Layout Grid --- */
    .layout-grid {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr 500px; /* Slightly narrower than signup since there are fewer fields */
      height: 100%;
      width: 100%;
    }
    @media (max-width: 1024px) {
      .layout-grid { grid-template-columns: 1fr 450px; }
    }
    @media (max-width: 850px) {
      .layout-grid { grid-template-columns: 1fr; }
      .immersive-auth { overflow-y: auto; }
      .hero-panel { display: none !important; }
      .form-panel { width: 100%; border-left: none !important; background: rgba(15, 23, 42, 0.95) !important; }
    }

    /* --- 3. Hero Panel (Left) --- */
    .hero-panel {
      padding: 60px 80px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      animation: fadeIn 0.8s ease-out;
    }
    .brand-header { display: flex; align-items: center; gap: 12px; }
    .logo-mark {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, var(--accent-color), #c084fc);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 1.25rem;
      box-shadow: 0 0 20px var(--accent-glow);
    }
    .brand-name { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; }

    .hero-content { max-width: 650px; }
    .badge-pill {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 16px; background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 30px;
      color: var(--text-primary); font-size: 0.875rem; font-weight: 500; margin-bottom: 24px;
      backdrop-filter: blur(8px);
    }
    .badge-pill .dot { width: 8px; height: 8px; background: #34d399; border-radius: 50%; box-shadow: 0 0 8px #34d399; }
    
    .display-title {
      font-size: clamp(3rem, 5vw, 4.5rem); line-height: 1.1; font-weight: 800; color: var(--text-primary); margin: 0 0 24px 0; letter-spacing: -2px;
    }
    .text-gradient {
      background: linear-gradient(to right, var(--accent-color), #e879f9);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .hero-desc { font-size: 1.25rem; color: rgba(255, 255, 255, 0.85); line-height: 1.6; margin: 0 0 40px 0; }

    .social-proof { display: flex; align-items: center; gap: 16px; }
    .avatar-img {
      width: 40px; height: 40px; border-radius: 50%; background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; color: #34d399; backdrop-filter: blur(4px);
    }
    .proof-details { display: flex; flex-direction: column; }
    .proof-title { font-weight: 600; color: white; font-size: 0.9rem; }
    .proof-subtitle { color: var(--text-secondary); font-size: 0.8rem; }

    .hero-footer { display: flex; justify-content: space-between; color: rgba(255, 255, 255, 0.4); font-size: 0.875rem; }
    .footer-links { display: flex; gap: 24px; }
    .footer-links a { color: inherit; text-decoration: none; transition: color 0.2s; }
    .footer-links a:hover { color: white; }

    /* --- 4. Form Panel (Right) --- */
    .form-panel {
      height: 100%;
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur));
      -webkit-backdrop-filter: blur(var(--glass-blur));
      border-left: 1px solid var(--glass-border);
      box-shadow: -20px 0 50px rgba(0,0,0,0.4);
    }
    .form-scroll-container {
      height: 100%;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 32px;
    }
    .form-content-wrapper {
      width: 100%;
      max-width: 400px;
      margin: auto 0; /* Vertically centers the login form beautifully */
      animation: slideIn 0.8s ease-out;
    }

    .auth-header { margin-bottom: 32px; }
    .auth-title { font-size: 2rem; font-weight: 700; color: white; margin: 0 0 8px 0; letter-spacing: -0.5px; }
    .auth-subtitle { color: var(--text-secondary); font-size: 0.95rem; margin: 0; }

    /* Alerts */
    .alert {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px; 
      border-radius: 12px; font-size: 0.9rem; font-weight: 500;
      backdrop-filter: blur(8px);
    }
    .alert-error {
      background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.2);
      color: #fca5a5;
    }
    .alert-success {
      background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.2);
      color: #6ee7b7;
    }

    /* --- 5. Form Styles --- */
    .auth-form { display: flex; flex-direction: column; gap: 20px; width: 100%; }

    .form-group { position: relative; width: 100%; }
    .input-label {
      display: block; font-size: 0.85rem; font-weight: 500; color: rgba(255, 255, 255, 0.8); margin-bottom: 8px;
    }
    .input-wrapper { position: relative; width: 100%; }
    .field-icon {
      position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
      z-index: 2; color: rgba(255, 255, 255, 0.4); pointer-events: none; font-size: 1rem;
    }
    .eye-btn {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: rgba(255, 255, 255, 0.4); cursor: pointer; padding: 4px;
    }
    .eye-btn:hover { color: white; }

    .glass-input-field {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: white;
      border-radius: 12px;
      padding: 12px 12px 12px 44px;
      font-size: 0.95rem;
      height: 48px;
      transition: all 0.2s ease;
      outline: none;
      font-family: inherit;
    }
    .glass-input-field.pr-10 { padding-right: 40px; }
    .glass-input-field::placeholder { color: rgba(255, 255, 255, 0.3); }
    .glass-input-field:hover {
      background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.25);
    }
    .glass-input-field:focus {
      background: rgba(255, 255, 255, 0.1); border-color: var(--accent-color);
      box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.2);
    }
    .glass-input-field.invalid { border-color: var(--error-color); }

    .error-text { color: var(--error-color); font-size: 0.8rem; margin-top: 4px; display: block; }

    /* Form Options (Checkbox & Links) */
    .form-options {
      display: flex; justify-content: space-between; align-items: center;
    }
    .checkbox-container {
      display: flex; align-items: center; gap: 8px; cursor: pointer;
    }
    .custom-checkbox {
      accent-color: var(--accent-color); width: 16px; height: 16px; cursor: pointer;
      background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .checkbox-text { font-size: 0.875rem; color: var(--text-secondary); }

    /* Utilities */
    .mt-sm { margin-top: 12px; }
    .mt-md { margin-top: 24px; }
    .mb-xl { margin-bottom: 32px; }
    .ml-xs { margin-left: 6px; }
    .text-sm { font-size: 0.875rem; }

    /* Submit Button */
    .submit-btn {
      width: 100%; height: 50px; border-radius: 12px;
      background: linear-gradient(135deg, var(--accent-color), #c084fc);
      color: white; border: none; font-weight: 600; font-size: 1rem;
      box-shadow: 0 4px 15px var(--accent-glow);
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center;
    }
    .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(129, 140, 248, 0.5); }
    .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Footer & Links */
    .auth-footer-text { margin-top: 32px; text-align: center; color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; }
    .highlight-link { color: var(--accent-color); text-decoration: none; font-weight: 600; transition: 0.2s; }
    .highlight-link:hover { text-decoration: underline; color: #a5b4fc; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .spinner {
      width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%; border-top-color: white; animation: spin 0.8s linear infinite;
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
            // Handle remember me logic here
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