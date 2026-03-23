// post-list.component.ts (Fixed with proper API handling)
import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService } from 'primeng/api';

import { PostService } from '../../../../core/services/post.service';
import { AppMessageService } from '../../../../core/utils/message.service';
import { DynamicDropdownComponent } from '../../../../shared/components/dynamic-select/dynamic-select.component';
import { PostCardComponent } from "../post-card/post-card.component";

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    PaginatorModule,
    TooltipModule,
    DynamicDropdownComponent,
    PostCardComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.scss']
})
export class PostListComponent implements OnInit {
  private postService = inject(PostService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // Signals
  posts = signal<any[]>([]);
  totalRecords = signal<number>(0);
  loading = signal<boolean>(false);

  // Pagination
  first = 0;
  rows = 12;

  // Filters
  searchQuery = '';
  selectedType = '';
  selectedStatus = '';

  // Stats
  stats = [
    { label: 'Total Posts', value: 0, icon: 'pi pi-file', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { label: 'Published', value: 0, icon: 'pi pi-check-circle', color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
    { label: 'Drafts', value: 0, icon: 'pi pi-pencil', color: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' },
    { label: 'Total Views', value: 0, icon: 'pi pi-eye', color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }
  ];

  // Computed
  totalPages = computed(() => Math.ceil(this.totalRecords() / this.rows));
  isAdminView = signal(false);
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.isAdminView.set(this.router.url.includes('/admin'));

    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.first = 0;
        this.loadPosts();
      });

    this.loadPosts();
  }

  // post-list.component.ts (updated)
  // post-list.component.ts (Robust version with multiple response structure handling)

  loadPosts() {
    this.loading.set(true);

    const params: any = {
      page: (this.first / this.rows) + 1,
      limit: this.rows,
      sort: '-createdAt'
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedType) params.type = this.selectedType;
    if (this.selectedStatus) params.status = this.selectedStatus;

    this.postService.getAdminPosts(params).subscribe({
      next: (res: any) => {
        console.log('Full API Response:', res);

        let postsData: any[] = [];
        let totalResults = 0;

        // Handle different response structures
        if (res.data && Array.isArray(res.data)) {
          // Case 1: { data: [...] }
          postsData = res.data;
          totalResults = res.pagination?.totalResults || res.results || postsData.length;
        }
        else if (res.data?.data && Array.isArray(res.data.data)) {
          // Case 2: { data: { data: [...] } }
          postsData = res.data.data;
          totalResults = res.data.pagination?.totalResults || res.data.results || postsData.length;
        }
        else if (Array.isArray(res)) {
          // Case 3: Direct array response
          postsData = res;
          totalResults = postsData.length;
        }
        else if (res.posts && Array.isArray(res.posts)) {
          // Case 4: { posts: [...] }
          postsData = res.posts;
          totalResults = res.total || postsData.length;
        }

        console.log('Processed Posts Data:', postsData);
        console.log('Total Results:', totalResults);

        this.posts.set(postsData);
        this.totalRecords.set(totalResults);
        this.updateStats(postsData);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.messageService.showError('Failed to load posts');
        this.loading.set(false);
      }
    });
  }

  updateStats(posts: any[]) {
    const total = posts.length;
    const published = posts.filter(p => p.status === 'published').length;
    const drafts = posts.filter(p => p.status === 'draft').length;
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    this.stats[0].value = total;
    this.stats[1].value = published;
    this.stats[2].value = drafts;
    this.stats[3].value = totalViews;
  }

  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
  }

  onFilterChange() {
    this.first = 0;
    this.loadPosts();
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
    this.loadPosts();
  }

  clearSearch() {
    this.searchQuery = '';
    this.onSearchChange();
  }

  clearTypeFilter() {
    this.selectedType = '';
    this.onFilterChange();
  }

  clearStatusFilter() {
    this.selectedStatus = '';
    this.onFilterChange();
  }

  clearAllFilters() {
    this.searchQuery = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.onFilterChange();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedType || this.selectedStatus);
  }

  viewPost(id: string) {
    if (this.isAdminView()) {
      this.router.navigate(['/blog/admin/view', id]);
    } else {
      this.router.navigate(['/blog/view', id]);
    }
  }

  editPost(id: string) {
    this.router.navigate(['/blog/admin/edit', id]);
  }

  deletePost(post: any) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${post.title}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.postService.deletePost(post._id).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            this.messageService.showSuccess('Post deleted successfully');
            this.loadPosts();
          },
          error: () => this.messageService.showError('Failed to delete post')
        });
      }
    });
  }

  publishPost(id: string) {
    this.postService.publishPost(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Post published successfully');
        this.loadPosts();
      },
      error: () => this.messageService.showError('Failed to publish post')
    });
  }

  unpublishPost(id: string) {
    this.postService.unpublishPost(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Post moved to drafts');
        this.loadPosts();
      },
      error: () => this.messageService.showError('Failed to unpublish post')
    });
  }

  toggleFeature(id: string) {
    this.postService.toggleFeature(id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Post feature status updated');
        this.loadPosts();
      },
      error: () => this.messageService.showError('Failed to toggle feature status')
    });
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'published': return 'pi pi-check-circle';
      case 'draft': return 'pi pi-pencil';
      case 'scheduled': return 'pi pi-clock';
      default: return 'pi pi-question-circle';
    }
  }

  getStatusSeverity(status: string): string {
    switch (status?.toLowerCase()) {
      case 'published': return 'success';
      case 'draft': return 'secondary';
      case 'scheduled': return 'info';
      default: return 'secondary';
    }
  }

  truncateText(text: string, length: number): string {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  stripHtmlTags(html: string): string {
    if (!html) return '';
    // Remove HTML tags and decode entities
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-post.jpg';
  }
}