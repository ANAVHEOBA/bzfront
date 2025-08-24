import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CampaignService, CampaignDto } from '../campaign.service'; 
import { environment } from '../../environments/environment'; 

@Component({
  selector: 'app-campaign-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campaign-landing.html',
  styleUrls: ['./campaign-landing.scss']
})
export class CampaignLandingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private campaignService = inject(CampaignService); // Inject service
  private environment = environment;
  
  campaign: CampaignDto | null = null;
  soundOn = false;
  @ViewChild('vid') videoElement!: { nativeElement: HTMLVideoElement };

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadCampaign(slug);
    }
  }

  private loadCampaign(slug: string) {
    this.campaignService.getCampaign(slug).subscribe({
      next: (campaign) => {
        this.campaign = campaign;
        this.cleanupUrls();
        this.playVideo();
      },
      error: (err) => {
        console.error('Failed to load campaign:', err);
        // Fallback to test campaign in development
        if (!this.environment.production) {
          this.campaign = {
            slug: 'test-campaign-1',
            fullVideoUrl: 'https://res.cloudinary.com/defo7ecih/video/upload/v1755911668/campaigns/test-campaign-1_full.mp4',
            fullThumbnailUrl: 'https://res.cloudinary.com/defo7ecih/video/upload/v1755911668/campaigns/test-campaign-1_full.jpg',
            waLink: 'https://wa.me/1234567890',
            snapVideoUrl: '',
            snapThumbnailUrl: '',
            caption: 'Test Campaign'
          };
          this.playVideo();
        }
      }
    });
  }

  private cleanupUrls() {
    if (!this.campaign) return;
    
    const clean = (url: string) => url.replace(/<[^>]*>/g, '').trim();
    this.campaign.fullVideoUrl = clean(this.campaign.fullVideoUrl);
    this.campaign.fullThumbnailUrl = clean(this.campaign.fullThumbnailUrl);
    this.campaign.waLink = clean(this.campaign.waLink);
  }

  private playVideo() {
    setTimeout(() => {
      const video = this.videoElement?.nativeElement;
      if (video) {
        video.muted = true;
        video.play().catch(e => console.log('Autoplay prevented:', e));
      }
    }, 100);
  }

  toggleSound() {
    this.soundOn = !this.soundOn;
    const video = this.videoElement?.nativeElement;
    if (video) {
      video.muted = !this.soundOn;
    }
  }
}