import { Component, inject, DestroyRef, signal, effect, input, output, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TabsModule } from 'primeng/tabs';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox'; 
import { LessonService } from '../../../../core/services/lesson.service';
import { ApiResponse } from '../../../../core/http/base-api.service';

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
  private lessonApiService = inject(LessonService); // <-- Updated Injection
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
    // <-- Updated to use new service signature
    this.lessonApiService.getLesson(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: ApiResponse<any>) => {
          // Unwrapping logic is cleaner because BaseApiService standardizes it
          const lesson = res.data;
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
      sectionId: this.sectionId(), // <-- Mapped to your backend schema expectations
      courseId: this.courseId()    // <-- Mapped to your backend schema expectations
    };

    const id = this.lessonId();
    
    // <-- Updated to use new service signatures (no longer passing courseId/sectionId as route params)
    const request$ = (id 
      ? this.lessonApiService.updateLesson(id, payload)
      : this.lessonApiService.createLesson(payload)) as Observable<ApiResponse<any>>; 

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: ApiResponse<any>) => {
        this.isLoading.set(false);
        // Standardized response wrapping
        this.saved.emit(res.data);
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
// import { Component, inject, DestroyRef, signal, effect, input, output, OnInit } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
// import { Observable } from 'rxjs';

// // PrimeNG
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { TextareaModule } from 'primeng/textarea';
// import { TabsModule } from 'primeng/tabs';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { SelectModule } from 'primeng/select';
// import { CheckboxModule } from 'primeng/checkbox'; // Replaced ToggleSwitch with Checkbox for better form alignment

// // Services
// import { LessonService } from '../../../../core/services/lesson.service';

// @Component({
//   selector: 'app-lesson-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     ButtonModule,
//     InputTextModule,
//     TextareaModule,
//     SelectModule,
//     CheckboxModule,
//     InputNumberModule,
//     TabsModule
//   ],
//   templateUrl: './lesson-form.component.html',
//   styleUrls: ['./lesson-form.component.scss']
// })
// export class LessonFormComponent implements OnInit {
//   // Modern Signal Inputs/Outputs
//   sectionId = input.required<string>();
//   courseId = input.required<string>();
//   lessonId = input<string | null>(null);
  
//   saved = output<any>();
//   cancelled = output<void>();

//   // Injectors
//   private fb = inject(FormBuilder);
//   private lessonService = inject(LessonService);
//   private destroyRef = inject(DestroyRef);

//   // Reactive State
//   isLoading = signal<boolean>(false);

//   // Configuration Constants
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
//     { label: 'PDF Document', value: 'pdf' },
//     { label: 'Source Code', value: 'code' },
//     { label: 'External Link', value: 'link' },
//     { label: 'Image', value: 'image' }
//   ];

//   // Initialize Form
//   lessonForm: FormGroup = this.fb.group({
//     title: ['', Validators.required],
//     description: [''],
//     type: ['video', Validators.required],
//     duration: [0],
//     isPublished: [true],
//     isFree: [false],
//     // Video fields
//     videoUrl: [''],
//     videoProvider: ['youtube'],
//     videoDuration: [0],
//     videoThumbnail: [''],
//     // Article fields
//     articleBody: [''],
//     // Quiz fields
//     quizId: [''],
//     // Resources
//     resources: this.fb.array([])
//   });

//   constructor() {
//     // React to lessonId changes (e.g., when modal opens for edit vs create)
//     effect(() => {
//       const id = this.lessonId();
//       if (id) {
//         this.loadLesson(id);
//       } else {
//         this.resetForm();
//       }
//     }, { allowSignalWrites: true });
//   }

//   ngOnInit(): void {}

//   private resetForm(): void {
//     this.lessonForm.reset({
//       type: 'video',
//       videoProvider: 'youtube',
//       duration: 0,
//       videoDuration: 0,
//       isPublished: true,
//       isFree: false
//     });
//     this.resources.clear();
//   }

//   private loadLesson(id: string): void {
//     this.isLoading.set(true);
//     this.lessonService.getLessonByID(this.courseId(),this.sectionId(),id)
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe({
//         next: (res: any) => {
//           const lesson = res.data?.lesson || res.data;
//           if (lesson) {
//             this.patchForm(lesson);
//           }
//           this.isLoading.set(false);
//         },
//         error: (error: any) => {
//           console.error('Failed to load lesson', error);
//           this.isLoading.set(false);
//         }
//       });
//   }

//   private patchForm(lesson: any): void {
//     this.resources.clear();

//     this.lessonForm.patchValue({
//       title: lesson.title,
//       description: lesson.description,
//       type: lesson.type,
//       duration: lesson.duration,
//       isPublished: lesson.isPublished,
//       isFree: lesson.isFree
//     });

//     if (lesson.content) {
//       if (lesson.type === 'video' && lesson.content.video) {
//         this.lessonForm.patchValue({
//           videoUrl: lesson.content.video.url,
//           videoProvider: lesson.content.video.provider,
//           videoDuration: lesson.content.video.duration,
//           videoThumbnail: lesson.content.video.thumbnail
//         });
//       } else if (lesson.type === 'article' && lesson.content.article) {
//         this.lessonForm.patchValue({ articleBody: lesson.content.article.body });
//       } else if (lesson.type === 'quiz' && lesson.content.quiz) {
//         this.lessonForm.patchValue({ quizId: lesson.content.quiz });
//       }
//     }

//     if (lesson.resources?.length) {
//       lesson.resources.forEach((res: any) => {
//         this.resources.push(this.fb.group({
//           title: [res.title, Validators.required],
//           type: [res.type, Validators.required],
//           url: [res.url, Validators.required]
//         }));
//       });
//     }
//   }

//   get resources(): FormArray {
//     return this.lessonForm.get('resources') as FormArray;
//   }

//   onTypeChange(event: any): void {
//     // Clear specific fields when switching types to avoid dirty data payload
//     this.lessonForm.patchValue({
//       videoUrl: '', videoDuration: 0, videoThumbnail: '', articleBody: '', quizId: ''
//     });
//   }

//   addResource(): void {
//     this.resources.push(this.fb.group({
//       title: ['', Validators.required],
//       type: ['link', Validators.required],
//       url: ['', Validators.required]
//     }));
//   }

//   removeResource(index: number): void {
//     this.resources.removeAt(index);
//   }

//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.lessonForm.get(fieldName);
//     return field ? field.invalid && (field.dirty || field.touched) : false;
//   }

//   isResourceInvalid(index: number, fieldName: string): boolean {
//     const field = this.resources.at(index).get(fieldName);
//     return field ? field.invalid && (field.dirty || field.touched) : false;
//   }

//   onSubmit(): void {
//     if (this.lessonForm.invalid) {
//       this.lessonForm.markAllAsTouched();
//       return;
//     }

//     this.isLoading.set(true);
//     const formData = this.lessonForm.getRawValue();

//     // Construct backend-compliant payload
//     const content: any = {};
//     if (formData.type === 'video') {
//       content.video = {
//         url: formData.videoUrl,
//         provider: formData.videoProvider,
//         duration: formData.videoDuration,
//         thumbnail: formData.videoThumbnail
//       };
//     } else if (formData.type === 'article') {
//       content.article = { body: formData.articleBody };
//     } else if (formData.type === 'quiz') {
//       content.quiz = formData.quizId;
//     }

//     const payload = {
//       title: formData.title,
//       description: formData.description,
//       type: formData.type,
//       duration: formData.duration,
//       isPublished: formData.isPublished,
//       isFree: formData.isFree,
//       content: content,
//       resources: formData.resources,
//       section: this.sectionId(),
//       course: this.courseId()
//     };

//     const id = this.lessonId();
//     const request$ = (id 
//       ? this.lessonService.updateLesson(this.courseId(),this.sectionId(),id,payload)
//       : this.lessonService.createLesson(this.courseId(),this.sectionId(),payload)) as Observable<any>; // Cast to avoid union type error

//     request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
//       next: (res: any) => {
//         this.isLoading.set(false);
//         this.saved.emit(res.data?.lesson || res.data);
//       },
//       error: (error: any) => {
//         console.error('Failed to save lesson', error);
//         this.isLoading.set(false);
//       }
//     });
//   }

//   onCancel(): void {
//     this.cancelled.emit();
//   }
// }

