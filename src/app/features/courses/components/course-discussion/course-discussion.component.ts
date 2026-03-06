import { Component, OnInit, inject, DestroyRef, input, signal, effect } from '@angular/core';
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

// Services & Models
import { DiscussionService, Discussion, DiscussionReply } from '../../../../core/services/discussion.service';
import { AuthService } from '../../../../core/services/auth.service'; // ✅ Added Auth Service

@Component({
  selector: 'app-course-discussion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DialogModule,
    TooltipModule,
    AvatarModule,
    TagModule,
    DatePipe
  ],
  templateUrl: './course-discussion.component.html',
  styleUrls: ['./course-discussion.component.scss']
})
export class CourseDiscussionComponent implements OnInit {
  // Inputs (Only the bare minimum needed now!)
  courseId = input.required<string>();
  lessonId = input<string | undefined>();

  // Injectors
  private discussionService = inject(DiscussionService);
  private authService = inject(AuthService); // ✅ Injected Auth Service
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // State Signals
  discussions = signal<Discussion[]>([]);
  selectedDiscussion = signal<Discussion | null>(null);
  isLoading = signal<boolean>(true);
  isReplying = signal<boolean>(false);
  
  // ✅ Automatically determined Auth State
  currentUserId = signal<string>('');
  canModerate = signal<boolean>(false); // True if Admin OR Instructor
  
  // Dialog State
  showNewDiscussionDialog = signal<boolean>(false);

  // Forms
  newDiscussionForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    content: ['', [Validators.required, Validators.minLength(10)]]
  });

  replyForm: FormGroup = this.fb.group({
    content: ['', Validators.required]
  });

  constructor() {
    // Automatically reload if courseId or lessonId changes
    effect(() => {
      if (this.courseId()) {
        this.loadDiscussions();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // ✅ Automatically set the user credentials when the component loads
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId.set(user._id);
      // Both Admins and Instructors get moderation privileges (Pin/Resolve)
      this.canModerate.set(this.authService.isAdmin() || this.authService.isInstructor()); 
    }
  }

  // ==========================================
  // DATA LOADING
  // ==========================================
  loadDiscussions(): void {
    this.isLoading.set(true);
    this.discussionService.getCourseDiscussions(this.courseId(), this.lessonId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          // ✅ FIX: Added optional chaining and fallback array to satisfy TypeScript
          const fetchedDiscussions = res?.data?.discussions || [];
          this.discussions.set(fetchedDiscussions);
          this.isLoading.set(false);
          
          // If a discussion was selected, update its data to show new replies/likes
          if (this.selectedDiscussion()) {
            const updated = fetchedDiscussions.find((d: Discussion) => d._id === this.selectedDiscussion()?._id);
            if (updated) this.selectedDiscussion.set(updated);
          }
        },
        error: (err) => {
          console.error('Failed to load discussions', err);
          this.isLoading.set(false);
        }
      });
  }

  // ==========================================
  // VIEW NAVIGATION
  // ==========================================
  viewThread(discussion: Discussion): void {
    this.selectedDiscussion.set(discussion);
  }

  backToList(): void {
    this.selectedDiscussion.set(null);
    this.replyForm.reset();
  }

  // ==========================================
  // CREATE DISCUSSION
  // ==========================================
  openNewDiscussion(): void {
    this.newDiscussionForm.reset();
    this.showNewDiscussionDialog.set(true);
  }

  submitNewDiscussion(): void {
    if (this.newDiscussionForm.invalid) return;

    this.isLoading.set(true);
    const payload = {
      ...this.newDiscussionForm.value,
      lesson: this.lessonId() // Attach to specific lesson if applicable
    };

    this.discussionService.createDiscussion(this.courseId(), payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showNewDiscussionDialog.set(false);
          this.loadDiscussions(); // Refresh list
        },
        error: (err) => {
          console.error('Failed to post discussion', err);
          this.isLoading.set(false);
        }
      });
  }

  // ==========================================
  // REPLIES
  // ==========================================
  submitReply(): void {
    if (this.replyForm.invalid || !this.selectedDiscussion()) return;

    this.isReplying.set(true);
    const discussionId = this.selectedDiscussion()!._id;

    this.discussionService.replyToDiscussion(this.courseId(), discussionId, this.replyForm.value.content)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.replyForm.reset();
          this.isReplying.set(false);
          this.loadDiscussions(); // Refresh to get the populated reply
        },
        error: (err) => {
          console.error('Failed to post reply', err);
          this.isReplying.set(false);
        }
      });
  }

  // ==========================================
  // INTERACTIONS (Likes, Pins, Resolves)
  // ==========================================
  toggleLike(event: Event, item: any, type: 'discussion' | 'reply'): void {
    event.stopPropagation(); // Prevent clicking the card from opening the thread
    
    // Optimistic UI Update
    const userId = this.currentUserId();
    const hasLiked = item.likes.includes(userId);
    
    if (hasLiked) {
      item.likes = item.likes.filter((id: string) => id !== userId);
    } else {
      item.likes.push(userId);
    }

    this.discussionService.toggleLike(this.courseId(), type, item._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => this.loadDiscussions() // Revert on failure
      });
  }

  toggleResolve(discussion: Discussion): void {
    // Optimistic Update
    discussion.isResolved = !discussion.isResolved;
    
    this.discussionService.markResolved(this.courseId(), discussion._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => this.loadDiscussions() // Revert on failure
      });
  }

  togglePin(discussion: Discussion): void {
    discussion.isPinned = !discussion.isPinned;
    
    this.discussionService.pinDiscussion(this.courseId(), discussion._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => this.loadDiscussions() // Revert on failure
      });
  }

  // ==========================================
  // UTILS
  // ==========================================
  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  hasUserLiked(item: any): boolean {
    return item.likes?.includes(this.currentUserId());
  }
}

