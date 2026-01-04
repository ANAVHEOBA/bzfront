// src/app/campaign-landing/campaign-landing.ts
import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { CampaignService, CampaignDto } from '../campaign.service';
import { MetaTagsService } from '../meta-tags.service';
import { TrackingService } from '../tracking.service';

@Component({
  selector: 'app-campaign-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campaign-landing.html',
  styleUrls: ['./campaign-landing.scss']
})
export class CampaignLandingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private campaignSvc = inject(CampaignService);
  private meta = inject(MetaTagsService);
  private trackingSvc = inject(TrackingService);
  private platformId = inject(PLATFORM_ID);

  campaign?: CampaignDto;
  isLoading = true;
  error?: string;
  showFull = true;

  private hasTrackedPlay = false;
  private hasTrackedComplete = false;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.error = 'Missing slug';
      this.isLoading = false;
      return;
    }

    this.campaignSvc.getCampaign(slug).subscribe({
      next: (c: CampaignDto) => {
        this.campaign = c;
        this.isLoading = false;

        // Set SSR-friendly meta tags for social previews
        this.meta.set({
          title: slug,
          description: c.caption || '',
          image: c.fullThumbnailUrl.trim(),
          url: `https://bzfront.vercel.app/campaigns/${encodeURIComponent(slug)}`
        });

        // Track page view (only in browser)
        if (isPlatformBrowser(this.platformId)) {
          this.trackingSvc.trackView(slug).subscribe();
        }
      },
      error: (err: { error?: { message?: string } }) => {
        this.error = err.error?.message || 'Campaign not found';
        this.isLoading = false;
      }
    });
  }

  switchToFull(): void {
    this.showFull = true;
  }

  onVideoPlay(): void {
    if (this.hasTrackedPlay || !this.campaign) return;
    this.hasTrackedPlay = true;
    this.trackingSvc.trackPlay(this.campaign.slug).subscribe();
  }

  onVideoEnded(): void {
    if (this.hasTrackedComplete || !this.campaign) return;
    this.hasTrackedComplete = true;
    this.trackingSvc.trackComplete(this.campaign.slug).subscribe();
  }

  onCtaClick(): void {
    if (!this.campaign) return;
    this.trackingSvc.trackClick(this.campaign.slug).subscribe();
  }
}
