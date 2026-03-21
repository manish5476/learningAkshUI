// dropdown.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from '../http/base-api.service';

export interface DropdownOption {
  label: string;
  value: any;
  code?: string;  // Add code field for master data
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class DropdownService {
  private api = inject(BaseApiService);
  private endpoint = 'dropdown';

  getOptions(model: string, search: string = '', masterType: string = ''): Observable<DropdownOption[]> {
    const params: any = {};
    if (search) params.search = search;
    
    let url = '';
    
    // Special handling for master data
    if (model.toLowerCase() === 'master') {
      // Use code-based endpoint for validation compatibility
      url = `${this.endpoint}/master/${masterType}/code`;
    } else {
      url = `${this.endpoint}/${model.toLowerCase()}`;
      if (masterType) params.type = masterType;
    }

    return this.api.get<any>(url, { params }).pipe(
      map(response => {
        const data = response.data || [];
        return data.map((item: any) => ({
          label: item.label || item.name || 'Unknown',
          value: item.value, // This will be code for master, _id for others
          code: item.code || item.value,
          metadata: item.metadata || item
        }));
      })
    );
  }

  // Helper method specifically for master data dropdowns
  getMasterOptions(masterType: string, search: string = ''): Observable<DropdownOption[]> {
    return this.getOptions('master', search, masterType);
  }

  getBulkOptions(models: string[]): Observable<any> {
    const params = { models: models.join(',') };
    return this.api.get<any>(`${this.endpoint}/bulk`, { params }).pipe(
      map(response => response.data || {})
    );
  }
}



// import { Injectable, inject } from '@angular/core';
// import { Observable, map } from 'rxjs';
// import { BaseApiService } from '../http/base-api.service';

// export interface DropdownOption {
//   label: string;
//   value: any;
//   metadata?: any;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class DropdownService {
//   private api = inject(BaseApiService);
//   private endpoint = 'dropdown';

//   getOptions(model: string, search: string = '', masterType: string = ''): Observable<DropdownOption[]> {
//     const params: any = {};
//     if (search) params.search = search;
//     if (masterType) params.type = masterType;

//     const url = model.toLowerCase() === 'master'
//       ? `${this.endpoint}/master/${masterType}`
//       : `${this.endpoint}/${model.toLowerCase()}`;

//     // ✅ Map the raw backend response to DropdownOption format
//     return this.api.get<any>(url, { params }).pipe(
//       map(response => {
//         const data = response.data || [];
//         return data.map((item: any) => ({
//           // Fallbacks to handle different schemas gracefully
//           label: item.name || item.title || item.label || 'Unknown', 
          
//           // ✅ THE FIX: This ensures we use MongoDB's _id as the form value
//           value: item._id || item.value, 
          
//           metadata: item
//         }));
//       })
//     );
//   }

//   getBulkOptions(models: string[]): Observable<any> {
//     const params = { models: models.join(',') };
//     return this.api.get<any>(`${this.endpoint}/bulk`, { params }).pipe(
//       map(response => response.data || {})
//     );
//   }
// }