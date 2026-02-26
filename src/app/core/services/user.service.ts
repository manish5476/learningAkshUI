import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';
import { InstructorProfile, StudentProfile } from '../models/user.model';
import { User } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly endpoint = 'users';

  constructor(private baseApi: BaseApiService) {}

  // --- Public Auth Methods ---
  forgotPassword(email: string): Observable<ApiResponse> {
    return this.baseApi.post(`${this.endpoint}/forgotPassword`, { email }, { skipAuth: true });
  }

  resetPassword(token: string, passwordData: any): Observable<ApiResponse> {
    return this.baseApi.patch(`${this.endpoint}/resetPassword/${token}`, passwordData, { skipAuth: true });
  }

  // --- Current User (Me) Methods ---
  getMe(): Observable<ApiResponse<User>> {
    return this.baseApi.get<User>(`${this.endpoint}/me`, { showLoader: true });
  }

  updateMe(userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.baseApi.patch<User>(`${this.endpoint}/updateMe`, userData);
  }

  deleteMe(): Observable<ApiResponse> {
    return this.baseApi.delete(`${this.endpoint}/deleteMe`);
  }

  getUserProfile(): Observable<ApiResponse<InstructorProfile | StudentProfile>> {
    return this.baseApi.get(`${this.endpoint}/profile`);
  }

  // --- Admin Only Methods ---
  getAllUsers(params?: any): Observable<ApiResponse<User[]>> {
    return this.baseApi.get<User[]>(this.endpoint, { params });
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.baseApi.get<User>(`${this.endpoint}/${id}`);
  }

  updateUser(id: string, userData: Partial<User>): Observable<ApiResponse<User>> {
    return this.baseApi.patch<User>(`${this.endpoint}/${id}`, userData);
  }

  deleteUser(id: string): Observable<ApiResponse> {
    return this.baseApi.delete(`${this.endpoint}/${id}`);
  }
}