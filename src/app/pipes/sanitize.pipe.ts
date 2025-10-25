import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'sanitize',
  standalone: true,
})
export class SanitizePipe implements PipeTransform {
  constructor(private domSanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    return this.domSanitizer.bypassSecurityTrustHtml(value);
  }
}
