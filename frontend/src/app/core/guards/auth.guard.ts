// frontend/src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, take } from 'rxjs';

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
    console.log(`[AuthGuard] Checking route: ${state.url}`); // <<< ADDED LOG
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        console.log(`[AuthGuard] Is Authenticated: ${isAuthenticated}`); // <<< ADDED LOG
        if (isAuthenticated) {
          console.log(`[AuthGuard] Access granted to: ${state.url}`); // <<< ADDED LOG
          return true;
        }

        // User not authenticated, redirect to login page with return url
        console.log(`[AuthGuard] Access denied. Redirecting to login. Return URL: ${state.url}`); // <<< ADDED LOG
        this.router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      })
    );
  }
}

// Ensure this file is treated as a module
// export {}; // Already handled by class export
