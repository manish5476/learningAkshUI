export interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  image?: string;
  parentCategory?: string | Category;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Instructor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
}

export interface Course {
  expanded: boolean;
  _id: string;
  title: string;
  subtitle?: string;
  slug: string;
  description: string;
  category: Category;
  instructor: Instructor;
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
  approvedBy?: string | Instructor;
  approvedAt?: string;
  publishedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFormData {
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  language: string;
  thumbnail?: string;
  previewVideo?: string;
  price: number;
  discountPrice?: number | null;
  discountStartDate?: string | null;
  discountEndDate?: string | null;
  isFree: boolean;
  currency: string;
  requirements: string[];
  whatYouWillLearn: string[];
  targetAudience: string[];
  tags: string[];
}

export interface Section {
  _id: string;
  course: string | Course;
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
}

export interface Lesson {
  _id: string;
  section: string | Section;
  course: string | Course;
  title: string;
  description?: string;
  type: 'video' | 'article' | 'quiz' | 'assignment' | 'coding-exercise';
  content: any;
  order: number;
  duration: number;
  isFree: boolean;
  isPublished: boolean;
  resources?: any[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseWithContent {
  course: Course;
  sections: (Section & { lessons: Lesson[] })[];
  isEnrolled: boolean;
}

export interface CourseQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  search?: string;
  category?: string;
  level?: string;
  price?: string;
  language?: string;
  instructor?: string;
  isPublished?: boolean;
  isApproved?: boolean;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
}