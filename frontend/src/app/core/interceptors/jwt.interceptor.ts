import {
  HttpRequest,
  HttpHandlerFn,
  HttpInterceptorFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);

  // Get the auth token from the service
  const token = authService.getToken();
  const isApiUrl = request.url.startsWith(environment.apiUrl);

  // Only add token to API requests and if user is logged in
  if (token && isApiUrl) {
    // Clone the request and add the authorization header
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Pass the modified request to the next handler
  return next(request);
};
