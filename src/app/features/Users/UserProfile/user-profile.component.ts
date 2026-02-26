import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { finalize } from 'rxjs/operators';
import { User } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

/**
 * SINGLE FILE: USER PROFILE & SETTINGS COMPONENTS
 * Preserves Compact Grid (Spacing) and Refined Typography Scale.
 */

@Component({
  selector: 'app-user-profile-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-wrapper">
      <header class="settings-header">
        <div class="user-meta">
          <img [src]="user?.profilePicture || 'assets/default.png'" class="avatar" />
          <div>
            <h1 class="font-heading">{{ user?.firstName }} {{ user?.lastName }}</h1>
            <span class="badge badge-primary">{{ user?.role }}</span>
          </div>
        </div>
        <div class="actions">
          <button (click)="isEditing = !isEditing" class="btn btn-secondary">
            {{ isEditing ? 'View Profile' : 'Edit Profile' }}
          </button>
        </div>
      </header>

      <hr class="divider">

      <section *ngIf="!isEditing && !loading" class="view-mode fade-in">
        <div class="info-grid">
          <div class="info-card">
            <label>Email Address</label>
            <p>{{ user?.email }}</p>
          </div>
          <div class="info-card">
            <label>Phone Number</label>
            <p>{{ user?.phoneNumber || 'Not Linked' }}</p>
          </div>
        </div>

        <div class="role-specific-data" *ngIf="profile">
          <h3 class="font-heading">About</h3>
          <p>{{ profile.bio || 'No bio provided' }}</p>
          
          <label class="mt-md">Interests / Expertise</label>
          <div class="tag-cloud">
            <span *ngFor="let item of (profile.expertise || profile.interests)" class="tag">
              {{ item }}
            </span>
          </div>
        </div>
      </section>

      <form *ngIf="isEditing" [formGroup]="profileForm" (ngSubmit)="onUpdate()" class="edit-form">
        <div class="form-grid">
          <div class="form-group">
            <label>First Name</label>
            <input formControlName="firstName" class="form-input">
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input formControlName="lastName" class="form-input">
          </div>
          <div class="form-group full-width">
            <label>Email (Cannot Change)</label>
            <input formControlName="email" class="form-input readonly" readonly>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" [disabled]="profileForm.invalid || saving" class="btn btn-primary">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>

      <section class="danger-zone">
        <h4 class="color-error">Danger Zone</h4>
        <p class="text-tertiary">Once you delete your account, there is no going back.</p>
        <button (click)="onDeleteAccount()" class="btn btn-outline-error">Delete Account</button>
      </section>
    </div>
  `,
  styles: [`
    /* Using Canonical Mappings from your Mixin */
    .profile-wrapper {
      max-width: 700px;
      margin: var(--spacing-4xl) auto;
      padding: var(--spacing-2xl);
      background: var(--bg-primary);
      border-radius: var(--ui-border-radius-lg);
      border: var(--ui-border-width) solid var(--border-secondary);
      box-shadow: var(--shadow-md);
    }

    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl);

      .user-meta {
        display: flex;
        align-items: center;
        gap: var(--spacing-lg);
        
        .avatar {
          width: 52px;
          height: 52px;
          border-radius: var(--ui-border-radius-xl);
          border: var(--ui-border-width-lg) solid var(--accent-primary);
        }

        h1 {
          font-size: var(--font-size-2xl);
          margin: 0;
          color: var(--text-primary);
        }
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-2xl);
    }

    .info-card {
      padding: var(--spacing-md);
      background: var(--bg-secondary);
      border-radius: var(--ui-border-radius);

      label {
        font-size: var(--font-size-xs);
        color: var(--text-label);
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
      }

      p {
        margin-top: var(--spacing-xs);
        font-size: var(--font-size-sm);
        color: var(--text-primary);
      }
    }

    /* Form Styles using Tokens */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
      
      .full-width { grid-column: span 2; }
    }

    .form-group {
      margin-bottom: var(--spacing-md);
      
      label {
        display: block;
        font-size: var(--font-size-xs);
        margin-bottom: var(--spacing-xs);
        color: var(--text-secondary);
      }

      .form-input {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        border: var(--ui-border-width) solid var(--border-primary);
        border-radius: var(--ui-border-radius-sm);
        font-size: var(--font-size-sm);
        background: var(--bg-secondary);
        transition: var(--transition-fast);

        &:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color);
        }

        &.readonly { opacity: var(--state-readonly-opacity); cursor: not-allowed; }
      }
    }

    /* Buttons & Badges */
    .btn {
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--ui-border-radius-sm);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: var(--transition-base);
      border: var(--ui-border-width) solid transparent;

      &-primary { background: var(--accent-primary); color: white; }
      &-secondary { background: var(--bg-ternary); color: var(--text-primary); }
      &-outline-error { 
        border-color: var(--color-error); 
        color: var(--color-error); 
        background: transparent;
        &:hover { background: var(--color-error-bg); }
      }
    }

    .badge {
      font-size: var(--font-size-xs);
      padding: 2px 6px;
      border-radius: var(--ui-border-radius-sm);
      &-primary { background: var(--color-primary-bg); color: var(--accent-primary); }
    }

    .danger-zone {
      margin-top: var(--spacing-4xl);
      padding-top: var(--spacing-xl);
      border-top: var(--ui-border-width) dashed var(--color-error-border);
    }
  `]
})
export class UserProfileManagerComponent implements OnInit {
  user: any
  profile: any = null;
  loading = true;
  saving = false;
  isEditing = false;
  profileForm!: FormGroup;

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.fetchData();
  }

  private initForm() {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      phoneNumber: ['']
    });
  }

  fetchData() {
    this.userService.getUserProfile()
      .pipe(finalize(() => this.loading = false))
      .subscribe(res => {
        const data = res.data?.profile;
        this.profile = data;
        this.user = data // Handle populating differences
        if (this.user) {
          this.profileForm.patchValue(this.user);
        }
      });
  }

  onUpdate() {
    if (this.profileForm.invalid) return;
    this.saving = true;
    
    this.userService.updateMe(this.profileForm.getRawValue())
      .pipe(finalize(() => this.saving = false))
      .subscribe(() => {
        this.isEditing = false;
        this.fetchData();
      });
  }

  onDeleteAccount() {
    if (confirm('Are you sure you want to deactivate your account?')) {
      this.userService.deleteMe().subscribe(() => {
        // Handle Logout Logic here
        alert('Account deleted successfully');
      });
    }
  }
}

// import { Component, OnInit } from '@angular/core';
// import { UserService } from '../../../core/services/user.service';

// @Component({
//   selector: 'app-user-profile',
//   templateUrl: './user-profile.component.html',
//   styleUrls: ['./user-profile.component.scss']
// })
// export class UserProfileComponent implements OnInit {
//   profileData: any; // Unified profile (User + Role specific data)
//   loading = true;

//   constructor(private userService: UserService) {}

//   ngOnInit(): void {
//     this.loadProfile();
//   }

//   loadProfile() {
//     this.userService.getUserProfile().subscribe({
//       next: (res) => {
//         this.profileData = res.data?.profile;
//         this.loading = false;
//       },
//       error: (err) => {
//         console.error('Failed to load profile', err);
//         this.loading = false;
//       }
//     });
//   }
// }