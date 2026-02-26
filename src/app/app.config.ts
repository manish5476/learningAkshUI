
import { ApplicationConfig, provideAppInitializer, inject } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { DatePipe } from '@angular/common';

// PrimeNG Imports
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';

// Import your custom preset
// import { MyPreset } from './core/config/my-preset';

// // Interceptors
// import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
// import { loggingInterceptor } from './core/interceptors/logging.interceptor';

// // Services
// import { AuthService } from './modules/auth/services/auth-service';
import { DialogService } from 'primeng/dynamicdialog';
import { AuthService } from './core/services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    
    provideHttpClient(
      withInterceptors([ ]), 
      withFetch()
    ),
    provideRouter(routes),
    provideZonelessChangeDetection(),
    provideClientHydration(),
    provideAnimationsAsync(),
    
    // PRIME NG CONFIGURATION
    providePrimeNG({ 
      ripple: true, 
      theme: { 
        // preset: MyPreset, 
        options: { 
          darkModeSelector: '.theme-dark', 
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        } 
      } 
    }),

    MessageService,
    DatePipe,DialogService,

    // ✅ THE MODERN FIX: Using provideAppInitializer
    provideAppInitializer(() => {
        const auth = inject(AuthService);
        // return auth.initializeFromStorage();
    })
  ]
};

// import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
// import { provideRouter } from '@angular/router';
// // 1. Add the animations import
// import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; 

// import { routes } from './app.routes';
// import { MessageService } from 'primeng/api';

// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideBrowserGlobalErrorListeners(),
//     provideRouter(routes),
//     // 2. Add the animations provider here
//     provideAnimationsAsync() ,
//     MessageService 
//   ]
// };