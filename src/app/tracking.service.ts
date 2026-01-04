// src/app/tracking.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

/* ---------- Interfaces ---------- */
export interface TrackResponse {
  success: boolean;
  event: string;
  slug: string;
  source: string;
}

export interface CampaignAnalyticsSummary {
  campaignSlug: string;
  views: number;
  plays: number;
  completes: number;
  clicks: number;
  conversionRate: number;
}

export interface SourceStats {
  views: number;
  plays: number;
  completes: number;
  clicks: number;
}

export interface DateStats {
  date: string;
  views: number;
  plays: number;
  completes: number;
  clicks: number;
}

export interface CampaignAnalyticsDetail {
  campaignSlug: string;
  totalViews: number;
  totalPlays: number;
  totalCompletes: number;
  totalClicks: number;
  conversionRate: number;
  bySource: Record<string, SourceStats>;
  byDate: DateStats[];
}

export interface SharePlatform {
  name: string;
  label: string;
  url: string;
}

export interface ShareLinksResponse {
  campaignSlug: string;
  baseUrl: string;
  shareLinks: Record<string, string>;
  platforms: SharePlatform[];
}

/* ---------- Service ---------- */
@Injectable({ providedIn: 'root' })
export class TrackingService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  /* ----------------------------------------------------------
   * Get source from URL query parameters
   * ---------------------------------------------------------- */
  getSourceFromUrl(): string {
    if (typeof window === 'undefined') return 'direct';
    const params = new URLSearchParams(window.location.search);
    return params.get('utm_source') || params.get('source') || 'direct';
  }

  /* ----------------------------------------------------------
   * Track page view (public, no auth)
   * ---------------------------------------------------------- */
  trackView(slug: string, source?: string): Observable<TrackResponse> {
    const src = source || this.getSourceFromUrl();
    return this.http.post<TrackResponse>(
      `${this.base}/track/view/${slug}?source=${encodeURIComponent(src)}`,
      {}
    );
  }

  /* ----------------------------------------------------------
   * Track video play (public, no auth)
   * ---------------------------------------------------------- */
  trackPlay(slug: string, source?: string): Observable<TrackResponse> {
    const src = source || this.getSourceFromUrl();
    return this.http.post<TrackResponse>(
      `${this.base}/track/play/${slug}?source=${encodeURIComponent(src)}`,
      {}
    );
  }

  /* ----------------------------------------------------------
   * Track video completion (public, no auth)
   * ---------------------------------------------------------- */
  trackComplete(slug: string, source?: string): Observable<TrackResponse> {
    const src = source || this.getSourceFromUrl();
    return this.http.post<TrackResponse>(
      `${this.base}/track/complete/${slug}?source=${encodeURIComponent(src)}`,
      {}
    );
  }

  /* ----------------------------------------------------------
   * Track CTA click (public, no auth)
   * ---------------------------------------------------------- */
  trackClick(slug: string, source?: string): Observable<TrackResponse> {
    const src = source || this.getSourceFromUrl();
    return this.http.post<TrackResponse>(
      `${this.base}/track/click/${slug}?source=${encodeURIComponent(src)}`,
      {}
    );
  }

  /* ----------------------------------------------------------
   * Get all campaigns analytics (admin, auth required)
   * ---------------------------------------------------------- */
  getAllAnalytics(): Observable<CampaignAnalyticsSummary[]> {
    const token = localStorage.getItem('auth_token') ?? '';
    return this.http.get<CampaignAnalyticsSummary[]>(
      `${this.base}/track/analytics`,
      { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
    );
  }

  /* ----------------------------------------------------------
   * Get single campaign analytics (admin, auth required)
   * ---------------------------------------------------------- */
  getCampaignAnalytics(
    slug: string,
    startDate?: string,
    endDate?: string
  ): Observable<CampaignAnalyticsDetail> {
    const token = localStorage.getItem('auth_token') ?? '';
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<CampaignAnalyticsDetail>(
      `${this.base}/track/analytics/${slug}`,
      {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
        params
      }
    );
  }

  /* ----------------------------------------------------------
   * Get share links for a campaign (public)
   * ---------------------------------------------------------- */
  getShareLinks(slug: string): Observable<ShareLinksResponse> {
    return this.http.get<ShareLinksResponse>(
      `${this.base}/campaigns/${slug}/share-links`
    );
  }
}
