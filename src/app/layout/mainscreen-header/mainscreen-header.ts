import { Component, OnInit, inject, ViewChild, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { PopoverModule, Popover } from 'primeng/popover';
import { TieredMenuModule } from 'primeng/tieredmenu';

import { LayoutService } from '../layout.service';
import { SIDEBAR_MENU } from '../mainscreensidebar/menu-items.constants';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, ThemeSettings } from '../../core/theme/services/theme.service';
import { MyInvitationsWidgetComponent } from "../../features/courses/components/myInvite/myInvite.component";

export interface Theme {
  name: string;
  id: string;
  color: string;
  gradient: string;
  category: string;
  description: string;
}

export interface ThemeGroup {
  category: string;
  themes: Theme[];
}

@Component({
  selector: 'app-mainscreen-header',
  standalone: true,
  imports: [
    CommonModule,
    TieredMenuModule,
    FormsModule,
    RouterModule,
    AvatarModule,
    ButtonModule,
    TooltipModule,
    ToggleButtonModule,
    PopoverModule,
    MyInvitationsWidgetComponent
  ],
  templateUrl: './mainscreen-header.html',
  styleUrl: './mainscreen-header.scss',
})
export class MainscreenHeader implements OnInit {
  // Modern Signal Inputs & Outputs
  isMobileMenuOpen = input<boolean>(false);
  toggleSidebar = output<void>();

  @ViewChild('profilePopover') profilePopover!: Popover;
  @ViewChild('notificationPopover') notificationPopover!: Popover;
recentNotifications = signal<any[]>([]);
  inviteCount = signal<number>(0); // ADD THIS LINE to track invitation count
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private layout = inject(LayoutService);

  // Modern Signal State
  textScale = signal<number>(100);
  activePopoverTab = signal<'settings' | 'notifications'>('settings');
  currentUser = signal<any>(null);
  isDarkMode = signal<boolean>(false);
  activeThemeId = signal<string>('theme-light');
  themeGroups = signal<ThemeGroup[]>([]);
  mobileMenuItems = signal<any[]>([]);

  allThemes: Theme[] = [
    { name: "Auto", id: "auto-theme", color: "#2563eb", gradient: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)", category: "core", description: "Auto-detects system preference" },
    { name: "Glass", id: "theme-glass", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)", category: "core", description: "Modern professional glassmorphism" },
    { name: "Light", id: "theme-light", color: "#f1f5f9", gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", category: "core", description: "Clean data-optimized light mode" },
    { name: "Dark", id: "theme-dark", color: "#0f172a", gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", category: "core", description: "Enhanced high-contrast dark mode" },
    { name: "Aksh Horizon Light", id: "theme-aksh-horizon-light", color: "#0B2D72", gradient: "linear-gradient(135deg, #f4f7f9 0%, #A2CB8B 100%)", category: "core", description: "A calming, highly readable light mode using deep navy and soft sage." },
    { name: "Aksh Zenith", id: "theme-aksh-zenith", color: "#0072bc", gradient: "linear-gradient(135deg, #050911 0%, #0072bc 100%)", category: "core", description: "Ultra-premium cinematic dark mode with hairline borders." },
    { name: "Aksh Aurora Light", id: "theme-aksh-aurora-light", color: "#0072bc", gradient: "linear-gradient(135deg, #f0f7fb 0%, #8dc63f 100%)", category: "core", description: "Crisp, fresh light mode with cerulean and lime accents." },
    { name: "Aksh Aurora", id: "theme-aksh-aurora", color: "#0072bc", gradient: "linear-gradient(135deg, #0072bc 0%, #8dc63f 100%)", category: "core", description: "Vibrant blue-green fusion with deep immersive gradients." },
    { name: "Aksh Midnight", id: "theme-aksh-midnight", color: "#007ACC", gradient: "linear-gradient(135deg, #007ACC 0%, #8CC63F 100%)", category: "core", description: "Premium dark glass with deep navy and vibrant brand accents." }, 
    { name: "Bio Frost", id: "theme-bio-frost", color: "#34d399", gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)", category: "core", description: "Milky white glass with emerald accents" },
    { name: "Premium", id: "theme-premium", color: "#0d9488", gradient: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)", category: "professional", description: "Rich Teal & Sky Blue" },
    { name: "Titanium", id: "theme-titanium", color: "#0891b2", gradient: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)", category: "professional", description: "Industrial Cyan & Silver" },
    { name: "Aksh Sovereign", id: "theme-aksh-sovereign", color: "#A3B18A", gradient: "linear-gradient(135deg, #080a09 0%, #151e18 100%)", category: "premium", description: "Quiet luxury. Smoked crystal glass over a deep, calming obsidian canvas with organic sage accents." }, 
    { name: "Neumorphic", id: "theme-neumorphic", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", category: "modern", description: "Soft Tech Slate" },
    { name: "Deep Space", id: "theme-deep-space", color: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)", category: "modern", description: "Void Black & Cyan" }
  ];

  constructor() {
    // takeUntilDestroyed() replaces ngOnDestroy completely! Must be called in constructor.
    this.authService.currentUser$.pipe(takeUntilDestroyed()).subscribe(u => this.currentUser.set(u));

    this.themeService.settings$.pipe(takeUntilDestroyed()).subscribe((s: ThemeSettings) => {
      this.isDarkMode.set(s.isDarkMode);
      this.activeThemeId.set(s.isDarkMode ? 'theme-dark' : s.lightThemeClass || 'theme-light');
      if (s.textScale) this.textScale.set(s.textScale);
    });
  }

  ngOnInit() {
    this.organizeThemes();
    this.mobileMenuItems.set(SIDEBAR_MENU);
  }

  updateTextScale(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    this.themeService.setTextScale(value);
  }

  organizeThemes() {
    const categoryMapping: Record<string, string> = {
      'core': 'Core', 'professional': 'Professional', 'minimal': 'Minimal',
      'colorful': 'Colorful', 'luxury': 'Luxury', 'modern': 'Modern',
      'system': 'System', 'dark': 'Dark'
    };

    const categories = [...new Set(this.allThemes.map(t => t.category))];
    const grouped = categories.map(cat => ({
      category: categoryMapping[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
      themes: this.allThemes.filter(t => t.category === cat)
    }));
    this.themeGroups.set(grouped);
  }

  onMenuToggle() {
    if (this.layout.isMobile()) {
      this.layout.toggleMobile();
    } else {
      this.layout.togglePin();
    }
    this.toggleSidebar.emit();
  }

  toggleDarkMode(isDark: boolean) {
    this.themeService.setDarkMode(isDark);
  }

  selectTheme(id: string) {
    if (id === 'theme-dark') {
      this.themeService.setDarkMode(true);
    } else if (id === 'auto-theme') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.themeService.setDarkMode(prefersDark);
      this.activeThemeId.set(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
      this.themeService.setLightTheme(id);
      this.themeService.setDarkMode(false);
      this.activeThemeId.set(id);
    }
  }

  randomTheme() {
    const availableThemes = this.allThemes.filter(theme => theme.id !== this.activeThemeId());
    if (availableThemes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * availableThemes.length);
    this.selectTheme(availableThemes[randomIndex].id);
  }

  resetToDefault() {
    this.selectTheme('theme-light');
    this.themeService.setDarkMode(false);
  }

  logout() {
    this.authService.logout();
    this.closeAllPopovers();
  }

  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
  }

  closeAllPopovers() {
    if (this.profilePopover) this.profilePopover.hide();
    if (this.notificationPopover) this.notificationPopover.hide();
  }
}
// import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterModule } from '@angular/router';
// import { Subject, takeUntil } from 'rxjs';

// import { AvatarModule } from 'primeng/avatar';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ToggleButtonModule } from 'primeng/togglebutton';
// import { PopoverModule, Popover } from 'primeng/popover';
// import { TieredMenuModule } from 'primeng/tieredmenu';

// import { LayoutService } from '../layout.service';
// import { SIDEBAR_MENU } from '../mainscreensidebar/menu-items.constants';
// import { AuthService } from '../../core/services/auth.service';
// import { ThemeService, ThemeSettings } from '../../core/theme/services/theme.service';
// import { MyInvitationsWidgetComponent } from "../../features/courses/components/myInvite/myInvite.component";

// export interface Theme {
//   name: string;
//   id: string;
//   color: string;
//   gradient: string;
//   category: string;
//   description: string;
// }

// export interface ThemeGroup {
//   category: string;
//   themes: Theme[];
// }

// @Component({
//   selector: 'app-mainscreen-header',
//   standalone: true,
//   imports: [
//     CommonModule,
//     TieredMenuModule,
//     FormsModule,
//     RouterModule,
//     AvatarModule,
//     ButtonModule,
//     TooltipModule,
//     ToggleButtonModule,
//     PopoverModule,
//     MyInvitationsWidgetComponent
// ],
//   templateUrl: './mainscreen-header.html',
//   styleUrl: './mainscreen-header.scss',
// })
// export class MainscreenHeader implements OnInit, OnDestroy {
//   @Input() isMobileMenuOpen: boolean = false;
//   @Output() toggleSidebar = new EventEmitter<void>();

//   @ViewChild('profilePopover') profilePopover!: Popover;
//   @ViewChild('notificationPopover') notificationPopover!: Popover;

//   private themeService = inject(ThemeService);
//   private authService = inject(AuthService);
//   private layout = inject(LayoutService);
//   private destroy$ = new Subject<void>();

//   textScale: number = 100;
//   activePopoverTab: 'settings' | 'notifications' = 'settings';
//   currentUser: any = null;
//   recentNotifications: any[] = [];
//   isDarkMode = false;
//   activeThemeId: string = 'theme-light';
//   themeGroups: ThemeGroup[] = [];
//   mobileMenuItems: any;

//   allThemes: Theme[] = [
//     { name: "Auto", id: "auto-theme", color: "#2563eb", gradient: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)", category: "core", description: "Auto-detects system preference" },
//     { name: "Glass", id: "theme-glass", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)", category: "core", description: "Modern professional glassmorphism" },
//     { name: "Light", id: "theme-light", color: "#f1f5f9", gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", category: "core", description: "Clean data-optimized light mode" },
//     { name: "Dark", id: "theme-dark", color: "#0f172a", gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", category: "core", description: "Enhanced high-contrast dark mode" },
//     { name: "Aksh Horizon Light", id: "theme-aksh-horizon-light", color: "#0B2D72", gradient: "linear-gradient(135deg, #f4f7f9 0%, #A2CB8B 100%)", category: "core", description: "A calming, highly readable light mode using deep navy and soft sage." },
//     { name: "Aksh Zenith", id: "theme-aksh-zenith", color: "#0072bc", gradient: "linear-gradient(135deg, #050911 0%, #0072bc 100%)", category: "core", description: "Ultra-premium cinematic dark mode with hairline borders." },
//     { name: "Aksh Aurora Light", id: "theme-aksh-aurora-light", color: "#0072bc", gradient: "linear-gradient(135deg, #f0f7fb 0%, #8dc63f 100%)", category: "core", description: "Crisp, fresh light mode with cerulean and lime accents." },
//     { name: "Aksh Aurora", id: "theme-aksh-aurora", color: "#0072bc", gradient: "linear-gradient(135deg, #0072bc 0%, #8dc63f 100%)", category: "core", description: "Vibrant blue-green fusion with deep immersive gradients." },
//     { name: "Aksh Midnight", id: "theme-aksh-midnight", color: "#007ACC", gradient: "linear-gradient(135deg, #007ACC 0%, #8CC63F 100%)", category: "core", description: "Premium dark glass with deep navy and vibrant brand accents." }, { name: "Bio Frost", id: "theme-bio-frost", color: "#34d399", gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)", category: "core", description: "Milky white glass with emerald accents" },
//     { name: "Premium", id: "theme-premium", color: "#0d9488", gradient: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)", category: "professional", description: "Rich Teal & Sky Blue" },
//     { name: "Titanium", id: "theme-titanium", color: "#0891b2", gradient: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)", category: "professional", description: "Industrial Cyan & Silver" },
//     {
//       name: "Aksh Sovereign",
//       id: "theme-aksh-sovereign",
//       color: "#A3B18A",
//       gradient: "linear-gradient(135deg, #080a09 0%, #151e18 100%)",
//       category: "premium",
//       description: "Quiet luxury. Smoked crystal glass over a deep, calming obsidian canvas with organic sage accents."
//     }, { name: "Neumorphic", id: "theme-neumorphic", color: "#6366f1", gradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", category: "modern", description: "Soft Tech Slate" },
//     { name: "Deep Space", id: "theme-deep-space", color: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)", category: "modern", description: "Void Black & Cyan" }
//   ];

//   ngOnInit() {
//     this.organizeThemes();
//     this.mobileMenuItems = SIDEBAR_MENU;
//     this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => this.currentUser = u);

//     this.themeService.settings$.pipe(takeUntil(this.destroy$)).subscribe((s: ThemeSettings) => {
//       this.isDarkMode = s.isDarkMode;
//       this.activeThemeId = s.isDarkMode ? 'theme-dark' : s.lightThemeClass || 'theme-light';
//       if (s.textScale) this.textScale = s.textScale;
//     });
//   }

//   updateTextScale(event: Event) {
//     const input = event.target as HTMLInputElement;
//     const value = parseInt(input.value, 10);
//     this.themeService.setTextScale(value);
//   }

//   organizeThemes() {
//     const categoryMapping: Record<string, string> = {
//       'core': 'Core', 'professional': 'Professional', 'minimal': 'Minimal',
//       'colorful': 'Colorful', 'luxury': 'Luxury', 'modern': 'Modern',
//       'system': 'System', 'dark': 'Dark'
//     };

//     const categories = [...new Set(this.allThemes.map(t => t.category))];
//     this.themeGroups = categories.map(cat => ({
//       category: categoryMapping[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
//       themes: this.allThemes.filter(t => t.category === cat)
//     }));
//   }

//   onMenuToggle() {
//     if (this.layout.isMobile()) {
//       this.layout.toggleMobile();
//     } else {
//       this.layout.togglePin();
//     }
//     this.toggleSidebar.emit();
//   }

//   toggleDarkMode(isDark: boolean) {
//     this.themeService.setDarkMode(isDark);
//   }

//   selectTheme(id: string) {
//     if (id === 'theme-dark') {
//       this.themeService.setDarkMode(true);
//     } else if (id === 'auto-theme') {
//       const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//       this.themeService.setDarkMode(prefersDark);
//       this.activeThemeId = prefersDark ? 'theme-dark' : 'theme-light';
//     } else {
//       this.themeService.setLightTheme(id);
//       this.themeService.setDarkMode(false);
//       this.activeThemeId = id;
//     }
//   }

//   randomTheme() {
//     const availableThemes = this.allThemes.filter(theme => theme.id !== this.activeThemeId);
//     if (availableThemes.length === 0) return;
//     const randomIndex = Math.floor(Math.random() * availableThemes.length);
//     this.selectTheme(availableThemes[randomIndex].id);
//   }

//   resetToDefault() {
//     this.selectTheme('theme-light');
//     this.themeService.setDarkMode(false);
//   }

//   logout() {
//     this.authService.logout();
//     this.closeAllPopovers();
//   }

//   getInitials(name: string): string {
//     return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
//   }

//   closeAllPopovers() {
//     if (this.profilePopover) this.profilePopover.hide();
//     if (this.notificationPopover) this.notificationPopover.hide();
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }