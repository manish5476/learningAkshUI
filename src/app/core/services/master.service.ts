import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private baseApi: BaseApiService) { }

  // ==================== AUTH SERVICE ====================
  auth = {
    signup: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('auth/signup', data, { skipAuth: true, showLoader: true }),

    login: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('auth/login', data, { skipAuth: true, showLoader: true }),

    logout: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('auth/logout'),

    forgotPassword: (email: string): Observable<ApiResponse<any>> =>
      this.baseApi.post('auth/forgotPassword', { email }, { skipAuth: true }),

    resetPassword: (token: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`auth/resetPassword/${token}`, data, { skipAuth: true }),

    updatePassword: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch('auth/updateMyPassword', data, { showLoader: true })
  };

  // ==================== USER SERVICE ====================
  users = {
    // Public
    forgotPassword: (email: string): Observable<ApiResponse<any>> =>
      this.baseApi.post('users/forgotPassword', { email }, { skipAuth: true }),

    resetPassword: (token: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`users/resetPassword/${token}`, data, { skipAuth: true }),

    // Protected - Current User
    getMe: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('users/me'),

    updateMe: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch('users/updateMe', data),

    deleteMe: (): Observable<ApiResponse<any>> =>
      this.baseApi.delete('users/deleteMe'),

    getProfile: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('users/profile'),

    // Admin Only
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('users', { params }),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`users/${id}`),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`users/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`users/${id}`)
  };

  // ==================== COURSE SERVICE ====================
  courses = {
    // Public Routes
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('courses', { params }),

    search: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('courses/search', { params }),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`courses/${id}`),

    getBySlug: (slug: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`courses/slug/${slug}`),

    // Protected - Instructor Routes
    getMyCourses: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('courses/instructor/my-courses'),

    create: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('courses', data, { showLoader: true }),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`courses/${id}`, data, { showLoader: true }),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`courses/${id}`, { showLoader: true }),

    publish: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`courses/${id}/publish`, {}, { showLoader: true }),

    // Admin Only
    approve: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`courses/${id}/approve`, {}, { showLoader: true }),

    // Consider adding these optional methods to courses:
    bulkDelete: (ids: string[]): Observable<ApiResponse<any>> =>
      this.baseApi.post('courses/bulk-delete', { ids }, { showLoader: true }),

    bulkPublish: (ids: string[]): Observable<ApiResponse<any>> =>
      this.baseApi.post('courses/bulk-publish', { ids }, { showLoader: true }),

    duplicate: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.post(`courses/${id}/duplicate`, {}, { showLoader: true }),
    // Add to courses object if endpoints exist:
    getStats: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`courses/${id}/stats`),

    getRevenue: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`courses/${id}/revenue`),

    getEngagement: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`courses/${id}/engagement`),
  };

  // ==================== SECTION SERVICE ====================
  sections = {
    // Nested under courses
    getByCourse: (courseId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`courses/${courseId}/sections`),

    create: (courseId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`courses/${courseId}/sections`, data, { showLoader: true }),

    getById: (courseId: string, sectionId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`courses/${courseId}/sections/${sectionId}`),

    update: (courseId: string, sectionId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`courses/${courseId}/sections/${sectionId}`, data),

    delete: (courseId: string, sectionId: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`courses/${courseId}/sections/${sectionId}`),

    reorder: (courseId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`sections/reorder/${courseId}`, data),

    // Direct access
    getDirect: (sectionId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`sections/${sectionId}`),

    updateDirect: (sectionId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`sections/${sectionId}`, data),

    deleteDirect: (sectionId: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`sections/${sectionId}`),

    getAll: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('sections')
  };

  // ==================== LESSON SERVICE ====================
  lessons = {
    // Nested under sections
    getBySection: (courseId: string, sectionId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`courses/${courseId}/sections/${sectionId}/lessons`),

    create: (courseId: string, sectionId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`courses/${courseId}/sections/${sectionId}/lessons`, data, { showLoader: true }),

    getById: (courseId: string, sectionId: string, lessonId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`),

    update: (courseId: string, sectionId: string, lessonId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, data),

    delete: (courseId: string, sectionId: string, lessonId: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`),

    // Access control
    getAccess: (lessonId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`lessons/${lessonId}/access`),

    // Direct access
    getDirect: (lessonId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`lessons/${lessonId}`),

    updateDirect: (lessonId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`lessons/${lessonId}`, data),

    deleteDirect: (lessonId: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`lessons/${lessonId}`),

    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('lessons', { params }),

    reorder: (sectionId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`lessons/reorder/${sectionId}`, data)
  };

  // ==================== CATEGORY SERVICE ====================
  categories = {
    // Public
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('categories', { params }),

    getTree: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('categories/tree'),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`categories/${id}`),

    getWithCourses: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`categories/${id}/courses`),

    // Admin Only
    create: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('categories', data, { showLoader: true }),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`categories/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`categories/${id}`)
  };

  // ==================== ENROLLMENT SERVICE ====================
  enrollments = {
    // Student
    getMyEnrollments: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('enrollments/my-enrollments'),

    enroll: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('enrollments/enroll', data, { showLoader: true }),

    // Instructor/Admin
    getCourseStudents: (courseId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`enrollments/course/${courseId}/students`),

    revoke: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`enrollments/${id}/revoke`, {}),

    // Admin Only
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('enrollments', { params }),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`enrollments/${id}`)
  };

  // ==================== REVIEW SERVICE ====================
  reviews = {
    // Public
    getCourseReviews: (courseId: string, params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get(`reviews/course/${courseId}`, { params }),

    // Protected
    create: (courseId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`reviews/course/${courseId}`, data, { showLoader: true }),

    reply: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`reviews/${id}/reply`, data),

    markHelpful: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.post(`reviews/${id}/helpful`, {}),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`reviews/${id}`),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`reviews/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`reviews/${id}`),

    // Admin Only
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('reviews', { params })
  };

  // ==================== QUIZ SERVICE ====================
  quizzes = {
    // Student
    take: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`quizzes/${id}/take`),

    submit: (quizId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`quizzes/${quizId}/submit`, data, { showLoader: true }),

    // Instructor
    create: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('quizzes', data, { showLoader: true }),

    addQuestions: (quizId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`quizzes/${quizId}/questions`, data),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`quizzes/${id}`),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`quizzes/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`quizzes/${id}`),

    // Admin Only
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('quizzes', { params })
  };

  // ==================== ASSIGNMENT SERVICE ====================
  assignments = {
    // Student
    getMySubmissions: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('assignments/my-submissions'),

    submit: (assignmentId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`assignments/${assignmentId}/submit`, data, { showLoader: true }),

    // Instructor
    create: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('assignments', data, { showLoader: true }),

    getSubmissions: (assignmentId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`assignments/${assignmentId}/submissions`),

    grade: (submissionId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`assignments/submissions/${submissionId}/grade`, data),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`assignments/${id}`),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`assignments/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`assignments/${id}`),

    // Admin Only
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('assignments', { params })
  };

  // ==================== CODING EXERCISE SERVICE ====================
  codingExercises = {
    // Student
    execute: (exerciseId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`coding-exercises/${exerciseId}/execute`, data, { showLoader: true }),

    submit: (exerciseId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`coding-exercises/${exerciseId}/submit`, data, { showLoader: true }),

    getMySubmissions: (exerciseId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`coding-exercises/${exerciseId}/my-submissions`),

    // Instructor
    create: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('coding-exercises', data, { showLoader: true }),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`coding-exercises/${id}`),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`coding-exercises/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`coding-exercises/${id}`),

    // Admin Only
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('coding-exercises', { params })
  };

  // ==================== MOCK TEST SERVICE ====================
  mockTests = {
    // Public
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('mock-tests', { params }),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`mock-tests/${id}`),

    // Student
    getMyAttempts: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('mock-tests/my-attempts'),

    startAttempt: (mockTestId: string): Observable<ApiResponse<any>> =>
      this.baseApi.post(`mock-tests/${mockTestId}/start`, {}),

    submitAttempt: (attemptId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`mock-tests/attempts/${attemptId}/submit`, data),

    getAttemptDetails: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`mock-tests/attempts/${id}`),

    // Instructor
    create: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('mock-tests', data, { showLoader: true }),

    addQuestions: (mockTestId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`mock-tests/${mockTestId}/questions`, data),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`mock-tests/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`mock-tests/${id}`)
  };

  // ==================== PROGRESS SERVICE ====================
  progress = {
    // Student
    getMyProgress: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('progress/my-progress'),

    getCourseProgress: (courseId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`progress/course/${courseId}`),

    markLessonComplete: (courseId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`progress/course/${courseId}/lesson-complete`, data),

    // Instructor/Admin
    getStudentProgress: (studentId: string, courseId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`progress/student/${studentId}/course/${courseId}`)
  };

  // ==================== CERTIFICATE SERVICE ====================
  certificates = {
    // Public
    verify: (certificateNumber: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`certificates/verify/${certificateNumber}`, { skipAuth: true }),

    // Student
    getMyCertificates: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('certificates/my-certificates'),

    generatePDF: (id: string): Observable<Blob> =>
      this.baseApi.download(`certificates/${id}/pdf`),

    // Admin
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('certificates', { params }),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`certificates/${id}`),

    revoke: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`certificates/${id}/revoke`, {})
  };

  // ==================== NOTIFICATION SERVICE ====================
  notifications = {
    // User
    getMyNotifications: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('notifications/my-notifications'),

    markAsRead: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('notifications/mark-read', data),

    markAsImportant: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`notifications/${id}/important`, {}),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`notifications/${id}`),

    // Admin Only
    createBulk: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('notifications/bulk', data, { showLoader: true }),

    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('notifications', { params }),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`notifications/${id}`)
  };

  // ==================== PAYMENT SERVICE ====================
  payments = {
    // User
    getMyPayments: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('payments/my-payments'),

    createIntent: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('payments/create-intent', data, { showLoader: true }),

    confirm: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('payments/confirm', data, { showLoader: true }),

    // Admin Only
    refund: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.post(`payments/${id}/refund`, {}),

    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('payments', { params }),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`payments/${id}`)
  };

  // ==================== DISCUSSION SERVICE ====================
  discussions = {
    // Course discussions
    getCourseDiscussions: (courseId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`discussions?courseId=${courseId}`),

    create: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('discussions', data, { showLoader: true }),

    // Replies
    reply: (discussionId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`discussions/${discussionId}/replies`, data),

    // Interactions
    toggleLike: (type: string, id: string): Observable<ApiResponse<any>> =>
      this.baseApi.post(`discussions/${type}/${id}/like`, {}),

    pin: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`discussions/${id}/pin`, {}),

    resolve: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`discussions/${id}/resolve`, {}),

    // CRUD
    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`discussions/${id}`),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`discussions/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`discussions/${id}`),

    // Admin Only
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('discussions', { params })
  };

  // ==================== COUPON SERVICE ====================
  coupons = {
    // Validation
    validate: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('coupons/validate', data),

    apply: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('coupons/apply', data),

    // Instructor
    getMyCoupons: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('coupons/my-coupons'),

    // CRUD
    create: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('coupons', data, { showLoader: true }),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`coupons/${id}`),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`coupons/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`coupons/${id}`),

    deactivate: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`coupons/${id}/deactivate`, {}),

    // Admin Only
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('coupons', { params })
  };

  // ==================== ANNOUNCEMENT SERVICE ====================
  announcements = {
    // Student
    getCourseAnnouncements: (courseId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`announcements/course/${courseId}`),

    // Instructor
    create: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('announcements', data, { showLoader: true }),

    getMyAnnouncements: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('announcements/my-announcements'),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`announcements/${id}`),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`announcements/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`announcements/${id}`),

    // Admin Only
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('announcements', { params })
  };

  // ==================== COHORT SERVICE ====================
  cohorts = {
    // Student
    getMyCohorts: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('cohorts/my-cohorts'),

    enroll: (cohortId: string): Observable<ApiResponse<any>> =>
      this.baseApi.post(`cohorts/${cohortId}/enroll`, {}),

    // Instructor
    getInstructorCohorts: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('cohorts/instructor-cohorts'),

    create: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('cohorts', data, { showLoader: true }),

    getDetails: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`cohorts/${id}`),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`cohorts/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`cohorts/${id}`),

    getProgress: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`cohorts/${id}/progress`),

    // Admin Only
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('cohorts', { params })
  };

  // ==================== BADGE SERVICE ====================
  badges = {
    // User
    getMyBadges: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('badges/my-badges'),

    getLeaderboard: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('badges/leaderboard'),

    // Public
    getStudentBadges: (studentId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`badges/student/${studentId}`),

    // Admin/Instructor
    award: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('badges/award', data, { showLoader: true }),

    checkAndAward: (): Observable<ApiResponse<any>> =>
      this.baseApi.post('badges/check', {}),

    remove: (studentId: string, badgeId: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`badges/${studentId}/${badgeId}`),

    // Admin Only CRUD
    create: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('badges', data, { showLoader: true }),

    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('badges', { params }),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`badges/${id}`),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`badges/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`badges/${id}`)
  };

  // ==================== LEARNING PATH SERVICE ====================
  learningPaths = {
    // Public
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('learning-paths', { params }),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`learning-paths/${id}`),

    // Student
    getRecommended: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('learning-paths/recommended/me'),

    enroll: (pathId: string): Observable<ApiResponse<any>> =>
      this.baseApi.post(`learning-paths/${pathId}/enroll`, {}),

    getProgress: (pathId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`learning-paths/${pathId}/progress`),

    // Admin/Instructor
    create: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('learning-paths', data, { showLoader: true }),

    getAnalytics: (pathId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`learning-paths/${pathId}/analytics`),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`learning-paths/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`learning-paths/${id}`)
  };

  // ==================== LIVE SESSION SERVICE ====================
  liveSessions = {
    // Public
    getUpcoming: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('live-sessions/upcoming'),

    // Student
    getCourseSessions: (courseId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`live-sessions/course/${courseId}`),

    join: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.post(`live-sessions/${id}/join`, {}),

    leave: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.post(`live-sessions/${id}/leave`, {}),

    // Instructor
    create: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('live-sessions', data, { showLoader: true }),

    start: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.post(`live-sessions/${id}/start`, {}),

    end: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.post(`live-sessions/${id}/end`, {}),

    uploadRecording: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`live-sessions/${id}/recording`, data, { showLoader: true }),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`live-sessions/${id}`),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`live-sessions/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`live-sessions/${id}`),

    // Admin Only
    getAll: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('live-sessions', { params })
  };

  // ==================== STUDENT NOTES SERVICE ====================
  notes = {
    // Search
    search: (params?: any): Observable<ApiResponse<any>> =>
      this.baseApi.get('notes/search', { params }),

    // My notes
    getMyNotes: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('notes'),

    create: (courseId: string, lessonId: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post(`notes/course/${courseId}/lesson/${lessonId}`, data, { showLoader: true }),

    export: (courseId: string): Observable<Blob> =>
      this.baseApi.download(`notes/export/course/${courseId}`),

    getById: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`notes/${id}`),

    update: (id: string, data: any): Observable<ApiResponse<any>> =>
      this.baseApi.patch(`notes/${id}`, data),

    delete: (id: string): Observable<ApiResponse<any>> =>
      this.baseApi.delete(`notes/${id}`),

    // Admin Only
    getStudentNotes: (studentId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`notes/student/${studentId}`)
  };

  // ==================== ANALYTICS SERVICE ====================
  analytics = {
    // Instructor
    getInstructorAnalytics: (instructorId?: string): Observable<ApiResponse<any>> => {
      const endpoint = instructorId
        ? `analytics/instructor/${instructorId}`
        : 'analytics/instructor';
      return this.baseApi.get(endpoint);
    },

    // Student
    getStudentAnalytics: (studentId?: string): Observable<ApiResponse<any>> => {
      const endpoint = studentId
        ? `analytics/student/${studentId}`
        : 'analytics/student';
      return this.baseApi.get(endpoint);
    },

    // Admin Only
    getPlatformStats: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('analytics/platform'),

    getRevenueAnalytics: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('analytics/revenue'),

    getEngagementAnalytics: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('analytics/engagement')
  };

  // ==================== REPORTS SERVICE ====================
  reports = {
    // Report generation
    generateCourseReport: (courseId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`reports/course/${courseId}`),

    generateInstructorReport: (instructorId: string): Observable<ApiResponse<any>> =>
      this.baseApi.get(`reports/instructor/${instructorId}`),

    generatePlatformReport: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('reports/platform'),

    generateCustomReport: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('reports/custom', data, { showLoader: true })
  };

  // ==================== IMPORT/EXPORT SERVICE ====================
  importExport = {
    // Export
    exportData: (data: any): Observable<Blob> =>
      this.baseApi.download('import-export/export', {
        // method: 'POST',
        // body: JSON.stringify(data),
        // headers: { 'Content-Type': 'application/json' }
      }),

    // Import
    importData: (file: File): Observable<ApiResponse<any>> => {
      const formData = new FormData();
      formData.append('file', file);
      return this.baseApi.upload('import-export/import', formData, { showLoader: true });
    },

    // Template
    getTemplate: (type: string): Observable<Blob> =>
      this.baseApi.download(`import-export/template/${type}`),

    // Bulk operations
    bulkOperation: (data: any): Observable<ApiResponse<any>> =>
      this.baseApi.post('import-export/bulk', data, { showLoader: true })
  };

  // ==================== HEALTH CHECK ====================
  health = {
    check: (): Observable<ApiResponse<any>> =>
      this.baseApi.get('health', { skipAuth: true })
  };
}

// import { Component, ChangeDetectionStrategy, Injectable } from '@angular/core';
// import {BaseApiService} from '../http/base-api.service';
// // ==========================================
// // 2. MASTER API SERVICE
// // ==========================================

// @Injectable({ providedIn: 'root' })
// export class MasterApiService {
//   constructor(private api: BaseApiService) {}

//   public readonly auth = {
//     signup: (data: any) => this.api.post<any>('auth/signup', data),
//     login: (data: any) => this.api.post<any>('auth/login', data),
//     logout: () => this.api.get<any>('auth/logout'),
//     forgotPassword: (data: any) => this.api.post<any>('auth/forgotPassword', data),
//     resetPassword: (token: string, data: any) => this.api.patch<any>(`auth/resetPassword/${token}`, data),
//     updatePassword: (data: any) => this.api.patch<any>('auth/updateMyPassword', data),
//   };

//   public readonly users = {
//     forgotPassword: (data: any) => this.api.post<any>('users/forgotPassword', data),
//     resetPassword: (token: string, data: any) => this.api.patch<any>(`users/resetPassword/${token}`, data),
//     getMe: () => this.api.get<any>('users/me'),
//     updateMe: (data: any) => this.api.patch<any>('users/updateMe', data),
//     deleteMe: () => this.api.delete<any>('users/deleteMe'),
//     getProfile: () => this.api.get<any>('users/profile'),
//     getAll: (params?: any) => this.api.get<any>('users', { params }),
//     getById: (id: string) => this.api.get<any>(`users/${id}`),
//     update: (id: string, data: any) => this.api.patch<any>(`users/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`users/${id}`),
//   };

//   public readonly courses = {
//     search: (params?: any) => this.api.get<any>('courses/search', { params }),
//     getBySlug: (slug: string) => this.api.get<any>(`courses/slug/${slug}`),
//     getAll: (params?: any) => this.api.get<any>('courses', { params }),
//     getById: (id: string) => this.api.get<any>(`courses/${id}`),
//     getMyCourses: () => this.api.get<any>('courses/instructor/my-courses'),
//     create: (data: any) => this.api.post<any>('courses', data),
//     update: (id: string, data: any) => this.api.patch<any>(`courses/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`courses/${id}`),
//     publish: (id: string) => this.api.patch<any>(`courses/${id}/publish`, {}),
//     approve: (id: string) => this.api.patch<any>(`courses/${id}/approve`, {}),
//   };

//   public readonly sections = {
//     create: (data: any) => this.api.post<any>('sections', data),
//     getAll: (params?: any) => this.api.get<any>('sections', { params }),
//     reorder: (courseId: string, data: any) => this.api.post<any>(`sections/reorder/${courseId}`, data),
//     getById: (id: string) => this.api.get<any>(`sections/${id}`),
//     update: (id: string, data: any) => this.api.patch<any>(`sections/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`sections/${id}`),
//   };

//   public readonly lessons = {
//     getAccess: (id: string) => this.api.get<any>(`lessons/${id}/access`),
//     create: (data: any) => this.api.post<any>('lessons', data),
//     getAll: (params?: any) => this.api.get<any>('lessons', { params }),
//     reorder: (sectionId: string, data: any) => this.api.post<any>(`lessons/reorder/${sectionId}`, data),
//     getById: (id: string) => this.api.get<any>(`lessons/${id}`),
//     update: (id: string, data: any) => this.api.patch<any>(`lessons/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`lessons/${id}`),
//   };

//   public readonly categories = {
//     getTree: () => this.api.get<any>('categories/tree'),
//     getAll: (params?: any) => this.api.get<any>('categories', { params }),
//     getById: (id: string) => this.api.get<any>(`categories/${id}`),
//     getWithCourses: (id: string) => this.api.get<any>(`categories/${id}/courses`),
//     create: (data: any) => this.api.post<any>('categories', data),
//     update: (id: string, data: any) => this.api.patch<any>(`categories/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`categories/${id}`),
//   };

//   public readonly enrollments = {
//     getMy: (params?: any) => this.api.get<any>('enrollments/my-enrollments', { params }),
//     enroll: (data: any) => this.api.post<any>('enrollments/enroll', data),
//     getCourseStudents: (courseId: string) => this.api.get<any>(`enrollments/course/${courseId}/students`),
//     revoke: (id: string) => this.api.patch<any>(`enrollments/${id}/revoke`, {}),
//     getAll: (params?: any) => this.api.get<any>('enrollments', { params }),
//     getById: (id: string) => this.api.get<any>(`enrollments/${id}`),
//   };

//   public readonly reviews = {
//     getCourseReviews: (courseId: string) => this.api.get<any>(`reviews/course/${courseId}`),
//     createCourseReview: (courseId: string, data: any) => this.api.post<any>(`reviews/course/${courseId}`, data),
//     reply: (id: string, data: any) => this.api.post<any>(`reviews/${id}/reply`, data),
//     markHelpful: (id: string) => this.api.post<any>(`reviews/${id}/helpful`, {}),
//     getById: (id: string) => this.api.get<any>(`reviews/${id}`),
//     update: (id: string, data: any) => this.api.patch<any>(`reviews/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`reviews/${id}`),
//     getAll: (params?: any) => this.api.get<any>('reviews', { params }),
//   };

//   public readonly quizzes = {
//     takeQuiz: (id: string) => this.api.get<any>(`quizzes/${id}/take`),
//     submitQuiz: (quizId: string, data: any) => this.api.post<any>(`quizzes/${quizId}/submit`, data),
//     create: (data: any) => this.api.post<any>('quizzes', data),
//     addQuestions: (quizId: string, data: any) => this.api.post<any>(`quizzes/${quizId}/questions`, data),
//     getById: (id: string) => this.api.get<any>(`quizzes/${id}`),
//     update: (id: string, data: any) => this.api.patch<any>(`quizzes/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`quizzes/${id}`),
//     getAll: (params?: any) => this.api.get<any>('quizzes', { params }),
//   };

//   public readonly assignments = {
//     getMySubmissions: () => this.api.get<any>('assignments/my-submissions'),
//     submit: (assignmentId: string, data: any) => this.api.post<any>(`assignments/${assignmentId}/submit`, data),
//     create: (data: any) => this.api.post<any>('assignments', data),
//     getSubmissions: (assignmentId: string) => this.api.get<any>(`assignments/${assignmentId}/submissions`),
//     gradeSubmission: (submissionId: string, data: any) => this.api.post<any>(`assignments/submissions/${submissionId}/grade`, data),
//     getById: (id: string) => this.api.get<any>(`assignments/${id}`),
//     update: (id: string, data: any) => this.api.patch<any>(`assignments/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`assignments/${id}`),
//     getAll: (params?: any) => this.api.get<any>('assignments', { params }),
//   };

//   public readonly codingExercises = {
//     execute: (exerciseId: string, data: any) => this.api.post<any>(`coding-exercises/${exerciseId}/execute`, data),
//     submit: (exerciseId: string, data: any) => this.api.post<any>(`coding-exercises/${exerciseId}/submit`, data),
//     getMySubmissions: (exerciseId: string) => this.api.get<any>(`coding-exercises/${exerciseId}/my-submissions`),
//     create: (data: any) => this.api.post<any>('coding-exercises', data),
//     getById: (id: string) => this.api.get<any>(`coding-exercises/${id}`),
//     update: (id: string, data: any) => this.api.patch<any>(`coding-exercises/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`coding-exercises/${id}`),
//     getAll: (params?: any) => this.api.get<any>('coding-exercises', { params }),
//   };

//   public readonly mockTests = {
//     getAll: (params?: any) => this.api.get<any>('mock-tests', { params }),
//     getById: (id: string) => this.api.get<any>(`mock-tests/${id}`),
//     getMyAttempts: () => this.api.get<any>('mock-tests/my-attempts'),
//     startAttempt: (mockTestId: string) => this.api.post<any>(`mock-tests/${mockTestId}/start`, {}),
//     submitAttempt: (attemptId: string, data: any) => this.api.post<any>(`mock-tests/attempts/${attemptId}/submit`, data),
//     getAttemptDetails: (id: string) => this.api.get<any>(`mock-tests/attempts/${id}`),
//     create: (data: any) => this.api.post<any>('mock-tests', data),
//     addQuestions: (mockTestId: string, data: any) => this.api.post<any>(`mock-tests/${mockTestId}/questions`, data),
//     update: (id: string, data: any) => this.api.patch<any>(`mock-tests/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`mock-tests/${id}`),
//   };

//   public readonly progress = {
//     getMyProgress: () => this.api.get<any>('progress/my-progress'),
//     getCourseProgress: (courseId: string) => this.api.get<any>(`progress/course/${courseId}`),
//     markLessonComplete: (courseId: string, data: any) => this.api.post<any>(`progress/course/${courseId}/lesson-complete`, data),
//     getStudentProgress: (studentId: string, courseId: string) => this.api.get<any>(`progress/student/${studentId}/course/${courseId}`),
//   };

//   public readonly certificates = {
//     verify: (certNumber: string) => this.api.get<any>(`certificates/verify/${certNumber}`, { skipAuth: true }),
//     getMyCertificates: () => this.api.get<any>('certificates/my-certificates'),
//     generatePdf: (id: string) => this.api.get<any>(`certificates/${id}/pdf`),
//     revoke: (id: string) => this.api.patch<any>(`certificates/${id}/revoke`, {}),
//     getAll: (params?: any) => this.api.get<any>('certificates', { params }),
//     getById: (id: string) => this.api.get<any>(`certificates/${id}`),
//   };

//   public readonly notifications = {
//     getMy: () => this.api.get<any>('notifications/my-notifications'),
//     markRead: (data: any) => this.api.post<any>('notifications/mark-read', data),
//     markImportant: (id: string) => this.api.patch<any>(`notifications/${id}/important`, {}),
//     delete: (id: string) => this.api.delete<any>(`notifications/${id}`),
//     createBulk: (data: any) => this.api.post<any>('notifications/bulk', data),
//     getAll: (params?: any) => this.api.get<any>('notifications', { params }),
//     getById: (id: string) => this.api.get<any>(`notifications/${id}`),
//   };

//   public readonly payments = {
//     getMy: () => this.api.get<any>('payments/my-payments'),
//     createIntent: (data: any) => this.api.post<any>('payments/create-intent', data),
//     confirm: (data: any) => this.api.post<any>('payments/confirm', data),
//     refund: (id: string, data: any) => this.api.post<any>(`payments/${id}/refund`, data),
//     getAll: (params?: any) => this.api.get<any>('payments', { params }),
//     getById: (id: string) => this.api.get<any>(`payments/${id}`),
//   };

//   public readonly discussions = {
//     getCourseDiscussions: (params?: any) => this.api.get<any>('discussions', { params }),
//     create: (data: any) => this.api.post<any>('discussions', data),
//     reply: (discussionId: string, data: any) => this.api.post<any>(`discussions/${discussionId}/replies`, data),
//     toggleLike: (type: string, id: string) => this.api.post<any>(`discussions/${type}/${id}/like`, {}),
//     pin: (id: string) => this.api.patch<any>(`discussions/${id}/pin`, {}),
//     markResolved: (id: string) => this.api.patch<any>(`discussions/${id}/resolve`, {}),
//     getById: (id: string) => this.api.get<any>(`discussions/${id}`),
//     update: (id: string, data: any) => this.api.patch<any>(`discussions/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`discussions/${id}`),
//     getAll: (params?: any) => this.api.get<any>('discussions', { params }),
//   };

//   public readonly coupons = {
//     validate: (data: any) => this.api.post<any>('coupons/validate', data),
//     apply: (data: any) => this.api.post<any>('coupons/apply', data),
//     getMyCoupons: () => this.api.get<any>('coupons/my-coupons'),
//     create: (data: any) => this.api.post<any>('coupons', data),
//     getAll: (params?: any) => this.api.get<any>('coupons', { params }),
//     getById: (id: string) => this.api.get<any>(`coupons/${id}`),
//     update: (id: string, data: any) => this.api.patch<any>(`coupons/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`coupons/${id}`),
//     deactivate: (id: string) => this.api.patch<any>(`coupons/${id}/deactivate`, {}),
//   };

//   public readonly announcements = {
//     getCourseAnnouncements: (courseId: string) => this.api.get<any>(`announcements/course/${courseId}`),
//     create: (data: any) => this.api.post<any>('announcements', data),
//     getMyAnnouncements: () => this.api.get<any>('announcements/my-announcements'),
//     getById: (id: string) => this.api.get<any>(`announcements/${id}`),
//     update: (id: string, data: any) => this.api.patch<any>(`announcements/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`announcements/${id}`),
//     getAll: (params?: any) => this.api.get<any>('announcements', { params }),
//   };

//   public readonly cohorts = {
//     getMyCohorts: () => this.api.get<any>('cohorts/my-cohorts'),
//     enroll: (cohortId: string) => this.api.post<any>(`cohorts/${cohortId}/enroll`, {}),
//     getInstructorCohorts: () => this.api.get<any>('cohorts/instructor-cohorts'),
//     create: (data: any) => this.api.post<any>('cohorts', data),
//     getById: (id: string) => this.api.get<any>(`cohorts/${id}`),
//     update: (id: string, data: any) => this.api.patch<any>(`cohorts/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`cohorts/${id}`),
//     getProgress: (id: string) => this.api.get<any>(`cohorts/${id}/progress`),
//     getAll: (params?: any) => this.api.get<any>('cohorts', { params }),
//   };

//   public readonly badges = {
//     getMyBadges: () => this.api.get<any>('badges/my-badges'),
//     getLeaderboard: () => this.api.get<any>('badges/leaderboard'),
//     getStudentBadges: (studentId: string) => this.api.get<any>(`badges/student/${studentId}`),
//     award: (data: any) => this.api.post<any>('badges/award', data),
//     checkAndAward: (data: any) => this.api.post<any>('badges/check', data),
//     removeBadge: (studentId: string, badgeId: string) => this.api.delete<any>(`badges/${studentId}/${badgeId}`),
//     create: (data: any) => this.api.post<any>('badges', data),
//     getAll: (params?: any) => this.api.get<any>('badges', { params }),
//     getById: (id: string) => this.api.get<any>(`badges/${id}`),
//     update: (id: string, data: any) => this.api.patch<any>(`badges/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`badges/${id}`),
//   };

//   public readonly learningPaths = {
//     getAll: (params?: any) => this.api.get<any>('learning-paths', { params }),
//     getById: (id: string) => this.api.get<any>(`learning-paths/${id}`),
//     getRecommended: () => this.api.get<any>('learning-paths/recommended/me'),
//     enroll: (pathId: string) => this.api.post<any>(`learning-paths/${pathId}/enroll`, {}),
//     getProgress: (pathId: string) => this.api.get<any>(`learning-paths/${pathId}/progress`),
//     create: (data: any) => this.api.post<any>('learning-paths', data),
//     getAnalytics: (pathId: string) => this.api.get<any>(`learning-paths/${pathId}/analytics`),
//     update: (id: string, data: any) => this.api.patch<any>(`learning-paths/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`learning-paths/${id}`),
//   };

//   public readonly liveSessions = {
//     getUpcoming: () => this.api.get<any>('live-sessions/upcoming'),
//     getCourseSessions: (courseId: string) => this.api.get<any>(`live-sessions/course/${courseId}`),
//     join: (id: string) => this.api.post<any>(`live-sessions/${id}/join`, {}),
//     leave: (id: string) => this.api.post<any>(`live-sessions/${id}/leave`, {}),
//     create: (data: any) => this.api.post<any>('live-sessions', data),
//     start: (id: string) => this.api.post<any>(`live-sessions/${id}/start`, {}),
//     end: (id: string) => this.api.post<any>(`live-sessions/${id}/end`, {}),
//     uploadRecording: (id: string, data: any) => this.api.post<any>(`live-sessions/${id}/recording`, data),
//     getById: (id: string) => this.api.get<any>(`live-sessions/${id}`),
//     update: (id: string, data: any) => this.api.patch<any>(`live-sessions/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`live-sessions/${id}`),
//     getAll: (params?: any) => this.api.get<any>('live-sessions', { params }),
//   };

//   public readonly notes = {
//     search: (params?: any) => this.api.get<any>('notes/search', { params }),
//     getMyNotes: () => this.api.get<any>('notes'),
//     create: (courseId: string, lessonId: string, data: any) => this.api.post<any>(`notes/course/${courseId}/lesson/${lessonId}`, data),
//     exportCourseNotes: (courseId: string) => this.api.get<any>(`notes/export/course/${courseId}`),
//     getById: (id: string) => this.api.get<any>(`notes/${id}`),
//     update: (id: string, data: any) => this.api.patch<any>(`notes/${id}`, data),
//     delete: (id: string) => this.api.delete<any>(`notes/${id}`),
//     getStudentNotes: (studentId: string) => this.api.get<any>(`notes/student/${studentId}`),
//   };

//   public readonly analytics = {
//     getInstructorAnalytics: (id?: string) => id ? this.api.get<any>(`analytics/instructor/${id}`) : this.api.get<any>('analytics/instructor'),
//     getStudentAnalytics: (id?: string) => id ? this.api.get<any>(`analytics/student/${id}`) : this.api.get<any>('analytics/student'),
//     getPlatformStats: () => this.api.get<any>('analytics/platform'),
//     getRevenueAnalytics: () => this.api.get<any>('analytics/revenue'),
//     getEngagementAnalytics: () => this.api.get<any>('analytics/engagement'),
//   };

//   public readonly reports = {
//     generateCourseReport: (courseId: string) => this.api.get<any>(`reports/course/${courseId}`),
//     generateInstructorReport: (instructorId: string) => this.api.get<any>(`reports/instructor/${instructorId}`),
//     generatePlatformReport: () => this.api.get<any>('reports/platform'),
//     generateCustomReport: (data: any) => this.api.post<any>('reports/custom', data),
//   };

//   public readonly importExport = {
//     exportData: (data: any) => this.api.post<any>('import-export/export', data),
//     importData: (formData: FormData) => this.api.upload<any>('import-export/import', formData),
//     getTemplate: (type: string) => this.api.get<any>(`import-export/template/${type}`),
//     bulkOperation: (data: any) => this.api.post<any>('import-export/bulk', data),
//   };
// }