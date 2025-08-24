import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CampaignService, CampaignDto } from '../campaign.service';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './campaign-detail.html',     
  styleUrls: ['./campaign-detail.scss']      
})
export class CampaignDetailComponent implements OnInit {
  private campaignSvc = inject(CampaignService);
  private route = inject(ActivatedRoute);

  campaign$!: Observable<CampaignDto>;

  ngOnInit(): void {
    this.campaign$ = this.route.paramMap.pipe(
      switchMap(params => {
        const slug = params.get('slug')!;
        return this.campaignSvc.getCampaign(slug);
      })
    );
  }
}