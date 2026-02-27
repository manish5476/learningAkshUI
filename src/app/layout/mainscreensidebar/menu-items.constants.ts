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
  // 1. DASHBOARD
  // ==========================
  {
    label: 'Overview',
    icon: 'pi pi-home',
    items: [
      { 
        label: 'Home', 
        icon: 'pi pi-th-large', 
        routerLink: ['/home'] 
      }
    ]
  },

  // ==========================
  // 2. INSTRUCTOR AREA
  // ==========================
  {
    label: 'Teaching',
    icon: 'pi pi-graduation-cap',
    expanded: true, // Keep this open by default for instructors
    items: [
      { 
        label: 'My Courses', 
        icon: 'pi pi-book', 
        routerLink: ['/instructor/courses'] 
      },
      { 
        label: 'Create Course', 
        icon: 'pi pi-plus-circle', 
        routerLink: ['/instructor/courses/new'] 
      },
      // Placeholders for future expansion:
      // { label: 'My Students', icon: 'pi pi-users', routerLink: ['/instructor/students'] },
      // { label: 'Assignments', icon: 'pi pi-file-edit', routerLink: ['/instructor/assignments'] }
    ]
  },

  // ==========================
  // 3. USER ACCOUNT
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
        label: 'user Settings', 
        icon: 'pi pi-cog', 
        routerLink: ['/users'] 
      },
      // The logout action usually doesn't use routerLink directly (it triggers a service),
      // but you can route them back to the auth module.
      { 
        label: 'Logout', 
        icon: 'pi pi-sign-out', 
        routerLink: ['/auth/login'] 
      }
    ]
  }
];