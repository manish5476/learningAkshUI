import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponseWithPagination, ApiResponse } from '../http/base-api.service';

// --- Optional: Define your interfaces here for strict typing ---
export interface Course {
  _id?: string;
  title: string;
  // add other course properties...
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  // Base route for course endpoints
  private readonly endpoint = 'courses';

  constructor(private api: BaseApiService) { }

  // ==================== PUBLIC ROUTES ====================

  getPublishedCourses(options?: any): Observable<ApiResponseWithPagination<Course[]>> {
    return this.api.getWithPagination<Course[]>(`${this.endpoint}/published`, { ...options, skipAuth: true });
  }

  getCourseMasterData(options?: any): Observable<ApiResponse<any>> {
    return this.api.get<any>(`${this.endpoint}/master-data`, { ...options, skipAuth: true });
  }

  getCourseStructure(id: string, options?: any): Observable<ApiResponse<any>> {
    return this.api.get<any>(`${this.endpoint}/${id}/structure`, { ...options, skipAuth: true });
  }

  getCourseById(id: string, options?: any): Observable<ApiResponse<Course>> {
    return this.api.get<Course>(`${this.endpoint}/${id}`, { ...options, skipAuth: true });
  }

  getAllCourses(options?: any): Observable<ApiResponseWithPagination<Course[]>> {
    return this.api.getWithPagination<Course[]>(this.endpoint, { ...options, skipAuth: true });
  }

  // ==================== PROTECTED ROUTES ====================

  // --- Instructor's Courses ---

  getMyInstructorCourses(options?: any): Observable<ApiResponseWithPagination<Course[]>> {
    return this.api.getWithPagination<Course[]>(`${this.endpoint}/instructor/my-courses`, options);
  }

  getCoursesBySlug(slug: string): Observable<ApiResponse<any>> {
    return this.api.get<any>(`${this.endpoint}/slug/${slug}`);
  }

  getquizzesBySlug(slug: string): Observable<ApiResponse<any>> {
    return this.api.get<any>(`${this.endpoint}/slug/${slug}/quizzes`);
  }

  // --- Course CRUD ---

  createCourse(data: Partial<Course>, options?: any): Observable<ApiResponse<Course>> {
    return this.api.post<Course>(this.endpoint, data, options);
  }

  updateCourse(id: string, data: Partial<Course>, options?: any): Observable<ApiResponse<Course>> {
    return this.api.patch<Course>(`${this.endpoint}/${id}`, data, options);
  }

  // --- Publish/Unpublish Routes ---

  publishCourse(id: string, options?: any): Observable<ApiResponse<Course>> {
    return this.api.patch<Course>(`${this.endpoint}/${id}/publish`, {}, options);
  }

  unpublishCourse(id: string, options?: any): Observable<ApiResponse<Course>> {
    return this.api.patch<Course>(`${this.endpoint}/${id}/unpublish`, {}, options);
  }

  togglePublishStatus(id: string, options?: any): Observable<ApiResponse<Course>> {
    return this.api.patch<Course>(`${this.endpoint}/${id}/toggle-publish`, {}, options);
  }

  // --- Bulk Publish/Unpublish Routes ---

  bulkPublishCourses(courseIds: string[], options?: any): Observable<ApiResponse<any>> {
    return this.api.post<any>(`${this.endpoint}/bulk/publish`, { courseIds }, options);
  }

  bulkUnpublishCourses(courseIds: string[], options?: any): Observable<ApiResponse<any>> {
    return this.api.post<any>(`${this.endpoint}/bulk/unpublish`, { courseIds }, options);
  }

  // --- Approval Routes ---

  approveCourse(id: string, options?: any): Observable<ApiResponse<Course>> {
    return this.api.patch<Course>(`${this.endpoint}/${id}/approve`, {}, options);
  }

  rejectCourse(id: string, reason?: string, options?: any): Observable<ApiResponse<Course>> {
    return this.api.patch<Course>(`${this.endpoint}/${id}/reject`, { reason }, options);
  }

  // --- Instructor Management Routes ---

  addInstructor(courseId: string, data: any, options?: any): Observable<ApiResponse<any>> {
    return this.api.post<any>(`${this.endpoint}/${courseId}/instructors`, data, options);
  }

  updateInstructorPermissions(courseId: string, instructorId: string, permissions: any, options?: any): Observable<ApiResponse<any>> {
    return this.api.patch<any>(`${this.endpoint}/${courseId}/instructors/${instructorId}/permissions`, permissions, options);
  }

  removeInstructor(courseId: string, instructorId: string, options?: any): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`${this.endpoint}/${courseId}/instructors/${instructorId}`, options);
  }

  getCourseInstructors(courseId: string, options?: any): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>(`${this.endpoint}/${courseId}/instructors`, options);
  }

  // --- Invitation Routes ---

  createInvitation(courseId: string, data: any, options?: any): Observable<ApiResponse<any>> {
    return this.api.post<any>(`${this.endpoint}/${courseId}/invitations`, data, options);
  }

  getCourseInvitations(courseId: string, options?: any): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>(`${this.endpoint}/${courseId}/invitations`, options);
  }

  acceptInvitation(tokenOrData: any, options?: any): Observable<ApiResponse<any>> {
    return this.api.post<any>(`${this.endpoint}/invitations/accept`, tokenOrData, options);
  }

  revokeInvitation(invitationId: string, options?: any): Observable<ApiResponse<any>> {
    return this.api.patch<any>(`${this.endpoint}/invitations/${invitationId}/revoke`, {}, options);
  }

  // --- Analytics ---

  getCourseAnalytics(id: string, options?: any): Observable<ApiResponse<any>> {
    return this.api.get<any>(`${this.endpoint}/${id}/analytics`, options);
  }

  // --- Delete/Restore ---

  deleteCourse(id: string, options?: any): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`${this.endpoint}/${id}`, options);
  }

  restoreCourse(id: string, options?: any): Observable<ApiResponse<Course>> {
    return this.api.patch<Course>(`${this.endpoint}/${id}/restore`, {}, options);
  }

  // --- Bulk Operations ---

  bulkCreateCourses(courses: Partial<Course>[], options?: any): Observable<ApiResponse<Course[]>> {
    return this.api.post<Course[]>(`${this.endpoint}/bulk/create`, { courses }, options);
  }

  bulkUpdateCourses(courses: Partial<Course>[], options?: any): Observable<ApiResponse<Course[]>> {
    return this.api.patch<Course[]>(`${this.endpoint}/bulk/update`, { courses }, options);
  }

  bulkDeleteCourses(courseIds: string[], options?: any): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`${this.endpoint}/bulk/delete`, { ...options, body: { courseIds } });
  }

  countCourses(options?: any): Observable<ApiResponse<{ total: number }>> {
    return this.api.get<{ total: number }>(`${this.endpoint}/count/total`, options);
  }
}


// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService, ApiResponse } from '../http/base-api.service';
// import { Course, CourseFormData, CourseWithContent, CourseQueryParams, Section, Lesson } from '../models/course.model';

// @Injectable({
//   providedIn: 'root'
// })
// export class CourseService {
//   private readonly endpoint = 'courses';

//   constructor(private baseApi: BaseApiService) {}

//   // ==================== PUBLIC ROUTES ====================
//   getAllCourses(params?: CourseQueryParams): Observable<ApiResponse<any>> {
//     return this.baseApi.get<Course[]>(this.endpoint, { params });
//   }

//   getCoursesById(id: string): Observable<ApiResponse<any>> {
//     return this.baseApi.get<Course>(`${this.endpoint}/${id}`);
//   }


//   // ==================== INSTRUCTOR ROUTES ====================
//   getInstructorCourses(): Observable<ApiResponse<any>> {
//     return this.baseApi.get<Course[]>(`${this.endpoint}/instructor/my-courses`);
//   }

//   // Add this inside course.service.ts
// getInstructorCourseById(courseId: string) {
//   // Notice the URL specifically hits our new VIP instructor route
//   return this.baseApi.get(`${this.endpoint}/instructor/courses/${courseId}`);
// }
//   publishCourses(id: string): Observable<ApiResponse<Course>> {
//     return this.baseApi.patch<Course>(`${this.endpoint}/${id}/publish`, {}, { showLoader: true });
//   }
//   createCourses(data: CourseFormData): Observable<ApiResponse<{ course: Course }>> {
//     return this.baseApi.post<{ course: Course }>(this.endpoint, data, { showLoader: true });
//   }

//   updateCourses(id: string, data: Partial<CourseFormData>): Observable<ApiResponse<Course>> {
//     return this.baseApi.patch<Course>(`${this.endpoint}/${id}`, data, { showLoader: true });
//   }

//   deleteCourses(id: string): Observable<ApiResponse<null>> {
//     return this.baseApi.delete<null>(`${this.endpoint}/${id}`, { showLoader: true });
//   }



//   // ==================== ADMIN ROUTES ====================
//   approveCourses(id: string): Observable<ApiResponse<Course>> {
//     return this.baseApi.patch<Course>(`${this.endpoint}/${id}/approve`, {}, { showLoader: true });
//   }

//   // =======================================================
//   // ================= NEW PRO-LEVEL ROUTES ================
//   // =======================================================

//   /**
//    * Fetch top-rated courses for the storefront homepage
//    */
//   getTopRatedCourses(limit: number = 8): Observable<ApiResponse<any>> {
//     return this.baseApi.get<Course[]>(`${this.endpoint}/top-rated`, { params: { limit } });
//   }

//   getCourseAnalytics(courseId: string): Observable<ApiResponse<any>> {
//     return this.baseApi.get(`${this.endpoint}/analytics/${courseId}`, { showLoader: true });
//   }
//   /**
//    * Fetch related courses based on the current course's category
//    */
//   getRelatedCourses(id: string): Observable<ApiResponse<any>> {
//     return this.baseApi.get<Course[]>(`${this.endpoint}/${id}/related`);
//   }

//   /**
//    * Get enrolled students for a specific course (Instructor Dashboard)
//    */
//   getCourseStudents(id: string): Observable<ApiResponse<any>> {
//     return this.baseApi.get<any[]>(`${this.endpoint}/instructor/${id}/students`);
//   }

//   /**
//    * Get total revenue and student count for a specific course (Instructor Dashboard)
//    */
//   getCourseStats(id: string): Observable<ApiResponse<any>> {
//     return this.baseApi.get<any>(`${this.endpoint}/instructor/${id}/stats`);
//   }

//   /**
//    * Deep clone a course, including all sections and lessons
//    */
//   cloneCourse(id: string): Observable<ApiResponse<{ course: Course }>> {
//     return this.baseApi.post<{ course: Course }>(`${this.endpoint}/instructor/${id}/clone`, {}, { showLoader: true });
//   }

//   /**
//    * Revert a published course back to draft status
//    */
//   unpublishCourses(id: string): Observable<ApiResponse<Course>> {
//     return this.baseApi.patch<Course>(`${this.endpoint}/${id}/unpublish`, {}, { showLoader: true });
//   }
// }

