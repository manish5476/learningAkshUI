import { Component, OnInit, inject, signal, DestroyRef, computed, SecurityContext, HostListener } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';

import { PostService } from '../../../../core/services/post.service';
import { AppMessageService } from '../../../../core/utils/message.service';
import { RelatedPostsComponent } from '../related-posts/related-posts.component';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    TooltipModule,
    ConfirmDialogModule,
    RelatedPostsComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.scss']
})
export class PostDetailComponent implements OnInit {
  private postService = inject(PostService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private destroyRef = inject(DestroyRef);
  private viewportScroller = inject(ViewportScroller);

  // State Signals
  post = signal<any>(null);
  relatedPosts = signal<any[]>([]);
  tableOfContents = signal<TocItem[]>([]);

  // UI Status Signals
  loading = signal<boolean>(true);
  error = signal<string>('');
  isAdminView = signal<boolean>(false);
  isAuthenticated = signal<boolean>(false);
  isDarkMode = signal<boolean>(false);

  // Interactive Metrics Signals
  isLiked = signal<boolean>(false);
  isSaved = signal<boolean>(false);
  readingProgress = signal<number>(0);
  activeTocId = signal<string>('');
  showStickyHeader = signal<boolean>(false);

  // Computed Values
  formattedDate = computed(() => {
    const data = this.post();
    if (!data) return '';
    return new Date(data.eventDate || data.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  });

  estimatedReadTime = computed(() => {
    const data = this.post();
    if (!data?.content) return '1 min read';
    const textLength = data.content.replace(/<[^>]+>/g, '').length;
    return `${Math.max(1, Math.ceil(textLength / 1000))} min read`;
  });

  sanitizedContent = computed(() => {
    let content = this.post()?.content;
    if (!content) return '';

    content = this.decodeHtml(content);
    content = this.processHtmlContent(content); // Builds TOC and injects IDs

    return this.sanitizer.sanitize(SecurityContext.HTML, content) as SafeHtml;
  });

  // ngOnInit() {
  //   this.isAdminView.set(this.router.url.includes('/admin'));
  //   this.loadPost();
  // }

  ngOnInit() {
    this.isAdminView.set(this.router.url.includes('/admin'));

    // Subscribe to paramMap. This triggers every time the URL changes!
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const postIdOrSlug = params.get('id') || params.get('slug');

      if (postIdOrSlug) {
        this.loadPost(postIdOrSlug);
      } else {
        this.error.set('Invalid post ID');
        this.loading.set(false);
      }
    });
  }

  // Update loadPost to accept the ID/Slug as an argument
  loadPost(postIdOrSlug: string) {
    // Reset state for the new post transition
    this.loading.set(true);
    this.error.set('');

    const request$ = this.isAdminView()
      ? this.postService.getPost(postIdOrSlug)
      : this.postService.getPostBySlug(postIdOrSlug);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: any) => {
        const postData = response.post || response.data?.post || response;
        this.post.set(postData);

        const related = response.relatedPosts || response.data?.relatedPosts;
        if (related) this.relatedPosts.set(related);

        this.loading.set(false);

        // Reset scroll position smoothly for the new post
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
      },
      error: (err) => {
        console.error('Error loading post:', err);
        this.error.set(this.isAdminView() ? 'Failed to load draft.' : 'Post not found.');
        this.loading.set(false);
      }
    });
  }
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.updateReadingProgress();
    this.updateActiveTocItem();
  }

  private updateReadingProgress() {
    const element = document.documentElement;
    const body = document.body;

    const scrollTop = element.scrollTop || body.scrollTop;
    const scrollHeight = element.scrollHeight || body.scrollHeight;
    const clientHeight = element.clientHeight;

    // Calculate progress as a percentage
    const percent = Math.min(100, Math.max(0, (scrollTop / (scrollHeight - clientHeight)) * 100));
    this.readingProgress.set(percent);

    // Show sticky header after scrolling past 300px
    this.showStickyHeader.set(scrollTop > 400);
  }

  private updateActiveTocItem() {
    const headings = this.tableOfContents();
    if (!headings.length) return;

    for (let i = headings.length - 1; i >= 0; i--) {
      const element = document.getElementById(headings[i].id);
      if (element) {
        const rect = element.getBoundingClientRect();
        // If heading is near top of viewport (offset by sticky header space ~100px)
        if (rect.top <= 140) {
          this.activeTocId.set(headings[i].id);
          return;
        }
      }
    }
    // If we scrolled past everything but nothing matched tops, clear TOC or keep first
    if (this.readingProgress() < 5 && headings.length) {
      this.activeTocId.set(headings[0].id);
    }
  }

  scrollToHeading(id: string) {
    const element = document.getElementById(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
      this.activeTocId.set(id);
    }
  }

  decodeHtml(html: string): string {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  processHtmlContent(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3');

    const toc: TocItem[] = [];

    headings.forEach((heading, index) => {
      const id = `blog-heading-${index}`;
      heading.setAttribute('id', id);
      heading.classList.add('scroll-mt-24'); // Tailwind class for Scroll Margin Top

      toc.push({
        id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.replace('H', ''), 10)
      });
    });

    // Setting inside a computed is technically an effect side-effect, but safe synchronously here
    queueMicrotask(() => this.tableOfContents.set(toc));
    return doc.body.innerHTML;
  }

  // loadPost() {
  //   const postIdOrSlug = this.route.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('slug');
  //   if (!postIdOrSlug) {
  //     this.error.set('Invalid post ID');
  //     this.loading.set(false);
  //     return;
  //   }

  //   this.loading.set(true);
  //   const request$ = this.isAdminView()
  //     ? this.postService.getPost(postIdOrSlug)
  //     : this.postService.getPostBySlug(postIdOrSlug);

  //   request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
  //     next: (response: any) => {
  //       const postData = response.post || response.data?.post || response;
  //       this.post.set(postData);

  //       const related = response.relatedPosts || response.data?.relatedPosts;
  //       if (related) this.relatedPosts.set(related);

  //       this.loading.set(false);
  //       // Reset scroll position gracefully
  //       setTimeout(() => window.scrollTo(0, 0), 0);
  //     },
  //     error: (err) => {
  //       console.error('Error loading post:', err);
  //       this.error.set(this.isAdminView() ? 'Failed to load draft.' : 'Post not found.');
  //       this.loading.set(false);
  //     }
  //   });
  // }

  toggleDarkMode() {
    this.isDarkMode.update(v => !v);
    if (this.isDarkMode()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleLike() {
    // Optimistic UI updates as before
    if (!this.isAuthenticated() && !this.isAdminView()) {
      this.messageService.showWarn('Please login to like posts');
    }
    this.isLiked.update(v => !v);
    this.post.update(p => ({ ...p, likes: this.isLiked() ? (p.likes || 0) + 1 : Math.max(0, (p.likes || 1) - 1) }));

    this.postService.updateLikes(this.post()._id, this.isLiked()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: () => this.isLiked.update(v => !v) // revert
    });
  }

  toggleSave() {
    if (!this.isAuthenticated() && !this.isAdminView()) {
      this.messageService.showWarn('Please login to save posts');
      return;
    }
    this.isSaved.update(v => !v);
    this.messageService.showInfo(this.isSaved() ? 'Saved to bookmarks' : 'Removed from bookmarks');
  }

  copyLink() {
    const url = `${window.location.origin}/blog/${this.post()?.slug || this.post()?._id}`;
    navigator.clipboard.writeText(url).then(() => {
      this.messageService.showSuccess('Link copied to clipboard!');
    });
  }

  shareOnTwitter() {
    const url = encodeURIComponent(`${window.location.origin}/blog/${this.post()?.slug}`);
    const text = encodeURIComponent(this.post()?.title);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  }

  shareOnLinkedIn() {
    const url = encodeURIComponent(`${window.location.origin}/blog/${this.post()?.slug}`);
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}`, '_blank');
  }

  goBack() {
    this.router.navigate([this.isAdminView() ? '/blog/admin/list' : '/blog/list']);
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'published': return 'pi-check-circle text-green-600';
      case 'draft': return 'pi-file-edit text-orange-500';
      case 'archived': return 'pi-box text-slate-500';
      default: return 'pi-info-circle text-blue-500';
    }
  }

  editPost() {
    this.router.navigate(['/blog/admin/edit', this.post()._id]);
  }
}