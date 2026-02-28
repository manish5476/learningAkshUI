// lesson.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';
import { Lesson } from '../models/course.model';

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  watchTime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LessonService {
  private readonly endpoint = 'lessons';
  private baseApi = inject(BaseApiService);

  /**
   * Get all lessons (with filters)
   */
  getAll(params?: any): Observable<ApiResponse<any>> {
    return this.baseApi.get<Lesson[]>(this.endpoint, { params });
  }

  /**
   * Get lessons by section
   */
  getLessonsBySection(sectionId: string): Observable<ApiResponse<Lesson[]>> {
    return this.baseApi.get<Lesson[]>(`sections/${sectionId}/lessons`, { showLoader: true });
  }

  /**
   * Get single lesson by ID
   */
  getById(id: string): Observable<ApiResponse<Lesson>> {
    return this.baseApi.get<Lesson>(`${this.endpoint}/${id}`, { showLoader: true });
  }

  /**
   * Get lesson with access control (for students)
   */
  getLessonWithAccess(id: string): Observable<ApiResponse<Lesson>> {
    return this.baseApi.get<Lesson>(`${this.endpoint}/${id}/access`, { 
      showLoader: true,
      skipAuth: false // Auth required for access check
    });
  }

  /**
   * Create new lesson
   */
  create(data: Partial<Lesson>): Observable<ApiResponse<Lesson>> {
    return this.baseApi.post<Lesson>(this.endpoint, data, { showLoader: true });
  }

  /**
   * Update lesson
   */
  update(id: string, data: Partial<Lesson>): Observable<ApiResponse<Lesson>> {
    return this.baseApi.patch<Lesson>(`${this.endpoint}/${id}`, data, { showLoader: true });
  }

  /**
   * Delete lesson
   */
  delete(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete<null>(`${this.endpoint}/${id}`, { showLoader: true });
  }

  /**
   * Reorder lessons within a section
   */
  reorderLessons(sectionId: string, lessons: Array<{ id: string; order: number }>): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/reorder/${sectionId}`, { lessons }, { showLoader: true });
  }

  /**
   * Mark lesson as completed by student
   */
  markAsCompleted(lessonId: string): Observable<ApiResponse<LessonProgress>> {
    return this.baseApi.post<LessonProgress>(`${this.endpoint}/${lessonId}/complete`, {}, { showLoader: true });
  }

  /**
   * Get lesson progress for student
   */
  getLessonProgress(lessonId: string): Observable<ApiResponse<LessonProgress>> {
    return this.baseApi.get<LessonProgress>(`${this.endpoint}/${lessonId}/progress`, { showLoader: true });
  }

  /**
   * Upload video for lesson
   */
  uploadVideo(lessonId: string, file: File): Observable<ApiResponse<{ url: string; duration: number }>> {
    const formData = new FormData();
    formData.append('video', file);
    
    return this.baseApi.upload<{ url: string; duration: number }>(
      `${this.endpoint}/${lessonId}/upload-video`, 
      formData, 
      { showLoader: true }
    );
  }

  /**
   * Upload attachment for lesson
   */
  uploadAttachment(lessonId: string, file: File, type: string): Observable<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('attachment', file);
    formData.append('type', type);
    
    return this.baseApi.upload<{ url: string }>(
      `${this.endpoint}/${lessonId}/upload-attachment`, 
      formData, 
      { showLoader: true }
    );
  }

  /**
   * Download resource
   */
  downloadResource(lessonId: string, resourceId: string): Observable<Blob> {
    return this.baseApi.download(`${this.endpoint}/${lessonId}/resources/${resourceId}/download`, {
      showLoader: true,
      timeoutMs: 60000 // Longer timeout for downloads
    });
  }
}