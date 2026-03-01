import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/authentication/guards/auth.guard';

export const MOCK_TEST_ROUTES: Routes = [
  {
    path: 'mock-tests',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('../../features/Test/mock-test-list/mock-test-list.component').then(m => m.MockTestListComponent),
        title: 'Mock Tests & Assessments'
      },
      {
        path: 'take/:id',
        loadComponent: () => import('../../features/Test/mock-test-taker/mock-test-taker.component').then(m => m.MockTestTakerComponent),
        title: 'Taking Mock Test'
      },
      {
        path: 'results/:id',
        loadComponent: () => import('../../features/Test/mock-test-results/mock-test-results.component').then(m => m.MockTestResultsComponent),
        title: 'Mock Test Results'
      }
    ]
  }
];