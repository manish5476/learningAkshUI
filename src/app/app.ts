import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // <-- THIS IS CRITICAL
  template: `<router-outlet></router-outlet>`
})
export class App {}

// import { Component, inject, signal } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
// import { ThemeService } from './core/theme/services/theme.service';

// @Component({
//   selector: 'app-root',
//   imports: [RouterOutlet],
//   templateUrl: './app.html',
//   styleUrl: './app.scss'
// })
// export class App {
//   protected readonly title = signal('my-latest-app');
//   themeService: any = inject(ThemeService)
//   ngOnInit(): void {
//     //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
//     //Add 'implements OnInit' to the class.
//     this.themeService.setTheme('theme-midnight')
//   }
// }
