import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ImageUploadService } from '../../../services/image-upload/image-upload.service';
import { StorageService } from '../../../services/storage-service/storage.service';
import { CategoryService } from '../../../services/category-service/category.service';
import { Category } from '../../../interfaces/category.interface';

interface ProductSize {
  name: string;
  abbreviation: string;
  price: number;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  sizes?: ProductSize[];
  images: string[];
  category: string; // Agora usa slug da categoria
  format?: '1x1' | '1x2' | '2x1' | '2x2';
  colorMode?: 'light' | 'dark';
  available: boolean;
  gridPosition?: {
    row: number;
    col: number;
    rowSpan: number;
    colSpan: number;
  };
}

@Component({
  selector: 'app-products-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products-management.component.html',
  styleUrl: './products-management.component.scss',
})
export class ProductsManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private imageUploadService = inject(ImageUploadService);
  private storageService = inject(StorageService);
  private categoryService = inject(CategoryService);

  products: Product[] = [];
  categories: Category[] = [];
  loading = true;
  searchTerm = ''; // Filtro de pesquisa

  // Estatísticas
  totalProducts = 0;
  availableProducts = 0;
  unavailableProducts = 0;

  // Modal de edição
  showEditModal = false;
  editingProduct: Partial<Product> = {};

  // Modal de criação
  showCreateModal = false;
  newProduct: Partial<Product> = {
    name: '',
    description: '',
    price: 0,
    sizes: [],
    images: [],
    category: 'pratos', // Usa slug padrão
    format: '1x1',
    colorMode: 'light',
    available: true,
  };

  // Tamanho sendo adicionado/editado
  newSize: ProductSize = { name: '', abbreviation: '', price: 0 };
  editingSizeIndex: number | null = null;

  // Opções disponíveis
  availableFormats: Array<'1x1' | '1x2' | '2x1' | '2x2'> = ['1x1', '1x2', '2x1', '2x2'];

  colorModes: Array<{ value: 'light' | 'dark'; label: string }> = [
    { value: 'light', label: '☀️ Claro' },
    { value: 'dark', label: '🌙 Escuro' },
  ];

  // Gerenciamento de imagens via upload
  selectedNewFiles: File[] = [];
  selectedEditFiles: File[] = [];
  uploadingImages = false;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCategories();
      this.loadProducts();
    }
  }

  /**
   * Carrega categorias do CategoryService
   */
  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: response => {
        if (response.success) {
          this.categories = response.data;
        }
      },
      error: error => {
        console.error('Erro ao carregar categorias:', error);
      },
    });
  }

  /**
   * Retorna emoji da categoria pelo slug
   */
  getCategoryEmoji(slug: string): string {
    const category = this.categories.find(c => c.slug === slug);
    return category ? category.emoji : '📦';
  }

  /**
   * Retorna label completo da categoria (emoji + nome)
   */
  getCategoryLabel(slug: string): string {
    const category = this.categories.find(c => c.slug === slug);
    return category ? `${category.emoji} ${category.name}` : slug;
  }

  /**
   * Retorna produtos filtrados pela pesquisa
   */
  get filteredProducts(): Product[] {
    if (!this.searchTerm.trim()) {
      return this.products;
    }

    const term = this.searchTerm.toLowerCase();
    return this.products.filter(
      product =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term)
    );
  }

  /**
   * Carrega todos os produtos do backend
   */
  async loadProducts(): Promise<void> {
    this.loading = true;
    try {
      const response: any = await this.http.get(`${environment.apiUrl}/products`).toPromise();
      this.products = response.data || [];

      // Atualiza estatísticas
      this.totalProducts = this.products.length;
      this.availableProducts = this.products.filter(p => p.available).length;
      this.unavailableProducts = this.products.filter(p => !p.available).length;

      this.loading = false;
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      this.loading = false;
    }
  }

  /**
   * Abre o modal de criação
   */
  openCreateModal(): void {
    this.newProduct = {
      name: '',
      description: '',
      price: 0,
      images: [],
      category: 'food',
      format: '1x1',
      colorMode: 'light',
      available: true,
    };
    this.selectedNewFiles = [];
    this.showCreateModal = true;
  }

  /**
   * Fecha o modal de criação
   */
  closeCreateModal(): void {
    this.showCreateModal = false;
    this.selectedNewFiles = [];
  }

  /**
   * Abre o modal de edição
   */
  openEditModal(product: Product): void {
    this.editingProduct = { ...product, images: [...(product.images || [])] };
    this.selectedEditFiles = [];
    this.showEditModal = true;
  }

  /**
   * Fecha o modal de edição
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedEditFiles = [];
  }

  /**
   * Cria um novo produto
   */
  async createProduct(): Promise<void> {
    if (!this.newProduct.name || !this.newProduct.description || !this.newProduct.price) {
      alert('⚠️ Preencha todos os campos obrigatórios!');
      return;
    }

    if (this.newProduct.price! < 0) {
      alert('⚠️ O preço não pode ser negativo!');
      return;
    }

    this.uploadingImages = true;

    try {
      // 1. Criar o produto sem imagens
      const productData = {
        ...this.newProduct,
        images: [], // Inicialmente vazio
        gridPosition: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
      };

      const response: any = await this.http
        .post(`${environment.apiUrl}/products`, productData)
        .toPromise();
      const productId = response.data._id;

      // 2. Se houver arquivos, fazer upload
      if (this.selectedNewFiles.length > 0) {
        const uploadResponse: any = await this.storageService
          .uploadProductImages(productId, this.selectedNewFiles)
          .toPromise();

        // 3. Atualizar produto com URLs das imagens
        if (uploadResponse.files && uploadResponse.files.length > 0) {
          await this.http
            .put(`${environment.apiUrl}/products/${productId}`, {
              images: uploadResponse.files,
            })
            .toPromise();
        }
      }

      alert('✅ Produto criado com sucesso!');
      this.closeCreateModal();
      this.loadProducts();
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      alert('❌ Erro ao criar produto: ' + (error.error?.message || error.message));
    } finally {
      this.uploadingImages = false;
    }
  }

  /**
   * Atualiza um produto existente
   */
  async updateProduct(): Promise<void> {
    if (!this.editingProduct._id) return;

    if (
      !this.editingProduct.name ||
      !this.editingProduct.description ||
      this.editingProduct.price === undefined
    ) {
      alert('⚠️ Preencha todos os campos obrigatórios!');
      return;
    }

    if (this.editingProduct.price! < 0) {
      alert('⚠️ O preço não pode ser negativo!');
      return;
    }

    this.uploadingImages = true;

    try {
      const productId = this.editingProduct._id;

      // 1. Se houver novos arquivos, fazer upload
      if (this.selectedEditFiles.length > 0) {
        const uploadResponse: any = await this.storageService
          .uploadProductImages(productId, this.selectedEditFiles)
          .toPromise();

        // Adiciona as novas URLs às imagens existentes (filtrando base64)
        if (uploadResponse.files && uploadResponse.files.length > 0) {
          const existingImages = (this.editingProduct.images || []).filter(
            img => !img.startsWith('data:')
          );
          this.editingProduct.images = [...existingImages, ...uploadResponse.files];
        }
      } else {
        // Remove imagens base64 (previews) das que não foram enviadas
        this.editingProduct.images = (this.editingProduct.images || []).filter(
          img => !img.startsWith('data:')
        );
      }

      // 2. Atualiza o produto
      const { _id, ...updateData } = this.editingProduct;
      await this.http.put(`${environment.apiUrl}/products/${_id}`, updateData).toPromise();

      alert('✅ Produto atualizado com sucesso!');
      this.closeEditModal();
      this.loadProducts();
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      alert('❌ Erro ao atualizar produto: ' + (error.error?.message || error.message));
    } finally {
      this.uploadingImages = false;
    }
  }

  /**
   * Deleta um produto
   */
  async deleteProduct(productId: string): Promise<void> {
    if (!confirm('Tem certeza que deseja deletar este produto?')) {
      return;
    }

    try {
      await this.http.delete(`${environment.apiUrl}/products/${productId}`).toPromise();
      alert('✅ Produto deletado com sucesso!');
      this.loadProducts();
    } catch (error: any) {
      console.error('Erro ao deletar produto:', error);
      alert('❌ Erro ao deletar produto: ' + (error.error?.message || error.message));
    }
  }

  /**
   * Alterna a disponibilidade de um produto
   */
  async toggleAvailability(product: Product): Promise<void> {
    const newStatus = !product.available;
    const statusText = newStatus ? 'disponível' : 'indisponível';

    if (!confirm(`Deseja alterar o produto "${product.name}" para ${statusText}?`)) {
      return;
    }

    try {
      await this.http
        .put(`${environment.apiUrl}/products/${product._id}`, {
          available: newStatus,
        })
        .toPromise();

      alert(`✅ Produto alterado para ${statusText} com sucesso!`);
      this.loadProducts();
    } catch (error: any) {
      console.error('Erro ao alterar disponibilidade:', error);
      alert('❌ Erro ao alterar disponibilidade: ' + (error.error?.message || error.message));
    }
  }

  /**
   * Seleciona arquivos de imagem para upload (modo criação)
   */
  onNewFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const validFiles = this.imageUploadService.validateFiles(files);

    if (!this.newProduct.images) this.newProduct.images = [];

    if (this.newProduct.images.length + validFiles.length > 5) {
      alert('⚠️ Máximo de 5 imagens por produto!');
      return;
    }

    this.selectedNewFiles = [...this.selectedNewFiles, ...validFiles];

    // Cria preview das imagens
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newProduct.images!.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  /**
   * Remove uma imagem do produto (modo criação)
   */
  removeImageFromNew(index: number): void {
    this.newProduct.images?.splice(index, 1);
    if (this.selectedNewFiles[index]) {
      this.selectedNewFiles.splice(index, 1);
    }
  }

  /**
   * Seleciona arquivos de imagem para upload (modo edição)
   */
  onEditFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const validFiles = this.imageUploadService.validateFiles(files);

    if (!this.editingProduct.images) this.editingProduct.images = [];

    if (this.editingProduct.images.length + validFiles.length > 5) {
      alert('⚠️ Máximo de 5 imagens por produto!');
      return;
    }

    this.selectedEditFiles = [...this.selectedEditFiles, ...validFiles];

    // Cria preview das imagens
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editingProduct.images!.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  /**
   * Remove uma imagem do produto (modo edição)
   */
  removeImageFromEdit(index: number): void {
    this.editingProduct.images?.splice(index, 1);
    if (this.selectedEditFiles[index]) {
      this.selectedEditFiles.splice(index, 1);
    }
  }

  /**
   * Adiciona um tamanho ao produto (modal de criação)
   */
  addSizeToNew(): void {
    if (!this.newSize.name || !this.newSize.abbreviation || this.newSize.price < 0) {
      alert('⚠️ Preencha todos os campos do tamanho corretamente!');
      return;
    }

    if (!this.newProduct.sizes) this.newProduct.sizes = [];

    if (this.editingSizeIndex !== null) {
      // Editando tamanho existente
      this.newProduct.sizes[this.editingSizeIndex] = { ...this.newSize };
      this.editingSizeIndex = null;
    } else {
      // Adicionando novo tamanho
      this.newProduct.sizes.push({ ...this.newSize });
    }

    // Reseta o formulário de tamanho
    this.newSize = { name: '', abbreviation: '', price: 0 };
  }

  /**
   * Edita um tamanho existente (modal de criação)
   */
  editSizeInNew(index: number): void {
    if (!this.newProduct.sizes) return;
    this.newSize = { ...this.newProduct.sizes[index] };
    this.editingSizeIndex = index;
  }

  /**
   * Remove um tamanho do produto (modal de criação)
   */
  removeSizeFromNew(index: number): void {
    this.newProduct.sizes?.splice(index, 1);
    if (this.editingSizeIndex === index) {
      this.newSize = { name: '', abbreviation: '', price: 0 };
      this.editingSizeIndex = null;
    }
  }

  /**
   * Adiciona um tamanho ao produto (modal de edição)
   */
  addSizeToEdit(): void {
    if (!this.newSize.name || !this.newSize.abbreviation || this.newSize.price < 0) {
      alert('⚠️ Preencha todos os campos do tamanho corretamente!');
      return;
    }

    if (!this.editingProduct.sizes) this.editingProduct.sizes = [];

    if (this.editingSizeIndex !== null) {
      // Editando tamanho existente
      this.editingProduct.sizes[this.editingSizeIndex] = { ...this.newSize };
      this.editingSizeIndex = null;
    } else {
      // Adicionando novo tamanho
      this.editingProduct.sizes.push({ ...this.newSize });
    }

    // Reseta o formulário de tamanho
    this.newSize = { name: '', abbreviation: '', price: 0 };
  }

  /**
   * Edita um tamanho existente (modal de edição)
   */
  editSizeInEdit(index: number): void {
    if (!this.editingProduct.sizes) return;
    this.newSize = { ...this.editingProduct.sizes[index] };
    this.editingSizeIndex = index;
  }

  /**
   * Remove um tamanho do produto (modal de edição)
   */
  removeSizeFromEdit(index: number): void {
    this.editingProduct.sizes?.splice(index, 1);
    if (this.editingSizeIndex === index) {
      this.newSize = { name: '', abbreviation: '', price: 0 };
      this.editingSizeIndex = null;
    }
  }

  /**
   * Cancela a edição de tamanho
   */
  cancelSizeEdit(): void {
    this.newSize = { name: '', abbreviation: '', price: 0 };
    this.editingSizeIndex = null;
  }

  /**
   * Formata o preço para exibição
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }

  /**
   * Trunca texto longo
   */
  truncateText(text: string, maxLength: number = 100): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}
