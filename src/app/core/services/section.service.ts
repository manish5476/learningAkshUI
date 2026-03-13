import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiOptions, ApiResponseWithPagination, ApiResponse } from '../http/base-api.service';

export interface Section {
  _id?: string;
  title: string;
  courseId: string;
  // add other section properties...
}

@Injectable({
  providedIn: 'root'
})
export class SectionService {
  private readonly endpoint = 'sections'; // Adjust if mounted differently (e.g., 'courses/:courseId/sections')

  constructor(private api: BaseApiService) {}

  // ==================== PUBLIC ROUTES ====================

  getCourseSections(courseId: string, options?: ApiOptions): Observable<ApiResponseWithPagination<Section[]>> {
    return this.api.getWithPagination<Section[]>(`${this.endpoint}/course/${courseId}`, { ...options, skipAuth: true });
  }

  getSectionWithLessons(id: string, options?: ApiOptions): Observable<ApiResponse<Section>> {
    return this.api.get<Section>(`${this.endpoint}/${id}/with-lessons`, { ...options, skipAuth: true });
  }

  getSection(id: string, options?: ApiOptions): Observable<ApiResponse<Section>> {
    return this.api.get<Section>(`${this.endpoint}/${id}`, { ...options, skipAuth: true });
  }

  getAllSections(options?: ApiOptions): Observable<ApiResponseWithPagination<Section[]>> {
    return this.api.getWithPagination<Section[]>(this.endpoint, { ...options, skipAuth: true });
  }

  // ==================== PROTECTED ROUTES ====================

  // --- Create/Update ---
  
  createSection(data: Partial<Section>, options?: ApiOptions): Observable<ApiResponse<Section>> {
    return this.api.post<Section>(this.endpoint, data, options);
  }

  updateSection(id: string, data: Partial<Section>, options?: ApiOptions): Observable<ApiResponse<Section>> {
    return this.api.patch<Section>(`${this.endpoint}/${id}`, data, options);
  }

  // --- Publish/Unpublish Routes ---

  publishSection(id: string, options?: ApiOptions): Observable<ApiResponse<Section>> {
    return this.api.patch<Section>(`${this.endpoint}/${id}/publish`, {}, options);
  }

  unpublishSection(id: string, options?: ApiOptions): Observable<ApiResponse<Section>> {
    return this.api.patch<Section>(`${this.endpoint}/${id}/unpublish`, {}, options);
  }

  togglePublishStatus(id: string, options?: ApiOptions): Observable<ApiResponse<Section>> {
    return this.api.patch<Section>(`${this.endpoint}/${id}/toggle-publish`, {}, options);
  }

  // --- Bulk Publish/Unpublish ---

  bulkPublishSections(sectionIds: string[], options?: ApiOptions): Observable<ApiResponse<any>> {
    return this.api.post<any>(`${this.endpoint}/bulk/publish`, { sectionIds }, options);
  }

  bulkUnpublishSections(sectionIds: string[], options?: ApiOptions): Observable<ApiResponse<any>> {
    return this.api.post<any>(`${this.endpoint}/bulk/unpublish`, { sectionIds }, options);
  }

  // --- Section Management ---

  reorderSections(courseId: string, orderedIds: string[], options?: ApiOptions): Observable<ApiResponse<any>> {
    return this.api.patch<any>(`${this.endpoint}/reorder/${courseId}`, { orderedIds }, options);
  }

  duplicateSection(id: string, options?: ApiOptions): Observable<ApiResponse<Section>> {
    return this.api.post<Section>(`${this.endpoint}/${id}/duplicate`, {}, options);
  }

  // --- Delete/Restore ---

  deleteSection(id: string, options?: ApiOptions): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`${this.endpoint}/${id}`, options);
  }

  restoreSection(id: string, options?: ApiOptions): Observable<ApiResponse<Section>> {
    return this.api.patch<Section>(`${this.endpoint}/${id}/restore`, {}, options);
  }

  // --- Bulk Operations ---

  bulkCreateSections(sections: Partial<Section>[], options?: ApiOptions): Observable<ApiResponse<Section[]>> {
    return this.api.post<Section[]>(`${this.endpoint}/bulk/create`, { sections }, options);
  }

  bulkUpdateSections(sections: Partial<Section>[], options?: ApiOptions): Observable<ApiResponse<Section[]>> {
    return this.api.patch<Section[]>(`${this.endpoint}/bulk/update`, { sections }, options);
  }

  bulkDeleteSections(sectionIds: string[], options?: ApiOptions): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`${this.endpoint}/bulk/delete`, { ...options, body: { sectionIds } });
  }

  countSections(options?: ApiOptions): Observable<ApiResponse<{ total: number }>> {
    return this.api.get<{ total: number }>(`${this.endpoint}/count/total`, options);
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
//   private baseApi = inject(BaseApiService);

//   /**
//    * Helper method to generate the base nested URL for sections
//    */
//   private getBaseUrl(courseId: string): string {
//     return `courses/${courseId}/sections`;
//   }

//   // ==========================================
//   // CORE CRUD OPERATIONS
//   // ==========================================

//   /**
//    * Get all sections for a specific course
//    */
//   getSectionsByCourse(courseId: string): Observable<ApiResponse<any>> {
//     return this.baseApi.get<Section[]>(this.getBaseUrl(courseId), { showLoader: true });
//   }

//   /**
//    * Get single section by ID
//    */
//   getSectionById(courseId: string, id: string): Observable<ApiResponse<Section>> {
//     return this.baseApi.get<Section>(`${this.getBaseUrl(courseId)}/${id}`, { showLoader: true });
//   }

//   /**
//    * Create new section
//    */
//   createSection(courseId: string, data: Partial<Section>): Observable<ApiResponse<Section>> {
//     return this.baseApi.post<Section>(this.getBaseUrl(courseId), data, { showLoader: true });
//   }

//   /**
//    * Update section
//    */
//   updateSection(courseId: string, id: string, data: Partial<Section>): Observable<ApiResponse<Section>> {
//     return this.baseApi.patch<Section>(`${this.getBaseUrl(courseId)}/${id}`, data, { showLoader: true });
//   }

//   /**
//    * Delete section
//    */
//   deleteSection(courseId: string, id: string): Observable<ApiResponse<null>> {
//     return this.baseApi.delete<null>(`${this.getBaseUrl(courseId)}/${id}`, { showLoader: true });
//   }

//   // ==========================================
//   // ADVANCED FEATURES & STATE MANAGEMENT
//   // ==========================================

//   /**
//    * Reorder sections within a course
//    */
//   reorderSections(courseId: string, sections: Array<{ id: string; order: number }>): Observable<ApiResponse<any>> {
//     // Note: Changed to PATCH to match the updated Express REST architecture
//     return this.baseApi.patch(`${this.getBaseUrl(courseId)}/reorder`, { sections }, { showLoader: true });
//   }

//   /**
//    * Publish a section (make it visible to enrolled students)
//    */
//   publishSection(courseId: string, id: string): Observable<ApiResponse<Section>> {
//     return this.baseApi.patch<Section>(`${this.getBaseUrl(courseId)}/${id}/publish`, {}, { showLoader: true });
//   }

//   /**
//    * Unpublish a section (hide it back to draft mode)
//    */
//   unpublishSection(courseId: string, id: string): Observable<ApiResponse<Section>> {
//     return this.baseApi.patch<Section>(`${this.getBaseUrl(courseId)}/${id}/unpublish`, {}, { showLoader: true });
//   }

//   /**
//    * Clone a section and all its nested lessons
//    */
//   cloneSection(courseId: string, id: string): Observable<ApiResponse<{ section: Section }>> {
//     return this.baseApi.post<{ section: Section }>(`${this.getBaseUrl(courseId)}/${id}/clone`, {}, { showLoader: true });
//   }
// }