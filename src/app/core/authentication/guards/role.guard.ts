import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

/**
 * INSTRUCTOR GUARD
 * Allows access if the user is an 'instructor' OR an 'admin'.
 */
export const instructorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user && (user.role === 'instructor' || user.role === 'admin')) {
        return true;
      }
      // Redirect students trying to access instructor pages back to home
      return router.createUrlTree(['/home']); 
    })
  );
};

/**
 * ADMIN GUARD
 * Allows access strictly only to 'admin' users.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      if (user && user.role === 'admin') {
        return true;
      }
      return router.createUrlTree(['/home']); 
    })
  );
};