export interface MenuItem {
  label: string;
  icon: string;
  routerLink?: string[];
  items?: MenuItem[];
  badge?: string;
  expanded?: boolean;
  roles?: string[]; // <-- Added this! ['admin', 'instructor', 'student']
}

export const SIDEBAR_MENU: MenuItem[] = [
  // ==========================
  // 1. LEARNING / PUBLIC (Visible to everyone)
  // ==========================
  {
    label: 'Learning',
    icon: 'pi pi-home',
    expanded: true,
    items: [
      { 
        label: 'Dashboard', 
        icon: 'pi pi-th-large', 
        routerLink: ['/home'] 
      },
      {
        label: 'Browse Courses',
        icon: 'pi pi-search',
        routerLink: ['/courses']
      },
      {
        label: 'Mock Tests',
        icon: 'pi pi-clipboard',
        routerLink: ['/mock-tests'] // The student mock test hub
      },
      {
        label: 'Categories',
        icon: 'pi pi-sitemap',
        routerLink: ['/categories/tree'] 
      }
    ]
  },

  // ==========================
  // 2. INSTRUCTOR AREA
  // ==========================
  {
    label: 'Teaching Hub',
    icon: 'pi pi-graduation-cap',
    expanded: true,
    roles: ['instructor', 'admin'], // <-- Only Instructors and Admins see this block
    items: [
      { 
        label: 'Command Center', 
        icon: 'pi pi-chart-line', 
        routerLink: ['/instructor/dashboard']
      },
      { 
        label: 'My Courses', 
        icon: 'pi pi-book', 
        routerLink: ['/instructor/courses']
      },
      {
        label: 'Quiz Manager',
        icon: 'pi pi-list',
        routerLink: ['/instructor/quizzes']
      },
      { 
        label: 'Create Mock Test', 
        icon: 'pi pi-file-edit', 
        routerLink: ['/instructor/mock-tests/new']
      }
    ]
  },

  // ==========================
  // 3. ADMIN AREA
  // ==========================
  {
    label: 'Administration',
    icon: 'pi pi-briefcase',
    roles: ['admin'], // <-- ONLY Admins see this block
    items: [
      { 
        label: 'User Management', 
        icon: 'pi pi-users', 
        routerLink: ['/users']
      },
      {
        label: 'Manage Categories',
        icon: 'pi pi-sliders-h',
        routerLink: ['/categories/admin']
      }
    ]
  },

  // ==========================
  // 4. USER ACCOUNT
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
      { 
        label: 'Logout', 
        icon: 'pi pi-sign-out', 
        routerLink: ['/auth/login'] 
      }
    ]
  }
];