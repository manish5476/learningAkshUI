import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    // canActivate: [NoAuthGuard],
    loadComponent: () => import('./../../features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Login - EdTech Platform'
  },
  {
    path: 'signup',
    // canActivate: [NoAuthGuard],
    loadComponent: () => import('./../../features/auth/signup/signup.component').then(m => m.SignupComponent),
    title: 'Sign Up - EdTech Platform'
  },
  {
    path: 'forgot-password',
    // canActivate: [NoAuthGuard],
    loadComponent: () => import('./../../features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Forgot Password - EdTech Platform'
  },
  {
    path: 'reset-password/:token',
    // Usually NO guard here – user should be able to access with valid token even if logged in
    loadComponent: () => import('./../../features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    title: 'Reset Password - EdTech Platform'
  },
  // {
  //   path: 'verify-email/:token',
  //   loadComponent: () => import('./../../features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
  //   title: 'Verify Email - EdTech Platform'
  // },

  // Catch-all / default inside /auth → redirect to login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  // Optional: redirect unknown auth sub-paths back to login
  {
    path: '**',
    redirectTo: 'login'
  }
];