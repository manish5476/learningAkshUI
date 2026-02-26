import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, retry, timeout, map, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  withCredentials?: boolean;
  skipAuth?: boolean;
  showLoader?: boolean;
  retryCount?: number;
  timeoutMs?: number;
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
   * DELETE request
   */
  delete<T>(endpoint: string, options: ApiOptions = {}): Observable<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, null, options);
  }

  /**
   * File upload with multipart/form-data
   */
  upload<T>(endpoint: string, formData: FormData, options: ApiOptions = {}): Observable<ApiResponse<T>> {
    const uploadOptions: ApiOptions = {
      ...options,
      headers: new HttpHeaders().delete('Content-Type') // Let browser set content-type with boundary
    };
    return this.request<T>('POST', endpoint, formData, uploadOptions);
  }

  /**
   * File download
   */
 /**
   * File download
   */
  download(endpoint: string, options: ApiOptions = {}): Observable<Blob> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint}`;
    
    // Build headers and explicitly set the Accept header for binary data
    let headers = this.buildHeaders(options);
    if (!headers.has('Accept')) {
      headers = headers.set('Accept', 'application/octet-stream');
    }

    return this.http.get(url, {
      headers: headers,
      params: this.buildParams(options.params),
      responseType: 'blob', // Strictly typed as 'blob' without the 'as json' hack
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

    // Inline the options to perfectly satisfy Angular's strict overloads
    return this.http.request<ApiResponse<T>>(method, url, {
      body,
      headers: this.buildHeaders(options),
      params: this.buildParams(options.params),
      responseType: 'json', // We expect ApiResponse<T>, so this must be 'json'
      withCredentials: options.withCredentials ?? true,
      observe: 'response'
    }).pipe(
      timeout(options.timeoutMs || 30000),
      retry(options.retryCount || 0),
      map(response => {
        if (response.body && response.body.status === 'success') {
          return response.body;
        }
        throw new Error(response.body?.message || 'Request failed');
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
    
    // Add auth token if not skipped
    if (!options.skipAuth) {
      const token = localStorage.getItem(environment.auth.tokenKey);
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    
    // Merge custom headers
    if (options.headers) {
      if (options.headers instanceof HttpHeaders) {
        // Narrowing the type to HttpHeaders explicitly
        const httpHeaders = options.headers; 
        httpHeaders.keys().forEach(key => {
          // Use getAll to correctly handle array values (string[])
          const values = httpHeaders.getAll(key); 
          if (values) {
            headers = headers.set(key, values);
          }
        });
      } else {
        // Cast to the plain object type and use Object.entries to avoid indexing errors
        const plainHeaders = options.headers as { [header: string]: string | string[] };
        Object.entries(plainHeaders).forEach(([key, value]) => {
          headers = headers.set(key, value);
        });
      }
    }
    
    return headers;
  }

  /**
   * Build HTTP params
   */
  private buildParams(params?: HttpParams | { [param: string]: string | string[] }): HttpParams {
    if (!params) {
      return new HttpParams();
    }
    
    if (params instanceof HttpParams) {
      return params;
    }
    
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (Array.isArray(value)) {
        value.forEach(v => {
          httpParams = httpParams.append(key, v);
        });
      } else {
        httpParams = httpParams.set(key, value);
      }
    });
    
    return httpParams;
  }

  /**
   * Error handler
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
      console.error('Client Error:', errorMessage);
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message || `Error Code: ${error.status}`;
      console.error('Server Error:', {
        status: error.status,
        message: errorMessage,
        url: error.url
      });
    }
    
    return throwError(() => ({
      status: 'error',
      message: errorMessage,
      statusCode: error.status
    }));
  }

  /**
   * Set auth token
   */
  setAuthToken(token: string): void {
    localStorage.setItem(environment.auth.tokenKey, token);
  }

  /**
   * Remove auth token
   */
  removeAuthToken(): void {
    localStorage.removeItem(environment.auth.tokenKey);
  }

  /**
   * Get auth token
   */
  getAuthToken(): string | null {
    return localStorage.getItem(environment.auth.tokenKey);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}