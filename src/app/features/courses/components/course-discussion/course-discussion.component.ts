import { Component, OnInit, inject, DestroyRef, input, signal, effect, ViewChild, ElementRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';

// Services & Models (Mocked imports based on your code)
import { DiscussionService, Discussion, DiscussionReply } from '../../../../core/services/discussion.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-course-discussion',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, ButtonModule,
    InputTextModule, TextareaModule, DialogModule, TooltipModule,
    AvatarModule, TagModule, DatePipe
  ],
  templateUrl: './course-discussion.component.html',
  styleUrls: ['./course-discussion.component.scss']
})
export class CourseDiscussionComponent implements OnInit {
  courseId = input.required<string>();
  lessonId = input<string | undefined>();

  private discussionService = inject(DiscussionService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;

  discussions = signal<Discussion[]>([]);
  selectedDiscussion = signal<Discussion | null>(null);
  isLoading = signal<boolean>(true);
  isReplying = signal<boolean>(false);
  
  currentUserId = signal<string>('');
  canModerate = signal<boolean>(false); 
  showNewDiscussionDialog = signal<boolean>(false);

  newDiscussionForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    content: ['', [Validators.required, Validators.minLength(10)]]
  });

  replyForm: FormGroup = this.fb.group({
    content: ['', Validators.required]
  });

  constructor() {
    effect(() => {
      if (this.courseId()) this.loadDiscussions();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId.set(user._id);
      this.canModerate.set(this.authService.isAdmin() || this.authService.isInstructor()); 
    }
  }

  scrollToBottom(): void {
    // A small timeout allows Angular to render the newly added DOM elements first
    setTimeout(() => {
      if (this.chatScrollContainer?.nativeElement) {
        this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
      }
    }, 50); 
  }

  loadDiscussions(scrollToBottom: boolean = false): void {
    this.isLoading.set(true);
    this.discussionService.getCourseDiscussions(this.courseId(), this.lessonId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const fetchedDiscussions = res?.data?.discussions || [];
          this.discussions.set(fetchedDiscussions);
          this.isLoading.set(false);
          
          if (this.selectedDiscussion()) {
            const updated = fetchedDiscussions.find((d: Discussion) => d._id === this.selectedDiscussion()?._id);
            if (updated) {
              this.selectedDiscussion.set(updated);
              if (scrollToBottom) this.scrollToBottom();
            } else {
              this.backToList();
            }
          }
        },
        error: (err) => {
          console.error('Failed to load discussions', err);
          this.isLoading.set(false);
        }
      });
  }

  viewThread(discussion: Discussion): void {
    this.selectedDiscussion.set(discussion);
    this.scrollToBottom(); 
  }

  backToList(): void {
    this.selectedDiscussion.set(null);
    this.replyForm.reset();
  }

  openNewDiscussion(): void {
    this.newDiscussionForm.reset();
    this.showNewDiscussionDialog.set(true);
  }

  submitNewDiscussion(): void {
    if (this.newDiscussionForm.invalid) return;
    this.isLoading.set(true);
    const payload = { ...this.newDiscussionForm.value, lesson: this.lessonId() };

    this.discussionService.createDiscussion(this.courseId(), payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showNewDiscussionDialog.set(false);
          this.loadDiscussions(); 
        }
      });
  }

  deleteDiscussion(event: Event, id: string): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this entire discussion?')) {
      this.isLoading.set(true);
      this.discussionService.deleteDiscussion(this.courseId(), id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            if (this.selectedDiscussion()?._id === id) this.backToList();
            this.loadDiscussions();
          }
        });
    }
  }

  submitReply(): void {
    if (this.replyForm.invalid || !this.selectedDiscussion()) return;
    this.isReplying.set(true);
    
    this.discussionService.replyToDiscussion(this.courseId(), this.selectedDiscussion()!._id, this.replyForm.value.content)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.replyForm.reset();
          this.isReplying.set(false);
          this.loadDiscussions(true); 
        },
        error: () => this.isReplying.set(false)
      });
  }

  deleteReply(replyId: string): void {
    if (confirm('Are you sure you want to delete this reply?')) {
      // PROPER MUTATION: Update signal immutably
      this.selectedDiscussion.update(thread => {
        if (!thread) return null;
        return {
          ...thread,
          replies: thread.replies?.filter(r => r._id !== replyId) || []
        };
      });

      // NOTE: Call backend delete reply here
      // this.discussionService.deleteReply(...).subscribe();
    }
  }

  toggleLike(event: Event, item: any, type: 'discussion' | 'reply'): void {
    event.stopPropagation();
    const userId = this.currentUserId();
    const hasLiked = this.hasUserLiked(item);
    
    // Immutably calculate new likes array
    const newLikes = hasLiked 
      ? item.likes.filter((id: string) => id !== userId)
      : [...(item.likes || []), userId];

    // PROPER MUTATION: Update the Signals immutably
    if (type === 'discussion') {
      this.discussions.update(docs => docs.map(d => d._id === item._id ? { ...d, likes: newLikes } : d));
      if (this.selectedDiscussion()?._id === item._id) {
         this.selectedDiscussion.update(d => d ? { ...d, likes: newLikes } : null);
      }
    } else if (type === 'reply') {
      this.selectedDiscussion.update(d => {
        if (!d) return null;
        return {
          ...d,
          replies: d.replies?.map(r => r._id === item._id ? { ...r, likes: newLikes } : r)
        };
      });
    }

    this.discussionService.toggleLike(this.courseId(), type, item._id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  toggleResolve(discussion: Discussion): void {
    const newStatus = !discussion.isResolved;
    this.selectedDiscussion.update(d => d ? { ...d, isResolved: newStatus } : null);
    this.discussions.update(docs => docs.map(d => d._id === discussion._id ? { ...d, isResolved: newStatus } : d));

    this.discussionService.markResolved(this.courseId(), discussion._id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  togglePin(discussion: Discussion): void {
    const newStatus = !discussion.isPinned;
    this.selectedDiscussion.update(d => d ? { ...d, isPinned: newStatus } : null);
    this.discussions.update(docs => docs.map(d => d._id === discussion._id ? { ...d, isPinned: newStatus } : d));

    this.discussionService.pinDiscussion(this.courseId(), discussion._id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  hasUserLiked(item: any): boolean {
    return item.likes?.includes(this.currentUserId()) || false;
  }
}
