import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
// import { CertificateService, Certificate } from core/services/certificate.service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Certificate, CertificateService } from '../../../../core/services/certificate.service';
import { AppMessageService } from '../../../../core/utils/message.service';

@Component({
  selector: 'app-certificate-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TagModule,
    DividerModule,
    TooltipModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="page-container fade-in">
      <p-toast position="top-right"></p-toast>

      <!-- Header with Navigation -->
      <div class="detail-header flex-between flex-wrap gap-md mb-4xl">
        <div class="breadcrumb flex align-items-center gap-xs text-sm font-bold tracking-widest uppercase">
          <a [routerLink]="isAdminView() ? '/certificates/admin' : '/certificates/my-certificates'" 
             class="bc-link text-tertiary hover-text-primary transition-colors text-decoration-none flex align-items-center gap-xs">
            <i class="pi pi-arrow-left"></i> 
            {{ isAdminView() ? 'Certificate Management' : 'My Certificates' }}
          </a>
        </div>

        <div class="header-actions flex gap-md">
          <p-button 
            label="Download PDF" 
            icon="pi pi-download" 
            severity="success"
            (onClick)="downloadPDF()"
            [disabled]="!certificate()?.isValid || loading()">
          </p-button>
          
          @if (isAdminView() && certificate()?.isValid) {
            <p-button 
              label="Revoke" 
              icon="pi pi-shield" 
              severity="danger"
              [outlined]="true"
              (onClick)="showRevokeConfirm()">
            </p-button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="state-overlay flex-col flex-center text-center py-5xl glass-panel">
          <div class="loader-ring mb-lg"></div>
          <p class="text-secondary font-heading font-bold uppercase tracking-widest text-sm">Loading certificate...</p>
        </div>
      } @else if (certificate(); as cert) {
        
        <!-- Certificate Display Card -->
        <div class="certificate-display glass-panel surface-raised overflow-hidden">
          
          <!-- Certificate Header with Status -->
          <div class="cert-header bg-secondary border-bottom-subtle p-xl md:p-3xl flex-between flex-wrap gap-lg">
            <div class="header-left">
              <p-tag 
                [severity]="cert.isValid ? 'success' : 'danger'" 
                [value]="cert.isValid ? 'VALID CERTIFICATE' : 'REVOKED'"
                [icon]="cert.isValid ? 'pi pi-check-circle' : 'pi pi-times-circle'"
                styleClass="mb-lg">
              </p-tag>
              <h1 class="font-heading text-3xl md:text-4xl text-primary font-bold m-0">Certificate of Completion</h1>
            </div>
            <div class="header-right">
              <div class="cert-number-badge bg-ternary border-primary border-radius-lg p-md">
                <span class="text-tertiary text-xs uppercase tracking-widest font-bold block mb-xs">Certificate #</span>
                <span class="font-mono text-primary font-bold text-lg">{{ cert.certificateNumber }}</span>
              </div>
            </div>
          </div>

          <!-- Certificate Body -->
          <div class="cert-body p-xl md:p-4xl">
            
            <!-- Awarded To -->
            <div class="awarded-section text-center mb-4xl">
              <p class="text-tertiary uppercase tracking-widest text-sm font-bold mb-md">This certifies that</p>
              <h2 class="recipient-name font-heading text-4xl md:text-5xl text-primary font-bold m-0 mb-lg">
                {{ cert.studentName }}
              </h2>
              <p class="text-secondary text-lg">has successfully completed the course</p>
            </div>

            <!-- Course Info -->
            <div class="course-info text-center mb-4xl">
              <div class="course-badge inline-flex align-items-center gap-sm bg-primary-light text-primary px-xl py-md border-radius-full mb-lg">
                <i class="pi pi-book"></i>
                <span class="font-bold">{{ cert.courseName }}</span>
              </div>
            </div>

            <!-- Details Grid -->
            <div class="details-grid glass-inset p-xl md:p-3xl mb-4xl">
              <div class="grid grid-3-col">
                <div class="detail-item text-center">
                  <i class="pi pi-calendar text-tertiary text-xl mb-sm"></i>
                  <p class="text-tertiary text-xs uppercase tracking-widest font-bold mb-xs">Issue Date</p>
                  <p class="text-primary font-bold text-lg">{{ cert.issueDate | date:'longDate' }}</p>
                </div>
                
                @if (cert.expiryDate) {
                  <div class="detail-item text-center">
                    <i class="pi pi-hourglass text-tertiary text-xl mb-sm"></i>
                    <p class="text-tertiary text-xs uppercase tracking-widest font-bold mb-xs">Expiry Date</p>
                    <p class="text-primary font-bold text-lg">{{ cert.expiryDate | date:'longDate' }}</p>
                  </div>
                }
                
                @if (cert.grade) {
                  <div class="detail-item text-center">
                    <i class="pi pi-star text-tertiary text-xl mb-sm"></i>
                    <p class="text-tertiary text-xs uppercase tracking-widest font-bold mb-xs">Grade</p>
                    <p class="text-primary font-bold text-lg">{{ cert.grade }}</p>
                  </div>
                }
                
                @if (cert.percentage) {
                  <div class="detail-item text-center">
                    <i class="pi pi-chart-line text-tertiary text-xl mb-sm"></i>
                    <p class="text-tertiary text-xs uppercase tracking-widest font-bold mb-xs">Score</p>
                    <p class="text-success font-bold text-lg">{{ cert.percentage }}%</p>
                  </div>
                }
              </div>
            </div>

            <!-- Instructor & Verification -->
            <div class="footer-section flex-between flex-wrap gap-xl">
              <div class="instructor-info flex align-items-center gap-md">
                <div class="instructor-avatar bg-info-light text-info border-radius-full flex-center">
                  <i class="pi pi-user"></i>
                </div>
                <div>
                  <p class="text-tertiary text-xs uppercase tracking-widest font-bold mb-xs">Instructor</p>
                  <p class="text-primary font-bold text-lg m-0">{{ cert.instructorName }}</p>
                </div>
              </div>

              <div class="verification-info flex align-items-center gap-md">
                <i class="pi pi-shield text-success text-3xl"></i>
                <div>
                  <p class="text-tertiary text-xs uppercase tracking-widest font-bold mb-xs">Verification</p>
                  <p class="text-secondary text-sm m-0 flex align-items-center gap-xs">
                    <span class="font-mono">{{ cert.certificateNumber }}</span>
                    <i class="pi pi-copy cursor-pointer hover-text-primary transition-base" 
                       (click)="copyCertificateNumber()"
                       pTooltip="Copy certificate number"></i>
                  </p>
                </div>
              </div>
            </div>

            <!-- Verification URL -->
            @if (cert.verificationUrl) {
              <div class="verification-url mt-xl pt-xl border-top-subtle text-center">
                <p class="text-tertiary text-xs uppercase tracking-widest font-bold mb-sm">Verify online at</p>
                <a [href]="cert.verificationUrl" target="_blank" class="text-info hover:text-primary transition-base text-decoration-none font-mono">
                  {{ cert.verificationUrl }}
                </a>
              </div>
            }
          </div>

          <!-- Certificate Footer with Actions -->
          <div class="cert-footer bg-ternary border-top-subtle p-xl md:p-3xl flex-between flex-wrap gap-lg">
            <div class="footer-left flex align-items-center gap-md">
              <i class="pi pi-qrcode text-3xl text-tertiary"></i>
              <div>
                <p class="text-tertiary text-xs uppercase tracking-widest font-bold mb-xs">Share Certificate</p>
                <div class="flex gap-sm">
                  <button class="share-btn" (click)="shareOnLinkedIn()" pTooltip="Share on LinkedIn">
                    <i class="pi pi-linkedin"></i>
                  </button>
                  <button class="share-btn" (click)="shareOnTwitter()" pTooltip="Share on Twitter">
                    <i class="pi pi-twitter"></i>
                  </button>
                  <button class="share-btn" (click)="shareViaEmail()" pTooltip="Share via Email">
                    <i class="pi pi-envelope"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="footer-right">
              <p-button 
                label="Download PDF" 
                icon="pi pi-download" 
                severity="success" 
                size="large"
                (onClick)="downloadPDF()"
                [disabled]="!cert.isValid">
              </p-button>
            </div>
          </div>
        </div>

        <!-- Related Certificates (Optional) -->
        @if (relatedCertificates().length > 0) {
          <div class="related-section mt-4xl">
            <h3 class="font-heading text-2xl text-primary font-bold mb-xl">Other Certificates</h3>
            <div class="related-grid">
              @for (related of relatedCertificates(); track related._id) {
                <div class="related-card glass-panel p-xl cursor-pointer hover-lift" [routerLink]="['/certificates', related._id]">
                  <div class="flex align-items-center gap-md mb-md">
                    <i class="pi pi-certificate text-info"></i>
                    <span class="font-mono text-sm text-primary">{{ related.certificateNumber }}</span>
                  </div>
                  <p class="text-secondary text-sm m-0 line-clamp-1">{{ related.courseName }}</p>
                  <p class="text-tertiary text-xs mt-sm">{{ related.issueDate | date:'mediumDate' }}</p>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    @use '../../../../../styles/mixins' as *;

    .page-container {
      padding: var(--spacing-xl) var(--spacing-md);
      max-width: 1200px;
      margin: 0 auto;
      
      @include lg { padding: var(--spacing-3xl) var(--spacing-2xl); }
    }

    .glass-panel {
      background: var(--glass-bg-c);
      backdrop-filter: blur(var(--glass-blur-c));
      border: var(--ui-border-width) solid var(--glass-border-c);
      border-radius: var(--ui-border-radius-xl);
    }

    .surface-raised {
      box-shadow: var(--shadow-lg);
    }

    .certificate-display {
      .cert-number-badge {
        border: var(--ui-border-width) solid var(--border-primary);
      }
      
      .recipient-name {
        background: linear-gradient(135deg, var(--text-primary) 0%, var(--color-primary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .course-badge {
        display: inline-flex;
        background: var(--color-primary-bg);
      }
      
      .details-grid {
        background: var(--bg-secondary);
        
        .grid-3-col {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-2xl);
          
          @include md {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      }
      
      .instructor-avatar {
        width: 48px;
        height: 48px;
        
        i {
          font-size: var(--font-size-xl);
        }
      }
      
      .share-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: var(--ui-border-width) solid var(--border-secondary);
        background: var(--bg-primary);
        color: var(--text-secondary);
        cursor: pointer;
        transition: var(--transition-base);
        
        &:hover {
          background: var(--bg-hover);
          color: var(--color-primary);
          border-color: var(--color-primary);
          transform: translateY(-2px);
        }
      }
    }

    .related-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
      
      @include sm {
        grid-template-columns: repeat(2, 1fr);
      }
      
      @include lg {
        grid-template-columns: repeat(4, 1fr);
      }
      
      .related-card {
        transition: var(--transition-base);
        
        &:hover {
          border-color: var(--color-primary);
        }
      }
    }

    .loader-ring {
      width: clamp(40px, 8vw, 60px);
      aspect-ratio: 1;
      border-width: 3px;
      border-style: solid;
      border-color: var(--border-secondary);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s infinite linear;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
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
export class CertificateDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private certificateService = inject(CertificateService);
  private messageService = inject(AppMessageService);

  certificate = this.certificateService.selectedCertificate;
  loading = this.certificateService.loading;
  relatedCertificates = signal<Certificate[]>([]);
  isAdminView = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const url = this.route.snapshot.url.join('/');
    this.isAdminView.set(url.includes('admin'));

    if (id) {
      this.loadCertificate(id);
    }
  }

  private loadCertificate(id: string): void {
    this.certificateService.getCertificate(id).subscribe({
      next: () => {
        this.loadRelatedCertificates();
      }
    });
  }

  private loadRelatedCertificates(): void {
    // Load certificates from same student or similar
    const currentCert = this.certificate();
    if (currentCert?.student) {
      this.certificateService.getMyCertificates().subscribe({
        next: (response) => {
          const related = response.data.certificates
            .filter(c => c._id !== currentCert._id)
            .slice(0, 4);
          this.relatedCertificates.set(related);
        }
      });
    }
  }

  downloadPDF(): void {
    const cert = this.certificate();
    if (cert) {
      this.certificateService.downloadCertificatePDF(cert._id);
      this.messageService.showSuccess('Your certificate PDF is being generated...'
      );
    }
  }

  copyCertificateNumber(): void {
    const cert = this.certificate();
    if (cert) {
      navigator.clipboard.writeText(cert.certificateNumber);
      this.messageService.showInfo('Certificate number copied to clipboard'
      );
    }
  }

  shareOnLinkedIn(): void {
    const cert = this.certificate();
    if (cert) {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`I've successfully completed ${cert.courseName} course!`);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    }
  }

  shareOnTwitter(): void {
    const cert = this.certificate();
    if (cert) {
      const text = encodeURIComponent(`I've earned my certificate in ${cert.courseName}! 🎓`);
      const url = encodeURIComponent(window.location.href);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    }
  }

  shareViaEmail(): void {
    const cert = this.certificate();
    if (cert) {
      const subject = encodeURIComponent(`My Certificate in ${cert.courseName}`);
      const body = encodeURIComponent(`I've successfully completed the course and earned my certificate. View it here: ${window.location.href}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  }

  showRevokeConfirm(): void {
    // Handled by parent component or dialog service
  }
}