import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private baseApi = inject(BaseApiService);
  private readonly endpoint = 'assignments';

  /**
   * Submit assignment using FormData to handle file uploads
   */
  submitAssignment(assignmentId: string, content: string, file?: File): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('content', content);
    if (file) formData.append('submissionFile', file);

    return this.baseApi.upload(`${this.endpoint}/${assignmentId}/submit`, formData, { showLoader: true });
  }

  getAssignment(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/${id}`);
  }

  // Instructor Methods
  getSubmissions(assignmentId: string): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/${assignmentId}/submissions`);
  }

  gradeSubmission(submissionId: string, grade: number, feedback: string): Observable<ApiResponse<any>> {
    return this.baseApi.patch(`${this.endpoint}/submissions/${submissionId}/grade`, { grade, feedback });
  }
}