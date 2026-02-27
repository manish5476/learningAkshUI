// category.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';
import { Category } from '../models/category.model';

export interface CategoryTreeResponse {
  categories: Category[];
}

export interface CategoryWithCoursesResponse {
  category: Category;
  courses: any[];
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly endpoint = 'categories';
  private baseApi = inject(BaseApiService);

  /**
   * Get category tree (hierarchical structure)
   */
  getCategoryTree(params?: any): Observable<ApiResponse<any>> {
    return this.baseApi.get<CategoryTreeResponse>(`${this.endpoint}/tree`, { params, showLoader: true });
  }

  /**
   * Get all categories (flat list)
   */
  getAll(params?: any): Observable<ApiResponse<any>> {
    return this.baseApi.get<Category[]>(this.endpoint, { params });
  }

  /**
   * Get single category by ID
   */
  getById(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.get<Category>(`${this.endpoint}/${id}`, { showLoader: true });
  }

  /**
   * Get category with its courses
   */
  getCategoryWithCourses(id: string): Observable<ApiResponse<CategoryWithCoursesResponse>> {
    return this.baseApi.get<CategoryWithCoursesResponse>(`${this.endpoint}/${id}/courses`, { showLoader: true });
  }

  /**
   * Create new category
   */
  create(data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.baseApi.post<Category>(this.endpoint, data, { showLoader: true });
  }

  /**
   * Update category
   */
  update(id: string, data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.baseApi.patch<Category>(`${this.endpoint}/${id}`, data, { showLoader: true });
  }

  /**
   * Delete category
   */
  delete(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete<null>(`${this.endpoint}/${id}`, { showLoader: true });
  }

  /**
   * Bulk update categories (for reordering)
   */
  bulkUpdate(updates: Array<{ id: string; order?: number; parentCategory?: string | null }>): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/bulk-update`, { updates }, { showLoader: true });
  }

  /**
   * Check if slug is available
   */
  checkSlug(slug: string): Observable<ApiResponse<{ available: boolean }>> {
    return this.baseApi.get<{ available: boolean }>(`${this.endpoint}/check-slug/${slug}`);
  }
}