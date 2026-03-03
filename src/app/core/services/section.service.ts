// section.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';
import { Section } from '../models/course.model';

@Injectable({
  providedIn: 'root'
})
export class SectionService {
  private baseApi = inject(BaseApiService);

  /**
   * Helper method to generate the base nested URL for sections
   */
  private getBaseUrl(courseId: string): string {
    return `courses/${courseId}/sections`;
  }

  // ==========================================
  // CORE CRUD OPERATIONS
  // ==========================================

  /**
   * Get all sections for a specific course
   */
  getSectionsByCourse(courseId: string): Observable<ApiResponse<any>> {
    return this.baseApi.get<Section[]>(this.getBaseUrl(courseId), { showLoader: true });
  }

  /**
   * Get single section by ID
   */
  getSectionById(courseId: string, id: string): Observable<ApiResponse<Section>> {
    return this.baseApi.get<Section>(`${this.getBaseUrl(courseId)}/${id}`, { showLoader: true });
  }

  /**
   * Create new section
   */
  createSection(courseId: string, data: Partial<Section>): Observable<ApiResponse<Section>> {
    return this.baseApi.post<Section>(this.getBaseUrl(courseId), data, { showLoader: true });
  }

  /**
   * Update section
   */
  updateSection(courseId: string, id: string, data: Partial<Section>): Observable<ApiResponse<Section>> {
    return this.baseApi.patch<Section>(`${this.getBaseUrl(courseId)}/${id}`, data, { showLoader: true });
  }

  /**
   * Delete section
   */
  deleteSection(courseId: string, id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete<null>(`${this.getBaseUrl(courseId)}/${id}`, { showLoader: true });
  }

  // ==========================================
  // ADVANCED FEATURES & STATE MANAGEMENT
  // ==========================================

  /**
   * Reorder sections within a course
   */
  reorderSections(courseId: string, sections: Array<{ id: string; order: number }>): Observable<ApiResponse<any>> {
    // Note: Changed to PATCH to match the updated Express REST architecture
    return this.baseApi.patch(`${this.getBaseUrl(courseId)}/reorder`, { sections }, { showLoader: true });
  }

  /**
   * Publish a section (make it visible to enrolled students)
   */
  publishSection(courseId: string, id: string): Observable<ApiResponse<Section>> {
    return this.baseApi.patch<Section>(`${this.getBaseUrl(courseId)}/${id}/publish`, {}, { showLoader: true });
  }

  /**
   * Unpublish a section (hide it back to draft mode)
   */
  unpublishSection(courseId: string, id: string): Observable<ApiResponse<Section>> {
    return this.baseApi.patch<Section>(`${this.getBaseUrl(courseId)}/${id}/unpublish`, {}, { showLoader: true });
  }

  /**
   * Clone a section and all its nested lessons
   */
  cloneSection(courseId: string, id: string): Observable<ApiResponse<{ section: Section }>> {
    return this.baseApi.post<{ section: Section }>(`${this.getBaseUrl(courseId)}/${id}/clone`, {}, { showLoader: true });
  }
}

// // section.service.ts
// import { Injectable, inject } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService, ApiResponse } from '../http/base-api.service';
// import { Section } from '../models/course.model';

// @Injectable({
//   providedIn: 'root'
// })
// export class SectionService {
//   private readonly endpoint = 'sections';
//   private baseApi = inject(BaseApiService);

//   /**
//    * Get sections by course
//    */
//   getSectionsByCourse(courseId: string): Observable<ApiResponse<any>> {
//     return this.baseApi.get<Section[]>(`courses/${courseId}/sections`, { showLoader: true });
//   }

//   /**
//    * Get single section by ID
//    */
//   getSectionById(id: string): Observable<ApiResponse<Section>> {
//     return this.baseApi.get<Section>(`${this.endpoint}/${id}`, { showLoader: true });
//   }

//   /**
//    * Create new section
//    */
//   createSection(data: Partial<Section>): Observable<ApiResponse<Section>> {
//     return this.baseApi.post<Section>(this.endpoint, data, { showLoader: true });
//   }

//   /**
//    * Update section
//    */
//   updateSection(id: string, data: Partial<Section>): Observable<ApiResponse<Section>> {
//     return this.baseApi.patch<Section>(`${this.endpoint}/${id}`, data, { showLoader: true });
//   }

//   /**
//    * Delete section
//    */
//   deleteSection(id: string): Observable<ApiResponse<null>> {
//     return this.baseApi.delete<null>(`${this.endpoint}/${id}`, { showLoader: true });
//   }

//   /**
//    * Reorder sections within a course
//    */
//   reorderSections(courseId: string, sections: Array<{ id: string; order: number }>): Observable<ApiResponse<any>> {
//     return this.baseApi.post(`courses/${courseId}/sections/reorder`, { sections }, { showLoader: true });
//   }
// }