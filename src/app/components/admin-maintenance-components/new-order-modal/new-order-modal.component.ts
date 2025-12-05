import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  NgZone,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth-service/auth.service';
import { DiscountService } from '../../../services/discount-service/discount.service';
import { Product, ProductSize, ProductVariation } from '../../../interfaces/product.interface';
import { Category } from '../../../interfaces/category.interface';

interface Table {
  _id: string;
  number: number;
  status: string;
  clients: any[];
  anonymousClients: any[];
}

interface Client {
  _id: string;
  name: string;
  isAnonymous: boolean;
  role?: string | { _id: string; name: string; slug?: string; isSystem?: boolean }; // Role pode ser ID ou objeto populado
}

interface OrderItem {
  product: Product;
  quantity: number;
  notes: string;
  selectedSize?: ProductSize;
  selectedVariation?: ProductVariation;
}

@Component({
  selector: 'app-new-order-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './new-order-modal.component.html',
  styleUrls: ['./new-order-modal.component.scss'],
})
export class NewOrderModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() orderCreated = new EventEmitter<void>();

  // Controle do botão flutuante
  isViewingCart = false;
  private scrollCheckInterval: any;

  // Elementos para scroll
  @ViewChild('productsList', { static: false }) productsListElement?: ElementRef<HTMLDivElement>;
  @ViewChild('orderCart', { static: false }) orderCartElement?: ElementRef<HTMLDivElement>;
  @ViewChild('modalContent', { static: false }) modalContentElement?: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    // Inicia a verificação periódica de scroll após um pequeno delay
    setTimeout(() => {
      this.startScrollMonitoring();
    }, 500);
  }

  ngOnDestroy(): void {
    this.stopScrollMonitoring();
  }

  /**
   * Inicia o monitoramento de scroll
   */
  private startScrollMonitoring() {
    this.stopScrollMonitoring();

    // Verifica a posição inicial
    this.checkScrollPosition();

    // Configura verificação periódica
    this.scrollCheckInterval = setInterval(() => {
      this.checkScrollPosition();
    }, 200);

    // Adiciona listener de scroll
    if (this.modalContentElement) {
      this.modalContentElement.nativeElement.addEventListener(
        'scroll',
        this.handleScroll.bind(this)
      );
    }
  }

  /**
   * Para o monitoramento de scroll
   */
  private stopScrollMonitoring() {
    if (this.scrollCheckInterval) {
      clearInterval(this.scrollCheckInterval);
      this.scrollCheckInterval = null;
    }

    if (this.modalContentElement) {
      this.modalContentElement.nativeElement.removeEventListener(
        'scroll',
        this.handleScroll.bind(this)
      );
    }
  }

  /**
   * Handler para eventos de scroll
   */
  private handleScroll() {
    this.checkScrollPosition();
  }

  /**
   * Verifica a posição do scroll e atualiza o estado do botão
   */
  private checkScrollPosition() {
    if (!this.modalContentElement || !this.productsListElement || !this.orderCartElement) return;

    const modalContent = this.modalContentElement.nativeElement;
    const productsList = this.productsListElement.nativeElement;
    const orderCart = this.orderCartElement.nativeElement;

    // Obtém as posições relativas dentro do modal
    const modalRect = modalContent.getBoundingClientRect();
    const productsRect = productsList.getBoundingClientRect();
    const cartRect = orderCart.getBoundingClientRect();

    // Calcula quanto de cada seção está visível
    const productsVisibility = this.calculateVisibility(productsRect, modalRect);
    const cartVisibility = this.calculateVisibility(cartRect, modalRect);

    // Determina qual seção está mais visível
    // Se o carrinho está pelo menos 30% visível e mais visível que os produtos, considera que está vendo o carrinho
    const wasViewingCart = this.isViewingCart;
    this.isViewingCart = cartVisibility > 0.3 && cartVisibility >= productsVisibility;

    // Log para debug (pode remover depois)
    if (wasViewingCart !== this.isViewingCart) {
      console.log('View state changed:', {
        viewingCart: this.isViewingCart,
        productsVisibility,
        cartVisibility,
      });
    }
  }

  /**
   * Calcula a porcentagem de visibilidade de um elemento dentro do container
   */
  private calculateVisibility(elementRect: DOMRect, containerRect: DOMRect): number {
    // Calcula a interseção entre o elemento e o container
    const visibleTop = Math.max(elementRect.top, containerRect.top);
    const visibleBottom = Math.min(elementRect.bottom, containerRect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);

    // Calcula a porcentagem do elemento que está visível
    const elementHeight = elementRect.height;
    return elementHeight > 0 ? visibleHeight / elementHeight : 0;
  }

  // Etapas do fluxo
  currentStep: 'table' | 'client' | 'products' = 'table';

  // Step 1: Seleção de mesa
  tables: Table[] = [];
  // Seleção de tamanho
  showSizeSelector = false;
  productForSize: Product | null = null;
  selectedVariation: ProductVariation | null = null;

  selectedTable: Table | null = null;
  loadingTables = false;

  // Step 2: Seleção/criação de cliente
  clients: Client[] = [];
  selectedClient: Client | null = null;
  selectedClientRoleId: string | null = null; // RoleId do cliente selecionado (para descontos)
  creatingNewClient = false;
  newClientName = '';
  clientRoles: any[] = [];
  selectedClientRole: string = ''; // ID do role selecionado ao criar novo cliente

  // Step 3: Seleção de produtos
  products: Product[] = [];
  categories: string[] = [];
  categoryObjects: Map<string, Category> = new Map(); // Mapa de categoryId -> Category object
  selectedCategory = 'all';
  searchTerm = '';
  orderItems: OrderItem[] = [];
  loadingProducts = false;

  error = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private ngZone: NgZone,
    private discountService: DiscountService
  ) {}

  ngOnInit() {
    this.loadTables();
    this.loadClientRoles();
  }

  /**
   * Headers com autenticação
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Carrega os roles de cliente disponíveis
   */
  loadClientRoles() {
    this.http
      .get<{ success: boolean; roles: any[] }>('/api/roles', { headers: this.getHeaders() })
      .subscribe({
        next: response => {
          // Filtrar apenas roles de cliente (clientLevel > 0)
          this.clientRoles = response.roles
            .filter(role => role.clientLevel && role.clientLevel > 0)
            .sort((a, b) => a.clientLevel - b.clientLevel);

          // Definir o role padrão (clientLevel = 1 - Cliente Básico)
          const basicRole = this.clientRoles.find(role => role.clientLevel === 1);
          if (basicRole) {
            this.selectedClientRole = basicRole._id;
          }
        },
        error: err => {
          console.error('Erro ao carregar roles:', err);
        },
      });
  }

  // ==================== STEP 1: MESA ====================

  loadTables() {
    this.loadingTables = true;
    this.error = '';

    this.http.get<{ tables: Table[] }>('/api/table', { headers: this.getHeaders() }).subscribe({
      next: response => {
        // Filtrar mesas que NÃO estão fechadas
        this.tables = response.tables
          .filter(t => t.status !== 'closed')
          .sort((a, b) => a.number - b.number);
        this.loadingTables = false;
      },
      error: err => {
        console.error('Erro ao carregar mesas:', err);
        this.error = 'Erro ao carregar mesas';
        this.loadingTables = false;
      },
    });
  }

  selectTable(table: Table) {
    this.selectedTable = table;
    this.currentStep = 'client';
    this.loadClientsForTable(table);
  }

  getTableStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      available: 'Disponível',
      occupied: 'Ocupada',
      reserved: 'Reservada',
    };
    return labels[status] || status;
  }

  // ==================== STEP 2: CLIENTE ====================

  loadClientsForTable(table: Table) {
    this.clients = [];

    // Adicionar clientes registrados (já vêm populados do backend)
    if (table.clients && table.clients.length > 0) {
      table.clients.forEach((client: any) => {
        this.clients.push({
          _id: client._id,
          name: client.name || 'Cliente',
          isAnonymous: client.isAnonymous || false,
          role: client.role, // Preservar role para descontos
        });
      });
    }

    // Adicionar clientes anônimos (agora com userData populado)
    if (table.anonymousClients && table.anonymousClients.length > 0) {
      table.anonymousClients.forEach((anonClient: any) => {
        if (anonClient.userData) {
          this.clients.push({
            _id: anonClient.userData._id,
            name: anonClient.userData.name || `Anônimo ${anonClient.sessionId.substring(0, 8)}`,
            isAnonymous: true,
            role: anonClient.userData.role, // Preservar role para descontos
          });
        }
      });
    }
  }

  selectClient(client: Client) {
    this.selectedClient = client;

    // Extrair roleId do cliente
    // O cliente pode ter role como string (ID) ou objeto populated
    if ((client as any).role) {
      const role = (client as any).role;
      this.selectedClientRoleId = typeof role === 'string' ? role : role._id;
    } else {
      // Se não tem role no objeto, buscar na tabela original
      const originalClient = this.selectedTable?.clients?.find((c: any) => c._id === client._id);
      if (originalClient && originalClient.role) {
        const role = originalClient.role;
        this.selectedClientRoleId = typeof role === 'string' ? role : role._id;
      } else {
        this.selectedClientRoleId = null;
      }
    }

    console.log('👤 Cliente selecionado:', client.name, '- RoleId:', this.selectedClientRoleId);

    this.currentStep = 'products';
    this.loadProducts();
  }

  startCreateClient() {
    this.creatingNewClient = true;
    this.newClientName = '';
    // Resetar para o role padrão (Cliente Básico)
    const basicRole = this.clientRoles.find(role => role.clientLevel === 1);
    if (basicRole) {
      this.selectedClientRole = basicRole._id;
    }
  }

  cancelCreateClient() {
    this.creatingNewClient = false;
    this.newClientName = '';
  }

  async createAnonymousClient() {
    if (!this.selectedTable || !this.newClientName.trim()) {
      return;
    }

    const body = {
      tableId: this.selectedTable._id,
      clientName: this.newClientName.trim(),
      roleId: this.selectedClientRole || undefined, // Incluir roleId se selecionado
    };

    this.http
      .post<{ client: Client }>('/api/table/create-anonymous-client', body, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: response => {
          this.selectedClient = response.client;
          // Armazenar o roleId que acabamos de criar
          this.selectedClientRoleId = this.selectedClientRole || null;
          console.log('✅ Cliente anônimo criado - RoleId:', this.selectedClientRoleId);

          this.creatingNewClient = false;
          this.newClientName = '';
          this.currentStep = 'products';
          this.loadProducts();
        },
        error: err => {
          console.error('Erro ao criar cliente:', err);
          this.error = err.error?.message || 'Erro ao criar cliente';
        },
      });
  }

  // ==================== STEP 3: PRODUTOS ====================

  loadProducts() {
    this.loadingProducts = true;
    this.error = '';

    // Usar /api/products/menu para obter produtos com categorias que incluem descontos
    this.http
      .get<{
        success: boolean;
        data: { items: any[] };
      }>('/api/products/menu', { headers: this.getHeaders() })
      .subscribe({
        next: response => {
          console.log('📦 Resposta do /api/products/menu:', response);

          // Extrair produtos do formato do menu (cada item tem um objeto 'inputs')
          const menuItems = response.data?.items || [];
          console.log('📋 Menu items:', menuItems.length);

          this.products = menuItems.map((item: any) => {
            const inputs = item.inputs || {};
            return {
              _id: item.id,
              name: inputs.productName || inputs.name, // Normalizar nome
              description: inputs.description,
              price: inputs.price,
              images: inputs.images,
              sizes: inputs.sizes,
              variations: inputs.variations,
              category: inputs.category,
              format: inputs.format,
              colorMode: inputs.colorMode,
              available: true, // Produtos do menu sempre disponíveis
            } as Product;
          });

          console.log('✅ Produtos mapeados:', this.products.length);
          if (this.products.length > 0) {
            console.log('🔍 Primeiro produto:', this.products[0]);
          }

          // Extrair categorias únicas e armazenar objetos de categoria
          const cats = new Set<string>();
          this.categoryObjects.clear();

          this.products.forEach(p => {
            if (p.category) {
              // category pode ser string (ID) ou objeto
              const categoryId =
                typeof p.category === 'string' ? p.category : (p.category as any)._id;
              cats.add(categoryId);

              // Se category é objeto, armazenar no mapa
              if (typeof p.category === 'object' && (p.category as any)._id) {
                this.categoryObjects.set(categoryId, p.category as Category);
              }
            }
          });
          this.categories = Array.from(cats).sort();

          console.log('📂 Categorias encontradas:', this.categories);
          console.log('🗺️ Category objects map:', this.categoryObjects);

          this.loadingProducts = false;
        },
        error: err => {
          console.error('Erro ao carregar produtos:', err);
          this.error = 'Erro ao carregar produtos';
          this.loadingProducts = false;
        },
      });
  }

  get filteredProducts(): Product[] {
    let filtered = [...this.products];

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(p => {
        if (!p.category) return false;
        // Comparar o ID da categoria (category pode ser string ou objeto)
        const categoryId = typeof p.category === 'string' ? p.category : (p.category as any)._id;
        return categoryId === this.selectedCategory;
      });
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => p.name?.toLowerCase().includes(term));
    }

    return filtered;
  }

  addProductToOrder(product: Product) {
    // Se produto tem tamanhos ou variações, abre modal de seleção
    if (
      (product.sizes && product.sizes.length > 0) ||
      (product.variations && product.variations.length > 0)
    ) {
      this.productForSize = product;
      this.selectedVariation = null;
      this.showSizeSelector = true;
      return;
    }

    // Se não tem tamanhos nem variações, adiciona direto
    const existing = this.orderItems.find(
      item => item.product._id === product._id && !item.selectedSize && !item.selectedVariation
    );

    if (existing) {
      existing.quantity++;
    } else {
      this.orderItems.push({
        product,
        quantity: 1,
        notes: '',
      });
    }
  }

  selectSize(size?: ProductSize) {
    if (!this.productForSize) return;

    const sizeKey = size ? size.abbreviation : undefined;
    const variationKey = this.selectedVariation ? this.selectedVariation.title : undefined;
    const existing = this.orderItems.find(
      item =>
        item.product._id === this.productForSize!._id &&
        (sizeKey ? item.selectedSize?.abbreviation === sizeKey : !item.selectedSize) &&
        (variationKey ? item.selectedVariation?.title === variationKey : !item.selectedVariation)
    );

    if (existing) {
      existing.quantity++;
    } else {
      this.orderItems.push({
        product: this.productForSize,
        quantity: 1,
        notes: '',
        selectedSize: size,
        selectedVariation: this.selectedVariation || undefined,
      });
    }

    this.closeSizeSelector();
  }

  trackByVariation(index: number, variation: ProductVariation) {
    return variation.title;
  }

  trackBySize(index: number, size: ProductSize) {
    return size.abbreviation;
  }

  selectVariation(variation: ProductVariation) {
    this.selectedVariation = variation;
  }

  closeSizeSelector() {
    this.showSizeSelector = false;
    this.productForSize = null;
    this.selectedVariation = null;
  }

  updateQuantity(item: OrderItem, delta: number) {
    item.quantity += delta;
    if (item.quantity < 1) {
      this.removeItem(item);
    }
  }

  removeItem(item: OrderItem) {
    const index = this.orderItems.indexOf(item);
    if (index > -1) {
      this.orderItems.splice(index, 1);
    }
  }

  /**
   * Obtém o objeto Category de um produto
   */
  getProductCategory(product: Product): Category | null {
    if (!product.category) return null;

    const categoryId =
      typeof product.category === 'string' ? product.category : (product.category as any)._id;
    return this.categoryObjects.get(categoryId) || null;
  }

  /**
   * Obtém o nome da categoria pelo ID
   */
  getCategoryName(categoryId: string): string {
    const category = this.categoryObjects.get(categoryId);
    return category?.name || categoryId;
  }

  /**
   * Calcula o preço base (produto + tamanho) com desconto
   */
  getBasePriceWithDiscount(product: Product, size?: ProductSize): number {
    const basePrice = size?.price || product.price;
    const category = this.getProductCategory(product);

    if (!category) {
      return basePrice;
    }

    // Usar roleId do cliente selecionado
    const calc = this.discountService.calculatePriceWithRole(
      basePrice,
      category,
      this.selectedClientRoleId
    );
    return calc.finalPrice;
  }

  /**
   * Calcula o preço de um tamanho com desconto
   */
  getSizePriceWithDiscount(product: Product, size: ProductSize): number {
    const category = this.getProductCategory(product);

    if (!category) return size.price;

    // Usar roleId do cliente selecionado
    const calc = this.discountService.calculatePriceWithRole(
      size.price,
      category,
      this.selectedClientRoleId
    );
    return calc.finalPrice;
  }

  /**
   * Calcula o preço total de um item do pedido (com desconto no base, sem desconto na variação)
   */
  getItemPrice(item: OrderItem): number {
    const basePrice = item.selectedSize?.price || item.product.price;
    const variationPrice = item.selectedVariation?.price || 0;
    const category = this.getProductCategory(item.product);

    if (!category) {
      return basePrice + variationPrice;
    }

    // Usar roleId do cliente selecionado
    const calc = this.discountService.calculateFullItemPriceWithRole(
      basePrice,
      variationPrice,
      category,
      this.selectedClientRoleId
    );
    return calc.finalTotalPrice;
  }

  getTotalAmount(): number {
    return this.orderItems.reduce((sum, item) => {
      const itemPrice = this.getItemPrice(item);
      return sum + itemPrice * item.quantity;
    }, 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  trackByItem(index: number, item: OrderItem): string {
    // Cria uma chave única combinando productId e selectedSize
    const sizeKey = item.selectedSize?.abbreviation || 'no-size';
    return `${item.product._id}-${sizeKey}`;
  }

  // ==================== NAVEGAÇÃO ====================

  goBack() {
    if (this.currentStep === 'client') {
      this.currentStep = 'table';
      this.selectedTable = null;
      this.clients = [];
    } else if (this.currentStep === 'products') {
      this.currentStep = 'client';
      this.selectedClient = null;
      this.orderItems = [];
    }
  }

  /**
   * Navega entre lista de produtos e carrinho
   */
  scrollBetweenSections() {
    if (!this.productsListElement?.nativeElement || !this.orderCartElement?.nativeElement) return;
    if (this.isViewingCart) {
      // Scroll para o topo da lista de produtos
      this.productsListElement.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      // Scroll para o carrinho
      this.orderCartElement.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
    this.isViewingCart = !this.isViewingCart;
  }

  closeModal() {
    this.close.emit();
  }

  // ==================== FINALIZAR PEDIDO ====================

  async submitOrder() {
    if (!this.selectedTable || !this.selectedClient || this.orderItems.length === 0) {
      return;
    }

    console.log('📤 Enviando pedido...');
    console.log('🛒 Order items:', this.orderItems);

    const body = {
      tableId: this.selectedTable._id,
      clientId: this.selectedClient._id,
      isClientAnonymous: this.selectedClient.isAnonymous,
      items: this.orderItems.map(item => {
        // Calcula o preço unitário com desconto
        const unitPrice = this.getItemPrice(item);
        const totalPrice = unitPrice * item.quantity;

        console.log('📦 Mapeando item:', {
          productId: item.product._id,
          productName: item.product.name,
          unitPrice,
          totalPrice,
        });

        return {
          productId: item.product._id,
          productName: item.product.name,
          productImage: item.product.images?.[0],
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          notes: item.notes || undefined,
          selectedSize: item.selectedSize
            ? {
                name: item.selectedSize.name,
                abbreviation: item.selectedSize.abbreviation,
                price: item.selectedSize.price,
              }
            : undefined,
          selectedVariation: item.selectedVariation
            ? {
                title: item.selectedVariation.title,
                description: item.selectedVariation.description,
                image: item.selectedVariation.image,
                price: item.selectedVariation.price,
              }
            : undefined,
        };
      }),
      totalAmount: this.getTotalAmount(),
    };

    console.log('📋 Body final do pedido:', JSON.stringify(body, null, 2));

    this.http.post('/api/orders', body, { headers: this.getHeaders() }).subscribe({
      next: () => {
        console.log('✅ Pedido criado com sucesso!');
        this.orderCreated.emit();
        this.closeModal();
      },
      error: err => {
        console.error('❌ Erro ao criar pedido:', err);
        console.error('📄 Detalhes do erro:', err.error);
        this.error = err.error?.message || err.error?.errors?.[0]?.msg || 'Erro ao criar pedido';
      },
    });
  }

  /**
   * Retorna o nome da role customizada do cliente (se tiver)
   * Retorna null se for role de sistema (admin, garçom, cozinha, cliente padrão)
   */
  getClientCustomRoleName(client: Client): string | null {
    if (!client.role) {
      return null;
    }

    if (typeof client.role === 'object') {
      // Se isSystem é false, é uma role customizada
      if (client.role.isSystem === false) {
        return client.role.name;
      }
    }

    return null;
  }
}
