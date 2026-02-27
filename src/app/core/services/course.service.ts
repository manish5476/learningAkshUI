import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';
import { Course, CourseFormData, CourseWithContent, CourseQueryParams, Section, Lesson } from '../models/course.model';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private readonly endpoint = 'courses';

  constructor(private baseApi: BaseApiService) {}

  // ==================== PUBLIC ROUTES ====================

  getAll(params?: CourseQueryParams): Observable<ApiResponse<Course[]>> {
    return this.baseApi.get<Course[]>(this.endpoint, { params });
  }

  search(params?: CourseQueryParams): Observable<ApiResponse<Course[]>> {
    return this.baseApi.get<Course[]>(`${this.endpoint}/search`, { params });
  }

  getById(id: string): Observable<ApiResponse<Course>> {
    return this.baseApi.get<Course>(`${this.endpoint}/${id}`);
  }

  getBySlug(slug: string): Observable<ApiResponse<CourseWithContent>> {
    return this.baseApi.get<CourseWithContent>(`${this.endpoint}/slug/${slug}`);
  }

  // ==================== INSTRUCTOR ROUTES ====================

  getMyCourses(): Observable<ApiResponse<Course[]>> {
    return this.baseApi.get<Course[]>(`${this.endpoint}/instructor/my-courses`);
  }

  create(data: CourseFormData): Observable<ApiResponse<{ course: Course }>> {
    return this.baseApi.post<{ course: Course }>(this.endpoint, data, { showLoader: true });
  }

  update(id: string, data: Partial<CourseFormData>): Observable<ApiResponse<Course>> {
    return this.baseApi.patch<Course>(`${this.endpoint}/${id}`, data, { showLoader: true });
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete<null>(`${this.endpoint}/${id}`, { showLoader: true });
  }

  publish(id: string): Observable<ApiResponse<Course>> {
    return this.baseApi.patch<Course>(`${this.endpoint}/${id}/publish`, {}, { showLoader: true });
  }

  // ==================== ADMIN ROUTES ====================

  approve(id: string): Observable<ApiResponse<Course>> {
    return this.baseApi.patch<Course>(`${this.endpoint}/${id}/approve`, {}, { showLoader: true });
  }

  // ==================== SECTION ROUTES ====================

  getSections(courseId: string): Observable<ApiResponse<Section[]>> {
    return this.baseApi.get<Section[]>(`${this.endpoint}/${courseId}/sections`);
  }

  createSection(courseId: string, data: any): Observable<ApiResponse<Section>> {
    return this.baseApi.post<Section>(`${this.endpoint}/${courseId}/sections`, data, { showLoader: true });
  }

  updateSection(courseId: string, sectionId: string, data: any): Observable<ApiResponse<Section>> {
    return this.baseApi.patch<Section>(`${this.endpoint}/${courseId}/sections/${sectionId}`, data);
  }

  deleteSection(courseId: string, sectionId: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${courseId}/sections/${sectionId}`);
  }

  reorderSections(courseId: string, data: any): Observable<ApiResponse<null>> {
    return this.baseApi.post(`sections/reorder/${courseId}`, data);
  }

  // ==================== LESSON ROUTES ====================

  getLessons(courseId: string, sectionId: string): Observable<ApiResponse<Lesson[]>> {
    return this.baseApi.get<Lesson[]>(`${this.endpoint}/${courseId}/sections/${sectionId}/lessons`);
  }

  createLesson(courseId: string, sectionId: string, data: any): Observable<ApiResponse<Lesson>> {
    return this.baseApi.post<Lesson>(`${this.endpoint}/${courseId}/sections/${sectionId}/lessons`, data, { showLoader: true });
  }

  updateLesson(courseId: string, sectionId: string, lessonId: string, data: any): Observable<ApiResponse<Lesson>> {
    return this.baseApi.patch<Lesson>(`${this.endpoint}/${courseId}/sections/${sectionId}/lessons/${lessonId}`, data);
  }

  deleteLesson(courseId: string, sectionId: string, lessonId: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${courseId}/sections/${sectionId}/lessons/${lessonId}`);
  }

  reorderLessons(sectionId: string, data: any): Observable<ApiResponse<null>> {
    return this.baseApi.post(`lessons/reorder/${sectionId}`, data);
  }
}