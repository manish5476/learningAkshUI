// blog.routes.ts (Updated with public and private routes)
import { Routes } from '@angular/router';

// Import your standalone components
import { PostListComponent } from '../../features/Blog/components/post-list/post-list.component';
import { PostFormComponent } from '../../features/Blog/components/post-form/post-form.component';
import { PostDetailComponent } from '../../features/Blog/components/post-detail/post-detail.component';
import { AuthGuard } from '../authentication/guards/auth.guard';
import { instructorGuard } from '../authentication/guards/role.guard';

export const POST_ROUTES: Routes = [
  // ==========================================
  // PUBLIC ROUTES (No authentication required)
  // ==========================================
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    component: PostListComponent,
    title: 'Blog - Latest Posts',
    data: {
      breadcrumb: 'Blog',
      animation: 'list',
      isPublic: true
    }
  },
  {
    path: 'view/:id',
    component: PostDetailComponent,
    title: 'Read Post',
    data: {
      breadcrumb: 'Post Details',
      animation: 'detail',
      isPublic: true
    }
  },
  {
    path: ':slug', // For SEO-friendly URLs like /blog/my-post-title
    component: PostDetailComponent,
    title: 'Read Post',
    data: {
      breadcrumb: 'Post Details',
      animation: 'detail',
      isPublic: true
    }
  },
  
  // ==========================================
  // PRIVATE ROUTES (Admin/Instructor only)
  // ==========================================
  {
    path: 'admin',
    canActivate: [AuthGuard, instructorGuard],
    data: { roles: ['admin', 'instructor'] },
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        component: PostListComponent,
        title: 'Manage Posts - Blog Management',
        data: {
          breadcrumb: 'Manage Posts',
          animation: 'list',
          isAdmin: true
        }
      },
      {
        path: 'new',
        component: PostFormComponent,
        title: 'Create New Post',
        data: {
          breadcrumb: 'Create Post',
          animation: 'form',
          mode: 'create',
          isAdmin: true
        }
      },
      {
        path: 'edit/:id',
        component: PostFormComponent,
        title: 'Edit Post',
        data: {
          breadcrumb: 'Edit Post',
          animation: 'form',
          mode: 'edit',
          isAdmin: true
        }
      }
    ]
  }
];