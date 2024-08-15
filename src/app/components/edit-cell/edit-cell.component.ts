import { Component, Input } from '@angular/core';
import { GridItem } from '../../interfaces/bento-box.interface';

@Component({
  selector: 'app-edit-cell',
  standalone: true,
  imports: [],
  templateUrl: './edit-cell.component.html',
  styleUrl: './edit-cell.component.scss'
})
export class EditCellComponent {
  @Input() cell!: GridItem;

}
