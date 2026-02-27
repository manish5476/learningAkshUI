import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';
import { Category } from '../models/course.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly endpoint = 'categories';

  constructor(private baseApi: BaseApiService) {}

  // Public routes
  getAll(params?: any): Observable<ApiResponse<Category[]>> {
    return this.baseApi.get<Category[]>(this.endpoint, { params });
  }

  getTree(): Observable<ApiResponse<Category[]>> {
    return this.baseApi.get<Category[]>(`${this.endpoint}/tree`);
  }

  getById(id: string): Observable<ApiResponse<Category>> {
    return this.baseApi.get<Category>(`${this.endpoint}/${id}`);
  }

  getWithCourses(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.get<any>(`${this.endpoint}/${id}/courses`);
  }

  // Admin routes
  create(data: any): Observable<ApiResponse<Category>> {
    return this.baseApi.post<Category>(this.endpoint, data, { showLoader: true });
  }

  update(id: string, data: any): Observable<ApiResponse<Category>> {
    return this.baseApi.patch<Category>(`${this.endpoint}/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`);
  }
}