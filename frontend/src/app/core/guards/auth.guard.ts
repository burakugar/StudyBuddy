
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, take, catchError, tap, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    console.log(`[AuthGuard] Checking route: ${state.url}`);

    return this.authService.checkToken().pipe(
      switchMap(hasToken => {
        if (hasToken) {
          return this.authService.isAuthenticated$.pipe(
            take(1),
            tap(isAuthenticated => {
              console.log(`[AuthGuard] Is Authenticated: ${isAuthenticated}`);
            })
          );
        }
        return of(false);
      }),
      map(isAuthenticated => {
        if (isAuthenticated) {
          console.log(`[AuthGuard] Access granted to: ${state.url}`);
          return true;
        }

        console.log(`[AuthGuard] Access denied. Redirecting to login. Return URL: ${state.url}`);
        this.router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }),
      catchError(error => {
        console.error(`[AuthGuard] Error checking authentication:`, error);
        this.router.navigate(['/auth/login']);
        return of(false);
      })
    );
  }

}
