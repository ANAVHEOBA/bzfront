// src/app/campaign.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

/* ---------- Interfaces ---------- */
export interface CampaignDto {
  slug: string;
  snapVideoUrl: string;
  fullVideoUrl: string;
  snapThumbnailUrl: string;
  fullThumbnailUrl: string;
  waLink: string;
  waButtonLabel: string;
  caption?: string;

  /* NEW – popup timing */
  popupTriggerType:  'seconds' | 'percent' | null;
  popupTriggerValue: number | null;

  createdAt?: string;
  updatedAt?: string;
  _id?: string;
}

/* ---------- Service ---------- */
@Injectable({ providedIn: 'root' })
export class CampaignService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  /* ----------------------------------------------------------
   * Upload a new campaign
   * ---------------------------------------------------------- */
  upload(
    slug: string,
    waLink: string,
    waButtonLabel: string,
    caption: string,
    popupTriggerType:  'seconds' | 'percent' | null,
    popupTriggerValue: number | null,
    preview: File,
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
    form.append('preview', preview);
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


  /* ---------- NEW METHOD ---------- */
/**
 * Update an existing campaign.
 * - If you omit `preview` and `full` the call is sent as JSON
 *   (ideal for small text changes).
 * - If you supply `preview` and/or `full` the call is sent as
 *   multipart/form-data so the videos are replaced.
 */
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
  preview?: File,
  full?: File
): Observable<CampaignDto> {
  const token = localStorage.getItem('auth_token') ?? '';

  /* ---------- JSON only ---------- */
  if (!preview && !full) {
    return this.http.put<CampaignDto>(`${this.base}/campaigns/${slug}`, changes, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      })
    });
  }

  /* ---------- Form-data (videos may be replaced) ---------- */
  const form = new FormData();
  Object.entries(changes).forEach(([k, v]) => {
    if (v !== null && v !== undefined) {
      form.append(k, v.toString());
    }
  });
  if (preview) form.append('preview', preview);
  if (full) form.append('full', full);

  return this.http.put<CampaignDto>(`${this.base}/campaigns/${slug}`, form, {
    headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
  });
}
}