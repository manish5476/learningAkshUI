import { Routes, CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

const adminOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.currentUser$.pipe(
    take(1),
    map(user => (user && user.role === 'admin') ? true : router.createUrlTree(['/unauthorized']))
  );
};

const profileAccessGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const targetUserId = route.paramMap.get('userId');
  return authService.currentUser$.pipe(
    take(1),
    map(user => (user && (user.role === 'admin' || user._id === targetUserId)) ? true : router.createUrlTree(['/unauthorized']))
  );
};

export const ADMIN_ROUTES: Routes = [
  {
    path: 'users',
    children: [
      {
        path: '',
        loadComponent: () => import('../../features/Users/user-list.component').then(m => m.UserListComponent),
        title: 'User Management',
        canActivate: [adminOnlyGuard]
      },
      {
        path: ':userId',
        loadComponent: () => import('../../features/Users/user-detail.component').then(m => m.UserDetailComponent),
        title: 'User Profile',
        canActivate: [profileAccessGuard]
      }
    ]
  },
  {
    path: 'my-profile',
    loadComponent: () => import('../../features/Users/user-form.component').then(m => m.UserFormComponent),
    title: 'Edit My Profile'
  }
];