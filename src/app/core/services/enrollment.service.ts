import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';
import { Enrollment, EnrollmentProgress } from '../models/enrollment.model';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private readonly endpoint = 'enrollments';
  private baseApi = inject(BaseApiService);

  // ==========================
  // STUDENT METHODS
  // ==========================

  /**
   * Enroll in a FREE course directly.
   * Note: Paid courses must use PaymentService.confirmPayment() to trigger enrollment.
   */
  enrollInFreeCourse(courseId: string): Observable<ApiResponse<Enrollment>> {
    return this.baseApi.post<Enrollment>(`${this.endpoint}/enroll-free`, { courseId }, { showLoader: true });
  }

  getMyEnrollments(params?: any): Observable<ApiResponse<Enrollment[]>> {
    return this.baseApi.get<Enrollment[]>(`${this.endpoint}/my-enrollments`, { params, showLoader: true });
  }

  // enrollInCourse(courseId: string): Observable<ApiResponse<any>> {
  //   return this.baseApi.post<any>(`${this.endpoint}`, { courseId }, { showLoader: true });
  // }

  checkEnrollment(courseId: string): Observable<ApiResponse<{ isEnrolled: boolean; enrollment?: Enrollment }>> {
    return this.baseApi.get<{ isEnrolled: boolean; enrollment?: Enrollment }>(`${this.endpoint}/check/${courseId}`);
  }

  updateLessonProgress(courseId: string, lessonId: string, completed: boolean, timeSpent?: number): Observable<ApiResponse<{ progress: EnrollmentProgress }>> {
    return this.baseApi.patch<{ progress: EnrollmentProgress }>(`${this.endpoint}/progress/${courseId}`, { 
      lessonId, completed, timeSpent 
    }, { showLoader: true });
  }

  getStudentTimeline(): Observable<ApiResponse<{ timeline: any[] }>> {
    return this.baseApi.get<{ timeline: any[] }>(`${this.endpoint}/timeline`, { showLoader: true });
  }

  getRecommendedCourses(limit: number = 5): Observable<ApiResponse<{ recommendations: any[] }>> {
    return this.baseApi.get<{ recommendations: any[] }>(`${this.endpoint}/recommendations`, { params: { limit } });
  }

  // ==========================
  // INSTRUCTOR / ANALYTICS
  // ==========================

  getInstructorStats(courseId?: string): Observable<ApiResponse<any>> {
    const params = courseId ? { courseId } : {};
    return this.baseApi.get(`${this.endpoint}/stats/instructor`, { params, showLoader: true });
  }

  getCourseAnalytics(courseId: string): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/analytics/${courseId}`, { showLoader: true });
  }

  exportCourseEnrollments(courseId: string, format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.baseApi.download(`${this.endpoint}/export/course/${courseId}`, { params: { format }, showLoader: true });
  }

  // ==========================
  // ADMIN METHODS
  // ==========================

  getAdminStats(): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/stats/admin`, { showLoader: true });
  }

  refundEnrollment(enrollmentId: string, reason: string): Observable<ApiResponse<Enrollment>> {
    return this.baseApi.post<Enrollment>(`${this.endpoint}/${enrollmentId}/refund`, { reason }, { showLoader: true });
  }

  enrollInCourse(courseId: string): Observable<ApiResponse<any>> {
    // 👇 Notice the added '/enroll' here
    return this.baseApi.post<any>(`${this.endpoint}/enroll`, { courseId }, { showLoader: true });
  }

  transferEnrollment(enrollmentId: string, newStudentId: string, oldStudentId: string, courseId: string): Observable<ApiResponse<Enrollment>> {
    return this.baseApi.post<Enrollment>(`${this.endpoint}/${enrollmentId}/transfer`, { 
      newStudentId, oldStudentId, courseId 
    }, { showLoader: true });
  }
}
