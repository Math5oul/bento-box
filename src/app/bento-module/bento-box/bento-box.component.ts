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
} from '@angular/core';
import { FormsModule } from '@angular/forms'; //
import { Subject } from 'rxjs';
import { GridItem } from '../../interfaces/bento-box.interface';
import { BentoOptions } from '../../interfaces/bento-options.interface';
import { GridService } from '../../services/grid-service.service';

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

  /**
   * Grade de booleanos que representa a ocupação das células.
   */
  private grid!: boolean[][];

  /**
   * Lista de células vazias da grade.
   */
  private emptyCells: { row: number; col: number }[] = [];

  /**
   * Lista de itens de preenchimento da grade.
   */
  public fillersInGrid!: GridItem[];

  /**
   * Espaços vazios da grade, agrupados por tamanho.
   */
  emptySpaces!: { [key: string]: { row: number; col: number }[] };

  /**
   * Numéro atual de colunas
   */
  currentCols!: number;

  /**
   * Item selecionado no modo de edição
   */
  public selectedItem!: GridItem;

  /**
   * Referência ao elemento do container da grade.
   */
  @ViewChild('bento') bento!: ElementRef;

  /**
   * Referência ao elemento de item da grade.
   */
  @ViewChild('bentoItem') bentoItem!: ElementRef;

  /**
   * Subject responsável por gerenciar o redimensionamento da janela.
   */
  private resizeSubject = new Subject<void>();

  /**
   * Observável de quando a janela é redimensionada.
   * @param event Evento de redimensionamento.
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.grid = [];
    this.emptyCells = [];
    this.fillersInGrid = [];

    this.resizeSubject.next();
  }
  /**
   * Largura da tela
   */
  private windowWidth!: number;

  /**
   * Handler para a largura das células da grade.
   */
  public _cellWidth: number = 0;

  /**
   * Handler para a altura das células da grade.
   */
  public _cellHeight: number = 0;

  rezizeObserver!: ResizeObserver;

  /**
   * Construtor do componente.
   * @param cdr Referência ao ChangeDetectorRef.
   */
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

  ngOnInit(): void {
    this.initCells();

    this.currentCols = this.options.maxCols;
    if (isPlatformBrowser(this.platformId)) {
      this.windowWidth =
        this.options.maxWidth !== 0 ? this.options.maxWidth : window.innerWidth;
      this.calculateGridCols(this.windowWidth);
    }
  }

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
   * Pega a largura minima para acomodar o grid
   * @returns o comprimento do maior item para o grid
   */
  getMinWidth(): number {
    return Math.max(...this.data.map((item) => item.colSpan));
  }

  /**
   * Obtém a grade de itens e atualiza as variáveis de estado.
   */
  calculateGridCols(containerWidth: number) {
    const columns = Math.max(
      Math.min(
        this.options.maxCols,
        Math.floor(containerWidth / this.options.cellWidth)
      ),
      this.getMinWidth()
    );

    //Calcula o número de colunas a serem exibidas,
    //garantindo que seja entre o menor valor e o maior valor de colunas
    //com base na largura do contêiner e no tamanho da célula.
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

    this.data.forEach((item) => {
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
    // Check overflow
    if (
      row + item.rowSpan > this.grid.length ||
      col + item.colSpan > this.grid[0].length
    ) {
      return false;
    }
    // Check cada celula
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
      }
      // Check for 1x1
      else if (this.grid[row] && !this.grid[row][col]) {
        this.emptySpaces['1x1'].push(cell);
        occupiedCells[key] = true;
      }
    }
  }

  /**
   * Reseta os filler atuais no grid
   * embaralha o array de fillers e encaixa o
   * primeiro que achar nos espaços disponiveis
   */
  putFillerItens(fillers: GridItem[]) {
    this.fillersInGrid = [];
    const fillerItens: GridItem[] = [];

    // Shuffle the fillers array
    for (let i = fillers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fillers[i], fillers[j]] = [fillers[j], fillers[i]];
    }

    Object.keys(this.emptySpaces).forEach((size) => {
      const [rowSpan, colSpan] = size.split('x').map(Number);

      this.emptySpaces[size].forEach((cell) => {
        const filler = fillers.find(
          (filler) => filler.colSpan === colSpan && filler.rowSpan === rowSpan
        );
        if (filler) {
          filler.row = cell.row;
          filler.col = cell.col;
          fillerItens.push(filler);
          fillers = fillers.filter((f) => f.id !== filler.id); // remove the found filler from the list
        }
      });
    });

    this.fillersInGrid = fillerItens;
  }

  //-------------------------------TOOLBAR-------------------------------//
  /**
   * Seleciona um item no vetor que forma o grid
   * @param selected o item a ser selecionado
   */
  selectItem(selected: GridItem) {
    const index = this.data.findIndex((item) => item.id === selected.id);
    if (this.options.mode === 'edit') {
      this.selectedItem = this.data[index];
      this.selectedItemChange.emit(this.selectedItem);
    }
  }
}
