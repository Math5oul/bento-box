import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { GridItem } from './bento-box.interface';

@Component({
  selector: 'app-bento-box',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bento-box.component.html',
  styleUrls: ['./bento-box.component.scss'],
})
export class BentoBoxComponent implements AfterViewInit {
  @ViewChild('bentoContainer') bentoContainer!: ElementRef;
  @ViewChildren('bentoItem') bentoItems!: QueryList<ElementRef>;

  public data!: GridItem[];
  emptyCells: { row: number; col: number }[] = [];
  public fillerItens!: GridItem[];

  emptySpaces: { [key: string]: { row: number; col: number }[] } = {
    '2x2': [],
    '2x1': [],
    '1x2': [],
    '1x1': [],
  };

  private grid!: boolean[][];
  private cellSize: number = 160;
  private currentColumns: number = 0;
  private currentRows: number = 0;


  constructor(private cdr: ChangeDetectorRef) {
    this.generateData();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.getGrid();
    this.cdr.detectChanges();
  }

  ngAfterViewInit() {
    this.getGrid();
  }

  getGrid() {
    const containerWidth = this.bentoContainer.nativeElement.offsetWidth;
    const containerHeight = this.bentoContainer.nativeElement.offsetHeight;
    const columns = Math.floor(containerWidth / this.cellSize);
    const rows = Math.floor(containerHeight / this.cellSize);

    if (columns !== this.currentColumns || rows !== this.currentRows ) {
      this.fillerItens=[];
      this.fillGrid(columns, rows);
      this.groupEmptyCells();
      this.generateFillerItems();
      this.cdr.markForCheck();

      this.currentColumns = columns;
      this.currentRows = rows;
    }
  }

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

  generateData() {
    this.data = [
      {
        id: 1,
        width: 320,
        height: 320,
        backgroundColor: '#33FF57',
        colSpan: 2,
        rowSpan: 2,
        row: 0,
        col: 0,
      },
      {
        id: 2,
        width: 160,
        height: 160,
        backgroundColor: '#3357FF',
        colSpan: 1,
        rowSpan: 1,
        row: 0,
        col: 0,
      },
      {
        id: 3,
        width: 320,
        height: 160,
        backgroundColor: '#FF33A1',
        colSpan: 2,
        rowSpan: 1,
        row: 0,
        col: 0,
      },
      {
        id: 4,
        width: 160,
        height: 160,
        backgroundColor: '#A133FF',
        colSpan: 1,
        rowSpan: 1,
        row: 0,
        col: 0,
      },
      {
        id: 5,
        width: 160,
        height: 160,
        backgroundColor: '#33FFF5',
        colSpan: 1,
        rowSpan: 1,
        row: 0,
        col: 0,
      },
      {
        id: 6,
        width: 160,
        height: 320,
        backgroundColor: '#FF5733',
        colSpan: 1,
        rowSpan: 2,
        row: 0,
        col: 0,
      },
      {
        id: 7,
        width: 160,
        height: 160,
        backgroundColor: '#33FF57',
        colSpan: 1,
        rowSpan: 1,
        row: 0,
        col: 0,
      },
      {
        id: 8,
        width: 160,
        height: 160,
        backgroundColor: '#3357FF',
        colSpan: 1,
        rowSpan: 1,
        row: 0,
        col: 0,
      },
      {
        id: 9,
        width: 160,
        height: 160,
        backgroundColor: '#FF33A1',
        colSpan: 1,
        rowSpan: 1,
        row: 0,
        col: 0,
      },
      {
        id: 10,
        width: 160,
        height: 160,
        backgroundColor: '#A133FF',
        colSpan: 1,
        rowSpan: 1,
        row: 0,
        col: 0,
      },
      {
        id: 11,
        width: 160,
        height: 160,
        backgroundColor: '#33FFF5',
        colSpan: 1,
        rowSpan: 1,
        row: 0,
        col: 0,
      },
      {
        id: 12,
        width: 320,
        height: 160,
        backgroundColor: '#FF5733',
        colSpan: 2,
        rowSpan: 1,
        row: 0,
        col: 0,
      },
      {
        id: 13,
        width: 160,
        height: 320,
        backgroundColor: '#33FF57',
        colSpan: 1,
        rowSpan: 2,
        row: 0,
        col: 0,
      },
      {
        id: 14,
        width: 160,
        height: 160,
        backgroundColor: '#FF5733',
        colSpan: 1,
        rowSpan: 1,
        row: 0,
        col: 0,
      },
      {
        id: 15,
        width: 320,
        height: 320,
        backgroundColor: '#3357FF',
        colSpan: 2,
        rowSpan: 2,
        row: 0,
        col: 0,
      },
      {
        id: 16,
        width: 320,
        height: 160,
        backgroundColor: '#FF33A1',
        colSpan: 2,
        rowSpan: 1,
        row: 0,
        col: 0,
      },
    ];
  }

  groupEmptyCells() {
    this.emptySpaces = {}
    const groupedCells: { [key: string]: { row: number; col: number }[] } = {
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

      // Check for 2x2
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
        groupedCells['2x2'].push(cell);
        occupiedCells[key] = true;
        occupiedCells[`${row},${col + 1}`] = true;
        occupiedCells[`${row + 1},${col}`] = true;
        occupiedCells[`${row + 1},${col + 1}`] = true;
      }
      // Check for 2x1
      else if (
        row < this.grid.length - 1 &&
        !this.grid[row][col] &&
        !this.grid[row + 1][col] &&
        !occupiedCells[`${row + 1},${col}`]
      ) {
        groupedCells['2x1'].push(cell);
        occupiedCells[key] = true;
        occupiedCells[`${row + 1},${col}`] = true;
      }
      // Check for 1x2
      else if (
        col < this.grid[0].length - 1 &&
        !this.grid[row][col] &&
        !this.grid[row][col + 1] &&
        !occupiedCells[`${row},${col + 1}`]
      ) {
        groupedCells['1x2'].push(cell);
        occupiedCells[key] = true;
        occupiedCells[`${row},${col + 1}`] = true;
      }
      // Check for 1x1
      else {
        groupedCells['1x1'].push(cell);
        occupiedCells[key] = true;
      }
    }

    this.emptySpaces = groupedCells;
  }

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
