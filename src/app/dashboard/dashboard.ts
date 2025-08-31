// src/app/dashboard/dashboard.ts
import { Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CampaignService, CampaignDto } from '../campaign.service';
import { RouterModule } from '@angular/router';

interface CampaignSummary
  extends Pick<CampaignDto,
    'slug' | 'fullVideoUrl' | 'fullThumbnailUrl' | 'waLink' | 'waButtonLabel' | 'popupTriggerType' | 'popupTriggerValue' | 'caption' | 'snapThumbnailUrl' | 'fullThumbnailUrl'
  > {}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit, OnDestroy {
  slug = '';
  waLink = '';
  waButtonLabel = 'Chat on WhatsApp';
  caption = '';
  popupTriggerType:  'seconds' | 'percent' | null = null;
  popupTriggerValue: number | null = null;
  previewFile: File | null = null;
  fullFile: File | null = null;
  previewUrl: string | null = null;
  fullUrl: string | null = null;

  isUploading = false;
  uploadSuccess = false;
  errorMessage = '';
  campaigns: CampaignSummary[] = [];

  isEditing = false;
  currentEditSlug: string | null = null;

  private campaignSvc = inject(CampaignService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (!localStorage.getItem('auth_token')) {
        this.router.navigate(['/login']);
        return;
      }
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
    if (this.isEditing) {
      this.onUpdate();
    } else {
      this.onCreate();
    }
  }

  onCreate(): void {
    if (!this.slug || !this.waLink || !this.caption || !this.previewFile || !this.fullFile) {
      this.errorMessage = 'All fields and files are required.';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';

    this.campaignSvc
      .upload(
        this.slug,
        this.waLink,
        this.waButtonLabel,
        this.caption,
        this.popupTriggerType,
        this.popupTriggerValue,
        this.previewFile,
        this.fullFile
      )
      .subscribe({
        next: (newCampaign) => {
          this.isUploading = false;
          this.uploadSuccess = true;
          this.resetForm();
          this.campaigns.unshift({
            slug: newCampaign.slug,
            fullVideoUrl: newCampaign.fullVideoUrl,
            fullThumbnailUrl: newCampaign.fullThumbnailUrl,
            waLink: newCampaign.waLink,
            waButtonLabel: newCampaign.waButtonLabel,
            popupTriggerType:  newCampaign.popupTriggerType,
            popupTriggerValue: newCampaign.popupTriggerValue,
            caption: newCampaign.caption,
            snapThumbnailUrl: newCampaign.snapThumbnailUrl  // Include snapThumbnailUrl here
          });
          setTimeout(() => (this.uploadSuccess = false), 3000);
        },
        error: (err) => {
          this.isUploading = false;
          this.errorMessage = err.error?.message || 'Upload failed.';
        }
      });
  }

  onUpdate(): void {
    if (!this.currentEditSlug || !this.waLink || !this.caption) {
      this.errorMessage = 'Slug, WhatsApp Link, and Caption are required for update.';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';

    const body: Partial<CampaignDto> = {
      waLink: this.waLink,
      waButtonLabel: this.waButtonLabel,
      caption: this.caption,
      popupTriggerType: this.popupTriggerType,
      popupTriggerValue: this.popupTriggerValue
    };

    this.campaignSvc
      .patch(this.currentEditSlug, body, this.previewFile ?? undefined, this.fullFile ?? undefined)
      .subscribe({
        next: (updatedCampaign) => {
          this.isUploading = false;
          this.uploadSuccess = true;
          this.resetForm();
          this.campaigns = this.campaigns.map((c) =>
            c.slug === updatedCampaign.slug ? { ...c, ...updatedCampaign } : c
          );
          this.cancelEdit();
          setTimeout(() => (this.uploadSuccess = false), 3000);
        },
        error: (err) => {
          this.isUploading = false;
          this.errorMessage = err.error?.message || 'Update failed.';
        }
      });
  }

  editCampaign(campaign: CampaignSummary): void {
    this.isEditing = true;
    this.currentEditSlug = campaign.slug;
    this.slug = campaign.slug;
    this.waLink = campaign.waLink;
    this.waButtonLabel = campaign.waButtonLabel;
    this.caption = campaign.caption || ''; // Ensure caption is not undefined
    this.popupTriggerType = campaign.popupTriggerType;
    this.popupTriggerValue = campaign.popupTriggerValue;

    // Clear file inputs for new uploads, but keep old URLs for display if no new file is selected
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    if (this.fullUrl) URL.revokeObjectURL(this.fullUrl);
    this.previewFile = null;
    this.fullFile = null;
    this.previewUrl = campaign.snapThumbnailUrl || null; // Use thumbnail as preview of existing video
    this.fullUrl = campaign.fullThumbnailUrl || null; // Use thumbnail as preview of existing video

    document.getElementById('upload-form-title')?.scrollIntoView({ behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.currentEditSlug = null;
    this.resetForm();
  }

  deleteCampaign(slug: string): void {
    if (!confirm('Delete this campaign?')) return;
    this.campaignSvc.delete(slug).subscribe({
      next: () => (this.campaigns = this.campaigns.filter((c) => c.slug !== slug)),
      error: (err) => alert(err.error?.message || 'Delete failed')
    });
  }

  private loadCampaigns(): void {
    this.campaignSvc.listPublicLinks().subscribe((list) => (this.campaigns = list));
  }

  private resetForm(): void {
    this.slug = '';
    this.waLink = '';
    this.waButtonLabel = 'Chat on WhatsApp';
    this.caption = '';
    this.popupTriggerType = null;
    this.popupTriggerValue = null;
    this.previewFile = null;
    this.fullFile = null;
    this.previewUrl = null;
    this.fullUrl = null;
    document
      .querySelectorAll<HTMLInputElement>('input[type="file"]')
      .forEach((el) => (el.value = ''));
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
    }
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    if (this.fullUrl) URL.revokeObjectURL(this.fullUrl);
  }
}