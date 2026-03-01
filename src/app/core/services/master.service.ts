import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';
import * as Models from '../models/master.model'; // Assuming the models from previous step

// ==========================================
// 8. LIVE SESSIONS & COHORTS
// ==========================================

@Injectable({ providedIn: 'root' })
export class LiveSessionService {
  private readonly endpoint = 'live-sessions';
  constructor(private baseApi: BaseApiService) {}

  getUpcomingSessions(params?: any): Observable<ApiResponse<Models.LiveSession[]>> {
    return this.baseApi.get<Models.LiveSession[]>(`${this.endpoint}/upcoming`, { params });
  }
  getCourseSessions(courseId: string): Observable<ApiResponse<Models.LiveSession[]>> {
    return this.baseApi.get<Models.LiveSession[]>(`${this.endpoint}/course/${courseId}`);
  }
  joinSession(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/${id}/join`, {}, { showLoader: true });
  }
  leaveSession(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/${id}/leave`, {});
  }
  createLiveSession(data: any): Observable<ApiResponse<Models.LiveSession>> {
    return this.baseApi.post<Models.LiveSession>(this.endpoint, data, { showLoader: true });
  }
  startSession(id: string): Observable<ApiResponse<Models.LiveSession>> {
    return this.baseApi.post<Models.LiveSession>(`${this.endpoint}/${id}/start`, {}, { showLoader: true });
  }
  endSession(id: string): Observable<ApiResponse<Models.LiveSession>> {
    return this.baseApi.post<Models.LiveSession>(`${this.endpoint}/${id}/end`, {}, { showLoader: true });
  }
  uploadRecording(id: string, data: { recordingUrl: string }): Observable<ApiResponse<Models.LiveSession>> {
    return this.baseApi.post<Models.LiveSession>(`${this.endpoint}/${id}/recording`, data, { showLoader: true });
  }
  getSessionById(id: string): Observable<ApiResponse<Models.LiveSession>> {
    return this.baseApi.get<Models.LiveSession>(`${this.endpoint}/${id}`);
  }
  updateSession(id: string, data: any): Observable<ApiResponse<Models.LiveSession>> {
    return this.baseApi.patch<Models.LiveSession>(`${this.endpoint}/${id}`, data);
  }
  deleteSession(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`, { showLoader: true });
  }
  getAllSessions(params?: any): Observable<ApiResponse<Models.LiveSession[]>> {
    return this.baseApi.get<Models.LiveSession[]>(this.endpoint, { params });
  }
}

@Injectable({ providedIn: 'root' })
export class CohortService {
  private readonly endpoint = 'cohorts';
  constructor(private baseApi: BaseApiService) {}

  getMyCohorts(): Observable<ApiResponse<Models.Cohort[]>> {
    return this.baseApi.get<Models.Cohort[]>(`${this.endpoint}/my-cohorts`);
  }
  enrollInCohort(cohortId: string): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/${cohortId}/enroll`, {}, { showLoader: true });
  }
  getInstructorCohorts(): Observable<ApiResponse<Models.Cohort[]>> {
    return this.baseApi.get<Models.Cohort[]>(`${this.endpoint}/instructor-cohorts`);
  }
  createCohort(data: any): Observable<ApiResponse<Models.Cohort>> {
    return this.baseApi.post<Models.Cohort>(this.endpoint, data, { showLoader: true });
  }
  getCohortDetails(id: string): Observable<ApiResponse<Models.Cohort>> {
    return this.baseApi.get<Models.Cohort>(`${this.endpoint}/${id}`);
  }
  updateCohort(id: string, data: any): Observable<ApiResponse<Models.Cohort>> {
    return this.baseApi.patch<Models.Cohort>(`${this.endpoint}/${id}`, data);
  }
  deleteCohort(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`, { showLoader: true });
  }
  getCohortProgress(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/${id}/progress`);
  }
  getAllCohorts(params?: any): Observable<ApiResponse<Models.Cohort[]>> {
    return this.baseApi.get<Models.Cohort[]>(this.endpoint, { params });
  }
}

// ==========================================
// 9. LEARNING PATHS & NOTES
// ==========================================

@Injectable({ providedIn: 'root' })
export class LearningPathService {
  private readonly endpoint = 'learning-paths';
  constructor(private baseApi: BaseApiService) {}

  getAllLearningPaths(params?: any): Observable<ApiResponse<Models.LearningPath[]>> {
    return this.baseApi.get<Models.LearningPath[]>(this.endpoint, { params });
  }
  getLearningPathById(id: string): Observable<ApiResponse<Models.LearningPath>> {
    return this.baseApi.get<Models.LearningPath>(`${this.endpoint}/${id}`);
  }
  getRecommendedPaths(): Observable<ApiResponse<Models.LearningPath[]>> {
    return this.baseApi.get<Models.LearningPath[]>(`${this.endpoint}/recommended/me`);
  }
  enrollInPath(pathId: string): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/${pathId}/enroll`, {}, { showLoader: true });
  }
  getPathProgress(pathId: string): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/${pathId}/progress`);
  }
  createLearningPath(data: any): Observable<ApiResponse<Models.LearningPath>> {
    return this.baseApi.post<Models.LearningPath>(this.endpoint, data, { showLoader: true });
  }
  getPathAnalytics(pathId: string): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/${pathId}/analytics`);
  }
  updateLearningPath(id: string, data: any): Observable<ApiResponse<Models.LearningPath>> {
    return this.baseApi.patch<Models.LearningPath>(`${this.endpoint}/${id}`, data);
  }
  deleteLearningPath(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class StudentNoteService {
  private readonly endpoint = 'student-notes';
  constructor(private baseApi: BaseApiService) {}

  searchNotes(params?: any): Observable<ApiResponse<Models.StudentNote[]>> {
    return this.baseApi.get<Models.StudentNote[]>(`${this.endpoint}/search`, { params });
  }
  getMyNotes(params?: any): Observable<ApiResponse<Models.StudentNote[]>> {
    return this.baseApi.get<Models.StudentNote[]>(this.endpoint, { params });
  }
  createNote(courseId: string, lessonId: string, data: any): Observable<ApiResponse<Models.StudentNote>> {
    return this.baseApi.post<Models.StudentNote>(`${this.endpoint}/course/${courseId}/lesson/${lessonId}`, data);
  }
exportNotes(courseId: string): Observable<Blob> {
    // Changed from .get<any> to .download
    return this.baseApi.download(`${this.endpoint}/export/course/${courseId}`);
  }
  getNoteById(id: string): Observable<ApiResponse<Models.StudentNote>> {
    return this.baseApi.get<Models.StudentNote>(`${this.endpoint}/${id}`);
  }
  updateNote(id: string, data: any): Observable<ApiResponse<Models.StudentNote>> {
    return this.baseApi.patch<Models.StudentNote>(`${this.endpoint}/${id}`, data);
  }
  deleteNote(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`);
  }
  getStudentNotes(studentId: string): Observable<ApiResponse<Models.StudentNote[]>> {
    return this.baseApi.get<Models.StudentNote[]>(`${this.endpoint}/student/${studentId}`);
  }
}

// ==========================================
// 10. SYSTEM (Notifications, Import/Export)
// ==========================================

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly endpoint = 'notifications';
  constructor(private baseApi: BaseApiService) {}

  getMyNotifications(params?: any): Observable<ApiResponse<Models.Notification[]>> {
    return this.baseApi.get<Models.Notification[]>(`${this.endpoint}/my-notifications`, { params });
  }
  markAsRead(data: { notificationIds?: string[] }): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/mark-read`, data);
  }
  markAsImportant(id: string): Observable<ApiResponse<Models.Notification>> {
    return this.baseApi.patch<Models.Notification>(`${this.endpoint}/${id}/important`, {});
  }
  deleteNotification(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`);
  }
  createBulkNotifications(data: any): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/bulk`, data, { showLoader: true });
  }
  getAllNotifications(params?: any): Observable<ApiResponse<Models.Notification[]>> {
    return this.baseApi.get<Models.Notification[]>(this.endpoint, { params });
  }
  getNotificationById(id: string): Observable<ApiResponse<Models.Notification>> {
    return this.baseApi.get<Models.Notification>(`${this.endpoint}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class ImportExportService {
  private readonly endpoint = 'import-export';
  constructor(private baseApi: BaseApiService) {}

 generatePDF(id: string): Observable<Blob> {
    // Changed from .get<any> to .download
    return this.baseApi.download(`${this.endpoint}/${id}/pdf`); 
  }
  importData(file: File, type: string): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    // Note: You might need to adjust headers in your baseApi to not set Content-Type 
    // to application/json when passing FormData, so the browser can set the boundary automatically.
    return this.baseApi.post(`${this.endpoint}/import`, formData, { showLoader: true });
  }
  exportTemplate(type: string): Observable<Blob> {
    return this.baseApi.download(`${this.endpoint}/template/${type}`);
  }
  bulkOperation(data: any): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/bulk`, data, { showLoader: true });
  }
}


// ==========================================
// 1. AUTH & USER SERVICES
// ==========================================

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly endpoint = 'auth';
  constructor(private baseApi: BaseApiService) {}

  signupUser(data: any): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/signup`, data, { showLoader: true });
  }
  loginUser(data: any): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/login`, data, { showLoader: true });
  }
  logoutUser(): Observable<ApiResponse<null>> {
    return this.baseApi.get(`${this.endpoint}/logout`);
  }
  forgotPassword(data: { email: string }): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/forgotPassword`, data, { showLoader: true });
  }
  resetPassword(token: string, data: any): Observable<ApiResponse<any>> {
    return this.baseApi.patch(`${this.endpoint}/resetPassword/${token}`, data, { showLoader: true });
  }
  updateMyPassword(data: any): Observable<ApiResponse<any>> {
    return this.baseApi.patch(`${this.endpoint}/updateMyPassword`, data, { showLoader: true });
  }
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly endpoint = 'users';
  constructor(private baseApi: BaseApiService) {}

  getMe(): Observable<ApiResponse<Models.User>> {
    return this.baseApi.get<Models.User>(`${this.endpoint}/me`);
  }
  getUserProfile(): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/profile`);
  }
  updateMe(data: Partial<Models.User>): Observable<ApiResponse<Models.User>> {
    return this.baseApi.patch<Models.User>(`${this.endpoint}/updateMe`, data, { showLoader: true });
  }
  deleteMe(): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/deleteMe`, { showLoader: true });
  }
  
  // Admin Routes
  getAllUsers(params?: any): Observable<ApiResponse<Models.User[]>> {
    return this.baseApi.get<Models.User[]>(this.endpoint, { params });
  }
  getUserById(id: string): Observable<ApiResponse<Models.User>> {
    return this.baseApi.get<Models.User>(`${this.endpoint}/${id}`);
  }
  updateUser(id: string, data: any): Observable<ApiResponse<Models.User>> {
    return this.baseApi.patch<Models.User>(`${this.endpoint}/${id}`, data, { showLoader: true });
  }
  deleteUser(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`, { showLoader: true });
  }
}

// ==========================================
// 2. CORE LMS SERVICES (Categories, Announcements)
// ==========================================

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly endpoint = 'categories';
  constructor(private baseApi: BaseApiService) {}

  getCategoryTree(): Observable<ApiResponse<Models.Category[]>> {
    return this.baseApi.get<Models.Category[]>(`${this.endpoint}/tree`);
  }
  getAllCategories(params?: any): Observable<ApiResponse<Models.Category[]>> {
    return this.baseApi.get<Models.Category[]>(this.endpoint, { params });
  }
  getCategoryById(id: string): Observable<ApiResponse<Models.Category>> {
    return this.baseApi.get<Models.Category>(`${this.endpoint}/${id}`);
  }
  getCategoryWithCourses(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/${id}/courses`);
  }
  createCategory(data: any): Observable<ApiResponse<Models.Category>> {
    return this.baseApi.post<Models.Category>(this.endpoint, data, { showLoader: true });
  }
  updateCategory(id: string, data: any): Observable<ApiResponse<Models.Category>> {
    return this.baseApi.patch<Models.Category>(`${this.endpoint}/${id}`, data, { showLoader: true });
  }
  deleteCategory(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`, { showLoader: true });
  }
}

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private readonly endpoint = 'announcements';
  constructor(private baseApi: BaseApiService) {}

  getCourseAnnouncements(courseId: string): Observable<ApiResponse<Models.Announcement[]>> {
    return this.baseApi.get<Models.Announcement[]>(`${this.endpoint}/course/${courseId}`);
  }
  getMyAnnouncements(): Observable<ApiResponse<Models.Announcement[]>> {
    return this.baseApi.get<Models.Announcement[]>(`${this.endpoint}/my-announcements`);
  }
  getAnnouncementById(id: string): Observable<ApiResponse<Models.Announcement>> {
    return this.baseApi.get<Models.Announcement>(`${this.endpoint}/${id}`);
  }
  getAllAnnouncements(params?: any): Observable<ApiResponse<Models.Announcement[]>> {
    return this.baseApi.get<Models.Announcement[]>(this.endpoint, { params });
  }
  createAnnouncement(data: any): Observable<ApiResponse<Models.Announcement>> {
    return this.baseApi.post<Models.Announcement>(this.endpoint, data, { showLoader: true });
  }
  updateAnnouncement(id: string, data: any): Observable<ApiResponse<Models.Announcement>> {
    return this.baseApi.patch<Models.Announcement>(`${this.endpoint}/${id}`, data);
  }
  deleteAnnouncement(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`);
  }
}

// ==========================================
// 3. ASSESSMENTS (Assignments, Quizzes, Mock Tests)
// ==========================================

@Injectable({ providedIn: 'root' })
export class AssignmentService {
  private readonly endpoint = 'assignments';
  constructor(private baseApi: BaseApiService) {}

  getStudentSubmissions(): Observable<ApiResponse<Models.AssignmentSubmission[]>> {
    return this.baseApi.get<Models.AssignmentSubmission[]>(`${this.endpoint}/my-submissions`);
  }
  submitAssignment(assignmentId: string, data: any): Observable<ApiResponse<Models.AssignmentSubmission>> {
    return this.baseApi.post<Models.AssignmentSubmission>(`${this.endpoint}/${assignmentId}/submit`, data, { showLoader: true });
  }
  getAssignmentSubmissions(assignmentId: string): Observable<ApiResponse<Models.AssignmentSubmission[]>> {
    return this.baseApi.get<Models.AssignmentSubmission[]>(`${this.endpoint}/${assignmentId}/submissions`);
  }
  gradeAssignment(submissionId: string, data: any): Observable<ApiResponse<Models.AssignmentSubmission>> {
    return this.baseApi.post<Models.AssignmentSubmission>(`${this.endpoint}/submissions/${submissionId}/grade`, data);
  }
  getAllAssignments(params?: any): Observable<ApiResponse<Models.Assignment[]>> {
    return this.baseApi.get<Models.Assignment[]>(this.endpoint, { params });
  }
  getAssignmentById(id: string): Observable<ApiResponse<Models.Assignment>> {
    return this.baseApi.get<Models.Assignment>(`${this.endpoint}/${id}`);
  }
  createAssignment(data: any): Observable<ApiResponse<Models.Assignment>> {
    return this.baseApi.post<Models.Assignment>(this.endpoint, data, { showLoader: true });
  }
  updateAssignment(id: string, data: any): Observable<ApiResponse<Models.Assignment>> {
    return this.baseApi.patch<Models.Assignment>(`${this.endpoint}/${id}`, data);
  }
  deleteAssignment(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly endpoint = 'quizzes';
  constructor(private baseApi: BaseApiService) {}

  getQuizWithQuestions(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/${id}/take`);
  }
  submitQuiz(quizId: string, data: any): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/${quizId}/submit`, data, { showLoader: true });
  }
  addQuestionsToQuiz(quizId: string, data: any): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/${quizId}/questions`, data);
  }
  getAllQuizzes(params?: any): Observable<ApiResponse<Models.Quiz[]>> {
    return this.baseApi.get<Models.Quiz[]>(this.endpoint, { params });
  }
  getQuizById(id: string): Observable<ApiResponse<Models.Quiz>> {
    return this.baseApi.get<Models.Quiz>(`${this.endpoint}/${id}`);
  }
  createQuiz(data: any): Observable<ApiResponse<Models.Quiz>> {
    return this.baseApi.post<Models.Quiz>(this.endpoint, data, { showLoader: true });
  }
  updateQuiz(id: string, data: any): Observable<ApiResponse<Models.Quiz>> {
    return this.baseApi.patch<Models.Quiz>(`${this.endpoint}/${id}`, data);
  }
  deleteQuiz(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class MockTestService {
  private readonly endpoint = 'mock-tests';
  constructor(private baseApi: BaseApiService) {}

  getMyAttempts(): Observable<ApiResponse<Models.MockTestAttempt[]>> {
    return this.baseApi.get<Models.MockTestAttempt[]>(`${this.endpoint}/my-attempts`);
  }
  startAttempt(mockTestId: string): Observable<ApiResponse<Models.MockTestAttempt>> {
    return this.baseApi.post<Models.MockTestAttempt>(`${this.endpoint}/${mockTestId}/start`, {}, { showLoader: true });
  }
  submitAttempt(attemptId: string, data: any): Observable<ApiResponse<Models.MockTestAttempt>> {
    return this.baseApi.post<Models.MockTestAttempt>(`${this.endpoint}/attempts/${attemptId}/submit`, data, { showLoader: true });
  }
  getAttemptDetails(id: string): Observable<ApiResponse<Models.MockTestAttempt>> {
    return this.baseApi.get<Models.MockTestAttempt>(`${this.endpoint}/attempts/${id}`);
  }
  addQuestionsToMockTest(mockTestId: string, data: any): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/${mockTestId}/questions`, data);
  }
  getAllMockTests(params?: any): Observable<ApiResponse<Models.MockTest[]>> {
    return this.baseApi.get<Models.MockTest[]>(this.endpoint, { params });
  }
  getMockTestById(id: string): Observable<ApiResponse<Models.MockTest>> {
    return this.baseApi.get<Models.MockTest>(`${this.endpoint}/${id}`);
  }
  createMockTest(data: any): Observable<ApiResponse<Models.MockTest>> {
    return this.baseApi.post<Models.MockTest>(this.endpoint, data, { showLoader: true });
  }
  updateMockTest(id: string, data: any): Observable<ApiResponse<Models.MockTest>> {
    return this.baseApi.patch<Models.MockTest>(`${this.endpoint}/${id}`, data);
  }
  deleteMockTest(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class CodingExerciseService {
  private readonly endpoint = 'coding-exercises';
  constructor(private baseApi: BaseApiService) {}

  executeCode(exerciseId: string, data: any): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/${exerciseId}/execute`, data, { showLoader: true });
  }
  submitSolution(exerciseId: string, data: any): Observable<ApiResponse<Models.CodingSubmission>> {
    return this.baseApi.post<Models.CodingSubmission>(`${this.endpoint}/${exerciseId}/submit`, data, { showLoader: true });
  }
  getMySubmissions(exerciseId: string): Observable<ApiResponse<Models.CodingSubmission[]>> {
    return this.baseApi.get<Models.CodingSubmission[]>(`${this.endpoint}/${exerciseId}/my-submissions`);
  }
  getAllExercises(params?: any): Observable<ApiResponse<Models.CodingExercise[]>> {
    return this.baseApi.get<Models.CodingExercise[]>(this.endpoint, { params });
  }
  getExerciseById(id: string): Observable<ApiResponse<Models.CodingExercise>> {
    return this.baseApi.get<Models.CodingExercise>(`${this.endpoint}/${id}`);
  }
  createCodingExercise(data: any): Observable<ApiResponse<Models.CodingExercise>> {
    return this.baseApi.post<Models.CodingExercise>(this.endpoint, data, { showLoader: true });
  }
  updateExercise(id: string, data: any): Observable<ApiResponse<Models.CodingExercise>> {
    return this.baseApi.patch<Models.CodingExercise>(`${this.endpoint}/${id}`, data);
  }
  deleteExercise(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`);
  }
}

// ==========================================
// 4. COMMERCE (Enrollments, Payments, Coupons)
// ==========================================

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly endpoint = 'enrollments';
  constructor(private baseApi: BaseApiService) {}

  getMyEnrollments(): Observable<ApiResponse<Models.Enrollment[]>> {
    return this.baseApi.get<Models.Enrollment[]>(`${this.endpoint}/my-enrollments`);
  }
  enrollStudent(data: any): Observable<ApiResponse<Models.Enrollment>> {
    return this.baseApi.post<Models.Enrollment>(`${this.endpoint}/enroll`, data, { showLoader: true });
  }
  getCourseStudents(courseId: string): Observable<ApiResponse<Models.User[]>> {
    return this.baseApi.get<Models.User[]>(`${this.endpoint}/course/${courseId}/students`);
  }
  revokeEnrollment(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.patch(`${this.endpoint}/${id}/revoke`, {}, { showLoader: true });
  }
  getAllEnrollments(params?: any): Observable<ApiResponse<Models.Enrollment[]>> {
    return this.baseApi.get<Models.Enrollment[]>(this.endpoint, { params });
  }
  getEnrollmentById(id: string): Observable<ApiResponse<Models.Enrollment>> {
    return this.baseApi.get<Models.Enrollment>(`${this.endpoint}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly endpoint = 'payments';
  constructor(private baseApi: BaseApiService) {}

  getMyPayments(): Observable<ApiResponse<Models.Payment[]>> {
    return this.baseApi.get<Models.Payment[]>(`${this.endpoint}/my-payments`);
  }
  createPaymentIntent(data: any): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/create-intent`, data, { showLoader: true });
  }
  confirmPayment(data: any): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/confirm`, data, { showLoader: true });
  }
  refundPayment(id: string, data: any): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/${id}/refund`, data, { showLoader: true });
  }
  getAllPayments(params?: any): Observable<ApiResponse<Models.Payment[]>> {
    return this.baseApi.get<Models.Payment[]>(this.endpoint, { params });
  }
  getPaymentById(id: string): Observable<ApiResponse<Models.Payment>> {
    return this.baseApi.get<Models.Payment>(`${this.endpoint}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class CouponService {
  private readonly endpoint = 'coupons';
  constructor(private baseApi: BaseApiService) {}

  validateCoupon(data: { code: string }): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/validate`, data);
  }
  applyCoupon(data: { code: string; courseId: string }): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/apply`, data, { showLoader: true });
  }
  getInstructorCoupons(): Observable<ApiResponse<Models.Coupon[]>> {
    return this.baseApi.get<Models.Coupon[]>(`${this.endpoint}/my-coupons`);
  }
  deactivateCoupon(id: string): Observable<ApiResponse<Models.Coupon>> {
    return this.baseApi.patch<Models.Coupon>(`${this.endpoint}/${id}/deactivate`, {});
  }
  getAllCoupons(params?: any): Observable<ApiResponse<Models.Coupon[]>> {
    return this.baseApi.get<Models.Coupon[]>(this.endpoint, { params });
  }
  getCouponById(id: string): Observable<ApiResponse<Models.Coupon>> {
    return this.baseApi.get<Models.Coupon>(`${this.endpoint}/${id}`);
  }
  createCoupon(data: any): Observable<ApiResponse<Models.Coupon>> {
    return this.baseApi.post<Models.Coupon>(this.endpoint, data, { showLoader: true });
  }
  updateCoupon(id: string, data: any): Observable<ApiResponse<Models.Coupon>> {
    return this.baseApi.patch<Models.Coupon>(`${this.endpoint}/${id}`, data);
  }
  deleteCoupon(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`);
  }
}

// ==========================================
// 5. SOCIAL & INTERACTION (Discussions, Reviews)
// ==========================================

@Injectable({ providedIn: 'root' })
export class DiscussionService {
  private readonly endpoint = 'discussions';
  constructor(private baseApi: BaseApiService) {}

  getCourseDiscussions(courseId: string, params?: any): Observable<ApiResponse<Models.Discussion[]>> {
    // Assuming mergeParams lets you query by courseId via query params or specific route
    return this.baseApi.get<Models.Discussion[]>(this.endpoint, { params: { course: courseId, ...params } });
  }
  replyToDiscussion(discussionId: string, data: any): Observable<ApiResponse<Models.DiscussionReply>> {
    return this.baseApi.post<Models.DiscussionReply>(`${this.endpoint}/${discussionId}/replies`, data);
  }
  toggleLike(type: string, id: string): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/${type}/${id}/like`, {});
  }
  pinDiscussion(id: string): Observable<ApiResponse<Models.Discussion>> {
    return this.baseApi.patch<Models.Discussion>(`${this.endpoint}/${id}/pin`, {});
  }
  markResolved(id: string): Observable<ApiResponse<Models.Discussion>> {
    return this.baseApi.patch<Models.Discussion>(`${this.endpoint}/${id}/resolve`, {});
  }
  getAllDiscussions(params?: any): Observable<ApiResponse<Models.Discussion[]>> {
    return this.baseApi.get<Models.Discussion[]>(this.endpoint, { params });
  }
  getDiscussionById(id: string): Observable<ApiResponse<Models.Discussion>> {
    return this.baseApi.get<Models.Discussion>(`${this.endpoint}/${id}`);
  }
  createDiscussion(data: any): Observable<ApiResponse<Models.Discussion>> {
    return this.baseApi.post<Models.Discussion>(this.endpoint, data, { showLoader: true });
  }
  updateDiscussion(id: string, data: any): Observable<ApiResponse<Models.Discussion>> {
    return this.baseApi.patch<Models.Discussion>(`${this.endpoint}/${id}`, data);
  }
  deleteDiscussion(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly endpoint = 'reviews';
  constructor(private baseApi: BaseApiService) {}

  getCourseReviews(courseId: string): Observable<ApiResponse<Models.Review[]>> {
    return this.baseApi.get<Models.Review[]>(`${this.endpoint}/course/${courseId}`);
  }
  replyToReview(id: string, data: any): Observable<ApiResponse<Models.Review>> {
    return this.baseApi.post<Models.Review>(`${this.endpoint}/${id}/reply`, data);
  }
  markHelpful(id: string): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/${id}/helpful`, {});
  }
  getAllReviews(params?: any): Observable<ApiResponse<Models.Review[]>> {
    return this.baseApi.get<Models.Review[]>(this.endpoint, { params });
  }
  getReviewById(id: string): Observable<ApiResponse<Models.Review>> {
    return this.baseApi.get<Models.Review>(`${this.endpoint}/${id}`);
  }
  createReview(courseId: string, data: any): Observable<ApiResponse<Models.Review>> {
    return this.baseApi.post<Models.Review>(`${this.endpoint}/course/${courseId}`, data, { showLoader: true });
  }
  updateReview(id: string, data: any): Observable<ApiResponse<Models.Review>> {
    return this.baseApi.patch<Models.Review>(`${this.endpoint}/${id}`, data);
  }
  deleteReview(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`);
  }
}

// ==========================================
// 6. PROGRESS, BADGES & CERTIFICATES
// ==========================================

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly endpoint = 'progress';
  constructor(private baseApi: BaseApiService) {}

  getMyProgress(): Observable<ApiResponse<Models.ProgressTracking[]>> {
    return this.baseApi.get<Models.ProgressTracking[]>(`${this.endpoint}/my-progress`);
  }
  getCourseProgress(courseId: string): Observable<ApiResponse<Models.ProgressTracking>> {
    return this.baseApi.get<Models.ProgressTracking>(`${this.endpoint}/course/${courseId}`);
  }
  markLessonComplete(courseId: string, data: any): Observable<ApiResponse<Models.ProgressTracking>> {
    return this.baseApi.post<Models.ProgressTracking>(`${this.endpoint}/course/${courseId}/lesson-complete`, data);
  }
  getStudentProgress(studentId: string, courseId: string): Observable<ApiResponse<Models.ProgressTracking>> {
    return this.baseApi.get<Models.ProgressTracking>(`${this.endpoint}/student/${studentId}/course/${courseId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class CertificateService {
  private readonly endpoint = 'certificates';
  constructor(private baseApi: BaseApiService) {}

  verifyCertificate(certificateNumber: string): Observable<ApiResponse<Models.Certificate>> {
    return this.baseApi.get<Models.Certificate>(`${this.endpoint}/verify/${certificateNumber}`);
  }
  getMyCertificates(): Observable<ApiResponse<Models.Certificate[]>> {
    return this.baseApi.get<Models.Certificate[]>(`${this.endpoint}/my-certificates`);
  }
  generatePDF(id: string): Observable<Blob> {
    // Note: Assuming baseApi can handle blob responses or you use standard HttpClient here
    return this.baseApi.download(`${this.endpoint}/${id}/pdf`); 
  }
  revokeCertificate(id: string): Observable<ApiResponse<Models.Certificate>> {
    return this.baseApi.patch<Models.Certificate>(`${this.endpoint}/${id}/revoke`, {}, { showLoader: true });
  }
  getAllCertificates(params?: any): Observable<ApiResponse<Models.Certificate[]>> {
    return this.baseApi.get<Models.Certificate[]>(this.endpoint, { params });
  }
  getCertificateById(id: string): Observable<ApiResponse<Models.Certificate>> {
    return this.baseApi.get<Models.Certificate>(`${this.endpoint}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class BadgeService {
  private readonly endpoint = 'badges';
  constructor(private baseApi: BaseApiService) {}

  getUserBadges(): Observable<ApiResponse<Models.UserBadge[]>> {
    return this.baseApi.get<Models.UserBadge[]>(`${this.endpoint}/my-badges`);
  }
  getLeaderboard(): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/leaderboard`);
  }
  getStudentBadges(studentId: string): Observable<ApiResponse<Models.UserBadge[]>> {
    return this.baseApi.get<Models.UserBadge[]>(`${this.endpoint}/student/${studentId}`);
  }
  awardBadge(data: any): Observable<ApiResponse<Models.UserBadge>> {
    return this.baseApi.post<Models.UserBadge>(`${this.endpoint}/award`, data, { showLoader: true });
  }
  checkAndAwardBadges(): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/check`, {});
  }
  removeUserBadge(studentId: string, badgeId: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${studentId}/${badgeId}`);
  }
  getAllBadges(params?: any): Observable<ApiResponse<Models.Badge[]>> {
    return this.baseApi.get<Models.Badge[]>(this.endpoint, { params });
  }
  getBadgeById(id: string): Observable<ApiResponse<Models.Badge>> {
    return this.baseApi.get<Models.Badge>(`${this.endpoint}/${id}`);
  }
  createBadge(data: any): Observable<ApiResponse<Models.Badge>> {
    return this.baseApi.post<Models.Badge>(this.endpoint, data, { showLoader: true });
  }
  updateBadge(id: string, data: any): Observable<ApiResponse<Models.Badge>> {
    return this.baseApi.patch<Models.Badge>(`${this.endpoint}/${id}`, data);
  }
  deleteBadge(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete(`${this.endpoint}/${id}`);
  }
}

// ==========================================
// 7. ANALYTICS & REPORTS
// ==========================================

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly endpoint = 'analytics';
  constructor(private baseApi: BaseApiService) {}

  getInstructorAnalytics(instructorId?: string): Observable<ApiResponse<any>> {
    const url = instructorId ? `${this.endpoint}/instructor/${instructorId}` : `${this.endpoint}/instructor`;
    return this.baseApi.get(url);
  }
  getStudentAnalytics(studentId?: string): Observable<ApiResponse<any>> {
    const url = studentId ? `${this.endpoint}/student/${studentId}` : `${this.endpoint}/student`;
    return this.baseApi.get(url);
  }
  getPlatformStats(): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/platform`);
  }
  getRevenueAnalytics(): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/revenue`);
  }
  getEngagementAnalytics(): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/engagement`);
  }
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly endpoint = 'reports';
  constructor(private baseApi: BaseApiService) {}

  generateCourseReport(courseId: string): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/course/${courseId}`);
  }
  generateInstructorReport(instructorId: string): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/instructor/${instructorId}`);
  }
  generatePlatformReport(): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/platform`);
  }
  generateCustomReport(data: any): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/custom`, data, { showLoader: true });
  }
}



// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService, ApiResponse } from '../http/base-api.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class ApiService {
//   constructor(private baseApi: BaseApiService) { }

//   // ==================== AUTH SERVICE ====================
//   auth = {
//     signup: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('auth/signup', data, { skipAuth: true, showLoader: true }),

//     login: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('auth/login', data, { skipAuth: true, showLoader: true }),

//     logout: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('auth/logout'),

//     forgotPassword: (email: string): Observable<ApiResponse<any>> =>
//       this.baseApi.post('auth/forgotPassword', { email }, { skipAuth: true }),

//     resetPassword: (token: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`auth/resetPassword/${token}`, data, { skipAuth: true }),

//     updatePassword: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch('auth/updateMyPassword', data, { showLoader: true })
//   };

//   // ==================== USER SERVICE ====================
//   users = {
//     // Public
//     forgotPassword: (email: string): Observable<ApiResponse<any>> =>
//       this.baseApi.post('users/forgotPassword', { email }, { skipAuth: true }),

//     resetPassword: (token: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`users/resetPassword/${token}`, data, { skipAuth: true }),

//     // Protected - Current User
//     getMe: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('users/me'),

//     updateMe: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch('users/updateMe', data),

//     deleteMe: (): Observable<ApiResponse<any>> =>
//       this.baseApi.delete('users/deleteMe'),

//     getProfile: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('users/profile'),

//     // Admin Only
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('users', { params }),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`users/${id}`),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`users/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`users/${id}`)
//   };

//   // ==================== COURSE SERVICE ====================
//   courses = {
//     // Public Routes
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('courses', { params }),

//     search: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('courses/search', { params }),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`courses/${id}`),

//     getBySlug: (slug: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`courses/slug/${slug}`),

//     // Protected - Instructor Routes
//     getMyCourses: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('courses/instructor/my-courses'),

//     create: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('courses', data, { showLoader: true }),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`courses/${id}`, data, { showLoader: true }),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`courses/${id}`, { showLoader: true }),

//     publish: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`courses/${id}/publish`, {}, { showLoader: true }),

//     // Admin Only
//     approve: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`courses/${id}/approve`, {}, { showLoader: true }),

//     // Consider adding these optional methods to courses:
//     bulkDelete: (ids: string[]): Observable<ApiResponse<any>> =>
//       this.baseApi.post('courses/bulk-delete', { ids }, { showLoader: true }),

//     bulkPublish: (ids: string[]): Observable<ApiResponse<any>> =>
//       this.baseApi.post('courses/bulk-publish', { ids }, { showLoader: true }),

//     duplicate: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`courses/${id}/duplicate`, {}, { showLoader: true }),
//     // Add to courses object if endpoints exist:
//     getStats: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`courses/${id}/stats`),

//     getRevenue: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`courses/${id}/revenue`),

//     getEngagement: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`courses/${id}/engagement`),
//   };

//   // ==================== SECTION SERVICE ====================
//   sections = {
//     // Nested under courses
//     getByCourse: (courseId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`courses/${courseId}/sections`),

//     create: (courseId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`courses/${courseId}/sections`, data, { showLoader: true }),

//     getById: (courseId: string, sectionId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`courses/${courseId}/sections/${sectionId}`),

//     update: (courseId: string, sectionId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`courses/${courseId}/sections/${sectionId}`, data),

//     delete: (courseId: string, sectionId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`courses/${courseId}/sections/${sectionId}`),

//     reorder: (courseId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`sections/reorder/${courseId}`, data),

//     // Direct access
//     getDirect: (sectionId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`sections/${sectionId}`),

//     updateDirect: (sectionId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`sections/${sectionId}`, data),

//     deleteDirect: (sectionId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`sections/${sectionId}`),

//     getAll: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('sections')
//   };

//   // ==================== LESSON SERVICE ====================
//   lessons = {
//     // Nested under sections
//     getBySection: (courseId: string, sectionId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`courses/${courseId}/sections/${sectionId}/lessons`),

//     create: (courseId: string, sectionId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`courses/${courseId}/sections/${sectionId}/lessons`, data, { showLoader: true }),

//     getById: (courseId: string, sectionId: string, lessonId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`),

//     update: (courseId: string, sectionId: string, lessonId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, data),

//     delete: (courseId: string, sectionId: string, lessonId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`),

//     // Access control
//     getAccess: (lessonId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`lessons/${lessonId}/access`),

//     // Direct access
//     getDirect: (lessonId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`lessons/${lessonId}`),

//     updateDirect: (lessonId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`lessons/${lessonId}`, data),

//     deleteDirect: (lessonId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`lessons/${lessonId}`),

//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('lessons', { params }),

//     reorder: (sectionId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`lessons/reorder/${sectionId}`, data)
//   };

//   // ==================== CATEGORY SERVICE ====================
//   categories = {
//     // Public
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('categories', { params }),

//     getTree: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('categories/tree'),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`categories/${id}`),

//     getWithCourses: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`categories/${id}/courses`),

//     // Admin Only
//     create: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('categories', data, { showLoader: true }),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`categories/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`categories/${id}`)
//   };

//   // ==================== ENROLLMENT SERVICE ====================
//   enrollments = {
//     // Student
//     getMyEnrollments: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('enrollments/my-enrollments'),

//     enroll: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('enrollments/enroll', data, { showLoader: true }),

//     // Instructor/Admin
//     getCourseStudents: (courseId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`enrollments/course/${courseId}/students`),

//     revoke: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`enrollments/${id}/revoke`, {}),

//     // Admin Only
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('enrollments', { params }),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`enrollments/${id}`)
//   };

//   // ==================== REVIEW SERVICE ====================
//   reviews = {
//     // Public
//     getCourseReviews: (courseId: string, params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`reviews/course/${courseId}`, { params }),

//     // Protected
//     create: (courseId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`reviews/course/${courseId}`, data, { showLoader: true }),

//     reply: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`reviews/${id}/reply`, data),

//     markHelpful: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`reviews/${id}/helpful`, {}),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`reviews/${id}`),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`reviews/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`reviews/${id}`),

//     // Admin Only
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('reviews', { params })
//   };

//   // ==================== QUIZ SERVICE ====================
//   quizzes = {
//     // Student
//     take: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`quizzes/${id}/take`),

//     submit: (quizId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`quizzes/${quizId}/submit`, data, { showLoader: true }),

//     // Instructor
//     create: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('quizzes', data, { showLoader: true }),

//     addQuestions: (quizId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`quizzes/${quizId}/questions`, data),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`quizzes/${id}`),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`quizzes/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`quizzes/${id}`),

//     // Admin Only
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('quizzes', { params })
//   };

//   // ==================== ASSIGNMENT SERVICE ====================
//   assignments = {
//     // Student
//     getMySubmissions: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('assignments/my-submissions'),

//     submit: (assignmentId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`assignments/${assignmentId}/submit`, data, { showLoader: true }),

//     // Instructor
//     create: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('assignments', data, { showLoader: true }),

//     getSubmissions: (assignmentId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`assignments/${assignmentId}/submissions`),

//     grade: (submissionId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`assignments/submissions/${submissionId}/grade`, data),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`assignments/${id}`),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`assignments/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`assignments/${id}`),

//     // Admin Only
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('assignments', { params })
//   };

//   // ==================== CODING EXERCISE SERVICE ====================
//   codingExercises = {
//     // Student
//     execute: (exerciseId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`coding-exercises/${exerciseId}/execute`, data, { showLoader: true }),

//     submit: (exerciseId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`coding-exercises/${exerciseId}/submit`, data, { showLoader: true }),

//     getMySubmissions: (exerciseId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`coding-exercises/${exerciseId}/my-submissions`),

//     // Instructor
//     create: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('coding-exercises', data, { showLoader: true }),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`coding-exercises/${id}`),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`coding-exercises/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`coding-exercises/${id}`),

//     // Admin Only
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('coding-exercises', { params })
//   };

//   // ==================== MOCK TEST SERVICE ====================
//   mockTests = {
//     // Public
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('mock-tests', { params }),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`mock-tests/${id}`),

//     // Student
//     getMyAttempts: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('mock-tests/my-attempts'),

//     startAttempt: (mockTestId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`mock-tests/${mockTestId}/start`, {}),

//     submitAttempt: (attemptId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`mock-tests/attempts/${attemptId}/submit`, data),

//     getAttemptDetails: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`mock-tests/attempts/${id}`),

//     // Instructor
//     create: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('mock-tests', data, { showLoader: true }),

//     addQuestions: (mockTestId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`mock-tests/${mockTestId}/questions`, data),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`mock-tests/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`mock-tests/${id}`)
//   };

//   // ==================== PROGRESS SERVICE ====================
//   progress = {
//     // Student
//     getMyProgress: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('progress/my-progress'),

//     getCourseProgress: (courseId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`progress/course/${courseId}`),

//     markLessonComplete: (courseId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`progress/course/${courseId}/lesson-complete`, data),

//     // Instructor/Admin
//     getStudentProgress: (studentId: string, courseId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`progress/student/${studentId}/course/${courseId}`)
//   };

//   // ==================== CERTIFICATE SERVICE ====================
//   certificates = {
//     // Public
//     verify: (certificateNumber: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`certificates/verify/${certificateNumber}`, { skipAuth: true }),

//     // Student
//     getMyCertificates: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('certificates/my-certificates'),

//     generatePDF: (id: string): Observable<Blob> =>
//       this.baseApi.download(`certificates/${id}/pdf`),

//     // Admin
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('certificates', { params }),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`certificates/${id}`),

//     revoke: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`certificates/${id}/revoke`, {})
//   };

//   // ==================== NOTIFICATION SERVICE ====================
//   notifications = {
//     // User
//     getMyNotifications: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('notifications/my-notifications'),

//     markAsRead: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('notifications/mark-read', data),

//     markAsImportant: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`notifications/${id}/important`, {}),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`notifications/${id}`),

//     // Admin Only
//     createBulk: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('notifications/bulk', data, { showLoader: true }),

//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('notifications', { params }),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`notifications/${id}`)
//   };

//   // ==================== PAYMENT SERVICE ====================
//   payments = {
//     // User
//     getMyPayments: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('payments/my-payments'),

//     createIntent: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('payments/create-intent', data, { showLoader: true }),

//     confirm: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('payments/confirm', data, { showLoader: true }),

//     // Admin Only
//     refund: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`payments/${id}/refund`, {}),

//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('payments', { params }),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`payments/${id}`)
//   };

//   // ==================== DISCUSSION SERVICE ====================
//   discussions = {
//     // Course discussions
//     getCourseDiscussions: (courseId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`discussions?courseId=${courseId}`),

//     create: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('discussions', data, { showLoader: true }),

//     // Replies
//     reply: (discussionId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`discussions/${discussionId}/replies`, data),

//     // Interactions
//     toggleLike: (type: string, id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`discussions/${type}/${id}/like`, {}),

//     pin: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`discussions/${id}/pin`, {}),

//     resolve: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`discussions/${id}/resolve`, {}),

//     // CRUD
//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`discussions/${id}`),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`discussions/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`discussions/${id}`),

//     // Admin Only
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('discussions', { params })
//   };

//   // ==================== COUPON SERVICE ====================
//   coupons = {
//     // Validation
//     validate: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('coupons/validate', data),

//     apply: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('coupons/apply', data),

//     // Instructor
//     getMyCoupons: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('coupons/my-coupons'),

//     // CRUD
//     create: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('coupons', data, { showLoader: true }),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`coupons/${id}`),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`coupons/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`coupons/${id}`),

//     deactivate: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`coupons/${id}/deactivate`, {}),

//     // Admin Only
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('coupons', { params })
//   };

//   // ==================== ANNOUNCEMENT SERVICE ====================
//   announcements = {
//     // Student
//     getCourseAnnouncements: (courseId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`announcements/course/${courseId}`),

//     // Instructor
//     create: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('announcements', data, { showLoader: true }),

//     getMyAnnouncements: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('announcements/my-announcements'),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`announcements/${id}`),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`announcements/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`announcements/${id}`),

//     // Admin Only
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('announcements', { params })
//   };

//   // ==================== COHORT SERVICE ====================
//   cohorts = {
//     // Student
//     getMyCohorts: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('cohorts/my-cohorts'),

//     enroll: (cohortId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`cohorts/${cohortId}/enroll`, {}),

//     // Instructor
//     getInstructorCohorts: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('cohorts/instructor-cohorts'),

//     create: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('cohorts', data, { showLoader: true }),

//     getDetails: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`cohorts/${id}`),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`cohorts/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`cohorts/${id}`),

//     getProgress: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`cohorts/${id}/progress`),

//     // Admin Only
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('cohorts', { params })
//   };

//   // ==================== BADGE SERVICE ====================
//   badges = {
//     // User
//     getMyBadges: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('badges/my-badges'),

//     getLeaderboard: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('badges/leaderboard'),

//     // Public
//     getStudentBadges: (studentId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`badges/student/${studentId}`),

//     // Admin/Instructor
//     award: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('badges/award', data, { showLoader: true }),

//     checkAndAward: (): Observable<ApiResponse<any>> =>
//       this.baseApi.post('badges/check', {}),

//     remove: (studentId: string, badgeId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`badges/${studentId}/${badgeId}`),

//     // Admin Only CRUD
//     create: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('badges', data, { showLoader: true }),

//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('badges', { params }),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`badges/${id}`),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`badges/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`badges/${id}`)
//   };

//   // ==================== LEARNING PATH SERVICE ====================
//   learningPaths = {
//     // Public
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('learning-paths', { params }),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`learning-paths/${id}`),

//     // Student
//     getRecommended: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('learning-paths/recommended/me'),

//     enroll: (pathId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`learning-paths/${pathId}/enroll`, {}),

//     getProgress: (pathId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`learning-paths/${pathId}/progress`),

//     // Admin/Instructor
//     create: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('learning-paths', data, { showLoader: true }),

//     getAnalytics: (pathId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`learning-paths/${pathId}/analytics`),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`learning-paths/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`learning-paths/${id}`)
//   };

//   // ==================== LIVE SESSION SERVICE ====================
//   liveSessions = {
//     // Public
//     getUpcoming: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('live-sessions/upcoming'),

//     // Student
//     getCourseSessions: (courseId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`live-sessions/course/${courseId}`),

//     join: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`live-sessions/${id}/join`, {}),

//     leave: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`live-sessions/${id}/leave`, {}),

//     // Instructor
//     create: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('live-sessions', data, { showLoader: true }),

//     start: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`live-sessions/${id}/start`, {}),

//     end: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`live-sessions/${id}/end`, {}),

//     uploadRecording: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`live-sessions/${id}/recording`, data, { showLoader: true }),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`live-sessions/${id}`),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`live-sessions/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`live-sessions/${id}`),

//     // Admin Only
//     getAll: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('live-sessions', { params })
//   };

//   // ==================== STUDENT NOTES SERVICE ====================
//   notes = {
//     // Search
//     search: (params?: any): Observable<ApiResponse<any>> =>
//       this.baseApi.get('notes/search', { params }),

//     // My notes
//     getMyNotes: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('notes'),

//     create: (courseId: string, lessonId: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post(`notes/course/${courseId}/lesson/${lessonId}`, data, { showLoader: true }),

//     export: (courseId: string): Observable<Blob> =>
//       this.baseApi.download(`notes/export/course/${courseId}`),

//     getById: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`notes/${id}`),

//     update: (id: string, data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.patch(`notes/${id}`, data),

//     delete: (id: string): Observable<ApiResponse<any>> =>
//       this.baseApi.delete(`notes/${id}`),

//     // Admin Only
//     getStudentNotes: (studentId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`notes/student/${studentId}`)
//   };

//   // ==================== ANALYTICS SERVICE ====================
//   analytics = {
//     // Instructor
//     getInstructorAnalytics: (instructorId?: string): Observable<ApiResponse<any>> => {
//       const endpoint = instructorId
//         ? `analytics/instructor/${instructorId}`
//         : 'analytics/instructor';
//       return this.baseApi.get(endpoint);
//     },

//     // Student
//     getStudentAnalytics: (studentId?: string): Observable<ApiResponse<any>> => {
//       const endpoint = studentId
//         ? `analytics/student/${studentId}`
//         : 'analytics/student';
//       return this.baseApi.get(endpoint);
//     },

//     // Admin Only
//     getPlatformStats: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('analytics/platform'),

//     getRevenueAnalytics: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('analytics/revenue'),

//     getEngagementAnalytics: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('analytics/engagement')
//   };

//   // ==================== REPORTS SERVICE ====================
//   reports = {
//     // Report generation
//     generateCourseReport: (courseId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`reports/course/${courseId}`),

//     generateInstructorReport: (instructorId: string): Observable<ApiResponse<any>> =>
//       this.baseApi.get(`reports/instructor/${instructorId}`),

//     generatePlatformReport: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('reports/platform'),

//     generateCustomReport: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('reports/custom', data, { showLoader: true })
//   };

//   // ==================== IMPORT/EXPORT SERVICE ====================
//   importExport = {
//     // Export
//     exportData: (data: any): Observable<Blob> =>
//       this.baseApi.download('import-export/export', {
//         // method: 'POST',
//         // body: JSON.stringify(data),
//         // headers: { 'Content-Type': 'application/json' }
//       }),

//     // Import
//     importData: (file: File): Observable<ApiResponse<any>> => {
//       const formData = new FormData();
//       formData.append('file', file);
//       return this.baseApi.upload('import-export/import', formData, { showLoader: true });
//     },

//     // Template
//     getTemplate: (type: string): Observable<Blob> =>
//       this.baseApi.download(`import-export/template/${type}`),

//     // Bulk operations
//     bulkOperation: (data: any): Observable<ApiResponse<any>> =>
//       this.baseApi.post('import-export/bulk', data, { showLoader: true })
//   };

//   // ==================== HEALTH CHECK ====================
//   health = {
//     check: (): Observable<ApiResponse<any>> =>
//       this.baseApi.get('health', { skipAuth: true })
//   };
// }
