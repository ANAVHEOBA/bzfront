// src/app/campaign-landing/campaign-landing.ts
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import { CampaignService, CampaignDto } from '../campaign.service';
import { MetaTagsService } from '../meta-tags.service';

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

  campaign?: CampaignDto;
  isLoading = true;
  error?: string;
  showFull = false;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.error = 'Missing slug';
      this.isLoading = false;
      return;
    }

    this.campaignSvc.getCampaign(slug).subscribe({
      next: (c) => {
        this.campaign = c;
        this.isLoading = false;

        // Set SSR-friendly meta tags for social previews
        this.meta.set({
          title: c.slug,
          description: c.caption || '',
          image: c.fullThumbnailUrl.trim(),
          url: `https://bzfront.vercel.app/campaigns/${encodeURIComponent(c.slug)}`
        });
      },
      error: (err) => {
        this.error = err.error?.message || 'Campaign not found';
        this.isLoading = false;
      }
    });
  }

  switchToFull(): void {
    this.showFull = true;
  }
}