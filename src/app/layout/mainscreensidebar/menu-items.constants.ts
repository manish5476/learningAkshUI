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
  // ==========================
  // 1. STUDENT EXPERIENCE (Visible to everyone)
  // ==========================
  {
    label: 'My Learning',
    icon: 'pi pi-home',
    expanded: true,
    items: [
      { 
        label: 'Dashboard', 
        icon: 'pi pi-th-large', 
        routerLink: ['/my-learning'] // Your student dashboard with course progress
      },
      {
        label: 'Browse Courses',
        icon: 'pi pi-compass',
        routerLink: ['/courses']
      },
      {
        label: 'Mock Tests',
        icon: 'pi pi-clipboard',
        routerLink: ['/mock-tests']
      },
      {
        label: 'Popular Categories',
        icon: 'pi pi-sitemap',
        routerLink: ['/categories/popular'] // The recursive tree we built
      },
      {
        label: 'Explore Categories',
        icon: 'pi pi-sitemap',
        routerLink: ['/categories/tree'] // The recursive tree we built
      },
      // ==========================
      // CERTIFICATES SECTION - STUDENT
      // ==========================
      {
        label: 'My Certificates',
        icon: 'pi pi-certificate',
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
    expanded: true,
    roles: ['instructor', 'admin'],
    items: [
      { 
        label: 'Command Center', 
        icon: 'pi pi-chart-line', 
        routerLink: ['/instructor/dashboard'] // The Bento-stats dashboard
      },
      { 
        label: 'Course Manager', 
        icon: 'pi pi-book', 
        routerLink: ['/instructor/courses'] // The fluid card-based management feed
      },
      { 
        label: 'Build New Course', 
        icon: 'pi pi-plus-circle', 
        routerLink: ['/instructor/courses/new'] // The 4-step wizard form
      },
      {
        label: 'Instructor Assessments',
        icon: 'pi pi-list',
        routerLink: ['/instructor/assessments']
      },
      { 
        label: 'Mock Test Builder', 
        icon: 'pi pi-file-edit', 
        routerLink: ['/instructor/mock-tests/new']
      },
      // ==========================
      // CERTIFICATES SECTION - INSTRUCTOR
      // ==========================
      {
        label: 'My Certificates',
        icon: 'pi pi-certificate',
        routerLink: ['/certificates/my-certificates']
      },
      {
        label: 'Student Certificates',
        icon: 'pi pi-users',
        routerLink: ['/instructor/certificates'],
        badge: '12' // Example: number of recent certificates issued
      }
    ]
  },

  // ==========================
  // 3. ADMINISTRATION (Admins Only)
  // ==========================
  {
    label: 'Administration',
    icon: 'pi pi-shield',
    roles: ['admin'],
    items: [
      { 
        label: 'User Directory', 
        icon: 'pi pi-users', 
        routerLink: ['/users']
      },
      { 
        label: 'Instructor Directory', 
        icon: 'pi pi-users', 
        routerLink: ['/instructor/dashboard']
      },
      {
        label: 'Catalog Structure',
        icon: 'pi pi-sliders-h',
        routerLink: ['/categories/admin'] // The category management directory
      },
      // ==========================
      // CERTIFICATES SECTION - ADMIN
      // ==========================
      {
        label: 'Certificate Dashboard',
        icon: 'pi pi-chart-pie',
        routerLink: ['/certificates/admin'],
        badge: 'New'
      },
      {
        label: 'Certificate Management',
        icon: 'pi pi-shield',
        routerLink: ['/certificates/admin/certificates']
      },
      {
        label: 'Issue Certificate',
        icon: 'pi pi-plus-circle',
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
  // 4. PREFERENCES & LOGOUT
  // ==========================
  {
    label: 'Account',
    icon: 'pi pi-user',
    items: [
      { 
        label: 'Profile Settings', 
        icon: 'pi pi-cog', 
        routerLink: ['/my-profile']
      },
      // Add certificates to profile section as well
      {
        label: 'My Certificates',
        icon: 'pi pi-certificate',
        routerLink: ['/certificates/my-certificates']
      },
      { 
        label: 'Sign Out', 
        icon: 'pi pi-sign-out', 
        routerLink: ['/auth/login'] 
      }
    ]
  }
];