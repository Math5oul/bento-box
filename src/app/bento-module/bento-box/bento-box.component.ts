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

  @Output() itemClick = new EventEmitter<GridItem>();
  @Output() itemEdit = new EventEmitter<GridItem>();
  @Output() itemDelete = new EventEmitter<GridItem>();

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
   * ID do item selecionado no modo de edição
   */
  @Input() selectedId: number | null = null;

  /**
   * Item sendo arrastado (drag and drop)
   */
  draggedItem: GridItem | null = null;

  /**
   * Item sobre o qual está sendo arrastado
   */
  dragOverItem: GridItem | null = null;

  /**
   * Posição inicial do touch (para mobile)
   */
  private touchStartX: number = 0;
  private touchStartY: number = 0;

  /**
   * Posição atual do touch
   */
  private touchCurrentX: number = 0;
  private touchCurrentY: number = 0;

  /**
   * Elemento ghost para feedback visual no mobile
   */
  private ghostElement: HTMLElement | null = null;

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
   * Reinicia a grade, limpando os itens e espaços vazios.
   * Isso é útil quando a grade precisa ser recalculada, por exemplo, após uma
   * mudança de tamanho da janela ou atualização dos dados.
   */
  public restartGrid() {
    this.grid = [];
    this.emptyCells = [];
    this.fillersInGrid = [];
  }

  /**
   * Observável de quando a janela é redimensionada.
   * @param event Evento de redimensionamento.
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.restartGrid();

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
      this.windowWidth = this.options.maxWidth !== 0 ? this.options.maxWidth : window.innerWidth;
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
    return Math.max(...this.data.map(item => item.colSpan));
  }

  /**
   * Obtém a grade de itens e atualiza as variáveis de estado.
   */
  calculateGridCols(containerWidth: number) {
    const columns = Math.max(
      Math.min(this.options.maxCols, Math.floor(containerWidth / this.options.cellWidth)),
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
    // Check overflow
    if (row + item.rowSpan > this.grid.length || col + item.colSpan > this.grid[0].length) {
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
    console.log('🔍 putFillerItens - Fillers recebidos:', fillers.length);
    console.log('🔍 Fillers:', fillers);
    console.log('🔍 Espaços vazios:', this.emptySpaces);

    this.fillersInGrid = [];
    const fillerItens: GridItem[] = [];

    // Cria uma cópia dos fillers para não modificar o original
    let availableFillers = [...fillers];

    // Shuffle the fillers array copy
    for (let i = availableFillers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableFillers[i], availableFillers[j]] = [availableFillers[j], availableFillers[i]];
    }

    console.log('🔍 Fillers embaralhados:', availableFillers);

    Object.keys(this.emptySpaces).forEach(size => {
      const [rowSpan, colSpan] = size.split('x').map(Number);
      console.log(`🔍 Procurando fillers para tamanho ${size} (${rowSpan}x${colSpan})`);
      console.log(`🔍 Quantidade de espaços desse tamanho:`, this.emptySpaces[size].length);

      this.emptySpaces[size].forEach(cell => {
        console.log(`🔍 Procurando filler para célula [${cell.row}, ${cell.col}]`);

        // Procura um filler disponível
        const fillerIndex = availableFillers.findIndex(
          filler => filler.colSpan === colSpan && filler.rowSpan === rowSpan
        );

        console.log(`🔍 Filler encontrado no índice: ${fillerIndex}`);

        if (fillerIndex !== -1) {
          // Cria uma cópia do filler com a nova posição
          const filler = {
            ...availableFillers[fillerIndex],
            row: cell.row,
            col: cell.col,
          };

          console.log(`✅ Usando filler:`, filler);
          fillerItens.push(filler);

          // Remove o filler usado da lista de disponíveis
          availableFillers.splice(fillerIndex, 1);
        } else {
          console.log(`❌ Nenhum filler disponível para ${size}`);
        }
      });
    });

    console.log('✅ Total de fillers no grid:', fillerItens.length);
    console.log('✅ Fillers no grid:', fillerItens);

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
    // Adiciona o editMode independente do tipo de componente
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
   * Inicia o drag de um item
   */
  onDragStart(event: DragEvent, item: GridItem): void {
    if (this.options.mode !== 'edit') return;

    this.draggedItem = item;

    // Define o efeito visual do drag
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', ''); // Necessário para Firefox
    }
  }

  /**
   * Permite o drop sobre um item
   */
  onDragOver(event: DragEvent, item: GridItem): void {
    if (this.options.mode !== 'edit' || !this.draggedItem) return;

    event.preventDefault(); // Necessário para permitir o drop

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    this.dragOverItem = item;
  }

  /**
   * Executa a troca de posições quando o item é solto
   */
  onDrop(event: DragEvent, targetItem: GridItem): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.draggedItem || this.draggedItem.id === targetItem.id) {
      return;
    }

    // Encontra os índices dos itens
    const draggedIndex = this.data.findIndex(item => item.id === this.draggedItem!.id);
    const targetIndex = this.data.findIndex(item => item.id === targetItem.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Troca as posições no array
    [this.data[draggedIndex], this.data[targetIndex]] = [
      this.data[targetIndex],
      this.data[draggedIndex],
    ];

    // Notifica que houve mudanças
    this.gridService.emitGridChanged();

    this.dragOverItem = null;
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
  }

  /**
   * Inicia o touch drag (mobile)
   */
  onTouchStart(event: TouchEvent, item: GridItem): void {
    if (this.options.mode !== 'edit') return;

    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.draggedItem = item;

    // Cria elemento ghost para feedback visual
    this.createGhostElement(event.target as HTMLElement, touch.clientX, touch.clientY);
  }

  /**
   * Move o elemento ghost conforme o toque se move
   */
  onTouchMove(event: TouchEvent): void {
    if (!this.draggedItem || this.options.mode !== 'edit') return;

    event.preventDefault(); // Previne scroll durante drag

    const touch = event.touches[0];
    this.touchCurrentX = touch.clientX;
    this.touchCurrentY = touch.clientY;

    // Atualiza posição do ghost
    if (this.ghostElement) {
      this.ghostElement.style.left = `${touch.clientX - 50}px`;
      this.ghostElement.style.top = `${touch.clientY - 50}px`;
    }

    // Detecta sobre qual item está
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
   * Finaliza o touch drag e executa a troca
   */
  onTouchEnd(event: TouchEvent): void {
    if (!this.draggedItem) return;

    // Se tiver um item alvo, executa a troca
    if (this.dragOverItem && this.draggedItem.id !== this.dragOverItem.id) {
      const draggedIndex = this.data.findIndex(item => item.id === this.draggedItem!.id);
      const targetIndex = this.data.findIndex(item => item.id === this.dragOverItem!.id);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        [this.data[draggedIndex], this.data[targetIndex]] = [
          this.data[targetIndex],
          this.data[draggedIndex],
        ];

        this.gridService.emitGridChanged();
      }
    }

    // Limpa estados
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
