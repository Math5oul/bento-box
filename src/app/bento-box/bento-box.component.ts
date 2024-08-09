import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms'; //
import { Subject } from 'rxjs';
import { data } from '../data/bento-itens';
import { GridItem } from '../interfaces/bento-box.interface';

/**
 * Componente responsável por renderizar uma grade de itens.
 */
@Component({
  selector: 'app-bento-box',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule ],
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
  public fillerItens!: GridItem[];

  /**
   * Espaços vazios da grade, agrupados por tamanho.
   */
  emptySpaces!: { [key: string]: { row: number; col: number }[] };

  /**
   * Numéro atual de colunas
   */
  currentCols!: number;

  /**
   * Referência ao elemento do container da grade.
   */
  @ViewChild('bento') bento!: ElementRef;

  /**
   * Referência ao elemento de item da grade.
   */
  @ViewChild('bentoItem') bentoItem!: ElementRef


  /**
   * Habilitador do drag
   */
  private dragEnabled: boolean = false;

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
    this.fillerItens = [];

    this.resizeSubject.next();
  }

  /**
   * Modo do grid - 'autoFill' ou 'drag'
   */
  public mode: 'autoFill' | 'drag' = 'autoFill';

  //Variavies de customização---------------------------------
  /**
   * Indica se os itens filler devem ser criados.
   */
  public createFillers: boolean = true;

  /**
   * Tamanho das células da grade.
   */
  public cellSize: number = 160;

  /**
   * Número máximo de colunas
   */
  public maxCols: number = 9;

  /**
   * Largura máxima do Bento
   */
  maxWidth: number = 0;

  /**
   * Exibe a barra de edição do grid
   */
  public editMode: boolean = true;

  /**
   * Construtor do componente.
   * @param cdr Referência ao ChangeDetectorRef.
   */
  constructor(private cdr: ChangeDetectorRef) {
    this.resizeSubject.subscribe(() => {
      this.windowWidth = this.bento.nativeElement.offsetWidth;
      this.calculateGridCols(this.windowWidth);
    });
  }

  private windowWidth!: number;

  ngOnInit(): void {
    console.log(window.innerWidth)
    this.currentCols = this.maxCols;
    this.windowWidth = this.maxWidth !== 0 ? this.maxWidth : window.innerWidth;
    this.calculateGridCols(this.windowWidth);
  }

  /**
   * Handler dos modos
   */
  switchMode() {
    this.mode = this.mode === 'autoFill' ? 'drag' : 'autoFill';
    this.dragEnabled = this.mode === 'drag';
    this.calculateGridCols(this.windowWidth);
  }

  onDrag(event : CdkDragDrop<any[]>){
    console.log(event);
  }

  isItemOverlapping(item1: GridItem, item2: GridItem): boolean {
    if (item1 === item2) return false;

    const item1Left = item1.col;
    const item1Right = item1.col + item1.colSpan;
    const item1Top = item1.row;
    const item1Bottom = item1.row + item1.rowSpan;

    const item2Left = item2.col;
    const item2Right = item2.col + item2.colSpan;
    const item2Top = item2.row;
    const item2Bottom = item2.row + item2.rowSpan;

    return (
      item1Left < item2Right &&
      item1Right > item2Left &&
      item1Top < item2Bottom &&
      item1Bottom > item2Top
    );
  }

  /**
   * Pega a largura minima para acomodar o grid
   * @returns o comprimento do maior item para o grid
   */
  getMinWidth(): number {
    return Math.max(...this.data.map((item) => item.colSpan));
  }

  /**
   * Cuida das customizações em run time
   */
  onCustomChange() {
    this.calculateGridCols(this.windowWidth);
  }

  /**
   * Empurra um novo item para o grid
   */
  createNewItem() {
    const colSpanInput = prompt('Largura do novo item:', '1');
    const rowSpanInput = prompt('Altura do novo item:', '1');

    if (colSpanInput !== null && rowSpanInput !== null) {
      const colSpan = parseInt(colSpanInput, 10);
      const rowSpan = parseInt(rowSpanInput, 10);

      if (!isNaN(colSpan) && !isNaN(rowSpan)) {

        const colorOptions = [
          '#FF5733', // Bright Orange
          '#33FF57', // Lime Green
          '#3357FF', // Royal Blue
          '#FF33A6', // Hot Pink
          '#FFC300', // Golden Yellow
          '#900C3F', // Burgundy
          '#581845', // Dark Purple
          '#DAF7A6', // Light Green
          '#C70039', // Red
          '#1F618D', // Navy Blue
          '#F39C12', // Orange
          '#2ECC71'  // Emerald Green
        ];
        const backgroundColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];

        const newItem: GridItem = {
          id: this.data.length + 1,
          backgroundColor,
          colSpan,
          rowSpan,
          row: 0,
          col: 0,
        };
        this.data.push(newItem);
      }
    }
    this.calculateGridCols(this.windowWidth);
  }


  /**
   * Obtém a grade de itens e atualiza as variáveis de estado.
   */
  calculateGridCols(containerWidth: number) {


    const columns = Math.max(
      Math.min(this.maxCols, Math.floor(containerWidth / this.cellSize)),
      this.getMinWidth()
    );
    //Calcula o número de colunas a serem exibidas,
    //garantindo que seja entre o menor valor e o maior valor de colunas
    //com base na largura do contêiner e no tamanho da célula.

  if (this.mode !== "drag"){
    this.currentCols = columns;
    this.initializeGrid(10, columns);
    this.fillGrid(columns);
    this.removeEmptyRows();
  }

    if (this.createFillers && this.mode !== 'drag') {
      this.getEmptyCells(this.grid.length, columns);
      this.groupEmptyCells();
      this.generateFillerItems();
    } else {
      this.fillerItens = [];
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

  /**
   * Remove as linhas não usadas do grid
   */
  removeEmptyRows() {
    this.grid = this.grid.filter((row) => {
      return row.some((cell) => cell === true);
    });
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
   * Gera itens 'filler' de preenchimento para a grade com base nas células vazias.
   * DEVE SER SUBSTITUIDA POR UMA LISTA DE ITENS FILLERS QUE SERÃO SORTEADOS PARA CADA ESPAÇO
   */
  generateFillerItems() {
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
  }
}
