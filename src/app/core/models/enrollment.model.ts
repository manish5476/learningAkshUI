export interface Enrollment {
  _id: string;
  course: {
    _id: string;
    title: string;
    thumbnail?: string;
    instructor?: {
      _id: string;
      firstName: string;
      lastName: string;
    };
  };
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  payment?: {
    _id: string;
    amount: number;
    currency: string;
    status: string;
    transactionId: string;
  };
  enrolledAt: Date;
  expiryDate?: Date;
  isActive: boolean;
  isRevoked: boolean;
  progress?: EnrollmentProgress;
}

export interface EnrollmentProgress {
  _id: string;
  student: string;
  course: string;
  completedLessons: Array<{
    lesson: string;
    completedAt: Date;
    timeSpent?: number;
    attempts?: number;
  }>;
  completedQuizzes?: Array<{
    quiz: string;
    score: number;
    completedAt: Date;
    attempts?: number;
  }>;
  completedAssignments?: Array<{
    assignment: string;
    score: number;
    completedAt: Date;
  }>;
  courseProgressPercentage: number;
  totalTimeSpent: number;
  lastActivity: Date;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface EnrollmentStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  totalRevenue: number;
  byCourse: Array<{
    course: string;
    count: number;
    revenue: number;
  }>;
}

export interface CourseAnalytics {
  totalEnrollments: number;
  completed: number;
  completionRate: number;
  avgProgress: number;
  dailyActive: Array<{
    _id: string;
    count: number;
  }>;
  enrollmentsOverTime: Array<{
    _id: string;
    count: number;
  }>;
}

export interface EnrollmentTrend {
  _id: string;
  count: number;
  revenue?: number;
}