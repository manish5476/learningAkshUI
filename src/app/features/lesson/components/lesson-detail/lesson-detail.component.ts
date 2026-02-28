import { Component, input, output } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ChipModule } from 'primeng/chip';

// Pipes
import { DurationPipe } from '../../../../core/pipes/duration.pipe';

@Component({
  selector: 'app-lesson-detail',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TagModule, 
    DividerModule, 
    ChipModule, 
    DurationPipe,
    TitleCasePipe
  ],
  templateUrl: './lesson-detail.component.html',
  styleUrls: ['./lesson-detail.component.scss']
})
export class LessonDetailComponent {
  // Modern Signal Inputs/Outputs
  lesson = input.required<any>();
  edit = output<void>();
  close = output<void>();

  // Methods
  // 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined | null;
  getTypeSeverity(type: string): any {
    const severities: Record<string, string> = {
      'video': 'info',
      'article': 'warn',
      'quiz': 'danger',
      'assignment': 'success',
      'coding-exercise': 'secondary'
    };
    return severities[type] || 'info';
  }

  onEdit(): void {
    this.edit.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}

// // lesson-detail.component.ts
// import { Component, Input, Output, EventEmitter } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { TagModule } from 'primeng/tag';
// import { DividerModule } from 'primeng/divider';
// import { ChipModule } from 'primeng/chip';
// import { DurationPipe } from "../../../../core/pipes/duration.pipe";

// @Component({
//   selector: 'app-lesson-detail',
//   standalone: true,
//   imports: [CommonModule, ButtonModule, TagModule, DividerModule, ChipModule, DurationPipe],
//   template: `
//     <div class="lesson-detail">
//       <!-- Header -->
//       <div class="detail-header">
//         <div class="header-icon" [class]="lesson.type + '-icon'">
//           @switch (lesson.type) {
//             @case ('video') {
//               <i class="pi pi-video"></i>
//             }
//             @case ('article') {
//               <i class="pi pi-file"></i>
//             }
//             @case ('quiz') {
//               <i class="pi pi-question-circle"></i>
//             }
//             @case ('assignment') {
//               <i class="pi pi-pencil"></i>
//             }
//             @case ('coding-exercise') {
//               <i class="pi pi-code"></i>
//             }
//           }
//         </div>
//         <div class="header-info">
//           <h2>{{ lesson.title }}</h2>
//           <div class="header-meta">
//              <!-- [severity]="getTypeSeverity(lesson.type)" -->
//             <p-tag 
//               [value]="lesson.type | titlecase" 
             
//               [rounded]="true">
//             </p-tag>
//             @if (lesson.duration) {
//               <span class="duration">
//                 <i class="pi pi-clock"></i>
//                 {{ lesson.duration | duration }}
//               </span>
//             }
//             @if (lesson.isFree) {
//               <span class="free-badge">
//                 <i class="pi pi-lock-open"></i>
//                 Free Preview
//               </span>
//             }
//           </div>
//         </div>
//         <p-tag 
//           [value]="lesson.isPublished ? 'Published' : 'Draft'" 
//           [severity]="lesson.isPublished ? 'success' : 'warn'"
//           [rounded]="true">
//         </p-tag>
//       </div>

//       <p-divider></p-divider>

//       <!-- Description -->
//       @if (lesson.description) {
//         <div class="description-section">
//           <h3 class="section-title">
//             <i class="pi pi-align-left"></i>
//             Description
//           </h3>
//           <p class="description">{{ lesson.description }}</p>
//         </div>
//         <p-divider></p-divider>
//       }

//       <!-- Content Preview -->
//       <div class="content-section">
//         <h3 class="section-title">
//           <i class="pi pi-eye"></i>
//           Content Preview
//         </h3>

//         @if (lesson.type === 'video' && lesson.content?.video) {
//           <div class="video-preview">
//             @if (lesson.content.video.thumbnail) {
//               <img [src]="lesson.content.video.thumbnail" [alt]="lesson.title" class="video-thumbnail">
//             }
//             <div class="video-info">
//               <p><strong>Provider:</strong> {{ lesson.content.video.provider | titlecase }}</p>
//               <p><strong>URL:</strong> <a [href]="lesson.content.video.url" target="_blank">{{ lesson.content.video.url }}</a></p>
//               <p><strong>Duration:</strong> {{ lesson.content.video.duration }} seconds</p>
//             </div>
//           </div>
//         }

//         @if (lesson.type === 'article' && lesson.content?.article) {
//           <div class="article-preview">
//             <div class="article-content">{{ lesson.content.article.body }}</div>
//           </div>
//         }

//         @if (lesson.type === 'quiz') {
//           <div class="quiz-preview">
//             <p><i class="pi pi-question-circle"></i> Quiz ID: {{ lesson.content?.quiz }}</p>
//           </div>
//         }
//       </div>

//       <!-- Resources -->
//       @if (lesson.resources && lesson.resources.length > 0) {
//         <p-divider></p-divider>
//         <div class="resources-section">
//           <h3 class="section-title">
//             <i class="pi pi-paperclip"></i>
//             Resources ({{ lesson.resources.length }})
//           </h3>
//           <div class="resources-list">
//             @for (resource of lesson.resources; track resource) {
//               <div class="resource-item">
//                 <i class="pi" [class.pi-file-pdf]="resource.type === 'pdf'"
//                            [class.pi-code]="resource.type === 'code'"
//                            [class.pi-link]="resource.type === 'link'"
//                            [class.pi-image]="resource.type === 'image'"></i>
//                 <span class="resource-title">{{ resource.title }}</span>
//                 <a [href]="resource.url" target="_blank" class="resource-link">
//                   <i class="pi pi-external-link"></i>
//                 </a>
//               </div>
//             }
//           </div>
//         </div>
//       }

//       <!-- Actions -->
//       <div class="detail-actions">
//         <button pButton pRipple label="Edit Lesson" icon="pi pi-pencil" (click)="onEdit()"></button>
//         <button pButton pRipple label="Close" icon="pi pi-times" class="p-button-outlined" (click)="onClose()"></button>
//       </div>
//     </div>
//   `,
//   styles: [`
//     .lesson-detail {
//       padding: var(--spacing-lg);
//     }

//     .detail-header {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-lg);
//     }

//     .header-icon {
//       width: 60px;
//       height: 60px;
//       border-radius: 50%;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//     }

//     .header-icon.video-icon {
//       background: var(--color-info-bg);
//       color: var(--color-info);
//     }

//     .header-icon.article-icon {
//       background: var(--color-warning-bg);
//       color: var(--color-warning);
//     }

//     .header-icon.quiz-icon {
//       background: var(--color-danger-bg);
//       color: var(--color-danger);
//     }

//     .header-icon i {
//       font-size: var(--font-size-2xl);
//     }

//     .header-info {
//       flex: 1;
//     }

//     .header-info h2 {
//       margin: 0 0 var(--spacing-xs);
//       color: var(--text-primary);
//     }

//     .header-meta {
//       display: flex;
//       gap: var(--spacing-md);
//       align-items: center;
//     }

//     .duration {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xs);
//       color: var(--text-secondary);
//       font-size: var(--font-size-sm);
//     }

//     .free-badge {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-xs);
//       color: var(--color-success);
//       font-size: var(--font-size-sm);
//     }

//     .section-title {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       margin: 0 0 var(--spacing-md);
//       color: var(--text-primary);
//       font-size: var(--font-size-lg);
//     }

//     .description {
//       color: var(--text-secondary);
//       line-height: 1.6;
//       white-space: pre-wrap;
//     }

//     /* Video Preview */
//     .video-preview {
//       display: flex;
//       gap: var(--spacing-lg);
//     }

//     .video-thumbnail {
//       width: 200px;
//       height: 120px;
//       object-fit: cover;
//       border-radius: var(--ui-border-radius);
//     }

//     .video-info {
//       flex: 1;
//     }

//     .video-info p {
//       margin: var(--spacing-xs) 0;
//       color: var(--text-primary);
//     }

//     .video-info a {
//       color: var(--accent-primary);
//       text-decoration: none;
//     }

//     .video-info a:hover {
//       text-decoration: underline;
//     }

//     /* Article Preview */
//     .article-content {
//       max-height: 200px;
//       overflow-y: auto;
//       padding: var(--spacing-md);
//       background: var(--bg-secondary);
//       border-radius: var(--ui-border-radius);
//       color: var(--text-primary);
//       white-space: pre-wrap;
//     }

//     /* Resources */
//     .resources-list {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-sm);
//     }

//     .resource-item {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//       padding: var(--spacing-sm) var(--spacing-md);
//       background: var(--bg-secondary);
//       border-radius: var(--ui-border-radius);
//     }

//     .resource-item i {
//       color: var(--accent-primary);
//     }

//     .resource-title {
//       flex: 1;
//       color: var(--text-primary);
//     }

//     .resource-link {
//       color: var(--text-tertiary);
//       transition: var(--transition-fast);
//     }

//     .resource-link:hover {
//       color: var(--accent-primary);
//     }

//     /* Actions */
//     .detail-actions {
//       display: flex;
//       justify-content: flex-end;
//       gap: var(--spacing-md);
//       padding-top: var(--spacing-lg);
//       margin-top: var(--spacing-lg);
//       border-top: 1px solid var(--border-secondary);
//     }

//     @media (max-width: 768px) {
//       .detail-header {
//         flex-direction: column;
//         text-align: center;
//       }

//       .header-meta {
//         justify-content: center;
//         flex-wrap: wrap;
//       }

//       .video-preview {
//         flex-direction: column;
//       }

//       .video-thumbnail {
//         width: 100%;
//         height: auto;
//       }
//     }
//   `]
// })
// export class LessonDetailComponent {
//   @Input() lesson: any;
//   @Output() edit = new EventEmitter<void>();
//   @Output() close = new EventEmitter<void>();

//   getTypeSeverity(type: string): string {
//     const severities: any = {
//       'video': 'info',
//       'article': 'warn',
//       'quiz': 'danger',
//       'assignment': 'success',
//       'coding-exercise': 'help'
//     };
//     return severities[type] || 'info';
//   }

//   onEdit(): void {
//     this.edit.emit();
//   }

//   onClose(): void {
//     this.close.emit();
//   }
// }