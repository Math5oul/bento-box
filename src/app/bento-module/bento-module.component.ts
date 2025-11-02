import {
  Component,
  Input,
  ViewChild,
  ViewChildren,
  QueryList,
  OnDestroy,
  OnInit,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GridItem } from '../interfaces/bento-box.interface';
import { BentoOptions } from '../interfaces/bento-options.interface';
import { BentoBoxComponent } from './bento-box/bento-box.component';
import { BentoToolbarComponent } from './bento-toolbar/bento-toolbar.component';
import { CartService } from '../services/cart-service/cart.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { StorageService } from '../services/storage-service/storage.service';
import { FillerService } from '../services/filler-service/filler.service';
import { AuthService } from '../services/auth-service/auth.service';
import { TableService } from '../services/table-service/table.service';
import { CategoryService } from '../services/category-service/category.service';
import { Category } from '../interfaces/category.interface';
import { Subject, Subscription, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, take } from 'rxjs/operators';
import { SimpleTextComponent } from '../components/simpleComponents/simple-text/simple-text.component';
import { SimpleImageComponent } from '../components/simpleComponents/simple-image/simple-image.component';
import { SimpleVideoComponent } from '../components/simpleComponents/simple-video/simple-video.component';
import { FooterComponent } from '../components/footer/footer.component';

@Component({
  selector: 'app-bento-module',
  standalone: true,
  imports: [
    BentoBoxComponent,
    BentoToolbarComponent,
    HeaderComponent,
    FooterComponent,
    CommonModule,
  ],
  templateUrl: './bento-module.component.html',
  styleUrl: './bento-module.component.scss',
})
export class BentoModuleComponent implements OnDestroy, OnInit {
  data: GridItem[] = [];
  fillers: GridItem[] = [];

  // Categorias dinâmicas do CategoryService
  categories: Category[] = [];

  // Mapa de produtos organizados por categoria
  productsByCategory = new Map<string, GridItem[]>();

  // Mapa de fillers organizados por categoria
  fillersByCategory = new Map<string, GridItem[]>();

  // Produtos filtrados pela pesquisa (quando houver pesquisa ativa)
  filteredProducts: GridItem[] = [];

  // Flag para indicar se há uma pesquisa ativa
  isSearchActive: boolean = false;

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
  private routeSub?: Subscription;
  private allProducts: GridItem[] = [];
  private searchSubject = new Subject<string>();
  private isJoining = false; // Indica se está no processo de join via QR Code

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
    private authService: AuthService,
    private tableService: TableService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get userRole(): string | undefined {
    const user = this.authService.getCurrentUser();
    return user?.role;
  }

  ngOnInit(): void {
    // Verifica se está acessando via QR Code (rota /table/:tableId/join)
    // Chamamos joinTable apenas no browser (evita SSR e chamadas duplicadas)
    if (isPlatformBrowser(this.platformId)) {
      this.routeSub = this.route.params.subscribe(params => {
        const tableId = params['tableId'];

        if (tableId && !this.isJoining) {
          // Está acessando via /table/:tableId/join
          this.isJoining = true;
          this.joinTable(tableId);
        } else if (!tableId && this.isJoining) {
          // Navegou de volta para / após o join - recarrega dados
          this.isJoining = false;
          setTimeout(() => {
            this.loadInitialData();
          }, 100);
        } else if (!tableId && !this.isJoining) {
          // Acesso normal à home
          this.loadInitialData();
        }
      });
    } else {
      // SSR - carrega dados normalmente
      this.loadInitialData();
    }

    this.searchSub = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(searchTerm => {
        this.filterProducts(searchTerm);
      });
  }

  /**
   * Carrega dados iniciais (produtos, fillers, categorias)
   */
  private loadInitialData(): void {
    this.productsSub = forkJoin({
      products: this.storageService.getProducts().pipe(take(1)),
      fillers: this.fillerService.getFillers().pipe(take(1)),
      categories: this.categoryService.getCategories().pipe(take(1)),
    }).subscribe(({ products, fillers, categories }) => {
      const fillerGridItems = this.convertFillersToGridItems(fillers);

      this.resetFillerCache();

      this.data = products;
      this.fillers = fillerGridItems;
      this.allProducts = [...products];

      // Define categorias primeiro
      if (categories.success) {
        this.categories = categories.data;
      }

      this.groupProductsByCategory(products);
      this.recalculateAllGrids();
      this.cdr.detectChanges();
    });
  }

  /**
   * Agrupa produtos por categoria para exibição organizada
   */
  private groupProductsByCategory(products: GridItem[]): void {
    this.productsByCategory.clear();
    this.fillersByCategory.clear();

    products.forEach(product => {
      const category = product.inputs?.category || 'other';

      if (!this.productsByCategory.has(category)) {
        this.productsByCategory.set(category, []);
      }

      this.productsByCategory.get(category)!.push(product);
    });

    // Pré-distribui fillers entre categorias respeitando a ordem
    this.distributeFillersByCategory();
  }

  /**
   * Distribui fillers entre categorias - fillers podem aparecer em múltiplas categorias
   */
  private distributeFillersByCategory(): void {
    this.fillersByCategory.clear();

    // Processa categorias na ordem definida
    this.orderedCategories.forEach(category => {
      const categoryFillers = this.fillers.filter(filler => {
        const categories = filler.inputs?.categories || [];
        return categories.includes(category);
      });

      // IMPORTANTE: Cria uma NOVA referência do array para disparar ngOnChanges
      this.fillersByCategory.set(category, [...categoryFillers]);
    });
  }

  get orderedCategories(): string[] {
    const availableCategories = Array.from(this.productsByCategory.keys());
    // Ordena pelas categorias cadastradas no CategoryService
    const categoryOrder = this.categories.map(c => c.slug);
    return categoryOrder.filter(cat => availableCategories.includes(cat));
  }

  getProductsByCategory(category: string): GridItem[] {
    return this.productsByCategory.get(category) || [];
  }

  /**
   * Retorna fillers pré-distribuídos para a categoria
   */
  getFillersByCategory(category: string): GridItem[] {
    return this.fillersByCategory.get(category) || [];
  }

  private resetFillerCache(): void {
    this.fillersByCategory.clear();
  }

  getCategoryName(category: string): string {
    const cat = this.categories.find(c => c.slug === category);
    return cat ? cat.name : category;
  }

  getCategoryIcon(category: string): string {
    const cat = this.categories.find(c => c.slug === category);
    return cat ? cat.emoji : '📦';
  }

  /**
   * Converte fillers do MongoDB para o formato GridItem usado pelo componente
   */
  private convertFillersToGridItems(fillers: any[]): GridItem[] {
    return fillers.map(filler => {
      let component: any = SimpleTextComponent;
      const inputs: any = {};

      if (filler.type === 'text') {
        component = SimpleTextComponent;
        inputs.text = filler.content.text || '';
        inputs.background = filler.content.backgroundColor || '#ffffff';
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
      inputs.formats = filler.formats || ['1x1'];
      inputs.categories = filler.categories || [];

      const gridItem = {
        id: filler._id,
        component: component,
        inputs: inputs,
        row: filler.gridPosition?.row || 0,
        col: filler.gridPosition?.col || 0,
        rowSpan: filler.gridPosition?.rowSpan || 1,
        colSpan: filler.gridPosition?.colSpan || 1,
      };

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
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
    this.searchSubject.complete();
  }

  onItemClick(item: GridItem) {
    this._selectedItem = item;
  }

  onItemEdit(item: GridItem) {
    this._selectedItem = item;

    if (this.bentoToolbarComponent) {
      this.bentoToolbarComponent.openEditItemModal(item);
    }
  }

  onItemDelete(item: GridItem) {
    this._selectedItem = item;

    if (this.bentoToolbarComponent) {
      this.bentoToolbarComponent.removeItem();
    }
  }

  /**
   * Reagrupa os produtos por categoria após modificações (add/edit/delete)
   */
  public refreshProductGroups(): void {
    this.resetFillerCache();
    this.groupProductsByCategory(this.data);
    this.cdr.detectChanges();
    this.recalculateAllGrids();
  }

  /**
   * Recalcula todos os grids (search grid + category grids).
   */
  public recalculateAllGrids(): void {
    setTimeout(() => {
      try {
        if (this.bentoBoxComponent) {
          this.bentoBoxComponent.recalculateGrid();
        }
        if (this.bentoBoxComponents && this.bentoBoxComponents.length) {
          this.bentoBoxComponents.forEach(box => box.recalculateGrid());
        }
      } catch (e) {
        console.warn('Erro ao recalcular grids:', e);
      }
    }, 0);
  }

  /**
   * Recarrega todos os dados do servidor quando a edição é cancelada
   */
  public reloadAllData(): void {
    if (this.productsSub) {
      this.productsSub.unsubscribe();
    }

    this.productsSub = forkJoin({
      products: this.storageService.getProducts().pipe(take(1)),
      fillers: this.fillerService.getFillers().pipe(take(1)),
      categories: this.categoryService.getCategories().pipe(take(1)),
    }).subscribe(({ products, fillers, categories }) => {
      const fillerGridItems = this.convertFillersToGridItems(fillers);

      this.resetFillerCache();

      this.data = products;
      this.fillers = fillerGridItems;
      this.allProducts = [...products];

      // Atualiza categorias
      if (categories.success) {
        this.categories = categories.data;
      }

      this.groupProductsByCategory(products);
      this.recalculateAllGrids();
      this.cdr.detectChanges();
    });
  }

  onSearch(searchText: string) {
    this.searchSubject.next(searchText);
  }

  /**
   * Filtra produtos com base no termo de pesquisa
   */
  private filterProducts(searchText: string): void {
    const term = searchText.toLowerCase().trim();

    if (!term) {
      this.isSearchActive = false;
      this.filteredProducts = [];
      // Restore full product list and ensure fillers are recalculated
      this.resetFillerCache();
      this.data = this.allProducts;
      this.groupProductsByCategory(this.allProducts);
      this.recalculateAllGrids();
    } else {
      this.isSearchActive = true;
      const filtered = this.allProducts.filter((item: GridItem) => {
        const name = item.inputs?.productName?.toLowerCase() || '';
        const description = item.inputs?.description?.toLowerCase() || '';
        return name.includes(term) || description.includes(term);
      });

      this.filteredProducts = filtered;
      this.data = filtered;
      this.recalculateAllGrids();
    }

    this.cdr.detectChanges();
  }

  /**
   * Entra em uma mesa via QR Code
   */
  async joinTable(tableId: string): Promise<void> {
    try {
      // Faz request para o backend para criar sessão
      const response = await fetch(`/api/tables/${tableId}/join`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        // Se retornou sessionToken, salva no localStorage (apenas no browser)
        if (isPlatformBrowser(this.platformId) && data.sessionToken) {
          try {
            localStorage.setItem('sessionToken', data.sessionToken);
            localStorage.setItem('tableId', tableId);
            localStorage.setItem('tableNumber', data.table.number);
          } catch (e) {
            console.warn('Não foi possível acessar localStorage:', e);
          }
        }

        // Mostra mensagem de boas-vindas antes de navegar
        if (isPlatformBrowser(this.platformId)) {
          try {
            alert(`🎉 Bem-vindo à Mesa ${data.table.number}!`);
          } catch (e) {
            console.warn('alert indisponível:', e);
          }
        }

        // Redireciona para a página principal
        const navigationSuccess = await this.router.navigate(['/'], {
          queryParams: {
            table: data.table.number,
          },
        });
      } else {
        console.error('❌ Erro ao conectar à mesa:', data.message);
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error('❌ Erro ao acessar mesa:', error);
      alert('Erro ao conectar à mesa. Tente novamente.');
    }
  }
}
