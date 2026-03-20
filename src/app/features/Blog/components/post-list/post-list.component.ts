import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { PostService } from '../../../../core/services/post.service';
import { AppMessageService } from '../../../../core/utils/message.service';
import { DynamicDropdownComponent } from '../../../../shared/components/dynamic-select/dynamic-select.component';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule, TableModule, 
    ButtonModule, InputTextModule, TagModule, ConfirmDialogModule, 
    ToastModule, DynamicDropdownComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.scss']
})
export class PostListComponent implements OnInit {
  private postService = inject(PostService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  posts = signal<any[]>([]);
  totalRecords = signal<number>(0);
  loading = signal<boolean>(true);

  // Table State
  first = 0;
  rows = 10;
  
  // Filters
  searchQuery = '';
  selectedType = '';
  selectedStatus = '';
  
  // Debounce search so we don't spam the API on every keystroke
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.first = 0; // Reset to page 1 on search
      this.loadPosts();
    });
  }

  // Called automatically by PrimeNG table on pagination, sort, etc.
  onLazyLoad(event: TableLazyLoadEvent) {
    this.first = event.first || 0;
    this.rows = event.rows || 10;
    this.loadPosts();
  }

  loadPosts() {
    this.loading.set(true);
    
    const params: any = {
      page: (this.first / this.rows) + 1,
      limit: this.rows,
      sort: '-createdAt' // Default newest first
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedType) params.type = this.selectedType;
    if (this.selectedStatus) params.status = this.selectedStatus;

    this.postService.getAdminPosts(params).subscribe({
      next: (res: any) => {
        // Handle your specific backend response structure
        const data = res.data?.data || res.data || [];
        this.posts.set(data);
        this.totalRecords.set(res.pagination?.totalResults || data.length);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.showError('Failed to load posts');
        this.loading.set(false);
      }
    });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
  }

  onFilterChange() {
    this.first = 0;
    this.loadPosts();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.first = 0;
    this.loadPosts();
  }

  editPost(id: string) {
    this.router.navigate(['/blog/edit', id]);
  }

  deletePost(post: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${post.title}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      accept: () => {
        this.postService.deletePost(post._id).subscribe({
          next: () => {
            this.messageService.showSuccess('Post deleted successfully');
            this.loadPosts(); // Reload table
          },
          error: () => this.messageService.showError('Failed to delete post')
        });
      }
    });
  }

  // Helper for PrimeNG Tag colors
  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status?.toLowerCase()) {
      case 'published': return 'success';
      case 'draft': return 'secondary';
      case 'scheduled': return 'info';
      case 'archived': return 'warn';
      default: return 'secondary';
    }
  }
}