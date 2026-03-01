import { Routes, CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { map, take } from 'rxjs/operators'; // <-- Added RxJS operators

import { AuthService } from '../../core/services/auth.service';

/**
 * GUARD 1: Admin Only
 * Subscribes to currentUser$, takes the first value, and checks the role.
 */
const adminOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Return the observable directly; Angular Router will subscribe to it automatically
  return authService.currentUser$.pipe(
    take(1), // Ensure the observable completes so the route can resolve
    map(user => {
      if (user && user.role === 'admin') {
        return true;
      }
      return router.createUrlTree(['/unauthorized']); // Redirect if not admin
    })
  );
};

/**
 * GUARD 2: Owner or Admin
 * Checks if the logged-in user is an admin OR if their ID matches the URL param.
 */
const profileAccessGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const targetUserId = route.paramMap.get('userId');

  return authService.currentUser$.pipe(
    take(1),
    map(user => {
      // Allow if user exists AND (is admin OR is accessing their own profile)
      if (user && (user.role === 'admin' || user._id === targetUserId)) {
        return true;
      }
      return router.createUrlTree(['/unauthorized']);
    })
  );
};

// ==========================================
// ROUTES CONFIGURATION
// ==========================================
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'users'
  },
  //   {
  //   path: 'instructor/quizzes', // This acts as the hub
  //   canActivate: [AuthGuard],
  //   loadComponent: () => import('./components/instructor-assessments/instructor-assessments.component').then(m => m.InstructorAssessmentsComponent),
  //   title: 'Quiz Manager'
  // }
  //   {
  //   path: 'mock-tests/take/:id',
  //   // canActivate: [AuthGuard], // Essential to protect the attempt API
  //   loadComponent: () => import('./components/mock-test-taker/mock-test-taker.component').then(m => m.MockTestTakerComponent),
  //   title: 'Taking Mock Test'
  // }
  {
    path: 'users',
    loadComponent: () => import('./user-list.component').then(m => m.UserListComponent),
    title: 'User Management',
    canActivate: [adminOnlyGuard] // Admin only
  },
  {
    path: 'users/:userId',
    loadComponent: () => import('./user-detail.component').then(m => m.UserDetailComponent),
    title: 'User Profile',
    canActivate: [profileAccessGuard] // Admin OR Profile Owner
  },
  {
    path: 'my-profile',
    loadComponent: () => import('./user-form.component').then(m => m.UserFormComponent),
    title: 'Edit My Profile',
    // You can optionally add a generic authGuard here just to ensure they are logged in
  }
];