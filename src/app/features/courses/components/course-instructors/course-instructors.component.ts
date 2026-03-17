import { Component, OnInit, inject, signal, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { CourseService } from '../../../../core/services/course.service';
// IMPORT YOUR USER SERVICE HERE
import { UserService } from '../../../../core/services/user.service'; 
import { AppMessageService } from '../../../../core/utils/message.service';
import { forkJoin } from 'rxjs';
import { Card } from "primeng/card";

@Component({
  selector: 'app-course-instructors',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, SelectModule, CheckboxModule, TagModule, ToastModule, DatePipe,
    Card
],
  providers: [MessageService],
  templateUrl: './course-instructors.component.html',
  styleUrls: ['./course-instructors.component.scss']
})
export class CourseInstructorsComponent implements OnInit {
  courseId = input.required<any>();

  private courseService = inject(CourseService);
  private userService = inject(UserService); // Inject User Service
  private messageService = inject(AppMessageService);

  instructors = signal<any[]>([]);
  invitations = signal<any[]>([]);
  availableInstructors = signal<any[]>([]); // Holds fetched instructors for the dropdown

  loadingInstructors = signal<boolean>(true);
  loadingInvitations = signal<boolean>(true);
  
  showInviteModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  inviteForm:any = signal({
    email: '',
    role: 'co-instructor',
    permissions: this.getDefaultPermissions()
  });

  selectedInstructorId = signal<string | null>(null);

  roleOptions = [
    { label: 'Co-Instructor', value: 'co-instructor' },
    { label: 'Primary Instructor', value: 'instructor' }
  ];

  permissionKeys = [
    { key: 'canEditCourse', label: 'Edit Course' },
    { key: 'canManageSections', label: 'Manage Sections' },
    { key: 'canManageLessons', label: 'Manage Lessons' },
    { key: 'canManageStudents', label: 'Manage Students' },
    { key: 'canViewAnalytics', label: 'View Analytics' },
    { key: 'canGradeAssignments', label: 'Grade Assignments' }
  ];

  ngOnInit(): void {
    this.loadInstructors();
    this.loadInvitations();
    this.loadAvailableInstructors(); // Fetch existing instructors on load
  }

  loadAvailableInstructors(): void {
    // Make separate calls for admins and instructors simultaneously
    forkJoin({
      instructors: this.userService.getAllUsers({ role: 'instructor', limit: 100 }),
      admins: this.userService.getAllUsers({ role: 'admin', limit: 100 }),
      coInstructors: this.userService.getAllUsers({ role: 'co-instructor', limit: 100 })
    }).subscribe({
      next: (res) => {
        // Extract data from all responses
        const instData = res.instructors?.data || [];
        const adminData = res.admins?.data || [];
        const coInstData = res.coInstructors?.data || [];

        // Combine them all into one single array
        const allUsers = [...instData, ...adminData, ...coInstData];

        // Map the combined data
        const users = allUsers.map((u: any) => ({
          label: `${u.firstName} ${u.lastName} (${u.email}) - [${u.role}]`,
          email: u.email
        }));
        
        this.availableInstructors.set(users);
      },
      error: (err) => console.error('Failed to load user list', err)
    });
  }

  // --- 1. FETCH COURSE INSTRUCTORS ---
  loadInstructors(): void {
     if(!this.courseId()){
      this.messageService.showInfo('courseID is missing.')
      return
    }
    this.loadingInstructors.set(true);
    this.courseService.getCourseInstructors(this.courseId()).subscribe({
      next: (res: any) => {
        // Bulletproof array extraction
        let arr = [];
        if (Array.isArray(res)) arr = res;
        else if (Array.isArray(res?.data)) arr = res.data;
        else if (Array.isArray(res?.data?.data)) arr = res.data.data;

        this.instructors.set(arr);
        this.loadingInstructors.set(false);
      },
      error: () => this.loadingInstructors.set(false)
    });
  }

  // --- 2. FETCH PENDING INVITATIONS ---
  loadInvitations(): void {
    if(!this.courseId()){
      this.messageService.showInfo('courseID is missing.')
      return
    }
    this.loadingInvitations.set(true);
    this.courseService.getCourseInvitations(this.courseId()).subscribe({
      next: (res: any) => {
        // Bulletproof array extraction
        let arr = [];
        if (Array.isArray(res)) arr = res;
        else if (Array.isArray(res?.data)) arr = res.data;
        else if (Array.isArray(res?.data?.data)) arr = res.data.data;

        const pending = arr.filter((inv: any) => inv.status === 'pending');
        this.invitations.set(pending);
        this.loadingInvitations.set(false);
      },
      error: () => this.loadingInvitations.set(false)
    });
  }


  openInviteModal(): void {
    this.inviteForm.set({ email: '', role: 'co-instructor', permissions: this.getDefaultPermissions() });
    this.showInviteModal.set(true);
  }

  sendInvitation(): void {
    if (!this.inviteForm().email) return;

    this.isSubmitting.set(true);
    this.courseService.createInvitation(this.courseId(), this.inviteForm()).subscribe({
      next: () => {
        this.messageService.showSuccess('Invitation sent successfully');
        this.showInviteModal.set(false);
        this.isSubmitting.set(false);
        this.loadInvitations(); 
      },
      error: (err) => {
        this.messageService.showError(err?.error?.message || 'Failed to send invitation');
        this.isSubmitting.set(false);
      }
    });
  }

  revokeInvite(invitationId: string): void {
    if (confirm('Revoke this invitation? The link will immediately become invalid.')) {
      this.courseService.revokeInvitation(invitationId).subscribe({
        next: () => {
          this.messageService.showSuccess('Invitation revoked');
          this.loadInvitations();
        },
        error: () => this.messageService.showError('Failed to revoke invitation')
      });
    }
  }

  openEditModal(instructor: any): void {
    this.selectedInstructorId.set(instructor.instructor?._id || instructor._id);
    this.inviteForm.set({
      email: instructor.instructor?.email,
      role: instructor.role,
      permissions: { ...instructor.permissions }
    });
    this.showEditModal.set(true);
  }

  savePermissions(): void {
    const instId = this.selectedInstructorId();
    if (!instId) return;

    this.isSubmitting.set(true);
    const payload = { permissions: this.inviteForm().permissions };

    this.courseService.updateInstructorPermissions(this.courseId(), instId, payload).subscribe({
      next: () => {
        this.messageService.showSuccess('Permissions updated');
        this.showEditModal.set(false);
        this.isSubmitting.set(false);
        this.loadInstructors();
      },
      error: () => {
        this.messageService.showError('Failed to update permissions');
        this.isSubmitting.set(false);
      }
    });
  }

  removeInstructor(instructorId: string): void {
    if (confirm('Remove this instructor? They will lose all access to the course.')) {
      this.courseService.removeInstructor(this.courseId(), instructorId).subscribe({
        next: () => {
          this.messageService.showSuccess('Instructor removed');
          this.loadInstructors();
        },
        error: () => this.messageService.showError('Failed to remove instructor')
      });
    }
  }

  private getDefaultPermissions() {
    return {
      canEditCourse: false,
      canManageSections: true,
      canManageLessons: true,
      canManageStudents: false,
      canViewAnalytics: true,
      canGradeAssignments: false
    };
  }
}