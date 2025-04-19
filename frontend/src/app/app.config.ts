// frontend/src/app/app.config.ts (Enable Tracing)
import { ApplicationConfig } from '@angular/core';
// Import enableTracing
import { provideRouter, withDebugTracing } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Enable router tracing here using withDebugTracing
    provideRouter(routes, withDebugTracing()), // <<< ENABLED TRACING
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideClientHydration()
  ]
};

// Empty export to ensure file is recognized as a module
// export {};
// Empty export to ensure file is recognized as a module
// export {}; // Not strictly needed if there are other exports/imports
