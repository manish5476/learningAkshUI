import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { BaseApiService, ApiResponse } from '../http/base-api.service';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'instructor' | 'admin';
  profilePicture?: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  isActive:boolean,
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'student' | 'instructor';
  phoneNumber?: string;
  expertise?: string[];
  interests?: string[];
  bio?: string;
}

// Represents just the payload inside ApiResponse.data
export interface AuthData {
  user: User;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  password: string;
  passwordConfirm: string;
}

export interface PasswordUpdateRequest {
  passwordCurrent: string;
  password: string;
  passwordConfirm: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private api = inject(BaseApiService);
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    this.loadStoredUser();
  }

  /**
   * Load stored user from localStorage
   */
  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        this.clearAuthData();
      }
    }
  }

  /**
   * Sign up new user
   */
  signup(data: SignupRequest): Observable<ApiResponse<AuthData>> {
    return this.api.post<AuthData>('auth/signup', data, { showLoader: true }).pipe(
      tap(response => {
        this.handleAuthResponse(response);
      }),
      catchError(error => {
        console.error('Signup error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<ApiResponse<AuthData>> {
    return this.api.post<AuthData>('auth/login', credentials, { showLoader: true }).pipe(
      tap(response => {
        this.handleAuthResponse(response);
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    this.api.get('auth/logout').subscribe({
      next: () => {
        this.clearAuthData();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.clearAuthData();
        this.router.navigate(['/auth/login']);
      }
    });
  }

  /**
   * Handle authentication response
   */
  private handleAuthResponse(response: ApiResponse<AuthData>): void {
    if (response.token && response.data?.user) {
      this.api.setAuthToken(response.token);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      this.currentUserSubject.next(response.data.user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    this.api.removeAuthToken();
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Forgot password
   */
  forgotPassword(email: string): Observable<ApiResponse<any>> {
    return this.api.post('auth/forgotPassword', { email }, { showLoader: true });
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, data: PasswordResetConfirm): Observable<ApiResponse<AuthData>> {
    return this.api.patch<AuthData>(`auth/resetPassword/${token}`, data, { showLoader: true }).pipe(
      tap(response => {
        this.handleAuthResponse(response);
      })
    );
  }

  /**
   * Update password (authenticated)
   */
  updatePassword(data: PasswordUpdateRequest): Observable<ApiResponse<AuthData>> {
    return this.api.patch<AuthData>('auth/updateMyPassword', data, { showLoader: true }).pipe(
      tap(response => {
        this.handleAuthResponse(response);
      })
    );
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user has specific role
   */
  hasRole(roles: string | string[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Check if user is instructor
   */
  isInstructor(): boolean {
    return this.hasRole('instructor');
  }

  /**
   * Check if user is student
   */
  isStudent(): boolean {
    return this.hasRole('student');
  }

  /**
   * Refresh user data
   */
  refreshUserData(): Observable<User> {
    return this.api.get<User>('users/me').pipe(
      map(response => {
        if (!response.data) {
          throw new Error('No user data returned from API');
        }
        return response.data;
      }),
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }
}