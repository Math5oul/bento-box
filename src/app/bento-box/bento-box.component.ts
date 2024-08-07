import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { debounceTime, Subject } from 'rxjs';
import { data } from '../data/bento-itens';
import { GridItem } from '../interfaces/bento-box.interface';

/**
 * Componente responsável por renderizar uma grade de itens.
 */
@Component({
  selector: 'app-bento-box',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bento-box.component.html',
  styleUrls: ['./bento-box.component.scss'],
})
export class BentoBoxComponent {
  /**
   * Dados dos itens da grade.
   * REPRESENTA O ARRAY DE COMPONENTES QUE VIRÁ COMO INPUT
   */
  public data: GridItem[] = data;

  /**
   * Referência ao elemento do container da grade.
   */
  @ViewChild('bento') bento!: ElementRef;

  /**
   * Referência ao elemento do container da grade.
   */
  @ViewChild('bentoContainer') bentoContainer!: ElementRef;

  /**
   * Lista de referências aos elementos dos itens da grade.
   */
  @ViewChildren('bentoItem') bentoItems!: QueryList<ElementRef>;

  /**
   * Sujeito responsável por gerenciar o redimensionamento da janela.
   */
  private resizeSubject = new Subject<void>();

  /**
   * Lista de células vazias da grade.
   */
  private emptyCells: { row: number; col: number }[] = [];

  /**
   * Lista de itens de preenchimento da grade.
   */
  public fillerItens!: GridItem[];

  /**
   * Espaços vazios da grade, agrupados por tamanho.
   */
  emptySpaces: { [key: string]: { row: number; col: number }[] } = {
    '2x2': [],
    '2x1': [],
    '1x2': [],
    '1x1': [],
  };

  /**
   * Grade de booleanos que representa a ocupação das células.
   */
  private grid!: boolean[][];

  /**
   * Número de colunas da grade.
   */
  public currentColumns: number = 0;

  //Variavies de customização---------------------------------

  /**
   * Indica se os itens filler devem ser criados.
   */
  private createFillers: boolean = true;

  /**
   * Tamanho das células da grade.
   */
  public cellSize: number = 160;

  /**
   * Construtor do componente.
   * @param cdr Referência ao ChangeDetectorRef.
   */
  constructor(private cdr: ChangeDetectorRef) {}

  /**
   * Método chamado quando a janela é redimensionada.
   * @param event Evento de redimensionamento.
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.fillerItens = [];
    this.getGrid();
    this.resizeSubject.next();
  }

  /**
   * Método chamado após a inicialização do componente.
   */
  ngAfterViewInit(): void {
    this.resizeSubject.pipe(debounceTime(200)).subscribe(() => {
      this.generateFillerItems();
    });
    this.getGrid();
  }

  /**
   * Obtém a grade de itens e atualiza as variáveis de estado.
   */
  getGrid() {
    const containerWidth = this.bento.nativeElement.offsetWidth;
    const containerHeight = this.bento.nativeElement.offsetHeight;
    const columns = Math.floor(containerWidth / this.cellSize);
    const rows = Math.floor(containerHeight / this.cellSize);

    if (columns !== this.currentColumns) {
      this.fillerItens = [];
      this.fillGrid(columns, rows);
      this.groupEmptyCells();
      this.generateFillerItems();
      this.cdr.markForCheck();

      this.currentColumns = columns;
    }
  }


  /**
   * Preenche a grade com os itens.
   * @param columns Número de colunas da grade.
   * @param rows Número de linhas da grade.
   */
  fillGrid(columns: number, rows: number) {
    this.grid = this.initializeGrid(rows, columns);
    this.bentoItems.forEach((bentoItem: ElementRef) => {
      const rect = bentoItem.nativeElement.getBoundingClientRect();
      const top = rect.top - this.bentoContainer.nativeElement.offsetTop;
      const left = rect.left - this.bentoContainer.nativeElement.offsetLeft;
      const width = rect.width;
      const height = rect.height;

      const rowStart = Math.floor(top / this.cellSize);
      const colStart = Math.floor(left / this.cellSize);
      const rowEnd = Math.ceil((top + height) / this.cellSize);
      const colEnd = Math.ceil((left + width) / this.cellSize);

      for (let row = rowStart; row < rowEnd; row++) {
        for (let col = colStart; col < colEnd; col++) {
          this.grid[row][col] = true;
        }
      }
    });

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
   * Inicializa uma grade bidimensional de booleanos com o tamanho especificado.
   * @param rows Número de linhas da grade.
   * @param columns Número de colunas da grade.
   * @returns A grade inicializada.
   */
  initializeGrid(rows: number, columns: number): boolean[][] {
    const grid: boolean[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: boolean[] = [];
      for (let j = 0; j < columns; j++) {
        row.push(false);
      }
      grid.push(row);
    }
    return grid;
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
        !this.grid[row][col] &&
        !this.grid[row + 1][col] &&
        !occupiedCells[`${row + 1},${col}`]
      ) {
        this.emptySpaces['2x1'].push(cell);
        occupiedCells[key] = true;
        occupiedCells[`${row + 1},${col}`] = true;
      } else if (
        col < this.grid[0].length - 1 &&
        !this.grid[row][col] &&
        !this.grid[row][col + 1] &&
        !occupiedCells[`${row},${col + 1}`]
      ) {
        this.emptySpaces['1x2'].push(cell);
        occupiedCells[key] = true;
        occupiedCells[`${row},${col + 1}`] = true;
      }
      // Check for 1x1
      else {
        this.emptySpaces['1x1'].push(cell);
        occupiedCells[key] = true;
      }
    }
  }

  /**
   * Gera itens 'filler' de preenchimento para a grade com base nas células vazias.
   * DEVE SER SUBSTITUIDA POR UMA LISTA DE ITENS FILLERS QUE SERÃO SORTEADOS PARA CADA ESPAÇO
   */
  generateFillerItems() {
    if (this.createFillers) {
      this.fillerItens = [];
      const shadesOfGray = ['#333333', '#666666', '#999999', '#CCCCCC'];
      const fillerItens: {
        id: number;
        width: number;
        height: number;
        backgroundColor: string;
        colSpan: number;
        rowSpan: number;
        row: number;
        col: number;
      }[] = [];
      let id = this.data.length + 1;

      Object.keys(this.emptySpaces).forEach((size) => {
        const [rowSpan, colSpan] = size.split('x').map(Number);

        this.emptySpaces[size].forEach((cell) => {
          const item = {
            id: id++,
            width: colSpan * this.cellSize,
            height: rowSpan * this.cellSize,
            backgroundColor: shadesOfGray[id % shadesOfGray.length],
            colSpan,
            rowSpan,
            row: cell.row,
            col: cell.col,
          };
          fillerItens.push(item);
        });
      });

      this.fillerItens = fillerItens;
    } else {
      this.fillerItens = [];
    }
  }
}
