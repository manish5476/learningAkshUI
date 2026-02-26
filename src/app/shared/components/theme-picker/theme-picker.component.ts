import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/theme/services/theme.service';

@Component({
  selector: 'app-theme-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="theme-picker">
      <button class="theme-toggle-btn" (click)="toggleTheme()">
        <i class="fas" [class.fa-sun]="!isDarkMode" [class.fa-moon]="isDarkMode"></i>
        <span>{{ isDarkMode ? 'Dark Mode' : 'Light Mode' }}</span>
      </button>
      
      <div class="theme-grid">
        <button 
          *ngFor="let theme of themes" 
          class="theme-option"
          [class.active]="currentTheme === theme.class"
          [class]="theme.class"
          (click)="setTheme(theme.class)">
          <span class="theme-preview">
            <span class="preview-primary"></span>
            <span class="preview-accent"></span>
          </span>
          <span class="theme-name">{{ theme.name }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .theme-picker {
      padding: var(--spacing-lg);
      
      .theme-toggle-btn {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        width: 100%;
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: var(--ui-border-radius);
        color: var(--text-primary);
        cursor: pointer;
        transition: var(--transition-base);
        margin-bottom: var(--spacing-lg);

        &:hover {
          background: var(--component-bg-hover);
          border-color: var(--accent-primary);
        }

        i {
          font-size: var(--font-size-lg);
          color: var(--accent-primary);
        }
      }

      .theme-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-md);
      }

      .theme-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: var(--ui-border-radius);
        cursor: pointer;
        transition: var(--transition-base);

        &:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        &.active {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px var(--accent-focus);
        }

        .theme-preview {
          display: flex;
          gap: var(--spacing-xs);
          width: 100%;
          height: 40px;
          border-radius: var(--ui-border-radius-sm);
          overflow: hidden;

          .preview-primary {
            flex: 1;
            background: var(--theme-bg-primary);
          }

          .preview-accent {
            flex: 1;
            background: var(--theme-accent-primary);
          }
        }

        .theme-name {
          font-size: var(--font-size-xs);
          color: var(--text-secondary);
        }

        &.theme-luminous .preview-primary { background: #f8fafc; }
        &.theme-luminous .preview-accent { background: #4f46e5; }
        
        &.theme-midnight .preview-primary { background: #0b1120; }
        &.theme-midnight .preview-accent { background: #38bdf8; }
        
        &.theme-bio-frost .preview-primary { background: #047857; }
        &.theme-bio-frost .preview-accent { background: #34d399; }
        
        &.theme-solar-flare .preview-primary { background: #c2410c; }
        &.theme-solar-flare .preview-accent { background: #fb923c; }
      }
    }
  `]
})
export class ThemePickerComponent {
  themes = [
    { name: 'Luminous', class: 'theme-luminous' },
    { name: 'Midnight', class: 'theme-midnight' },
    { name: 'Bio-Frost', class: 'theme-bio-frost' },
    { name: 'Solar Flare', class: 'theme-solar-flare' }
  ];

  currentTheme: string;
  isDarkMode: boolean;

  constructor(private themeService: ThemeService) {
    this.currentTheme = this.themeService.getCurrentTheme();
    this.isDarkMode = this.themeService.isDarkMode();
    
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
      this.isDarkMode = this.themeService.isDarkMode();
    });
  }

  setTheme(themeClass: string): void {
    this.themeService.setTheme(themeClass);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}