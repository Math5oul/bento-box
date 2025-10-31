import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

@Pipe({
  name: 'sanitize',
  standalone: true,
})
export class SanitizePipe implements PipeTransform {
  constructor(private domSanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    // Sanitiza o HTML usando DOMPurify (browser-safe)
    const clean = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [
        'img',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'a',
        'b',
        'i',
        'u',
        'strong',
        'em',
        'ul',
        'ol',
        'li',
        'br',
        'span',
        'div',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'hr',
        'blockquote',
        'pre',
        'code',
        'sup',
        'sub',
        'small',
        'mark',
        'del',
        'ins',
        'figure',
        'figcaption',
      ],
      ALLOWED_ATTR: [
        'src',
        'alt',
        'title',
        'width',
        'height',
        'style',
        'href',
        'name',
        'target',
        'rel',
        'class',
        'id',
        'align',
        'valign',
        'colspan',
        'rowspan',
        'data-*',
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.-]|$))/i,
    });
    return this.domSanitizer.bypassSecurityTrustHtml(clean);
  }
}
