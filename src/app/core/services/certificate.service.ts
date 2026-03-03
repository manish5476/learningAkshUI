import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Certificate {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  course: {
    _id: string;
    title: string;
  };
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  certificateNumber: string;
  studentName: string;
  courseName: string;
  issueDate: Date;
  expiryDate?: Date;
  grade?: string;
  percentage?: number;
  instructorName: string;
  certificateUrl?: string;
  verificationUrl?: string;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateVerification {
  studentName: string;
  courseName: string;
  issueDate: Date;
  grade?: string;
  percentage?: number;
  instructorName: string;
  isValid: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/certificates`;

  // State signals
  private certificatesSignal = signal<Certificate[]>([]);
  private selectedCertificateSignal = signal<Certificate | null>(null);
  private loadingSignal = signal<boolean>(false);
  private verificationResultSignal = signal<CertificateVerification | null>(null);

  // Readonly exposable signals
  readonly certificates = this.certificatesSignal.asReadonly();
  readonly selectedCertificate = this.selectedCertificateSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly verificationResult = this.verificationResultSignal.asReadonly();

  constructor() {}

  // Get user's certificates
  getMyCertificates(): Observable<{ data: { certificates: Certificate[] } }> {
    this.loadingSignal.set(true);
    return this.http.get<{ data: { certificates: Certificate[] } }>(
      `${this.baseUrl}/my-certificates`
    ).pipe(
      tap({
        next: (response) => {
          this.certificatesSignal.set(response.data.certificates);
          this.loadingSignal.set(false);
        },
        error: () => this.loadingSignal.set(false)
      })
    );
  }

  // Get all certificates (admin)
  getAllCertificates(params?: any): Observable<{ data: { certificates: Certificate[] } }> {
    this.loadingSignal.set(true);
    return this.http.get<{ data: { certificates: Certificate[] } }>(this.baseUrl, { params }).pipe(
      tap({
        next: (response) => {
          this.certificatesSignal.set(response.data.certificates);
          this.loadingSignal.set(false);
        },
        error: () => this.loadingSignal.set(false)
      })
    );
  }

  // Get single certificate
  getCertificate(id: string): Observable<{ data: { certificate: Certificate } }> {
    this.loadingSignal.set(true);
    return this.http.get<{ data: { certificate: Certificate } }>(`${this.baseUrl}/${id}`).pipe(
      tap({
        next: (response) => {
          this.selectedCertificateSignal.set(response.data.certificate);
          this.loadingSignal.set(false);
        },
        error: () => this.loadingSignal.set(false)
      })
    );
  }

  // Verify certificate by number
  verifyCertificate(certificateNumber: string): Observable<{ data: { certificate: CertificateVerification } }> {
    this.loadingSignal.set(true);
    return this.http.get<{ data: { certificate: CertificateVerification } }>(
      `${this.baseUrl}/verify/${certificateNumber}`
    ).pipe(
      tap({
        next: (response) => {
          this.verificationResultSignal.set(response.data.certificate);
          this.loadingSignal.set(false);
        },
        error: () => this.loadingSignal.set(false)
      })
    );
  }

  // Generate PDF
  downloadCertificatePDF(id: string): void {
    this.loadingSignal.set(true);
    window.open(`${this.baseUrl}/${id}/pdf`, '_blank');
    setTimeout(() => this.loadingSignal.set(false), 1000);
  }

  // Revoke certificate (admin)
  revokeCertificate(id: string): Observable<any> {
    this.loadingSignal.set(true);
    return this.http.patch(`${this.baseUrl}/${id}/revoke`, {}).pipe(
      tap({
        next: () => {
          // Update local state
          this.certificatesSignal.update(certs => 
            certs.map(c => c._id === id ? { ...c, isValid: false } : c)
          );
          if (this.selectedCertificateSignal()?._id === id) {
            this.selectedCertificateSignal.update(c => c ? { ...c, isValid: false } : null);
          }
          this.loadingSignal.set(false);
        },
        error: () => this.loadingSignal.set(false)
      })
    );
  }

  // Clear verification result
  clearVerification(): void {
    this.verificationResultSignal.set(null);
  }

  // Reset state
  resetState(): void {
    this.certificatesSignal.set([]);
    this.selectedCertificateSignal.set(null);
    this.verificationResultSignal.set(null);
    this.loadingSignal.set(false);
  }
}