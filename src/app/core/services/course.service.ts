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

//   // -------- remaing
//   searchCourses(params?: CourseQueryParams): Observable<ApiResponse<Course[]>> {
//     return this.baseApi.get<Course[]>(`${this.endpoint}/search`, { params });
//   }

//   getCoursesById(id: string): Observable<ApiResponse<any>> {
//     return this.baseApi.get<Course>(`${this.endpoint}/${id}`);
//   }

//   getCoursesBySlug(slug: string): Observable<ApiResponse<CourseWithContent>> {
//     return this.baseApi.get<CourseWithContent>(`${this.endpoint}/slug/${slug}`);
//   }

//   // ==================== INSTRUCTOR ROUTES ====================
//   getMyCourses(): Observable<ApiResponse<any>> {
//     return this.baseApi.get<Course[]>(`${this.endpoint}/instructor/my-courses`);
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

//   publishCourses(id: string): Observable<ApiResponse<Course>> {
//     return this.baseApi.patch<Course>(`${this.endpoint}/${id}/publish`, {}, { showLoader: true });
//   }

//   // ==================== ADMIN ROUTES ====================
//   approveCourses(id: string): Observable<ApiResponse<Course>> {
//     return this.baseApi.patch<Course>(`${this.endpoint}/${id}/approve`, {}, { showLoader: true });
//   }
// }

// // <!-- Student/Instructor Menu -->
// // <li>
// //   <a routerLink="/certificates/my-certificates" routerLinkActive="active">
// //     <i class="pi pi-certificate"></i>
// //     <span>My Certificates</span>
// //     @if (newCertificatesCount() > 0) {
// //       <span class="badge">{{ newCertificatesCount() }}</span>
// //     }
// //   </a>
// // </li>

// // <!-- Admin Menu -->
// // <li>
// //   <a routerLink="/certificates/admin" routerLinkActive="active">
// //     <i class="pi pi-shield"></i>
// //     <span>Certificate Management</span>
// //   </a>
// // </li>

// // <!-- Public Footer Link -->
// // <li>
// //   <a routerLink="/certificates/verify" routerLinkActive="active">
// //     <i class="pi pi-qrcode"></i>
// //     <span>Verify Certificate</span>
// //   </a>
// // </li>

// // In your enrollment/course service
// // generateCertificate(courseId: string, studentId: string, progress: any): Observable<any> {
// //   const payload = {
// //     course: courseId,
// //     student: studentId,
// //     grade: this.calculateGrade(progress),
// //     percentage: progress.courseProgressPercentage,
// //     issueDate: new Date()
// //   };
  
// //   return this.http.post(`${this.baseUrl}/certificates/generate`, payload);
// // }


//   // ==================== SECTION ROUTES ====================

//   // getCoursesSections(courseId: string): Observable<ApiResponse<Section[]>> {
//   //   return this.baseApi.get<Section[]>(`${this.endpoint}/${courseId}/sections`);
//   // }

//   // createCoursesSection(courseId: string, data: any): Observable<ApiResponse<Section>> {
//   //   return this.baseApi.post<Section>(`${this.endpoint}/${courseId}/sections`, data, { showLoader: true });
//   // }

//   // updateCoursesSection(courseId: string, sectionId: string, data: any): Observable<ApiResponse<Section>> {
//   //   return this.baseApi.patch<Section>(`${this.endpoint}/${courseId}/sections/${sectionId}`, data);
//   // }

//   // deleteCoursesSection(courseId: string, sectionId: string): Observable<ApiResponse<null>> {
//   //   return this.baseApi.delete(`${this.endpoint}/${courseId}/sections/${sectionId}`);
//   // }

//   // reorderCoursesSections(courseId: string, data: any): Observable<ApiResponse<null>> {
//   //   return this.baseApi.post(`sections/reorder/${courseId}`, data);
//   // }

//   // ==================== LESSON ROUTES ====================

//   // getCoursesLessons(courseId: string, sectionId: string): Observable<ApiResponse<Lesson[]>> {
//   //   return this.baseApi.get<Lesson[]>(`${this.endpoint}/${courseId}/sections/${sectionId}/lessons`);
//   // }

//   // createCoursesLesson(courseId: string, sectionId: string, data: any): Observable<ApiResponse<Lesson>> {
//   //   return this.baseApi.post<Lesson>(`${this.endpoint}/${courseId}/sections/${sectionId}/lessons`, data, { showLoader: true });
//   // }

//   // updateCoursesLesson(courseId: string, sectionId: string, lessonId: string, data: any): Observable<ApiResponse<Lesson>> {
//   //   return this.baseApi.patch<Lesson>(`${this.endpoint}/${courseId}/sections/${sectionId}/lessons/${lessonId}`, data);
//   // }

//   // deleteCoursesLesson(courseId: string, sectionId: string, lessonId: string): Observable<ApiResponse<null>> {
//   //   return this.baseApi.delete(`${this.endpoint}/${courseId}/sections/${sectionId}/lessons/${lessonId}`);
//   // }

//   // reorderCoursesLessons(sectionId: string, data: any): Observable<ApiResponse<null>> {
//   //   return this.baseApi.post(`lessons/reorder/${sectionId}`, data);
//   // }
