import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';
import { User } from '../models/user.model';

export interface DiscussionReply {
  _id: string;
  discussion: string;
  user: User | any;
  content: string;
  isEdited: boolean;
  likes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Discussion {
  _id: string;
  course: string;
  lesson?: string;
  user: User | any;
  title: string;
  content: string;
  likes: string[];
  isPinned: boolean;
  isResolved: boolean;
  totalReplies: number;
  replies?: DiscussionReply[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiscussionService {
  private baseApi = inject(BaseApiService);

  // ==========================================
  // CORE CRUD (Hitting /discussions directly)
  // ==========================================

  getCourseDiscussions(courseId: string, lessonId?: string): Observable<ApiResponse<{ discussions: Discussion[] }>> {
    // Passes courseId as a query parameter: /api/v1/discussions?courseId=...
    let params: any = { courseId };
    if (lessonId) params.lessonId = lessonId;
    
    return this.baseApi.get<{ discussions: Discussion[] }>(`discussions`, { params, showLoader: false });
  }

  createDiscussion(courseId: string, data: { title: string; content: string; lesson?: string }): Observable<ApiResponse<{ discussion: Discussion }>> {
    // Sends courseId in the JSON body
    const payload = { ...data, course: courseId };
    return this.baseApi.post<{ discussion: Discussion }>(`discussions`, payload, { showLoader: true });
  }

  updateDiscussion(courseId: string, discussionId: string, data: Partial<Discussion>): Observable<ApiResponse<{ discussion: Discussion }>> {
    return this.baseApi.patch<{ discussion: Discussion }>(`discussions/${discussionId}`, data, { showLoader: true });
  }

  deleteDiscussion(courseId: string, discussionId: string): Observable<ApiResponse<null>> {
    return this.baseApi.delete<null>(`discussions/${discussionId}`, { showLoader: true });
  }

  // ==========================================
  // REPLIES & INTERACTIONS
  // ==========================================

  replyToDiscussion(courseId: string, discussionId: string, content: string): Observable<ApiResponse<{ reply: DiscussionReply }>> {
    return this.baseApi.post<{ reply: DiscussionReply }>(`discussions/${discussionId}/replies`, { content, course: courseId }, { showLoader: false });
  }

  toggleLike(courseId: string, type: 'discussion' | 'reply', id: string): Observable<ApiResponse<{ likes: number }>> {
    return this.baseApi.post<{ likes: number }>(`discussions/${type}/${id}/like`, {}, { showLoader: false });
  }

  pinDiscussion(courseId: string, discussionId: string): Observable<ApiResponse<{ discussion: Discussion }>> {
    return this.baseApi.patch<{ discussion: Discussion }>(`discussions/${discussionId}/pin`, {}, { showLoader: true });
  }

  markResolved(courseId: string, discussionId: string): Observable<ApiResponse<{ discussion: Discussion }>> {
    return this.baseApi.patch<{ discussion: Discussion }>(`discussions/${discussionId}/resolve`, {}, { showLoader: true });
  }
}
// import { Injectable, inject } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService, ApiResponse } from '../http/base-api.service';
// import { User } from '../models/user.model'; // Assuming you have a User model

// // ==========================================
// // INTERFACES
// // ==========================================
// export interface DiscussionReply {
//   _id: string;
//   discussion: string;
//   user: User | any;
//   content: string;
//   isEdited: boolean;
//   likes: string[];
//   createdAt: string;
//   updatedAt: string;
// }

// export interface Discussion {
//   _id: string;
//   course: string;
//   lesson?: string;
//   user: User | any;
//   title: string;
//   content: string;
//   likes: string[];
//   isPinned: boolean;
//   isResolved: boolean;
//   totalReplies: number;
//   replies?: DiscussionReply[]; // Virtual/Populated field from backend
//   createdAt: string;
//   updatedAt: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class DiscussionService {
//   private baseApi = inject(BaseApiService);

//   /**
//    * Helper to generate the correct nested URL.
//    * If it's for a specific lesson, it routes through the lesson endpoint.
//    * Otherwise, it routes through the general course endpoint.
//    */
//   private getBaseUrl(courseId: string, lessonId?: string): string {
//     if (lessonId) {
//       return `courses/${courseId}/lessons/${lessonId}/discussions`;
//     }
//     return `courses/${courseId}/discussions`;
//   }

//   // ==========================================
//   // CORE CRUD
//   // ==========================================

//   getCourseDiscussions(courseId: string, lessonId?: string): Observable<ApiResponse<{ discussions: Discussion[] }>> {
//     // ✅ Fixed: Now actually uses the correct URL
//     const url = this.getBaseUrl(courseId, lessonId);
//     return this.baseApi.get<{ discussions: Discussion[] }>(url, { showLoader: false });
//   }

//   createDiscussion(courseId: string, data: { title: string; content: string; lesson?: string }): Observable<ApiResponse<{ discussion: Discussion }>> {
//     // ✅ Uses the dynamic URL so it attaches to a lesson if 'data.lesson' is provided
//     const url = this.getBaseUrl(courseId, data.lesson);
//     return this.baseApi.post<{ discussion: Discussion }>(url, data, { showLoader: true });
//   }

//   updateDiscussion(courseId: string, discussionId: string, data: Partial<Discussion>): Observable<ApiResponse<{ discussion: Discussion }>> {
//     return this.baseApi.patch<{ discussion: Discussion }>(`courses/${courseId}/discussions/${discussionId}`, data, { showLoader: true });
//   }

//   deleteDiscussion(courseId: string, discussionId: string): Observable<ApiResponse<null>> {
//     return this.baseApi.delete<null>(`courses/${courseId}/discussions/${discussionId}`, { showLoader: true });
//   }

//   // ==========================================
//   // REPLIES & INTERACTIONS
//   // ==========================================

//   replyToDiscussion(courseId: string, discussionId: string, content: string): Observable<ApiResponse<{ reply: DiscussionReply }>> {
//     return this.baseApi.post<{ reply: DiscussionReply }>(`courses/${courseId}/discussions/${discussionId}/replies`, { content }, { showLoader: false });
//   }

//   toggleLike(courseId: string, type: 'discussion' | 'reply', id: string): Observable<ApiResponse<{ likes: number }>> {
//     return this.baseApi.post<{ likes: number }>(`courses/${courseId}/discussions/${type}/${id}/like`, {}, { showLoader: false });
//   }

//   pinDiscussion(courseId: string, discussionId: string): Observable<ApiResponse<{ discussion: Discussion }>> {
//     return this.baseApi.patch<{ discussion: Discussion }>(`courses/${courseId}/discussions/${discussionId}/pin`, {}, { showLoader: true });
//   }

//   markResolved(courseId: string, discussionId: string): Observable<ApiResponse<{ discussion: Discussion }>> {
//     return this.baseApi.patch<{ discussion: Discussion }>(`courses/${courseId}/discussions/${discussionId}/resolve`, {}, { showLoader: true });
//   }
// }