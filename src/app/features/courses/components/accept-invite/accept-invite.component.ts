import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CourseService } from '../../../../core/services/course.service';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterModule],
  template: `
    <div class="invite-landing-wrap">
      <div class="invite-card">
        <div class="icon-circle">
          <i class="pi pi-users text-3xl"></i>
        </div>

        <h2 class="title">Instructor Invitation</h2>
        
        @if(loading()) {
          <p class="subtitle">Processing your invitation securely...</p>
          <i class="pi pi-spin pi-spinner" style="font-size: var(--font-size-3xl); color: var(--color-primary);"></i>
        } @else if(success()) {
          <p class="subtitle" style="color: var(--color-success);">Success! You have been added as an instructor.</p>
          <p-button label="Go to Dashboard" icon="pi pi-arrow-right" [routerLink]="['/instructor/dashboard']" styleClass="w-full mt-4"></p-button>
        } @else {
          <p class="subtitle" style="color: var(--color-error);">{{ errorMessage() }}</p>
          <p-button label="Return to Home" [text]="true" [routerLink]="['/']" styleClass="w-full mt-4"></p-button>
        }
      </div>
    </div>
  `,
  styles: [`
    .invite-landing-wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-secondary);
      padding: var(--spacing-xl);
    }
    .invite-card {
      max-width: 450px;
      width: 100%;
      background: var(--bg-primary);
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-xl);
      padding: var(--spacing-4xl);
      text-align: center;
      border: var(--ui-border-width) solid var(--border-secondary);
    }
    .icon-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background-color: var(--color-primary-bg);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--spacing-2xl) auto;
    }
    .title {
      font-family: var(--font-heading);
      font-size: var(--font-size-2xl);
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
    }
    .subtitle {
      font-family: var(--font-body);
      font-size: var(--font-size-base);
      color: var(--text-secondary);
      margin-bottom: var(--spacing-2xl);
    }
    .mt-4 { margin-top: var(--spacing-xl); }
  `]
})
export class AcceptInviteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);

  loading = signal(true);
  success = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    
    if (!token) {
      this.errorMessage.set('Invalid invitation link. No token provided.');
      this.loading.set(false);
      return;
    }

    // Call acceptInvitation exactly as defined in your course.service.ts
    this.courseService.acceptInvitation({ token }).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'This invitation has expired or is invalid.');
        this.loading.set(false);
      }
    });
  }
}