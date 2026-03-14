import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiOptions, ApiResponse, ApiResponseWithPagination, BaseApiService } from '../http/base-api.service';

// ==================== INTERFACES ====================

export interface MasterMetadata {
  isFeatured?: boolean;
  sortOrder?: number;
}

export interface Master {
  _id?: string;
  id?: string;
  type: string;
  name: string;
  slug?: string;
  code?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | Master; // Can be an ID or populated Master object
  isActive?: boolean;
  metadata?: MasterMetadata;
  createdAt?: string;
  updatedAt?: string;

  // UI-only helper properties
  children?: Master[]; // Populated when fetching hierarchical data
  _expanded?: boolean; 
}

@Injectable({
  providedIn: 'root'
})
export class MasterApiService {
  // Base route for master endpoints
  private readonly endpoint = 'masters';

  constructor(private api: BaseApiService) {}

  // ==================== PUBLIC ROUTES ====================

  /**
   * Get all values for a specific dropdown type (e.g., 'course_level')
   */
  getPublicValues<T = Master[]>(type: string, options?: ApiOptions): Observable<ApiResponse<T>> {
    return this.api.get<T>(`${this.endpoint}/public/${type}/values`, { ...options, skipAuth: true });
  }

  /**
   * Get nested/tree values for a specific type (e.g., 'course_category')
   */
  getPublicHierarchy<T = Master[]>(type: string, options?: ApiOptions): Observable<ApiResponse<T>> {
    return this.api.get<T>(`${this.endpoint}/public/${type}/hierarchy`, { ...options, skipAuth: true });
  }

  validatePublicValue(type: string, value: string, options?: ApiOptions): Observable<ApiResponse<{ type: string, value: string, isValid: boolean }>> {
    return this.api.get<any>(`${this.endpoint}/public/${type}/validate/${value}`, { ...options, skipAuth: true });
  }

  // ==================== PROTECTED / ADMIN ROUTES ====================

  // --- Master Management ---

  /**
   * Gets a list of unique master types (e.g., ['user_role', 'course_level'])
   * Useful for populating filters in admin tables
   */
getMasterTypes(options?: ApiOptions): Observable<ApiResponse<{label: string, value: string}[]>> {
    return this.api.get<{label: string, value: string}[]>(`${this.endpoint}/types`, options);
  }
  createMaster(data: Partial<Master>, options?: ApiOptions): Observable<ApiResponse<Master>> {
    return this.api.post<Master>(this.endpoint, data, options);
  }

// Change this in master-api.service.ts
  getAllMasters(options?: ApiOptions): Observable<ApiResponse<Master[]>> {
    // We removed "WithPagination" because your backend returns a flat array
    return this.api.get<Master[]>(this.endpoint, options); 
  }

  getMasterById(id: string, options?: ApiOptions): Observable<ApiResponse<Master>> {
    return this.api.get<Master>(`${this.endpoint}/${id}`, options);
  }

  updateMaster(id: string, data: Partial<Master>, options?: ApiOptions): Observable<ApiResponse<Master>> {
    return this.api.patch<Master>(`${this.endpoint}/${id}`, data, options);
  }

  /**
   * Flips the isActive boolean (replaces publish/unpublish)
   */
  toggleActiveStatus(id: string, options?: ApiOptions): Observable<ApiResponse<Master>> {
    return this.api.patch<Master>(`${this.endpoint}/${id}/toggle-active`, {}, options);
  }

  deleteMaster(id: string, options?: ApiOptions): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`${this.endpoint}/${id}`, options);
  }


  // --- Import / Export ---

  /**
   * Import an array of values for a specific type
   * (e.g., { type: 'language', values: [...] })
   */
  importValues(type: string, values: Partial<Master>[], options?: ApiOptions): Observable<ApiResponse<{ imported: number, skipped: number }>> {
    return this.api.post<any>(`${this.endpoint}/import`, { type, values }, options);
  }

  /**
   * Export all values of a specific type as a CSV Blob
   */
  exportValues(type: string, options?: ApiOptions): Observable<Blob> {
    // Uses the custom download method from your BaseApiService
    return this.api.download(`${this.endpoint}/export/${type}`, options);
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
  
  courseDropdown(options?: ApiOptions): Observable<ApiResponse<{ total: number }>> {
    return this.api.get<{ total: number }>(`/dropdown/course`, options);
  }
}

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { ApiOptions, ApiResponse, ApiResponseWithPagination, BaseApiService } from '../http/base-api.service';
// export interface MasterConfig {
//   isHierarchical: boolean;
//   allowMultiple: boolean;
//   hasMetadata: boolean;
//   isTranslatable: boolean;
// }

// export interface MasterStats {
//   totalValues: number;
//   activeValues: number;
//   publishedValues: number;
//   lastValueAdded?: string;
// }

// export interface MasterValueMetadata {
//   icon?: string;
//   color?: string;
//   sortOrder?: number;
// }

// export interface MasterValue {
//   _id?: string;
//   value: string;
//   label: string;
//   description?: string;
//   isActive?: boolean;
//   isPublished?: boolean;
//   isDefault?: boolean;
//   isSystem?: boolean;
//   isDeleted?: boolean;
//   metadata?: MasterValueMetadata;
//   createdAt?: string;
//   updatedAt?: string;
// }

// export interface Master {
//   _id?: string;
//   id?: string;
//   masterName: string;
//   displayName: string;
//   description?: string;
//   category: string;
//   isActive?: boolean;
//   isPublished?: boolean;
//   isLocked?: boolean;
//   isSystem?: boolean;
//   config?: MasterConfig;
//   stats?: MasterStats;
//   values?: MasterValue[];
//   activeValues?: MasterValue[]; // Your backend sends this too
//   hierarchy?: any[];
//   createdAt?: string;
//   updatedAt?: string;
  
//   // UI-only helper properties
//   _expanded?: boolean; 
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class MasterApiService {
//   // Base route for master endpoints (adjust if your backend uses a different prefix)
//   private readonly endpoint = 'masters';

//   constructor(private api: BaseApiService) {}

//   // ==================== PUBLIC ROUTES ====================

//   getPublicMasterValues<T = MasterValue[]>(masterName: string, options?: ApiOptions): Observable<ApiResponse<T>> {
//     return this.api.get<T>(`${this.endpoint}/public/${masterName}/values`, { ...options, skipAuth: true });
//   }

//   getPublicHierarchy<T = any>(masterName: string, options?: ApiOptions): Observable<ApiResponse<T>> {
//     return this.api.get<T>(`${this.endpoint}/public/${masterName}/hierarchy`, { ...options, skipAuth: true });
//   }

//   validatePublicMasterValue(masterName: string, value: string, options?: ApiOptions): Observable<ApiResponse<boolean>> {
//     return this.api.get<boolean>(`${this.endpoint}/public/${masterName}/validate/${value}`, { ...options, skipAuth: true });
//   }

//   // ==================== PROTECTED / ADMIN ROUTES ====================

//   // --- Master Management ---

//   createMaster(data: Partial<Master>, options?: ApiOptions): Observable<ApiResponse<Master>> {
//     return this.api.post<Master>(this.endpoint, data, options);
//   }

//   getAllMasters(options?: ApiOptions): Observable<ApiResponseWithPagination<Master[]>> {
//     // Assuming this returns a paginated list since it's an admin "get all" route
//     return this.api.getWithPagination<Master[]>(this.endpoint, options);
//   }

//   getMasterById(id: string, options?: ApiOptions): Observable<ApiResponse<Master>> {
//     return this.api.get<Master>(`${this.endpoint}/${id}`, options);
//   }

//   updateMaster(id: string, data: Partial<Master>, options?: ApiOptions): Observable<ApiResponse<Master>> {
//     return this.api.patch<Master>(`${this.endpoint}/${id}`, data, options);
//   }

//   publishMaster(id: string, options?: ApiOptions): Observable<ApiResponse<Master>> {
//     return this.api.patch<Master>(`${this.endpoint}/${id}/publish`, {}, options);
//   }

//   unpublishMaster(id: string, options?: ApiOptions): Observable<ApiResponse<Master>> {
//     return this.api.patch<Master>(`${this.endpoint}/${id}/unpublish`, {}, options);
//   }

//   deleteMaster(id: string, options?: ApiOptions): Observable<ApiResponse<null>> {
//     return this.api.delete<null>(`${this.endpoint}/${id}`, options);
//   }

//   restoreMaster(id: string, options?: ApiOptions): Observable<ApiResponse<Master>> {
//     return this.api.patch<Master>(`${this.endpoint}/${id}/restore`, {}, options);
//   }

//   // --- Master Values Management ---

//   addValue(masterId: string, data: Partial<MasterValue>, options?: ApiOptions): Observable<ApiResponse<MasterValue>> {
//     return this.api.post<MasterValue>(`${this.endpoint}/${masterId}/values`, data, options);
//   }

//   bulkAddValues(masterId: string, data: Partial<MasterValue>[], options?: ApiOptions): Observable<ApiResponse<MasterValue[]>> {
//     return this.api.post<MasterValue[]>(`${this.endpoint}/${masterId}/values/bulk`, { values: data }, options);
//   }

//   bulkUpdateValues(masterId: string, data: Partial<MasterValue>[], options?: ApiOptions): Observable<ApiResponse<MasterValue[]>> {
//     return this.api.patch<MasterValue[]>(`${this.endpoint}/${masterId}/values/bulk`, { values: data }, options);
//   }

//   importValues(masterId: string, fileData: FormData, options?: ApiOptions): Observable<ApiResponse<any>> {
//     // Uses the custom upload method from your BaseApiService
//     return this.api.upload<any>(`${this.endpoint}/${masterId}/values/import`, fileData, options);
//   }

//   exportValues(masterId: string, options?: ApiOptions): Observable<Blob> {
//     // Uses the custom download method from your BaseApiService
//     return this.api.download(`${this.endpoint}/${masterId}/values/export`, options);
//   }

//   updateValue(masterId: string, valueId: string, data: Partial<MasterValue>, options?: ApiOptions): Observable<ApiResponse<MasterValue>> {
//     return this.api.patch<MasterValue>(`${this.endpoint}/${masterId}/values/${valueId}`, data, options);
//   }

//   publishValue(masterId: string, valueId: string, options?: ApiOptions): Observable<ApiResponse<MasterValue>> {
//     return this.api.patch<MasterValue>(`${this.endpoint}/${masterId}/values/${valueId}/publish`, {}, options);
//   }

//   unpublishValue(masterId: string, valueId: string, options?: ApiOptions): Observable<ApiResponse<MasterValue>> {
//     return this.api.patch<MasterValue>(`${this.endpoint}/${masterId}/values/${valueId}/unpublish`, {}, options);
//   }

//   deleteValue(masterId: string, valueId: string, options?: ApiOptions): Observable<ApiResponse<null>> {
//     return this.api.delete<null>(`${this.endpoint}/${masterId}/values/${valueId}`, options);
//   }

//   // --- Bulk Operations ---

//   bulkCreateMasters(data: Partial<Master>[], options?: ApiOptions): Observable<ApiResponse<Master[]>> {
//     return this.api.post<Master[]>(`${this.endpoint}/bulk/create`, { masters: data }, options);
//   }

//   bulkUpdateMasters(data: Partial<Master>[], options?: ApiOptions): Observable<ApiResponse<Master[]>> {
//     return this.api.patch<Master[]>(`${this.endpoint}/bulk/update`, { masters: data }, options);
//   }

//   bulkDeleteMasters(ids: string[], options?: ApiOptions): Observable<ApiResponse<null>> {
//     // DELETE requests with bodies are supported by your BaseApiService
//     return this.api.delete<null>(`${this.endpoint}/bulk/delete`, { ...options, body: { ids } });
//   }

//   countMasters(options?: ApiOptions): Observable<ApiResponse<{ total: number }>> {
//     return this.api.get<{ total: number }>(`${this.endpoint}/count/total`, options);
//   }
// }