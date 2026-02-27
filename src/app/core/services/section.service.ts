// section.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';
import { Section } from '../models/course.model';

@Injectable({
  providedIn: 'root'
})
export class SectionService {
  private readonly endpoint = 'sections';
  private baseApi = inject(BaseApiService);

  /**
   * Get sections by course
   */
  getSectionsByCourse(courseId: string): Observable<ApiResponse<Section[]>> {
    return this.baseApi.get<Section[]>(`courses/${courseId}/sections`, { showLoader: true });
  }

  /**
   * Get single section by ID
   */
  getById(id: string): Observable<ApiResponse<Section>> {
    return this.baseApi.get<Section>(`${this.endpoint}/${id}`, { showLoader: true });
  }

  /**
   * Create new section
   */
  create(data: Partial<Section>): Observable<ApiResponse<Section>> {
    return this.baseApi.post<Section>(this.endpoint, data, { showLoader: true });
  }

  /**
   * Update section
   */
  update(id: string, data: Partial<Section>): Observable<ApiResponse<Section>> {
    return this.baseApi.patch<Section>(`${this.endpoint}/${id}`, data, { showLoader: true });
  }

  /**
   * Delete section
   */
  delete(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete<null>(`${this.endpoint}/${id}`, { showLoader: true });
  }

  /**
   * Reorder sections within a course
   */
  reorderSections(courseId: string, sections: Array<{ id: string; order: number }>): Observable<ApiResponse<any>> {
    return this.baseApi.post(`courses/${courseId}/sections/reorder`, { sections }, { showLoader: true });
  }
}