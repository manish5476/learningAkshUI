import { ApplicationConfig, provideAppInitializer, inject, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DatePipe } from '@angular/common';

// PrimeNG 19 Imports
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura'; // Or your preferred preset
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // 1. Performance & Core
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(),

    // 2. HTTP with modern Fetch API
    provideHttpClient(
      withInterceptors([]),
      withFetch()
    ),

    // 3. Animations (Async for better initial load performance)
    provideAnimationsAsync(),

    // 4. PrimeNG 19 Configuration (Styled Mode)
    providePrimeNG({
      theme: {
        preset: Aura, // Required in v19 for the new design token system
        options: {
          darkModeSelector: '.theme-dark',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        }
      },
      ripple: true
    }),

    // 5. Global Services
    MessageService,
    DialogService,
    DatePipe,

    // 6. Modern Initializer (Angular 19 style)
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      // return auth.initializeFromStorage(); // Ensure this returns a Promise/Observable if async
    })
  ]
};
//
// import { DialogService } from 'primeng/dynamicdialog';
// import { AuthService } from './core/services/auth.service';
//
// export const appConfig: ApplicationConfig = {
//   providers: [
//
//     provideHttpClient(
//       withInterceptors([ ]),
//       withFetch()
//     ),
//     provideRouter(routes),
//     provideZonelessChangeDetection(),
//     provideClientHydration(),
//     provideAnimationsAsync(),
//
//     // PRIME NG CONFIGURATION
//     providePrimeNG({
//       ripple: true,
//       theme: {
//         // preset: MyPreset,
//         options: {
//           darkModeSelector: '.theme-dark',
//           cssLayer: {
//             name: 'primeng',
//             order: 'tailwind-base, primeng, tailwind-utilities'
//           }
//         }
//       }
//     }),
//
//     MessageService,
//     DatePipe,DialogService,
//
//     // ✅ THE MODERN FIX: Using provideAppInitializer
//     provideAppInitializer(() => {
//         const auth = inject(AuthService);
//         // return auth.initializeFromStorage();
//     })
//   ]
// };
