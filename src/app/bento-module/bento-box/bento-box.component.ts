import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  Output,
  PLATFORM_ID,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { GridItem } from '../../interfaces/bento-box.interface';
import { BentoOptions } from '../../interfaces/bento-options.interface';
import { GridService } from '../../services/grid-service/grid.service';

/**
 * Componente responsável por renderizar e gerenciar uma grade dinâmica de itens
 * com suporte a drag-and-drop, fillers automáticos e modo de edição
 */
@Component({
  selector: 'app-bento-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bento-box.component.html',
  styleUrls: ['./bento-box.component.scss'],
})
export class BentoBoxComponent {
  @Input() data!: GridItem[];
  @Input() fillers: GridItem[] = [];
  @Input() options!: BentoOptions;
  @Input() selectedId: number | null = null;
  @Output() itemClick = new EventEmitter<GridItem>();
  @Output() itemEdit = new EventEmitter<GridItem>();
  @Output() itemDelete = new EventEmitter<GridItem>();

  @ViewChild('bento') bento!: ElementRef;
  @ViewChild('bentoItem') bentoItem!: ElementRef;

  private grid!: boolean[][];
  private emptyCells: { row: number; col: number }[] = [];
  public fillersInGrid!: GridItem[];
  emptySpaces!: { [key: string]: { row: number; col: number }[] };
  currentCols!: number;

  draggedItem: GridItem | null = null;
  dragOverItem: GridItem | null = null;

  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchCurrentX: number = 0;
  private touchCurrentY: number = 0;
  private ghostElement: HTMLElement | null = null;

  private resizeSubject = new Subject<void>();
  private windowWidth!: number;

  public _cellWidth: number = 0;
  public _cellHeight: number = 0;
  public localCellWidth: number = 0;
  public localCellHeight: number = 0;

  rezizeObserver!: ResizeObserver;
  constructor(
    private gridService: GridService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.resizeSubject.subscribe(() => {
      if (isPlatformBrowser(this.platformId) && this.bento?.nativeElement) {
        this.windowWidth = this.bento.nativeElement.offsetWidth;
        this.calculateGridCols(this.windowWidth);
      }
    });

    this.gridService.gridChanged$.subscribe(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.calculateGridCols(this.windowWidth);
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit(): void {
    this.initCells();

    this.currentCols = this.options.maxCols;
    if (isPlatformBrowser(this.platformId)) {
      this.windowWidth = this.options.maxWidth !== 0 ? this.options.maxWidth : window.innerWidth;
      this.calculateGridCols(this.windowWidth);
    }
  }

  public restartGrid() {
    this.grid = [];
    this.emptyCells = [];
    this.fillersInGrid = [];
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.restartGrid();
    this.resizeSubject.next();
  }

  initCells() {
    this.localCellWidth = this.options.cellWidth + 2 * this.options.gridGap;
    this.localCellHeight =
      this.options.cellHeight !== 0
        ? this.options.cellHeight + 2 * this.options.gridGap
        : this.localCellWidth;
    this._cellWidth = this.localCellWidth - 2 * this.options.gridGap;
    this._cellHeight = this.localCellHeight - 2 * this.options.gridGap;
  }

  /**
   * Pega a largura minima para acomodar o grid
   * @returns o comprimento do maior item para o grid
   */
  getMinWidth(): number {
    return Math.max(...this.data.map(item => item.colSpan));
  }

  /**
   * Obtém a grade de itens e atualiza as variáveis de estado.
   */
  calculateGridCols(containerWidth: number) {
    const columns = Math.max(
      Math.min(this.options.maxCols, Math.floor(containerWidth / this.localCellWidth)),
      this.getMinWidth()
    );

    this.currentCols = columns;
    this.initializeGrid(1, columns);
    this.fillGrid(columns);

    if (this.options.createFillers && this.options.mode !== 'edit') {
      this.getEmptyCells(this.grid.length, columns);
      this.groupEmptyCells();
      this.putFillerItens(this.fillers);
    } else {
      this.fillersInGrid = [];
    }
  }

  /**
   * Inicializa uma grade bidimensional de booleanos com o tamanho especificado
   * com todas as casas da grade como false.
   * @param rows Número de linhas da grade.
   * @param columns Número de colunas da grade.
   * @returns A grade inicializada.
   */
  initializeGrid(rows: number, columns: number): void {
    const grid: boolean[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: boolean[] = [];
      for (let j = 0; j < columns; j++) {
        row.push(false);
      }
      grid.push(row);
    }
    this.grid = grid;
  }

  /**
   * Preenche a grade com os itens.
   * @param columns Número de colunas da grade.
   */
  fillGrid(columns: number) {
    let row = 0;
    let col = 0;

    this.data.forEach(item => {
      while (true) {
        while (this.grid.length <= row + item.rowSpan - 1) {
          this.grid.push(new Array(columns).fill(false));
        }

        if (this.isItemFitting(item, row, col)) {
          item.row = row;
          item.col = col;
          this.markOccupiedSpaces(item);

          col += item.colSpan;

          if (col >= columns) {
            col = 0;
            row++;
          }

          break;
        } else {
          col++;
          if (col >= columns) {
            col = 0;
            row++;
          }
        }
      }
    });
  }

  /**
   * Verifica se o item cabe no grid
   * @param item Item que verificará se cabe no grid
   * @param row Linha da posição de encaixe no grid
   * @param col Coluna da posição de encaixe no grid
   * @returns True / false se o item cabe
   */
  isItemFitting(item: GridItem, row: number, col: number): boolean {
    if (row + item.rowSpan > this.grid.length || col + item.colSpan > this.grid[0].length) {
      return false;
    }

    for (let i = row; i < row + item.rowSpan; i++) {
      for (let j = col; j < col + item.colSpan; j++) {
        if (this.grid[i][j]) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Marca a casas ocupadas por um item no grid
   * @param item Item que marcará os espaços no grid
   */
  markOccupiedSpaces(item: GridItem) {
    for (let i = item.row; i < item.row + item.rowSpan; i++) {
      for (let j = item.col; j < item.col + item.colSpan; j++) {
        this.grid[i][j] = true;
      }
    }
  }

  getEmptyCells(rows: number, columns: number) {
    this.emptyCells = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (!this.grid[row][col]) {
          this.emptyCells.push({ row, col });
        }
      }
    }
  }

  /**
   * Agrupa células vazias da grade com base no seu tamanho.
   */
  groupEmptyCells() {
    this.emptySpaces = {
      '2x2': [],
      '2x1': [],
      '1x2': [],
      '1x1': [],
    };
    const occupiedCells: { [key: string]: boolean } = {};

    for (let i = 0; i < this.emptyCells.length; i++) {
      const cell = this.emptyCells[i];
      const row = cell.row;
      const col = cell.col;
      const key = `${row},${col}`;

      if (occupiedCells[key]) {
        continue;
      }

      if (
        row < this.grid.length - 1 &&
        col < this.grid[0].length - 1 &&
        this.grid[row] &&
        this.grid[row + 1] &&
        !this.grid[row][col] &&
        !this.grid[row][col + 1] &&
        !this.grid[row + 1][col] &&
        !this.grid[row + 1][col + 1] &&
        !occupiedCells[`${row},${col + 1}`] &&
        !occupiedCells[`${row + 1},${col}`] &&
        !occupiedCells[`${row + 1},${col + 1}`]
      ) {
        this.emptySpaces['2x2'].push(cell);
        occupiedCells[key] = true;
        occupiedCells[`${row},${col + 1}`] = true;
        occupiedCells[`${row + 1},${col}`] = true;
        occupiedCells[`${row + 1},${col + 1}`] = true;
      } else if (
        row < this.grid.length - 1 &&
        this.grid[row] &&
        this.grid[row + 1] &&
        !this.grid[row][col] &&
        !this.grid[row + 1][col] &&
        !occupiedCells[`${row + 1},${col}`]
      ) {
        this.emptySpaces['2x1'].push(cell);
        occupiedCells[key] = true;
        occupiedCells[`${row + 1},${col}`] = true;
      } else if (
        col < this.grid[0].length - 1 &&
        this.grid[row] &&
        !this.grid[row][col] &&
        !this.grid[row][col + 1] &&
        !occupiedCells[`${row},${col + 1}`]
      ) {
        this.emptySpaces['1x2'].push(cell);
        occupiedCells[key] = true;
        occupiedCells[`${row},${col + 1}`] = true;
      } else if (this.grid[row] && !this.grid[row][col]) {
        this.emptySpaces['1x1'].push(cell);
        occupiedCells[key] = true;
      }
    }
  }

  /**
   * Reseta os filler atuais no grid
   * embaralha o array de fillers e encaixa o
   * primeiro que achar nos espaços disponiveis, priorizando o maior formato possível
   */
  putFillerItens(fillers: GridItem[]) {
    this.fillersInGrid = [];
    const fillerItens: GridItem[] = [];

    let availableFillers = [...fillers];

    // Embaralha o array de fillers
    for (let i = availableFillers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableFillers[i], availableFillers[j]] = [availableFillers[j], availableFillers[i]];
    }

    const getFormatArea = (format: string): number => {
      const [rows, cols] = format.split('x').map(Number);
      return rows * cols;
    };

    const sortFormatsBySize = (formats: string[]): string[] => {
      return [...formats].sort((a, b) => getFormatArea(b) - getFormatArea(a));
    };

    const usedCells = new Set<string>();

    const sortedSizes = Object.keys(this.emptySpaces).sort((a, b) => {
      return getFormatArea(b) - getFormatArea(a);
    });

    sortedSizes.forEach(size => {
      const [rowSpan, colSpan] = size.split('x').map(Number);

      this.emptySpaces[size].forEach(cell => {
        const cellKey = `${cell.row},${cell.col}`;

        if (usedCells.has(cellKey)) {
          return;
        }

        let fillerIndex = -1;
        let selectedFormat = '';

        for (let i = 0; i < availableFillers.length; i++) {
          const filler = availableFillers[i];

          const validFormats = filler.inputs?.formats || [
            filler.inputs?.format || `${filler.rowSpan}x${filler.colSpan}`,
          ];

          const sortedFormats = sortFormatsBySize(validFormats);

          for (const format of sortedFormats) {
            const [fRowSpan, fColSpan] = format.split('x').map(Number);

            if (fRowSpan === rowSpan && fColSpan === colSpan) {
              fillerIndex = i;
              selectedFormat = format;
              break;
            }
          }

          if (fillerIndex !== -1) break;
        }

        if (fillerIndex !== -1) {
          const [selectedRowSpan, selectedColSpan] = selectedFormat.split('x').map(Number);

          const filler = {
            ...availableFillers[fillerIndex],
            row: cell.row,
            col: cell.col,
            rowSpan: selectedRowSpan,
            colSpan: selectedColSpan,
          };

          fillerItens.push(filler);

          usedCells.add(cellKey);
          availableFillers.splice(fillerIndex, 1);
        }
      });
    });

    this.fillersInGrid = fillerItens;
  }

  recalculateGrid(): void {
    if (isPlatformBrowser(this.platformId) && this.bento?.nativeElement) {
      this.windowWidth = this.bento.nativeElement.offsetWidth;
      this.calculateGridCols(this.windowWidth);
    }
  }

  //-------------------------------TOOLBAR-------------------------------//

  /**
   * Obtém os inputs do componente, adicionando o modo de edição se necessário.
   * @param inputs Os inputs originais do componente.
   * @param component O componente para o qual os inputs são destinados.
   * @returns Os inputs modificados, se aplicável.
   */
  getComponentInputs(inputs: any): any {
    return {
      inputs: {
        ...inputs,
        editMode: this.options.mode === 'edit',
      },
    };
  }
  /**
   * Manipula o clique em um item da grade.
   * @param event Evento de clique.
   * @param clicked Item clicado.
   */
  handleItemClick(event: MouseEvent, clicked: GridItem): void {
    if (this.options.mode === 'edit') {
      this.selectedId = clicked.id;
      this.itemClick.emit(clicked);
    } else {
      this.itemClick.emit(clicked);
    }
  }

  /**
   * Inicia o drag de um item com feedback visual customizado
   */
  onDragStart(event: DragEvent, item: GridItem): void {
    if (this.options.mode !== 'edit') return;

    this.draggedItem = item;

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');

      const dragElement = event.target as HTMLElement;
      const clone = dragElement.cloneNode(true) as HTMLElement;

      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.width = dragElement.offsetWidth + 'px';
      clone.style.height = dragElement.offsetHeight + 'px';
      clone.style.opacity = '0.9';
      clone.style.transform = 'rotate(3deg) scale(1.05)';
      clone.style.boxShadow =
        '0 15px 50px rgba(59, 130, 246, 0.5), 0 0 0 4px rgba(59, 130, 246, 0.3)';
      clone.style.borderRadius = '12px';
      clone.style.border = '3px solid rgba(59, 130, 246, 0.8)';
      clone.style.background = 'rgba(255, 255, 255, 0.95)';
      clone.style.pointerEvents = 'none';

      const editActions = clone.querySelector('.edit-actions') as HTMLElement;
      if (editActions) {
        editActions.style.display = 'none';
      }

      document.body.appendChild(clone);

      event.dataTransfer.setDragImage(
        clone,
        dragElement.offsetWidth / 2,
        dragElement.offsetHeight / 2
      );

      setTimeout(() => {
        if (clone.parentNode) {
          document.body.removeChild(clone);
        }
      }, 0);
    }

    setTimeout(() => {
      if (this.draggedItem === item) {
        this.draggedItem = null;
        this.dragOverItem = null;
        this.cdr.detectChanges();
      }
    }, 5000);
  }

  /**
   * Permite o drop sobre um item
   */
  onDragOver(event: DragEvent, item: GridItem): void {
    if (this.options.mode !== 'edit' || !this.draggedItem) return;

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    this.dragOverItem = item;
  }

  /**
   * Executa a inserção do item arrastado na posição do target, empurrando os outros para frente
   */
  onDrop(event: DragEvent, targetItem: GridItem): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.draggedItem || this.draggedItem.id === targetItem.id) {
      this.draggedItem = null;
      this.dragOverItem = null;
      return;
    }

    const draggedIndex = this.data.findIndex(item => item.id === this.draggedItem!.id);
    const targetIndex = this.data.findIndex(item => item.id === targetItem.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      this.draggedItem = null;
      this.dragOverItem = null;
      return;
    }

    // Remove o item da posição atual
    const [draggedItem] = this.data.splice(draggedIndex, 1);

    // Insere o item na nova posição (antes do target)
    this.data.splice(targetIndex, 0, draggedItem);

    this.gridService.emitGridChanged();

    this.draggedItem = null;
    this.dragOverItem = null;

    this.cdr.detectChanges();
  }

  /**
   * Limpa o estado quando o drag é removido de um item
   */
  onDragLeave(event: DragEvent): void {
    this.dragOverItem = null;
  }

  /**
   * Finaliza o drag
   */
  onDragEnd(event: DragEvent): void {
    this.draggedItem = null;
    this.dragOverItem = null;
    this.cdr.detectChanges();
  }

  /**
   * Handler de drop no container
   */
  onContainerDrop(event: DragEvent): void {
    event.preventDefault();
    this.draggedItem = null;
    this.dragOverItem = null;
    this.cdr.detectChanges();
  }

  /**
   * Touch drag handlers para suporte mobile
   */
  onTouchStart(event: TouchEvent, item: GridItem): void {
    if (this.options.mode !== 'edit') return;

    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.draggedItem = item;

    this.createGhostElement(event.target as HTMLElement, touch.clientX, touch.clientY);
  }

  /**
   * Move o elemento ghost conforme o toque se move
   */
  onTouchMove(event: TouchEvent): void {
    if (!this.draggedItem || this.options.mode !== 'edit') return;

    event.preventDefault();

    const touch = event.touches[0];
    this.touchCurrentX = touch.clientX;
    this.touchCurrentY = touch.clientY;

    if (this.ghostElement) {
      this.ghostElement.style.left = `${touch.clientX - 50}px`;
      this.ghostElement.style.top = `${touch.clientY - 50}px`;
    }

    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elementBelow) {
      const bentoItem = elementBelow.closest('.bento-item') as HTMLElement;
      if (bentoItem) {
        const itemIndex = Array.from(bentoItem.parentElement?.children || []).indexOf(bentoItem);
        if (itemIndex >= 0 && this.data[itemIndex]) {
          this.dragOverItem = this.data[itemIndex];
        }
      }
    }
  }

  /**
   * Finaliza o touch drag e executa a inserção na nova posição
   */
  onTouchEnd(event: TouchEvent): void {
    if (!this.draggedItem) return;

    if (this.dragOverItem && this.draggedItem.id !== this.dragOverItem.id) {
      const draggedIndex = this.data.findIndex(item => item.id === this.draggedItem!.id);
      const targetIndex = this.data.findIndex(item => item.id === this.dragOverItem!.id);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Remove o item da posição atual
        const [draggedItem] = this.data.splice(draggedIndex, 1);

        // Insere o item na nova posição (antes do target)
        this.data.splice(targetIndex, 0, draggedItem);

        this.gridService.emitGridChanged();
      }
    }

    this.removeGhostElement();
    this.draggedItem = null;
    this.dragOverItem = null;
  }

  /**
   * Cria elemento ghost para feedback visual no mobile
   */
  private createGhostElement(sourceElement: HTMLElement, x: number, y: number): void {
    const ghost = sourceElement.cloneNode(true) as HTMLElement;
    ghost.style.position = 'fixed';
    ghost.style.left = `${x - 50}px`;
    ghost.style.top = `${y - 50}px`;
    ghost.style.width = `${sourceElement.offsetWidth}px`;
    ghost.style.height = `${sourceElement.offsetHeight}px`;
    ghost.style.opacity = '0.7';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.transform = 'scale(0.95)';
    ghost.classList.add('ghost-dragging');

    document.body.appendChild(ghost);
    this.ghostElement = ghost;
  }

  /**
   * Remove elemento ghost
   */
  private removeGhostElement(): void {
    if (this.ghostElement) {
      document.body.removeChild(this.ghostElement);
      this.ghostElement = null;
    }
  }

  /**
   * Emite evento para editar um item
   */
  onEditItem(event: MouseEvent, item: GridItem): void {
    event.stopPropagation();
    this.itemEdit.emit(item);
  }

  /**
   * Emite evento para deletar um item
   */
  onDeleteItem(event: MouseEvent, item: GridItem): void {
    event.stopPropagation();
    this.itemDelete.emit(item);
  }
}
