import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-simple-video',
  standalone: true,
  imports: [],
  templateUrl: './simple-video.component.html',
  styleUrl: './simple-video.component.scss'
})
export class SimpleVideoComponent {

  @Input() videoUrl!: string;
  @Input() width: string = '360px';
  @Input() height: string = '360px';
  @Input() autoplay: boolean = false;
  @Input() controls: boolean = true;
  @Input() loop: boolean = false;

}
