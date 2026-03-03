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

  transferEnrollment(enrollmentId: string, newStudentId: string, oldStudentId: string, courseId: string): Observable<ApiResponse<Enrollment>> {
    return this.baseApi.post<Enrollment>(`${this.endpoint}/${enrollmentId}/transfer`, { 
      newStudentId, oldStudentId, courseId 
    }, { showLoader: true });
  }
}


// // enrollment.service.ts
// import { Injectable, inject } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService, ApiResponse } from '../http/base-api.service';
// import { Enrollment, EnrollmentProgress } from '../models/enrollment.model';

// @Injectable({
//   providedIn: 'root'
// })
// export class EnrollmentService {
//   private readonly endpoint = 'enrollments';
//   private baseApi = inject(BaseApiService);

//   /**
//    * Get all enrollments (admin only)
//    */
//   getAllEnrollments(params?: any): Observable<ApiResponse<Enrollment[]>> {
//     return this.baseApi.get<Enrollment[]>(this.endpoint, { params, showLoader: true });
//   }

//   /**
//    * Get enrollment by ID
//    */
//   getEnrollmentById(id: string): Observable<ApiResponse<Enrollment>> {
//     return this.baseApi.get<Enrollment>(`${this.endpoint}/${id}`, { showLoader: true });
//   }

//   /**
//    * Get enrollments for current student
//    */
//   getMyEnrollments(params?: any): Observable<ApiResponse<Enrollment[]>> {
//     return this.baseApi.get<Enrollment[]>(`${this.endpoint}/my-enrollments`, { params, showLoader: true });
//   }

//   /**
//    * Check if user is enrolled in a course
//    */
//   checkEnrollment(courseId: string): Observable<ApiResponse<{ isEnrolled: boolean; enrollment?: Enrollment }>> {
//     return this.baseApi.get<{ isEnrolled: boolean; enrollment?: Enrollment }>(
//       `${this.endpoint}/check/${courseId}`
//     );
//   }

//   /**
//    * Get enrollment progress for a course
//    */
//   getEnrollmentProgress(courseId: string): Observable<ApiResponse<{ progress: EnrollmentProgress }>> {
//     return this.baseApi.get<{ progress: EnrollmentProgress }>(`${this.endpoint}/progress/${courseId}`, { showLoader: true });
//   }

//   /**
//    * Enroll in a course
//    */
//   enrollInCourse(courseId: string, paymentDetails?: any): Observable<ApiResponse<Enrollment>> {
//     return this.baseApi.post<Enrollment>(`${this.endpoint}/enroll`, { 
//       courseId, 
//       paymentDetails 
//     }, { showLoader: true });
//   }

//   /**
//    * Enroll in multiple courses (bulk enrollment)
//    */
//   bulkEnroll(courseIds: string[]): Observable<ApiResponse<{ enrollments: Enrollment[]; errors?: any[] }>> {
//     return this.baseApi.post<{ enrollments: Enrollment[]; errors?: any[] }>(
//       `${this.endpoint}/bulk-enroll`, 
//       { courseIds }, 
//       { showLoader: true }
//     );
//   }

//   /**
//    * Update lesson progress
//    */
//   updateLessonProgress(courseId: string, lessonId: string, completed: boolean, timeSpent?: number): Observable<ApiResponse<{ progress: EnrollmentProgress }>> {
//     return this.baseApi.patch<{ progress: EnrollmentProgress }>(`${this.endpoint}/progress/${courseId}`, { 
//       lessonId, 
//       completed,
//       timeSpent
//     }, { showLoader: true });
//   }

//   /**
//    * Mark course as completed
//    */
//   completeCourse(courseId: string): Observable<ApiResponse<{ certificateUrl: string; progress: EnrollmentProgress }>> {
//     return this.baseApi.post<{ certificateUrl: string; progress: EnrollmentProgress }>(
//       `${this.endpoint}/complete/${courseId}`, 
//       {}, 
//       { showLoader: true }
//     );
//   }

//   /**
//    * Get recommended next courses based on enrollment history
//    */
//   getRecommendedCourses(limit: number = 5): Observable<ApiResponse<{ recommendations: any[] }>> {
//     return this.baseApi.get<{ recommendations: any[] }>(`${this.endpoint}/recommendations`, { 
//       params: { limit }
//     });
//   }

//   /**
//    * Get enrollment timeline for current student
//    */
//   getStudentTimeline(): Observable<ApiResponse<{ timeline: any[] }>> {
//     return this.baseApi.get<{ timeline: any[] }>(`${this.endpoint}/timeline`, { showLoader: true });
//   }

//   /**
//    * Get students enrolled in a course (instructor only)
//    */
//   getCourseStudents(courseId: string, params?: any): Observable<ApiResponse<{ students: any[] }>> {
//     return this.baseApi.get<{ students: any[] }>(`${this.endpoint}/course/${courseId}/students`, { params, showLoader: true });
//   }

//   /**
//    * Get enrollment statistics for instructor
//    */
//   getInstructorStats(courseId?: string): Observable<ApiResponse<any>> {
//     const params = courseId ? { courseId } : {};
//     return this.baseApi.get(`${this.endpoint}/stats/instructor`, { params, showLoader: true });
//   }

//   /**
//    * Get enrollment analytics for a course (instructor only)
//    */
//   getCourseAnalytics(courseId: string): Observable<ApiResponse<any>> {
//     return this.baseApi.get(`${this.endpoint}/analytics/${courseId}`, { showLoader: true });
//   }

//   /**
//    * Get completion rate for a course
//    */
//   getCompletionRate(courseId: string): Observable<ApiResponse<{ rate: number; completed: number; total: number }>> {
//     return this.baseApi.get<{ rate: number; completed: number; total: number }>(
//       `${this.endpoint}/completion-rate/${courseId}`
//     );
//   }

//   /**
//    * Get active enrollments count
//    */
//   getActiveEnrollmentsCount(courseId?: string): Observable<ApiResponse<{ count: number }>> {
//     const endpoint = courseId 
//       ? `${this.endpoint}/count/${courseId}`
//       : `${this.endpoint}/count`;
//     return this.baseApi.get<{ count: number }>(endpoint);
//   }

//   /**
//    * Send reminder to students (instructor only)
//    */
//   sendReminder(courseId: string, message: string): Observable<ApiResponse<any>> {
//     return this.baseApi.post(`${this.endpoint}/remind/${courseId}`, { message }, { showLoader: true });
//   }

//   /**
//    * Export enrollment data for a course (instructor only)
//    */
//   exportCourseEnrollments(courseId: string, format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
//     return this.baseApi.download(`${this.endpoint}/export/course/${courseId}`, { 
//       params: { format },
//       showLoader: true,
//       timeoutMs: 60000
//     });
//   }

//   /**
//    * Get enrollment statistics for admin
//    */
//   getAdminStats(params?: any): Observable<ApiResponse<any>> {
//     return this.baseApi.get(`${this.endpoint}/stats/admin`, { params, showLoader: true });
//   }

//   /**
//    * Get enrollment trends (admin only)
//    */
//   getEnrollmentTrends(params?: any): Observable<ApiResponse<{ trends: any[] }>> {
//     return this.baseApi.get<{ trends: any[] }>(`${this.endpoint}/trends`, { params, showLoader: true });
//   }

//   /**
//    * Generate enrollment report (admin only)
//    */
//   generateReport(params?: any, format: 'pdf' | 'csv' = 'pdf'): Observable<Blob> {
//     return this.baseApi.download(`${this.endpoint}/report`, {
//       params: { ...params, format },
//       showLoader: true,
//       timeoutMs: 180000 // 3 minutes for large reports
//     });
//   }

//   /**
//    * Export all enrollments (admin only)
//    */
//   exportAllEnrollments(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
//     return this.baseApi.download(`${this.endpoint}/export`, {
//       params: { format },
//       showLoader: true,
//       timeoutMs: 120000
//     });
//   }

//   /**
//    * Cancel enrollment (admin only)
//    */
//   cancelEnrollment(enrollmentId: string, reason?: string): Observable<ApiResponse<Enrollment>> {
//     return this.baseApi.patch<Enrollment>(`${this.endpoint}/${enrollmentId}/cancel`, { reason }, { showLoader: true });
//   }

//   /**
//    * Refund enrollment (admin only)
//    */
//   refundEnrollment(enrollmentId: string, reason?: string): Observable<ApiResponse<Enrollment>> {
//     return this.baseApi.post<Enrollment>(`${this.endpoint}/${enrollmentId}/refund`, { reason }, { showLoader: true });
//   }

//   /**
//    * Transfer enrollment to another student (admin only)
//    */
//   transferEnrollment(enrollmentId: string, newStudentId: string, oldStudentId?: string): Observable<ApiResponse<Enrollment>> {
//     return this.baseApi.post<Enrollment>(`${this.endpoint}/${enrollmentId}/transfer`, { 
//       newStudentId,
//       oldStudentId 
//     }, { showLoader: true });
//   }

//   /**
//    * Get enrollment invoices
//    */
//   getInvoices(enrollmentId: string): Observable<ApiResponse<{ invoices: any[] }>> {
//     return this.baseApi.get<{ invoices: any[] }>(`${this.endpoint}/${enrollmentId}/invoices`);
//   }

//   /**
//    * Get enrollment certificate
//    */
//   getCertificate(enrollmentId: string): Observable<Blob> {
//     return this.baseApi.download(`${this.endpoint}/${enrollmentId}/certificate`, {
//       showLoader: true,
//       timeoutMs: 60000
//     });
//   }}