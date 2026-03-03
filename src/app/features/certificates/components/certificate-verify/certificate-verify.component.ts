import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
// import { CertificateService, CertificateVerification } from '../../../core/services/certificate.service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CertificateService } from '../../../../core/services/certificate.service';

@Component({
  selector: 'app-certificate-verify',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="verify-page fade-in">
      <p-toast position="top-right"></p-toast>

      <div class="verify-container glass-panel surface-raised">
        
        <!-- Header -->
        <div class="verify-header text-center mb-4xl">
          <div class="seal-icon flex-center border-radius-full bg-info-light text-info mx-auto mb-lg">
            <i class="pi pi-shield text-4xl"></i>
          </div>
          <h1 class="font-heading text-3xl md:text-4xl text-primary font-bold m-0 mb-md">Verify Certificate</h1>
          <p class="text-secondary text-md m-0 max-w-prose mx-auto">
            Enter the certificate number to verify its authenticity and view details
          </p>
        </div>

        <!-- Search Form -->
        <div class="verify-form mb-4xl">
          <div class="form-group mb-3xl">
            <label class="text-primary font-bold text-sm block mb-md">Certificate Number</label>
            <div class="input-group flex align-items-center gap-md">
              <span class="p-input-icon-left flex-grow-1">
                <i class="pi pi-qrcode"></i>
                <input 
                  type="text" 
                  pInputText 
                  [(ngModel)]="certificateNumber"
                  placeholder="e.g., CERT-2024-XXXXXX"
                  class="w-full"
                  (keyup.enter)="verifyCertificate()">
              </span>
              <p-button 
                label="Verify" 
                icon="pi pi-search"
                (onClick)="verifyCertificate()"
                [loading]="loading()">
              </p-button>
            </div>
          </div>

          <!-- Recent Verifications (Optional) -->
          <div class="recent-section text-center">
            <p class="text-tertiary text-sm mb-md">Popular verifications</p>
            <div class="flex flex-wrap gap-sm justify-content-center">
              @for (sample of sampleCertificates; track sample) {
                <button class="sample-btn" (click)="certificateNumber.set(sample)">
                  {{ sample }}
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Verification Result -->
        @if (verificationResult(); as result) {
          <div class="verification-result">
            <div class="result-header flex align-items-center gap-md mb-xl pb-xl border-bottom-subtle">
              <div class="result-icon flex-center border-radius-full" 
                   [class.bg-success-light]="result.isValid" 
                   [class.bg-error-light]="!result.isValid">
                <i class="pi text-2xl" 
                   [class.pi-check-circle]="result.isValid" 
                   [class.pi-times-circle]="!result.isValid"
                   [class.text-success]="result.isValid" 
                   [class.text-error]="!result.isValid">
                </i>
              </div>
              <div>
                <h2 class="font-heading text-2xl m-0 mb-xs" 
                    [class.text-success]="result.isValid" 
                    [class.text-error]="!result.isValid">
                  {{ result.isValid ? 'Valid Certificate' : 'Invalid Certificate' }}
                </h2>
                <p class="text-secondary text-sm m-0">
                  {{ result.isValid ? 'This certificate is authentic and active' : 'Certificate not found or has been revoked' }}
                </p>
              </div>
            </div>

            @if (result.isValid) {
              <div class="certificate-details">
                <div class="detail-card glass-inset p-xl mb-xl">
                  <div class="detail-row flex-between mb-lg pb-lg border-bottom-subtle">
                    <span class="text-tertiary font-bold">Student Name</span>
                    <span class="text-primary font-bold text-lg">{{ result.studentName }}</span>
                  </div>
                  <div class="detail-row flex-between mb-lg pb-lg border-bottom-subtle">
                    <span class="text-tertiary font-bold">Course Name</span>
                    <span class="text-primary font-bold">{{ result.courseName }}</span>
                  </div>
                  <div class="detail-row flex-between mb-lg pb-lg border-bottom-subtle">
                    <span class="text-tertiary font-bold">Issue Date</span>
                    <span class="text-primary font-bold">{{ result.issueDate | date:'longDate' }}</span>
                  </div>
                  @if (result.grade) {
                    <div class="detail-row flex-between mb-lg pb-lg border-bottom-subtle">
                      <span class="text-tertiary font-bold">Grade</span>
                      <span class="text-primary font-bold">{{ result.grade }}</span>
                    </div>
                  }
                  @if (result.percentage) {
                    <div class="detail-row flex-between mb-lg pb-lg border-bottom-subtle">
                      <span class="text-tertiary font-bold">Score</span>
                      <span class="text-success font-bold">{{ result.percentage }}%</span>
                    </div>
                  }
                  <div class="detail-row flex-between">
                    <span class="text-tertiary font-bold">Instructor</span>
                    <span class="text-primary font-bold">{{ result.instructorName }}</span>
                  </div>
                </div>

                <div class="verification-badge flex align-items-center gap-md p-xl bg-success-light border-radius-lg">
                  <i class="pi pi-shield text-success text-3xl"></i>
                  <div>
                    <p class="text-success font-bold m-0">Verified by EduPlatform</p>
                    <p class="text-tertiary text-sm m-0">This certificate is digitally signed and verified</p>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Trust Badges -->
        <div class="trust-badges flex-center gap-3xl mt-4xl pt-4xl border-top-subtle">
          <div class="badge flex align-items-center gap-sm">
            <i class="pi pi-lock text-success"></i>
            <span class="text-tertiary text-sm">256-bit SSL</span>
          </div>
          <div class="badge flex align-items-center gap-sm">
            <i class="pi pi-verified text-success"></i>
            <span class="text-tertiary text-sm">Blockchain Verified</span>
          </div>
          <div class="badge flex align-items-center gap-sm">
            <i class="pi pi-shield text-success"></i>
            <span class="text-tertiary text-sm">Tamper-proof</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/mixins' as *;

    .verify-page {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl) var(--spacing-md);
      background: radial-gradient(circle at 10% 20%, var(--bg-secondary) 0%, var(--bg-primary) 90%);
      
      @include md {
        padding: var(--spacing-3xl) var(--spacing-2xl);
      }
    }

    .verify-container {
      max-width: 700px;
      width: 100%;
      padding: var(--spacing-2xl);
      
      @include md {
        padding: var(--spacing-4xl);
      }
    }

    .glass-panel {
      background: var(--glass-bg-c);
      backdrop-filter: blur(var(--glass-blur-c));
      border: var(--ui-border-width) solid var(--glass-border-c);
      border-radius: var(--ui-border-radius-xl);
    }

    .surface-raised {
      box-shadow: var(--shadow-2xl);
    }

    .seal-icon {
      width: clamp(80px, 15vw, 100px);
      aspect-ratio: 1;
      background: var(--color-info-bg);
    }

    .input-group {
      .p-inputtext {
        border-radius: var(--ui-border-radius-lg);
        border: var(--ui-border-width-lg) solid var(--border-primary);
        padding: var(--spacing-lg) var(--spacing-xl) var(--spacing-lg) calc(var(--spacing-xl) * 2.5);
        
        &:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-bg);
        }
      }
      
      i {
        left: var(--spacing-xl) !important;
      }
    }

    .sample-btn {
      padding: var(--spacing-xs) var(--spacing-lg);
      background: var(--bg-ternary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-full);
      color: var(--text-tertiary);
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      cursor: pointer;
      transition: var(--transition-base);
      
      &:hover {
        background: var(--bg-hover);
        border-color: var(--color-primary);
        color: var(--text-primary);
      }
    }

    .result-icon {
      width: 60px;
      height: 60px;
      
      &.bg-success-light { background: var(--color-success-bg); }
      &.bg-error-light { background: var(--color-error-bg); }
    }

    .glass-inset {
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
    }

    .verification-badge {
      background: var(--color-success-bg);
      border: var(--ui-border-width) solid var(--color-success-border);
    }

    .trust-badges {
      .badge {
        i {
          font-size: var(--font-size-lg);
        }
      }
    }

    .fade-in {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CertificateVerifyComponent {
  private route = inject(ActivatedRoute);
  private certificateService = inject(CertificateService);
  private messageService = inject(MessageService);

  certificateNumber = signal('');
  verificationResult = this.certificateService.verificationResult;
  loading = this.certificateService.loading;

  sampleCertificates = [
    'CERT-2024-ABC123',
    'CERT-2024-XYZ789',
    'CERT-2024-DEF456'
  ];

  ngOnInit(): void {
    // Check if certificate number is in URL
    const certNumber = this.route.snapshot.paramMap.get('number');
    if (certNumber) {
      this.certificateNumber.set(certNumber);
      this.verifyCertificate();
    }
  }

  verifyCertificate(): void {
    if (!this.certificateNumber()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Required',
        detail: 'Please enter a certificate number'
      });
      return;
    }

    this.certificateService.verifyCertificate(this.certificateNumber()).subscribe({
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Verification Failed',
          detail: 'Certificate not found or invalid'
        });
      }
    });
  }
}