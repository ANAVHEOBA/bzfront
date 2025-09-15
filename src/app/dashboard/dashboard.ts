import { Component, inject, OnDestroy, OnInit, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CampaignService, CampaignDto } from '../campaign.service';
import { RouterModule } from '@angular/router';
import { HttpEvent, HttpEventType } from '@angular/common/http';

interface CampaignSummary extends Pick<CampaignDto, 'slug' | 'fullVideoUrl' | 'fullThumbnailUrl' | 'waLink' | 'waButtonLabel' | 'popupTriggerType' | 'popupTriggerValue' | 'caption'> {}

// ADD THIS INTERFACE
interface EditForm {
  slug: string;
  caption: string;
  waLink: string;
  waButtonLabel: string;
  popupTriggerType: 'seconds' | 'percent' | null;
  popupTriggerValue: number | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit, OnDestroy {
  /* Upload form fields */
  slug = '';
  waLink = '';
  waButtonLabel = 'Chat on WhatsApp';
  caption = '';
  popupTriggerType: 'seconds' | 'percent' | null = null;
  popupTriggerValue: number | null = null;
  previewFile: File | null = null;
  fullFile: File | null = null;
  previewUrl: string | null = null;
  fullUrl: string | null = null;

  /* UI state */
  isUploading = false;
  isUploadingWithProgress = false;
  uploadProgress = 0;
  uploadSuccess = false;
  errorMessage = '';
  campaigns: CampaignSummary[] = [];

  /* Edit mode state */
  editingSlug: string | null = null;
  // FIX: Properly type the editForm
  editForm: EditForm = {
    slug: '',
    caption: '',
    waLink: '',
    waButtonLabel: '',
    popupTriggerType: null,
    popupTriggerValue: null
  };
  editFiles: { preview?: File; full?: File } = {};
  isSaving = false;
  editError = '';

  private campaignSvc = inject(CampaignService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdRef = inject(ChangeDetectorRef);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && !localStorage.getItem('auth_token')) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadCampaigns();
  }

  /* ---------- File handling ---------- */
  onFileSelected(event: Event, type: 'preview' | 'full'): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
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

  /* ---------- Create with Progress Tracking ---------- */
  onSubmit(): void {
    if (!this.slug || !this.waLink || !this.caption || !this.fullFile) {
      this.errorMessage = 'All fields and files are required.';
      return;
    }

    this.isUploadingWithProgress = true;
    this.uploadProgress = 0;
    this.errorMessage = '';

    this.campaignSvc.uploadWithProgress(
      this.slug,
      this.waLink,
      this.waButtonLabel,
      this.caption,
      this.popupTriggerType,
      this.popupTriggerValue,
      this.fullFile
    ).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round((event.loaded / event.total) * 100);
          console.log(`Upload progress: ${this.uploadProgress}%`);
        } else if (event.type === HttpEventType.Response) {
          // Upload completed
          this.isUploadingWithProgress = false;
          this.uploadSuccess = true;
          this.uploadProgress = 0;
          
          const newCampaign = event.body;
          this.resetForm();
          this.campaigns.unshift({
            slug: newCampaign.slug,
            fullVideoUrl: newCampaign.fullVideoUrl,
            fullThumbnailUrl: newCampaign.fullThumbnailUrl,
            waLink: newCampaign.waLink,
            waButtonLabel: newCampaign.waButtonLabel,
            popupTriggerType: newCampaign.popupTriggerType,
            popupTriggerValue: newCampaign.popupTriggerValue
          });
          
          setTimeout(() => (this.uploadSuccess = false), 3000);
        }
      },
      error: err => {
        this.isUploadingWithProgress = false;
        this.uploadProgress = 0;
        this.errorMessage = err.error?.message || 'Upload failed.';
        console.error('Upload error:', err);
      }
    });
  }

  /* ---------- XMLHttpRequest Alternative ---------- */
  onSubmitXHR(): void {
    if (!this.slug || !this.waLink || !this.caption || !this.fullFile) {
      this.errorMessage = 'All fields and files are required.';
      return;
    }

    this.isUploadingWithProgress = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    formData.append('slug', this.slug);
    formData.append('waLink', this.waLink);
    formData.append('waButtonLabel', this.waButtonLabel);
    formData.append('caption', this.caption);
    if (this.popupTriggerType !== null) formData.append('popupTriggerType', this.popupTriggerType);
    if (this.popupTriggerValue !== null) formData.append('popupTriggerValue', String(this.popupTriggerValue));
    formData.append('full', this.fullFile);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        this.uploadProgress = Math.round((event.loaded / event.total) * 100);
        this.cdRef.detectChanges();
      }
    });

    xhr.addEventListener('load', () => {
      this.isUploadingWithProgress = false;
      this.uploadProgress = 0;

      if (xhr.status === 201) {
        const newCampaign = JSON.parse(xhr.responseText);
        this.uploadSuccess = true;
        this.resetForm();
        this.campaigns.unshift(newCampaign);
        setTimeout(() => (this.uploadSuccess = false), 3000);
      } else {
        const error = JSON.parse(xhr.responseText);
        this.errorMessage = error.message || 'Upload failed';
      }
    });

    xhr.addEventListener('error', () => {
      this.isUploadingWithProgress = false;
      this.uploadProgress = 0;
      this.errorMessage = 'Network error during upload';
    });

    xhr.open('POST', `${this.campaignSvc.base}/campaigns/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('auth_token')}`);
    xhr.send(formData);
  }

  /* ---------- Rest of your existing methods ---------- */
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
    this.editFiles = {};
    this.editError = '';
  }

  cancelEdit(): void {
    this.editingSlug = null;
    this.editError = '';
  }

  onEditFile(event: Event, type: 'preview' | 'full'): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.editFiles[type] = file;
  }

  saveEdit(): void {
    if (!this.editingSlug) return;

    this.isSaving = true;
    this.editError = '';

    this.campaignSvc
      .update(
        this.editingSlug,
        this.editForm,
        this.editFiles.full
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

  private resetForm(): void {
    this.slug = this.waLink = this.waButtonLabel = this.caption = '';
    this.popupTriggerType = null;
    this.popupTriggerValue = null;
    this.previewFile = this.fullFile = null;
    this.previewUrl = this.fullUrl = null;
    document.querySelectorAll<HTMLInputElement>('input[type="file"]')
      .forEach(el => (el.value = ''));
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