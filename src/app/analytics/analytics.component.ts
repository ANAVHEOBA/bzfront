// src/app/analytics/analytics.component.ts
import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  TrackingService,
  CampaignAnalyticsSummary,
  CampaignAnalyticsDetail
} from '../tracking.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  private trackingSvc = inject(TrackingService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  /* ---------- State ---------- */
  campaigns: CampaignAnalyticsSummary[] = [];
  isLoading = true;
  error = '';

  /* ---------- Detail view state ---------- */
  selectedCampaign: CampaignAnalyticsDetail | null = null;
  detailLoading = false;
  detailError = '';

  /* ---------- Date filter ---------- */
  startDate = '';
  endDate = '';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && !localStorage.getItem('auth_token')) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadAnalytics();
  }

  private loadAnalytics(): void {
    this.isLoading = true;
    this.error = '';
    this.trackingSvc.getAllAnalytics().subscribe({
      next: data => {
        this.campaigns = data;
        this.isLoading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Failed to load analytics';
        this.isLoading = false;
      }
    });
  }

  viewDetails(slug: string): void {
    this.detailLoading = true;
    this.detailError = '';
    this.trackingSvc
      .getCampaignAnalytics(slug, this.startDate || undefined, this.endDate || undefined)
      .subscribe({
        next: data => {
          this.selectedCampaign = data;
          this.detailLoading = false;
        },
        error: err => {
          this.detailError = err.error?.message || 'Failed to load campaign analytics';
          this.detailLoading = false;
        }
      });
  }

  closeDetails(): void {
    this.selectedCampaign = null;
    this.detailError = '';
  }

  applyDateFilter(): void {
    if (this.selectedCampaign) {
      this.viewDetails(this.selectedCampaign.campaignSlug);
    }
  }

  clearDateFilter(): void {
    this.startDate = '';
    this.endDate = '';
    if (this.selectedCampaign) {
      this.viewDetails(this.selectedCampaign.campaignSlug);
    }
  }

  getSourceKeys(bySource: Record<string, unknown>): string[] {
    return Object.keys(bySource || {});
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
