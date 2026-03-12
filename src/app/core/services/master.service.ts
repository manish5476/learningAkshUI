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
export interface Certificate {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  course: {
    _id: string;
    title: string;
  };
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  certificateNumber: string;
  studentName: string;
  courseName: string;
  issueDate: Date;
  expiryDate?: Date;
  grade?: string;
  percentage?: number;
  instructorName: string;
  certificateUrl?: string;
  verificationUrl?: string;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateVerification {
  studentName: string;
  courseName: string;
  issueDate: Date;
  grade?: string;
  percentage?: number;
  instructorName: string;
  isValid: boolean;
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
