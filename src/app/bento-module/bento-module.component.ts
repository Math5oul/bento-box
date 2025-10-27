import {
  Component,
  Input,
  ViewChild,
  ViewChildren,
  QueryList,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
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

  // Mapa de fillers organizados por categoria (cache)
  fillersByCategory = new Map<string, GridItem[]>();

  // Fillers já utilizados (controle para evitar duplicação)
  private usedFillers = new Set<string>();

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

      // Reseta o controle de fillers usados
      this.resetUsedFillers();

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

    // Agrupa produtos
    products.forEach(product => {
      const category = product.inputs?.category || 'other';

      if (!this.productsByCategory.has(category)) {
        this.productsByCategory.set(category, []);
      }

      this.productsByCategory.get(category)!.push(product);
    });

    console.log('✅ Produtos agrupados por categoria:', this.productsByCategory);
    console.log('📦 Fillers disponíveis:', this.fillers.length);
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
   * Retorna apenas os fillers de uma categoria específica
   * Usa cache para evitar recalcular a cada render
   */
  getFillersByCategory(category: string): GridItem[] {
    // Se já existe no cache, retorna
    if (this.fillersByCategory.has(category)) {
      return this.fillersByCategory.get(category)!;
    }

    // Senão, calcula e armazena no cache
    const filtered = this.fillers.filter(filler => {
      const categories = filler.inputs?.categories || [];
      const fillerId = filler.id?.toString() || '';

      // Verifica se o filler pertence a esta categoria E ainda não foi usado
      const belongsToCategory = categories.includes(category);
      const alreadyUsed = this.usedFillers.has(fillerId);

      if (belongsToCategory && !alreadyUsed) {
        console.log(`✅ Filler ${fillerId} adicionado à categoria ${category}`);
        // Marca o filler como usado
        this.usedFillers.add(fillerId);
        return true;
      }

      if (belongsToCategory && alreadyUsed) {
        console.log(`⚠️ Filler ${fillerId} já foi usado em outra categoria, pulando...`);
      }

      return false;
    });

    console.log(`📊 Categoria "${category}": ${filtered.length} filler(s) disponível(is)`);

    // Armazena no cache
    this.fillersByCategory.set(category, filtered);

    return filtered;
  }

  /**
   * Reseta o controle de fillers usados
   * Útil ao recarregar os dados
   */
  private resetUsedFillers(): void {
    this.usedFillers.clear();
    this.fillersByCategory.clear(); // Limpa o cache também
    console.log('🔄 Controle de fillers usados resetado');
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
    console.log('🔄 Convertendo fillers do MongoDB para GridItems...');

    return fillers.map(filler => {
      console.log('📦 Convertendo filler:', filler._id);
      console.log('  - Categorias no DB:', filler.categories);

      // Determina o componente baseado no tipo
      let component: any = SimpleTextComponent;
      const inputs: any = {};

      if (filler.type === 'text') {
        component = SimpleTextComponent;
        inputs.text = filler.content.text || '';
        inputs.background = filler.content.backgroundColor || '#ffffff'; // Mapeia backgroundColor para background
      } else if (filler.type === 'image') {
        component = SimpleImageComponent;
        inputs.url = filler.content.url || '';
        inputs.alt = filler.content.alt || '';
      } else if (filler.type === 'video') {
        component = SimpleVideoComponent;
        inputs.videoUrl = filler.content.url || '';
        inputs.autoplay = filler.content.autoplay !== undefined ? filler.content.autoplay : false;
        inputs.controls = filler.content.controls !== undefined ? filler.content.controls : true;
        inputs.loop = filler.content.loop !== undefined ? filler.content.loop : false;
      }

      inputs.format = filler.format || '1x1';
      inputs.formats = filler.formats || ['1x1']; // Formatos válidos
      inputs.categories = filler.categories || []; // Adiciona as categorias aos inputs

      console.log('  - Categorias em inputs:', inputs.categories);

      const gridItem = {
        id: filler._id,
        component: component,
        inputs: inputs,
        row: filler.gridPosition?.row || 0,
        col: filler.gridPosition?.col || 0,
        rowSpan: filler.gridPosition?.rowSpan || 1,
        colSpan: filler.gridPosition?.colSpan || 1,
      };

      console.log('  ✅ GridItem criado:', gridItem);

      return gridItem;
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
   * Reagrupa os produtos por categoria e atualiza a view
   * Chamado externamente quando itens são editados/adicionados/removidos
   */
  public refreshProductGroups(): void {
    console.log('🔄 Reagrupando produtos por categoria...');
    this.groupProductsByCategory(this.data);
    // NÃO reseta os fillers usados aqui - eles devem permanecer nos mesmos lugares
    this.cdr.detectChanges();
    console.log('✅ Produtos reagrupados e view atualizada');
  }

  /**
   * Recarrega todos os dados do servidor
   * Chamado quando a edição é cancelada para garantir estado consistente
   */
  public reloadAllData(): void {
    console.log('🔄 Recarregando todos os dados do servidor...');

    // Cancela subscriptions anteriores se existirem
    if (this.productsSub) {
      this.productsSub.unsubscribe();
    }

    // Recarrega produtos e fillers
    this.productsSub = forkJoin({
      products: this.storageService.getProducts().pipe(take(1)),
      fillers: this.fillerService.getFillers(),
    }).subscribe(({ products, fillers }) => {
      console.log('📦 Produtos recarregados:', products.length);
      console.log('📦 Fillers recarregados:', fillers.length);

      // Converte Fillers para GridItems
      const fillerGridItems = this.convertFillersToGridItems(fillers);

      // Reseta o controle de fillers usados
      this.resetUsedFillers();

      // Atualiza todos os dados
      this.data = products;
      this.fillers = fillerGridItems;
      this.allProducts = [...products];

      // Agrupa produtos por categoria
      this.groupProductsByCategory(products);

      // Trigger change detection
      this.cdr.detectChanges();

      console.log('✅ Dados recarregados com sucesso!');
    });
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
      // Reseta os fillers usados ao voltar para o modo categorizado
      this.resetUsedFillers();
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
