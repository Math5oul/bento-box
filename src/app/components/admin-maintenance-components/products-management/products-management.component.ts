import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CategoryService } from '../../../services/category-service/category.service';
import { Category } from '../../../interfaces/category.interface';
import { Product } from '../../../interfaces/product.interface';
import { ItemEditorModalComponent } from '../../item-editor-modal/item-editor-modal.component';
import { GridItem } from '../../../interfaces/bento-box.interface';
import { SimpleProductComponent } from '../../simpleComponents/simple-product/simple-product.component';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';

@Component({
  selector: 'app-products-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ItemEditorModalComponent,
    AdminHeaderComponent,
  ],
  templateUrl: './products-management.component.html',
  styleUrl: './products-management.component.scss',
})
export class ProductsManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private categoryService = inject(CategoryService);

  products: Product[] = [];
  categories: Category[] = [];
  loading = true;
  searchTerm = ''; // Filtro de pesquisa

  // Estatísticas
  totalProducts = 0;
  availableProducts = 0;
  unavailableProducts = 0;

  // Modal unificado (new-item-modal)
  showModal = false;
  modalEditMode = false;
  modalItemToEdit: GridItem | null = null;
  currentProductId: string | null = null; // Armazena o ID do produto sendo editado

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
    this.modalEditMode = false;
    this.modalItemToEdit = null;
    this.currentProductId = null;
    this.showModal = true;
  }

  /**
   * Abre o modal de edição
   */
  openEditModal(product: Product): void {
    // Converte o Product para GridItem para usar no modal
    const gridItem: GridItem = {
      id: Date.now(),
      row: 0,
      col: 0,
      component: SimpleProductComponent, // ✅ Componente correto
      rowSpan: this.getRowSpanFromFormat(product.format || '1x1'),
      colSpan: this.getColSpanFromFormat(product.format || '1x1'),
      inputs: {
        productName: product.name,
        description: product.description,
        price: product.price,
        sizes: product.sizes || [],
        images: product.images,
        category: product.category,
        format: product.format || '1x1',
        colorMode: product.colorMode || 'light',
        variations: product.variations || [],
      },
    };

    this.modalItemToEdit = gridItem;
    this.modalEditMode = true;
    this.currentProductId = product._id ?? null;
    this.showModal = true;
  }

  /**
   * Fecha o modal
   */
  closeModal(): void {
    this.showModal = false;
    this.modalEditMode = false;
    this.modalItemToEdit = null;
    this.currentProductId = null;
  }

  /**
   * Handler para quando um item é criado/editado no modal
   */
  async onItemCreated(gridItem: GridItem): Promise<void> {
    // Converte GridItem para Product
    const product: Partial<Product> = {
      name: gridItem.inputs.productName,
      description: gridItem.inputs.description,
      price: gridItem.inputs.price,
      sizes: gridItem.inputs.sizes,
      images: gridItem.inputs.images,
      category: gridItem.inputs.category,
      format: gridItem.inputs.format,
      colorMode: gridItem.inputs.colorMode,
      available: true,
      variations: gridItem.inputs.variations || [],
    };

    try {
      if (this.modalEditMode && this.currentProductId) {
        // Atualizar produto existente
        await this.http
          .put(`${environment.apiUrl}/products/${this.currentProductId}`, product)
          .toPromise();
        alert('✅ Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        await this.http.post(`${environment.apiUrl}/products`, product).toPromise();
        alert('✅ Produto criado com sucesso!');
      }

      this.closeModal();
      this.loadProducts();
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      alert('❌ Erro ao salvar produto: ' + (error.error?.message || error.message));
    }
  }

  /**
   * Obtém rowSpan a partir do formato
   */
  private getRowSpanFromFormat(format: string): number {
    const match = format.match(/(\d+)x(\d+)/);
    return match ? parseInt(match[2]) : 1;
  }

  /**
   * Obtém colSpan a partir do formato
   */
  private getColSpanFromFormat(format: string): number {
    const match = format.match(/(\d+)x(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Deleta um produto
   */
  async deleteProduct(productId?: string): Promise<void> {
    if (!productId) {
      console.warn('deleteProduct chamado sem productId');
      alert('Produto inválido ou sem ID');
      return;
    }

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
      const id = product._id;
      if (!id) {
        alert('Produto sem identificador. Não é possível alternar disponibilidade.');
        return;
      }

      await this.http
        .put(`${environment.apiUrl}/products/${id}`, {
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
