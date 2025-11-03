import { SanitizePipe } from './sanitize.pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { SecurityContext } from '@angular/core';

describe('SanitizePipe', () => {
  let pipe: SanitizePipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    class MockDomSanitizer {
      sanitize(context: SecurityContext, value: string | null) {
        if (value === null || value === undefined) return null;
        switch (context) {
          case SecurityContext.HTML:
            return (value as string).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
          case SecurityContext.URL:
          case SecurityContext.RESOURCE_URL:
            return /^\s*javascript:/i.test(value as string) ? null : value;
          case SecurityContext.STYLE:
            let cleaned = (value as string).replace(
              /url\(\s*(['\"]?)\s*javascript:[^\)]*\1\s*\)/gi,
              ''
            );
            cleaned = cleaned.replace(/javascript\s*:/gi, '');
            return cleaned || null;
          default:
            return value;
        }
      }
      bypassSecurityTrustHtml(v: string) {
        return v;
      }
    }

    TestBed.configureTestingModule({
      providers: [{ provide: DomSanitizer, useClass: MockDomSanitizer }],
    });
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new SanitizePipe(sanitizer);
  });

  it('deve sanitizar HTML removendo tags <script>', () => {
    const unsafe = '<div>Hello</div><script>alert(1)</script>';
    const out = pipe.transform(unsafe, 'html');
    expect(out).toContain('<div>Hello</div>');
    expect(out).not.toContain('<script>');
  });

  it('deve retornar null para input null/undefined', () => {
    expect(pipe.transform(null, 'html')).toBeNull();
    // @ts-ignore
    expect(pipe.transform(undefined, 'url')).toBeNull();
  });

  it('deve sanitizar URLs e rejeitar o scheme javascript:', () => {
    const bad = 'javascript:alert(1)';
    const res = pipe.transform(bad, 'url');

    expect(res).toBeNull();

    const good = 'https://example.com/path';
    const res2 = pipe.transform(good, 'url');
    expect(res2).toBe(good);
  });

  it('deve sanitizar valores de style', () => {
    const style = "background-image: url('javascript:alert(1)')";
    const res = pipe.transform(style, 'style');
    // Dependendo do sanitizer, pode retornar null ou uma string limpa; garantir que não contenha 'javascript'
    if (res !== null) {
      expect((res as string).toLowerCase()).not.toContain('javascript');
    }
  });

  it('deve sanitizar resourceUrl e retornar null para inválidos', () => {
    const bad = 'javascript:alert(1)';
    const res = pipe.transform(bad, 'resourceUrl');
    expect(res).toBeNull();
  });

  it('deve permitir HTML confiável com trustedHtml', () => {
    const richText = '<p><strong>Texto em negrito</strong> e <em>itálico</em></p>';
    const res = pipe.transform(richText, 'trustedHtml');
    // trustedHtml retorna SafeHtml, não string, então verificamos que não é null
    expect(res).toBeTruthy();
  });

  it('deve manter formatação rich text com trustedHtml', () => {
    const richText = '<h1>Título</h1><p>Parágrafo com <b>negrito</b></p><ul><li>Item 1</li></ul>';
    const res = pipe.transform(richText, 'trustedHtml');
    expect(res).toBeTruthy();
  });
});
