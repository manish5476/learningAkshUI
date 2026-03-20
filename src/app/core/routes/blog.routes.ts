import { Routes } from '@angular/router';

// Import your standalone components
// Assuming you have or will create a table component to list them
import { PostFormComponent } from '../../features/Blog/components/post-form/post-form.component';
import { PostListComponent } from '../../features/Blog/components/post-list/post-list.component';

export const POST_ROUTES: Routes = [
  {
    path: '', // e.g., /instructor/posts
    component: PostListComponent,
    title: 'Manage Posts & Current Affairs'
  },
  {
    path: 'new', // e.g., /instructor/posts/new
    component: PostFormComponent,
    title: 'Create New Post'
  },
  {
    path: 'edit/:id', // e.g., /instructor/posts/edit/64a7b...
    component: PostFormComponent,
    title: 'Edit Post'
  }
];