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
  fillers: GridItem[] = []; // Será preenchido com Fillers do MongoDB

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

  ngOnInit(): void {
    // Verifica se está acessando via QR Code (rota /table/:tableId/join)
    // Chamamos joinTable apenas no browser (evita SSR e chamadas duplicadas)
    if (isPlatformBrowser(this.platformId)) {
      this.route.params.subscribe(params => {
        const tableId = params['tableId'];
        if (tableId) {
          this.joinTable(tableId);
        }
      });
    }

    // Carrega produtos, fillers E categorias em paralelo
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

      // Depois agrupa produtos e fillers por categoria
      this.groupProductsByCategory(products);

      // Se chegamos aqui e a navegação trouxe ?joined=true, recarrega os dados
      // no componente recém-criado (resolve caso o reload fosse chamado no
      // componente antigo que foi destruído pela navegação)
      if (
        isPlatformBrowser(this.platformId) &&
        this.route.snapshot.queryParams['joined'] === 'true'
      ) {
        // pequena defasagem para garantir que o componente esteja totalmente inicializado
        setTimeout(() => {
          try {
            this.reloadAllData();
          } catch (e) {
            console.warn('Falha ao recarregar dados após join:', e);
          }
        }, 0);
      }
    });

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

      this.fillersByCategory.set(category, categoryFillers);
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
      fillers: this.fillerService.getFillers(),
    }).subscribe(({ products, fillers }) => {
      const fillerGridItems = this.convertFillersToGridItems(fillers);

      this.resetFillerCache();

      this.data = products;
      this.fillers = fillerGridItems;
      this.allProducts = [...products];

      this.groupProductsByCategory(products);

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
      this.data = this.allProducts;
      this.groupProductsByCategory(this.allProducts);
      this.resetFillerCache();
    } else {
      this.isSearchActive = true;
      const filtered = this.allProducts.filter((item: GridItem) => {
        const name = item.inputs?.productName?.toLowerCase() || '';
        const description = item.inputs?.description?.toLowerCase() || '';
        return name.includes(term) || description.includes(term);
      });

      this.filteredProducts = filtered;
      this.data = filtered;
    }

    this.cdr.detectChanges();

    setTimeout(() => {
      this.bentoBoxComponents?.forEach(box => {
        box.recalculateGrid();
      });
    }, 0);
  }

  /**
   * Entra em uma mesa via QR Code
   */
  async joinTable(tableId: string): Promise<void> {
    try {
      console.log('🔗 Acessando mesa via QR Code:', tableId);

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
        console.log('✅ Conectado à mesa com sucesso:', data);

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

        // Redireciona para a página principal (sem o /join na URL)
        // Após navegar, recarrega todos os dados (produtos e fillers)
        this.router
          .navigate(['/'], {
            queryParams: {
              table: data.table.number,
              joined: 'true',
            },
          })
          .then(() => {
            // As ações abaixo devem rodar apenas no browser
            if (isPlatformBrowser(this.platformId)) {
              // Mostra mensagem de boas-vindas
              try {
                alert(`\ud83c\udf89 Bem-vindo \u00e0 Mesa ${data.table.number}!`);
              } catch (e) {
                console.warn('alert indisponível:', e);
              }

              // Recarrega produtos e fillers para garantir que os fillers
              // carreguem sem a necessidade de refresh manual da página
              try {
                this.reloadAllData();
              } catch (err) {
                // fallback: força recarregamento da página se algo inesperado ocorrer
                console.error('Erro ao recarregar dados depois do join:', err);
                try {
                  window.location.reload();
                } catch (e) {
                  console.warn('window.location.reload indisponível:', e);
                }
              }
            }
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
