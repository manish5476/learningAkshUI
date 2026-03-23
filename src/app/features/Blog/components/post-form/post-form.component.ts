// post-form.component.ts (Fixed version)

import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { EditorModule } from 'primeng/editor';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { DynamicDropdownComponent } from '../../../../shared/components/dynamic-select/dynamic-select.component';
import { DropdownOption } from '../../../../core/services/dropdown.service';
import { PostService } from '../../../../core/services/post.service';
import { AppMessageService } from '../../../../core/utils/message.service';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    ButtonModule, 
    InputTextModule, 
    EditorModule, 
    DatePickerModule, 
    CheckboxModule, 
    CardModule, 
    ConfirmDialogModule,
    ToastModule, 
    DynamicDropdownComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './post-form.component.html',
  styleUrls: ['./post-form.component.scss']
})
export class PostFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private postService = inject(PostService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(AppMessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  postForm!: FormGroup;
  postId: string | null = null;
  
  // Signals for reactive state
  isEditMode = signal(false);
  isLoading = signal(false);
  isSavingDraft = signal(false);
  hasUnsavedChanges = signal(false);
  
  // UI state
  sourcesExpanded = signal(false);
  showPreview = signal(false);
  
  // For hydrating dropdowns in Edit Mode
  editCategoryOptions: DropdownOption[] = [];

  // Custom validators
  private readonly urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})(\/\S*)?$/;

  ngOnInit() {
    this.initForm();
    this.setupAutoSave();
    this.setupFormListeners();
    
    // Check if we're in edit mode by looking for 'id' parameter
    // Note: 'new' route doesn't have an id parameter
    this.postId = this.route.snapshot.paramMap.get('id');
    
    console.log('Route params:', this.route.snapshot.params); // Debug log
    console.log('Post ID:', this.postId); // Debug log
    
    if (this.postId) {
      this.isEditMode.set(true);
      this.loadPostData(this.postId);
    } else {
      // For new post, set default values
      this.isEditMode.set(false);
      console.log('Creating new post'); // Debug log
    }
  }

  initForm() {
    this.postForm = this.fb.group({
      title: ['', [
        Validators.required, 
        Validators.minLength(5), 
        Validators.maxLength(150)
      ]],
      type: ['blog', Validators.required],
      language: ['en', Validators.required],
      category: [null, Validators.required],
      
      excerpt: ['', [
        Validators.required, 
        Validators.minLength(20), 
        Validators.maxLength(500)
      ]],
      content: ['', [
        Validators.required, 
        Validators.minLength(50)
      ]],
      thumbnail: ['', [
        this.urlValidator.bind(this)
      ]],
      
      // Current Affairs specifics
      sourceName: [''],
      sourceUrl: ['', [
        this.urlValidator.bind(this)
      ]],
      eventDate: [null],
      attachmentUrl: ['', [
        this.urlValidator.bind(this)
      ]],
      attachmentName: [''],

      // Meta & SEO
      tags: this.fb.array([]),
      seo: this.fb.group({
        metaTitle: ['', [Validators.maxLength(60)]],
        metaDescription: ['', [Validators.maxLength(160)]]
      }),

      // Publishing
      status: ['draft', Validators.required],
      isFeatured: [false]
    });
  }

  // Custom validator for URLs
  urlValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const isValid = this.urlPattern.test(control.value);
    return isValid ? null : { invalidUrl: true };
  }

  setupFormListeners() {
    // Track unsaved changes
    this.postForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.postForm.dirty && !this.isLoading()) {
          this.hasUnsavedChanges.set(true);
        }
      });

    // Auto-generate meta title from post title if empty
    this.postForm.get('title')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(title => {
        const metaTitleControl = this.postForm.get('seo.metaTitle');
        if (metaTitleControl && !metaTitleControl.dirty && title) {
          metaTitleControl.setValue(title, { emitEvent: false });
        }
      });

    // Sync attachment name with URL if empty
    this.postForm.get('attachmentUrl')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(url => {
        const attachmentNameControl = this.postForm.get('attachmentName');
        if (attachmentNameControl && !attachmentNameControl.dirty && url) {
          const fileName = url.split('/').pop() || 'attachment';
          attachmentNameControl.setValue(fileName, { emitEvent: false });
        }
      });
  }

  setupAutoSave() {
    let autoSaveInterval: any;
    
    this.postForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (autoSaveInterval) clearInterval(autoSaveInterval);
        
        autoSaveInterval = setInterval(() => {
          if (this.hasUnsavedChanges() && !this.isLoading() && this.postForm.valid && !this.isEditMode()) {
            // Only auto-save for new posts, not for editing
            this.autoSaveDraft();
          }
        }, 30000);
      });
  }

  autoSaveDraft() {
    if (this.postForm.invalid) return;
    
    this.isSavingDraft.set(true);
    const formData = this.prepareFormData();
    
    const save$ = this.postService.createPost({ ...formData, status: 'draft' });
    
    save$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: any) => {
        this.hasUnsavedChanges.set(false);
        this.postForm.markAsPristine();
        this.messageService.showInfo('Draft auto-saved');
        
        // If this was a new post being created, update the ID and switch to edit mode
        if (response.data && response.data._id) {
          this.postId = response.data._id;
          this.isEditMode.set(true);
          // Update URL to reflect edit mode without reloading the page
          this.router.navigate(['/instructor/posts/edit', this.postId], { replaceUrl: true });
        }
      },
      error: () => {
        // Silently fail auto-save
      },
      complete: () => {
        this.isSavingDraft.set(false);
      }
    });
  }

  get tags(): FormArray {
    return this.postForm.get('tags') as FormArray;
  }

  addTag(event: any, inputElement: HTMLInputElement) {
    const value = event.target?.value?.trim() || inputElement?.value?.trim();
    
    if (value && !this.tags.controls.some(tag => tag.value === value)) {
      this.tags.push(new FormControl(value));
      if (inputElement) inputElement.value = '';
      if (event.target) event.target.value = '';
      this.hasUnsavedChanges.set(true);
    }
  }

  addTagFromComma(event: any, inputElement: HTMLInputElement) {
    const value = inputElement.value.trim();
    if (value && value.includes(',')) {
      const tags = value.split(',').map(t => t.trim()).filter(t => t);
      tags.forEach(tag => {
        if (!this.tags.controls.some(existing => existing.value === tag)) {
          this.tags.push(new FormControl(tag));
        }
      });
      inputElement.value = '';
      event.preventDefault();
    } else if (value) {
      this.addTag(event, inputElement);
    }
  }

  removeTag(index: number) {
    this.tags.removeAt(index);
    this.hasUnsavedChanges.set(true);
  }

  decodeHtml(html: string): string {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  loadPostData(id: string) {
    this.isLoading.set(true);
    this.postService.getPost(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const post = response.post || response;
        console.log('Loaded post:', post); // Debug log
        
        // Hydrate Category Dropdown
        if (post.category) {
          this.editCategoryOptions = [{ label: post.category.name, value: post.category._id }];
        }

        // Setup Tags
        if (post.tags?.length) {
          post.tags.forEach((tag: string) => this.tags.push(new FormControl(tag)));
        }

        // Patch Form
        this.postForm.patchValue({
          ...post,
          content: this.decodeHtml(post.content),
          category: post.category?._id,
          eventDate: post.eventDate ? new Date(post.eventDate) : null
        });

        this.postForm.markAsPristine();
        this.hasUnsavedChanges.set(false);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading post:', error);
        this.messageService.showError('Failed to load post data');
        this.isLoading.set(false);
        this.router.navigate(['/instructor/posts']);
      }
    });
  }

  prepareFormData(): any {
    const formValue = this.postForm.value;
    const cleanData: any = {};
    
    // Only include fields that have values
    Object.keys(formValue).forEach(key => {
      if (formValue[key] !== '' && formValue[key] !== null && formValue[key] !== undefined) {
        cleanData[key] = formValue[key];
      }
    });
    
    return {
      ...cleanData,
      tags: this.tags.value,
      eventDate: formValue.eventDate ? new Date(formValue.eventDate).toISOString() : null,
      seo: {
        metaTitle: formValue.seo?.metaTitle || formValue.title,
        metaDescription: formValue.seo?.metaDescription || formValue.excerpt?.substring(0, 160)
      }
    };
  }

  onSubmit() {
    if (this.postForm.invalid) {
      // Scroll to first invalid field
      const firstInvalid = document.querySelector('.ng-invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      this.messageService.showError('Please fill all required fields correctly');
      return;
    }

    this.isLoading.set(true);
    const formData = this.prepareFormData();

    const request$ = this.isEditMode() 
      ? this.postService.updatePost(this.postId!, formData)
      : this.postService.createPost(formData);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: any) => {
        this.messageService.showSuccess(
          `Post successfully ${this.isEditMode() ? 'updated' : 'created'}!`       
        );
        this.hasUnsavedChanges.set(false);
        this.router.navigate(['/instructor/posts']);
      },
      error: (err) => {
        console.error('Error saving post:', err);
        this.messageService.showError(err.message || 'Failed to save post');
        this.isLoading.set(false);
      }
    });
  }

  saveDraft() {
    if (this.postForm.invalid) {
      this.messageService.showWarn('Please fill required fields before saving draft');
      return;
    }
    
    this.isSavingDraft.set(true);
    const formData = this.prepareFormData();
    
    const save$ = this.isEditMode() 
      ? this.postService.updatePost(this.postId!, { ...formData, status: 'draft' })
      : this.postService.createPost({ ...formData, status: 'draft' });
    
    save$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: any) => {
        this.messageService.showSuccess('Draft saved successfully');
        this.hasUnsavedChanges.set(false);
        this.postForm.markAsPristine();
        
        // If this was a new draft, update URL
        if (!this.isEditMode() && response.data && response.data._id) {
          this.postId = response.data._id;
          this.isEditMode.set(true);
          this.router.navigate(['/instructor/posts/edit', this.postId], { replaceUrl: true });
        }
      },
      error: (err) => {
        console.error('Error saving draft:', err);
        this.messageService.showError(err.message || 'Failed to save draft');
      },
      complete: () => {
        this.isSavingDraft.set(false);
      }
    });
  }

  duplicatePost() {
    const currentValues = this.prepareFormData();
    const duplicatedFormData = {
      ...currentValues,
      title: `${currentValues.title} (Copy)`,
      status: 'draft',
      tags: [...currentValues.tags]
    };
    
    this.postService.createPost(duplicatedFormData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: any) => {
        this.messageService.showSuccess('Post duplicated successfully');
        this.router.navigate(['/instructor/posts/edit', response.data?._id || response._id]);
      },
      error: (err) => {
        console.error('Error duplicating post:', err);
        this.messageService.showError('Failed to duplicate post');
      }
    });
  }

  previewPost() {
    this.showPreview.set(true);
    const previewData = this.prepareFormData();
    sessionStorage.setItem('post_preview', JSON.stringify(previewData));
    window.open('/preview-post', '_blank');
  }

  onCancel() {
    if (this.hasUnsavedChanges()) {
      this.confirmationService.confirm({
        message: 'You have unsaved changes. Are you sure you want to leave?',
        header: 'Unsaved Changes',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.router.navigate(['/instructor/posts']);
        }
      });
    } else {
      this.router.navigate(['/instructor/posts']);
    }
  }

  clearThumbnail() {
    this.postForm.get('thumbnail')?.setValue('');
    this.hasUnsavedChanges.set(true);
  }

  onThumbnailError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    this.messageService.showWarn('Invalid image URL');
  }

  // Helper methods for template
  getSubmitButtonLabel(): string {
    if (this.isLoading()) return 'Saving...';
    return this.isEditMode() ? 'Update Post' : 'Publish Post';
  }

  getSubmitButtonIcon(): string {
    if (this.isLoading()) return 'pi pi-spinner pi-spin';
    return this.isEditMode() ? 'pi pi-save' : 'pi pi-check';
  }

  getMetaTitlePreview(): string {
    return this.postForm.get('seo.metaTitle')?.value || 
           this.postForm.get('title')?.value || 
           'Meta Title';
  }

  getMetaDescriptionPreview(): string {
    return this.postForm.get('seo.metaDescription')?.value || 
           this.postForm.get('excerpt')?.value?.substring(0, 160) || 
           'Meta description will appear here...';
  }

  getSeoUrlPreview(): string {
    const title = this.postForm.get('title')?.value || 'post-title';
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `yourwebsite.com/blog/${slug}`;
  }

  toggleSourcesSection() {
    this.sourcesExpanded.set(!this.sourcesExpanded());
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.postForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.postForm.get(fieldName);
    if (!field || !field.errors) return '';
    
    if (field.errors['required']) return 'This field is required';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
    if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters allowed`;
    if (field.errors['invalidUrl']) return 'Please enter a valid URL';
    
    return 'Invalid field value';
  }
}

// // post-form.component.ts
// import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { ConfirmDialogModule } from 'primeng/confirmdialog';

// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { EditorModule } from 'primeng/editor';
// import { CheckboxModule } from 'primeng/checkbox';
// import { CardModule } from 'primeng/card';
// import { ToastModule } from 'primeng/toast';
// import { DatePickerModule } from 'primeng/datepicker';
// import { DynamicDropdownComponent } from '../../../../shared/components/dynamic-select/dynamic-select.component';
// import { DropdownOption } from '../../../../core/services/dropdown.service';
// import { PostService } from '../../../../core/services/post.service';
// import { AppMessageService } from '../../../../core/utils/message.service';
// import { ConfirmationService } from 'primeng/api';

// interface PostFormData {
//   title: string;
//   type: string;
//   language: string;
//   category: string;
//   excerpt: string;
//   content: string;
//   thumbnail: string;
//   sourceName: string;
//   sourceUrl: string;
//   eventDate: Date | null;
//   attachmentUrl: string;
//   attachmentName: string;
//   tags: string[];
//   seo: {
//     metaTitle: string;
//     metaDescription: string;
//   };
//   status: string;
//   isFeatured: boolean;
// }
// export const POST_TYPES = [
//   { label: 'Article', value: 'article' },
//   { label: 'News', value: 'news' },
//   { label: 'Current Affairs', value: 'current_affairs' },
//   { label: 'Video', value: 'video' },
//   { label: 'Editorial', value: 'editorial' },
//   { label: 'Blog', value: 'blog' }
// ];

// export const POST_STATUSES = [
//   { label: 'Draft', value: 'draft' },
//   { label: 'In Review', value: 'review' },
//   { label: 'Published', value: 'published' },
//   { label: 'Archived', value: 'archived' }
// ];

// export const LANGUAGES = [
//   // Indian Languages
//   { label: 'English', value: 'english' },
//   { label: 'Hindi (हिन्दी)', value: 'hindi' },
//   { label: 'Gujarati (ગુજરાતી)', value: 'gujarati' },
//   { label: 'Marathi (मराठी)', value: 'marathi' },
//   { label: 'Bengali (বাংলা)', value: 'bengali' },
//   { label: 'Tamil (தமிழ்)', value: 'tamil' },
//   { label: 'Telugu (తెలుగు)', value: 'telugu' },
//   { label: 'Kannada (ಕನ್ನಡ)', value: 'kannada' },
//   { label: 'Malayalam (മലയാളം)', value: 'malayalam' },
//   { label: 'Punjabi (ਪੰਜਾਬੀ)', value: 'punjabi' },
//   { label: 'Odia (ଓଡ଼ିଆ)', value: 'odia' },
//   { label: 'Urdu (اردو)', value: 'urdu' },
  
//   // Foreign Languages
//   { label: 'Spanish (Español)', value: 'spanish' },
//   { label: 'French (Français)', value: 'french' },
//   { label: 'German (Deutsch)', value: 'german' },
//   { label: 'Mandarin (中文)', value: 'mandarin' },
//   { label: 'Arabic (العربية)', value: 'arabic' },
//   { label: 'Russian (Русский)', value: 'russian' },
//   { label: 'Japanese (日本語)', value: 'japanese' }
// ];
// @Component({
//   selector: 'app-post-form',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ReactiveFormsModule, 
//     ButtonModule, 
//     InputTextModule, 
//     EditorModule, 
//     DatePickerModule, 
//     CheckboxModule, 
//     CardModule, ConfirmDialogModule,
//     ToastModule, 
//     DynamicDropdownComponent
//   ],providers: [ConfirmationService], // 👈 ADD THIS LINE
//   templateUrl: './post-form.component.html',
//   styleUrls: ['./post-form.component.scss']
// })
// export class PostFormComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private postService = inject(PostService);
//     private confirmationService = inject(ConfirmationService);
//   private messageService = inject(AppMessageService);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private destroyRef = inject(DestroyRef);

//   postForm!: FormGroup;
//   postId: string | null = null;
  
//   // Signals for reactive state
//   isEditMode = signal(false);
//   isLoading = signal(false);
//   isSavingDraft = signal(false);
//   hasUnsavedChanges = signal(false);
  
//   // UI state
//   sourcesExpanded = signal(false);
//   showPreview = signal(false);
  
//   // For hydrating dropdowns in Edit Mode
//   editCategoryOptions: DropdownOption[] = [];

//   // Custom validators
// // Replace your old regex with this one
// private readonly urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})(\/\S*)?$/;
//   private readonly youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

//   ngOnInit() {
//     this.initForm();
//     this.setupAutoSave();
//     this.setupFormListeners();
    
//     this.postId = this.route.snapshot.paramMap.get('id');
//     if (this.postId) {
//       this.isEditMode.set(true);
//       this.loadPostData(this.postId);
//     }
//   }

//   initForm() {
//     this.postForm = this.fb.group({
//       title: ['', [
//         Validators.required, 
//         Validators.minLength(5), 
//         Validators.maxLength(150)
//       ]],
//       type: ['blog', Validators.required],
//       language: ['en', Validators.required],
//       category: [null, Validators.required],
      
//       excerpt: ['', [
//         Validators.required, 
//         Validators.minLength(20), 
//         Validators.maxLength(500)
//       ]],
//       content: ['', [
//         Validators.required, 
//         Validators.minLength(50)
//       ]],
//       thumbnail: ['', [
//         this.urlValidator.bind(this)
//       ]],
      
//       // Current Affairs specifics
//       sourceName: [''],
//       sourceUrl: ['', [
//         this.urlValidator.bind(this)
//       ]],
//       eventDate: [null],
//       attachmentUrl: ['', [
//         this.urlValidator.bind(this)
//       ]],
//       attachmentName: [''],

//       // Meta & SEO
//       tags: this.fb.array([]),
//       seo: this.fb.group({
//         metaTitle: ['', [Validators.maxLength(60)]],
//         metaDescription: ['', [Validators.maxLength(160)]]
//       }),

//       // Publishing
//       status: ['draft', Validators.required],
//       isFeatured: [false]
//     });
//   }

//   // Custom validator for URLs
//   urlValidator(control: AbstractControl): ValidationErrors | null {
//     if (!control.value) return null;
//     const isValid = this.urlPattern.test(control.value);
//     return isValid ? null : { invalidUrl: true };
//   }

//   setupFormListeners() {
//     // Track unsaved changes
//     this.postForm.valueChanges
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(() => {
//         if (this.postForm.dirty && !this.isLoading()) {
//           this.hasUnsavedChanges.set(true);
//         }
//       });

//     // Auto-generate meta title from post title if empty
//     this.postForm.get('title')?.valueChanges
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(title => {
//         const metaTitleControl = this.postForm.get('seo.metaTitle');
//         if (metaTitleControl && !metaTitleControl.dirty && title) {
//           metaTitleControl.setValue(title, { emitEvent: false });
//         }
//       });

//     // Sync attachment name with URL if empty
//     this.postForm.get('attachmentUrl')?.valueChanges
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(url => {
//         const attachmentNameControl = this.postForm.get('attachmentName');
//         if (attachmentNameControl && !attachmentNameControl.dirty && url) {
//           const fileName = url.split('/').pop() || 'attachment';
//           attachmentNameControl.setValue(fileName, { emitEvent: false });
//         }
//       });
//   }

//   setupAutoSave() {
//     // Auto-save draft every 30 seconds if form is dirty and not loading
//     let autoSaveInterval: any;
    
//     this.postForm.valueChanges
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe(() => {
//         if (autoSaveInterval) clearInterval(autoSaveInterval);
        
//         autoSaveInterval = setInterval(() => {
//           if (this.hasUnsavedChanges() && !this.isLoading() && this.postForm.valid) {
//             this.autoSaveDraft();
//           }
//         }, 30000);
//       });
//   }

//   autoSaveDraft() {
//     if (this.postForm.invalid) return;
    
//     this.isSavingDraft.set(true);
//     const formData = this.prepareFormData();
    
//     const save$ = this.isEditMode() 
//       ? this.postService.updatePost(this.postId!, { ...formData, status: 'draft' })
//       : this.postService.createPost({ ...formData, status: 'draft' });
    
//     save$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
//       next: (response:any) => {
//         this.hasUnsavedChanges.set(false);
//         this.postForm.markAsPristine();
//         this.messageService.showInfo('Draft auto-saved');
        
//         // If this was a new post being created, update the ID
//         if (!this.isEditMode() && response._id) {
//           this.postId = response._id;
//           this.isEditMode.set(true);
//           this.router.navigate(['/instructor/posts/edit', response._id], { replaceUrl: true });
//         }
//       },
//       error: () => {
//         // Silently fail auto-save
//       },
//       complete: () => {
//         this.isSavingDraft.set(false);
//       }
//     });
//   }

//   get tags(): FormArray {
//     return this.postForm.get('tags') as FormArray;
//   }

//   addTag(event: any, inputElement: HTMLInputElement) {
//     const value = event.target?.value?.trim() || inputElement?.value?.trim();
    
//     if (value && !this.tags.controls.some(tag => tag.value === value)) {
//       this.tags.push(new FormControl(value));
//       if (inputElement) inputElement.value = '';
//       if (event.target) event.target.value = '';
//       this.hasUnsavedChanges.set(true);
//     }
//   }

//   addTagFromComma(event: any, inputElement: HTMLInputElement) {
//     const value = inputElement.value.trim();
//     if (value && value.includes(',')) {
//       const tags = value.split(',').map(t => t.trim()).filter(t => t);
//       tags.forEach(tag => {
//         if (!this.tags.controls.some(existing => existing.value === tag)) {
//           this.tags.push(new FormControl(tag));
//         }
//       });
//       inputElement.value = '';
//       event.preventDefault();
//     } else if (value) {
//       this.addTag(event, inputElement);
//     }
//   }

//   removeTag(index: number) {
//     this.tags.removeAt(index);
//     this.hasUnsavedChanges.set(true);
//   }

//   loadPostData(id: string) {
//     this.isLoading.set(true);
//     this.postService.getPost(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
//       next: (post) => {
//         // Hydrate Category Dropdown
//         if (post.category) {
//           this.editCategoryOptions = [{ label: post.category.name, value: post.category._id }];
//         }

//         // Setup Tags
//         if (post.tags?.length) {
//           post.tags.forEach((tag: string) => this.tags.push(new FormControl(tag)));
//         }

//         // Patch Form
//         this.postForm.patchValue({
//           ...post,
//           category: post.category?._id,
//           eventDate: post.eventDate ? new Date(post.eventDate) : null
//         });

//         this.postForm.markAsPristine();
//         this.hasUnsavedChanges.set(false);
//         this.isLoading.set(false);
//       },
//       error: (error) => {
//         this.messageService.showError('Failed to load post data');
//         this.isLoading.set(false);
//         this.router.navigate(['/instructor/posts']);
//       }
//     });
//   }

//   prepareFormData(): any {
//     const formValue = this.postForm.value;
//     Object.keys(formValue).forEach(key => {
//       if (formValue[key] === '' || formValue[key] === null) {
//         delete formValue[key];
//       }
//     });
//     return {
//       ...formValue,
//       tags: this.tags.value,
//       eventDate: formValue.eventDate ? new Date(formValue.eventDate).toISOString() : null,
//       seo: {
//         metaTitle: formValue.seo?.metaTitle || formValue.title,
//         metaDescription: formValue.seo?.metaDescription || formValue.excerpt?.substring(0, 160)
//       }
//     };
//   }

//   onSubmit() {
//     if (this.postForm.invalid) {
//       // Scroll to first invalid field
//       const firstInvalid = document.querySelector('.ng-invalid');
//       if (firstInvalid) {
//         firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
//       }
      
//       this.messageService.showError('Please fill all required fields correctly');
//       return;
//     }

//     this.isLoading.set(true);
//     const formData = this.prepareFormData();

//     const request$ = this.isEditMode() 
//       ? this.postService.updatePost(this.postId!, formData)
//       : this.postService.createPost(formData);

//     request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
//       next: (response) => {
//         this.messageService.showSuccess(
//           `Post successfully ${this.isEditMode() ? 'updated' : 'created'}!`       
//         );
//         this.hasUnsavedChanges.set(false);
//         this.router.navigate(['/instructor/posts']);
//       },
//       error: (err) => {
//         this.messageService.showError(err.message || 'Failed to save post');
//         this.isLoading.set(false);
//       }
//     });
//   }

//   saveDraft() {
//     if (this.postForm.invalid) {
//       this.messageService.showWarn('Please fill required fields before saving draft');
//       return;
//     }
    
//     this.isSavingDraft.set(true);
//     const formData = this.prepareFormData();
    
//     const save$ = this.isEditMode() 
//       ? this.postService.updatePost(this.postId!, { ...formData, status: 'draft' })
//       : this.postService.createPost({ ...formData, status: 'draft' });
    
//     save$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
//       next: (response:any) => {
//         this.messageService.showSuccess('Draft saved successfully');
//         this.hasUnsavedChanges.set(false);
//         this.postForm.markAsPristine();
        
//         // If this was a new draft, update URL
//         if (!this.isEditMode() && response._id) {
//           this.postId = response._id;
//           this.isEditMode.set(true);
//           this.router.navigate(['/instructor/posts/edit', response._id], { replaceUrl: true });
//         }
//       },
//       error: (err) => {
//         this.messageService.showError(err.message || 'Failed to save draft');
//       },
//       complete: () => {
//         this.isSavingDraft.set(false);
//       }
//     });
//   }

//   duplicatePost() {
//     const currentValues = this.prepareFormData();
//     const duplicatedFormData = {
//       ...currentValues,
//       title: `${currentValues.title} (Copy)`,
//       status: 'draft',
//       tags: [...currentValues.tags]
//     };
    
//     this.postService.createPost(duplicatedFormData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
//       next: (response:any) => {
//         this.messageService.showSuccess('Post duplicated successfully');
//         this.router.navigate(['/instructor/posts/edit', response._id]);
//       },
//       error: (err) => {
//         this.messageService.showError('Failed to duplicate post');
//       }
//     });
//   }

//   previewPost() {
//     this.showPreview.set(true);
//     // You can implement a modal preview here
//     const previewData = this.prepareFormData();
//     // Store in session storage for preview component
//     sessionStorage.setItem('post_preview', JSON.stringify(previewData));
//     window.open('/preview-post', '_blank');
//   }

//   onCancel() {
//     this.router.navigate(['/instructor/posts']);
// //     if (this.hasUnsavedChanges()) {
// // this.confirmationService.confirm({
// //           message: 'You have unsaved changes. Are you sure you want to leave?',
// //         header: 'Unsaved Changes',
// //         accept: () => {
// //         }
// //       });
// //     } else {
// //       this.router.navigate(['/instructor/posts']);
// //     }
//   }

//   clearThumbnail() {
//     this.postForm.get('thumbnail')?.setValue('');
//     this.hasUnsavedChanges.set(true);
//   }

//   onThumbnailError(event: Event) {
//     const img = event.target as HTMLImageElement;
//     img.style.display = 'none';
//     // Show error message
//     this.messageService.showWarn('Invalid image URL Error');
//   }

//   // Helper methods for template
//   getSubmitButtonLabel(): string {
//     if (this.isLoading()) return 'Saving...';
//     return this.isEditMode() ? 'Update Post' : 'Publish Post';
//   }

//   getSubmitButtonIcon(): string {
//     if (this.isLoading()) return 'pi pi-spinner pi-spin';
//     return this.isEditMode() ? 'pi pi-save' : 'pi pi-check';
//   }

//   getMetaTitlePreview(): string {
//     return this.postForm.get('seo.metaTitle')?.value || 
//            this.postForm.get('title')?.value || 
//            'Meta Title';
//   }

//   getMetaDescriptionPreview(): string {
//     return this.postForm.get('seo.metaDescription')?.value || 
//            this.postForm.get('excerpt')?.value?.substring(0, 160) || 
//            'Meta description will appear here...';
//   }

//   getSeoUrlPreview(): string {
//     const title = this.postForm.get('title')?.value || 'post-title';
//     const slug = title.toLowerCase()
//       .replace(/[^a-z0-9]+/g, '-')
//       .replace(/^-+|-+$/g, '');
//     return `yourwebsite.com/blog/${slug}`;
//   }

//   toggleSourcesSection() {
//     this.sourcesExpanded.set(!this.sourcesExpanded());
//   }

//   // Form validation helpers
//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.postForm.get(fieldName);
//     return field ? field.invalid && (field.dirty || field.touched) : false;
//   }

//   getFieldError(fieldName: string): string {
//     const field = this.postForm.get(fieldName);
//     if (!field || !field.errors) return '';
    
//     if (field.errors['required']) return 'This field is required';
//     if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
//     if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters allowed`;
//     if (field.errors['invalidUrl']) return 'Please enter a valid URL';
    
//     return 'Invalid field value';
//   }
// }
