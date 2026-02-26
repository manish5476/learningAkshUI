import { Component, inject } from '@angular/core';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <div class="header-left">
        <button class="menu-toggle" (click)="layout.toggleSidebar()" aria-label="Toggle Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h2 class="brand-title">EdTech Admin</h2>
      </div>
      
      <div class="header-right">
        <div class="avatar">U</div>
      </div>
    </header>
  `,
  styles: [`
    .header { height: 70px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: #ffffff; border-bottom: 1px solid #e2e8f0; z-index: 10; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .brand-title { margin: 0; font-size: 1.25rem; font-weight: 600; color: #1e293b; }
    .menu-toggle { background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #475569; transition: background 0.2s; }
    .menu-toggle:hover { background: #f1f5f9; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--primary-color, #4f46e5); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    
    :host-context(body.dark-theme) .header { background: #1e1e2f; border-color: #333; }
    :host-context(body.dark-theme) .brand-title, :host-context(body.dark-theme) .menu-toggle { color: #f8fafc; }
    :host-context(body.dark-theme) .menu-toggle:hover { background: #334155; }
  `]
})
export class HeaderComponent {
  layout = inject(LayoutService);
}