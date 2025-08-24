import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CampaignService } from '../campaign.service';
import { SidebarComponent } from '../shared/sidebar/sidebar';

// Minimal interface matching the public-links payload
interface CampaignSummary {
  slug: string;
  fullVideoUrl: string;
  fullThumbnailUrl: string;
  waLink: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, SidebarComponent, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit, OnDestroy {
  // Form fields
  slug = '';
  waLink = '';
  caption = '';
  previewFile: File | null = null;
  fullFile: File | null = null;

  previewUrl: string | null = null;
  fullUrl: string | null = null;

  isUploading = false;
  uploadSuccess = false;
  errorMessage = '';

  // Public list
  campaigns: CampaignSummary[] = [];

  private campaignSvc = inject(CampaignService);
  private router = inject(Router);

  ngOnInit(): void {
    if (!localStorage.getItem('auth_token')) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadCampaigns();
  }

  onFileSelected(event: Event, type: 'preview' | 'full'): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0] ?? null;

    if (type === 'preview') {
      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
      this.previewFile = file;
      this.previewUrl = file ? URL.createObjectURL(file) : null;
    } else {
      if (this.fullUrl) URL.revokeObjectURL(this.fullUrl);
      this.fullFile = file;
      this.fullUrl = file ? URL.createObjectURL(file) : null;
    }
  }

  onSubmit(): void {
    if (!this.slug || !this.waLink || !this.caption || !this.previewFile || !this.fullFile) {
      this.errorMessage = 'All fields and files are required.';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';

    this.campaignSvc
      .upload(this.slug, this.waLink, this.caption, this.previewFile, this.fullFile)
      .subscribe({
        next: (newCampaign) => {
          this.isUploading = false;
          this.uploadSuccess = true;
          this.resetForm();
          this.campaigns.unshift({
            slug: newCampaign.slug,
            fullVideoUrl: newCampaign.fullVideoUrl,
            fullThumbnailUrl: newCampaign.fullThumbnailUrl,
            waLink: newCampaign.waLink
          });
          setTimeout(() => (this.uploadSuccess = false), 3000);
        },
        error: (err) => {
          this.isUploading = false;
          this.errorMessage = err.error?.message || 'Upload failed.';
        }
      });
  }

  private loadCampaigns(): void {
    this.campaignSvc.listPublicLinks().subscribe(list => (this.campaigns = list));
  }

  private resetForm(): void {
    this.slug = this.waLink = this.caption = '';
    this.previewFile = this.fullFile = null;
    this.previewUrl = this.fullUrl = null;
    document
      .querySelectorAll<HTMLInputElement>('input[type="file"]')
      .forEach(el => el.value = '');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    if (this.fullUrl) URL.revokeObjectURL(this.fullUrl);
  }
}