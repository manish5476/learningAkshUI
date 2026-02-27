// category-detail.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, DividerModule],
  template: `
    <div class="category-detail">
      <!-- Header -->
      <div class="detail-header">
        <div class="header-icon">
          <i class="preview-icon-display" [class]="category.icon || 'pi pi-folder'"></i>
        </div>
        <div class="header-info">
          <h2>{{ category.name }}</h2>
          @if (category.slug) {
            <span class="slug">/{{ category.slug }}</span>
          }
        </div>
        <p-tag 
          [value]="category.isActive ? 'Active' : 'Inactive'" 
          [severity]="category.isActive ? 'success' : 'danger'"
          [rounded]="true">
        </p-tag>
      </div>

      <p-divider></p-divider>

      <!-- Details Grid -->
      <div class="details-grid">
        @if (category.description) {
          <div class="detail-item full-width">
            <span class="detail-label">
              <i class="pi pi-align-left"></i>
              Description
            </span>
            <p class="detail-value description">{{ category.description }}</p>
          </div>
        }

        <div class="detail-item">
          <span class="detail-label">
            <i class="pi pi-hashtag"></i>
            ID
          </span>
          <code class="detail-value">{{ category._id }}</code>
        </div>

        @if (category.parentCategory) {
          <div class="detail-item">
            <span class="detail-label">
              <i class="pi pi-sitemap"></i>
              Parent Category
            </span>
            <span class="detail-value">{{ category.parentCategory.name || category.parentCategory }}</span>
          </div>
        }

        <div class="detail-item">
          <span class="detail-label">
            <i class="pi pi-calendar"></i>
            Created
          </span>
          <span class="detail-value">{{ category.createdAt | date:'medium' }}</span>
        </div>

        <div class="detail-item">
          <span class="detail-label">
            <i class="pi pi-sync"></i>
            Last Updated
          </span>
          <span class="detail-value">{{ category.updatedAt | date:'medium' }}</span>
        </div>

        @if (category.icon) {
          <div class="detail-item">
            <span class="detail-label">
              <i class="pi pi-tag"></i>
              Icon
            </span>
            <div class="icon-display">
              <i [class]="category.icon"></i>
              <code>{{ category.icon }}</code>
            </div>
          </div>
        }

        @if (category.image) {
          <div class="detail-item full-width">
            <span class="detail-label">
              <i class="pi pi-image"></i>
              Image
            </span>
            <div class="image-preview">
              <img [src]="category.image" [alt]="category.name">
            </div>
          </div>
        }
      </div>

      <!-- Actions -->
      <div class="detail-actions">
        <button pButton pRipple label="Edit Category" icon="pi pi-pencil" (click)="onEdit()"></button>
        <button pButton pRipple label="Close" icon="pi pi-times" class="p-button-outlined" (click)="onClose()"></button>
      </div>
    </div>
  `,
  styles: [`
    .category-detail {
      padding: var(--spacing-lg);
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }

    .header-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--accent-focus);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon i {
      font-size: var(--font-size-2xl);
      color: var(--accent-primary);
    }

    .header-info {
      flex: 1;
    }

    .header-info h2 {
      margin: 0 0 var(--spacing-xs);
      color: var(--text-primary);
    }

    .slug {
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
    }

    /* Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-xl);
      padding: var(--spacing-lg) 0;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .detail-item.full-width {
      grid-column: 1 / -1;
    }

    .detail-label {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .detail-value {
      color: var(--text-primary);
      font-size: var(--font-size-md);
      word-break: break-word;
    }

    .detail-value.description {
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .icon-display {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .icon-display i {
      font-size: var(--font-size-2xl);
      color: var(--accent-primary);
    }

    .image-preview {
      margin-top: var(--spacing-sm);
    }

    .image-preview img {
      max-width: 100%;
      max-height: 200px;
      border-radius: var(--ui-border-radius);
      border: 1px solid var(--border-secondary);
    }

    /* Actions */
    .detail-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-md);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--border-secondary);
    }

    @media (max-width: 768px) {
      .detail-header {
        flex-direction: column;
        text-align: center;
      }

      .details-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CategoryDetailComponent {
  @Input() category: any;
  @Output() edit = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onEdit(): void {
    this.edit.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}