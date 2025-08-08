import { Component, Input, ViewChild } from '@angular/core';
import { dataExamples } from '../data/bento-itens-example';
import { fillerExamples } from '../data/filler-itens';
import { GridItem } from '../interfaces/bento-box.interface';
import { BentoOptions } from '../interfaces/bento-options.interface';
import { BentoBoxComponent } from './bento-box/bento-box.component';
import { BentoToolbarComponent } from './bento-toolbar/bento-toolbar.component';
import { CartService } from '../services/cart-service/cart.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
@Component({
  selector: 'app-bento-module',
  standalone: true,
  imports: [
    BentoBoxComponent,
    BentoToolbarComponent,
    HeaderComponent,
    CommonModule,
  ],
  templateUrl: './bento-module.component.html',
  styleUrl: './bento-module.component.scss',
})
export class BentoModuleComponent {
  /**
   * Dados originais dos itens do grid
   * @defaultValue `dataExamples`
   */
  @Input() originalData: GridItem[] = dataExamples;

  /** Dados atuais a serem exibidos no grid (podem ser filtrados) */
  data = [...this.originalData];

  /**
   * Itens de preenchimento opcionais para o grid
   * @defaultValue `fillerExamples`
   */
  @Input() fillers?: GridItem[] = fillerExamples;

  /**
   * Indica se a barra de ferramentas deve ser exibida
   * @defaultValue true
   */
  @Input() toolbar: boolean = true;

  /**
   * Opções de configuração do layout Bento
   * @defaultValue Configurações padrão do Bento
   */
  @Input() options: BentoOptions = {
    createFillers: true,
    cellWidth: 160,
    cellHeight: 180,
    gridGap: 8,
    maxCols: 5,
    maxWidth: 0,
    mode: 'autoFill',
  };

  /** Referência ao componente BentoBox para chamar métodos públicos */
  @ViewChild(BentoBoxComponent) bentoBoxComponent!: BentoBoxComponent;

  /** Item atualmente selecionado no grid */
  public selectedItem!: GridItem;

  /** Termo de pesquisa atual para filtragem */
  private currentSearchTerm = '';

  /**
   * @param _cartService Serviço de carrinho (dependência injetada)
   */
  constructor(public _cartService: CartService) {}

  /**
   * Inicializa o componente. Verifica se há itens de preenchimento
   * e desativa a criação de fillers se não houver.
   */
  ngOnInit(): void {
    if (this.fillers?.length === 0) {
      this.options.createFillers = false;
    }
  }

  /**
   * Manipula a mudança de item selecionado
   * @param event O novo item selecionado
   */
  onSelectedItemChange(event: any) {
    this.selectedItem = event;
  }

  /**
   * Filtra os itens com base no termo de pesquisa fornecido
   * @param searchText Texto de pesquisa para filtrar os itens
   */
  onSearch(searchText: string) {
    this.currentSearchTerm = searchText.toLowerCase().trim();
    this.applyFilter();
  }

  /**
   * Aplica o filtro atual aos dados originais, atualizando a lista de dados exibidos
   * @private
   */
  private applyFilter() {
    if (!this.currentSearchTerm) {
      this.data = [...this.originalData];
    } else {
      this.data = this.originalData.filter((item) => {
        const name = item.inputs?.productName?.toLowerCase() || '';
        const description = item.inputs?.description?.toLowerCase() || '';
        return (
          name.includes(this.currentSearchTerm) ||
          description.includes(this.currentSearchTerm)
        );
      });
    }
  }

  /**
   * Adiciona um novo item ao grid
   * @param newItem Novo item a ser adicionado
   */
  onAddItem(newItem: GridItem) {
    newItem.id =
      this.originalData.length > 0
        ? Math.max(...this.originalData.map((item) => item.id)) + 1
        : 1;

    this.originalData.push(newItem);
    this.applyFilter();

    if (this.bentoBoxComponent) {
      this.bentoBoxComponent.recalculateGrid();
    }
  }

  /**
   * Remove um item do grid
   * @param itemToDelete Item a ser removido
   */
  onDeleteItem(itemToDelete: GridItem) {
    const index = this.originalData.findIndex(
      (item) => item.id === itemToDelete.id
    );
    if (index !== -1) {
      this.originalData.splice(index, 1);
      this.applyFilter();
    }

    if (this.bentoBoxComponent) {
      this.bentoBoxComponent.recalculateGrid();
    }
  }

  /**
   * Move um item para esquerda ou direita na lista de itens
   * @param event Contém o item a ser movido e a direção ('left' ou 'right')
   */
  onMoveItem(event: { item: GridItem; direction: 'left' | 'right' }) {
    const { item, direction } = event;
    const index = this.originalData.findIndex((i) => i.id === item.id);

    if (direction === 'left' && index > 0) {
      [this.originalData[index - 1], this.originalData[index]] = [
        this.originalData[index],
        this.originalData[index - 1],
      ];
    } else if (direction === 'right' && index < this.originalData.length - 1) {
      [this.originalData[index], this.originalData[index + 1]] = [
        this.originalData[index + 1],
        this.originalData[index],
      ];
    }

    this.applyFilter();

    if (this.bentoBoxComponent) {
      this.bentoBoxComponent.recalculateGrid();
    }
  }
}
