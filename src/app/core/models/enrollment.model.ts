// enrollment.model.ts

import { Course } from './course.model';
import { User } from './user.model'; // Assuming you have a User model

export interface Payment {
  _id: string;
  user: string | User;
  course?: string | Course;
  mockTest?: string;
  amount: number;
  currency: string;
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'upi' | 'razorpay' | 'stripe';
  transactionId: string;
  paymentGateway?: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressTracking {
  _id?: string;
  student: string | User;
  course: string | Course;
  courseProgressPercentage: number;
  lastActivity: string;
}

export interface Enrollment {
  _id: string;
  course: string | Course;
  student: string | User;
  payment?: string | Payment;
  enrolledAt: string;
  expiryDate?: string;
  isActive: boolean;
  isRevoked: boolean;
  
  // Virtual / Populated field attached via backend's getMyEnrollments
  progress?: ProgressTracking; 
  
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentPayload {
  courseId: string;
  paymentId?: string;
}

export interface EnrollmentProgress {
  enrollmentId: string;
  courseId: string;
  studentId: string;
  progress: number;
  completedLessons: string[];
  lastLessonId?: string;
  lastLessonAt?: string;
  estimatedCompletionDate?: string;
}
