import { Component, inject, DestroyRef, signal, effect, input, output, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TabsModule } from 'primeng/tabs';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox'; // Replaced ToggleSwitch with Checkbox for better form alignment

// Services
import { LessonService } from '../../../../core/services/lesson.service';

@Component({
  selector: 'app-lesson-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    CheckboxModule,
    InputNumberModule,
    TabsModule
  ],
  templateUrl: './lesson-form.component.html',
  styleUrls: ['./lesson-form.component.scss']
})
export class LessonFormComponent implements OnInit {
  // Modern Signal Inputs/Outputs
  sectionId = input.required<string>();
  courseId = input.required<string>();
  lessonId = input<string | null>(null);
  
  saved = output<any>();
  cancelled = output<void>();

  // Injectors
  private fb = inject(FormBuilder);
  private lessonService = inject(LessonService);
  private destroyRef = inject(DestroyRef);

  // Reactive State
  isLoading = signal<boolean>(false);

  // Configuration Constants
  lessonTypes = [
    { label: 'Video', value: 'video', icon: 'pi pi-video' },
    { label: 'Article', value: 'article', icon: 'pi pi-file' },
    { label: 'Quiz', value: 'quiz', icon: 'pi pi-question-circle' },
    { label: 'Assignment', value: 'assignment', icon: 'pi pi-pencil' },
    { label: 'Coding Exercise', value: 'coding-exercise', icon: 'pi pi-code' }
  ];

  videoProviders = [
    { label: 'YouTube', value: 'youtube' },
    { label: 'Vimeo', value: 'vimeo' },
    { label: 'Wistia', value: 'wistia' },
    { label: 'Local', value: 'local' }
  ];

  resourceTypes = [
    { label: 'PDF Document', value: 'pdf' },
    { label: 'Source Code', value: 'code' },
    { label: 'External Link', value: 'link' },
    { label: 'Image', value: 'image' }
  ];

  // Initialize Form
  lessonForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    type: ['video', Validators.required],
    duration: [0],
    isPublished: [true],
    isFree: [false],
    // Video fields
    videoUrl: [''],
    videoProvider: ['youtube'],
    videoDuration: [0],
    videoThumbnail: [''],
    // Article fields
    articleBody: [''],
    // Quiz fields
    quizId: [''],
    // Resources
    resources: this.fb.array([])
  });

  constructor() {
    // React to lessonId changes (e.g., when modal opens for edit vs create)
    effect(() => {
      const id = this.lessonId();
      if (id) {
        this.loadLesson(id);
      } else {
        this.resetForm();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {}

  private resetForm(): void {
    this.lessonForm.reset({
      type: 'video',
      videoProvider: 'youtube',
      duration: 0,
      videoDuration: 0,
      isPublished: true,
      isFree: false
    });
    this.resources.clear();
  }

  private loadLesson(id: string): void {
    this.isLoading.set(true);
    this.lessonService.getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const lesson = res.data?.lesson || res.data;
          if (lesson) {
            this.patchForm(lesson);
          }
          this.isLoading.set(false);
        },
        error: (error: any) => {
          console.error('Failed to load lesson', error);
          this.isLoading.set(false);
        }
      });
  }

  private patchForm(lesson: any): void {
    this.resources.clear();

    this.lessonForm.patchValue({
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      duration: lesson.duration,
      isPublished: lesson.isPublished,
      isFree: lesson.isFree
    });

    if (lesson.content) {
      if (lesson.type === 'video' && lesson.content.video) {
        this.lessonForm.patchValue({
          videoUrl: lesson.content.video.url,
          videoProvider: lesson.content.video.provider,
          videoDuration: lesson.content.video.duration,
          videoThumbnail: lesson.content.video.thumbnail
        });
      } else if (lesson.type === 'article' && lesson.content.article) {
        this.lessonForm.patchValue({ articleBody: lesson.content.article.body });
      } else if (lesson.type === 'quiz' && lesson.content.quiz) {
        this.lessonForm.patchValue({ quizId: lesson.content.quiz });
      }
    }

    if (lesson.resources?.length) {
      lesson.resources.forEach((res: any) => {
        this.resources.push(this.fb.group({
          title: [res.title, Validators.required],
          type: [res.type, Validators.required],
          url: [res.url, Validators.required]
        }));
      });
    }
  }

  get resources(): FormArray {
    return this.lessonForm.get('resources') as FormArray;
  }

  onTypeChange(event: any): void {
    // Clear specific fields when switching types to avoid dirty data payload
    this.lessonForm.patchValue({
      videoUrl: '', videoDuration: 0, videoThumbnail: '', articleBody: '', quizId: ''
    });
  }

  addResource(): void {
    this.resources.push(this.fb.group({
      title: ['', Validators.required],
      type: ['link', Validators.required],
      url: ['', Validators.required]
    }));
  }

  removeResource(index: number): void {
    this.resources.removeAt(index);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.lessonForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  isResourceInvalid(index: number, fieldName: string): boolean {
    const field = this.resources.at(index).get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  onSubmit(): void {
    if (this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formData = this.lessonForm.getRawValue();

    // Construct backend-compliant payload
    const content: any = {};
    if (formData.type === 'video') {
      content.video = {
        url: formData.videoUrl,
        provider: formData.videoProvider,
        duration: formData.videoDuration,
        thumbnail: formData.videoThumbnail
      };
    } else if (formData.type === 'article') {
      content.article = { body: formData.articleBody };
    } else if (formData.type === 'quiz') {
      content.quiz = formData.quizId;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      duration: formData.duration,
      isPublished: formData.isPublished,
      isFree: formData.isFree,
      content: content,
      resources: formData.resources,
      section: this.sectionId(),
      course: this.courseId()
    };

    const id = this.lessonId();
    const request$ = (id 
      ? this.lessonService.update(id, payload)
      : this.lessonService.create(payload)) as Observable<any>; // Cast to avoid union type error

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.saved.emit(res.data?.lesson || res.data);
      },
      error: (error: any) => {
        console.error('Failed to save lesson', error);
        this.isLoading.set(false);
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

// // lesson-form.component.ts
// import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { Subscription } from 'rxjs';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { TabsModule } from 'primeng/tabs';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { DividerModule } from 'primeng/divider';
// import { LessonService } from '../../../core/services/lesson.service';
// import { SelectModule } from 'primeng/select';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';

// @Component({
//   selector: 'app-lesson-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     ButtonModule,
//     InputTextModule,
//     SelectModule,
//     ToggleSwitchModule,
//     InputNumberModule,
//     DividerModule,TabsModule
//   ],
//   template: `
//     <form [formGroup]="lessonForm" (ngSubmit)="onSubmit()" class="lesson-form">
// <p-tabs value="0">
//   <p-tablist>
//     <p-tab value="0">
//       <i class="pi pi-info-circle mr-2"></i> Basic Info
//     </p-tab>
//     <p-tab value="1" [disabled]="!lessonForm.get('type')?.value">
//       <i class="pi pi-file mr-2"></i> Content
//     </p-tab>
//     <p-tab value="2">
//       <i class="pi pi-paperclip mr-2"></i> Resources
//     </p-tab>
//   </p-tablist>

//   <p-tabpanels>
    
//     <p-tabpanel value="0">
//       <div class="form-grid">
//         <div class="form-group full-width">
//           <label class="input-label">
//             Lesson Title <span class="required">*</span>
//           </label>
//           <input 
//             pInputText 
//             formControlName="title"
//             placeholder="e.g., Introduction to the Course"
//             class="w-full"
//             [class.ng-invalid]="isFieldInvalid('title')">
//           @if (isFieldInvalid('title')) {
//             <small class="error-message">Title is required</small>
//           }
//         </div>

//         <div class="form-group full-width">
//           <label class="input-label">Description</label>
//           <textarea 
//             pInputTextarea 
//             formControlName="description"
//             placeholder="Describe what this lesson covers..."
//             [rows]="4"
//             class="w-full">
//           </textarea>
//         </div>

//         <div class="form-group">
//           <label class="input-label">Lesson Type <span class="required">*</span></label>
//           <p-select 
//             formControlName="type"
//             [options]="lessonTypes"
//             optionLabel="label"
//             optionValue="value"
//             placeholder="Select lesson type"
//             styleClass="w-full"
//             (onChange)="onTypeChange($event)">
//           </p-select>
//         </div>

//         <div class="form-group">
//           <label class="input-label">Duration (minutes)</label>
//           <p-inputNumber 
//             formControlName="duration"
//             [min]="0"
//             [max]="300"
//             [showButtons]="true"
//             mode="decimal"
//             styleClass="w-full">
//           </p-inputNumber>
//         </div>

//         <div class="form-group">
//           <label class="input-label">Settings</label>
//           <div class="settings-group">
//             <div class="setting-item">
//               <p-inputSwitch formControlName="isPublished"></p-inputSwitch>
//               <span class="ml-2">Published</span>
//             </div>
//             <div class="setting-item">
//               <p-inputSwitch formControlName="isFree"></p-inputSwitch>
//               <span class="ml-2">Free Preview</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </p-tabpanel>

//     <p-tabpanel value="1">
//       @if (lessonForm.get('type')?.value === 'video') {
//         <div class="content-form">
//           <div class="form-group full-width">
//             <label class="input-label">Video URL</label>
//             <input 
//               pInputText 
//               formControlName="videoUrl"
//               placeholder="https://www.youtube.com/watch?v=..."
//               class="w-full">
//           </div>

//           <div class="form-group">
//             <label class="input-label">Video Provider</label>
//             <p-select 
//               formControlName="videoProvider"
//               [options]="videoProviders"
//               optionLabel="label"
//               optionValue="value"
//               placeholder="Select provider"
//               styleClass="w-full">
//             </p-select>
//           </div>

//           <div class="form-group">
//             <label class="input-label">Video Duration</label>
//             <p-inputNumber 
//               formControlName="videoDuration"
//               [min]="0"
//               [showButtons]="true"
//               suffix=" sec"
//               styleClass="w-full">
//             </p-inputNumber>
//           </div>

//           <div class="form-group full-width">
//             <label class="input-label">Video Thumbnail</label>
//             <input 
//               pInputText 
//               formControlName="videoThumbnail"
//               placeholder="https://example.com/thumbnail.jpg"
//               class="w-full">
//           </div>
//         </div>
//       }

//       @if (lessonForm.get('type')?.value === 'article') {
//         <div class="content-form">
//           <div class="form-group full-width">
//             <label class="input-label">Article Content</label>
//             <textarea 
//               pInputTextarea 
//               formControlName="articleBody"
//               placeholder="Write your article content here..."
//               [rows]="10"
//               class="w-full">
//             </textarea>
//           </div>
//         </div>
//       }

//       @if (lessonForm.get('type')?.value === 'quiz') {
//         <div class="content-form">
//           <p class="info-message">
//             <i class="pi pi-info-circle"></i>
//             Quiz content will be configured in the Quiz Builder
//           </p>
//           <div class="form-group">
//             <label class="input-label">Quiz ID</label>
//             <input 
//               pInputText 
//               formControlName="quizId"
//               placeholder="Select a quiz"
//               class="w-full">
//           </div>
//         </div>
//       }
//     </p-tabpanel>

//     <p-tabpanel value="2">
//       <div class="resources-form">
//         <div formArrayName="resources">
//           @for (resource of resources.controls; track i; let i = $index) {
//             <div class="resource-item" [formGroupName]="i">
//               <div class="resource-fields">
//                 <input 
//                   pInputText 
//                   formControlName="title"
//                   placeholder="Resource title"
//                   class="resource-title">
                
//                 <p-select 
//                   formControlName="type"
//                   [options]="resourceTypes"
//                   optionLabel="label"
//                   optionValue="value"
//                   placeholder="Type"
//                   styleClass="resource-type">
//                 </p-select>

//                 <input 
//                   pInputText 
//                   formControlName="url"
//                   placeholder="URL"
//                   class="resource-url">
//               </div>
//               <button type="button" class="remove-btn" (click)="removeResource(i)">
//                 <i class="pi pi-trash"></i>
//               </button>
//             </div>
//           }
//         </div>

//         <button type="button" class="add-resource-btn" (click)="addResource()">
//           <i class="pi pi-plus"></i>
//           Add Resource
//         </button>
//       </div>
//     </p-tabpanel>

//   </p-tabpanels>
// </p-tabs>
//       <!-- Form Actions -->
//       <div class="form-actions">
//         <button pButton pRipple type="button" label="Cancel" icon="pi pi-times" class="p-button-outlined" (click)="onCancel()"></button>
//         <button pButton pRipple type="submit" [label]="lessonId ? 'Update' : 'Create'" icon="pi pi-check" [disabled]="lessonForm.invalid || isLoading"></button>
//       </div>
//     </form>
//   `,
//   styles: [`
//     .lesson-form {
//       padding: var(--spacing-lg);
//     }

//     .form-grid {
//       display: grid;
//       grid-template-columns: repeat(2, 1fr);
//       gap: var(--spacing-lg);
//     }

//     .full-width {
//       grid-column: 1 / -1;
//     }

//     .form-group {
//       margin-bottom: var(--spacing-md);
//     }

//     .input-label {
//       display: block;
//       font-weight: var(--font-weight-medium);
//       margin-bottom: var(--spacing-xs);
//       color: var(--text-primary);
//     }

//     .required {
//       color: var(--color-error);
//     }

//     .error-message {
//       color: var(--color-error);
//       font-size: var(--font-size-xs);
//       margin-top: var(--spacing-xs);
//       display: block;
//     }

//     /* Settings */
//     .settings-group {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-md);
//     }

//     .setting-item {
//       display: flex;
//       align-items: center;
//     }

//     /* Content Form */
//     .content-form {
//       padding: var(--spacing-md) 0;
//     }

//     .info-message {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       padding: var(--spacing-md);
//       background: var(--accent-focus);
//       color: var(--accent-primary);
//       border-radius: var(--ui-border-radius);
//       margin-bottom: var(--spacing-lg);
//     }

//     /* Resources */
//     .resources-form {
//       padding: var(--spacing-md) 0;
//     }

//     .resource-item {
//       display: flex;
//       gap: var(--spacing-sm);
//       margin-bottom: var(--spacing-md);
//     }

//     .resource-fields {
//       flex: 1;
//       display: flex;
//       gap: var(--spacing-sm);
//       align-items: center;
//     }

//     .resource-title {
//       flex: 2;
//     }

//     .resource-type {
//       flex: 1;
//     }

//     .resource-url {
//       flex: 3;
//     }

//     .remove-btn {
//       width: 32px;
//       height: 32px;
//       border-radius: 50%;
//       border: none;
//       background: transparent;
//       color: var(--text-tertiary);
//       cursor: pointer;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       transition: var(--transition-fast);
//     }

//     .remove-btn:hover {
//       background: var(--bg-hover);
//       color: var(--color-error);
//     }

//     .add-resource-btn {
//       width: 100%;
//       padding: var(--spacing-md);
//       background: transparent;
//       border: 2px dashed var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       color: var(--text-secondary);
//       cursor: pointer;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-sm);
//       transition: var(--transition-base);
//     }

//     .add-resource-btn:hover {
//       border-color: var(--accent-primary);
//       color: var(--accent-primary);
//     }

//     /* Form Actions */
//     .form-actions {
//       display: flex;
//       justify-content: flex-end;
//       gap: var(--spacing-md);
//       padding-top: var(--spacing-xl);
//       margin-top: var(--spacing-xl);
//       border-top: 1px solid var(--border-secondary);
//     }

//     @media (max-width: 768px) {
//       .form-grid {
//         grid-template-columns: 1fr;
//       }

//       .resource-fields {
//         flex-direction: column;
//       }

//       .resource-title,
//       .resource-type,
//       .resource-url {
//         width: 100%;
//       }
//     }
//   `]
// })
// export class LessonFormComponent implements OnInit, OnDestroy {
//   @Input() sectionId!: string;
//   @Input() courseId!: string;
//   @Input() lessonId?: any;
//   @Output() saved = new EventEmitter<any>();
//   @Output() cancelled = new EventEmitter<void>();

//   private fb = inject(FormBuilder);
//   private lessonService = inject(LessonService);

//   lessonForm!: FormGroup;
//   isLoading = false;

//   lessonTypes = [
//     { label: 'Video', value: 'video', icon: 'pi pi-video' },
//     { label: 'Article', value: 'article', icon: 'pi pi-file' },
//     { label: 'Quiz', value: 'quiz', icon: 'pi pi-question-circle' },
//     { label: 'Assignment', value: 'assignment', icon: 'pi pi-pencil' },
//     { label: 'Coding Exercise', value: 'coding-exercise', icon: 'pi pi-code' }
//   ];

//   videoProviders = [
//     { label: 'YouTube', value: 'youtube' },
//     { label: 'Vimeo', value: 'vimeo' },
//     { label: 'Wistia', value: 'wistia' },
//     { label: 'Local', value: 'local' }
//   ];

//   resourceTypes = [
//     { label: 'PDF', value: 'pdf' },
//     { label: 'Code', value: 'code' },
//     { label: 'Link', value: 'link' },
//     { label: 'Image', value: 'image' }
//   ];

//   private subscriptions: Subscription[] = [];

//   ngOnInit(): void {
//     this.initForm();
//     if (this.lessonId) {
//       this.loadLesson();
//     }
//   }

//   ngOnDestroy(): void {
//     this.subscriptions.forEach(sub => sub.unsubscribe());
//   }

//   private initForm(): void {
//     this.lessonForm = this.fb.group({
//       title: ['', Validators.required],
//       description: [''],
//       type: ['video', Validators.required],
//       duration: [0],
//       isPublished: [true],
//       isFree: [false],
//       // Video fields
//       videoUrl: [''],
//       videoProvider: ['youtube'],
//       videoDuration: [0],
//       videoThumbnail: [''],
//       // Article fields
//       articleBody: [''],
//       // Quiz fields
//       quizId: [''],
//       // Resources
//       resources: this.fb.array([])
//     });
//   }

//   get resources() {
//     return this.lessonForm.get('resources') as any;
//   }

//   private loadLesson(): void {
//     if (!this.lessonId) return;

//     this.isLoading = true;
//     const sub = this.lessonService.getById(this.lessonId).subscribe({
//       next: (res) => {
//         const lesson = res.data;
//         if (lesson) {
//           // Patch basic info
//           this.lessonForm.patchValue({
//             title: lesson.title,
//             description: lesson.description,
//             type: lesson.type,
//             duration: lesson.duration,
//             isPublished: lesson.isPublished,
//             isFree: lesson.isFree
//           });

//           // Patch content based on type
//           if (lesson.content) {
//             if (lesson.type === 'video' && lesson.content.video) {
//               this.lessonForm.patchValue({
//                 videoUrl: lesson.content.video.url,
//                 videoProvider: lesson.content.video.provider,
//                 videoDuration: lesson.content.video.duration,
//                 videoThumbnail: lesson.content.video.thumbnail
//               });
//             } else if (lesson.type === 'article' && lesson.content.article) {
//               this.lessonForm.patchValue({
//                 articleBody: lesson.content.article.body
//               });
//             } else if (lesson.type === 'quiz' && lesson.content.quiz) {
//               this.lessonForm.patchValue({
//                 quizId: lesson.content.quiz
//               });
//             }
//           }

//           // Patch resources
//           if (lesson.resources) {
//             lesson.resources.forEach((resource: any) => {
//               this.resources.push(this.fb.group({
//                 title: [resource.title],
//                 type: [resource.type],
//                 url: [resource.url]
//               }));
//             });
//           }
//         }
//         this.isLoading = false;
//       },
//       error: (error) => {
//         console.error('Failed to load lesson', error);
//         this.isLoading = false;
//       }
//     });
//     this.subscriptions.push(sub);
//   }

//   onTypeChange(event: any): void {
//     // Reset content fields when type changes
//     this.lessonForm.patchValue({
//       videoUrl: '',
//       videoProvider: 'youtube',
//       videoDuration: 0,
//       videoThumbnail: '',
//       articleBody: '',
//       quizId: ''
//     });
//   }

//   addResource(): void {
//     this.resources.push(this.fb.group({
//       title: [''],
//       type: ['link'],
//       url: ['']
//     }));
//   }

//   removeResource(index: number): void {
//     this.resources.removeAt(index);
//   }

//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.lessonForm.get(fieldName);
//     return field ? field.invalid && (field.dirty || field.touched) : false;
//   }

//   onSubmit(): void {
//     if (this.lessonForm.invalid) {
//       this.lessonForm.markAllAsTouched();
//       return;
//     }

//     this.isLoading = true;
//     const formData = this.lessonForm.value;

//     // Structure content based on type
//     const content: any = {};
//     if (formData.type === 'video') {
//       content.video = {
//         url: formData.videoUrl,
//         provider: formData.videoProvider,
//         duration: formData.videoDuration,
//         thumbnail: formData.videoThumbnail
//       };
//     } else if (formData.type === 'article') {
//       content.article = {
//         body: formData.articleBody
//       };
//     } else if (formData.type === 'quiz') {
//       content.quiz = formData.quizId;
//     }

//     // Prepare payload
//     const payload = {
//       title: formData.title,
//       description: formData.description,
//       type: formData.type,
//       content: content,
//       duration: formData.duration,
//       isPublished: formData.isPublished,
//       isFree: formData.isFree,
//       resources: formData.resources,
//       section: this.sectionId,
//       course: this.courseId
//     };

//     const request = this.lessonId
//       ? this.lessonService.update(this.lessonId, payload)
//       : this.lessonService.create(payload);

//     const sub = (request as any).subscribe({
//       next: (res: any) => {
//         this.isLoading = false;
//         this.saved.emit(res.data);
//       },
//       error: (error: any) => {
//         console.error('Failed to save lesson', error);
//         this.isLoading = false;
//       }
//     });
//     this.subscriptions.push(sub);
//   }

//   onCancel(): void {
//     this.cancelled.emit();
//   }
// }