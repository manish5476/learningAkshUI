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
  getAllCourses(params?: CourseQueryParams): Observable<ApiResponse<any>> {
    return this.baseApi.get<Course[]>(this.endpoint, { params });
  }

  getCoursesById(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.get<Course>(`${this.endpoint}/${id}`);
  }

  getCoursesBySlug(slug: string): Observable<ApiResponse<CourseWithContent>> {
    return this.baseApi.get<CourseWithContent>(`${this.endpoint}/slug/${slug}`);
  }

  // ==================== INSTRUCTOR ROUTES ====================
  getInstructorCourses(): Observable<ApiResponse<any>> {
    return this.baseApi.get<Course[]>(`${this.endpoint}/instructor/my-courses`);
  }

  // Add this inside course.service.ts
getInstructorCourseById(courseId: string) {
  // Notice the URL specifically hits our new VIP instructor route
  return this.baseApi.get(`${this.endpoint}/instructor/courses/${courseId}`);
}
  publishCourses(id: string): Observable<ApiResponse<Course>> {
    return this.baseApi.patch<Course>(`${this.endpoint}/${id}/publish`, {}, { showLoader: true });
  }
  createCourses(data: CourseFormData): Observable<ApiResponse<{ course: Course }>> {
    return this.baseApi.post<{ course: Course }>(this.endpoint, data, { showLoader: true });
  }

  updateCourses(id: string, data: Partial<CourseFormData>): Observable<ApiResponse<Course>> {
    return this.baseApi.patch<Course>(`${this.endpoint}/${id}`, data, { showLoader: true });
  }

  deleteCourses(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete<null>(`${this.endpoint}/${id}`, { showLoader: true });
  }



  // ==================== ADMIN ROUTES ====================
  approveCourses(id: string): Observable<ApiResponse<Course>> {
    return this.baseApi.patch<Course>(`${this.endpoint}/${id}/approve`, {}, { showLoader: true });
  }

  // =======================================================
  // ================= NEW PRO-LEVEL ROUTES ================
  // =======================================================

  /**
   * Fetch top-rated courses for the storefront homepage
   */
  getTopRatedCourses(limit: number = 8): Observable<ApiResponse<any>> {
    return this.baseApi.get<Course[]>(`${this.endpoint}/top-rated`, { params: { limit } });
  }

  getCourseAnalytics(courseId: string): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/analytics/${courseId}`, { showLoader: true });
  }
  /**
   * Fetch related courses based on the current course's category
   */
  getRelatedCourses(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.get<Course[]>(`${this.endpoint}/${id}/related`);
  }

  /**
   * Get enrolled students for a specific course (Instructor Dashboard)
   */
  getCourseStudents(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.get<any[]>(`${this.endpoint}/instructor/${id}/students`);
  }

  /**
   * Get total revenue and student count for a specific course (Instructor Dashboard)
   */
  getCourseStats(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.get<any>(`${this.endpoint}/instructor/${id}/stats`);
  }

  /**
   * Deep clone a course, including all sections and lessons
   */
  cloneCourse(id: string): Observable<ApiResponse<{ course: Course }>> {
    return this.baseApi.post<{ course: Course }>(`${this.endpoint}/instructor/${id}/clone`, {}, { showLoader: true });
  }

  /**
   * Revert a published course back to draft status
   */
  unpublishCourses(id: string): Observable<ApiResponse<Course>> {
    return this.baseApi.patch<Course>(`${this.endpoint}/${id}/unpublish`, {}, { showLoader: true });
  }
}

