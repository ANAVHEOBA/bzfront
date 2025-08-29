import { Injectable } from '@angular/core';
import { Meta } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class MetaTagsService {
  constructor(private meta: Meta) {}

  set(c: { title: string; description: string; image: string; url: string }) {
    this.meta.updateTag({ property: 'og:title', content: c.title });
    this.meta.updateTag({ property: 'og:description', content: c.description });
    this.meta.updateTag({ property: 'og:image', content: c.image });
    this.meta.updateTag({ property: 'og:url', content: c.url });
    this.meta.updateTag({ property: 'og:type', content: 'video.other' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: c.title });
    this.meta.updateTag({ name: 'twitter:description', content: c.description });
    this.meta.updateTag({ name: 'twitter:image', content: c.image });
  }
}