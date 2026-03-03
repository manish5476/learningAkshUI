import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CertificateService } from '../../../../core/services/certificate.service';

@Component({
  selector: 'app-certificate-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    ChartModule,
    TableModule,
    TagModule
  ],
  template: `
    <div class="dashboard-container fade-in">
      
      <!-- Header -->
      <div class="dashboard-header flex-between flex-wrap gap-lg mb-4xl">
        <div>
          <h1 class="font-heading text-3xl md:text-4xl text-primary font-bold m-0 mb-sm">Certificate Dashboard</h1>
          <p class="text-secondary text-md m-0">Overview of all certificates and verification stats</p>
        </div>
        <div class="header-actions flex gap-md">
          <p-button 
            label="View All" 
            icon="pi pi-list" 
            [routerLink]="['/certificates/admin']"
            severity="secondary">
          </p-button>
          <p-button 
            label="Export Report" 
            icon="pi pi-download" 
            severity="success"
            (onClick)="exportReport()">
          </p-button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid mb-4xl">
        <div class="stat-card glass-panel surface-raised">
          <div class="stat-icon bg-primary-light text-primary">
            <i class="pi pi-certificate"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label">Total Issued</p>
            <p class="stat-value">{{ stats().total }}</p>
          </div>
        </div>
        
        <div class="stat-card glass-panel surface-raised">
          <div class="stat-icon bg-success-light text-success">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label">Valid</p>
            <p class="stat-value">{{ stats().valid }}</p>
          </div>
        </div>
        
        <div class="stat-card glass-panel surface-raised">
          <div class="stat-icon bg-warning-light text-warning">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label">Expiring Soon</p>
            <p class="stat-value">{{ stats().expiringSoon }}</p>
          </div>
        </div>
        
        <div class="stat-card glass-panel surface-raised">
          <div class="stat-icon bg-error-light text-error">
            <i class="pi pi-times-circle"></i>
          </div>
          <div class="stat-content">
            <p class="stat-label">Revoked</p>
            <p class="stat-value">{{ stats().revoked }}</p>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="charts-grid mb-4xl">
        <div class="chart-card glass-panel surface-raised p-xl">
          <h3 class="font-heading text-xl text-primary font-bold mb-xl">Issuance Trend</h3>
          <p-chart type="line" [data]="trendChartData" [options]="chartOptions"></p-chart>
        </div>
        
        <div class="chart-card glass-panel surface-raised p-xl">
          <h3 class="font-heading text-xl text-primary font-bold mb-xl">Status Distribution</h3>
          <p-chart type="doughnut" [data]="statusChartData" [options]="chartOptions"></p-chart>
        </div>
      </div>

      <!-- Recent Certificates -->
      <div class="recent-section glass-panel surface-raised p-xl">
        <div class="section-header flex-between mb-xl">
          <h3 class="font-heading text-xl text-primary font-bold m-0">Recent Certificates</h3>
          <a [routerLink]="['/certificates/admin']" class="text-info hover:text-primary transition-base">
            View All <i class="pi pi-arrow-right ml-xs"></i>
          </a>
        </div>

        <p-table [value]="recentCertificates()" [loading]="loading()">
          <ng-template pTemplate="header">
            <tr>
              <th>Certificate #</th>
              <th>Student</th>
              <th>Course</th>
              <th>Issue Date</th>
              <th>Status</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-cert>
            <tr class="cursor-pointer hover-bg-secondary" [routerLink]="['/certificates/admin', cert._id]">
              <td><span class="font-mono">{{ cert.certificateNumber }}</span></td>
              <td>{{ cert.studentName }}</td>
              <td>{{ cert.courseName }}</td>
              <td>{{ cert.issueDate | date:'mediumDate' }}</td>
              <td>
                <p-tag 
                  [severity]="cert.isValid ? 'success' : 'danger'" 
                  [value]="cert.isValid ? 'Valid' : 'Revoked'">
                </p-tag>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" class="text-center p-4xl">
                <i class="pi pi-inbox text-3xl text-tertiary mb-md"></i>
                <p class="text-secondary m-0">No certificates found</p>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/mixins' as *;

    .dashboard-container {
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
        grid-template-columns: repeat(2, 1fr);
      }
      
      @include lg {
        grid-template-columns: repeat(4, 1fr);
      }
      
      .stat-card {
        padding: var(--spacing-2xl);
        display: flex;
        align-items: center;
        gap: var(--spacing-xl);
        transition: var(--transition-base);
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-xl);
        }
        
        .stat-icon {
          width: clamp(48px, 8vw, 64px);
          aspect-ratio: 1;
          border-radius: var(--ui-border-radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-2xl);
          
          &.bg-primary-light { background: var(--color-primary-bg); }
          &.bg-success-light { background: var(--color-success-bg); }
          &.bg-warning-light { background: var(--color-warning-bg); }
          &.bg-error-light { background: var(--color-error-bg); }
        }
        
        .stat-label {
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-tertiary);
          font-weight: var(--font-weight-bold);
          margin: 0 0 var(--spacing-xs) 0;
        }
        
        .stat-value {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin: 0;
          line-height: 1;
        }
      }
    }

    .charts-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-xl);
      
      @include lg {
        grid-template-columns: 1fr 1fr;
      }
      
      .chart-card {
        min-height: 350px;
      }
    }

    .recent-section {
      ::ng-deep .p-table {
        .p-datatable-wrapper {
          border-radius: var(--ui-border-radius-lg);
        }
        
        th {
          background: var(--bg-ternary);
          color: var(--text-tertiary);
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: var(--spacing-lg);
        }
        
        td {
          padding: var(--spacing-lg);
          color: var(--text-secondary);
          border-bottom: var(--ui-border-width) solid var(--border-secondary);
        }
        
        tr:hover td {
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
export class CertificateDashboardComponent implements OnInit {
  private certificateService = inject(CertificateService);

  certificates = this.certificateService.certificates;
  loading = this.certificateService.loading;

  recentCertificates = computed(() => this.certificates().slice(0, 5));

  stats = computed(() => {
    const certs = this.certificates();
    return {
      total: certs.length,
      valid: certs.filter(c => c.isValid).length,
      revoked: certs.filter(c => !c.isValid).length,
      expiringSoon: certs.filter(c => {
        if (!c.expiryDate) return false;
        const daysUntilExpiry = Math.ceil((new Date(c.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return c.isValid && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length
    };
  });

  trendChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Certificates Issued',
        data: [65, 59, 80, 81, 56, 95],
        borderColor: 'var(--color-primary)',
        backgroundColor: 'var(--color-primary-bg)',
        tension: 0.4
      }
    ]
  };

  statusChartData = {
    labels: ['Valid', 'Revoked', 'Expiring Soon'],
    datasets: [
      {
        data: [65, 12, 8],
        backgroundColor: [
          'var(--color-success)',
          'var(--color-error)',
          'var(--color-warning)'
        ],
        hoverOffset: 4
      }
    ]
  };

  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'var(--text-secondary)'
        }
      }
    }
  };

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.certificateService.getAllCertificates({
      sort: '-createdAt',
      limit: 100
    }).subscribe();
  }

  exportReport(): void {
    // Generate CSV report
    const data = this.certificates();
    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  private convertToCSV(certificates: any[]): string {
    const headers = ['Certificate Number', 'Student', 'Course', 'Issue Date', 'Grade', 'Percentage', 'Status'];
    const rows = certificates.map(c => [
      c.certificateNumber,
      c.studentName,
      c.courseName,
      new Date(c.issueDate).toLocaleDateString(),
      c.grade || 'N/A',
      c.percentage || 'N/A',
      c.isValid ? 'Valid' : 'Revoked'
    ]);
    
    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }
}