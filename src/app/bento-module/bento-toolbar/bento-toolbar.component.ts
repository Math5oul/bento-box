import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SimpleTextComponent } from '../../components/simpleComponents/simple-text/simple-text.component';
import { GridItem } from '../../interfaces/bento-box.interface';
import { bentoOptions } from '../../interfaces/bento-options.interface';
import { GridService } from '../../services/grid-service.service';

@Component({
  selector: 'app-bento-toolbar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './bento-toolbar.component.html',
  styleUrl: './bento-toolbar.component.scss',
})
export class BentoToolbarComponent {
  @Input() data!: GridItem[];
  @Input() options!: bentoOptions;
  @Input() selectedItem!: GridItem;

  @Output() gridChanged = new EventEmitter<void>();

  /**
   * Handler para a largura das células da grade.
   */
  public _cellWidth: number = 0;

  /**
   * Handler para a altura das células da grade.
   */
  public _cellHeight: number = 0;

  constructor(private gridService: GridService) {}

  ngOnInit(): void {
    this._cellWidth = this.options.cellWidth - 2 * this.options.gridGap;
    this._cellHeight = this.options.cellHeight - 2 * this.options.gridGap;
  }

  onGridChange() {
    this.gridService.emitGridChanged();
  }

  onCellChange() {
    this.options.cellHeight = this._cellHeight + 2 * this.options.gridGap;
    this.options.cellWidth = this._cellWidth + 2 * this.options.gridGap;
    this.onGridChange();
  }

  switchMode() {
    this.options.mode = this.options.mode === 'autoFill' ? 'edit' : 'autoFill';
    this.onGridChange();
  }

  /**
   * Cria um novo item para o array do grid
   * e o põe na ultima posição
   */
  addItem() {
    const newRowSpan = parseInt(prompt('Entre com a altura:') ?? '', 10);
    const newColSpan = parseInt(prompt('Entre com a largura') ?? '', 10);

    if (
      !isNaN(newRowSpan) &&
      !isNaN(newColSpan) &&
      newRowSpan > 0 &&
      newColSpan > 0
    ) {
      const newItem: GridItem = {
        id: this.data.length + 1,
        component: SimpleTextComponent,
        inputs: null,
        rowSpan: newRowSpan,
        colSpan: newColSpan,
        row: 0,
        col: 0,
      };

      this.data.push(newItem);
      this.onGridChange();
    } else {
      alert(
        'Entrada Inválida. Largura e altura devem ser número inteiros positivos.'
      );
    }
  }

  removeItem() {
    if (this.selectedItem) {
      const index = this.data.indexOf(this.selectedItem);
      if (index !== -1) {
        this.data.splice(index, 1);
        this.onGridChange();
      }
    } else {
      console.error('Seleciona um item para remover');
    }
  }

  /**
   * Move o item selecionado no vetor que forma o grid
   * @param direction A direção no vetor para o qual o item sera movido
   */
  swapItemPosition(direction: 'left' | 'right') {
    if (this.selectedItem) {
      const index = this.data.findIndex(
        (item) => item.id === this.selectedItem!.id
      );

      if (direction === 'left' && index > 0) {
        [this.data[index - 1], this.data[index]] = [
          this.data[index],
          this.data[index - 1],
        ];
        this.onGridChange();
      } else if (direction === 'right' && index < this.data.length - 1) {
        [this.data[index], this.data[index + 1]] = [
          this.data[index + 1],
          this.data[index],
        ];
        this.onGridChange();
      } else {
        console.error('Não há como mover o item selecionado para esta direção');
      }
    } else {
      console.error('Seleciona um item para mover');
    }
  }
}
