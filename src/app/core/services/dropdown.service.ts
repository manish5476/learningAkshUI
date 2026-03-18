import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BaseApiService } from '../http/base-api.service';

export interface DropdownOption {
  label: string;
  value: any;
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
    if (masterType) params.type = masterType;

    const url = model.toLowerCase() === 'master' 
      ? `${this.endpoint}/master/${masterType}`
      : `${this.endpoint}/${model.toLowerCase()}`;

    // Utilizing your base API service
    return this.api.get<DropdownOption[]>(url, { params }).pipe(
      map(response => response.data || [])
    );
  }

  getBulkOptions(models: string[]): Observable<any> {
    const params = { models: models.join(',') };
    return this.api.get<any>(`${this.endpoint}/bulk`, { params }).pipe(
      map(response => response.data || {})
    );
  }
}

// import { Injectable, inject } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable, map } from 'rxjs';

// export interface DropdownOption {
//   label: string;
//   value: any;
//   metadata?: any;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class DropdownService {
//   private http = inject(HttpClient);
//   private baseUrl = 'dropdown'; // Adjust to match your environment API URL

//   // Fetch standard flat dropdown options
//   getOptions(model: string, search: string = '', masterType: string = ''): Observable<DropdownOption[]> {
//     let params = new HttpParams();
//     if (search) params = params.set('search', search);
//     if (masterType) params = params.set('type', masterType);

//     // If querying the Master table, hit the specific master route
//     const url = model.toLowerCase() === 'master' 
//       ? `${this.baseUrl}/master/${masterType}`
//       : `${this.baseUrl}/${model.toLowerCase()}`;

//     return this.http.get<{status: string, data: DropdownOption[]}>(url).pipe(
//       map(response => response.data)
//     );
//   }

//   // Fetch bulk dropdowns for initial page loads
//   getBulkOptions(models: string[]): Observable<any> {
//     const params = new HttpParams().set('models', models.join(','));
//     return this.http.get<{status: string, data: any}>(`${this.baseUrl}/bulk`, { params }).pipe(
//       map(response => response.data)
//     );
//   }
// }