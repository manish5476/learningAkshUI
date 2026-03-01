import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private readonly endpoint = 'quizzes';
  private baseApi = inject(BaseApiService);

  // ==================== STUDENT ROUTES ====================

  /**
   * Fetches the quiz and its questions (without correct answers) for taking
   * Maps to: GET /quizzes/:id/take
   */
  getQuizWithQuestions(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.get<any>(`${this.endpoint}/${id}/take`, { 
      showLoader: true,
      params: { mode: 'take' } // Passing mode=take as expected by your backend
    });
  }

  /**
   * Submits the student's answers for grading
   * Maps to: POST /quizzes/:quizId/submit
   */
  submitQuiz(quizId: string, answers: any[]): Observable<ApiResponse<any>> {
    return this.baseApi.post<any>(`${this.endpoint}/${quizId}/submit`, { answers }, { showLoader: true });
  }

  // ==================== INSTRUCTOR ROUTES ====================

  /**
   * Creates the base Quiz document
   * Maps to: POST /quizzes/
   */
  createQuiz(data: any): Observable<ApiResponse<any>> {
    return this.baseApi.post<any>(this.endpoint, data, { showLoader: true });
  }

  /**
   * Bulk inserts questions into a specific quiz
   * Maps to: POST /quizzes/:quizId/questions
   */
  addQuestions(quizId: string, questions: any[]): Observable<ApiResponse<any>> {
    return this.baseApi.post<any>(`${this.endpoint}/${quizId}/questions`, { questions }, { showLoader: true });
  }

  /**
   * Gets a quiz by ID (for editing)
   * Maps to: GET /quizzes/:id
   */
  getQuizById(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.get<any>(`${this.endpoint}/${id}`, { showLoader: true });
  }

  /**
   * Updates a quiz
   * Maps to: PATCH /quizzes/:id
   */
  updateQuiz(id: string, data: any): Observable<ApiResponse<any>> {
    return this.baseApi.patch<any>(`${this.endpoint}/${id}`, data, { showLoader: true });
  }

  /**
   * Deletes a quiz
   * Maps to: DELETE /quizzes/:id
   */
  deleteQuiz(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete<null>(`${this.endpoint}/${id}`, { showLoader: true });
  }

  // ==================== ADMIN ROUTES ====================

  /**
   * Gets all quizzes across the platform (Admin only)
   * Maps to: GET /quizzes/
   */
  getAllQuizzes(params?: any): Observable<ApiResponse<any[]>> {
    return this.baseApi.get<any[]>(this.endpoint, { params });
  }
}