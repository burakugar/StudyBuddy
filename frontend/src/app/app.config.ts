import { ApplicationConfig, ErrorHandler, Injectable } from '@angular/core';
import { provideRouter, withDebugTracing, withNavigationErrorHandler } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    if (error.message && error.message.includes('global is not defined')) {
      console.error('SockJS environment error detected:', error);
      console.warn('This is likely a SockJS compatibility issue. WebSocket features might be limited.');
      return;
    }

    console.error('Global error handler:', error);
  }
}

function handleNavigationError(error: any) {
  if (error.message && error.message.includes('global is not defined')) {
    console.error('SockJS error during navigation:', error);
    return '/fallback';
  }

  console.error('Navigation error:', error);
  return '/';
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withDebugTracing(),
      withNavigationErrorHandler(handleNavigationError)
    ),

    provideHttpClient(withInterceptors([jwtInterceptor])),

    provideClientHydration(),

    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
