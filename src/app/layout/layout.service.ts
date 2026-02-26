import { Injectable, signal, inject, NgZone, DestroyRef } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  isSidebarOpen = signal<boolean>(window.innerWidth > 992);
  isMobile = signal<boolean>(window.innerWidth <= 992);
  
  private ngZone = inject(NgZone);
  private destroyRef = inject(DestroyRef);

  constructor() {
    // Listen to window resize outside of Angular's cycle for performance
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('resize', this.onResize);
    });

    // Modern Angular 16+ way to handle cleanup
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', this.onResize);
    });
  }

  private onResize = () => {
    this.ngZone.run(() => {
      this.checkScreenSize();
    });
  };

  private checkScreenSize() {
    const mobile = window.innerWidth <= 992;
    
    if (this.isMobile() !== mobile) {
      this.isMobile.set(mobile);
    }
    
    // Auto-adjust sidebar when crossing the mobile/desktop boundary
    if (mobile && this.isSidebarOpen()) {
      this.isSidebarOpen.set(false);
    } else if (!mobile && !this.isSidebarOpen()) {
      this.isSidebarOpen.set(true);
    }
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebarOnMobile() {
    if (this.isMobile()) {
      this.isSidebarOpen.set(false);
    }
  }
}
// import { Injectable, signal, inject, NgZone, OnDestroy } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class LayoutService implements OnDestroy {
//   // Signals for reactive state
//   isSidebarOpen = signal<boolean>(window.innerWidth > 992);
//   isMobile = signal<boolean>(window.innerWidth <= 992);
  
//   private ngZone = inject(NgZone);

//   constructor() {
//     // Run outside Angular to prevent UI lag on every single pixel movement
//     this.ngZone.runOutsideAngular(() => {
//       window.addEventListener('resize', this.onResize);
//     });
//   }

//   // Arrow function to preserve 'this' context in the event listener
//   private onResize = () => {
//     // Bring it back INTO Angular's zone to visually update the UI
//     this.ngZone.run(() => {
//       this.checkScreenSize();
//     });
//   };

//   private checkScreenSize() {
//     const mobile = window.innerWidth <= 992;
    
//     // Only update the mobile signal if the state actually changed
//     if (this.isMobile() !== mobile) {
//       this.isMobile.set(mobile);
//     }
    
//     // Auto-adjust sidebar based on screen size crossing the threshold
//     if (mobile && this.isSidebarOpen()) {
//       this.isSidebarOpen.set(false);
//     } else if (!mobile && !this.isSidebarOpen()) {
//       this.isSidebarOpen.set(true);
//     }
//   }

//   toggleSidebar() {
//     this.isSidebarOpen.update(open => !open);
//   }

//   closeSidebarOnMobile() {
//     if (this.isMobile()) {
//       this.isSidebarOpen.set(false);
//     }
//   }

//   // Always clean up native event listeners to prevent memory leaks!
//   ngOnDestroy() {
//     window.removeEventListener('resize', this.onResize);
//   }
// }