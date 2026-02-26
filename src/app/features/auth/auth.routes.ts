import { Routes } from '@angular/router';
import { NoAuthGuard } from '../../core/authentication/guards/no-auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    canActivate: [NoAuthGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
        title: 'Login - EdTech Platform'
      },
      {
        path: 'signup',
        loadComponent: () => import('./signup/signup.component').then(m => m.SignupComponent),
        title: 'Sign Up - EdTech Platform'
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'Forgot Password - EdTech Platform'
      },
      {
        path: 'reset-password/:token',
        loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        title: 'Reset Password - EdTech Platform'
      },
    //   {
    //     path: 'verify-email/:token',
    //     loadComponent: () => import('./verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
    //     title: 'Verify Email - EdTech Platform'
    //   },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  }
];