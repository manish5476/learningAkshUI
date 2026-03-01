// ==========================================
// core.models.ts
// ==========================================

export interface BaseModel {
  _id: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// ==========================================
// 1. USERS & PROFILES
// ==========================================

export interface User extends BaseModel {
  email: string;
  password?: string; // Optional since it's select: false
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
  phoneNumber?: string;
  dateOfBirth?: string | Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  role: 'student' | 'instructor' | 'admin';
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: string | Date;
  isDeleted: boolean;
  deletedAt?: string | Date | null;
}

export interface InstructorProfile extends BaseModel {
  user: string | User;
  bio?: string;
  qualifications?: Array<{
    degree?: string;
    institution?: string;
    year?: number;
    certificate?: string;
  }>;
  expertise?: Array<'Web Development' | 'Data Science' | 'Mobile Development' | 'DevOps' | 'Cloud Computing' | 'AI/ML' | 'Cybersecurity' | 'Database' | 'Programming Languages'>;
  experience?: {
    years?: number;
    summary?: string;
  };
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  rating: number;
  totalStudents: number;
  totalCourses: number;
  totalReviews: number;
  isApproved: boolean;
  approvedBy?: string | User;
  approvedAt?: string | Date;
  paymentDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    ifscCode?: string;
    paypalEmail?: string;
  };
}

export interface StudentProfile extends BaseModel {
  user: string | User;
  education?: Array<{
    degree?: string;
    institution?: string;
    fieldOfStudy?: string;
    startDate?: string | Date;
    endDate?: string | Date;
    grade?: string;
  }>;
  interests?: Array<'Web Development' | 'Data Science' | 'Mobile Development' | 'DevOps' | 'Cloud Computing' | 'AI/ML' | 'Cybersecurity' | 'Programming' | 'Design'>;
  enrollments?: Array<string | Enrollment>;
  wishlist?: Array<string | Course>;
  savedForLater?: Array<string | Course>;
  learningPath?: Array<string | LearningPath>;
  preferences?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    language: string;
    theme: 'light' | 'dark';
  };
}

// ==========================================
// 2. CORE LMS (COURSES, LESSONS, CATEGORIES)
// ==========================================

export interface Category extends BaseModel {
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  image?: string;
  parentCategory?: string | Category;
  isActive: boolean;
  isDeleted: boolean;
}

export interface Course extends BaseModel {
  title: string;
  subtitle?: string;
  slug: string;
  description: string;
  category: string | Category;
  instructor: string | User;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  language: string;
  thumbnail?: string;
  previewVideo?: string;
  price: number;
  discountPrice?: number;
  discountStartDate?: string | Date;
  discountEndDate?: string | Date;
  isFree: boolean;
  currency: string;
  totalDuration: number;
  totalLessons: number;
  totalSections: number;
  rating: number;
  totalRatings: number;
  totalEnrollments: number;
  totalReviews: number;
  requirements?: string[];
  whatYouWillLearn?: string[];
  targetAudience?: string[];
  tags?: string[];
  isPublished: boolean;
  isApproved: boolean;
  approvedBy?: string | User;
  approvedAt?: string | Date;
  publishedAt?: string | Date;
  isDeleted: boolean;
  deletedAt?: string | Date | null;
}

export interface Section extends BaseModel {
  course: string | Course;
  title: string;
  description?: string;
  order: number;
  totalLessons: number;
  totalDuration: number;
  isPublished: boolean;
  isDeleted: boolean;
}

export interface Lesson extends BaseModel {
  section: string | Section;
  course: string | Course;
  title: string;
  description?: string;
  type: 'video' | 'article' | 'quiz' | 'assignment' | 'coding-exercise';
  content?: {
    video?: { url?: string; duration?: number; thumbnail?: string; provider?: 'youtube' | 'vimeo' | 'wistia' | 'local' };
    article?: { body?: string; attachments?: string[] };
    quiz?: string | Quiz;
    assignment?: string | Assignment;
    codingExercise?: string | CodingExercise;
  };
  order: number;
  duration: number;
  isFree: boolean;
  isPublished: boolean;
  resources?: Array<{
    title?: string;
    type?: 'pdf' | 'code' | 'link' | 'image';
    url?: string;
  }>;
  isDeleted: boolean;
}

// ==========================================
// 3. QUIZZES & MOCK TESTS
// ==========================================

export interface Quiz extends BaseModel {
  title: string;
  description?: string;
  course: string | Course;
  lesson?: string | Lesson;
  timeLimit: number;
  passingScore: number;
  maxAttempts: number;
  totalQuestions: number;
  totalPoints: number;
  isPublished: boolean;
  isDeleted: boolean;
}

export interface QuizQuestion extends BaseModel {
  quiz: string | Quiz;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  options?: Array<{ text?: string; isCorrect?: boolean }>;
  correctAnswer?: string;
  points: number;
  explanation?: string;
  order?: number;
}

export interface MockTest extends BaseModel {
  title: string;
  description?: string;
  category: string | Category;
  instructor: string | User;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  instructions?: string[];
  tags?: string[];
  isFree: boolean;
  price: number;
  isPublished: boolean;
  isApproved: boolean;
  attemptsCount: number;
  averageScore: number;
  isDeleted: boolean;
}

export interface MockTestQuestion extends BaseModel {
  mockTest: string | MockTest;
  sectionName: string;
  question: string;
  options?: Array<{ text?: string; isCorrect?: boolean }>;
  marks: number;
  negativeMarks: number;
  explanation?: string;
  order?: number;
}

export interface MockTestAttempt extends BaseModel {
  mockTest: string | MockTest;
  student: string | User;
  startedAt: string | Date;
  completedAt?: string | Date;
  timeTaken?: number;
  answers?: Array<{
    questionId?: string | MockTestQuestion;
    selectedOptionIndex?: number;
    answerText?: string;
    isCorrect?: boolean;
    marksObtained?: number;
  }>;
  score: number;
  percentage: number;
  rank?: number;
  totalStudents?: number;
  status: 'started' | 'in-progress' | 'completed' | 'abandoned';
  isPassed?: boolean;
  feedback?: string;
}

// ==========================================
// 4. ASSIGNMENTS & CODING
// ==========================================

export interface Assignment extends BaseModel {
  title: string;
  description: string;
  course: string | Course;
  lesson?: string | Lesson;
  dueDate?: string | Date;
  totalPoints: number;
  passingPoints: number;
  attachments?: string[];
  resources?: string[];
  instructions?: string;
  submissionType: 'file-upload' | 'text-entry' | 'both';
  allowedFileTypes?: string[];
  maxFileSize: number;
  isPublished: boolean;
  isDeleted: boolean;
}

export interface AssignmentSubmission extends BaseModel {
  assignment: string | Assignment;
  student: string | User;
  submittedAt: string | Date;
  content?: string;
  attachments?: string[];
  status: 'submitted' | 'graded' | 'late-submitted';
  grade?: {
    points?: number;
    percentage?: number;
    feedback?: string;
    gradedBy?: string | User;
    gradedAt?: string | Date;
  };
  isLate: boolean;
}

export interface CodingExercise extends BaseModel {
  title: string;
  description: string;
  course: string | Course;
  lesson?: string | Lesson;
  language: 'javascript' | 'python' | 'java' | 'cpp' | 'csharp' | 'ruby' | 'php';
  initialCode?: string;
  solutionCode?: string;
  testCases?: Array<{
    input?: string;
    expectedOutput?: string;
    isHidden?: boolean;
    points?: number;
  }>;
  constraints?: string[];
  hints?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  totalPoints: number;
  timeLimit?: number;
  memoryLimit?: number;
  isPublished: boolean;
  isDeleted: boolean;
}

export interface CodingSubmission extends BaseModel {
  exercise: string | CodingExercise;
  student: string | User;
  code: string;
  language?: string;
  submittedAt: string | Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  testResults?: Array<{
    testCase?: string;
    passed?: boolean;
    output?: string;
    expectedOutput?: string;
    points?: number;
  }>;
  totalPoints?: number;
  executionTime?: number;
  memoryUsed?: number;
  error?: string;
}

// ==========================================
// 5. COMMERCE & ENROLLMENTS
// ==========================================

export interface Payment extends BaseModel {
  user: string | User;
  course?: string | Course;
  mockTest?: string | MockTest;
  amount: number;
  currency: string;
  paymentMethod?: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'upi' | 'razorpay' | 'stripe';
  transactionId: string;
  paymentGateway?: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string | Date;
  metadata?: any;
}

export interface Enrollment extends BaseModel {
  course: string | Course;
  student: string | User;
  payment?: string | Payment;
  enrolledAt: string | Date;
  expiryDate?: string | Date;
  isActive: boolean;
  isRevoked: boolean;
}

export interface Coupon extends BaseModel {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount' | 'free';
  discountValue: number;
  validForCourses?: Array<string | Course>;
  instructor?: string | User;
  startDate: string | Date;
  expiryDate: string | Date;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
}

// ==========================================
// 6. SOCIAL, COMMUNICATION & LIVE
// ==========================================

export interface Review extends BaseModel {
  course: string | Course;
  user: string | User;
  rating: number;
  title?: string;
  comment: string;
  pros?: string[];
  cons?: string[];
  isVerified: boolean;
  helpfulCount: number;
  replyFromInstructor?: {
    comment?: string;
    repliedAt?: string | Date;
  };
  isApproved: boolean;
}

export interface Discussion extends BaseModel {
  course: string | Course;
  lesson?: string | Lesson;
  user: string | User;
  title: string;
  content: string;
  likes?: Array<string | User>;
  isPinned: boolean;
  isResolved: boolean;
  totalReplies: number;
}

export interface DiscussionReply extends BaseModel {
  discussion: string | Discussion;
  user: string | User;
  content: string;
  isEdited: boolean;
  likes?: Array<string | User>;
}

export interface Announcement extends BaseModel {
  course: string | Course;
  instructor: string | User;
  title: string;
  content: string;
  sendEmailNotification: boolean;
  isDeleted: boolean;
}

export interface Cohort extends BaseModel {
  name: string;
  course: string | Course;
  instructors?: Array<string | User>;
  startDate: string | Date;
  endDate: string | Date;
  maxStudents?: number;
  enrolledStudents?: Array<string | User>;
  scheduleInfo?: string;
  isActive: boolean;
}

export interface LiveSession extends BaseModel {
  title: string;
  description?: string;
  course?: string | Course;
  instructor: string | User;
  startTime: string | Date;
  endTime: string | Date;
  duration?: number;
  meetingLink?: string;
  recordingUrl?: string;
  participants?: Array<{
    user?: string | User;
    joinedAt?: string | Date;
    leftAt?: string | Date;
  }>;
  maxParticipants?: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  isRecorded: boolean;
  materials?: string[];
  isDeleted: boolean;
}

export interface Notification extends BaseModel {
  user: string | User;
  type: 'course_update' | 'new_course' | 'discount' | 'assignment_grade' | 'certificate_issued' | 'payment_received' | 'mocktest_result' | 'reminder';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  isImportant: boolean;
  expiresAt?: string | Date;
}

export interface LearningPath extends BaseModel {
  title: string;
  description?: string;
  category?: string | Category;
  level?: 'beginner' | 'intermediate' | 'advanced';
  courses?: Array<{
    course?: string | Course;
    order?: number;
    isRequired?: boolean;
  }>;
  duration?: number;
  totalCourses?: number;
  totalCredits?: number;
  skills?: string[];
  careerOpportunities?: string[];
  prerequisites?: string[];
  isPublished: boolean;
  isDeleted: boolean;
}

// ==========================================
// 7. PROGRESS, BADGES & CERTIFICATES
// ==========================================

export interface ProgressTracking extends BaseModel {
  student: string | User;
  course: string | Course;
  completedLessons?: Array<{
    lesson?: string | Lesson;
    completedAt?: string | Date;
    timeSpent?: number;
    attempts?: number;
  }>;
  completedQuizzes?: Array<{
    quiz?: string | Quiz;
    score?: number;
    completedAt?: string | Date;
    attempts?: number;
  }>;
  completedAssignments?: Array<{
    assignment?: string | Assignment;
    score?: number;
    completedAt?: string | Date;
  }>;
  courseProgressPercentage: number;
  totalTimeSpent: number;
  lastActivity?: string | Date;
  isCompleted: boolean;
  completedAt?: string | Date;
}

export interface Certificate extends BaseModel {
  student: string | User;
  course: string | Course;
  certificateNumber: string;
  studentName?: string;
  courseName?: string;
  issueDate: string | Date;
  expiryDate?: string | Date;
  grade?: string;
  percentage?: number;
  instructor?: string | User;
  instructorName?: string;
  certificateUrl?: string;
  verificationUrl?: string;
  isValid: boolean;
}

export interface Badge extends BaseModel {
  name: string;
  description: string;
  iconUrl: string;
  criteria: 'complete_course' | 'perfect_quiz' | 'first_login' | '7_day_streak' | '100_hours_watched';
  points: number;
}

export interface UserBadge extends BaseModel {
  student: string | User;
  badge: string | Badge;
  earnedAt: string | Date;
  context?: any;
}

export interface StudentNote extends BaseModel {
  student: string | User;
  course: string | Course;
  lesson: string | Lesson;
  content: string;
  videoTimestamp: number;
  isDeleted: boolean;
}

// ==========================================
// 8. LOGS & SETTINGS
// ==========================================

export interface AuditLog extends BaseModel {
  user?: string | User;
  action?: string;
  resource?: string;
  method?: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  timestamp: string | Date;
  requestBody?: any;
  requestParams?: any;
  requestQuery?: any;
  responseBody?: any;
  duration?: number;
}

export interface ActivityLog extends BaseModel {
  user?: string | User;
  type?: 'login' | 'logout' | 'enrollment' | 'course_complete' | 'payment' | 'review' | 'discussion';
  description?: string;
  metadata?: any;
  ip?: string;
  userAgent?: string;
}

export interface SystemSettings extends BaseModel {
  key: string;
  value?: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  isPublic: boolean;
  updatedBy?: string | User;
}

// ==========================================
// 9. FORM DTOs (Data Transfer Objects)
// ==========================================
// Use these strictly for creating/submitting data from your Angular Reactive Forms.

export interface CreateCertificateForm {
  student: string;
  course: string;
  certificateNumber: string;
  studentName?: string;
  courseName?: string;
  grade?: string;
  percentage?: number;
  instructor?: string;
  instructorName?: string;
  certificateUrl?: string;
  verificationUrl?: string;
}

export interface CreateCourseForm {
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  instructor: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  language: string;
  price: number;
  isFree?: boolean;
}

export interface SubmitQuizForm {
  mockTest: string;
  student: string;
  timeTaken: number;
  answers: Array<{
    questionId: string;
    selectedOptionIndex?: number;
    answerText?: string;
  }>;
}