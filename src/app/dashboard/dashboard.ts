import { Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CampaignService, CampaignDto } from '../campaign.service';
import { RouterModule } from '@angular/router';

interface CampaignSummary
  extends Pick<CampaignDto,
    | 'slug'
    | 'fullVideoUrl'
    | 'fullThumbnailUrl'
    | 'waLink'
    | 'waButtonLabel'
    | 'popupTriggerType'
    | 'popupTriggerValue'
    | 'caption'
  > {}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit, OnDestroy {
  /* ---------- Upload form fields ---------- */
  slug = '';
  waLink = '';
  waButtonLabel = 'Chat on WhatsApp';
  caption = '';
  popupTriggerType:  'seconds' | 'percent' | null = null;
  popupTriggerValue: number | null = null;
  fullFile: File | null = null;
  fullUrl: string | null = null;

  /* ---------- UI state ---------- */
  isUploading = false;
  uploadSuccess = false;
  errorMessage = '';
  campaigns: CampaignSummary[] = [];

  /* ---------- Edit mode state ---------- */
  editingSlug: string | null = null;
  editForm = {
    slug: '',
    caption: '',
    waLink: '',
    waButtonLabel: '',
    popupTriggerType: null as 'seconds' | 'percent' | null,
    popupTriggerValue: null as number | null
  };
  editFile: File | null = null;          // only full file can be replaced
  isSaving = false;
  editError = '';

  private campaignSvc = inject(CampaignService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && !localStorage.getItem('auth_token')) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadCampaigns();
  }

  /* ---------- File handling ---------- */
  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (this.fullUrl) URL.revokeObjectURL(this.fullUrl);
    this.fullFile = file;
    this.fullUrl = file ? URL.createObjectURL(file) : null;
  }

  /* ---------- Create ---------- */
  onSubmit(): void {
    if (!this.slug || !this.waLink || !this.caption || !this.fullFile) {
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
        this.fullFile
      )
      .subscribe({
        next: newCampaign => {
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
            popupTriggerValue: newCampaign.popupTriggerValue
          });
          setTimeout(() => (this.uploadSuccess = false), 3000);
        },
        error: err => {
          this.isUploading = false;
          this.errorMessage = err.error?.message || 'Upload failed.';
        }
      });
  }

  /* ---------- Read / Delete ---------- */
  private loadCampaigns(): void {
    this.campaignSvc.listPublicLinks().subscribe(list => (this.campaigns = list));
  }

  deleteCampaign(slug: string): void {
    if (!confirm('Delete this campaign?')) return;
    this.campaignSvc.delete(slug).subscribe({
      next: () => (this.campaigns = this.campaigns.filter(c => c.slug !== slug)),
      error: err => alert(err.error?.message || 'Delete failed')
    });
  }

  /* ---------- Edit ---------- */
  openEdit(c: CampaignSummary): void {
    this.editingSlug = c.slug;
    this.editForm = {
      slug: c.slug,
      caption: c.caption ?? '',
      waLink: c.waLink ?? '',
      waButtonLabel: c.waButtonLabel,
      popupTriggerType: c.popupTriggerType,
      popupTriggerValue: c.popupTriggerValue
    };
    this.editFile = null;
    this.editError = '';
  }

  cancelEdit(): void {
    this.editingSlug = null;
    this.editError = '';
  }

  onEditFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.editFile = file;
  }

  saveEdit(): void {
    if (!this.editingSlug) return;

    this.isSaving = true;
    this.editError = '';

    this.campaignSvc
      .update(
        this.editingSlug,
        this.editForm,
        this.editFile ?? undefined
      )
      .subscribe({
        next: updated => {
          const idx = this.campaigns.findIndex(c => c.slug === this.editingSlug);
          if (idx !== -1) {
            this.campaigns[idx] = {
              slug: updated.slug,
              fullVideoUrl: updated.fullVideoUrl,
              fullThumbnailUrl: updated.fullThumbnailUrl,
              waLink: updated.waLink,
              waButtonLabel: updated.waButtonLabel,
              popupTriggerType: updated.popupTriggerType,
              popupTriggerValue: updated.popupTriggerValue
            };
          }
          this.cancelEdit();
        },
        error: err => {
          this.isSaving = false;
          this.editError = err.error?.message || 'Update failed';
        }
      });
  }

  /* ---------- Misc ---------- */
  private resetForm(): void {
    this.slug = this.waLink = this.waButtonLabel = this.caption = '';
    this.popupTriggerType = null;
    this.popupTriggerValue = null;
    this.fullFile = null;
    this.fullUrl = null;
    document
      .querySelectorAll<HTMLInputElement>('input[type="file"]')
      .forEach(el => (el.value = ''));
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
    }
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    if (this.fullUrl) URL.revokeObjectURL(this.fullUrl);
  }
}