import { RenderMode, ServerRoute } from '@angular/ssr';
import { inject } from '@angular/core';
import { CampaignService } from './campaign.service';
import { firstValueFrom } from 'rxjs';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'campaigns/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      const campaignService = inject(CampaignService);
      const campaigns = await firstValueFrom(campaignService.listPublicLinks()) || [];
      return campaigns.map(campaign => ({ slug: campaign.slug }));
    }
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
