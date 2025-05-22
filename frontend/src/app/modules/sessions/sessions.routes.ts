import { Routes } from '@angular/router';
import { CreateSessionComponent } from './create-session/create-session.component';
import { SessionDetailComponent } from './session-detail/session-detail.component';
import { SessionEditComponent } from './session-edit/session-edit.component';
import { SessionListComponent } from './session-list/session-list.component';

export const SESSIONS_ROUTES: Routes = [
  {
    path: '',
    component: SessionListComponent,
    pathMatch: 'full'
  },
  {
    path: 'create',
    component: CreateSessionComponent
  },
  {
    path: ':sessionId',
    component: SessionDetailComponent,
  },
  {
    path: ':sessionId/edit',
    component: SessionEditComponent,
  },
];
