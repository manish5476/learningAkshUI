// post.service.ts (add missing methods)
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse, ApiResponseWithPagination, BaseApiService } from '../http/base-api.service';

export interface Post {
  shares: any;
  comments: any;
  _id: string;
  id?: string;
  title: string;
  slug: string;
  type: string;
  language: string;
  excerpt: string;
  content: string;
  thumbnail?: string;
  sourceName?: string;
  sourceUrl?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  author: {
    _id: string;
    avatar: string,
    firstName: string;
    lastName: string;
    email?: string;
    bio?: string;
    profilePicture?: string;
  };
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  tags: string[];
  readTime: number;
  views: number;
  likes: number;
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
  };
  isFeatured: boolean;
  eventDate?: Date;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  publishedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private api = inject(BaseApiService);
  private endpoint = 'posts';

  // ==========================================
  // PUBLIC ENDPOINTS (For Readers)
  // ==========================================

  /**
   * Get published posts with smart filtering
   */
  getPublishedPosts(params: any = {}): Observable<ApiResponseWithPagination> {
    const queryParams = { ...params };

    if (queryParams.isFeatured !== undefined) {
      queryParams.isFeatured = queryParams.isFeatured.toString();
    }

    return this.api.getWithPagination(this.endpoint, { params: queryParams });
  }

  /**
   * Get a single post by slug with view count increment
   */
  getPostBySlug(slug: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/${slug}`).pipe(
      map(res => res.data)
    );
  }

  /**
   * Like a post
   */
  likePost(id: string): Observable<ApiResponse> {
    return this.api.patch(`${this.endpoint}/${id}/like`, {}, { showLoader: false });
  }

  /**
   * Update likes (toggling)
   */
  updateLikes(id: string, isLiking: boolean): Observable<ApiResponse> {
    if (isLiking) {
      return this.likePost(id);
    }
    // For unliking, we'll just return a success response
    // You may need to implement an unlike endpoint if needed
    return new Observable(subscriber => {
      subscriber.next({ status: 'success', data: { likes: 0 } });
      subscriber.complete();
    });
  }

  // ==========================================
  // ADMIN / INSTRUCTOR ENDPOINTS
  // ==========================================

  /**
   * Get all posts for admin table
   */
  getAdminPosts(params: any = {}): Observable<ApiResponseWithPagination> {
    const queryParams = { ...params };

    if (!queryParams.page) queryParams.page = 1;
    if (!queryParams.limit) queryParams.limit = 10;

    return this.api.getWithPagination(`${this.endpoint}/admin/all`, { params: queryParams });
  }

  /**
   * Get a specific post for editing
   */
  getPost(id: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/admin/${id}`).pipe(
      map(res => res.data)
    );
  }

  /**
   * Create a new post
   */
  createPost(postData: any): Observable<ApiResponse> {
    const { _id, id, __v, createdAt, updatedAt, ...cleanData } = postData;
    return this.api.post(this.endpoint, cleanData, { showLoader: true });
  }

  /**
   * Update an existing post
   */
  updatePost(id: string, postData: any): Observable<ApiResponse> {
    const { _id, id: postId, slug, __v, createdAt, updatedAt, ...cleanData } = postData;
    return this.api.patch(`${this.endpoint}/${id}`, cleanData, { showLoader: true });
  }

  /**
   * Soft delete/archive a post
   */
  deletePost(id: string): Observable<ApiResponse> {
    return this.api.delete(`${this.endpoint}/${id}`, { showLoader: true });
  }

  // ==========================================
  // NEW PUBLISHING / WORKFLOW ENDPOINTS
  // ==========================================

  publishPost(id: string): Observable<ApiResponse> {
    return this.api.patch(`${this.endpoint}/${id}/publish`, {}, { showLoader: true });
  }

  unpublishPost(id: string): Observable<ApiResponse> {
    return this.api.patch(`${this.endpoint}/${id}/unpublish`, {}, { showLoader: true });
  }

  toggleFeature(id: string): Observable<ApiResponse> {
    return this.api.patch(`${this.endpoint}/${id}/feature`, {}, { showLoader: true });
  }

  getPostsByAuthor(authorId: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/author/${authorId}`);
  }

  getAllTags(): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/tags/all`);
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Toggle save status for a post
   */
  toggleSave(postId: string, isSaved: boolean): Observable<any> {
    // This would require a user saved posts collection
    // For now, return a mock response
    return new Observable(subscriber => {
      subscriber.next({ status: 'success', saved: isSaved });
      subscriber.complete();
    });
  }

  /**
   * Get post status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'secondary';
      case 'scheduled': return 'info';
      case 'archived': return 'warning';
      default: return 'secondary';
    }
  }

  /**
   * Get post type display name
   */
  getTypeDisplayName(type: string): string {
    const typeMap: { [key: string]: string } = {
      blog: 'Blog',
      current_affairs: 'Current Affairs',
      current_affair: 'Current Affairs',
      announcement: 'Announcement'
    };
    return typeMap[type] || type;
  }

  /**
   * Get post status display name
   */
  getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      draft: 'Draft',
      published: 'Published',
      scheduled: 'Scheduled',
      archived: 'Archived'
    };
    return statusMap[status] || status;
  }
}