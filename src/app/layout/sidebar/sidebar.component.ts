import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <nav class="nav-menu">
        <a routerLink="/dashboard/projects" routerLinkActive="active" (click)="layout.closeSidebarOnMobile()">
          <span class="icon">📁</span> Projects
        </a>
        <a routerLink="/dashboard/courses" routerLinkActive="active" (click)="layout.closeSidebarOnMobile()">
          <span class="icon">🎓</span> Courses
        </a>
        <a routerLink="/dashboard/settings" routerLinkActive="active" (click)="layout.closeSidebarOnMobile()">
          <span class="icon">⚙️</span> Settings
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar { display: flex; flex-direction: column; height: 100%; padding: 24px 16px; background: #f8fafc; border-right: 1px solid #e2e8f0; overflow-y: auto; }
    .nav-menu { display: flex; flex-direction: column; gap: 8px; }
    .nav-menu a { display: flex; align-items: center; gap: 12px; padding: 12px 16px; text-decoration: none; color: #475569; border-radius: 8px; font-weight: 500; transition: all 0.2s; }
    .nav-menu a:hover { background: #e2e8f0; color: #1e293b; }
    .nav-menu a.active { background: var(--primary-color, #4f46e5); color: white; }
    .icon { font-size: 1.25rem; }

    :host-context(body.dark-theme) .sidebar { background: #181824; border-color: #333; }
    :host-context(body.dark-theme) .nav-menu a { color: #cbd5e1; }
    :host-context(body.dark-theme) .nav-menu a:hover { background: #334155; color: #fff; }
  `]
})
export class SidebarComponent {
  layout = inject(LayoutService);
}