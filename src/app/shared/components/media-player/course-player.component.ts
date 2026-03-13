import { Component, ElementRef, ViewChild, computed, input, signal, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-media-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-player.component.html',
  styleUrls: ['./course-player.component.scss']
})
export class mediaPlayerComponent {
  private sanitizer = inject(DomSanitizer);

  mediaToken = input.required<string>(); 
  isYouTube = input<boolean>(false);

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('playerWrapper') playerWrapper!: ElementRef<HTMLDivElement>;

  isPlaying = signal(false);
  currentTime = signal(0);
  duration = signal(100);
  playbackRate = signal(1); // New signal for speed

  private lastSavedTime = -1; // Fixes the DDOS bug

  progressPercentage = computed(() => {
    if (this.duration() === 0) return 0;
    return (this.currentTime() / this.duration()) * 100;
  });

  safeYouTubeUrl = computed<SafeResourceUrl | null>(() => {
    if (!this.isYouTube()) return null;
    // Added disablekb=1 (disables YT shortcuts) and fs=0 (disables YT fullscreen)
    const url = `https://www.youtube-nocookie.com/embed/${this.mediaToken()}?rel=0&modestbranding=1&controls=0&disablekb=1&fs=0`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  secureMediaStream = computed(() => {
    if (this.isYouTube()) return null;
    return `/api/secure-stream/stream?token=${this.mediaToken()}`;
  });

  // --- KEYBOARD SHORTCUTS ---
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.isYouTube()) return; 

    // Ignore if user is typing in an input or textarea somewhere else on the page
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

    switch(event.code) {
      case 'Space':
        event.preventDefault(); // Prevents page from scrolling down
        this.togglePlay();
        break;
      case 'ArrowRight':
        this.skip(5);
        break;
      case 'ArrowLeft':
        this.skip(-5);
        break;
      case 'KeyF':
        this.toggleFullscreen();
        break;
    }
  }

  // --- ACTIONS ---
  togglePlay() {
    if (this.isYouTube()) return;
    
    const video = this.videoElement.nativeElement;
    if (this.isPlaying()) {
      video.pause();
    } else {
      video.play();
    }
    this.isPlaying.set(!this.isPlaying());
  }

  skip(seconds: number) {
    if (this.isYouTube()) return;
    const video = this.videoElement.nativeElement;
    video.currentTime += seconds;
    this.currentTime.set(video.currentTime);
  }

  changeSpeed(event: Event) {
    if (this.isYouTube()) return;
    const select = event.target as HTMLSelectElement;
    const speed = parseFloat(select.value);
    this.playbackRate.set(speed);
    this.videoElement.nativeElement.playbackRate = speed;
  }

  toggleFullscreen() {
    const container = this.playerWrapper.nativeElement;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err: any) => console.error(err));
    } else {
      document.exitFullscreen();
    }
  }

  onTimeUpdate(event: Event) {
    const video = event.target as HTMLVideoElement;
    this.currentTime.set(video.currentTime);
    
    const currentSecond = Math.floor(video.currentTime);
    
    if (currentSecond > 0 && currentSecond % 10 === 0 && currentSecond !== this.lastSavedTime) {
      this.saveProgress(currentSecond);
      this.lastSavedTime = currentSecond;
    }
  }

  onLoadedMetadata(event: Event) {
    const video = event.target as HTMLVideoElement;
    this.duration.set(video.duration);
  }

  seek(event: MouseEvent) {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / progressBar.offsetWidth;
    const newTime = pos * this.duration();
    
    this.videoElement.nativeElement.currentTime = newTime;
    this.currentTime.set(newTime);
  }

  private saveProgress(time: number) {
    // Call backend API here
  }
}