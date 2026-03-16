import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Certificate, CertificateService } from '../../../../core/services/certificate.service';
import { AppMessageService } from '../../../../core/utils/message.service';

@Component({
  selector: 'app-certificate-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    TooltipModule,
    DialogModule,
    TableModule,
    ToastModule,
    ConfirmDialogModule,
    DatePipe
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="page-container fade-in">
      <p-toast position="top-right"></p-toast>
      <p-confirmDialog styleClass="glass-dialog"></p-confirmDialog>

      <!-- Header -->
      <div class="page-header flex-col md:flex-row flex-between gap-xl mb-4xl pb-lg border-bottom-subtle">
        <div class="header-titles flex-col gap-xs flex-grow-1">
          <h1 class="title font-heading text-3xl md:text-4xl font-bold text-primary m-0 line-height-tight">
            {{ isAdminMode() ? 'Certificate Management' : 'My Certificates' }}
          </h1>
          <p class="subtitle text-secondary text-md md:text-lg m-0 max-w-prose">
            {{ isAdminMode() ? 'Manage and verify all issued certificates' : 'View and download your earned certificates' }}
          </p>
        </div>
        
        @if (!isAdminMode()) {
          <div class="header-actions flex-shrink-0 w-full md:w-auto">
            <p-button 
              label="Verify Certificate" 
              icon="pi pi-shield" 
              severity="secondary" 
              [outlined]="true"
              (onClick)="showVerificationDialog()"
              class="w-full md:w-auto">
            </p-button>
          </div>
        }
      </div>

      <!-- Stats Grid -->
      @if (!isAdminMode()) {
        <div class="stats-grid mb-4xl">
          <div class="stat-card glass-panel surface-raised flex align-items-center gap-lg hover-lift">
            <div class="stat-icon bg-primary-light text-primary flex-center border-radius-full">
              <i class="pi pi-certificate"></i>
            </div>
            <div class="stat-content flex-col gap-xs">
              <span class="stat-label text-xs uppercase tracking-widest font-bold text-tertiary">Total Earned</span>
              <span class="stat-value font-heading text-3xl font-bold text-primary m-0 line-height-tight">
                {{ certificates().length }}
              </span>
            </div>
          </div>
          
          <div class="stat-card glass-panel surface-raised flex align-items-center gap-lg hover-lift">
            <div class="stat-icon bg-success-light text-success flex-center border-radius-full">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="stat-content flex-col gap-xs">
              <span class="stat-label text-xs uppercase tracking-widest font-bold text-tertiary">Valid</span>
              <span class="stat-value font-heading text-3xl font-bold text-primary m-0 line-height-tight">
                {{ validCertificates().length }}
              </span>
            </div>
          </div>
        </div>
      }

      <!-- Search & Filter -->
      <div class="table-toolbar glass-panel mb-2xl p-lg md:p-2xl flex-col md:flex-row flex-between gap-lg">
        <div class="toolbar-left flex align-items-center gap-md">
          <i class="pi pi-search text-tertiary text-xl"></i>
          <span class="text-primary font-bold">Certificates</span>
        </div>
        
        <div class="toolbar-actions flex-col md:flex-row gap-md w-full md:w-auto">
          <span class="p-input-icon-left w-full md:w-20rem">
            <i class="pi pi-search"></i>
            <input 
              type="text" 
              pInputText 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onSearch()"
              placeholder="Search by course, student, or number..." 
              class="w-full">
          </span>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="state-overlay flex-col flex-center text-center py-5xl glass-panel">
          <div class="loader-ring mb-lg"></div>
          <p class="text-secondary font-heading font-bold uppercase tracking-widest text-sm">Loading certificates...</p>
        </div>
      } @else {
        <!-- Certificate Grid/Card View -->
        <div class="certificate-feed-grid">
          @for (cert of filteredCertificates(); track cert._id) {
            <div class="certificate-card glass-panel surface-raised overflow-hidden" [class.revoked]="!cert.isValid">
              
              <!-- Card Header with Certificate Number -->
              <div class="card-header bg-primary border-bottom-subtle p-lg md:p-xl">
                <div class="flex-between gap-md">
                  <div class="cert-number-wrapper flex align-items-center gap-sm">
                    <i class="pi pi-qrcode text-tertiary"></i>
                    <span class="cert-number font-mono text-sm font-bold text-primary">{{ cert.certificateNumber }}</span>
                  </div>
                  <p-tag 
                    [severity]="cert.isValid ? 'success' : 'danger'" 
                    [value]="cert.isValid ? 'Valid' : 'Revoked'"
                    [icon]="cert.isValid ? 'pi pi-check-circle' : 'pi pi-times-circle'">
                  </p-tag>
                </div>
              </div>

              <!-- Card Body -->
              <div class="card-body p-lg md:p-xl">
                <!-- Student & Course Info -->
                <div class="student-info mb-lg pb-lg border-bottom-subtle">
                  <p class="text-tertiary text-xs uppercase tracking-widest font-bold mb-xs">Issued To</p>
                  <h3 class="student-name font-heading text-xl text-primary font-bold m-0 mb-xs">
                    {{ cert.studentName }}
                  </h3>
                  <p class="course-name text-secondary text-md m-0">
                    <i class="pi pi-book mr-1"></i> {{ cert.courseName }}
                  </p>
                </div>

                <!-- Details Grid -->
                <div class="details-grid">
                  <div class="detail-item mb-md">
                    <span class="detail-label text-tertiary text-xs uppercase tracking-widest font-bold">Issue Date</span>
                    <span class="detail-value text-primary font-bold">{{ cert.issueDate | date:'mediumDate' }}</span>
                  </div>
                  
                  @if (cert.grade) {
                    <div class="detail-item mb-md">
                      <span class="detail-label text-tertiary text-xs uppercase tracking-widest font-bold">Grade</span>
                      <span class="detail-value text-primary font-bold">{{ cert.grade }}</span>
                    </div>
                  }
                  
                  @if (cert.percentage) {
                    <div class="detail-item mb-md">
                      <span class="detail-label text-tertiary text-xs uppercase tracking-widest font-bold">Score</span>
                      <span class="detail-value text-success font-bold">{{ cert.percentage }}%</span>
                    </div>
                  }
                </div>

                <!-- Instructor -->
                <div class="instructor-info mt-md pt-md border-top-subtle flex align-items-center gap-sm">
                  <i class="pi pi-user text-tertiary"></i>
                  <span class="text-secondary text-sm">{{ cert.instructorName }}</span>
                </div>
              </div>

              <!-- Card Actions -->
              <div class="card-actions flex gap-sm p-lg bg-ternary border-top-subtle">
                <p-button 
                  icon="pi pi-download" 
                  severity="success" 
                  [rounded]="true" 
                  [text]="true"
                  (onClick)="downloadCertificate(cert._id)"
                  pTooltip="Download PDF"
                  [disabled]="!cert.isValid">
                </p-button>
                
                <p-button 
                  icon="pi pi-eye" 
                  severity="info" 
                  [rounded]="true" 
                  [text]="true"
                  (onClick)="viewCertificate(cert._id)"
                  pTooltip="View Details">
                </p-button>
                
                @if (isAdminMode()) {
                  <p-button 
                    icon="pi pi-shield" 
                    severity="warn" 
                    [rounded]="true" 
                    [text]="true"
                    (onClick)="showRevokeDialog(cert)"
                    pTooltip="Revoke Certificate"
                    [disabled]="!cert.isValid">
                  </p-button>
                }
              </div>
            </div>
          } @empty {
            <!-- Empty State -->
            <div class="empty-state glass-panel col-span-full flex-col flex-center text-center py-5xl">
              <div class="empty-icon-wrapper flex-center border-radius-full bg-ternary mb-2xl">
                <i class="pi pi-certificate text-5xl text-tertiary"></i>
              </div>
              <h3 class="font-heading text-2xl text-primary font-bold m-0 mb-xs">
                No certificates found
              </h3>
              <p class="text-secondary m-0 mb-xl max-w-prose">
                {{ isAdminMode() ? 'No certificates have been issued yet.' : 'Complete courses to earn your first certificate!' }}
              </p>
              @if (!isAdminMode()) {
                <p-button 
                  label="Browse Courses" 
                  icon="pi pi-search" 
                  [routerLink]="['/courses']"
                  size="large">
                </p-button>
              }
            </div>
          }
        </div>

        <!-- Footer Stats -->
        @if (filteredCertificates().length > 0) {
          <div class="feed-footer mt-4xl text-center text-secondary font-mono text-sm">
            Showing {{ filteredCertificates().length }} of {{ certificates().length }} certificates
          </div>
        }
      }
    </div>

    <!-- Verification Dialog -->
    <p-dialog appendTo="body"  
      [(visible)]="showVerificationModal" 
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      styleClass="verification-dialog"
      [showHeader]="false">
      
      <div class="verification-wrapper glass-panel p-4xl">
        <button class="modal-close-btn flex-center border-radius-full absolute cursor-pointer" (click)="closeVerificationDialog()">
          <i class="pi pi-times"></i>
        </button>

        <div class="verification-header text-center mb-4xl">
          <div class="shield-icon flex-center border-radius-full bg-info-light text-info mx-auto mb-lg">
            <i class="pi pi-shield text-4xl"></i>
          </div>
          <h2 class="font-heading text-3xl text-primary font-bold m-0 mb-xs">Verify Certificate</h2>
          <p class="text-secondary m-0">Enter the certificate number to verify its authenticity</p>
        </div>

        <div class="verification-form">
          <div class="form-group mb-3xl">
            <label class="text-primary font-bold text-sm block mb-md">Certificate Number</label>
            <div class="input-wrapper relative">
              <i class="pi pi-qrcode absolute left-icon text-tertiary"></i>
              <input 
                type="text" 
                pInputText 
                [(ngModel)]="certificateNumberInput"
                placeholder="e.g., CERT-2024-XXXXXX"
                class="w-full input-with-icon"
                (keyup.enter)="verifyCertificate()">
            </div>
          </div>

          <p-button 
            label="Verify Now" 
            icon="pi pi-check-circle"
            styleClass="w-full py-lg text-lg"
            (onClick)="verifyCertificate()"
            [disabled]="!certificateNumberInput || verificationLoading()">
          </p-button>
        </div>

        <!-- Verification Result -->
        @if (verificationResult(); as result) {
          <div class="verification-result mt-4xl pt-4xl border-top-subtle">
            <div class="result-header flex align-items-center gap-md mb-xl">
              <div class="result-icon flex-center border-radius-full" [class.bg-success-light]="result.isValid" [class.bg-error-light]="!result.isValid">
                <i class="pi" [class.pi-check-circle]="result.isValid" [class.pi-times-circle]="!result.isValid" 
                   [class.text-success]="result.isValid" [class.text-error]="!result.isValid"></i>
              </div>
              <h3 class="font-heading text-2xl m-0" [class.text-success]="result.isValid" [class.text-error]="!result.isValid">
                {{ result.isValid ? 'Valid Certificate' : 'Invalid Certificate' }}
              </h3>
            </div>

            @if (result.isValid) {
              <div class="certificate-details glass-inset p-xl">
                <div class="detail-row flex-between mb-md pb-md border-bottom-subtle">
                  <span class="text-tertiary">Student</span>
                  <span class="text-primary font-bold">{{ result.studentName }}</span>
                </div>
                <div class="detail-row flex-between mb-md pb-md border-bottom-subtle">
                  <span class="text-tertiary">Course</span>
                  <span class="text-primary font-bold">{{ result.courseName }}</span>
                </div>
                <div class="detail-row flex-between mb-md pb-md border-bottom-subtle">
                  <span class="text-tertiary">Issue Date</span>
                  <span class="text-primary font-bold">{{ result.issueDate | date:'mediumDate' }}</span>
                </div>
                @if (result.grade) {
                  <div class="detail-row flex-between mb-md pb-md border-bottom-subtle">
                    <span class="text-tertiary">Grade</span>
                    <span class="text-primary font-bold">{{ result.grade }}</span>
                  </div>
                }
                @if (result.percentage) {
                  <div class="detail-row flex-between mb-md pb-md border-bottom-subtle">
                    <span class="text-tertiary">Score</span>
                    <span class="text-success font-bold">{{ result.percentage }}%</span>
                  </div>
                }
                <div class="detail-row flex-between">
                  <span class="text-tertiary">Instructor</span>
                  <span class="text-primary font-bold">{{ result.instructorName }}</span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </p-dialog>
  `,
  styles: [`
    @use '../../../../../styles/mixins' as *;

    :host ::ng-deep {
      .verification-dialog {
        width: 95vw !important;
        max-width: 500px !important;
        
        .p-dialog-content {
          padding: 0 !important;
          background: transparent !important;
        }
      }
    }

    .page-container {
      padding: var(--spacing-xl) var(--spacing-md);
      max-width: 1400px;
      margin: 0 auto;
      min-height: 100dvh;
      
      @include lg { padding: var(--spacing-3xl) var(--spacing-2xl); }
    }

    .glass-panel {
      background: var(--glass-bg-c);
      backdrop-filter: blur(var(--glass-blur-c));
      border: var(--ui-border-width) solid var(--glass-border-c);
      border-radius: var(--ui-border-radius-xl);
    }

    .surface-raised { 
      box-shadow: var(--shadow-md); 
      transition: var(--transition-base);
      
      &:hover {
        box-shadow: var(--shadow-xl);
        transform: translateY(-2px);
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
      
      @include sm { grid-template-columns: repeat(2, 1fr); }
      
      .stat-card {
        padding: var(--spacing-2xl);
        
        .stat-icon {
          width: clamp(48px, 10vw, 64px);
          aspect-ratio: 1;
          font-size: var(--font-size-2xl);
        }
      }
    }

    .certificate-feed-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-xl);
      
      @include md { 
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); 
        gap: var(--spacing-2xl);
      }
    }

    .certificate-card {
      display: flex;
      flex-direction: column;
      transition: var(--transition-base);
      
      &.revoked {
        opacity: 0.8;
        filter: grayscale(0.5);
        
        .cert-number {
          text-decoration: line-through;
        }
      }
      
      .card-header {
        .cert-number {
          font-family: var(--font-mono);
          background: var(--bg-ternary);
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--ui-border-radius-lg);
        }
      }
      
      .student-name {
        font-size: var(--font-size-xl);
        
        @include md { font-size: var(--font-size-2xl); }
      }
      
      .course-name {
        font-size: var(--font-size-sm);
        
        @include md { font-size: var(--font-size-md); }
      }
      
      .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: var(--spacing-md);
      }
    }

    .verification-wrapper {
      position: relative;
      padding: var(--spacing-2xl);
      
      @include md { padding: var(--spacing-4xl); }
      
      .modal-close-btn {
        top: var(--spacing-lg);
        right: var(--spacing-lg);
        width: 36px;
        height: 36px;
        background: var(--bg-secondary);
        border: var(--ui-border-width) solid var(--border-secondary);
        color: var(--text-secondary);
        
        &:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
          transform: scale(1.05);
        }
      }
      
      .shield-icon {
        width: clamp(64px, 15vw, 88px);
        aspect-ratio: 1;
        background: var(--color-info-bg);
      }
      
      .input-wrapper {
        i {
          left: var(--spacing-lg);
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
        }
        
        .input-with-icon {
          padding-left: calc(var(--spacing-lg) * 2.5);
        }
      }
      
      .result-icon {
        width: 48px;
        height: 48px;
        
        &.bg-success-light { background: var(--color-success-bg); }
        &.bg-error-light { background: var(--color-error-bg); }
        
        i {
          font-size: var(--font-size-2xl);
        }
      }
    }

    .empty-icon-wrapper {
      width: clamp(80px, 15vw, 100px);
      aspect-ratio: 1;
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
export class CertificateListComponent implements OnInit {
  private certificateService = inject(CertificateService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(AppMessageService);

  // Signals
  certificates = this.certificateService.certificates;
  loading = this.certificateService.loading;
  verificationResult = this.certificateService.verificationResult;

  // Local state
  searchQuery = signal('');
  filteredCertificates = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.certificates();

    return this.certificates().filter(cert =>
      cert.certificateNumber.toLowerCase().includes(query) ||
      cert.studentName.toLowerCase().includes(query) ||
      cert.courseName.toLowerCase().includes(query) ||
      cert.instructorName.toLowerCase().includes(query)
    );
  });

  validCertificates = computed(() =>
    this.certificates().filter(c => c.isValid)
  );

  // UI State
  showVerificationModal = signal(false);
  certificateNumberInput = signal('');
  verificationLoading = signal(false);

  // Admin mode detection
  isAdminMode = signal(false);

  ngOnInit(): void {
    this.loadCertificates();
  }

  private loadCertificates(): void {
    if (this.isAdminMode()) {
      this.certificateService.getAllCertificates().subscribe();
    } else {
      this.certificateService.getMyCertificates().subscribe();
    }
  }

  onSearch(): void {
    // Trigger computed signal update
    this.searchQuery.set(this.searchQuery());
  }

  downloadCertificate(id: string): void {
    this.certificateService.downloadCertificatePDF(id);
    this.messageService.showInfo('Your certificate PDF is being generated...');
  }

  viewCertificate(id: string): void {
    this.certificateService.getCertificate(id).subscribe({
      next: (cert) => {
        // Navigate to detail view or show modal
        // You can implement a detail modal similar to verification
      }
    });
  }

  showVerificationDialog(): void {
    this.showVerificationModal.set(true);
    this.certificateNumberInput.set('');
    this.certificateService.clearVerification();
  }

  closeVerificationDialog(): void {
    this.showVerificationModal.set(false);
    this.certificateService.clearVerification();
  }

  verifyCertificate(): void {
    if (!this.certificateNumberInput()) return;

    this.verificationLoading.set(true);
    this.certificateService.verifyCertificate(this.certificateNumberInput()).subscribe({
      next: () => {
        this.verificationLoading.set(false);
      },
      error: () => {
        this.verificationLoading.set(false);
        this.messageService.showError('Invalid certificate number');
      }
    });
  }

  showRevokeDialog(certificate: Certificate): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to revoke the certificate for ${certificate.studentName}?`,
      header: 'Revoke Certificate',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.revokeCertificate(certificate._id)
    });
  }

  revokeCertificate(id: string): void {
    this.certificateService.revokeCertificate(id).subscribe({
      next: () => {
        this.messageService.showSuccess('The certificate has been successfully revoked'
        );
      },
      error: () => {
        this.messageService.showError('Failed to revoke certificate');
      }
    });
  }
}