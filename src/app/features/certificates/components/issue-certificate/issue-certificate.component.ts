import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
// import { datepickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-issue-certificate',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="issue-certificate fade-in">
      <p-toast position="top-right"></p-toast>

      <div class="max-w-800 mx-auto">
        <!-- Header -->
        <div class="header-section mb-4xl">
          <a [routerLink]="backLink()" class="text-tertiary hover:text-primary transition-base mb-md inline-block">
            <i class="pi pi-arrow-left mr-sm"></i> Back
          </a>
          <h1 class="font-heading text-3xl text-primary font-bold m-0 mb-sm">Issue Certificate</h1>
          <p class="text-secondary text-md m-0">Create and issue a new certificate to a student</p>
        </div>

        <!-- Form -->
        <form [formGroup]="certificateForm" (ngSubmit)="onSubmit()" class="glass-panel surface-raised p-4xl">
          
          <!-- Student Info -->
          <div class="form-section mb-4xl">
            <h3 class="font-heading text-xl text-primary font-bold mb-xl">Student Information</h3>
            
            <div class="form-grid">
              <div class="form-group col-span-full">
                <label class="text-primary font-bold text-sm mb-md block">Student Name *</label>
                <input 
                  type="text" 
                  pInputText 
                  formControlName="studentName"
                  placeholder="Full name of student"
                  class="w-full"
                  [class.ng-invalid]="isFieldInvalid('studentName')">
              </div>

              <div class="form-group col-span-full">
                <label class="text-primary font-bold text-sm mb-md block">Student Email *</label>
                <input 
                  type="email" 
                  pInputText 
                  formControlName="studentEmail"
                  placeholder="student@example.com"
                  class="w-full"
                  [class.ng-invalid]="isFieldInvalid('studentEmail')">
              </div>
            </div>
          </div>

          <!-- Course Info -->
          <div class="form-section mb-4xl">
            <h3 class="font-heading text-xl text-primary font-bold mb-xl">Course Details</h3>
            
            <div class="form-grid">
              <div class="form-group col-span-full">
                <label class="text-primary font-bold text-sm mb-md block">Course Name *</label>
                <input 
                  type="text" 
                  pInputText 
                  formControlName="courseName"
                  placeholder="Name of the course"
                  class="w-full"
                  [class.ng-invalid]="isFieldInvalid('courseName')">
              </div>

              <div class="form-group">
                <label class="text-primary font-bold text-sm mb-md block">Grade</label>
                <input 
                  type="text" 
                  pInputText 
                  formControlName="grade"
                  placeholder="e.g., A, B+, Pass"
                  class="w-full">
              </div>

              <div class="form-group">
                <label class="text-primary font-bold text-sm mb-md block">Percentage Score</label>
                <p-inputNumber 
                  formControlName="percentage"
                  [min]="0"
                  [max]="100"
                  [showButtons]="true"
                  [minFractionDigits]="0"
                  styleClass="w-full">
                </p-inputNumber>
              </div>
            </div>
          </div>

          <!-- Certificate Details -->
          <div class="form-section mb-4xl">
            <h3 class="font-heading text-xl text-primary font-bold mb-xl">Certificate Settings</h3>
            
            <div class="form-grid">
              <div class="form-group">
                <label class="text-primary font-bold text-sm mb-md block">Issue Date *</label>
                <p-datepicker 
                  formControlName="issueDate"
                  [showIcon]="true"
                  [showButtonBar]="true"
                  styleClass="w-full"
                  inputStyleClass="w-full">
                </p-datepicker>
              </div>

              <div class="form-group">
                <label class="text-primary font-bold text-sm mb-md block">Expiry Date</label>
                <p-datepicker 
                  formControlName="expiryDate"
                  [showIcon]="true"
                  [showButtonBar]="true"
                  styleClass="w-full"
                  inputStyleClass="w-full">
                </p-datepicker>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="form-actions flex justify-content-end gap-lg pt-xl border-top-subtle">
            <p-button 
              label="Cancel" 
              severity="secondary" 
              [outlined]="true"
              [routerLink]="backLink()">
            </p-button>
            <p-button 
              type="submit"
              label="Issue Certificate" 
              icon="pi pi-check"
              severity="success"
              [disabled]="certificateForm.invalid || isSubmitting()">
            </p-button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../../../styles/mixins' as *;

    .issue-certificate {
      padding: var(--spacing-xl) var(--spacing-md);
      min-height: 100dvh;
      
      @include lg { padding: var(--spacing-3xl) var(--spacing-2xl); }
    }

    .max-w-800 {
      max-width: 800px;
      margin: 0 auto;
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

    .form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-xl);
      
      @include md {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .col-span-full {
      grid-column: 1 / -1;
    }

    .form-group {
      ::ng-deep {
        .p-inputtext, .p-inputnumber, .p-datepicker {
          width: 100%;
        }
        
        .p-datepicker .p-inputtext {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
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
export class IssueCertificateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);

  certificateForm!: FormGroup;
  isSubmitting = signal(false);

  backLink = signal('/certificates/admin');

  ngOnInit(): void {
    this.initForm();
    
    // Check if courseId and studentId are in route params
    const courseId = this.route.snapshot.paramMap.get('courseId');
    const studentId = this.route.snapshot.paramMap.get('studentId');
    
    if (courseId && studentId) {
      this.loadStudentAndCourseData(courseId, studentId);
    }
    
    // Set back link based on user role
    const url = this.route.snapshot.url.join('/');
    if (url.includes('instructor')) {
      this.backLink.set('/certificates/instructor/certificates');
    }
  }

  private initForm(): void {
    this.certificateForm = this.fb.group({
      studentName: ['', Validators.required],
      studentEmail: ['', [Validators.required, Validators.email]],
      courseName: ['', Validators.required],
      grade: [''],
      percentage: [null],
      issueDate: [new Date(), Validators.required],
      expiryDate: [null]
    });
  }

  private loadStudentAndCourseData(courseId: string, studentId: string): void {
    // Implement API call to fetch student and course data
    // this.courseService.getCourse(courseId).subscribe(...)
    // this.userService.getUser(studentId).subscribe(...)
  }

  isFieldInvalid(field: string): boolean {
    const control = this.certificateForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  onSubmit(): void {
    if (this.certificateForm.invalid) {
      Object.keys(this.certificateForm.controls).forEach(key => {
        this.certificateForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);
    
    // Implement certificate issuance API call
    // this.certificateService.issueCertificate(this.certificateForm.value).subscribe({
    //   next: (response) => {
    //     this.messageService.add({
    //       severity: 'success',
    //       summary: 'Success',
    //       detail: 'Certificate issued successfully'
    //     });
    //     setTimeout(() => {
    //       this.router.navigate([this.backLink()]);
    //     }, 1500);
    //   },
    //   error: () => {
    //     this.isSubmitting.set(false);
    //     this.messageService.add({
    //       severity: 'error',
    //       summary: 'Error',
    //       detail: 'Failed to issue certificate'
    //     });
    //   }
    // });
  }
}