import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiOptions, ApiResponseWithPagination, ApiResponse } from '../http/base-api.service';
// import { BaseApiService, ApiResponse, ApiResponseWithPagination, ApiOptions } from './base-api.service';

export interface Lesson {
  _id?: string;
  title: string;
  sectionId: string;
  courseId: string;
  // add other lesson properties...
}

@Injectable({
  providedIn: 'root'
})
export class LessonService {
  private readonly endpoint = 'lessons'; // Adjust if mounted differently

  constructor(private api: BaseApiService) {}

  // ==================== PUBLIC ROUTES ====================

  getSectionLessons(sectionId: string, options?: ApiOptions): Observable<ApiResponseWithPagination<Lesson[]>> {
    return this.api.getWithPagination<Lesson[]>(`${this.endpoint}/section/${sectionId}`, { ...options, skipAuth: true });
  }

  getFreeLessons(courseId: string, options?: ApiOptions): Observable<ApiResponseWithPagination<Lesson[]>> {
    return this.api.getWithPagination<Lesson[]>(`${this.endpoint}/course/${courseId}/free`, { ...options, skipAuth: true });
  }

  getLessonsByInstructor(instructorId: string, options?: ApiOptions): Observable<ApiResponseWithPagination<Lesson[]>> {
    return this.api.getWithPagination<Lesson[]>(`${this.endpoint}/instructor/${instructorId}`, { ...options, skipAuth: true });
  }

  getLesson(id: string, options?: ApiOptions): Observable<ApiResponse<Lesson>> {
    return this.api.get<Lesson>(`${this.endpoint}/${id}`, { ...options, skipAuth: true });
  }

  getAllLessons(options?: ApiOptions): Observable<ApiResponseWithPagination<Lesson[]>> {
    return this.api.getWithPagination<Lesson[]>(this.endpoint, { ...options, skipAuth: true });
  }

  // ==================== PROTECTED ROUTES ====================

  // --- Create/Update ---

  createLesson(data: Partial<Lesson>, options?: ApiOptions): Observable<ApiResponse<Lesson>> {
    return this.api.post<Lesson>(this.endpoint, data, options);
  }

  updateLesson(id: string, data: Partial<Lesson>, options?: ApiOptions): Observable<ApiResponse<Lesson>> {
    return this.api.patch<Lesson>(`${this.endpoint}/${id}`, data, options);
  }

  // --- Publish/Unpublish Routes ---

  publishLesson(id: string, options?: ApiOptions): Observable<ApiResponse<Lesson>> {
    return this.api.patch<Lesson>(`${this.endpoint}/${id}/publish`, {}, options);
  }

  unpublishLesson(id: string, options?: ApiOptions): Observable<ApiResponse<Lesson>> {
    return this.api.patch<Lesson>(`${this.endpoint}/${id}/unpublish`, {}, options);
  }

  togglePublishStatus(id: string, options?: ApiOptions): Observable<ApiResponse<Lesson>> {
    return this.api.patch<Lesson>(`${this.endpoint}/${id}/toggle-publish`, {}, options);
  }

  // --- Bulk Publish/Unpublish ---

  bulkPublishLessons(lessonIds: string[], options?: ApiOptions): Observable<ApiResponse<any>> {
    return this.api.post<any>(`${this.endpoint}/bulk/publish`, { lessonIds }, options);
  }

  bulkUnpublishLessons(lessonIds: string[], options?: ApiOptions): Observable<ApiResponse<any>> {
    return this.api.post<any>(`${this.endpoint}/bulk/unpublish`, { lessonIds }, options);
  }

  // --- Lesson Management ---

  reorderLessons(sectionId: string, orderedIds: string[], options?: ApiOptions): Observable<ApiResponse<any>> {
    return this.api.patch<any>(`${this.endpoint}/reorder/${sectionId}`, { orderedIds }, options);
  }

  duplicateLesson(id: string, options?: ApiOptions): Observable<ApiResponse<Lesson>> {
    return this.api.post<Lesson>(`${this.endpoint}/${id}/duplicate`, {}, options);
  }

  bulkUpdateDurations(sectionId: string, durationsMap: Record<string, number>, options?: ApiOptions): Observable<ApiResponse<any>> {
    return this.api.patch<any>(`${this.endpoint}/bulk/update-durations/${sectionId}`, { durations: durationsMap }, options);
  }

  // --- Delete/Restore ---

  deleteLesson(id: string, options?: ApiOptions): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`${this.endpoint}/${id}`, options);
  }

  restoreLesson(id: string, options?: ApiOptions): Observable<ApiResponse<Lesson>> {
    return this.api.patch<Lesson>(`${this.endpoint}/${id}/restore`, {}, options);
  }

  // --- Bulk Operations ---

  bulkCreateLessons(lessons: Partial<Lesson>[], options?: ApiOptions): Observable<ApiResponse<Lesson[]>> {
    return this.api.post<Lesson[]>(`${this.endpoint}/bulk/create`, { lessons }, options);
  }

  bulkUpdateLessons(lessons: Partial<Lesson>[], options?: ApiOptions): Observable<ApiResponse<Lesson[]>> {
    return this.api.patch<Lesson[]>(`${this.endpoint}/bulk/update`, { lessons }, options);
  }

  bulkDeleteLessons(lessonIds: string[], options?: ApiOptions): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`${this.endpoint}/bulk/delete`, { ...options, body: { lessonIds } });
  }

  countLessons(options?: ApiOptions): Observable<ApiResponse<{ total: number }>> {
    return this.api.get<{ total: number }>(`${this.endpoint}/count/total`, options);
  }
}


// // lesson.service.ts
// import { Injectable, inject } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService, ApiResponse } from '../http/base-api.service';
// import { Lesson } from '../models/course.model';

// export interface LessonProgress {
//   lessonId: string;
//   completed: boolean;
//   courseProgressPercentage?: number;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class LessonService {
//   private baseApi = inject(BaseApiService);

//   /**
//    * Helper method to generate the deeply nested URL for lessons
//    * Matches Express route: /courses/:courseId/sections/:sectionId/lessons
//    */
//   private getBaseUrl(courseId: string, sectionId: string): string {
//     return `courses/${courseId}/sections/${sectionId}/lessons`;
//   }

//   // ==========================================
//   // CORE CRUD OPERATIONS
//   // ==========================================

//   /**
//    * Get all lessons for a specific section
//    */
//   getLessonsBySection(courseId: string, sectionId: string, params?: any): Observable<ApiResponse<Lesson[]>> {
//     return this.baseApi.get<Lesson[]>(this.getBaseUrl(courseId, sectionId), { params, showLoader: true });
//   }

//   /**
//    * Get single lesson by ID (Instructor/Admin View)
//    */
//   getById(courseId: string, sectionId: string, id: string): Observable<ApiResponse<Lesson>> {
//     return this.baseApi.get<Lesson>(`${this.getBaseUrl(courseId, sectionId)}/${id}`, { showLoader: true });
//   }

//   /**
//    * Create new lesson
//    */
//   create(courseId: string, sectionId: string, data: Partial<Lesson>): Observable<ApiResponse<Lesson>> {
//     return this.baseApi.post<Lesson>(this.getBaseUrl(courseId, sectionId), data, { showLoader: true });
//   }

//   /**
//    * Update lesson
//    */
//   update(courseId: string, sectionId: string, id: string, data: Partial<Lesson>): Observable<ApiResponse<Lesson>> {
//     return this.baseApi.patch<Lesson>(`${this.getBaseUrl(courseId, sectionId)}/${id}`, data, { showLoader: true });
//   }

//   /**
//    * Delete lesson
//    */
//   delete(courseId: string, sectionId: string, id: string): Observable<ApiResponse<null>> {
//     return this.baseApi.delete<null>(`${this.getBaseUrl(courseId, sectionId)}/${id}`, { showLoader: true });
//   }

//   // ==========================================
//   // ADVANCED FEATURES & STATE MANAGEMENT
//   // ==========================================

//   /**
//    * Reorder lessons within a section
//    */
//   reorderLessons(courseId: string, sectionId: string, lessons: Array<{ id: string; order: number }>): Observable<ApiResponse<any>> {
//     // Note: Matches the PATCH bulkWrite update we added in Express
//     return this.baseApi.patch(`${this.getBaseUrl(courseId, sectionId)}/reorder`, { lessons }, { showLoader: true });
//   }

//   /**
//    * Publish a lesson (make it visible to students)
//    */
//   publishLesson(courseId: string, sectionId: string, id: string): Observable<ApiResponse<Lesson>> {
//     return this.baseApi.patch<Lesson>(`${this.getBaseUrl(courseId, sectionId)}/${id}/publish`, {}, { showLoader: true });
//   }

//   /**
//    * Unpublish a lesson (revert to draft)
//    */
//   unpublishLesson(courseId: string, sectionId: string, id: string): Observable<ApiResponse<Lesson>> {
//     return this.baseApi.patch<Lesson>(`${this.getBaseUrl(courseId, sectionId)}/${id}/unpublish`, {}, { showLoader: true });
//   }

//   // ==========================================
//   // STUDENT EXPERIENCE & PROGRESS
//   // ==========================================

//   /**
//    * Get lesson with access control (For student viewing/paywall checks)
//    */
//   getLessonWithAccess(courseId: any, sectionId: any, id: string): Observable<ApiResponse<Lesson>> {
//     return this.baseApi.get<Lesson>(`${this.getBaseUrl(courseId, sectionId)}/${id}/access`, { 
//       showLoader: true,
//       skipAuth: false 
//     });
//   }

//   /**
//    * Mark lesson as completed by student
//    */
//   markAsCompleted(courseId: string, sectionId: string, lessonId: string): Observable<ApiResponse<LessonProgress>> {
//     return this.baseApi.post<LessonProgress>(`${this.getBaseUrl(courseId, sectionId)}/${lessonId}/complete`, {}, { showLoader: false });
//   }

//   /**
//    * Get specific lesson progress for student
//    */
//   getLessonProgress(courseId: string, sectionId: string, lessonId: string): Observable<ApiResponse<LessonProgress>> {
//     return this.baseApi.get<LessonProgress>(`${this.getBaseUrl(courseId, sectionId)}/${lessonId}/progress`, { showLoader: false });
//   }

//   // ==========================================
//   // FILE UPLOADS
//   // ==========================================

//   /**
//    * Upload video for lesson
//    */
//   uploadVideo(courseId: string, sectionId: string, lessonId: string, file: File): Observable<ApiResponse<{ url: string; duration: number }>> {
//     const formData = new FormData();
//     formData.append('video', file);
    
//     return this.baseApi.upload<{ url: string; duration: number }>(
//       `${this.getBaseUrl(courseId, sectionId)}/${lessonId}/upload-video`, 
//       formData, 
//       { showLoader: true }
//     );
//   }

//   /**
//    * Upload attachment for lesson
//    */
//   uploadAttachment(courseId: string, sectionId: string, lessonId: string, file: File, type: string): Observable<ApiResponse<{ url: string }>> {
//     const formData = new FormData();
//     formData.append('attachment', file);
//     formData.append('type', type);
    
//     return this.baseApi.upload<{ url: string }>(
//       `${this.getBaseUrl(courseId, sectionId)}/${lessonId}/upload-attachment`, 
//       formData, 
//       { showLoader: true }
//     );
//   }
// }
