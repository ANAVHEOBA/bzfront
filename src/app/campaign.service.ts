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
  caption?: string;
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
    caption: string,
    preview: File,
    full: File
  ): Observable<CampaignDto> {
    const token = localStorage.getItem('auth_token') ?? '';
    const form = new FormData();
    form.append('slug', slug);
    form.append('waLink', waLink);
    form.append('caption', caption);
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
    Pick<CampaignDto, 'slug' | 'fullVideoUrl' | 'fullThumbnailUrl' | 'waLink'>[]
  > {
    return this.http.get<
      Pick<CampaignDto, 'slug' | 'fullVideoUrl' | 'fullThumbnailUrl' | 'waLink'>[]
    >(`${this.base}/campaigns/public/links`);
  }

  /* ----------------------------------------------------------
   * NEW: Fetch a single campaign by slug
   * GET /campaigns/:slug
   * ---------------------------------------------------------- */
  getCampaign(slug: string): Observable<CampaignDto> {
    return this.http.get<CampaignDto>(`${this.base}/campaigns/${slug}`);
  }
}