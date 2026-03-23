import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PostCardComponent } from '../post-card/post-card.component';
import { Post } from '../../../../core/services/post.service';

@Component({
  selector: 'app-related-posts',
  standalone: true,
  imports: [CommonModule, RouterModule, PostCardComponent],
  template: `
    <div class="mt-12 pt-10 lg:mt-16 lg:pt-12 border-t border-[var(--border-secondary)]">
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] tracking-tight" style="font-family: var(--font-heading);">
          Related Reads
        </h2>
        <a routerLink="/blog" 
           class="flex items-center gap-2 font-semibold text-sm lg:text-base text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-colors group">
          View All 
          <i class="pi pi-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
        </a>
      </div>
      
      <!-- Responsive Grid: 1 column on mobile, 2 on tablet, 3 on desktop -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        @for (post of posts; track post._id) {
          <!-- 
            We use a wrapper div with a click event instead of routerLink.
            This allows us to trigger the scroll-to-top behavior manually.
          -->
          <div (click)="navigateToPost(post)" 
               class="block cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl rounded-[var(--ui-border-radius-xl)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] bg-[var(--bg-secondary)]">
            
            <!-- Adding pointer-events-none ensures the click bubbles up to our wrapper div cleanly -->
            <app-post-card [post]="post" class="pointer-events-none block h-full"></app-post-card>
            
          </div>
        }
      </div>
    </div>
  `,
  styles: [] // Completely removed in favor of Tailwind
})
export class RelatedPostsComponent {
  @Input({ required: true }) posts: Post[] | any[] = [];
  private router = inject(Router);
  navigateToPost(post: any) {
    const routeParam = post.slug || post._id;
    this.router.navigate(['/blog', routeParam]).then((navigated) => {
      if (navigated) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  }
}