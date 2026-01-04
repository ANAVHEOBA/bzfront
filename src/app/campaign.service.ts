// src/app/campaign.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  /* popup timing */
  popupTriggerType:  'seconds' | 'percent' | null;
  popupTriggerValue: number | null;

  /* tags */
  tags?: string[];

  createdAt?: string;
  updatedAt?: string;
  _id?: string;

  /* legacy fields – no longer returned by backend */
  snapVideoUrl?: string;
  snapThumbnailUrl?: string;
}

/* ---------- Service ---------- */
@Injectable({ providedIn: 'root' })
export class CampaignService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  /* ----------------------------------------------------------
   * Upload a new campaign – single full video only
   * ---------------------------------------------------------- */
  upload(
    slug: string,
    waLink: string,
    waButtonLabel: string,
    caption: string,
    popupTriggerType:  'seconds' | 'percent' | null,
    popupTriggerValue: number | null,
    full: File,
    tags?: string[]
  ): Observable<CampaignDto> {
    const token = localStorage.getItem('auth_token') ?? '';
    const form = new FormData();
    form.append('slug', slug);
    form.append('waLink', waLink);
    form.append('waButtonLabel', waButtonLabel);
    form.append('caption', caption);
    if (popupTriggerType  !== null) form.append('popupTriggerType',  popupTriggerType);
    if (popupTriggerValue !== null) form.append('popupTriggerValue', String(popupTriggerValue));
    if (tags && tags.length > 0) form.append('tags', JSON.stringify(tags));
    form.append('full', full);

    return this.http.post<CampaignDto>(`${this.base}/campaigns/upload`, form, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }

  /* ----------------------------------------------------------
   * List public campaign links
   * ---------------------------------------------------------- */
  listPublicLinks(): Observable<
    Pick<CampaignDto,
      'slug' | 'fullVideoUrl' | 'fullThumbnailUrl' | 'waLink' | 'waButtonLabel' | 'popupTriggerType' | 'popupTriggerValue' | 'tags'
    >[]
  > {
    return this.http.get<
      Pick<CampaignDto,
        'slug' | 'fullVideoUrl' | 'fullThumbnailUrl' | 'waLink' | 'waButtonLabel' | 'popupTriggerType' | 'popupTriggerValue' | 'tags'
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
        | 'tags'
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
      if (v !== null && v !== undefined) {
        form.append(k, Array.isArray(v) ? JSON.stringify(v) : v.toString());
      }
    });
    form.append('full', full);

    return this.http.put<CampaignDto>(`${this.base}/campaigns/${slug}`, form, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    });
  }
}