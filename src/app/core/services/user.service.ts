// user.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';
import { User } from '../models/user.model';

export interface UserProfileResponse {
  user: User;
  profile?: any;
}

export interface UsersListResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    totalResults: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly endpoint = 'users';
  private baseApi = inject(BaseApiService);

  // --- Public Auth Methods ---
  forgotPassword(email: string): Observable<ApiResponse> {
    return this.baseApi.post(`${this.endpoint}/forgotPassword`, { email }, { 
      skipAuth: true,
      showLoader: true 
    });
  }

  resetPassword(token: string, passwordData: any): Observable<ApiResponse> {
    return this.baseApi.patch(`${this.endpoint}/resetPassword/${token}`, passwordData, { 
      skipAuth: true,
      showLoader: true 
    });
  }

  // --- Current User (Me) Methods ---
  getMe(): Observable<ApiResponse<User>> {
    return this.baseApi.get<User>(`${this.endpoint}/me`, { showLoader: true });
  }

  updateMe(userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.baseApi.patch<User>(`${this.endpoint}/updateMe`, userData, { showLoader: true });
  }

  deleteMe(): Observable<ApiResponse> {
    return this.baseApi.delete(`${this.endpoint}/deleteMe`, { showLoader: true });
  }

  getUserProfile(): Observable<ApiResponse<UserProfileResponse>> {
    return this.baseApi.get<UserProfileResponse>(`${this.endpoint}/profile`, { showLoader: true });
  }

  // --- Admin Only Methods ---
  getAllUsers(params?: any): Observable<ApiResponse<UsersListResponse>> {
    return this.baseApi.get<UsersListResponse>(this.endpoint, { 
      params, 
      showLoader: true 
    });
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.baseApi.get<User>(`${this.endpoint}/${id}`, { showLoader: true });
  }

  createUser(userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.baseApi.post<User>(this.endpoint, userData, { showLoader: true });
  }

  updateUser(id: string, userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.baseApi.patch<User>(`${this.endpoint}/${id}`, userData, { showLoader: true });
  }

  deleteUser(id: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete<null>(`${this.endpoint}/${id}`, { showLoader: true });
  }

  /**
   * Bulk update users (activate/deactivate)
   */
  bulkUpdateUsers(ids: string[], action: 'activate' | 'deactivate'): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/bulk-update`, { ids, action }, { showLoader: true });
  }

  /**
   * Export users to CSV/Excel
   */
  exportUsers(params?: any): Observable<Blob> {
    return this.baseApi.download(`${this.endpoint}/export`, { 
      params,
      showLoader: true,
      timeoutMs: 120000 // 2 minutes for export
    });
  }

  /**
   * Import users from CSV
   */
  importUsers(file: File): Observable<ApiResponse<{ imported: number; failed: number }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.baseApi.upload<{ imported: number; failed: number }>(
      `${this.endpoint}/import`, 
      formData, 
      { showLoader: true }
    );
  }
}
// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService, ApiResponse } from '../http/base-api.service';
// import { InstructorProfile, StudentProfile } from '../models/user.model';
// import { User } from './auth.service';


// @Injectable({
//   providedIn: 'root'
// })
// export class UserService {
//   private readonly endpoint = 'users';

//   constructor(private baseApi: BaseApiService) {}

//   // --- Public Auth Methods ---
//   forgotPassword(email: string): Observable<ApiResponse> {
//     return this.baseApi.post(`${this.endpoint}/forgotPassword`, { email }, { skipAuth: true });
//   }

//   resetPassword(token: string, passwordData: any): Observable<ApiResponse> {
//     return this.baseApi.patch(`${this.endpoint}/resetPassword/${token}`, passwordData, { skipAuth: true });
//   }

//   // --- Current User (Me) Methods ---
//   getMe(): Observable<ApiResponse<User>> {
//     return this.baseApi.get<User>(`${this.endpoint}/me`, { showLoader: true });
//   }

//   updateMe(userData: Partial<User>): Observable<ApiResponse<User>> {
//     return this.baseApi.patch<User>(`${this.endpoint}/updateMe`, userData);
//   }

//   deleteMe(): Observable<ApiResponse> {
//     return this.baseApi.delete(`${this.endpoint}/deleteMe`);
//   }

//   getUserProfile(): Observable<ApiResponse<InstructorProfile | StudentProfile>> {
//     return this.baseApi.get(`${this.endpoint}/profile`);
//   }

//   // --- Admin Only Methods ---
//   getAllUsers(params?: any): Observable<ApiResponse<any>> {
//     return this.baseApi.get<any[]>(this.endpoint, { params });
//   }

//   getUserById(id: string): Observable<ApiResponse<any>> {
//     return this.baseApi.get<User>(`${this.endpoint}/${id}`);
//   }

//   updateUser(id: any, userData: Partial<User>): Observable<ApiResponse<User>> {
//     return this.baseApi.patch<User>(`${this.endpoint}/${id}`, userData);
//   }

//   deleteUser(id: string): Observable<ApiResponse> {
//     return this.baseApi.delete(`${this.endpoint}/${id}`);
//   }
// }