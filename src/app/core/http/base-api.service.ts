// http/base-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, retry, timeout, map, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] } | Record<string, any>;
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  withCredentials?: boolean;
  skipAuth?: boolean;
  showLoader?: boolean;
  retryCount?: number;
  timeoutMs?: number;
  // Allow body for DELETE requests (some APIs support this)
  body?: any;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'fail';
  data?: T;
  message?: string;
  token?: string;
  results?: number;
  pagination?: {
    page: number;
    limit: number;
    totalResults: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextCursor?: string | null;
    hasNextPageCursor?: boolean;
  };
}

export interface ApiResponseWithPagination<T = any> {
  status: 'success' | 'error' | 'fail';
  data: T;
  results: number;
  pagination: {
    page: number;
    limit: number;
    totalResults: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextCursor?: string | null;
    hasNextPageCursor?: boolean;
  };
}

export interface CursorPaginationResponse<T = any> {
  status: 'success' | 'error' | 'fail';
  data: T[];
  results: number;
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  private baseUrl = environment.apiUrl;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private defaultHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  constructor(private http: HttpClient) {}

  /**
   * GET request
   */
  get<T>(endpoint: string, options: ApiOptions = {}): Observable<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, null, options);
  }

  /**
   * GET request with pagination response type
   */
  getWithPagination<T>(endpoint: string, options: ApiOptions = {}): Observable<ApiResponseWithPagination<T>> {
    return this.request<ApiResponseWithPagination<T>>('GET', endpoint, null, options).pipe(
      map(response => response.data as unknown as ApiResponseWithPagination<T>)
    );
  }

  /**
   * GET request with cursor-based pagination
   */
  getWithCursorPagination<T>(
    endpoint: string, 
    cursor?: string, 
    limit: number = 50,
    options: ApiOptions = {}
  ): Observable<CursorPaginationResponse<T>> {
    const params = {
      ...(cursor && { cursor }),
      limit: limit.toString()
    };
    
    return this.get<CursorPaginationResponse<T>>(endpoint, {
      ...options,
      params: { ...params, ...(options.params as any) }
    }).pipe(
      map(response => response.data as CursorPaginationResponse<T>)
    );
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, body: any, options: ApiOptions = {}): Observable<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body, options);
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, body: any, options: ApiOptions = {}): Observable<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body: any, options: ApiOptions = {}): Observable<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  /**
   * DELETE request (supports body)
   */
  delete<T>(endpoint: string, options: ApiOptions = {}): Observable<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, options.body || null, options);
  }

  /**
   * File upload with multipart/form-data
   */
  upload<T>(endpoint: string, formData: FormData, options: ApiOptions = {}): Observable<ApiResponse<T>> {
    const uploadOptions: ApiOptions = {
      ...options,
      headers: new HttpHeaders().delete('Content-Type')
    };
    return this.request<T>('POST', endpoint, formData, uploadOptions);
  }

  /**
   * File download
   */
  download(endpoint: string, options: ApiOptions = {}): Observable<Blob> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint}`;
    
    let headers = this.buildHeaders(options);
    if (!headers.has('Accept')) {
      headers = headers.set('Accept', 'application/octet-stream');
    }

    return this.http.get(url, {
      headers: headers,
      params: this.buildParams(options.params),
      responseType: 'blob',
      withCredentials: options.withCredentials ?? true
    }).pipe(
      timeout(options.timeoutMs || 30000),
      retry(options.retryCount || 0),
      catchError(this.handleError)
    );
  }

  /**
   * Generic request handler
   */
  private request<T>(
    method: string,
    endpoint: string,
    body: any = null,
    options: ApiOptions = {}
  ): Observable<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint}`;
    
    if (options.showLoader) {
      this.loadingSubject.next(true);
    }

    let headers = this.buildHeaders(options);
    if (body instanceof FormData) {
      headers = headers.delete('Content-Type');
    }

    return this.http.request<ApiResponse<T>>(method, url, {
      body,
      headers: headers,
      params: this.buildParams(options.params),
      responseType: 'json',
      withCredentials: options.withCredentials ?? true,
      observe: 'response'
    }).pipe(
      timeout(options.timeoutMs || 30000),
      retry(options.retryCount || 0),
      map(response => {
        if (response.body && (response.body.status === 'success' || response.body.status === 'fail')) {
          return response.body;
        }
        return {
          status: 'success',
          data: response.body as T,
          results: Array.isArray(response.body) ? response.body.length : undefined
        } as ApiResponse<T>;
      }),
      catchError(this.handleError),
      finalize(() => {
        if (options.showLoader) {
          this.loadingSubject.next(false);
        }
      })
    );
  }

  /**
   * Build HTTP headers
   */
  private buildHeaders(options: ApiOptions): HttpHeaders {
    let headers = this.defaultHeaders;
    
    if (!options.skipAuth) {
      const token = localStorage.getItem(environment.auth?.tokenKey || 'token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    
    if (options.headers) {
      if (options.headers instanceof HttpHeaders) {
        const httpHeaders = options.headers; 
        httpHeaders.keys().forEach(key => {
          const values = httpHeaders.getAll(key); 
          if (values) {
            headers = headers.set(key, values);
          }
        });
      } else {
        const plainHeaders = options.headers as { [header: string]: string | string[] };
        Object.entries(plainHeaders).forEach(([key, value]) => {
          headers = headers.set(key, value);
        });
      }
    }
    
    return headers;
  }

  /**
   * Build HTTP params (accepts Record<string, any>)
   */
  private buildParams(params?: HttpParams | { [param: string]: string | string[] } | Record<string, any>): HttpParams {
    if (!params) {
      return new HttpParams();
    }
    
    if (params instanceof HttpParams) {
      return params;
    }
    
    let httpParams = new HttpParams();
    
    // Handle Record<string, any>
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }
      
      if (Array.isArray(value)) {
        value.forEach(v => {
          if (v !== null && v !== undefined) {
            httpParams = httpParams.append(key, v.toString());
          }
        });
      } else if (typeof value === 'object') {
        // Handle nested objects by stringifying
        httpParams = httpParams.set(key, JSON.stringify(value));
      } else {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    
    return httpParams;
  }

  /**
   * Error handler
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    let errorStatus = error.status;
    let errorErrors = null;
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
      console.error('Client Error:', errorMessage);
    } else {
      if (error.error) {
        errorMessage = error.error.message || error.message;
        errorErrors = error.error.errors;
      } else {
        errorMessage = error.message || `Error Code: ${error.status}`;
      }
      
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized access. Please login again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 422:
          errorMessage = error.error?.message || 'Validation failed.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
      }
      
      console.error('Server Error:', {
        status: error.status,
        message: errorMessage,
        url: error.url
      });
    }
    
    return throwError(() => ({
      status: 'error',
      message: errorMessage,
      statusCode: errorStatus,
      errors: errorErrors
    }));
  }

  /**
   * Set auth token
   */
  setAuthToken(token: string): void {
    localStorage.setItem(environment.auth?.tokenKey || 'token', token);
  }

  /**
   * Remove auth token
   */
  removeAuthToken(): void {
    localStorage.removeItem(environment.auth?.tokenKey || 'token');
  }

  /**
   * Get auth token
   */
  getAuthToken(): string | null {
    return localStorage.getItem(environment.auth?.tokenKey || 'token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  /**
   * Clear all loading states
   */
  clearLoading(): void {
    this.loadingSubject.next(false);
  }

  /**
   * Build URL with query parameters
   */
  buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint}`;
    if (!params) return url;
    
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else if (typeof value === 'object') {
          queryParams.set(key, JSON.stringify(value));
        } else {
          queryParams.set(key, value.toString());
        }
      }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }
}