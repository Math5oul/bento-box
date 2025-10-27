import {
  Component,
  Input,
  ViewChild,
  ViewChildren,
  QueryList,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
// import { dataExamples } from '../data/bento-itens-example';
import { GridItem } from '../interfaces/bento-box.interface';
import { BentoOptions } from '../interfaces/bento-options.interface';
import { BentoBoxComponent } from './bento-box/bento-box.component';
import { BentoToolbarComponent } from './bento-toolbar/bento-toolbar.component';
import { CartService } from '../services/cart-service/cart.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { StorageService } from '../services/storage-service/storage.service';
import { FillerService } from '../services/filler-service/filler.service';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { SimpleTextComponent } from '../components/simpleComponents/simple-text/simple-text.component';
import { SimpleImageComponent } from '../components/simpleComponents/simple-image/simple-image.component';
import { SimpleVideoComponent } from '../components/simpleComponents/simple-video/simple-video.component';

@Component({
  selector: 'app-bento-module',
  standalone: true,
  imports: [BentoBoxComponent, BentoToolbarComponent, HeaderComponent, CommonModule],
  templateUrl: './bento-module.component.html',
  styleUrl: './bento-module.component.scss',
})
export class BentoModuleComponent implements OnDestroy {
  data: GridItem[] = [];
  fillers: GridItem[] = []; // Será preenchido com Fillers do MongoDB

  // Mapa de produtos organizados por categoria
  productsByCategory = new Map<string, GridItem[]>();

  // Produtos filtrados pela pesquisa (quando houver pesquisa ativa)
  filteredProducts: GridItem[] = [];

  // Flag para indicar se há uma pesquisa ativa
  isSearchActive: boolean = false;

  // Ordem de exibição das categorias
  categoryOrder: string[] = [
    'food',
    'hot beverage',
    'cold beverage',
    'dessert',
    'alcoholic',
    'beverage',
    'other',
  ];

  // Mapa de nomes traduzidos das categorias
  categoryNames: { [key: string]: string } = {
    food: 'Pratos',
    'hot beverage': 'Bebidas Quentes',
    'cold beverage': 'Bebidas Frias',
    dessert: 'Sobremesas',
    alcoholic: 'Bebidas Alcoólicas',
    beverage: 'Bebidas',
    other: 'Outros',
  };

  // Ícones para cada categoria
  categoryIcons: { [key: string]: string } = {
    food: '🥐',
    'hot beverage': '☕',
    'cold beverage': '🥤',
    dessert: '🍰',
    alcoholic: '🍺',
    beverage: '🍹',
    other: '📦',
  };

  @Input() toolbar: boolean = true;
  @Input() options: BentoOptions = {
    createFillers: true,
    cellWidth: 160,
    cellHeight: 180,
    gridGap: 8,
    maxCols: 5,
    maxWidth: 0,
    mode: 'autoFill',
  };

  @ViewChild(BentoBoxComponent) bentoBoxComponent!: BentoBoxComponent;
  @ViewChildren(BentoBoxComponent) bentoBoxComponents!: QueryList<BentoBoxComponent>;
  @ViewChild(BentoToolbarComponent) bentoToolbarComponent!: BentoToolbarComponent;

  private _selectedItem: GridItem | null = null;
  private productsSub?: Subscription;
  private searchSub?: Subscription;
  private allProducts: GridItem[] = [];
  private searchSubject = new Subject<string>();

  get selectedItem(): GridItem | null {
    return this._selectedItem;
  }

  set selectedItem(value: GridItem | null) {
    this._selectedItem = value;
  }

  constructor(
    public _cartService: CartService,
    private storageService: StorageService,
    private fillerService: FillerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load products and fillers in parallel
    this.productsSub = forkJoin({
      products: this.storageService.getProducts().pipe(take(1)),
      fillers: this.fillerService.getFillers(),
    }).subscribe(({ products, fillers }) => {
      console.log('📦 Produtos carregados:', products.length);
      console.log('📦 Fillers carregados do MongoDB:', fillers.length);

      // Converte Fillers para GridItems
      const fillerGridItems = this.convertFillersToGridItems(fillers);

      // Guarda todos os produtos
      this.data = products;
      this.fillers = fillerGridItems;
      this.allProducts = [...products];

      // Agrupa produtos por categoria
      this.groupProductsByCategory(products);

      console.log('✅ Produtos agrupados por categoria:', this.productsByCategory);
    });

    // Set up search subscription with debouncing
    this.searchSub = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(searchTerm => {
        this.filterProducts(searchTerm);
      });

    if (this.fillers?.length === 0) {
      this.options.createFillers = false;
    }
  }

  /**
   * Agrupa produtos por categoria
   */
  private groupProductsByCategory(products: GridItem[]): void {
    this.productsByCategory.clear();

    products.forEach(product => {
      const category = product.inputs?.category || 'other';

      if (!this.productsByCategory.has(category)) {
        this.productsByCategory.set(category, []);
      }

      this.productsByCategory.get(category)!.push(product);
    });
  }

  /**
   * Retorna as categorias na ordem definida, filtrando apenas as que existem
   */
  get orderedCategories(): string[] {
    const availableCategories = Array.from(this.productsByCategory.keys());
    return this.categoryOrder.filter(cat => availableCategories.includes(cat));
  }

  /**
   * Retorna os produtos de uma categoria específica
   */
  getProductsByCategory(category: string): GridItem[] {
    return this.productsByCategory.get(category) || [];
  }

  /**
   * Retorna o nome traduzido de uma categoria
   */
  getCategoryName(category: string): string {
    return this.categoryNames[category] || category;
  }

  /**
   * Retorna o ícone de uma categoria
   */
  getCategoryIcon(category: string): string {
    return this.categoryIcons[category] || '📦';
  }

  /**
   * Converte Fillers do banco para GridItems
   */
  private convertFillersToGridItems(fillers: any[]): GridItem[] {
    return fillers.map(filler => {
      // Determina o componente baseado no tipo
      let component: any = SimpleTextComponent;
      const inputs: any = {};

      if (filler.type === 'text') {
        component = SimpleTextComponent;
        inputs.text = filler.content.text || '';
      } else if (filler.type === 'image') {
        component = SimpleImageComponent;
        inputs.url = filler.content.url || '';
        inputs.alt = filler.content.alt || '';
      } else if (filler.type === 'video') {
        component = SimpleVideoComponent;
        inputs.url = filler.content.url || '';
      }

      inputs.format = filler.format || '1x1';

      return {
        id: filler._id,
        component: component,
        inputs: inputs,
        row: filler.gridPosition?.row || 0,
        col: filler.gridPosition?.col || 0,
        rowSpan: filler.gridPosition?.rowSpan || 1,
        colSpan: filler.gridPosition?.colSpan || 1,
      };
    });
  }

  ngOnDestroy(): void {
    if (this.productsSub) {
      this.productsSub.unsubscribe();
    }
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
    this.searchSubject.complete();
  }

  onItemClick(item: GridItem) {
    this._selectedItem = item;
  }

  /**
   * Seleciona o item e scrolla até o toolbar para edição
   */
  onItemEdit(item: GridItem) {
    this._selectedItem = item;

    // Abre o modal de edição
    if (this.bentoToolbarComponent) {
      this.bentoToolbarComponent.openEditItemModal(item);
    }
  }

  /**
   * Deleta o item diretamente
   */
  onItemDelete(item: GridItem) {
    this._selectedItem = item;

    if (this.bentoToolbarComponent) {
      this.bentoToolbarComponent.removeItem();
    }
  }

  /**
   * Filtra os itens com base no nome do produto ou na descrição.
   * @param searchText Texto de pesquisa para filtrar os itens.
   */
  onSearch(searchText: string) {
    this.searchSubject.next(searchText);
  }

  /**
   * Filtra os produtos em cache com base no termo de pesquisa.
   * @param searchText Termo de pesquisa
   */
  private filterProducts(searchText: string): void {
    const term = searchText.toLowerCase().trim();

    if (!term) {
      // Sem pesquisa: volta ao modo categorizado
      this.isSearchActive = false;
      this.filteredProducts = [];
      this.data = this.allProducts;
      this.groupProductsByCategory(this.allProducts);
    } else {
      // Com pesquisa: mostra todos em um único grid
      this.isSearchActive = true;
      const filtered = this.allProducts.filter((item: GridItem) => {
        const name = item.inputs?.productName?.toLowerCase() || '';
        const description = item.inputs?.description?.toLowerCase() || '';
        return name.includes(term) || description.includes(term);
      });

      this.filteredProducts = filtered;
      this.data = filtered;
    }

    // Trigger grid recalculation deterministically
    this.cdr.detectChanges();

    // Recalcula o grid após a mudança
    setTimeout(() => {
      this.bentoBoxComponents?.forEach(box => {
        box.recalculateGrid();
      });
    }, 0);
  }
}
