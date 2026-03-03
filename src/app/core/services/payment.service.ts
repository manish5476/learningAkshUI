import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService, ApiResponse } from '../http/base-api.service';

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentId: string;
  amount: number;
  currency: string;
  isDummy?: boolean; // Helpful for your local testing toggle
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly endpoint = 'payments';
  private baseApi = inject(BaseApiService);

  /**
   * Step 1: Initialize payment for a course or mock test
   */
  createPaymentIntent(itemId: string, itemType: 'course' | 'mockTest'): Observable<ApiResponse<PaymentIntentResponse>> {
    return this.baseApi.post<PaymentIntentResponse>(`${this.endpoint}/create-intent`, { 
      itemId, 
      itemType 
    }, { showLoader: true });
  }

  /**
   * Step 2: Confirm successful payment (This triggers backend enrollment)
   * In Dummy Mode, just send the paymentId.
   * In Stripe Mode, send the stripe transactionId.
   */
  confirmPayment(paymentId: string, transactionId?: string): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/confirm`, { 
      paymentId, 
      transactionId,
      status: 'success' 
    }, { showLoader: true });
  }

  /**
   * Get payment history for the logged-in user
   */
  getMyPayments(): Observable<ApiResponse<any>> {
    return this.baseApi.get(`${this.endpoint}/my-payments`, { showLoader: true });
  }

  // ==========================
  // ADMIN METHODS
  // ==========================

  /**
   * Process a refund (Admin only)
   */
  processRefund(paymentId: string, amount?: number, reason?: string): Observable<ApiResponse<any>> {
    return this.baseApi.post(`${this.endpoint}/${paymentId}/refund`, { 
      amount, 
      reason 
    }, { showLoader: true });
  }

  /**
   * Get all platform payments (Admin only)
   */
  getAllPayments(params?: any): Observable<ApiResponse<any>> {
    return this.baseApi.get(this.endpoint, { params, showLoader: true });
  }
}