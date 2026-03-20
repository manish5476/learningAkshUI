import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse, ApiResponseWithPagination, BaseApiService } from '../http/base-api.service';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private api = inject(BaseApiService);
  private endpoint = 'posts'; // Admin endpoints

  // Get all posts for the admin table
  getAdminPosts(params: any = {}): Observable<ApiResponseWithPagination> {
    return this.api.getWithPagination(this.endpoint, { params });
  }

  // Get a specific post for editing
  getPost(id: string): Observable<any> {
    return this.api.get<any>(`${this.endpoint}/${id}`).pipe(
      map(res => res.data)
    );
  }

  // Create a new post
  createPost(postData: any): Observable<ApiResponse> {
    return this.api.post(this.endpoint, postData, { showLoader: true });
  }

  // Update an existing post
  updatePost(id: string, postData: any): Observable<ApiResponse> {
    return this.api.patch(`${this.endpoint}/${id}`, postData, { showLoader: true });
  }

  // Delete/Archive a post
  deletePost(id: string): Observable<ApiResponse> {
    return this.api.delete(`${this.endpoint}/${id}`, { showLoader: true });
  }
}