// enrollment.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';

export interface Enrollment {
  _id: string;
  student: string | any;
  course: string | any;
  enrolledAt: string;
  completedAt?: string;
  isActive: boolean;
  progress: number;
  completedLessons: string[];
  lastAccessedAt: string;
  certificateIssued?: boolean;
  certificateUrl?: string;
  paymentDetails?: {
    amount: number;
    currency: string;
    transactionId: string;
    paymentMethod: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentProgress {
  enrollmentId: string;
  courseId: string;
  studentId: string;
  progress: number;
  completedLessons: string[];
  lastLessonId?: string;
  lastLessonAt?: string;
  estimatedCompletionDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private readonly endpoint = 'enrollments';
  private baseApi = inject(BaseApiService);

  /**
   * Get all enrollments (admin only)
   */
  getAllEnrollments(params?: any): Observable<ApiResponse<Enrollment[]>> {
    return this.baseApi.get<Enrollment[]>(this.endpoint, { params, showLoader: true });
  }

  /**
   * Get enrollments for current student
   */
  getMyEnrollments(params?: any): Observable<ApiResponse<Enrollment[]>> {
    return this.baseApi.get<Enrollment[]>(`${this.endpoint}/my-enrollments`, { params, showLoader: true });
  }

  /**
   * Get enrollment by ID
   */
  getEnrollmentById(id: string): Observable<ApiResponse<Enrollment>> {
    return this.baseApi.get<Enrollment>(`${this.endpoint}/${id}`, { showLoader: true });
  }

  /**
   * Get enrollment for a specific course (current user)
   */
  getCourseEnrollment(courseId: string): Observable<ApiResponse<Enrollment>> {
    return this.baseApi.get<Enrollment>(`${this.endpoint}/course/${courseId}`, { showLoader: true });
  }

  /**
   * Enroll in a course
   */
  enrollInCourse(courseId: string, paymentDetails?: any): Observable<ApiResponse<Enrollment>> {
    return this.baseApi.post<Enrollment>(`${this.endpoint}/enroll`, { 
      courseId, 
      paymentDetails 
    }, { showLoader: true });
  }

  /**
   * Enroll in multiple courses (bulk enrollment)
   */
  bulkEnroll(courseIds: string[]): Observable<ApiResponse<Enrollment[]>> {
    return this.baseApi.post<Enrollment[]>(`${this.endpoint}/bulk-enroll`, { courseIds }, { showLoader: true });
  }

  /**
   * Get enrollment progress for a course
   */
  getEnrollmentProgress(courseId: string): Observable<ApiResponse<EnrollmentProgress>> {
    return this.baseApi.get<EnrollmentProgress>(`${this.endpoint}/progress/${courseId}`, { showLoader: true });
  }

  /**
   * Update lesson progress
   */
  updateLessonProgress(courseId: string, lessonId: string, completed: boolean): Observable<ApiResponse<EnrollmentProgress>> {
    return this.baseApi.patch<EnrollmentProgress>(`${this.endpoint}/progress/${courseId}`, { 
      lessonId, 
      completed 
    }, { showLoader: true });
  }

  /**
   * Mark course as completed
   */
  completeCourse(courseId: string): Observable<ApiResponse<{ certificateUrl: string }>> {
    return this.baseApi.post<{ certificateUrl: string }>(`${this.endpoint}/complete/${courseId}`, {}, { showLoader: true });
  }

  /**
   * Get enrollment statistics for instructor
   */
  getInstructorStats(courseId?: string): Observable<ApiResponse<any>> {
    const endpoint = courseId 
      ? `${this.endpoint}/stats/course/${courseId}`
      : `${this.endpoint}/stats/instructor`;
    return this.baseApi.get(endpoint, { showLoader: true });
  }

  /**
   * Get enrollment statistics for admin
   */
  getAdminStats(params?: any): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/stats/admin`, { params, showLoader: true });
  }

  /**
   * Get students enrolled in a course (instructor only)
   */
  getCourseStudents(courseId: string, params?: any): Observable<ApiResponse<any[]>> {
    return this.baseApi.get(`${this.endpoint}/course/${courseId}/students`, { params, showLoader: true });
  }

  /**
   * Cancel enrollment (admin or instructor)
   */
  cancelEnrollment(enrollmentId: string, reason?: string): Observable<ApiResponse<Enrollment>> {
    return this.baseApi.patch<Enrollment>(`${this.endpoint}/${enrollmentId}/cancel`, { reason }, { showLoader: true });
  }

  /**
   * Refund enrollment
   */
  refundEnrollment(enrollmentId: string, reason?: string): Observable<ApiResponse<Enrollment>> {
    return this.baseApi.post<Enrollment>(`${this.endpoint}/${enrollmentId}/refund`, { reason }, { showLoader: true });
  }

  /**
   * Check if user is enrolled in a course
   */
  checkEnrollment(courseId: string): Observable<ApiResponse<{ isEnrolled: boolean; enrollment?: Enrollment }>> {
    return this.baseApi.get<{ isEnrolled: boolean; enrollment?: Enrollment }>(
      `${this.endpoint}/check/${courseId}`
    );
  }

  /**
   * Get enrollment certificate
   */
  getCertificate(enrollmentId: string): Observable<Blob> {
    return this.baseApi.download(`${this.endpoint}/${enrollmentId}/certificate`, {
      showLoader: true,
      timeoutMs: 60000
    });
  }

  /**
   * Get enrollment analytics for a course
   */
  getCourseAnalytics(courseId: string): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/analytics/${courseId}`, { showLoader: true });
  }

  /**
   * Export enrollment data
   */
  exportEnrollments(courseId?: string, format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    const endpoint = courseId 
      ? `${this.endpoint}/export/course/${courseId}`
      : `${this.endpoint}/export`;
    return this.baseApi.download(endpoint, { 
      params: { format },
      showLoader: true,
      timeoutMs: 120000
    });
  }

  /**
   * Get enrollment trends
   */
  getEnrollmentTrends(params?: any): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/trends`, { params, showLoader: true });
  }

  /**
   * Get completion rate for a course
   */
  getCompletionRate(courseId: string): Observable<ApiResponse<{ rate: number; completed: number; total: number }>> {
    return this.baseApi.get(`${this.endpoint}/completion-rate/${courseId}`);
  }

  /**
   * Get active enrollments count
   */
  getActiveEnrollmentsCount(courseId?: string): Observable<ApiResponse<{ count: number }>> {
    const endpoint = courseId 
      ? `${this.endpoint}/count/${courseId}`
      : `${this.endpoint}/count`;
    return this.baseApi.get(endpoint);
  }

  /**
   * Send reminder to students
   */
  sendReminder(courseId: string, message: string): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/remind/${courseId}`, { message }, { showLoader: true });
  }

  /**
   * Get recommended next courses based on enrollment history
   */
  getRecommendedCourses(limit: number = 5): Observable<ApiResponse<any[]>> {
    return this.baseApi.get(`${this.endpoint}/recommendations`, { 
      params: { limit },
      showLoader: true 
    });
  }

  /**
   * Get enrollment timeline for a student
   */
  getStudentTimeline(studentId: string): Observable<ApiResponse<any[]>> {
    return this.baseApi.get(`${this.endpoint}/timeline/${studentId}`, { showLoader: true });
  }

  /**
   * Transfer enrollment to another student (admin only)
   */
  transferEnrollment(enrollmentId: string, newStudentId: string): Observable<ApiResponse<Enrollment>> {
    return this.baseApi.post<Enrollment>(`${this.endpoint}/${enrollmentId}/transfer`, { 
      newStudentId 
    }, { showLoader: true });
  }

  /**
   * Get enrollment invoices
   */
  getInvoices(enrollmentId: string): Observable<ApiResponse<any[]>> {
    return this.baseApi.get(`${this.endpoint}/${enrollmentId}/invoices`);
  }

  /**
   * Generate enrollment report
   */
  generateReport(params?: any): Observable<Blob> {
    return this.baseApi.download(`${this.endpoint}/report`, {
      params,
      showLoader: true,
      timeoutMs: 180000 // 3 minutes for large reports
    });
  }
}