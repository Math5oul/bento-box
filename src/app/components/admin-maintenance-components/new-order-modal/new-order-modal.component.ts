import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth-service/auth.service';
import { Product, ProductSize, ProductVariation } from '../../../interfaces/product.interface';

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
export class NewOrderModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() orderCreated = new EventEmitter<void>();

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
  creatingNewClient = false;
  newClientName = '';

  // Step 3: Seleção de produtos
  products: Product[] = [];
  categories: string[] = [];
  selectedCategory = 'all';
  searchTerm = '';
  orderItems: OrderItem[] = [];
  loadingProducts = false;

  error = '';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadTables();
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
          });
        }
      });
    }
  }

  selectClient(client: Client) {
    this.selectedClient = client;
    this.currentStep = 'products';
    this.loadProducts();
  }

  startCreateClient() {
    this.creatingNewClient = true;
    this.newClientName = '';
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
    };

    this.http
      .post<{ client: Client }>('/api/table/create-anonymous-client', body, {
        headers: this.getHeaders(),
      })
      .subscribe({
        next: response => {
          this.selectedClient = response.client;
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

    this.http
      .get<{ success: boolean; data: Product[] }>('/api/products', { headers: this.getHeaders() })
      .subscribe({
        next: response => {
          this.products = response.data || [];

          // Extrair categorias únicas
          const cats = new Set<string>();
          this.products.forEach(p => {
            if (p.category) cats.add(p.category);
          });
          this.categories = Array.from(cats).sort();

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
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
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

  getTotalAmount(): number {
    return this.orderItems.reduce((sum, item) => {
      let price = item.selectedSize?.price || item.product.price;
      if (item.selectedVariation) {
        price = item.selectedVariation.price;
      }
      return sum + price * item.quantity;
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

  closeModal() {
    this.close.emit();
  }

  // ==================== FINALIZAR PEDIDO ====================

  async submitOrder() {
    if (!this.selectedTable || !this.selectedClient || this.orderItems.length === 0) {
      return;
    }

    const body = {
      tableId: this.selectedTable._id,
      clientId: this.selectedClient._id,
      isClientAnonymous: this.selectedClient.isAnonymous,
      items: this.orderItems.map(item => {
        const unitPrice = item.selectedSize?.price || item.product.price;
        const totalPrice = unitPrice * item.quantity;

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

    this.http.post('/api/orders', body, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.orderCreated.emit();
        this.closeModal();
      },
      error: err => {
        console.error('Erro ao criar pedido:', err);
        this.error = err.error?.message || 'Erro ao criar pedido';
      },
    });
  }
}
