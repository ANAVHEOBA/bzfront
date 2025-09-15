// src/app/campaign.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

/* ---------- Interfaces ---------- */
export interface CampaignDto {
  slug: string;
  fullVideoUrl: string;
  fullThumbnailUrl: string;
  waLink: string;
  waButtonLabel: string;
  caption?: string;
  popupTriggerType:  'seconds' | 'percent' | null;
  popupTriggerValue: number | null;
  createdAt?: string;
  updatedAt?: string;
  _id?: string;
  snapVideoUrl?: string;
  snapThumbnailUrl?: string;
}

/* ---------- Service ---------- */
@Injectable({ providedIn: 'root' })
export class CampaignService {
  private http = inject(HttpClient);
  base = environment.apiUrl; // Make it public for XMLHttpRequest approach

  /* ----------------------------------------------------------
   * Original upload method (no progress)
   * ---------------------------------------------------------- */
  upload(
    slug: string,
    waLink: string,
    waButtonLabel: string,
    caption: string,
    popupTriggerType:  'seconds' | 'percent' | null,
    popupTriggerValue: number | null,
    full: File
  ): Observable<CampaignDto> {
    const token = localStorage.getItem('auth_token') ?? '';
    const form = new FormData();
    form.append('slug', slug);
    form.append('waLink', waLink);
    form.append('waButtonLabel', waButtonLabel);
    form.append('caption', caption);
    if (popupTriggerType  !== null) form.append('popupTriggerType',  popupTriggerType);
    if (popupTriggerValue !== null) form.append('popupTriggerValue', String(popupTriggerValue));
    form.append('full', full);

    return this.http.post<CampaignDto>(`${this.base}/campaigns/upload`, form, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }

  /* ----------------------------------------------------------
   * NEW: Upload with progress tracking using HttpClient
   * ---------------------------------------------------------- */
  uploadWithProgress(
    slug: string,
    waLink: string,
    waButtonLabel: string,
    caption: string,
    popupTriggerType:  'seconds' | 'percent' | null,
    popupTriggerValue: number | null,
    full: File
  ): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('auth_token') ?? '';
    const form = new FormData();
    form.append('slug', slug);
    form.append('waLink', waLink);
    form.append('waButtonLabel', waButtonLabel);
    form.append('caption', caption);
    if (popupTriggerType  !== null) form.append('popupTriggerType',  popupTriggerType);
    if (popupTriggerValue !== null) form.append('popupTriggerValue', String(popupTriggerValue));
    form.append('full', full);

    return this.http.post(`${this.base}/campaigns/upload`, form, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      reportProgress: true,
      observe: 'events'
    });
  }

 

  /* ----------------------------------------------------------
   * List public campaign links
   * ---------------------------------------------------------- */
  listPublicLinks(): Observable<
    Pick<CampaignDto,
      'slug' | 'fullVideoUrl' | 'fullThumbnailUrl' | 'waLink' | 'waButtonLabel' | 'popupTriggerType' | 'popupTriggerValue'
    >[]
  > {
    return this.http.get<
      Pick<CampaignDto,
        'slug' | 'fullVideoUrl' | 'fullThumbnailUrl' | 'waLink' | 'waButtonLabel' | 'popupTriggerType' | 'popupTriggerValue'
      >[]
    >(`${this.base}/campaigns/public/links`);
  }

  /* ----------------------------------------------------------
   * Fetch a single campaign by slug
   * ---------------------------------------------------------- */
  getCampaign(slug: string): Observable<CampaignDto> {
    return this.http.get<CampaignDto>(`${this.base}/campaigns/${slug}`);
  }

  /* ----------------------------------------------------------
   * Delete a campaign by slug
   * ---------------------------------------------------------- */
  delete(slug: string): Observable<{ message: string; slug: string }> {
    const token = localStorage.getItem('auth_token') ?? '';
    return this.http.delete<{ message: string; slug: string }>(
      `${this.base}/campaigns/${slug}`,
      { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
    );
  }

  /* ----------------------------------------------------------
   * Update an existing campaign
   * ---------------------------------------------------------- */
  update(
    slug: string,
    changes: Partial<
      Pick<
        CampaignDto,
        | 'slug'
        | 'waLink'
        | 'waButtonLabel'
        | 'caption'
        | 'popupTriggerType'
        | 'popupTriggerValue'
      >
    >,
    full?: File
  ): Observable<CampaignDto> {
    const token = localStorage.getItem('auth_token') ?? '';

    /* JSON only */
    if (!full) {
      return this.http.put<CampaignDto>(`${this.base}/campaigns/${slug}`, changes, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        })
      });
    }

    /* Form-data with video replacement */
    const form = new FormData();
    Object.entries(changes).forEach(([k, v]) => {
      if (v !== null && v !== undefined) form.append(k, v.toString());
    });
    form.append('full', full);

    return this.http.put<CampaignDto>(`${this.base}/campaigns/${slug}`, form, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }
}