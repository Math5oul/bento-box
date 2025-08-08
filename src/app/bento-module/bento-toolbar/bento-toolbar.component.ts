import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GridItem } from '../../interfaces/bento-box.interface';
import { BentoOptions } from '../../interfaces/bento-options.interface';
import { GridService } from '../../services/grid-service/grid.service';
import { NewItemModalComponent } from '../new-item-modal/new-item-modal.component';

@Component({
  selector: 'app-bento-toolbar',
  standalone: true,
  imports: [FormsModule, NewItemModalComponent],
  templateUrl: './bento-toolbar.component.html',
  styleUrl: './bento-toolbar.component.scss',
})
export class BentoToolbarComponent {
  @Input() data!: GridItem[];
  @Input() options!: BentoOptions;
  @Input() selectedItem!: GridItem;

  @Output() gridChanged = new EventEmitter<void>();
  @Output() addItem = new EventEmitter<GridItem>();
  @Output() deleteItem = new EventEmitter<GridItem>();
  @Output() moveItem = new EventEmitter<{
    item: GridItem;
    direction: 'left' | 'right';
  }>();

  public showNewItemModal = false;

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
   * Abre o modal para criar um novo item
   */
  openNewItemModal() {
    this.showNewItemModal = true;
  }

  /**
   * Fecha o modal de novo item
   */
  closeNewItemModal() {
    this.showNewItemModal = false;
  }

  /**
   * Cria um novo item para o array do grid
   * e o põe na ultima posição
   */
  addNewItem(itemData: any) {
    const newItem: GridItem = {
      id: 0, // Parent will set proper ID
      component: itemData.component,
      inputs: itemData.inputs,
      rowSpan: itemData.rowSpan,
      colSpan: itemData.colSpan,
      row: 0,
      col: 0,
      category: itemData.category || 'Uncategorized',
    };

    this.addItem.emit(newItem);
    this.closeNewItemModal();
  }

  onCellWidthChange(value: number) {
    this._cellWidth = value;
    this.onCellChange();
  }

  onCellHeightChange(value: number) {
    this._cellHeight = value;
    this.onCellChange();
  }

  /**
   * Remove o item selecionado do vetor que forma o grid
   */
  removeItem() {
    if (this.selectedItem) {
      this.deleteItem.emit(this.selectedItem);
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
      this.moveItem.emit({ item: this.selectedItem, direction }); // Emit instead of modifying locally
    } else {
      console.error('Seleciona um item para mover');
    }
  }
}
