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

  const token = authService.getToken();
  const isApiUrl = request.url.startsWith(environment.apiUrl);

  if (token && isApiUrl) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(request);
};
