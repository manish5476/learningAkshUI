import { HttpParams } from '@angular/common/http';

/**
 * ==========================================
 * UI Component Helpers (PrimeNG, Material)
 * ==========================================
 */

/**
 * Maps an array of objects to PrimeNG/Material dropdown option format.
 */
export function mapToDropdownOptions<T>(items: T[], labelKey: keyof T, valueKey: keyof T) {
  if (!items || !Array.isArray(items)) return [];
  return items.map(item => ({
    label: item[labelKey],
    value: item[valueKey]
  }));
}

/**
 * Converts a TypeScript Enum into dropdown options.
 * Example: enumToDropdown(UserRole) -> [{label: 'Admin', value: 'ADMIN'}, ...]
 */
export function enumToDropdown(enumObj: any): { label: string, value: string | number }[] {
  return Object.keys(enumObj)
    .filter(key => isNaN(Number(key))) // Filter out reverse-mapped numeric keys
    .map(key => ({
      label: key.replace(/([A-Z])/g, ' $1').trim(), // Formats 'SuperAdmin' to 'Super Admin'
      value: enumObj[key]
    }));
}

/**
 * ==========================================
 * API & Payload Preparation
 * ==========================================
 */

/**
 * Removes null, undefined, and empty strings from an object.
 * Perfect for cleaning up form payloads before sending them to the backend (PUT/POST).
 */
export function cleanPayload<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    if (val !== null && val !== undefined && val !== '') {
      cleaned[key] = val;
    }
  });
  return cleaned;
}

/**
 * Converts a standard JavaScript object into Angular HttpParams.
 * Automatically skips null/undefined values so you don't send `?status=null`.
 */
export function objectToHttpParams(obj: Record<string, any>): HttpParams {
  let params = new HttpParams();
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      // Handle arrays (e.g., ?status=active&status=pending)
      if (Array.isArray(value)) {
        value.forEach(val => params = params.append(key, val));
      } else {
        params = params.set(key, value.toString());
      }
    }
  });
  return params;
}

/**
 * ==========================================
 * Data Manipulation & Formatting
 * ==========================================
 */

/**
 * Groups an array of objects by a specific object key.
 * Returns a dictionary where keys are the grouped values.
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, currentValue) => {
    const groupKey = String(currentValue[key]);
    (result[groupKey] = result[groupKey] || []).push(currentValue);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Safely deeply clones an object or array without retaining memory references.
 * Uses modern structuredClone (native to modern browsers).
 */
export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  // Fallback for extremely old environments
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Formats a number as local currency using the modern native Intl API.
 * No heavy libraries like moment.js required.
 */
export function formatCurrency(amount: number, currencyCode = 'INR', locale = 'en-IN'): string {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * ==========================================
 * Browser & DOM Utilities
 * ==========================================
 */

/**
 * Triggers a browser file download from a Blob or File object.
 * Useful when receiving PDF/Excel buffers from your backend.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup to prevent memory leaks
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}


// /**
//  * Maps an array of objects to PrimeNG dropdown option format.
//  * 
//  * @param items - The original array of data.
//  * @param labelKey - The object key to use for the dropdown label.
//  * @param valueKey - The object key to use for the dropdown value.
//  * @returns An array of { label, value } objects.
//  */
// export function mapToDropdownOptions<T>(
//   items: T[], 
//   labelKey: keyof T, 
//   valueKey: keyof T
// ) {
//   if (!items || !Array.isArray(items)) return [];

//   return items.map(item => ({
//     label: item[labelKey],
//     value: item[valueKey]
//   }));
// }