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
// import { Injectable, inject } from '@angular/core';
// import { Observable, interval, Subject, BehaviorSubject } from 'rxjs';
// import { switchMap, takeUntil, tap } from 'rxjs/operators';
// import { BaseApiService, ApiResponse } from '../http/base-api.service';

// export interface QuizAnswer {
//   questionId: string;
//   selectedOptionIndex: number;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class AssessmentService {
//   private baseApi = inject(BaseApiService);
//   private readonly endpoint = 'assessments';

//   // State management for active tests
//   private stopHeartbeat$ = new Subject<void>();
//   private tabSwitchCount = 0;

//   // ==========================================
//   // 1. QUIZ METHODS (In-Course)
//   // ==========================================

//   /**
//    * Fetch quiz details and questions (answers are masked on backend)
//    */
//   getQuiz(id: string, shuffle: boolean = false): Observable<ApiResponse<any>> {
//     return this.baseApi.get(`${this.endpoint}/quiz/${id}`, { params: { shuffle } });
//   }

//   /**
//    * Submit quiz for instant auto-grading
//    */
//   submitQuiz(id: string, answers: QuizAnswer[]): Observable<ApiResponse<any>> {
//     return this.baseApi.post(`${this.endpoint}/quiz/${id}/submit`, { answers }, { showLoader: true });
//   }

//   // ==========================================
//   // 2. MOCK TEST METHODS (Competitive/Standalone)
//   // ==========================================

//   /**
//    * Start or Resume a Mock Test attempt
//    */
//   startMockTest(id: string): Observable<ApiResponse<any>> {
//     return this.baseApi.post(`${this.endpoint}/mock-test/${id}/start`, {}, { showLoader: true }).pipe(
//       tap(res => {
//         // Automatically start anti-cheat monitoring if a session is active
//         this.initProctoring(res.data.attempt._id);
//       })
//     );
//   }

//   /**
//    * Submit full Mock Test for grading and ranking
//    */
//   submitMockTest(attemptId: string, answers: QuizAnswer[]): Observable<ApiResponse<any>> {
//     this.stopProctoring();
//     return this.baseApi.patch(`${this.endpoint}/mock-test/attempt/${attemptId}/submit`, { 
//       answers 
//     }, { showLoader: true });
//   }

//   /**
//    * Get all available Mock Tests
//    */
//   getAllMockTests(params?: any): Observable<ApiResponse<any>> {
//     return this.baseApi.get(`${this.endpoint}/mock-test`, { params });
//   }

//   /**
//    * Fetch analytics for a specific Mock Test (Instructor Only)
//    */
//   getMockTestAnalytics(id: string): Observable<ApiResponse<any>> {
//     return this.baseApi.get(`${this.endpoint}/mock-test/${id}/analytics`);
//   }

//   // ==========================================
//   // 3. PROCTORING & ANTI-CHEAT ENGINE
//   // ==========================================

//   /**
//    * Initializes real-time monitoring:
//    * 1. Tab-switch detection
//    * 2. Server heartbeat every 30 seconds
//    */
//   private initProctoring(attemptId: string): void {
//     this.tabSwitchCount = 0;
//     this.stopHeartbeat$.next(); // Reset any existing listeners

//     // Detect Tab Switches (Visibility API)
//     document.addEventListener('visibilitychange', () => {
//       if (document.hidden) {
//         this.tabSwitchCount++;
//         console.warn(`Tab Switch Detected! Total: ${this.tabSwitchCount}`);
//       }
//     });

//     // Start 30-second Heartbeat
//     interval(30000).pipe(
//       takeUntil(this.stopHeartbeat$),
//       switchMap(() => this.sendHeartbeat(attemptId))
//     ).subscribe();
//   }

//   private sendHeartbeat(attemptId: string): Observable<any> {
//     const payload = { tabSwitches: this.tabSwitchCount };
//     this.tabSwitchCount = 0; // Reset count after sending to backend
//     return this.baseApi.patch(`${this.endpoint}/mock-test/attempt/${attemptId}/heartbeat`, payload);
//   }

//   private stopProctoring(): void {
//     this.stopHeartbeat$.next();
//   }

//   // ==========================================
//   // 4. INSTRUCTOR MANAGEMENT
//   // ==========================================

//   createQuiz(data: any): Observable<ApiResponse<any>> {
//     return this.baseApi.post(`${this.endpoint}/quiz`, data);
//   }

//   createMockTest(data: any): Observable<ApiResponse<any>> {
//     return this.baseApi.post(`${this.endpoint}/mock-test`, data);
//   }

//   /**
//    * Bulk add questions to either a quiz or a mock test
//    */
//   addQuestions(type: 'quiz' | 'mock-test', id: string, questions: any[]): Observable<ApiResponse<any>> {
//     return this.baseApi.post(`${this.endpoint}/${type}/${id}/questions`, questions, { showLoader: true });
//   }
// }