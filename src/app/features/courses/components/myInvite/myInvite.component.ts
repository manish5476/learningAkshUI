import { Component, OnInit, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card'; // <-- Added CardModule
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CourseService } from '../../../../core/services/course.service';
import { AppMessageService } from '../../../../core/utils/message.service';

@Component({
  selector: 'app-my-invitations-widget',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule, CardModule], // <-- Added CardModule here
  providers: [MessageService],
  template: `
    @if(myInvitations().length > 0) {
      <div class="invites-wrapper">
        <h4 class="invites-header">Course Invitations</h4>
        
        <div class="invites-list">
          @for(inv of myInvitations(); track inv._id) {
            <p-card styleClass="invite-card">
              <div class="invite-content">
                
                <div class="invite-thumbnail">
                  <img *ngIf="inv.course?.thumbnail" [src]="inv.course.thumbnail" alt="Course">
                  <i *ngIf="!inv.course?.thumbnail" class="pi pi-book"></i>
                </div>
                
                <div class="invite-details">
                  <p class="course-title" [title]="inv.course?.title">{{ inv.course?.title || 'Unknown Course' }}</p>
                  <p class="inviter-info">
                    Invited as <span class="role-badge">{{ inv.role }}</span>
                  </p>
                </div>

              </div>
              
              <ng-template pTemplate="footer">
                <p-button 
                  label="Accept Invitation" 
                  icon="pi pi-check" 
                  size="small" 
                  styleClass="accept-btn" 
                  [loading]="isProcessing() === inv._id" 
                  (onClick)="accept(inv)">
                </p-button>
              </ng-template>
            </p-card>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .invites-wrapper {
      margin-bottom: var(--spacing-lg);
    }

    .invites-header {
      font-family: var(--font-heading);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 var(--spacing-sm) 0;
      padding-bottom: var(--spacing-xs);
      border-bottom: var(--ui-border-width) solid var(--component-divider);
    }

    .invites-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    /* Target the PrimeNG Card to fit beautifully inside the notification popover */
    ::ng-deep .invite-card {
      background: var(--component-surface-raised);
      border: var(--ui-border-width) solid var(--color-primary-border);
      border-radius: var(--ui-border-radius-lg);
      box-shadow: var(--shadow-xs);
      transition: var(--transition-base);
      overflow: hidden;

      &:hover {
        background: var(--color-primary-bg); /* subtle theme accent background */
        border-color: var(--color-primary);
        box-shadow: var(--shadow-sm);
      }

      .p-card-body {
        padding: var(--spacing-md);
      }

      .p-card-content {
        padding: 0;
      }

      .p-card-footer {
        padding: var(--spacing-sm) 0 0 0;
        margin: 0;
      }
    }

    .invite-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .invite-thumbnail {
      width: clamp(36px, 4vw, 44px);
      height: clamp(36px, 4vw, 44px);
      flex-shrink: 0;
      border-radius: var(--ui-border-radius);
      background-color: var(--bg-ternary);
      display: flex;
      align-items: center;
      justify-content: center;
      border: var(--ui-border-width) solid var(--border-secondary);
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      i {
        color: var(--text-tertiary);
        font-size: var(--font-size-lg);
      }
    }

    .invite-details {
      min-width: 0; /* crucial for text truncation */
      flex: 1;
    }

    .course-title {
      font-family: var(--font-heading);
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xs) 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .inviter-info {
      font-family: var(--font-body);
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      margin: 0;
    }

    .role-badge {
      font-weight: var(--font-weight-bold);
      color: var(--color-primary);
      text-transform: capitalize;
    }

    ::ng-deep .accept-btn {
      width: 100%;
      font-family: var(--font-body);
      font-size: var(--font-size-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--ui-border-radius);
      transition: var(--transition-fast);
    }
  `]
})
export class MyInvitationsWidgetComponent implements OnInit {
  private courseService = inject(CourseService);
  private messageService = inject(AppMessageService);

  invitationCount = output<number>();
  myInvitations = signal<any[]>([]);
  isProcessing = signal<string | null>(null);

  ngOnInit() {
    this.loadMyInvitations();
  }

  loadMyInvitations() {
    this.courseService.getMyPendingInvitations().subscribe({
      next: (res: any) => {
        const invites = res?.data || [];
        this.myInvitations.set(invites);
        this.invitationCount.emit(invites.length); 
      }
    });
  }

  accept(invitation: any) {
    this.isProcessing.set(invitation._id);
    this.courseService.acceptInvitation({ token: invitation.token }).subscribe({
      next: () => {
        this.messageService.showSuccess(`You are now an instructor for ${invitation.course?.title}!`);
        this.isProcessing.set(null);
        this.loadMyInvitations(); 
      },
      error: (err) => {
        this.messageService.showError(err?.error?.message || 'Failed to accept invitation');
        this.isProcessing.set(null);
      }
    });
  }
}