import { Injectable, inject } from '@angular/core';
import { Router, CanActivate, CanActivateChild, CanLoad, Route, UrlSegment, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  private router = inject(Router);
  private authService = inject(AuthService);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(route);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth(route);
  }

  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAuth();
  }

  private checkAuth(route?: ActivatedRouteSnapshot): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: route?.url.join('/') || '/' }
          });
          return false;
        }

        // Check for required roles
        if (route?.data['roles']) {
          const requiredRoles = route.data['roles'];
          const hasRequiredRole = this.authService.hasRole(requiredRoles);
          
          if (!hasRequiredRole) {
            this.router.navigate(['/dashboard']);
            return false;
          }
        }

        return true;
      })
    );
  }
}