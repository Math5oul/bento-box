import { Component, Input } from '@angular/core';
import { dataExamples } from '../data/bento-itens-example';
import { fillerExamples } from '../data/filler-itens';
import { GridItem } from '../interfaces/bento-box.interface';
import { bentoOptions } from '../interfaces/bento-options.interface';
import { BentoBoxComponent } from './bento-box/bento-box.component';


@Component({
  selector: 'app-bento-module',
  standalone: true,
  imports: [BentoBoxComponent],
  templateUrl: './bento-module.component.html',
  styleUrl: './bento-module.component.scss',
})
export class BentoModuleComponent {
  @Input() data: GridItem[] = dataExamples;
  @Input() fillers?: GridItem[] = fillerExamples;
  @Input() options: bentoOptions = {
    createFillers: true,
    cellWidth: 160,
    cellHeight: 160,
    gridGap: 8,
    maxCols: 4,
    maxWidth: 0,
    editMode: true,
  };

  ngOnInit(): void {
    if (this.fillers?.length === 0){
      this.options.createFillers = false;
    }

  }

}
