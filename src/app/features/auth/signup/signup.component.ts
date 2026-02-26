import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-signup-immersive',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="immersive-signup">
      
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
              <span class="dot"></span> Join the Learning Revolution
            </div>
            <h1 class="display-title">
              Master Skills <br>
              <span class="text-gradient">Without Limits.</span>
            </h1>
            <p class="hero-desc">
              Create your account today and join thousands of students and expert instructors building the future of education.
            </p>
            
            <div class="social-proof">
              <div class="avatars">
                <span class="avatar-img"><i class="fas fa-user"></i></span>
                <span class="avatar-img"><i class="fas fa-user"></i></span>
                <span class="avatar-img"><i class="fas fa-user"></i></span>
                <span class="avatar-img"><i class="fas fa-plus" style="font-size: 0.6rem"></i></span>
              </div>
              <div class="proof-details">
                <span class="proof-title">Top Rated Platform</span>
                <span class="proof-subtitle">Trusted by 50,000+ learners</span>
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
                <h2 class="auth-title">Get Started</h2>
                <p class="auth-subtitle">Select your role and set up your profile.</p>
              </div>

              <div class="role-selector-glass mb-xl">
                <button 
                  type="button" 
                  class="role-btn" 
                  [class.active]="signupForm.get('role')?.value === 'student'"
                  (click)="setRole('student')">
                  <i class="fas fa-book-open"></i> Student
                </button>
                <button 
                  type="button" 
                  class="role-btn" 
                  [class.active]="signupForm.get('role')?.value === 'instructor'"
                  (click)="setRole('instructor')">
                  <i class="fas fa-chalkboard-teacher"></i> Instructor
                </button>
              </div>

              <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="auth-form">
                
                <div class="form-row-split">
                  <div class="form-group">
                    <label class="input-label">First Name <span class="req">*</span></label>
                    <div class="input-wrapper">
                      <i class="field-icon fas fa-user"></i>
                      <input type="text" formControlName="firstName" placeholder="John" class="glass-input-field" 
                             [class.invalid]="isFieldInvalid('firstName')" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="input-label">Last Name <span class="req">*</span></label>
                    <div class="input-wrapper">
                      <i class="field-icon fas fa-user"></i>
                      <input type="text" formControlName="lastName" placeholder="Doe" class="glass-input-field" 
                             [class.invalid]="isFieldInvalid('lastName')"/>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label class="input-label">Email Address <span class="req">*</span></label>
                  <div class="input-wrapper">
                    <i class="field-icon fas fa-envelope"></i>
                    <input type="email" formControlName="email" placeholder="you@example.com" class="glass-input-field" 
                           [class.invalid]="isFieldInvalid('email')"/>
                  </div>
                </div>

                <div class="form-row-split">
                  <div class="form-group">
                    <label class="input-label">Password <span class="req">*</span></label>
                    <div class="input-wrapper">
                      <i class="field-icon fas fa-lock"></i>
                      <input [type]="showPassword ? 'text' : 'password'" formControlName="password" placeholder="••••••••" class="glass-input-field pr-10" 
                             [class.invalid]="isFieldInvalid('password')"/>
                      <button type="button" class="eye-btn" (click)="togglePassword('password')">
                        <i [class]="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                      </button>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="input-label">Confirm <span class="req">*</span></label>
                    <div class="input-wrapper">
                      <i class="field-icon fas fa-check-circle"></i>
                      <input [type]="showConfirmPassword ? 'text' : 'password'" formControlName="confirmPassword" placeholder="••••••••" class="glass-input-field pr-10" 
                             [class.invalid]="isFieldInvalid('confirmPassword') || signupForm.hasError('mismatch')"/>
                      <button type="button" class="eye-btn" (click)="togglePassword('confirm')">
                        <i [class]="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <small class="error-text block" *ngIf="signupForm.hasError('mismatch') && signupForm.get('confirmPassword')?.touched">
                  Passwords do not match.
                </small>

                <div class="form-group mt-sm" *ngIf="signupForm.get('role')?.value === 'instructor'">
                  <label class="input-label">Areas of Expertise</label>
                  <div class="glass-badge-container">
                    <button *ngFor="let area of expertiseOptions" type="button" class="glass-badge"
                            [class.active]="selectedExpertise.includes(area)" (click)="toggleArrayItem(selectedExpertise, area)">
                      {{ area }}
                    </button>
                  </div>
                </div>

                <div class="form-group mt-sm" *ngIf="signupForm.get('role')?.value === 'student'">
                  <label class="input-label">What do you want to learn?</label>
                  <div class="glass-badge-container">
                    <button *ngFor="let interest of interestOptions" type="button" class="glass-badge"
                            [class.active]="selectedInterests.includes(interest)" (click)="toggleArrayItem(selectedInterests, interest)">
                      {{ interest }}
                    </button>
                  </div>
                </div>

                <button type="submit" class="submit-btn mt-md" [disabled]="signupForm.invalid || isLoading">
                  <span *ngIf="!isLoading">Create Account <i class="fas fa-arrow-right ml-xs"></i></span>
                  <span *ngIf="isLoading" class="spinner"></span>
                </button>

              </form>

              <div class="auth-footer-text">
                Already have an account? <a routerLink="/auth/login" class="highlight-link">Sign in here</a>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* =========================================
       IMMERSIVE SIGNUP THEME (Learning Edition)
       ========================================= */
    :host {
      display: block;
    }

    /* SCSS-like syntax assuming Angular processes it, otherwise pure CSS variables below */
    .immersive-signup {
      --glass-bg: rgba(15, 15, 20, 0.65);
      --glass-border: rgba(255, 255, 255, 0.08);
      --glass-blur: 50px;
      --text-primary: #ffffff;
      --text-secondary: rgba(255, 255, 255, 0.6);
      --accent-color: #818cf8;
      --accent-glow: rgba(129, 140, 248, 0.4);
      --error-color: #f87171;

      position: absolute;
      width: 100%;
      height: 100%;
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
      grid-template-columns: 1fr 560px; /* Slightly wider for learning form */
      height: 100%;
      width: 100%;
    }
    @media (max-width: 1024px) {
      .layout-grid { grid-template-columns: 1fr 480px; }
    }
    @media (max-width: 850px) {
      .layout-grid { grid-template-columns: 1fr; }
      .immersive-signup { overflow-y: auto; }
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
    .brand-header {
      display: flex; align-items: center; gap: 12px;
    }
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
    .badge-pill .dot { width: 8px; height: 8px; background: #c084fc; border-radius: 50%; box-shadow: 0 0 8px #c084fc; }
    
    .display-title {
      font-size: clamp(3rem, 5vw, 4.5rem); line-height: 1.1; font-weight: 800; color: var(--text-primary); margin: 0 0 24px 0; letter-spacing: -2px;
    }
    .text-gradient {
      background: linear-gradient(to right, var(--accent-color), #e879f9);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .hero-desc { font-size: 1.25rem; color: rgba(255, 255, 255, 0.85); line-height: 1.6; margin: 0 0 40px 0; }

    .social-proof { display: flex; align-items: center; gap: 16px; }
    .avatars { display: flex; }
    .avatar-img {
      width: 40px; height: 40px; border-radius: 50%; background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2); display: flex; align-items: center; justify-content: center;
      margin-left: -12px; font-size: 0.8rem; color: white; backdrop-filter: blur(4px);
    }
    .avatar-img:first-child { margin-left: 0; }
    .proof-details { display: flex; flex-direction: column; }
    .proof-title { font-weight: 600; color: white; font-size: 0.9rem; }
    .proof-subtitle { color: var(--text-secondary); font-size: 0.8rem; }

    .hero-footer {
      display: flex; justify-content: space-between; color: rgba(255, 255, 255, 0.4); font-size: 0.875rem;
    }
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
    .form-scroll-container::-webkit-scrollbar { width: 6px; }
    .form-scroll-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
    .form-scroll-container::-webkit-scrollbar-track { background: transparent; }

    .form-content-wrapper {
      width: 100%;
      max-width: 420px;
      margin: auto 0;
      animation: slideIn 0.8s ease-out;
    }

    .auth-header { margin-bottom: 32px; }
    .auth-title { font-size: 2rem; font-weight: 700; color: white; margin: 0 0 8px 0; letter-spacing: -0.5px; }
    .auth-subtitle { color: var(--text-secondary); font-size: 0.95rem; margin: 0; }

    /* Role Segmented Control */
    .role-selector-glass {
      display: flex;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 6px;
      border: 1px solid var(--glass-border);
    }
    .role-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
      background: transparent; border: none; padding: 10px; border-radius: 8px;
      color: var(--text-secondary); font-size: 0.9rem; font-weight: 500; cursor: pointer;
      transition: all 0.2s ease;
    }
    .role-btn.active {
      background: rgba(255, 255, 255, 0.1); color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    /* --- 5. Form Styles --- */
    .auth-form { display: flex; flex-direction: column; gap: 20px; width: 100%; }
    .form-row-split { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 400px) { .form-row-split { grid-template-columns: 1fr; } }

    .form-group { position: relative; width: 100%; }
    .input-label {
      display: block; font-size: 0.85rem; font-weight: 500; color: rgba(255, 255, 255, 0.8); margin-bottom: 8px;
    }
    .req { color: var(--accent-color); }
    
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

    /* Strict Alignment Standard Input */
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
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.25);
    }
    .glass-input-field:focus {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--accent-color);
      box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.2);
    }
    .glass-input-field.invalid { border-color: var(--error-color); }

    .error-text { color: var(--error-color); font-size: 0.8rem; margin-top: 4px; display: block; }

    /* Glass Badges for Interests/Expertise */
    .glass-badge-container { display: flex; flex-wrap: wrap; gap: 8px; }
    .glass-badge {
      background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7); padding: 6px 14px; border-radius: 20px;
      font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
    }
    .glass-badge:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2); color: white; }
    .glass-badge.active { background: var(--accent-color); border-color: var(--accent-color); color: white; }

    /* Utilities */
    .mt-sm { margin-top: 12px; }
    .mt-md { margin-top: 24px; }
    .mb-xl { margin-bottom: 32px; }
    .ml-xs { margin-left: 6px; }

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
export class SignupComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  // private authService = inject(AuthService); // Assuming you have this

  signupForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  expertiseOptions = ['Web Dev', 'Data Science', 'UI/UX Design', 'Cloud', 'Marketing'];
  interestOptions = ['Programming', 'Design', 'Business', 'AI/ML', 'Photography'];
  
  selectedExpertise: string[] = [];
  selectedInterests: string[] = [];
  
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.initForm();
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
      password: ['', [Validators.required, Validators.minLength(8)]],
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

  toggleArrayItem(array: string[], item: string): void {
    const index = array.indexOf(item);
    if (index === -1) {
      array.push(item);
    } else {
      array.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      console.log('Form Submitted', this.signupForm.value);
      // this.router.navigate(['/dashboard']);
    }, 1500);
  }
}