// src/app/modules/dashboard/dashboard.routes.ts
import { Routes } from '@angular/router';
import { DashboardViewComponent } from './dashboard-view/dashboard-view.component';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: DashboardViewComponent
  }
];
