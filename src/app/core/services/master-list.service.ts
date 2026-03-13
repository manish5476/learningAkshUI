import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiOptions, ApiResponse, ApiResponseWithPagination, BaseApiService } from '../http/base-api.service';

// --- Optional: Define your interfaces here for strict typing ---
export interface Master {
  _id?: string;
  name: string;
  // add other master properties...
}

export interface MasterValue {
  _id?: string;
  value: string;
  label: string;
  // add other master value properties...
}

@Injectable({
  providedIn: 'root'
})
export class MasterApiService {
  // Base route for master endpoints (adjust if your backend uses a different prefix)
  private readonly endpoint = 'masters';

  constructor(private api: BaseApiService) {}

  // ==================== PUBLIC ROUTES ====================

  getPublicMasterValues<T = MasterValue[]>(masterName: string, options?: ApiOptions): Observable<ApiResponse<T>> {
    return this.api.get<T>(`${this.endpoint}/public/${masterName}/values`, { ...options, skipAuth: true });
  }

  getPublicHierarchy<T = any>(masterName: string, options?: ApiOptions): Observable<ApiResponse<T>> {
    return this.api.get<T>(`${this.endpoint}/public/${masterName}/hierarchy`, { ...options, skipAuth: true });
  }

  validatePublicMasterValue(masterName: string, value: string, options?: ApiOptions): Observable<ApiResponse<boolean>> {
    return this.api.get<boolean>(`${this.endpoint}/public/${masterName}/validate/${value}`, { ...options, skipAuth: true });
  }

  // ==================== PROTECTED / ADMIN ROUTES ====================

  // --- Master Management ---

  createMaster(data: Partial<Master>, options?: ApiOptions): Observable<ApiResponse<Master>> {
    return this.api.post<Master>(this.endpoint, data, options);
  }

  getAllMasters(options?: ApiOptions): Observable<ApiResponseWithPagination<Master[]>> {
    // Assuming this returns a paginated list since it's an admin "get all" route
    return this.api.getWithPagination<Master[]>(this.endpoint, options);
  }

  getMasterById(id: string, options?: ApiOptions): Observable<ApiResponse<Master>> {
    return this.api.get<Master>(`${this.endpoint}/${id}`, options);
  }

  updateMaster(id: string, data: Partial<Master>, options?: ApiOptions): Observable<ApiResponse<Master>> {
    return this.api.patch<Master>(`${this.endpoint}/${id}`, data, options);
  }

  publishMaster(id: string, options?: ApiOptions): Observable<ApiResponse<Master>> {
    return this.api.patch<Master>(`${this.endpoint}/${id}/publish`, {}, options);
  }

  unpublishMaster(id: string, options?: ApiOptions): Observable<ApiResponse<Master>> {
    return this.api.patch<Master>(`${this.endpoint}/${id}/unpublish`, {}, options);
  }

  deleteMaster(id: string, options?: ApiOptions): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`${this.endpoint}/${id}`, options);
  }

  restoreMaster(id: string, options?: ApiOptions): Observable<ApiResponse<Master>> {
    return this.api.patch<Master>(`${this.endpoint}/${id}/restore`, {}, options);
  }

  // --- Master Values Management ---

  addValue(masterId: string, data: Partial<MasterValue>, options?: ApiOptions): Observable<ApiResponse<MasterValue>> {
    return this.api.post<MasterValue>(`${this.endpoint}/${masterId}/values`, data, options);
  }

  bulkAddValues(masterId: string, data: Partial<MasterValue>[], options?: ApiOptions): Observable<ApiResponse<MasterValue[]>> {
    return this.api.post<MasterValue[]>(`${this.endpoint}/${masterId}/values/bulk`, { values: data }, options);
  }

  bulkUpdateValues(masterId: string, data: Partial<MasterValue>[], options?: ApiOptions): Observable<ApiResponse<MasterValue[]>> {
    return this.api.patch<MasterValue[]>(`${this.endpoint}/${masterId}/values/bulk`, { values: data }, options);
  }

  importValues(masterId: string, fileData: FormData, options?: ApiOptions): Observable<ApiResponse<any>> {
    // Uses the custom upload method from your BaseApiService
    return this.api.upload<any>(`${this.endpoint}/${masterId}/values/import`, fileData, options);
  }

  exportValues(masterId: string, options?: ApiOptions): Observable<Blob> {
    // Uses the custom download method from your BaseApiService
    return this.api.download(`${this.endpoint}/${masterId}/values/export`, options);
  }

  updateValue(masterId: string, valueId: string, data: Partial<MasterValue>, options?: ApiOptions): Observable<ApiResponse<MasterValue>> {
    return this.api.patch<MasterValue>(`${this.endpoint}/${masterId}/values/${valueId}`, data, options);
  }

  publishValue(masterId: string, valueId: string, options?: ApiOptions): Observable<ApiResponse<MasterValue>> {
    return this.api.patch<MasterValue>(`${this.endpoint}/${masterId}/values/${valueId}/publish`, {}, options);
  }

  unpublishValue(masterId: string, valueId: string, options?: ApiOptions): Observable<ApiResponse<MasterValue>> {
    return this.api.patch<MasterValue>(`${this.endpoint}/${masterId}/values/${valueId}/unpublish`, {}, options);
  }

  deleteValue(masterId: string, valueId: string, options?: ApiOptions): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`${this.endpoint}/${masterId}/values/${valueId}`, options);
  }

  // --- Bulk Operations ---

  bulkCreateMasters(data: Partial<Master>[], options?: ApiOptions): Observable<ApiResponse<Master[]>> {
    return this.api.post<Master[]>(`${this.endpoint}/bulk/create`, { masters: data }, options);
  }

  bulkUpdateMasters(data: Partial<Master>[], options?: ApiOptions): Observable<ApiResponse<Master[]>> {
    return this.api.patch<Master[]>(`${this.endpoint}/bulk/update`, { masters: data }, options);
  }

  bulkDeleteMasters(ids: string[], options?: ApiOptions): Observable<ApiResponse<null>> {
    // DELETE requests with bodies are supported by your BaseApiService
    return this.api.delete<null>(`${this.endpoint}/bulk/delete`, { ...options, body: { ids } });
  }

  countMasters(options?: ApiOptions): Observable<ApiResponse<{ total: number }>> {
    return this.api.get<{ total: number }>(`${this.endpoint}/count/total`, options);
  }
}