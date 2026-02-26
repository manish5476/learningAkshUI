export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  profile:string
  profilePicture?: string;
  phoneNumber?: string;
  role: 'student' | 'instructor' | 'admin';
  isActive: boolean;
  isEmailVerified: boolean;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}

export interface InstructorProfile extends User {
  bio?: string;
  qualifications: any[];
  expertise: string[];
  profile:string,
  experience: { years: number; summary: string };
  rating: number;
  isApproved: boolean;
}

export interface StudentProfile extends User {
  education: any[];
  interests: string[];
  wishlist: string[];
}