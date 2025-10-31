import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import sanitizeHtml from 'sanitize-html';

@Pipe({
  name: 'sanitize',
  standalone: true,
})
export class SanitizePipe implements PipeTransform {
  constructor(private domSanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    // Sanitiza o HTML removendo scripts, eventos e tags perigosas
    const clean = sanitizeHtml(value, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'title', 'width', 'height', 'style'],
        a: ['href', 'name', 'target', 'rel'],
      },
      allowedSchemes: ['http', 'https', 'data'],
      allowedSchemesByTag: {},
      allowedIframeHostnames: [],
    });
    return this.domSanitizer.bypassSecurityTrustHtml(clean);
  }
}
