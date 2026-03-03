import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
// import { CertificateService } from '../../../core/services/certificate.service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CertificateService } from '../../../../core/services/certificate.service';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-instructor-certificates',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    TagModule,SelectModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="instructor-certificates fade-in">
      <p-toast position="top-right"></p-toast>

      <!-- Header -->
      <div class="header-section flex-between flex-wrap gap-lg mb-4xl">
        <div>
          <h1 class="font-heading text-3xl text-primary font-bold m-0 mb-sm">Student Certificates</h1>
          <p class="text-secondary text-md m-0">Manage certificates issued to your students</p>
        </div>
        <div class="header-actions flex gap-md">
          <p-button 
            label="Issue New" 
            icon="pi pi-plus" 
            severity="success"
            [routerLink]="['/certificates/instructor/issue']">
          </p-button>
          <p-button 
            label="Export" 
            icon="pi pi-download" 
            severity="secondary" 
            [outlined]="true"
            (onClick)="exportData()">
          </p-button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid mb-4xl">
        <div class="stat-card glass-panel p-xl">
          <i class="pi pi-certificate text-info text-2xl mb-md"></i>
          <span class="stat-value text-3xl font-bold text-primary">{{ stats().total }}</span>
          <span class="stat-label text-tertiary">Total Issued</span>
        </div>
        <div class="stat-card glass-panel p-xl">
          <i class="pi pi-users text-success text-2xl mb-md"></i>
          <span class="stat-value text-3xl font-bold text-primary">{{ stats().students }}</span>
          <span class="stat-label text-tertiary">Students</span>
        </div>
        <div class="stat-card glass-panel p-xl">
          <i class="pi pi-star text-warning text-2xl mb-md"></i>
          <span class="stat-value text-3xl font-bold text-primary">{{ stats().avgScore }}%</span>
          <span class="stat-label text-tertiary">Avg Score</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section glass-panel p-lg mb-4xl">
        <div class="flex flex-wrap gap-md align-items-center">
          <span class="p-input-icon-left flex-grow-1">
            <i class="pi pi-search"></i>
            <input 
              type="text" 
              pInputText 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onSearch()"
              placeholder="Search by student or certificate number..." 
              class="w-full">
          </span>
          <p-select 
            [options]="courseOptions" 
            [(ngModel)]="selectedCourse" 
            placeholder="All Courses"
            styleClass="w-full md:w-15rem">
          </p-select>
        </div>
      </div>

      <!-- Certificates Table -->
      <div class="table-container glass-panel surface-raised">
        <p-table 
          [value]="filteredCertificates()" 
          [loading]="loading()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10,25,50]">
          
          <ng-template pTemplate="header">
            <tr>
              <th>Certificate #</th>
              <th>Student</th>
              <th>Course</th>
              <th>Issue Date</th>
              <th>Score</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          
          <ng-template pTemplate="body" let-cert>
            <tr>
              <td>
                <span class="font-mono text-primary font-bold">{{ cert.certificateNumber }}</span>
              </td>
              <td>{{ cert.studentName }}</td>
              <td>{{ cert.courseName }}</td>
              <td>{{ cert.issueDate | date:'mediumDate' }}</td>
              <td>
                @if (cert.percentage) {
                  <span class="font-bold" [class.text-success]="cert.percentage >= 70">
                    {{ cert.percentage }}%
                  </span>
                } @else {
                  <span class="text-tertiary">-</span>
                }
              </td>
              <td>
                <p-tag 
                  [severity]="cert.isValid ? 'success' : 'danger'" 
                  [value]="cert.isValid ? 'Valid' : 'Revoked'">
                </p-tag>
              </td>
              <td>
                <div class="flex gap-sm">
                  <p-button 
                    icon="pi pi-eye" 
                    severity="info" 
                    [text]="true" 
                    [rounded]="true"
                    [routerLink]="['/certificates/instructor', cert._id]"
                    pTooltip="View">
                  </p-button>
                  <p-button 
                    icon="pi pi-download" 
                    severity="success" 
                    [text]="true" 
                    [rounded]="true"
                    (onClick)="downloadPDF(cert._id)"
                    pTooltip="Download PDF">
                  </p-button>
                </div>
              </td>
            </tr>
          </ng-template>
          
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="text-center p-5xl">
                <i class="pi pi-inbox text-4xl text-tertiary mb-lg"></i>
                <p class="text-secondary m-0">No certificates issued yet</p>
                <p-button 
                  label="Issue First Certificate" 
                  icon="pi pi-plus" 
                  [routerLink]="['/certificates/instructor/issue']"
                  class="mt-lg">
                </p-button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/mixins' as *;

    .instructor-certificates {
      padding: var(--spacing-xl) var(--spacing-md);
      max-width: 1400px;
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

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
      
      @include sm {
        grid-template-columns: repeat(3, 1fr);
      }
      
      .stat-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        transition: var(--transition-base);
        
        &:hover {
          transform: translateY(-2px);
          border-color: var(--color-primary);
        }
      }
    }

    .table-container {
      overflow: hidden;
      
      ::ng-deep .p-datatable {
        .p-datatable-thead > tr > th {
          background: var(--bg-ternary);
          color: var(--text-tertiary);
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: var(--spacing-lg);
          border-bottom: var(--ui-border-width) solid var(--border-secondary);
        }
        
        .p-datatable-tbody > tr > td {
          padding: var(--spacing-lg);
          border-bottom: var(--ui-border-width) solid var(--border-secondary);
          color: var(--text-secondary);
        }
        
        .p-datatable-tbody > tr:hover {
          background: var(--bg-hover);
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
export class InstructorCertificatesComponent implements OnInit {
  private certificateService = inject(CertificateService);
  private messageService = inject(MessageService);

  certificates = this.certificateService.certificates;
  loading = this.certificateService.loading;

  searchQuery = signal('');
  selectedCourse = signal('');
  
  courseOptions = [
    { label: 'All Courses', value: '' },
    // Add your course list here
  ];

  filteredCertificates = computed(() => {
    let certs = this.certificates();
    const query = this.searchQuery().toLowerCase();
    
    if (query) {
      certs = certs.filter(c => 
        c.studentName.toLowerCase().includes(query) ||
        c.certificateNumber.toLowerCase().includes(query)
      );
    }
    
    if (this.selectedCourse()) {
      certs = certs.filter(c => c.courseName === this.selectedCourse());
    }
    
    return certs;
  });

  stats = computed(() => {
    const certs = this.certificates();
    const validCerts = certs.filter(c => c.isValid);
    
    return {
      total: validCerts.length,
      students: new Set(validCerts.map(c => c.student)).size,
      avgScore: validCerts.reduce((acc, c) => acc + (c.percentage || 0), 0) / (validCerts.length || 1)
    };
  });

  ngOnInit(): void {
    this.loadCertificates();
  }

  private loadCertificates(): void {
    this.certificateService.getAllCertificates().subscribe();
  }

  onSearch(): void {
    // Trigger computed update
  }

  downloadPDF(id: string): void {
    this.certificateService.downloadCertificatePDF(id);
    this.messageService.add({
      severity: 'info',
      summary: 'Download Started',
      detail: 'Certificate PDF is being generated...'
    });
  }

  exportData(): void {
    // Implement CSV export
    this.messageService.add({
      severity: 'success',
      summary: 'Export Started',
      detail: 'Your report will be downloaded shortly'
    });
  }
}