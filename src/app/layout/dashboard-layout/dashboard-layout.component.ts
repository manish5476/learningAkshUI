import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="layout-wrapper" [class.sidebar-closed]="!layout.isSidebarOpen()">
      
      <div class="sidebar-container" [class.mobile-open]="layout.isMobile() && layout.isSidebarOpen()">
        <app-sidebar></app-sidebar>
      </div>

      <div class="main-container">
        <app-header></app-header>
        
        <main class="content-area">
          <div class="content-inner">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>

      @if (layout.isMobile() && layout.isSidebarOpen()) {
        <div class="mobile-overlay" (click)="layout.toggleSidebar()"></div>
      }
    </div>
  `,
  styles: [`
    .layout-wrapper { display: flex; height: 100vh; width: 100vw; overflow: hidden; background: #f1f5f9; }
    
    /* Sidebar Layout */
    .sidebar-container { width: 260px; flex-shrink: 0; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 20; }
    
    /* Main Content Layout */
    .main-container { flex: 1; display: flex; flex-direction: column; min-width: 0; /* Prevents flexbox overflow issues */ z-index: 10; }
    .content-area { flex: 1; overflow-y: auto; padding: 24px; }
    .content-inner { max-width: 1400px; margin: 0 auto; width: 100%; }

    /* Desktop Behavior: Shift content when sidebar closes */
    @media (min-width: 993px) {
      .layout-wrapper.sidebar-closed .sidebar-container { transform: translateX(-100%); margin-right: -260px; }
    }

    /* Mobile Behavior: Sidebar acts as a fly-out drawer */
    @media (max-width: 992px) {
      .sidebar-container { position: fixed; top: 0; left: 0; height: 100%; transform: translateX(-100%); box-shadow: 4px 0 15px rgba(0,0,0,0.05); }
      .sidebar-container.mobile-open { transform: translateX(0); }
      
      .mobile-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.5); z-index: 15; backdrop-filter: blur(2px); animation: fadeIn 0.3s ease; }
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Dark Mode Defaults */
    :host-context(body.dark-theme) .layout-wrapper { background: #121212; }
  `]
})
export class DashboardLayoutComponent {
  layout = inject(LayoutService);
}