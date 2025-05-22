import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./modules/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
    canActivate: [AuthGuard]
  },
  {
    path: 'chats',
    loadChildren: () => import('./modules/chat/chat.routes').then(m => m.CHAT_ROUTES),
    canActivate: [AuthGuard]
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
    path: 'sessions',
    loadChildren: () => import('./modules/sessions/sessions.routes').then(m => m.SESSIONS_ROUTES),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
