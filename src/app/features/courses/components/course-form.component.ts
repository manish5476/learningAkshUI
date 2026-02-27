import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Course, Category } from '../../../core/models/course.model';
import { CategoryService } from '../../../core/services/category.service';
import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="course-form-container">
      <form [formGroup]="courseForm" (ngSubmit)="onSubmit()" class="course-form">
        <!-- Header with Actions -->
        <div class="form-header">
          <div class="header-left">
            <h2 class="form-title">{{ isEditMode ? 'Edit Course' : 'Create New Course' }}</h2>
            <p class="form-subtitle">Fill in the details below to {{ isEditMode ? 'update' : 'create' }} your course</p>
          </div>
          <div class="header-actions">
            <button type="button" class="btn btn-secondary" (click)="onCancel()">
              <i class="fas fa-times"></i> Cancel
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="courseForm.invalid || isLoading">
              <i class="fas" [class.fa-save]="!isLoading" [class.fa-spinner]="isLoading"></i>
              {{ isLoading ? 'Saving...' : (isEditMode ? 'Update Course' : 'Create Course') }}
            </button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="form-progress">
          <div class="progress-steps">
            <div class="step" [class.active]="currentStep >= 1" [class.completed]="currentStep > 1">
              <span class="step-number">1</span>
              <span class="step-label">Basic Info</span>
            </div>
            <div class="step-line"></div>
            <div class="step" [class.active]="currentStep >= 2" [class.completed]="currentStep > 2">
              <span class="step-number">2</span>
              <span class="step-label">Content</span>
            </div>
            <div class="step-line"></div>
            <div class="step" [class.active]="currentStep >= 3" [class.completed]="currentStep > 3">
              <span class="step-number">3</span>
              <span class="step-label">Pricing</span>
            </div>
            <div class="step-line"></div>
            <div class="step" [class.active]="currentStep >= 4">
              <span class="step-number">4</span>
              <span class="step-label">Requirements</span>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="step-navigation">
          @if (currentStep > 1) {
            <button type="button" class="btn btn-text" (click)="prevStep()">
              <i class="fas fa-chevron-left"></i> Previous
            </button>
          }
          @if (currentStep < 4) {
            <button type="button" class="btn btn-text" (click)="nextStep()">
              Next <i class="fas fa-chevron-right"></i>
            </button>
          }
        </div>

        <!-- Step 1: Basic Information -->
        @if (currentStep === 1) {
          <div class="form-step">
            <div class="step-header">
              <h3>Basic Information</h3>
              <p>Tell us about your course</p>
            </div>

            <div class="form-grid">
              <!-- Title -->
              <div class="form-group full-width">
                <label class="input-label">
                  Course Title <span class="required">*</span>
                  <span class="hint">(50-100 characters recommended for SEO)</span>
                </label>
                <div class="input-wrapper">
                  <i class="field-icon fas fa-heading"></i>
                  <input 
                    type="text" 
                    formControlName="title" 
                    placeholder="e.g., Complete Web Development Bootcamp 2024"
                    class="form-control"
                    [class.error]="isFieldInvalid('title')"
                  >
                </div>
                <div class="character-count" [class.error]="titleLength > 100">
                  {{ titleLength }}/100 characters
                </div>
                @if (isFieldInvalid('title')) {
                  <div class="error-message">
                    Title is required
                  </div>
                }
              </div>

              <!-- Subtitle -->
              <div class="form-group full-width">
                <label class="input-label">
                  Subtitle
                  <span class="hint">(Brief description that appears under the title)</span>
                </label>
                <div class="input-wrapper">
                  <i class="field-icon fas fa-quote-right"></i>
                  <input 
                    type="text" 
                    formControlName="subtitle" 
                    placeholder="e.g., Learn HTML, CSS, JavaScript, React, Node.js and more"
                    class="form-control"
                  >
                </div>
              </div>

              <!-- Category -->
              <div class="form-group">
                <label class="input-label">Category <span class="required">*</span></label>
                <div class="select-wrapper">
                  <i class="field-icon fas fa-folder"></i>
                  <select formControlName="category" class="form-control" [class.error]="isFieldInvalid('category')">
                    <option value="">Select a category</option>
                    @for (cat of categories; track cat._id) {
                      <option [value]="cat._id">
                        {{ cat.name }}
                      </option>
                    }
                  </select>
                  <i class="select-arrow fas fa-chevron-down"></i>
                </div>
                @if (isFieldInvalid('category')) {
                  <div class="error-message">
                    Category is required
                  </div>
                }
              </div>

              <!-- Level -->
              <div class="form-group">
                <label class="input-label">Difficulty Level <span class="required">*</span></label>
                <div class="select-wrapper">
                  <i class="field-icon fas fa-signal"></i>
                  <select formControlName="level" class="form-control" [class.error]="isFieldInvalid('level')">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="all-levels">All Levels</option>
                  </select>
                  <i class="select-arrow fas fa-chevron-down"></i>
                </div>
              </div>

              <!-- Language -->
              <div class="form-group">
                <label class="input-label">Language <span class="required">*</span></label>
                <div class="select-wrapper">
                  <i class="field-icon fas fa-globe"></i>
                  <select formControlName="language" class="form-control">
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                  <i class="select-arrow fas fa-chevron-down"></i>
                </div>
              </div>

              <!-- Description -->
              <div class="form-group full-width">
                <label class="input-label">
                  Course Description <span class="required">*</span>
                  <span class="hint">(Minimum 100 words recommended)</span>
                </label>
                <div class="textarea-wrapper">
                  <i class="field-icon fas fa-align-left"></i>
                  <textarea 
                    formControlName="description" 
                    rows="8"
                    placeholder="Describe what students will learn, prerequisites, and what makes your course unique..."
                    class="form-control"
                    [class.error]="isFieldInvalid('description')"
                  ></textarea>
                </div>
                <div class="word-count" [class.error]="wordCount < 50">
                  {{ wordCount }} words (minimum 50)
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Step 2: Course Content -->
        @if (currentStep === 2) {
          <div class="form-step">
            <div class="step-header">
              <h3>Course Content</h3>
              <p>Upload your course media and organize sections</p>
            </div>

            <div class="form-grid">
              <!-- Thumbnail Upload -->
              <div class="form-group full-width">
                <label class="input-label">Course Thumbnail</label>
                <div class="upload-area" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event, 'thumbnail')">
                  <input #fileInput type="file" accept="image/*" style="display: none" (change)="onFileSelected($event, 'thumbnail')">
                  
                  @if (!thumbnailPreview) {
                    <div class="upload-placeholder">
                      <i class="fas fa-cloud-upload-alt"></i>
                      <p>Drag & drop or click to upload</p>
                      <span class="upload-hint">Recommended: 1280x720px (16:9 ratio)</span>
                    </div>
                  } @else {
                    <div class="upload-preview">
                      <img [src]="thumbnailPreview" alt="Thumbnail preview">
                      <button type="button" class="remove-btn" (click)="removeThumbnail($event)">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  }
                </div>
              </div>

              <!-- Preview Video -->
              <div class="form-group full-width">
                <label class="input-label">Preview Video URL</label>
                <div class="input-wrapper">
                  <i class="field-icon fas fa-video"></i>
                  <input 
                    type="url" 
                    formControlName="previewVideo" 
                    placeholder="https://www.youtube.com/watch?v=..."
                    class="form-control"
                  >
                </div>
                <span class="hint">Supported: YouTube, Vimeo, or direct video URL</span>
              </div>

              <!-- Sections (Dynamic) -->
              <div class="form-group full-width">
                <label class="input-label">Course Sections</label>
                <div class="sections-container">
                  @for (section of sections.controls; track i; let i = $index) {
                    <div class="section-item">
                      <div class="section-header">
                        <i class="fas fa-grip-vertical drag-handle"></i>
                        <input 
                          type="text" 
                          [formControl]="getSectionControl(i, 'title')"
                          placeholder="Section title"
                          class="section-input"
                        >
                        <button type="button" class="btn-icon" (click)="removeSection(i)">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                      <div class="section-lessons">
                        @for (lesson of getLessons(i).controls; track j; let j = $index) {
                          <div class="lesson-item">
                            <i class="fas fa-grip-vertical drag-handle"></i>
                            <i class="fas" 
                               [class.fa-video]="getLessonControl(i, j, 'type').value === 'video'"
                               [class.fa-file-alt]="getLessonControl(i, j, 'type').value === 'article'"
                               [class.fa-question-circle]="getLessonControl(i, j, 'type').value === 'quiz'"></i>
                            <input 
                              type="text" 
                              [formControl]="getLessonControl(i, j, 'title')"
                              placeholder="Lesson title"
                              class="lesson-input"
                            >
                            <select [formControl]="getLessonControl(i, j, 'type')" class="lesson-type">
                              <option value="video">Video</option>
                              <option value="article">Article</option>
                              <option value="quiz">Quiz</option>
                            </select>
                            <button type="button" class="btn-icon" (click)="removeLesson(i, j)">
                              <i class="fas fa-times"></i>
                            </button>
                          </div>
                        }
                        <button type="button" class="btn-add-lesson" (click)="addLesson(i)">
                          <i class="fas fa-plus"></i> Add Lesson
                        </button>
                      </div>
                    </div>
                  }
                  <button type="button" class="btn-add-section" (click)="addSection()">
                    <i class="fas fa-plus-circle"></i> Add New Section
                  </button>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Step 3: Pricing -->
        @if (currentStep === 3) {
          <div class="form-step">
            <div class="step-header">
              <h3>Pricing</h3>
              <p>Set your course price and discounts</p>
            </div>

            <div class="form-grid">
              <!-- Free Course Toggle -->
              <div class="form-group full-width">
                <label class="toggle-label">
                  <input type="checkbox" formControlName="isFree" (change)="onFreeToggle()">
                  <span class="toggle-text">Make this course free</span>
                </label>
              </div>

              <!-- Price -->
              @if (!courseForm.get('isFree')?.value) {
                <div class="form-group">
                  <label class="input-label">Price <span class="required">*</span></label>
                  <div class="input-wrapper">
                    <i class="field-icon fas fa-dollar-sign"></i>
                    <input 
                      type="number" 
                      formControlName="price" 
                      min="0"
                      step="0.01"
                      class="form-control"
                      [class.error]="isFieldInvalid('price')"
                    >
                  </div>
                </div>

                <!-- Currency -->
                <div class="form-group">
                  <label class="input-label">Currency</label>
                  <div class="select-wrapper">
                    <i class="field-icon fas fa-money-bill"></i>
                    <select formControlName="currency" class="form-control">
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="INR">INR - Indian Rupee</option>
                    </select>
                    <i class="select-arrow fas fa-chevron-down"></i>
                  </div>
                </div>

                <!-- Discount Section -->
                <div class="form-group full-width">
                  <label class="toggle-label">
                    <input type="checkbox" [checked]="hasDiscount" (change)="toggleDiscount()">
                    <span class="toggle-text">Add discount</span>
                  </label>
                </div>

                @if (hasDiscount) {
                  <!-- Discount Price -->
                  <div class="form-group">
                    <label class="input-label">Discounted Price</label>
                    <div class="input-wrapper">
                      <i class="field-icon fas fa-tag"></i>
                      <input 
                        type="number" 
                        formControlName="discountPrice" 
                        min="0"
                        step="0.01"
                        class="form-control"
                      >
                    </div>
                  </div>

                  <!-- Discount Dates -->
                  <div class="form-group">
                    <label class="input-label">Discount Start Date</label>
                    <div class="input-wrapper">
                      <i class="field-icon fas fa-calendar"></i>
                      <input 
                        type="date" 
                        formControlName="discountStartDate"
                        class="form-control"
                      >
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="input-label">Discount End Date</label>
                    <div class="input-wrapper">
                      <i class="field-icon fas fa-calendar-check"></i>
                      <input 
                        type="date" 
                        formControlName="discountEndDate"
                        class="form-control"
                      >
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        }

        <!-- Step 4: Requirements & Outcomes -->
        @if (currentStep === 4) {
          <div class="form-step">
            <div class="step-header">
              <h3>Requirements & Outcomes</h3>
              <p>Define what students need and what they'll learn</p>
            </div>

            <div class="form-grid">
              <!-- Requirements -->
              <div class="form-group full-width">
                <label class="input-label">Requirements</label>
                <p class="field-hint">What students need to know before taking this course</p>
                
                <div class="array-container">
                  @for (req of requirements.controls; track i; let i = $index) {
                    <div class="array-item">
                      <input 
                        type="text" 
                        [formControl]="getAsFormControl(req)"
                        placeholder="e.g., Basic programming knowledge"
                        class="array-input"
                      >
                      <button type="button" class="btn-icon" (click)="removeRequirement(i)">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  }
                  <button type="button" class="btn-add-item" (click)="addRequirement()">
                    <i class="fas fa-plus"></i> Add Requirement
                  </button>
                </div>
              </div>

              <!-- What You'll Learn -->
              <div class="form-group full-width">
                <label class="input-label">What You'll Learn <span class="required">*</span></label>
                <p class="field-hint">Key takeaways students will get from this course</p>
                
                <div class="array-container">
                  @for (item of whatYouWillLearn.controls; track i; let i = $index) {
                    <div class="array-item">
                      <input 
                        type="text" 
                        [formControl]="getAsFormControl(item)"
                        placeholder="e.g., Build full-stack web applications"
                        class="array-input"
                        [class.error]="item.invalid && item.touched"
                      >
                      <button type="button" class="btn-icon" (click)="removeLearningItem(i)">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  }
                  <button type="button" class="btn-add-item" (click)="addLearningItem()">
                    <i class="fas fa-plus"></i> Add Learning Outcome
                  </button>
                </div>
              </div>

              <!-- Target Audience -->
              <div class="form-group full-width">
                <label class="input-label">Target Audience</label>
                <p class="field-hint">Who is this course for?</p>
                
                <div class="array-container">
                  @for (audience of targetAudience.controls; track i; let i = $index) {
                    <div class="array-item">
                      <input 
                        type="text" 
                        [formControl]="getAsFormControl(audience)"
                        placeholder="e.g., Beginner developers"
                        class="array-input"
                      >
                      <button type="button" class="btn-icon" (click)="removeAudience(i)">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  }
                  <button type="button" class="btn-add-item" (click)="addAudience()">
                    <i class="fas fa-plus"></i> Add Target Audience
                  </button>
                </div>
              </div>

              <!-- Tags -->
              <div class="form-group full-width">
                <label class="input-label">Tags</label>
                <p class="field-hint">Help students find your course (press Enter to add)</p>
                
                <div class="tags-container">
                  <div class="tags-list">
                    @for (tag of tags.controls; track i; let i = $index) {
                      <span class="tag-item">
                        {{ tag.value }}
                        <button type="button" class="tag-remove" (click)="removeTag(i)">
                          <i class="fas fa-times"></i>
                        </button>
                      </span>
                    }
                  </div>
                  <input 
                    type="text" 
                    #tagInput
                    placeholder="Add a tag"
                    class="tag-input"
                    (keydown.enter)="addTag($event)"
                  >
                </div>
              </div>
            </div>
          </div>
        }
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      background: var(--bg-primary);
    }

    .course-form-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--spacing-3xl);
    }

    /* Form Header */
    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-2xl);
    }

    .form-title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xs);
    }

    .form-subtitle {
      font-size: var(--font-size-base);
      color: var(--text-secondary);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-md);
    }

    /* Buttons */
    .btn {
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--ui-border-radius);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-medium);
      border: var(--ui-border-width) solid transparent;
      cursor: pointer;
      transition: var(--transition-base);
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .btn:disabled {
      opacity: var(--state-disabled-opacity);
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--accent-primary);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--accent-hover);
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .btn-secondary {
      background: transparent;
      border-color: var(--border-secondary);
      color: var(--text-secondary);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--bg-secondary);
      border-color: var(--border-primary);
      color: var(--text-primary);
    }

    .btn-text {
      background: transparent;
      color: var(--accent-primary);
      padding: var(--spacing-sm) var(--spacing-lg);
    }

    .btn-text:hover:not(:disabled) {
      background: var(--accent-focus);
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border-radius: var(--ui-border-radius-sm);
      border: none;
      background: transparent;
      color: var(--text-tertiary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition-fast);
    }

    .btn-icon:hover {
      background: var(--bg-hover);
      color: var(--color-error);
    }

    /* Progress Steps */
    .form-progress {
      margin-bottom: var(--spacing-2xl);
      padding: var(--spacing-lg) 0;
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
    }

    .progress-steps {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 800px;
      margin: 0 auto;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-xs);
      position: relative;
      flex: 1;
    }

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-secondary);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      transition: var(--transition-base);
    }

    .step.active .step-number {
      background: var(--accent-primary);
      border-color: var(--accent-primary);
      color: white;
    }

    .step.completed .step-number {
      background: var(--color-success);
      border-color: var(--color-success);
      color: white;
    }

    .step-label {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      font-weight: var(--font-weight-medium);
    }

    .step.active .step-label {
      color: var(--accent-primary);
    }

    .step-line {
      flex: 1;
      height: 2px;
      background: var(--border-secondary);
      margin: 0 var(--spacing-sm);
    }

    /* Step Navigation */
    .step-navigation {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--spacing-xl);
    }

    /* Form Steps */
    .form-step {
      animation: slideIn 0.3s ease;
    }

    .step-header {
      margin-bottom: var(--spacing-xl);
    }

    .step-header h3 {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xs);
    }

    .step-header p {
      font-size: var(--font-size-base);
      color: var(--text-secondary);
      margin: 0;
    }

    /* Form Grid */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-xl);
    }

    .full-width {
      grid-column: 1 / -1;
    }

    /* Form Groups */
    .form-group {
      position: relative;
    }

    .input-label {
      display: block;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
      margin-bottom: var(--spacing-xs);
    }

    .required {
      color: var(--color-error);
      margin-left: var(--spacing-xs);
    }

    .hint, .field-hint {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      margin-left: var(--spacing-sm);
    }

    .field-hint {
      display: block;
      margin: var(--spacing-xs) 0 var(--spacing-sm);
    }

    /* Input Wrappers */
    .input-wrapper, .select-wrapper, .textarea-wrapper {
      position: relative;
    }

    .field-icon {
      position: absolute;
      left: var(--spacing-md);
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
      pointer-events: none;
      z-index: 1;
    }

    .textarea-wrapper .field-icon {
      top: var(--spacing-md);
      transform: none;
    }

    /* Form Controls */
    .form-control {
      width: 100%;
      padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) calc(var(--spacing-xl) * 2);
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      color: var(--text-primary);
      font-size: var(--font-size-md);
      line-height: var(--line-height-normal);
      transition: var(--transition-base);
    }

    .form-control:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 var(--focus-ring-width) var(--accent-focus);
    }

    .form-control.error {
      border-color: var(--color-error);
    }

    .form-control.error:focus {
      box-shadow: 0 0 0 var(--focus-ring-width) var(--color-error-bg);
    }

    textarea.form-control {
      resize: vertical;
      min-height: 120px;
    }

    select.form-control {
      appearance: none;
      padding-right: var(--spacing-3xl);
    }

    .select-arrow {
      position: absolute;
      right: var(--spacing-md);
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
      pointer-events: none;
      font-size: var(--font-size-xs);
    }

    /* Character and Word Count */
    .character-count, .word-count {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      margin-top: var(--spacing-xs);
      text-align: right;
    }

    .character-count.error, .word-count.error {
      color: var(--color-warning);
    }

    /* Error Messages */
    .error-message {
      font-size: var(--font-size-xs);
      color: var(--color-error);
      margin-top: var(--spacing-xs);
    }

    /* Upload Area */
    .upload-area {
      border: 2px dashed var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-3xl);
      text-align: center;
      cursor: pointer;
      transition: var(--transition-base);
      background: var(--bg-secondary);
      position: relative;
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .upload-area:hover {
      border-color: var(--accent-primary);
      background: var(--bg-hover);
    }

    .upload-placeholder i {
      font-size: 48px;
      color: var(--text-tertiary);
      margin-bottom: var(--spacing-md);
    }

    .upload-placeholder p {
      font-size: var(--font-size-lg);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xs);
    }

    .upload-hint {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }

    .upload-preview {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .upload-preview img {
      max-width: 100%;
      max-height: 200px;
      border-radius: var(--ui-border-radius);
    }

    .remove-btn {
      position: absolute;
      top: var(--spacing-xs);
      right: var(--spacing-xs);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-error);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition-fast);
    }

    .remove-btn:hover {
      transform: scale(1.1);
      background: var(--color-error-dark);
    }

    /* Sections Container */
    .sections-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
    }

    .section-item {
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      background: var(--bg-ternary);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
    }

    .drag-handle {
      color: var(--text-tertiary);
      cursor: move;
    }

    .section-input {
      flex: 1;
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-sm);
      color: var(--text-primary);
      font-size: var(--font-size-md);
    }

    .section-lessons {
      padding: var(--spacing-md);
    }

    .lesson-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-sm);
      margin-bottom: var(--spacing-sm);
    }

    .lesson-input {
      flex: 1;
      padding: var(--spacing-sm);
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: var(--font-size-sm);
    }

    .lesson-input:focus {
      outline: none;
      background: var(--bg-hover);
      border-radius: var(--ui-border-radius-sm);
    }

    .lesson-type {
      width: 100px;
      padding: var(--spacing-sm);
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-sm);
      color: var(--text-primary);
      font-size: var(--font-size-xs);
    }

    .btn-add-lesson, .btn-add-section, .btn-add-item {
      width: 100%;
      padding: var(--spacing-sm);
      background: transparent;
      border: var(--ui-border-width) dashed var(--border-secondary);
      border-radius: var(--ui-border-radius);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      cursor: pointer;
      transition: var(--transition-base);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
    }

    .btn-add-lesson:hover, .btn-add-section:hover, .btn-add-item:hover {
      border-color: var(--accent-primary);
      color: var(--accent-primary);
      background: var(--accent-focus);
    }

    .btn-add-section {
      margin-top: var(--spacing-md);
      padding: var(--spacing-md);
    }

    /* Toggle Label */
    .toggle-label {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      cursor: pointer;
      user-select: none;
    }

    .toggle-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .toggle-text {
      font-size: var(--font-size-md);
      color: var(--text-primary);
    }

    /* Array Container */
    .array-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .array-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      background: var(--bg-secondary);
      padding: var(--spacing-sm);
      border-radius: var(--ui-border-radius);
      border: var(--ui-border-width) solid var(--border-secondary);
    }

    .array-input {
      flex: 1;
      padding: var(--spacing-sm);
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: var(--font-size-sm);
    }

    .array-input:focus {
      outline: none;
    }

    .array-input.error {
      color: var(--color-error);
    }

    /* Tags Container */
    .tags-container {
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-sm);
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-sm);
    }

    .tag-item {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      background: var(--bg-ternary);
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-sm);
      color: var(--text-primary);
      font-size: var(--font-size-xs);
    }

    .tag-remove {
      background: transparent;
      border: none;
      color: var(--text-tertiary);
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tag-remove:hover {
      color: var(--color-error);
    }

    .tag-input {
      width: 100%;
      padding: var(--spacing-sm);
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: var(--font-size-sm);
    }

    .tag-input:focus {
      outline: none;
    }

    /* Animations */
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .course-form-container {
        padding: var(--spacing-xl);
      }

      .form-header {
        flex-direction: column;
        gap: var(--spacing-md);
        align-items: flex-start;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .progress-steps {
        flex-direction: column;
        gap: var(--spacing-md);
        align-items: flex-start;
      }

      .step {
        flex-direction: row;
        width: 100%;
      }

      .step-line {
        display: none;
      }
    }
  `]
})
export class CourseFormComponent implements OnInit, OnDestroy {
  @Input() courseId?: string;
  @Output() saved = new EventEmitter<Course>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  courseForm!: FormGroup;
  categories: Category[] = [];
  isLoading = false;
  isEditMode = false;
  currentStep = 1;

  thumbnailPreview: string | null = null;
  hasDiscount = false;

  // Form arrays
  sections = this.fb.array([]);
  
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    
    if (this.courseId) {
      this.isEditMode = true;
      this.loadCourse();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initForm(): void {
    this.courseForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      subtitle: ['', Validators.maxLength(200)],
      description: ['', [Validators.required, Validators.minLength(50)]],
      category: ['', Validators.required],
      level: ['beginner'],
      language: ['English'],
      thumbnail: [''],
      previewVideo: [''],
      price: [0, [Validators.min(0)]],
      discountPrice: [null],
      discountStartDate: [null],
      discountEndDate: [null],
      isFree: [false],
      currency: ['USD'],
      requirements: this.fb.array([]),
      whatYouWillLearn: this.fb.array([]),
      targetAudience: this.fb.array([]),
      tags: this.fb.array([])
    });

    // Add initial items
    this.addLearningItem(); // At least one learning outcome
  }

  private loadCategories(): void {
    const sub = this.categoryService.getAll({ isActive: true }).subscribe({
      next: (res: any) => {
        this.categories = res.data || [];
      },
      error: (error: any) => {
        console.error('Failed to load categories', error);
      }
    });
    this.subscriptions.push(sub);
  }

  private loadCourse(): void {
    if (!this.courseId) return;

    this.isLoading = true;
    const sub = this.courseService.getById(this.courseId).subscribe({
      next: (res: any) => {
        const course = res.data;
        if (course) {
          this.patchForm(course);
          if (course.thumbnail) {
            this.thumbnailPreview = course.thumbnail;
          }
          if (course.discountPrice) {
            this.hasDiscount = true;
          }
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Failed to load course', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private patchForm(course: any): void {
    // Clear arrays first
    while (this.requirements.length) this.requirements.removeAt(0);
    while (this.whatYouWillLearn.length) this.whatYouWillLearn.removeAt(0);
    while (this.targetAudience.length) this.targetAudience.removeAt(0);
    while (this.tags.length) this.tags.removeAt(0);

    // Patch values
    this.courseForm.patchValue({
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      category: course.category,
      level: course.level,
      language: course.language,
      thumbnail: course.thumbnail,
      previewVideo: course.previewVideo,
      price: course.price,
      discountPrice: course.discountPrice,
      discountStartDate: course.discountStartDate ? this.formatDate(course.discountStartDate) : null,
      discountEndDate: course.discountEndDate ? this.formatDate(course.discountEndDate) : null,
      isFree: course.isFree,
      currency: course.currency
    });

    // Add arrays
    course.requirements?.forEach((req: string) => {
      this.requirements.push(this.fb.control(req));
    });

    course.whatYouWillLearn?.forEach((item: string) => {
      this.whatYouWillLearn.push(this.fb.control(item, Validators.required));
    });

    course.targetAudience?.forEach((audience: string) => {
      this.targetAudience.push(this.fb.control(audience));
    });

    course.tags?.forEach((tag: string) => {
      this.tags.push(this.fb.control(tag));
    });
  }

  private formatDate(date: string): string {
    return new Date(date).toISOString().split('T')[0];
  }

  // Helper method to cast AbstractControl to FormControl
  getAsFormControl(control: AbstractControl): FormControl {
    return control as FormControl;
  }

  getSectionControl(sectionIndex: number, controlName: string): FormControl {
  return this.sections.at(sectionIndex).get(controlName) as FormControl;
}

getLessonControl(sectionIndex: number, lessonIndex: number, controlName: string): FormControl {
  return this.getLessons(sectionIndex).at(lessonIndex).get(controlName) as FormControl;
}
  // Getters
  get titleLength(): number {
    return this.courseForm.get('title')?.value?.length || 0;
  }

  get wordCount(): number {
    const description = this.courseForm.get('description')?.value || '';
    return description.trim().split(/\s+/).filter(Boolean).length;
  }

  get requirements() {
    return this.courseForm.get('requirements') as FormArray;
  }

  get whatYouWillLearn() {
    return this.courseForm.get('whatYouWillLearn') as FormArray;
  }

  get targetAudience() {
    return this.courseForm.get('targetAudience') as FormArray;
  }

  get tags() {
    return this.courseForm.get('tags') as FormArray;
  }

  // Form Validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.courseForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  // Navigation
  nextStep(): void {
    if (this.currentStep < 4) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

 addSection(): void {
  const sectionForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    order: [this.sections.length],
    lessons: this.fb.array([])
  });
  
  (this.sections as FormArray).push(sectionForm);
}

  removeSection(index: number): void {
    this.sections.removeAt(index);
    // Update orders
    this.sections.controls.forEach((control, i) => {
      control.get('order')?.setValue(i);
    });
  }

//   getSectionControl(index: number, controlName: string): AbstractControl {
//     return this.sections.at(index).get(controlName)!;
//   }

//   getLessonControl(sectionIndex: number, lessonIndex: number, controlName: string): AbstractControl {
//     return this.getLessons(sectionIndex).at(lessonIndex).get(controlName)!;
//   }

  getLessons(sectionIndex: number): FormArray {
    return this.sections.at(sectionIndex).get('lessons') as FormArray;
  }

  addLesson(sectionIndex: number): void {
    const lessonForm = this.fb.group({
      title: ['', Validators.required],
      type: ['video'],
      duration: [0],
      isFree: [false],
      order: [this.getLessons(sectionIndex).length]
    });
    this.getLessons(sectionIndex).push(lessonForm);
  }

  removeLesson(sectionIndex: number, lessonIndex: number): void {
    this.getLessons(sectionIndex).removeAt(lessonIndex);
    // Update orders
    this.getLessons(sectionIndex).controls.forEach((control, i) => {
      control.get('order')?.setValue(i);
    });
  }

  // Array Management
  addRequirement(): void {
    this.requirements.push(this.fb.control(''));
  }

  removeRequirement(index: number): void {
    this.requirements.removeAt(index);
  }

  addLearningItem(): void {
    this.whatYouWillLearn.push(this.fb.control('', Validators.required));
  }

  removeLearningItem(index: number): void {
    this.whatYouWillLearn.removeAt(index);
  }

  addAudience(): void {
    this.targetAudience.push(this.fb.control(''));
  }

  removeAudience(index: number): void {
    this.targetAudience.removeAt(index);
  }

  addTag(event: any): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    
    if (value && event.key === 'Enter') {
      event.preventDefault();
      this.tags.push(this.fb.control(value));
      input.value = '';
    }
  }

  removeTag(index: number): void {
    this.tags.removeAt(index);
  }

  // File Upload
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent, type: string): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0], type);
    }
  }

  onFileSelected(event: Event, type: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0], type);
    }
  }

  private handleFile(file: File, type: string): void {
    if (type === 'thumbnail' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.thumbnailPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
      
      // Here you would upload the file to your server
      // this.uploadService.uploadThumbnail(file).subscribe(...)
    }
  }

  removeThumbnail(event: Event): void {
    event.stopPropagation();
    this.thumbnailPreview = null;
    this.courseForm.patchValue({ thumbnail: '' });
  }

  // Pricing
  onFreeToggle(): void {
    const isFree = this.courseForm.get('isFree')?.value;
    if (isFree) {
      this.courseForm.patchValue({ price: 0 });
      this.courseForm.get('price')?.disable();
    } else {
      this.courseForm.get('price')?.enable();
    }
  }

  toggleDiscount(): void {
    this.hasDiscount = !this.hasDiscount;
    if (!this.hasDiscount) {
      this.courseForm.patchValue({
        discountPrice: null,
        discountStartDate: null,
        discountEndDate: null
      });
    }
  }

  // Submit
  onSubmit(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      // Find first invalid step and navigate to it
      if (this.courseForm.get('title')?.invalid) this.currentStep = 1;
      else if (this.courseForm.get('description')?.invalid) this.currentStep = 1;
      else if (this.courseForm.get('category')?.invalid) this.currentStep = 1;
      else if (this.whatYouWillLearn.length === 0) this.currentStep = 4;
      return;
    }

    this.isLoading = true;
    const formData = this.courseForm.value;

    const request = this.isEditMode && this.courseId
      ? this.courseService.update(this.courseId, formData)
      : this.courseService.create(formData);

    const sub = (request as any).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.saved.emit(res.data?.course || res.data);
      },
      error: (error: any) => {
        console.error('Failed to save course', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
// import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
// import { Router } from '@angular/router';
// import { Subscription, Observable } from 'rxjs';
// import { Course, Category } from '../../../core/models/course.model';
// import { CategoryService } from '../../../core/services/category.service';
// import { CourseService } from '../../../core/services/course.service';


// @Component({
//   selector: 'app-course-form',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   template: `
//     <div class="course-form-container">
//       <form [formGroup]="courseForm" (ngSubmit)="onSubmit()" class="course-form">
//         <!-- Header with Actions -->
//         <div class="form-header">
//           <div class="header-left">
//             <h2 class="form-title">{{ isEditMode ? 'Edit Course' : 'Create New Course' }}</h2>
//             <p class="form-subtitle">Fill in the details below to {{ isEditMode ? 'update' : 'create' }} your course</p>
//           </div>
//           <div class="header-actions">
//             <button type="button" class="btn btn-secondary" (click)="onCancel()">
//               <i class="fas fa-times"></i> Cancel
//             </button>
//             <button type="submit" class="btn btn-primary" [disabled]="courseForm.invalid || isLoading">
//               <i class="fas" [class.fa-save]="!isLoading" [class.fa-spinner]="isLoading"></i>
//               {{ isLoading ? 'Saving...' : (isEditMode ? 'Update Course' : 'Create Course') }}
//             </button>
//           </div>
//         </div>

//         <!-- Progress Bar -->
//         <div class="form-progress">
//           <div class="progress-steps">
//             <div class="step" [class.active]="currentStep >= 1" [class.completed]="currentStep > 1">
//               <span class="step-number">1</span>
//               <span class="step-label">Basic Info</span>
//             </div>
//             <div class="step-line"></div>
//             <div class="step" [class.active]="currentStep >= 2" [class.completed]="currentStep > 2">
//               <span class="step-number">2</span>
//               <span class="step-label">Content</span>
//             </div>
//             <div class="step-line"></div>
//             <div class="step" [class.active]="currentStep >= 3" [class.completed]="currentStep > 3">
//               <span class="step-number">3</span>
//               <span class="step-label">Pricing</span>
//             </div>
//             <div class="step-line"></div>
//             <div class="step" [class.active]="currentStep >= 4">
//               <span class="step-number">4</span>
//               <span class="step-label">Requirements</span>
//             </div>
//           </div>
//         </div>

//         <!-- Navigation Buttons -->
//         <div class="step-navigation">
//           <button type="button" class="btn btn-text" *ngIf="currentStep > 1" (click)="prevStep()">
//             <i class="fas fa-chevron-left"></i> Previous
//           </button>
//           <button type="button" class="btn btn-text" *ngIf="currentStep < 4" (click)="nextStep()">
//             Next <i class="fas fa-chevron-right"></i>
//           </button>
//         </div>

//         <!-- Step 1: Basic Information -->
//         <div class="form-step" *ngIf="currentStep === 1">
//           <div class="step-header">
//             <h3>Basic Information</h3>
//             <p>Tell us about your course</p>
//           </div>

//           <div class="form-grid">
//             <!-- Title -->
//             <div class="form-group full-width">
//               <label class="input-label">
//                 Course Title <span class="required">*</span>
//                 <span class="hint">(50-100 characters recommended for SEO)</span>
//               </label>
//               <div class="input-wrapper">
//                 <i class="field-icon fas fa-heading"></i>
//                 <input 
//                   type="text" 
//                   formControlName="title" 
//                   placeholder="e.g., Complete Web Development Bootcamp 2024"
//                   class="form-control"
//                   [class.error]="isFieldInvalid('title')"
//                 >
//               </div>
//               <div class="character-count" [class.error]="titleLength > 100">
//                 {{ titleLength }}/100 characters
//               </div>
//               <div class="error-message" *ngIf="isFieldInvalid('title')">
//                 Title is required
//               </div>
//             </div>

//             <!-- Subtitle -->
//             <div class="form-group full-width">
//               <label class="input-label">
//                 Subtitle
//                 <span class="hint">(Brief description that appears under the title)</span>
//               </label>
//               <div class="input-wrapper">
//                 <i class="field-icon fas fa-quote-right"></i>
//                 <input 
//                   type="text" 
//                   formControlName="subtitle" 
//                   placeholder="e.g., Learn HTML, CSS, JavaScript, React, Node.js and more"
//                   class="form-control"
//                 >
//               </div>
//             </div>

//             <!-- Category -->
//             <div class="form-group">
//               <label class="input-label">Category <span class="required">*</span></label>
//               <div class="select-wrapper">
//                 <i class="field-icon fas fa-folder"></i>
//                 <select formControlName="category" class="form-control" [class.error]="isFieldInvalid('category')">
//                   <option value="">Select a category</option>
//                   <option *ngFor="let cat of categories" [value]="cat._id">
//                     {{ cat.name }}
//                   </option>
//                 </select>
//                 <i class="select-arrow fas fa-chevron-down"></i>
//               </div>
//               <div class="error-message" *ngIf="isFieldInvalid('category')">
//                 Category is required
//               </div>
//             </div>

//             <!-- Level -->
//             <div class="form-group">
//               <label class="input-label">Difficulty Level <span class="required">*</span></label>
//               <div class="select-wrapper">
//                 <i class="field-icon fas fa-signal"></i>
//                 <select formControlName="level" class="form-control" [class.error]="isFieldInvalid('level')">
//                   <option value="beginner">Beginner</option>
//                   <option value="intermediate">Intermediate</option>
//                   <option value="advanced">Advanced</option>
//                   <option value="all-levels">All Levels</option>
//                 </select>
//                 <i class="select-arrow fas fa-chevron-down"></i>
//               </div>
//             </div>

//             <!-- Language -->
//             <div class="form-group">
//               <label class="input-label">Language <span class="required">*</span></label>
//               <div class="select-wrapper">
//                 <i class="field-icon fas fa-globe"></i>
//                 <select formControlName="language" class="form-control">
//                   <option value="English">English</option>
//                   <option value="Spanish">Spanish</option>
//                   <option value="French">French</option>
//                   <option value="German">German</option>
//                   <option value="Chinese">Chinese</option>
//                   <option value="Japanese">Japanese</option>
//                   <option value="Arabic">Arabic</option>
//                 </select>
//                 <i class="select-arrow fas fa-chevron-down"></i>
//               </div>
//             </div>

//             <!-- Description -->
//             <div class="form-group full-width">
//               <label class="input-label">
//                 Course Description <span class="required">*</span>
//                 <span class="hint">(Minimum 100 words recommended)</span>
//               </label>
//               <div class="textarea-wrapper">
//                 <i class="field-icon fas fa-align-left"></i>
//                 <textarea 
//                   formControlName="description" 
//                   rows="8"
//                   placeholder="Describe what students will learn, prerequisites, and what makes your course unique..."
//                   class="form-control"
//                   [class.error]="isFieldInvalid('description')"
//                 ></textarea>
//               </div>
//               <div class="word-count" [class.error]="wordCount < 50">
//                 {{ wordCount }} words (minimum 50)
//               </div>
//             </div>
//           </div>
//         </div>

//         <!-- Step 2: Course Content -->
//         <div class="form-step" *ngIf="currentStep === 2">
//           <div class="step-header">
//             <h3>Course Content</h3>
//             <p>Upload your course media and organize sections</p>
//           </div>

//           <div class="form-grid">
//             <!-- Thumbnail Upload -->
//             <div class="form-group full-width">
//               <label class="input-label">Course Thumbnail</label>
//               <div class="upload-area" (click)="fileInput.click()" (dragover)="onDragOver($event)" (drop)="onDrop($event, 'thumbnail')">
//                 <input #fileInput type="file" accept="image/*" style="display: none" (change)="onFileSelected($event, 'thumbnail')">
//                 <div class="upload-placeholder" *ngIf="!thumbnailPreview">
//                   <i class="fas fa-cloud-upload-alt"></i>
//                   <p>Drag & drop or click to upload</p>
//                   <span class="upload-hint">Recommended: 1280x720px (16:9 ratio)</span>
//                 </div>
//                 <div class="upload-preview" *ngIf="thumbnailPreview">
//                   <img [src]="thumbnailPreview" alt="Thumbnail preview">
//                   <button type="button" class="remove-btn" (click)="removeThumbnail($event)">
//                     <i class="fas fa-times"></i>
//                   </button>
//                 </div>
//               </div>
//             </div>

//             <!-- Preview Video -->
//             <div class="form-group full-width">
//               <label class="input-label">Preview Video URL</label>
//               <div class="input-wrapper">
//                 <i class="field-icon fas fa-video"></i>
//                 <input 
//                   type="url" 
//                   formControlName="previewVideo" 
//                   placeholder="https://www.youtube.com/watch?v=..."
//                   class="form-control"
//                 >
//               </div>
//               <span class="hint">Supported: YouTube, Vimeo, or direct video URL</span>
//             </div>

//             <!-- Sections (Dynamic) -->
//             <div class="form-group full-width">
//               <label class="input-label">Course Sections</label>
//               <div class="sections-container">
//                 <div *ngFor="let section of sections.controls; let i = index" class="section-item">
//                   <div class="section-header">
//                     <i class="fas fa-grip-vertical drag-handle"></i>
//                     <input 
//                       type="text" 
//                       [formControl]="getSectionControl(i, 'title')"
//                       placeholder="Section title"
//                       class="section-input"
//                     >
//                     <button type="button" class="btn-icon" (click)="removeSection(i)">
//                       <i class="fas fa-trash"></i>
//                     </button>
//                   </div>
//                   <div class="section-lessons">
//                     <div *ngFor="let lesson of getLessons(i); let j = index" class="lesson-item">
//                       <i class="fas fa-grip-vertical drag-handle"></i>
//                       <i class="fas" [class.fa-video]="lesson.get('type')?.value === 'video'"
//                                    [class.fa-file-alt]="lesson.get('type')?.value === 'article'"
//                                    [class.fa-question-circle]="lesson.get('type')?.value === 'quiz'"></i>
//                       <input 
//                         type="text" 
//                         [formControl]="lesson.get('title')"
//                         placeholder="Lesson title"
//                         class="lesson-input"
//                       >
//                       <select [formControl]="lesson.get('type')" class="lesson-type">
//                         <option value="video">Video</option>
//                         <option value="article">Article</option>
//                         <option value="quiz">Quiz</option>
//                       </select>
//                       <button type="button" class="btn-icon" (click)="removeLesson(i, j)">
//                         <i class="fas fa-times"></i>
//                       </button>
//                     </div>
//                     <button type="button" class="btn-add-lesson" (click)="addLesson(i)">
//                       <i class="fas fa-plus"></i> Add Lesson
//                     </button>
//                   </div>
//                 </div>
//                 <button type="button" class="btn-add-section" (click)="addSection()">
//                   <i class="fas fa-plus-circle"></i> Add New Section
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         <!-- Step 3: Pricing -->
//         <div class="form-step" *ngIf="currentStep === 3">
//           <div class="step-header">
//             <h3>Pricing</h3>
//             <p>Set your course price and discounts</p>
//           </div>

//           <div class="form-grid">
//             <!-- Free Course Toggle -->
//             <div class="form-group full-width">
//               <label class="toggle-label">
//                 <input type="checkbox" formControlName="isFree" (change)="onFreeToggle()">
//                 <span class="toggle-text">Make this course free</span>
//               </label>
//             </div>

//             <!-- Price -->
//             <div class="form-group" *ngIf="!courseForm.get('isFree')?.value">
//               <label class="input-label">Price <span class="required">*</span></label>
//               <div class="input-wrapper">
//                 <i class="field-icon fas fa-dollar-sign"></i>
//                 <input 
//                   type="number" 
//                   formControlName="price" 
//                   min="0"
//                   step="0.01"
//                   class="form-control"
//                   [class.error]="isFieldInvalid('price')"
//                 >
//               </div>
//             </div>

//             <!-- Currency -->
//             <div class="form-group" *ngIf="!courseForm.get('isFree')?.value">
//               <label class="input-label">Currency</label>
//               <div class="select-wrapper">
//                 <i class="field-icon fas fa-money-bill"></i>
//                 <select formControlName="currency" class="form-control">
//                   <option value="USD">USD - US Dollar</option>
//                   <option value="EUR">EUR - Euro</option>
//                   <option value="GBP">GBP - British Pound</option>
//                   <option value="INR">INR - Indian Rupee</option>
//                 </select>
//                 <i class="select-arrow fas fa-chevron-down"></i>
//               </div>
//             </div>

//             <!-- Discount Section -->
//             <div class="form-group full-width" *ngIf="!courseForm.get('isFree')?.value">
//               <label class="toggle-label">
//                 <input type="checkbox" [checked]="hasDiscount" (change)="toggleDiscount()">
//                 <span class="toggle-text">Add discount</span>
//               </label>
//             </div>

//             <ng-container *ngIf="hasDiscount">
//               <!-- Discount Price -->
//               <div class="form-group">
//                 <label class="input-label">Discounted Price</label>
//                 <div class="input-wrapper">
//                   <i class="field-icon fas fa-tag"></i>
//                   <input 
//                     type="number" 
//                     formControlName="discountPrice" 
//                     min="0"
//                     step="0.01"
//                     class="form-control"
//                   >
//                 </div>
//               </div>

//               <!-- Discount Dates -->
//               <div class="form-group">
//                 <label class="input-label">Discount Start Date</label>
//                 <div class="input-wrapper">
//                   <i class="field-icon fas fa-calendar"></i>
//                   <input 
//                     type="date" 
//                     formControlName="discountStartDate"
//                     class="form-control"
//                   >
//                 </div>
//               </div>

//               <div class="form-group">
//                 <label class="input-label">Discount End Date</label>
//                 <div class="input-wrapper">
//                   <i class="field-icon fas fa-calendar-check"></i>
//                   <input 
//                     type="date" 
//                     formControlName="discountEndDate"
//                     class="form-control"
//                   >
//                 </div>
//               </div>
//             </ng-container>
//           </div>
//         </div>

//         <!-- Step 4: Requirements & Outcomes -->
//         <div class="form-step" *ngIf="currentStep === 4">
//           <div class="step-header">
//             <h3>Requirements & Outcomes</h3>
//             <p>Define what students need and what they'll learn</p>
//           </div>

//           <div class="form-grid">
//             <!-- Requirements -->
//             <div class="form-group full-width">
//               <label class="input-label">Requirements</label>
//               <p class="field-hint">What students need to know before taking this course</p>
              
//               <div class="array-container">
//                 <div *ngFor="let req of requirements.controls; let i = index" class="array-item">
//                   <input 
//                     type="text" 
//                     [formControl]="req"
//                     placeholder="e.g., Basic programming knowledge"
//                     class="array-input"
//                   >
//                   <button type="button" class="btn-icon" (click)="removeRequirement(i)">
//                     <i class="fas fa-times"></i>
//                   </button>
//                 </div>
//                 <button type="button" class="btn-add-item" (click)="addRequirement()">
//                   <i class="fas fa-plus"></i> Add Requirement
//                 </button>
//               </div>
//             </div>

//             <!-- What You'll Learn -->
//             <div class="form-group full-width">
//               <label class="input-label">What You'll Learn <span class="required">*</span></label>
//               <p class="field-hint">Key takeaways students will get from this course</p>
              
//               <div class="array-container">
//                 <div *ngFor="let item of whatYouWillLearn.controls; let i = index" class="array-item">
//                   <input 
//                     type="text" 
//                     [formControl]="item"
//                     placeholder="e.g., Build full-stack web applications"
//                     class="array-input"
//                     [class.error]="item.invalid && item.touched"
//                   >
//                   <button type="button" class="btn-icon" (click)="removeLearningItem(i)">
//                     <i class="fas fa-times"></i>
//                   </button>
//                 </div>
//                 <button type="button" class="btn-add-item" (click)="addLearningItem()">
//                   <i class="fas fa-plus"></i> Add Learning Outcome
//                 </button>
//               </div>
//             </div>

//             <!-- Target Audience -->
//             <div class="form-group full-width">
//               <label class="input-label">Target Audience</label>
//               <p class="field-hint">Who is this course for?</p>
              
//               <div class="array-container">
//                 <div *ngFor="let audience of targetAudience.controls; let i = index" class="array-item">
//                   <input 
//                     type="text" 
//                     [formControl]="audience"
//                     placeholder="e.g., Beginner developers"
//                     class="array-input"
//                   >
//                   <button type="button" class="btn-icon" (click)="removeAudience(i)">
//                     <i class="fas fa-times"></i>
//                   </button>
//                 </div>
//                 <button type="button" class="btn-add-item" (click)="addAudience()">
//                   <i class="fas fa-plus"></i> Add Target Audience
//                 </button>
//               </div>
//             </div>

//             <!-- Tags -->
//             <div class="form-group full-width">
//               <label class="input-label">Tags</label>
//               <p class="field-hint">Help students find your course (press Enter to add)</p>
              
//               <div class="tags-container">
//                 <div class="tags-list">
//                   <span *ngFor="let tag of tags.controls; let i = index" class="tag-item">
//                     {{ tag.value }}
//                     <button type="button" class="tag-remove" (click)="removeTag(i)">
//                       <i class="fas fa-times"></i>
//                     </button>
//                   </span>
//                 </div>
//                 <input 
//                   type="text" 
//                   #tagInput
//                   placeholder="Add a tag"
//                   class="tag-input"
//                   (keydown.enter)="addTag($event)"
//                 >
//               </div>
//             </div>
//           </div>
//         </div>
//       </form>
//     </div>
//   `,
//   styles: [`
//     :host {
//       display: block;
//       width: 100%;
//       min-height: 100vh;
//       background: var(--bg-primary);
//     }

//     .course-form-container {
//       max-width: 1200px;
//       margin: 0 auto;
//       padding: var(--spacing-3xl);
//     }

//     /* Form Header */
//     .form-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       margin-bottom: var(--spacing-2xl);
//     }

//     .form-title {
//       font-size: var(--font-size-3xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0 0 var(--spacing-xs);
//     }

//     .form-subtitle {
//       font-size: var(--font-size-base);
//       color: var(--text-secondary);
//       margin: 0;
//     }

//     .header-actions {
//       display: flex;
//       gap: var(--spacing-md);
//     }

//     /* Buttons */
//     .btn {
//       padding: var(--spacing-md) var(--spacing-xl);
//       border-radius: var(--ui-border-radius);
//       font-size: var(--font-size-md);
//       font-weight: var(--font-weight-medium);
//       border: var(--ui-border-width) solid transparent;
//       cursor: pointer;
//       transition: var(--transition-base);
//       display: inline-flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//     }

//     .btn:disabled {
//       opacity: var(--state-disabled-opacity);
//       cursor: not-allowed;
//     }

//     .btn-primary {
//       background: var(--accent-primary);
//       color: white;
//     }

//     .btn-primary:hover:not(:disabled) {
//       background: var(--accent-hover);
//       transform: translateY(-1px);
//       box-shadow: var(--shadow-md);
//     }

//     .btn-secondary {
//       background: transparent;
//       border-color: var(--border-secondary);
//       color: var(--text-secondary);
//     }

//     .btn-secondary:hover:not(:disabled) {
//       background: var(--bg-secondary);
//       border-color: var(--border-primary);
//       color: var(--text-primary);
//     }

//     .btn-text {
//       background: transparent;
//       color: var(--accent-primary);
//       padding: var(--spacing-sm) var(--spacing-lg);
//     }

//     .btn-text:hover:not(:disabled) {
//       background: var(--accent-focus);
//     }

//     .btn-icon {
//       width: 32px;
//       height: 32px;
//       border-radius: var(--ui-border-radius-sm);
//       border: none;
//       background: transparent;
//       color: var(--text-tertiary);
//       cursor: pointer;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       transition: var(--transition-fast);
//     }

//     .btn-icon:hover {
//       background: var(--bg-hover);
//       color: var(--color-error);
//     }

//     /* Progress Steps */
//     .form-progress {
//       margin-bottom: var(--spacing-2xl);
//       padding: var(--spacing-lg) 0;
//       border-bottom: var(--ui-border-width) solid var(--border-secondary);
//     }

//     .progress-steps {
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       max-width: 800px;
//       margin: 0 auto;
//     }

//     .step {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       gap: var(--spacing-xs);
//       position: relative;
//       flex: 1;
//     }

//     .step-number {
//       width: 32px;
//       height: 32px;
//       border-radius: 50%;
//       background: var(--bg-secondary);
//       border: var(--ui-border-width) solid var(--border-secondary);
//       color: var(--text-secondary);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-medium);
//       transition: var(--transition-base);
//     }

//     .step.active .step-number {
//       background: var(--accent-primary);
//       border-color: var(--accent-primary);
//       color: white;
//     }

//     .step.completed .step-number {
//       background: var(--color-success);
//       border-color: var(--color-success);
//       color: white;
//     }

//     .step-label {
//       font-size: var(--font-size-xs);
//       color: var(--text-secondary);
//       font-weight: var(--font-weight-medium);
//     }

//     .step.active .step-label {
//       color: var(--accent-primary);
//     }

//     .step-line {
//       flex: 1;
//       height: 2px;
//       background: var(--border-secondary);
//       margin: 0 var(--spacing-sm);
//     }

//     /* Step Navigation */
//     .step-navigation {
//       display: flex;
//       justify-content: space-between;
//       margin-bottom: var(--spacing-xl);
//     }

//     /* Form Steps */
//     .form-step {
//       animation: slideIn 0.3s ease;
//     }

//     .step-header {
//       margin-bottom: var(--spacing-xl);
//     }

//     .step-header h3 {
//       font-size: var(--font-size-xl);
//       font-weight: var(--font-weight-semibold);
//       color: var(--text-primary);
//       margin: 0 0 var(--spacing-xs);
//     }

//     .step-header p {
//       font-size: var(--font-size-base);
//       color: var(--text-secondary);
//       margin: 0;
//     }

//     /* Form Grid */
//     .form-grid {
//       display: grid;
//       grid-template-columns: repeat(2, 1fr);
//       gap: var(--spacing-xl);
//     }

//     .full-width {
//       grid-column: 1 / -1;
//     }

//     /* Form Groups */
//     .form-group {
//       position: relative;
//     }

//     .input-label {
//       display: block;
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-medium);
//       color: var(--text-primary);
//       margin-bottom: var(--spacing-xs);
//     }

//     .required {
//       color: var(--color-error);
//       margin-left: var(--spacing-xs);
//     }

//     .hint, .field-hint {
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//       margin-left: var(--spacing-sm);
//     }

//     .field-hint {
//       display: block;
//       margin: var(--spacing-xs) 0 var(--spacing-sm);
//     }

//     /* Input Wrappers */
//     .input-wrapper, .select-wrapper, .textarea-wrapper {
//       position: relative;
//     }

//     .field-icon {
//       position: absolute;
//       left: var(--spacing-md);
//       top: 50%;
//       transform: translateY(-50%);
//       color: var(--text-tertiary);
//       font-size: var(--font-size-sm);
//       pointer-events: none;
//       z-index: 1;
//     }

//     .textarea-wrapper .field-icon {
//       top: var(--spacing-md);
//       transform: none;
//     }

//     /* Form Controls */
//     .form-control {
//       width: 100%;
//       padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) calc(var(--spacing-xl) * 2);
//       background: var(--bg-secondary);
//       border: var(--ui-border-width) solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       color: var(--text-primary);
//       font-size: var(--font-size-md);
//       line-height: var(--line-height-normal);
//       transition: var(--transition-base);
//     }

//     .form-control:focus {
//       outline: none;
//       border-color: var(--accent-primary);
//       box-shadow: 0 0 0 var(--focus-ring-width) var(--accent-focus);
//     }

//     .form-control.error {
//       border-color: var(--color-error);
//     }

//     .form-control.error:focus {
//       box-shadow: 0 0 0 var(--focus-ring-width) var(--color-error-bg);
//     }

//     textarea.form-control {
//       resize: vertical;
//       min-height: 120px;
//     }

//     select.form-control {
//       appearance: none;
//       padding-right: var(--spacing-3xl);
//     }

//     .select-arrow {
//       position: absolute;
//       right: var(--spacing-md);
//       top: 50%;
//       transform: translateY(-50%);
//       color: var(--text-tertiary);
//       pointer-events: none;
//       font-size: var(--font-size-xs);
//     }

//     /* Character and Word Count */
//     .character-count, .word-count {
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//       margin-top: var(--spacing-xs);
//       text-align: right;
//     }

//     .character-count.error, .word-count.error {
//       color: var(--color-warning);
//     }

//     /* Error Messages */
//     .error-message {
//       font-size: var(--font-size-xs);
//       color: var(--color-error);
//       margin-top: var(--spacing-xs);
//     }

//     /* Upload Area */
//     .upload-area {
//       border: 2px dashed var(--border-secondary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-3xl);
//       text-align: center;
//       cursor: pointer;
//       transition: var(--transition-base);
//       background: var(--bg-secondary);
//       position: relative;
//       min-height: 200px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//     }

//     .upload-area:hover {
//       border-color: var(--accent-primary);
//       background: var(--bg-hover);
//     }

//     .upload-placeholder i {
//       font-size: 48px;
//       color: var(--text-tertiary);
//       margin-bottom: var(--spacing-md);
//     }

//     .upload-placeholder p {
//       font-size: var(--font-size-lg);
//       color: var(--text-primary);
//       margin: 0 0 var(--spacing-xs);
//     }

//     .upload-hint {
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//     }

//     .upload-preview {
//       width: 100%;
//       height: 100%;
//       position: relative;
//     }

//     .upload-preview img {
//       max-width: 100%;
//       max-height: 200px;
//       border-radius: var(--ui-border-radius);
//     }

//     .remove-btn {
//       position: absolute;
//       top: var(--spacing-xs);
//       right: var(--spacing-xs);
//       width: 32px;
//       height: 32px;
//       border-radius: 50%;
//       background: var(--color-error);
//       border: none;
//       color: white;
//       cursor: pointer;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       transition: var(--transition-fast);
//     }

//     .remove-btn:hover {
//       transform: scale(1.1);
//       background: var(--color-error-dark);
//     }

//     /* Sections Container */
//     .sections-container {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xl);
//     }

//     .section-item {
//       background: var(--bg-secondary);
//       border: var(--ui-border-width) solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-lg);
//       overflow: hidden;
//     }

//     .section-header {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       padding: var(--spacing-md);
//       background: var(--bg-ternary);
//       border-bottom: var(--ui-border-width) solid var(--border-secondary);
//     }

//     .drag-handle {
//       color: var(--text-tertiary);
//       cursor: move;
//     }

//     .section-input {
//       flex: 1;
//       padding: var(--spacing-sm) var(--spacing-md);
//       background: var(--bg-primary);
//       border: var(--ui-border-width) solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-sm);
//       color: var(--text-primary);
//       font-size: var(--font-size-md);
//     }

//     .section-lessons {
//       padding: var(--spacing-md);
//     }

//     .lesson-item {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       padding: var(--spacing-sm);
//       background: var(--bg-primary);
//       border: var(--ui-border-width) solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-sm);
//       margin-bottom: var(--spacing-sm);
//     }

//     .lesson-input {
//       flex: 1;
//       padding: var(--spacing-sm);
//       background: transparent;
//       border: none;
//       color: var(--text-primary);
//       font-size: var(--font-size-sm);
//     }

//     .lesson-input:focus {
//       outline: none;
//       background: var(--bg-hover);
//       border-radius: var(--ui-border-radius-sm);
//     }

//     .lesson-type {
//       width: 100px;
//       padding: var(--spacing-sm);
//       background: var(--bg-secondary);
//       border: var(--ui-border-width) solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-sm);
//       color: var(--text-primary);
//       font-size: var(--font-size-xs);
//     }

//     .btn-add-lesson, .btn-add-section, .btn-add-item {
//       width: 100%;
//       padding: var(--spacing-sm);
//       background: transparent;
//       border: var(--ui-border-width) dashed var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       color: var(--text-secondary);
//       font-size: var(--font-size-sm);
//       cursor: pointer;
//       transition: var(--transition-base);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-sm);
//     }

//     .btn-add-lesson:hover, .btn-add-section:hover, .btn-add-item:hover {
//       border-color: var(--accent-primary);
//       color: var(--accent-primary);
//       background: var(--accent-focus);
//     }

//     .btn-add-section {
//       margin-top: var(--spacing-md);
//       padding: var(--spacing-md);
//     }

//     /* Toggle Label */
//     .toggle-label {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       cursor: pointer;
//       user-select: none;
//     }

//     .toggle-label input[type="checkbox"] {
//       width: 18px;
//       height: 18px;
//       cursor: pointer;
//     }

//     .toggle-text {
//       font-size: var(--font-size-md);
//       color: var(--text-primary);
//     }

//     /* Array Container */
//     .array-container {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-sm);
//     }

//     .array-item {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       background: var(--bg-secondary);
//       padding: var(--spacing-sm);
//       border-radius: var(--ui-border-radius);
//       border: var(--ui-border-width) solid var(--border-secondary);
//     }

//     .array-input {
//       flex: 1;
//       padding: var(--spacing-sm);
//       background: transparent;
//       border: none;
//       color: var(--text-primary);
//       font-size: var(--font-size-sm);
//     }

//     .array-input:focus {
//       outline: none;
//     }

//     .array-input.error {
//       color: var(--color-error);
//     }

//     /* Tags Container */
//     .tags-container {
//       background: var(--bg-secondary);
//       border: var(--ui-border-width) solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       padding: var(--spacing-sm);
//     }

//     .tags-list {
//       display: flex;
//       flex-wrap: wrap;
//       gap: var(--spacing-xs);
//       margin-bottom: var(--spacing-sm);
//     }

//     .tag-item {
//       display: inline-flex;
//       align-items: center;
//       gap: var(--spacing-xs);
//       padding: var(--spacing-xs) var(--spacing-sm);
//       background: var(--bg-ternary);
//       border: var(--ui-border-width) solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-sm);
//       color: var(--text-primary);
//       font-size: var(--font-size-xs);
//     }

//     .tag-remove {
//       background: transparent;
//       border: none;
//       color: var(--text-tertiary);
//       cursor: pointer;
//       padding: 2px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//     }

//     .tag-remove:hover {
//       color: var(--color-error);
//     }

//     .tag-input {
//       width: 100%;
//       padding: var(--spacing-sm);
//       background: transparent;
//       border: none;
//       color: var(--text-primary);
//       font-size: var(--font-size-sm);
//     }

//     .tag-input:focus {
//       outline: none;
//     }

//     /* Animations */
//     @keyframes slideIn {
//       from {
//         opacity: 0;
//         transform: translateX(20px);
//       }
//       to {
//         opacity: 1;
//         transform: translateX(0);
//       }
//     }

//     /* Responsive */
//     @media (max-width: 768px) {
//       .course-form-container {
//         padding: var(--spacing-xl);
//       }

//       .form-header {
//         flex-direction: column;
//         gap: var(--spacing-md);
//         align-items: flex-start;
//       }

//       .form-grid {
//         grid-template-columns: 1fr;
//       }

//       .progress-steps {
//         flex-direction: column;
//         gap: var(--spacing-md);
//         align-items: flex-start;
//       }

//       .step {
//         flex-direction: row;
//         width: 100%;
//       }

//       .step-line {
//         display: none;
//       }
//     }
//   `]
// })
// export class CourseFormComponent implements OnInit, OnDestroy {
//   @Input() courseId?: string;
//   @Output() saved = new EventEmitter<Course>();
//   @Output() cancelled = new EventEmitter<void>();

//   private fb = inject(FormBuilder);
//   private courseService = inject(CourseService);
//   private categoryService = inject(CategoryService);
//   private router = inject(Router);

//   courseForm!: FormGroup;
//   categories: Category[] = [];
//   isLoading = false;
//   isEditMode = false;
//   currentStep = 1;

//   thumbnailPreview: string | null = null;
//   hasDiscount = false;

//   private subscriptions: Subscription[] = [];

//   ngOnInit(): void {
//     this.initForm();
//     this.loadCategories();
    
//     if (this.courseId) {
//       this.isEditMode = true;
//       this.loadCourse();
//     }
//   }

//   ngOnDestroy(): void {
//     this.subscriptions.forEach(sub => sub.unsubscribe());
//   }

//   private initForm(): void {
//     this.courseForm = this.fb.group({
//       title: ['', [Validators.required, Validators.maxLength(100)]],
//       subtitle: ['', Validators.maxLength(200)],
//       description: ['', [Validators.required, Validators.minLength(50)]],
//       category: ['', Validators.required],
//       level: ['beginner'],
//       language: ['English'],
//       thumbnail: [''],
//       previewVideo: [''],
//       price: [0, [Validators.min(0)]],
//       discountPrice: [null],
//       discountStartDate: [null],
//       discountEndDate: [null],
//       isFree: [false],
//       currency: ['USD'],
//       requirements: this.fb.array([]),
//       whatYouWillLearn: this.fb.array([]),
//       targetAudience: this.fb.array([]),
//       tags: this.fb.array([])
//     });

//     // Add initial items
//     this.addLearningItem(); // At least one learning outcome
//   }

//   private loadCategories(): void {
//     const sub = this.categoryService.getAll({ isActive: true }).subscribe({
//       next: (res) => {
//         this.categories = res.data || [];
//       },
//       error: (error) => {
//         console.error('Failed to load categories', error);
//       }
//     });
//     this.subscriptions.push(sub);
//   }

//   private loadCourse(): void {
//     if (!this.courseId) return;

//     this.isLoading = true;
//     const sub = this.courseService.getById(this.courseId).subscribe({
//       next: (res) => {
//         const course = res.data;
//         if (course) {
//           this.patchForm(course);
//           if (course.thumbnail) {
//             this.thumbnailPreview = course.thumbnail;
//           }
//           if (course.discountPrice) {
//             this.hasDiscount = true;
//           }
//         }
//         this.isLoading = false;
//       },
//       error: (error) => {
//         console.error('Failed to load course', error);
//         this.isLoading = false;
//       }
//     });
//     this.subscriptions.push(sub);
//   }

//   private patchForm(course: any): void {
//     // Clear arrays first
//     while (this.requirements.length) this.requirements.removeAt(0);
//     while (this.whatYouWillLearn.length) this.whatYouWillLearn.removeAt(0);
//     while (this.targetAudience.length) this.targetAudience.removeAt(0);
//     while (this.tags.length) this.tags.removeAt(0);

//     // Patch values
//     this.courseForm.patchValue({
//       title: course.title,
//       subtitle: course.subtitle,
//       description: course.description,
//       category: course.category,
//       level: course.level,
//       language: course.language,
//       thumbnail: course.thumbnail,
//       previewVideo: course.previewVideo,
//       price: course.price,
//       discountPrice: course.discountPrice,
//       discountStartDate: course.discountStartDate ? this.formatDate(course.discountStartDate) : null,
//       discountEndDate: course.discountEndDate ? this.formatDate(course.discountEndDate) : null,
//       isFree: course.isFree,
//       currency: course.currency
//     });

//     // Add arrays
//     course.requirements?.forEach((req: string) => {
//       this.requirements.push(this.fb.control(req));
//     });

//     course.whatYouWillLearn?.forEach((item: string) => {
//       this.whatYouWillLearn.push(this.fb.control(item, Validators.required));
//     });

//     course.targetAudience?.forEach((audience: string) => {
//       this.targetAudience.push(this.fb.control(audience));
//     });

//     course.tags?.forEach((tag: string) => {
//       this.tags.push(this.fb.control(tag));
//     });
//   }

//   private formatDate(date: string): string {
//     return new Date(date).toISOString().split('T')[0];
//   }

//   // Getters
//   get titleLength(): number {
//     return this.courseForm.get('title')?.value?.length || 0;
//   }

//   get wordCount(): number {
//     const description = this.courseForm.get('description')?.value || '';
//     return description.trim().split(/\s+/).filter(Boolean).length;
//   }

//   get requirements() {
//     return this.courseForm.get('requirements') as FormArray;
//   }

//   get whatYouWillLearn() {
//     return this.courseForm.get('whatYouWillLearn') as FormArray;
//   }

//   get targetAudience() {
//     return this.courseForm.get('targetAudience') as FormArray;
//   }

//   get tags() {
//     return this.courseForm.get('tags') as FormArray;
//   }

//   // Form Validation
//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.courseForm.get(fieldName);
//     return field ? field.invalid && (field.dirty || field.touched) : false;
//   }

//   // Navigation
//   nextStep(): void {
//     if (this.currentStep < 4) {
//       this.currentStep++;
//     }
//   }

//   prevStep(): void {
//     if (this.currentStep > 1) {
//       this.currentStep--;
//     }
//   }

//   // Section Management
//   sections = this.fb.array([]);

//   addSection(): void {
//     const sectionForm = this.fb.group({
//       title: ['', Validators.required],
//       description: [''],
//       order: [this.sections.length],
//       lessons: this.fb.array([])
//     });
//     this.sections.push(sectionForm);
//   }

//   removeSection(index: number): void {
//     this.sections.removeAt(index);
//     // Update orders
//     this.sections.controls.forEach((control, i) => {
//       control.get('order')?.setValue(i);
//     });
//   }

//   getSectionControl(index: number, controlName: string): AbstractControl {
//     return this.sections.at(index).get(controlName)!;
//   }

//   getLessons(sectionIndex: number): FormArray {
//     return this.sections.at(sectionIndex).get('lessons') as FormArray;
//   }

//   addLesson(sectionIndex: number): void {
//     const lessonForm = this.fb.group({
//       title: ['', Validators.required],
//       type: ['video'],
//       duration: [0],
//       isFree: [false],
//       order: [this.getLessons(sectionIndex).length]
//     });
//     this.getLessons(sectionIndex).push(lessonForm);
//   }

//   removeLesson(sectionIndex: number, lessonIndex: number): void {
//     this.getLessons(sectionIndex).removeAt(lessonIndex);
//     // Update orders
//     this.getLessons(sectionIndex).controls.forEach((control, i) => {
//       control.get('order')?.setValue(i);
//     });
//   }

//   // Array Management
//   addRequirement(): void {
//     this.requirements.push(this.fb.control(''));
//   }

//   removeRequirement(index: number): void {
//     this.requirements.removeAt(index);
//   }

//   addLearningItem(): void {
//     this.whatYouWillLearn.push(this.fb.control('', Validators.required));
//   }

//   removeLearningItem(index: number): void {
//     this.whatYouWillLearn.removeAt(index);
//   }

//   addAudience(): void {
//     this.targetAudience.push(this.fb.control(''));
//   }

//   removeAudience(index: number): void {
//     this.targetAudience.removeAt(index);
//   }

//   addTag(event: KeyboardEvent): void {
//     const input = event.target as HTMLInputElement;
//     const value = input.value.trim();
    
//     if (value && event.key === 'Enter') {
//       event.preventDefault();
//       this.tags.push(this.fb.control(value));
//       input.value = '';
//     }
//   }

//   removeTag(index: number): void {
//     this.tags.removeAt(index);
//   }

//   // File Upload
//   onDragOver(event: DragEvent): void {
//     event.preventDefault();
//     event.stopPropagation();
//   }

//   onDrop(event: DragEvent, type: string): void {
//     event.preventDefault();
//     event.stopPropagation();
    
//     const files = event.dataTransfer?.files;
//     if (files && files.length > 0) {
//       this.handleFile(files[0], type);
//     }
//   }

//   onFileSelected(event: Event, type: string): void {
//     const input = event.target as HTMLInputElement;
//     if (input.files && input.files.length > 0) {
//       this.handleFile(input.files[0], type);
//     }
//   }

//   private handleFile(file: File, type: string): void {
//     if (type === 'thumbnail' && file.type.startsWith('image/')) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         this.thumbnailPreview = e.target?.result as string;
//       };
//       reader.readAsDataURL(file);
      
//       // Here you would upload the file to your server
//       // this.uploadService.uploadThumbnail(file).subscribe(...)
//     }
//   }

//   removeThumbnail(event: Event): void {
//     event.stopPropagation();
//     this.thumbnailPreview = null;
//     this.courseForm.patchValue({ thumbnail: '' });
//   }

//   // Pricing
//   onFreeToggle(): void {
//     const isFree = this.courseForm.get('isFree')?.value;
//     if (isFree) {
//       this.courseForm.patchValue({ price: 0 });
//       this.courseForm.get('price')?.disable();
//     } else {
//       this.courseForm.get('price')?.enable();
//     }
//   }

//   toggleDiscount(): void {
//     this.hasDiscount = !this.hasDiscount;
//     if (!this.hasDiscount) {
//       this.courseForm.patchValue({
//         discountPrice: null,
//         discountStartDate: null,
//         discountEndDate: null
//       });
//     }
//   }

//   // Submit
//   onSubmit(): void {
//     if (this.courseForm.invalid) {
//       this.courseForm.markAllAsTouched();
//       // Find first invalid step and navigate to it
//       if (this.courseForm.get('title')?.invalid) this.currentStep = 1;
//       else if (this.courseForm.get('description')?.invalid) this.currentStep = 1;
//       else if (this.courseForm.get('category')?.invalid) this.currentStep = 1;
//       else if (this.whatYouWillLearn.length === 0) this.currentStep = 4;
//       return;
//     }

//     this.isLoading = true;
//     const formData = this.courseForm.value;

//     const request = this.isEditMode && this.courseId
//       ? this.courseService.update(this.courseId, formData)
//       : this.courseService.create(formData);

//     const sub = request.subscribe({
//       next: (res) => {
//         this.isLoading = false;
//         this.saved.emit(res.data?.course || res.data);
//       },
//       error: (error) => {
//         console.error('Failed to save course', error);
//         this.isLoading = false;
//       }
//     });
//     this.subscriptions.push(sub);
//   }

//   onCancel(): void {
//     this.cancelled.emit();
//   }
// }