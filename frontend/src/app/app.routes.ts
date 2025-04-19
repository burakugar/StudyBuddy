// frontend/src/app/app.routes.ts (Ensure Guard is Active)
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'matching', // Or wherever your default logged-in page is
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'chat', // Singular path
    loadChildren: () => import('./modules/chat/chat.routes').then(m => m.CHAT_ROUTES),
    canActivate: [AuthGuard] // <<< MAKE SURE THIS IS PRESENT AND NOT COMMENTED OUT
  },
  {
    path: 'matching',
    loadChildren: () => import('./modules/matching/matching.routes').then(m => m.MATCHING_ROUTES),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadChildren: () => import('./modules/profile/profile.routes').then(m => m.PROFILE_ROUTES),
    canActivate: [AuthGuard]
  },
  {
    // Wildcard route - redirect unknown paths
    path: '**',
    redirectTo: 'matching' // Or your preferred fallback route
  }
];
