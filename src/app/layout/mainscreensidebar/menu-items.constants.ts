export interface MenuItem {
  label: string;
  icon: string;
  routerLink?: string[];
  items?: MenuItem[];
  badge?: string;
  expanded?: boolean;
}

export const SIDEBAR_MENU: MenuItem[] = [
  // ==========================
  // 1. DASHBOARD / PUBLIC
  // ==========================
  {
    label: 'Overview',
    icon: 'pi pi-home',
    expanded: true,
    items: [
      { 
        label: 'Home', 
        icon: 'pi pi-th-large', 
        routerLink: ['/home'] 
      },
      {
        label: 'Browse Courses',
        icon: 'pi pi-search',
        routerLink: ['/courses']
      },
      {
        label: 'Categories (List)',
        icon: 'pi pi-tags',
        routerLink: ['/categories/list']
      },
      {
        label: 'Category Tree',
        icon: 'pi pi-sitemap',
        routerLink: ['/categories/tree'] // Newly added route mapped to the Canvas component
      }
    ]
  },
  // ==========================
  // 2. INSTRUCTOR AREA
  // ==========================
  {
    label: 'Teaching',
    icon: 'pi pi-graduation-cap',
    expanded: true,
    items: [
      { 
        label: 'My Courses', 
        icon: 'pi pi-book', 
        routerLink: ['/courses/instructor']
      },
      { 
        label: 'Create Course', 
        icon: 'pi pi-plus-circle', 
        routerLink: ['/courses/instructor/new']
      }
    ]
  },
  // ==========================
  // 3. ADMIN AREA
  // ==========================
  {
    label: 'Administration',
    icon: 'pi pi-briefcase',
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
      },
      {
        label: 'Create Category',
        icon: 'pi pi-folder-plus',
        routerLink: ['/categories/admin/new']
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
        routerLink: ['/settings/profile']
      },
      { 
        label: 'Logout', 
        icon: 'pi pi-sign-out', 
        routerLink: ['/auth/login'] 
      }
    ]
  }
];