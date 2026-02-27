// category.model.ts
export interface Category {
  _id: any;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  image?: string;
  parentCategory?: Category | string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
  courseCount?: number;
  __v?: number;
}

// lesson.model.ts
export interface Lesson {
  _id: string;
  title: string;
  description?: string;
  section: string | any;
  course: string | any;
  type: 'video' | 'article' | 'quiz' | 'assignment' | 'coding-exercise';
  content: {
    video?: {
      url: string;
      duration: number;
      thumbnail?: string;
      provider: 'youtube' | 'vimeo' | 'wistia' | 'local';
    };
    article?: {
      body: string;
      attachments?: string[];
    };
    quiz?: string; // Quiz ID
    assignment?: string; // Assignment ID
    codingExercise?: string; // CodingExercise ID
  };
  order: number;
  duration: number;
  isFree: boolean;
  isPublished: boolean;
  resources?: Array<{
    title: string;
    type: 'pdf' | 'code' | 'link' | 'image';
    url: string;
    _id?: string;
  }>;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

// section.model.ts
export interface Section {
  _id: string;
  course: string | any;
  title: string;
  description?: string;
  order: number;
  totalLessons: number;
  totalDuration: number;
  isPublished: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  lessons?: Lesson[];
  __v?: number;
}

// user.model.ts (updated)
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
  role: 'admin' | 'instructor' | 'student';
  isActive: boolean;
  isEmailVerified: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  __v?: number;
}

// course.model.ts (updated with sections)
export interface Course {
  _id: string;
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
  discountStartDate?: string;
  discountEndDate?: string;
  isFree: boolean;
  currency: string;
  totalDuration: number;
  totalLessons: number;
  totalSections: number;
  rating: number;
  totalRatings: number;
  totalEnrollments: number;
  totalReviews: number;
  requirements: string[];
  whatYouWillLearn: string[];
  targetAudience: string[];
  tags: string[];
  isPublished: boolean;
  isApproved: boolean;
  approvedBy?: string | User;
  approvedAt?: string;
  publishedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  sections?: Section[];
  __v?: number;
}