import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';

@Injectable({
  providedIn: 'root'
})
export class MockTestService {
  private readonly endpoint = 'mock-tests';
  private baseApi = inject(BaseApiService);

  // ==================== PUBLIC / STUDENT ROUTES ====================

  getAll(params?: any): Observable<ApiResponse<any>> {
    return this.baseApi.get<any>(this.endpoint, { params });
  }

  getById(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.get<any>(`${this.endpoint}/${id}`);
  }

  getMyAttempts(): Observable<ApiResponse<any>> {
    return this.baseApi.get<any>(`${this.endpoint}/my-attempts`, { showLoader: true });
  }

  startAttempt(mockTestId: string): Observable<ApiResponse<any>> {
    return this.baseApi.post<any>(`${this.endpoint}/${mockTestId}/start`, {}, { showLoader: true });
  }

  submitAttempt(attemptId: string, answers: any[]): Observable<ApiResponse<any>> {
    return this.baseApi.post<any>(`${this.endpoint}/attempts/${attemptId}/submit`, { answers }, { showLoader: true });
  }

  getAttemptDetails(attemptId: string): Observable<ApiResponse<any>> {
    return this.baseApi.get<any>(`${this.endpoint}/attempts/${attemptId}`, { showLoader: true });
  }

  // ==================== INSTRUCTOR ROUTES ====================

 // Make sure 'data' is here! (It expects 1 argument)
  create(data: any): Observable<ApiResponse<any>> {
    return this.baseApi.post<any>(this.endpoint, data, { showLoader: true });
  }

  // Make sure 'id' and 'data' are here! (It expects 2 arguments)
  update(id: string, data: any): Observable<ApiResponse<any>> {
    return this.baseApi.patch<any>(`${this.endpoint}/${id}`, data, { showLoader: true });
  }

  // Make sure 'mockTestId' and 'questions' are here! (It expects 2 arguments)
  addQuestions(mockTestId: string, questions: any[]): Observable<ApiResponse<any>> {
    return this.baseApi.post<any>(`${this.endpoint}/${mockTestId}/questions`, { questions }, { showLoader: true });
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete<null>(`${this.endpoint}/${id}`, { showLoader: true });
  }


}