export interface MenuItem {
  label: string;
  icon: string;
  routerLink?: string[];
  items?: MenuItem[];
  badge?: string;
  expanded?: boolean;
  roles?: string[];
}

export const SIDEBAR_MENU: MenuItem[] = [
  {
    label: 'Learning',
    icon: 'pi pi-compass',
    expanded: true,
    items: [
      {
        label: 'Home Dashboard',
        icon: 'pi pi-home',
        routerLink: ['/home']
      },
      {
        label: 'Browse Courses',
        icon: 'pi pi-search',
        routerLink: ['/courses']
      },
      {
        label: 'Top Courses',
        icon: 'pi pi-search',
        routerLink: ['/courses/top-courses']
      },
      {
        label: 'Mock Tests',
        icon: 'pi pi-clipboard',
        routerLink: ['/mock-tests']
      },
      {
        label: 'Course Categories',
        icon: 'pi pi-sitemap',
        routerLink: ['/categories/tree']
      },
      {
        label: 'My Certificates',
        icon: 'pi pi-verified',
        routerLink: ['/certificates/my-certificates']
      },
      {
        label: 'Verify Certificate',
        icon: 'pi pi-shield',
        routerLink: ['/certificates/verify']
      }
    ]
  },

  // ==========================
  // 2. TEACHING HUB (Instructors & Admins)
  // ==========================
  {
    label: 'Teaching Hub',
    icon: 'pi pi-graduation-cap',
    expanded: false,
    roles: ['instructor', 'admin'],
    items: [
      {
        label: 'Blog List',
        icon: 'pi pi-chart-bar',
        routerLink: ['/blog']
      },
      {
        label: 'Blog Form',
        icon: 'pi pi-plus',
        routerLink: ['/blog/admin/new']
      },
      {
        label: 'Analytics Dashboard',
        icon: 'pi pi-chart-bar',
        routerLink: ['/instructor/dashboard']
      },
      {
        label: 'My Courses (Manager)',
        icon: 'pi pi-video',
        routerLink: ['/instructor/courses']
      },
      {
        label: 'Draft New Course',
        icon: 'pi pi-plus-circle',
        routerLink: ['/instructor/courses/new']
      },
      {
        label: 'Quizzes & Assessments',
        icon: 'pi pi-question-circle',
        routerLink: ['/instructor/assessments']
      },
      {
        label: 'Draft Mock Test',
        icon: 'pi pi-file-edit',
        routerLink: ['/instructor/mock-tests/new']
      },
      {
        label: 'Student Certificates',
        icon: 'pi pi-users',
        routerLink: ['/instructor/certificates'],
        badge: 'New'
      }
    ]
  },
  {
    label: 'Master',
    icon: 'pi pi-users',
    routerLink: ['/master']
  },
  // ==========================
  // 3. SYSTEM ADMINISTRATION (Admins Only)
  // ==========================
  {
    label: 'Administration',
    icon: 'pi pi-cog',
    expanded: false,
    roles: ['admin'],
    items: [
      {
        label: 'User Directory',
        icon: 'pi pi-users',
        routerLink: ['/users']
      },
      {
        label: 'Category Manager',
        icon: 'pi ' + 'pi-tags',
        routerLink: ['/categories/admin']
      },
      {
        label: 'Certificate Dashboard',
        icon: 'pi pi-chart-pie',
        routerLink: ['/certificates/admin']
      },
      {
        label: 'Issue Certificate',
        icon: 'pi pi-star',
        routerLink: ['/certificates/admin/issue']
      },
      {
        label: 'Bulk Operations',
        icon: 'pi pi-sync',
        expanded: false,
        items: [
          {
            label: 'Bulk Generate',
            icon: 'pi pi-file-pdf',
            routerLink: ['/certificates/admin/bulk/generate']
          },
          {
            label: 'Bulk Revoke',
            icon: 'pi pi-times-circle',
            routerLink: ['/certificates/admin/bulk/revoke']
          },
          {
            label: 'Export Reports',
            icon: 'pi pi-download',
            routerLink: ['/certificates/admin/export']
          }
        ]
      }
    ]
  },

  // ==========================
  // 4. ACCOUNT & SETTINGS
  // ==========================
  {
    label: 'Account',
    icon: 'pi pi-user',
    expanded: false,
    items: [
      {
        label: 'Profile Settings',
        icon: 'pi pi-user-edit',
        routerLink: ['/my-profile']
      },
      {
        label: 'My Enrollments',
        icon: 'pi pi-user-edit',
        routerLink: ['/my-enrollments']
      },
      {
        label: 'My Dashboard',
        icon: 'pi pi-user-edit',
        routerLink: ['/my-dashboard']
      },
      {
        label: 'Sign Out',
        icon: 'pi pi-sign-out',
        routerLink: ['/auth/login']
      }
    ]
  }
];
