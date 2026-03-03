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

export interface Breadcrumb {
  _id: string;
  name: string;
  slug: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly endpoint = 'categories';
  private baseApi = inject(BaseApiService);

  // ==========================================
  // READ OPERATIONS (PUBLIC)
  // ==========================================

  getCategoryTree(params?: any): Observable<ApiResponse<any>> {
    return this.baseApi.get<CategoryTreeResponse>(`${this.endpoint}/tree`, { params, showLoader: true });
  }

  getPopularCategories(params?: any): Observable<ApiResponse<any>> {
    return this.baseApi.get<any>(`${this.endpoint}/popular`, { params });
  }

  getAllCategories(params?: any): Observable<ApiResponse<any>> {
    return this.baseApi.get<Category[]>(this.endpoint, { params });
  }

  getCategoryById(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.get<Category>(`${this.endpoint}/${id}`, { showLoader: true });
  }

  getCategoryWithCourses(id: string): Observable<ApiResponse<CategoryWithCoursesResponse>> {
    return this.baseApi.get<CategoryWithCoursesResponse>(`${this.endpoint}/${id}/courses`, { showLoader: true });
  }

  getCategoryBreadcrumbs(id: string): Observable<ApiResponse<{ breadcrumbs: Breadcrumb[] }>> {
    return this.baseApi.get<{ breadcrumbs: Breadcrumb[] }>(`${this.endpoint}/${id}/breadcrumbs`);
  }

  checkCategorySlug(slug: string): Observable<ApiResponse<{ available: boolean }>> {
    return this.baseApi.get<{ available: boolean }>(`${this.endpoint}/check-slug/${slug}`);
  }

  // ==========================================
  // WRITE OPERATIONS (ADMIN)
  // ==========================================

  createCategory(data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.baseApi.post<Category>(this.endpoint, data, { showLoader: true });
  }

  updateCategory(id: string, data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.baseApi.patch<Category>(`${this.endpoint}/${id}`, data, { showLoader: true });
  }

  deleteCategory(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete<null>(`${this.endpoint}/${id}`, { showLoader: true });
  }

  restoreCategory(id: string): Observable<ApiResponse<Category>> {
    return this.baseApi.patch<Category>(`${this.endpoint}/${id}/restore`, {}, { showLoader: true });
  }

  bulkUpdateCategory(updates: Array<{ id: string; order?: number; parentCategory?: string | null }>): Observable<ApiResponse<any>> {
    // Note: Changed to PATCH to match RESTful conventions and the Express router
    return this.baseApi.patch(`${this.endpoint}/bulk-update`, { ids: updates.map(u => u.id), updates }, { showLoader: true });
  }
}


// // category.service.ts
// import { Injectable, inject } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService, ApiResponse } from '../http/base-api.service';
// import { Category } from '../models/category.model';

// export interface CategoryTreeResponse {
//   categories: Category[];
// }

// export interface CategoryWithCoursesResponse {
//   category: Category;
//   courses: any[];
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class CategoryService {
//   private readonly endpoint = 'categories';
//   private baseApi = inject(BaseApiService);

//   /**
//    * Get category tree (hierarchical structure)
//    */
//   getCategoryTree(params?: any): Observable<ApiResponse<any>> {
//     return this.baseApi.get<CategoryTreeResponse>(`${this.endpoint}/tree`, { params, showLoader: true });
//   }

//   /**
//    * Get all categories (flat list)
//    */
//   getAllCategory(params?: any): Observable<ApiResponse<any>> {
//     return this.baseApi.get<Category[]>(this.endpoint, { params });
//   }

//   /**
//    * Get single category by ID
//    */
//   getCategoryById(id: string): Observable<ApiResponse<any>> {
//     return this.baseApi.get<Category>(`${this.endpoint}/${id}`, { showLoader: true });
//   }

//   /**
//    * Get category with its courses
//    */
//   getCategoryWithCourses(id: string): Observable<ApiResponse<CategoryWithCoursesResponse>> {
//     return this.baseApi.get<CategoryWithCoursesResponse>(`${this.endpoint}/${id}/courses`, { showLoader: true });
//   }

//   /**
//    * Create new category
//    */
//   createCategory(data: Partial<Category>): Observable<ApiResponse<Category>> {
//     return this.baseApi.post<Category>(this.endpoint, data, { showLoader: true });
//   }

//   /**
//    * Update category
//    */
//   updateCategory(id: string, data: Partial<Category>): Observable<ApiResponse<Category>> {
//     return this.baseApi.patch<Category>(`${this.endpoint}/${id}`, data, { showLoader: true });
//   }

//   /**
//    * Delete category
//    */
//   deleteCategory(id: string): Observable<ApiResponse<null>> {
//     return this.baseApi.delete<null>(`${this.endpoint}/${id}`, { showLoader: true });
//   }

//   /**
//    * Bulk update categories (for reordering)
//    */
//   bulkUpdateCategory(updates: Array<{ id: string; order?: number; parentCategory?: string | null }>): Observable<ApiResponse<any>> {
//     return this.baseApi.post(`${this.endpoint}/bulk-update`, { updates }, { showLoader: true });
//   }

//   /**
//    * Check if slug is available
//    */
//   checkcategorySlug(slug: string): Observable<ApiResponse<{ available: boolean }>> {
//     return this.baseApi.get<{ available: boolean }>(`${this.endpoint}/check-slug/${slug}`);
//   }
// }