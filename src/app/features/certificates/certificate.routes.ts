import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/authentication/guards/auth.guard';
import { adminGuard, instructorGuard } from '../../core/authentication/guards/role.guard';

export const CERTIFICATE_ROUTES: Routes = [
  // ==========================
  // PUBLIC ROUTES
  // ==========================
  {
    path: 'verify',
    loadComponent: () => import('./components/certificate-verify/certificate-verify.component').then(m => m.CertificateVerifyComponent),
    title: 'Verify Certificate'
  },
  {
    path: 'verify/:number',
    loadComponent: () => import('./components/certificate-verify/certificate-verify.component').then(m => m.CertificateVerifyComponent),
    title: 'Verify Certificate'
  },

  // ==========================
  // STUDENT PROTECTED ROUTES
  // ==========================
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'my-certificates',
        loadComponent: () => import('./components/certificate-list/certificate-list.component').then(m => m.CertificateListComponent),
        title: 'My Certificates'
      },
      {
        path: 'my-certificates/:id',
        loadComponent: () => import('./components/certificate-detail/certificate-detail.component').then(m => m.CertificateDetailComponent),
        title: 'Certificate Details'
      }
    ]
  },

  // ==========================
  // INSTRUCTOR ROUTES
  // ==========================
  {
    path: 'instructor',
    canActivate: [AuthGuard, instructorGuard],
    data: { roles: ['instructor', 'admin'] },
    children: [
      {
        path: 'certificates',
        loadComponent: () => import('./components/instructor-certificates/instructor-certificates.component').then(m => m.InstructorCertificatesComponent),
        title: 'Student Certificates'
      },
      {
        path: 'certificates/:id',
        loadComponent: () => import('./components/certificate-detail/certificate-detail.component').then(m => m.CertificateDetailComponent),
        title: 'Certificate Details'
      },
      {
        path: 'issue/:courseId/:studentId',
        loadComponent: () => import('./components/issue-certificate/issue-certificate.component').then(m => m.IssueCertificateComponent),
        title: 'Issue Certificate'
      }
    ]
  },

  // ==========================
  // ADMIN ROUTES
  // ==========================
  {
    path: 'admin',
    canActivate: [AuthGuard, adminGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./components/certificate-dashboard/certificate-dashboard.component').then(m => m.CertificateDashboardComponent),
        title: 'Certificate Dashboard'
      },
      {
        path: 'certificates',
        loadComponent: () => import('./components/certificate-list/certificate-list.component').then(m => m.CertificateListComponent),
        title: 'Certificate Management'
      },
      {
        path: 'certificates/:id',
        loadComponent: () => import('./components/certificate-detail/certificate-detail.component').then(m => m.CertificateDetailComponent),
        title: 'Certificate Details'
      },
      {
        path: 'issue',
        loadComponent: () => import('./components/issue-certificate/issue-certificate.component').then(m => m.IssueCertificateComponent),
        title: 'Issue Certificate'
      },
      // {
      //   path: 'issue/bulk',
      //   loadComponent: () => import('./components/bulk-generate/bulk-generate.component').then(m => m.BulkGenerateComponent),
      //   title: 'Bulk Generate Certificates'
      // },
      // {
      //   path: 'revoke/bulk',
      //   loadComponent: () => import('./components/bulk-revoke/bulk-revoke.component').then(m => m.BulkRevokeComponent),
      //   title: 'Bulk Revoke Certificates'
      // },
      // {
      //   path: 'export',
      //   loadComponent: () => import('./components/export-reports/export-reports.component').then(m => m.ExportReportsComponent),
      //   title: 'Export Certificate Reports'
      // },
      // {
      //   path: 'templates',
      //   loadComponent: () => import('./components/certificate-templates/certificate-templates.component').then(m => m.CertificateTemplatesComponent),
      //   title: 'Certificate Templates'
      // },
      // {
      //   path: 'settings',
      //   loadComponent: () => import('./components/certificate-settings/certificate-settings.component').then(m => m.CertificateSettingsComponent),
      //   title: 'Certificate Settings'
      // }
    ]
  },

  // ==========================
  // REDIRECTS
  // ==========================
  {
    path: '**',
    redirectTo: 'my-certificates'
  }
];