import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type SanitizeType = 'html' | 'url' | 'resourceUrl' | 'style' | 'trustedHtml';

/**
 * Pipe de sanitização que utiliza o sanitizer embutido do Angular em vez de
 * contornar a segurança (bypass). Retorna uma string sanitizada (ou null)
 * que pode ser ligada com segurança em [innerHTML] ou em atributos.
 *
 * Para rich text confiável (vindo do backend/admin), use o tipo 'trustedHtml'.
 */
@Pipe({
  name: 'sanitize',
  standalone: true,
})
export class SanitizePipe implements PipeTransform {
  constructor(private domSanitizer: DomSanitizer) {}

  transform(
    value: string | null | undefined,
    type: SanitizeType = 'html'
  ): string | SafeHtml | null {
    if (value === null || value === undefined) return null;

    switch (type) {
      case 'html':
        // Sanitiza conteúdo HTML (remove tags <script>, manipuladores on*, etc.)
        return this.domSanitizer.sanitize(SecurityContext.HTML, value);
      case 'url':
        // Sanitiza URLs (bloqueia schemes inseguros como javascript:)
        return this.domSanitizer.sanitize(SecurityContext.URL, value);
      case 'resourceUrl':
        // Sanitiza URLs de recursos (ex.: src de iframe)
        return this.domSanitizer.sanitize(SecurityContext.RESOURCE_URL, value);
      case 'style':
        // Sanitiza valores de style (ex.: background-image)
        return this.domSanitizer.sanitize(SecurityContext.STYLE, value);
      case 'trustedHtml':
        // Para HTML confiável vindo de fontes controladas (ex.: rich text do banco de dados)
        return this.domSanitizer.bypassSecurityTrustHtml(value);
      default:
        return this.domSanitizer.sanitize(SecurityContext.HTML, value);
    }
  }
}
