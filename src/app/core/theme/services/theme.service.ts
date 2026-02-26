import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentThemeSubject = new BehaviorSubject<string>('theme-luminous');
  public currentTheme$ = this.currentThemeSubject.asObservable();
  
  private availableThemes = ['theme-luminous', 'theme-midnight', 'theme-bio-frost', 'theme-solar-flare'];

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.loadSavedTheme();
  }

  private loadSavedTheme(): void {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme && this.availableThemes.includes(savedTheme)) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('theme-luminous'); // Default theme
    }
  }

  setTheme(themeClass: string): void {
    // Remove all theme classes
    this.availableThemes.forEach(theme => {
      this.renderer.removeClass(document.body, theme);
    });
    
    // Add new theme class
    this.renderer.addClass(document.body, themeClass);
    
    // Save to localStorage
    localStorage.setItem('app-theme', themeClass);
    this.currentThemeSubject.next(themeClass);
  }

  toggleTheme(): void {
    const currentIndex = this.availableThemes.indexOf(this.currentThemeSubject.value);
    const nextIndex = (currentIndex + 1) % this.availableThemes.length;
    this.setTheme(this.availableThemes[nextIndex]);
  }

  getCurrentTheme(): string {
    return this.currentThemeSubject.value;
  }

  isDarkMode(): boolean {
    const currentTheme = this.currentThemeSubject.value;
    return currentTheme === 'theme-midnight' || currentTheme === 'theme-bio-frost';
  }
}