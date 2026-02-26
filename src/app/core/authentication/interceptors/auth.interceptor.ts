import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BaseApiService } from '../../http/base-api.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private authService = inject(AuthService);
  private api = inject(BaseApiService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip for auth endpoints
    if (req.url.includes('/auth/')) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expired or invalid
          this.authService.logout();
          this.router.navigate(['/auth/login'], {
            queryParams: { sessionExpired: true }
          });
        } else if (error.status === 403) {
          // Forbidden
          this.router.navigate(['/dashboard']);
        }
        
        return throwError(() => error);
      })
    );
  }
}