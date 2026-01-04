import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { Dashboard } from './dashboard/dashboard';
import { CampaignDetailComponent } from './campaign-detail/campaign-detail';
import { CampaignLandingComponent } from './campaign-landing/campaign-landing';
import { AnalyticsComponent } from './analytics/analytics.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: Dashboard },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'campaigns/:slug', component: CampaignLandingComponent }, // keep only this one
  { path: '**', redirectTo: '/login' }
];