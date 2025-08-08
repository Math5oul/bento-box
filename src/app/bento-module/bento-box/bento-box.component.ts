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
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { GridItem } from '../../interfaces/bento-box.interface';
import { BentoOptions } from '../../interfaces/bento-options.interface';
import { GridService } from '../../services/grid-service/grid.service';

/**
 * Componente responsável por renderizar uma grade de itens.
 */
@Component({
  selector: 'app-bento-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bento-box.component.html',
  styleUrls: ['./bento-box.component.scss'],
})
export class BentoBoxComponent {
  /**
   * Dados dos itens da grade.
   * REPRESENTA O ARRAY DE COMPONENTES QUE VIRÁ COMO INPUT
   */
  @Input() data!: GridItem[];
  @Input() fillers: GridItem[] = [];
  @Input() options!: BentoOptions;

  @Output() selectedItemChange = new EventEmitter<GridItem | null>();

  private gridByCategory: { [key: string]: boolean[][] } = {};
  private emptyCellsByCategory: {
    [key: string]: { row: number; col: number }[];
  } = {};
  public fillersInGridByCategory: { [key: string]: GridItem[] } = {};

  public categorizedItems: { [key: string]: GridItem[] } = {};

  currentCols!: number;
  public selectedItem!: GridItem;

  @ViewChild('bento') bento!: ElementRef;

  private resizeSubject = new Subject<void>();
  private windowWidth!: number;

  public _cellWidth: number = 0;
  public _cellHeight: number = 0;

  constructor(
    private gridService: GridService,
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
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resizeSubject.next();
  }

  ngOnInit(): void {
    this.initCells();
    this.recalculateGrid();
    if (isPlatformBrowser(this.platformId)) {
      this.windowWidth =
        this.options.maxWidth !== 0 ? this.options.maxWidth : window.innerWidth;
      this.calculateGridCols(this.windowWidth);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.groupItemsByCategory();
      this.recalculateGrid();
    }
  }

  private recalculateGrid() {
    if (!this.currentCols) return;

    this.gridByCategory = {};
    this.emptyCellsByCategory = {};
    this.fillersInGridByCategory = {};

    for (const category of this.getCategories()) {
      this.gridByCategory[category] = this.initializeGrid(this.currentCols);
      this.fillGridForCategory(category, this.currentCols);

      if (this.options.createFillers && this.options.mode !== 'edit') {
        this.getEmptyCellsForCategory(
          category,
          this.gridByCategory[category].length,
          this.currentCols
        );
        this.groupEmptyCellsForCategory(category);
        this.putFillerItemsForCategory(category, this.fillers);
      } else {
        this.fillersInGridByCategory[category] = [];
      }
    }
  }

  /**
   * Inicializa as dimensões das células da grade.
   */
  initCells() {
    this.options.cellWidth = this.options.cellWidth + 2 * this.options.gridGap;
    this.options.cellHeight =
      this.options.cellHeight !== 0
        ? this.options.cellHeight + 2 * this.options.gridGap
        : this.options.cellWidth;
    this._cellWidth = this.options.cellWidth - 2 * this.options.gridGap;
    this._cellHeight = this.options.cellHeight - 2 * this.options.gridGap;
  }

  /**
   *
   * @returns Largura mínima necessária para acomodar o maior item na grade.
   */
  getMinWidth(): number {
    return Math.max(...this.data.map((item) => item.colSpan));
  }

  /**
   * Calcula o número de colunas da grade com base na largura do contêiner
   * @param containerWidth Largura do contêiner para calcular o número de colunas.
   */
  calculateGridCols(containerWidth: number) {
    const columns = Math.max(
      Math.min(
        this.options.maxCols,
        Math.floor(containerWidth / this.options.cellWidth)
      ),
      this.getMinWidth()
    );

    this.currentCols = columns;
    this.recalculateGrid();
  }

  /**
   * Inicializa a grade com células vazias.
   * @param columns Número de colunas na grade.
   * @returns matriz booleana representando a grade (true para ocupado, false para vazio).
   */
  initializeGrid(columns: number): boolean[][] {
    const grid: boolean[][] = [[]];
    grid[0] = new Array(columns).fill(false);
    return grid;
  }

  /**
   * Preenche a grade com os itens da categoria especificada.
   * @param category Categoria dos itens a serem preenchidos na grade.
   * @param columns Número de colunas na grade.
   */
  fillGridForCategory(category: string, columns: number) {
    let row = 0;
    let col = 0;
    const items = this.categorizedItems[category];
    const grid = this.gridByCategory[category];

    items.forEach((item) => {
      while (true) {
        while (grid.length <= row + item.rowSpan - 1) {
          grid.push(new Array(columns).fill(false));
        }

        if (this.isItemFittingInGrid(grid, item, row, col)) {
          item.row = row;
          item.col = col;
          this.markOccupiedSpacesInGrid(grid, item);

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
   * Verifica se um item cabe na grade a partir de uma posição específica.
   * @param grid Matriz booleana representando a grade.
   * @param item Item a ser verificado.
   * @param row linha da posição inicial
   * @param col coluna da posição inicial
   * @returns Se o item cabe na grade a partir da posição especificada.
   */
  isItemFittingInGrid(
    grid: boolean[][],
    item: GridItem,
    row: number,
    col: number
  ): boolean {
    if (
      row + item.rowSpan > grid.length ||
      col + item.colSpan > grid[0].length
    ) {
      return false;
    }
    for (let i = row; i < row + item.rowSpan; i++) {
      for (let j = col; j < col + item.colSpan; j++) {
        if (grid[i][j]) return false;
      }
    }
    return true;
  }

  markOccupiedSpacesInGrid(grid: boolean[][], item: GridItem) {
    for (let i = item.row; i < item.row + item.rowSpan; i++) {
      for (let j = item.col; j < item.col + item.colSpan; j++) {
        grid[i][j] = true;
      }
    }
  }

  getEmptyCellsForCategory(category: string, rows: number, columns: number) {
    this.emptyCellsByCategory[category] = [];
    const grid = this.gridByCategory[category];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (!grid[row][col]) {
          this.emptyCellsByCategory[category].push({ row, col });
        }
      }
    }
  }

  groupEmptyCellsForCategory(category: string) {
    const grid = this.gridByCategory[category];
    const emptyCells = this.emptyCellsByCategory[category];

    const emptySpaces: { [key: string]: { row: number; col: number }[] } = {
      '2x2': [],
      '2x1': [],
      '1x2': [],
      '1x1': [],
    };
    const occupiedCells: { [key: string]: boolean } = {};

    for (let i = 0; i < emptyCells.length; i++) {
      const cell = emptyCells[i];
      const row = cell.row;
      const col = cell.col;
      const key = `${row},${col}`;

      if (occupiedCells[key]) continue;

      if (
        row < grid.length - 1 &&
        col < grid[0].length - 1 &&
        !grid[row][col] &&
        !grid[row][col + 1] &&
        !grid[row + 1][col] &&
        !grid[row + 1][col + 1] &&
        !occupiedCells[`${row},${col + 1}`] &&
        !occupiedCells[`${row + 1},${col}`] &&
        !occupiedCells[`${row + 1},${col + 1}`]
      ) {
        emptySpaces['2x2'].push(cell);
        occupiedCells[key] = true;
        occupiedCells[`${row},${col + 1}`] = true;
        occupiedCells[`${row + 1},${col}`] = true;
        occupiedCells[`${row + 1},${col + 1}`] = true;
      } else if (
        row < grid.length - 1 &&
        !grid[row][col] &&
        !grid[row + 1][col] &&
        !occupiedCells[`${row + 1},${col}`]
      ) {
        emptySpaces['2x1'].push(cell);
        occupiedCells[key] = true;
        occupiedCells[`${row + 1},${col}`] = true;
      } else if (
        col < grid[0].length - 1 &&
        !grid[row][col] &&
        !grid[row][col + 1] &&
        !occupiedCells[`${row},${col + 1}`]
      ) {
        emptySpaces['1x2'].push(cell);
        occupiedCells[key] = true;
        occupiedCells[`${row},${col + 1}`] = true;
      } else if (!grid[row][col]) {
        emptySpaces['1x1'].push(cell);
        occupiedCells[key] = true;
      }
    }

    (this as any).emptySpacesByCategory ??= {};
    (this as any).emptySpacesByCategory[category] = emptySpaces;
  }

  /**
   * Adiciona itens de preenchimento na grade para a categoria especificada.
   * @param category Categoria dos itens a serem preenchidos na grade.
   * @param fillers Itens de preenchimento disponíveis.
   */
  putFillerItemsForCategory(category: string, fillers: GridItem[]) {
    this.fillersInGridByCategory[category] = [];
    const fillerItems: GridItem[] = [];

    fillers = [...fillers].sort(() => Math.random() - 0.5);

    const emptySpaces = (this as any).emptySpacesByCategory[category];

    Object.keys(emptySpaces).forEach((size) => {
      const [rowSpan, colSpan] = size.split('x').map(Number);

      emptySpaces[size].forEach((cell: { row: number; col: number }) => {
        const filler = fillers.find(
          (f) => f.colSpan === colSpan && f.rowSpan === rowSpan
        );
        if (filler) {
          filler.row = cell.row;
          filler.col = cell.col;
          fillerItems.push(filler);
          fillers = fillers.filter((f) => f.id !== filler.id);
        }
      });
    });

    this.fillersInGridByCategory[category] = fillerItems;
  }

  getCategories(): string[] {
    return Object.keys(this.categorizedItems).sort((a, b) => {
      const order = ['hot-drinks', 'cold drinks', 'snacks', 'desserts'];
      return order.indexOf(a) - order.indexOf(b);
    });
  }

  private groupItemsByCategory(): void {
    this.categorizedItems = {};
    this.data.forEach((item) => {
      if (!this.categorizedItems[item.category]) {
        this.categorizedItems[item.category] = [];
      }
      this.categorizedItems[item.category].push(item);
    });
  }

  selectItem(selected: GridItem) {
    const index = this.data.findIndex((item) => item.id === selected.id);
    if (this.options.mode === 'edit') {
      this.selectedItem = this.data[index];
      this.selectedItemChange.emit(this.selectedItem);
    }
  }
}
