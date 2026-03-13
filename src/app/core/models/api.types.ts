// models/api.types.ts
export * from '../http/base-api.service';

// Re-export for convenience
export interface PaginatedResponse<T> {
  data: T[];
  results: number;
  pagination: {
    page: number;
    limit: number;
    totalResults: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CursorResponse<T> {
  data: T[];
  results: number;
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}