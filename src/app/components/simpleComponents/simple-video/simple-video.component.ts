import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-simple-video',
  standalone: true,
  imports: [],
  templateUrl: './simple-video.component.html',
  styleUrl: './simple-video.component.scss',
})
export class SimpleVideoComponent {
  @Input() inputs: {
    videoUrl: string;
    autoplay: boolean;
    controls: boolean;
    loop: boolean;
  } = {
    videoUrl: '',
    autoplay: true,
    controls: false,
    loop: false,
  };
}
