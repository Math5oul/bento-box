import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CategoryService } from '../../../services/category-service/category.service';
import {
  Category,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from '../../../interfaces/category.interface';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { RoleService } from '../../../services/role.service';
import { Role } from '../../../interfaces/role.interface';
import { CategoryStatsComponent, CategoryStats } from './category-stats/category-stats.component';
import { CategorySearchBarComponent } from './category-search-bar/category-search-bar.component';
import { CategoryListComponent } from './category-list/category-list.component';

@Component({
  selector: 'app-categories-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AdminHeaderComponent,
    CategoryStatsComponent,
    CategorySearchBarComponent,
    CategoryListComponent,
  ],
  templateUrl: './categories-management.component.html',
  styleUrl: './categories-management.component.scss',
})
export class CategoriesManagementComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private roleService = inject(RoleService);

  categories: Category[] = [];
  loading = true;
  searchTerm = '';

  // Drag and drop
  draggedCategory: Category | null = null;
  dragOverCategory: Category | null = null;

  // Touch support
  private touchStartY = 0;
  private touchStartX = 0;
  private scrolling = false;

  // Modal de criação
  showCreateModal = false;
  newCategory: CreateCategoryDTO = {
    name: '',
    emoji: '📦',
    slug: '',
    index: 0,
    showInMenu: true, // Por padrão, categorias aparecem no menu
  };

  // Modal de edição
  showEditModal = false;
  editingCategory: Partial<Category> = {};

  // Emojis comuns para seleção
  commonEmojis = [
    '🍕',
    '🍔',
    '🍟',
    '🌭',
    '🥐',
    '🥖',
    '🍞',
    '🥯',
    '☕',
    '🍵',
    '🧃',
    '🥤',
    '🧋',
    '🍹',
    '🍺',
    '🍻',
    '🍰',
    '🧁',
    '🍪',
    '🍩',
    '🎂',
    '🍮',
    '🍦',
    '🍨',
    '🥗',
    '🍝',
    '🍜',
    '🍲',
    '🥘',
    '🍛',
    '🍱',
    '🍙',
    '🥩',
    '🍗',
    '🥓',
    '🍖',
    '🌮',
    '🌯',
    '🥙',
    '🥪',
    '🍎',
    '🍊',
    '🍋',
    '🍌',
    '🍉',
    '🍇',
    '🍓',
    '🥝',
    '📦',
    '🎁',
    '🏪',
    '🛒',
    '🍽️',
    '🥄',
    '🔥',
    '⭐',
  ];

  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * Carrega todas as categorias
   */
  async loadCategories(): Promise<void> {
    this.loading = true;
    try {
      const response = await this.categoryService.getCategories().toPromise();
      if (response && response.success) {
        // Ordena categorias pelo campo index
        this.categories = response.data.slice().sort((a, b) => (a.index || 0) - (b.index || 0));
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      alert('❌ Erro ao carregar categorias');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Categorias filtradas pela pesquisa
   */
  get filteredCategories(): Category[] {
    if (!this.searchTerm.trim()) {
      return this.categories;
    }

    const term = this.searchTerm.toLowerCase();
    return this.categories.filter(
      cat => cat.name.toLowerCase().includes(term) || cat.slug.toLowerCase().includes(term)
    );
  }

  /**
   * Retorna o total de produtos categorizados
   */
  getTotalProducts(): number {
    return this.categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
  }

  /**
   * Retorna as estatísticas para o componente de stats
   */
  get stats(): CategoryStats {
    return {
      totalCategories: this.categories.length,
      totalProducts: this.getTotalProducts(),
    };
  }

  /**
   * Abre modal de criação
   */
  openCreateModal(): void {
    this.newCategory = {
      name: '',
      emoji: '📦',
      slug: '',
      index: 0,
      showInMenu: true,
    };
    this.showCreateModal = true;
  }

  /**
   * Fecha modal de criação
   */
  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  /**
   * Abre modal de edição
   */
  openEditModal(category: Category): void {
    this.editingCategory = { ...category };
    this.showEditModal = true;
  }

  /**
   * Fecha modal de edição
   */
  closeEditModal(): void {
    this.showEditModal = false;
  }

  /**
   * Gera slug automaticamente a partir do nome
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .trim();
  }

  /**
   * Atualiza slug quando o nome muda (modo criação)
   */
  onNameChange(): void {
    if (this.newCategory.name) {
      this.newCategory.slug = this.generateSlug(this.newCategory.name);
    }
  }

  /**
   * Atualiza slug quando o nome muda (modo edição)
   */
  onEditNameChange(): void {
    if (this.editingCategory.name) {
      this.editingCategory.slug = this.generateSlug(this.editingCategory.name);
    }
  }

  /**
   * Cria nova categoria
   */
  async createCategory(): Promise<void> {
    if (!this.newCategory.name || !this.newCategory.emoji) {
      alert('⚠️ Preencha o nome e selecione um emoji!');
      return;
    }

    if (!this.newCategory.slug) {
      this.newCategory.slug = this.generateSlug(this.newCategory.name);
    }

    try {
      const payload: CreateCategoryDTO = {
        name: this.newCategory.name,
        emoji: this.newCategory.emoji,
        slug: this.newCategory.slug,
        index: Number(this.newCategory.index) || 0,
        showInMenu: this.newCategory.showInMenu !== false, // false se explicitamente false, true caso contrário
      };

      const response = await this.categoryService.createCategory(payload).toPromise();

      if (response && response.success) {
        alert('✅ Categoria criada com sucesso!');
        this.closeCreateModal();
        this.loadCategories();
      }
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      alert('❌ ' + (error.error?.message || 'Erro ao criar categoria'));
    }
  }

  /**
   * Atualiza categoria existente
   */
  async updateCategory(): Promise<void> {
    if (!this.editingCategory._id) return;

    if (!this.editingCategory.name || !this.editingCategory.emoji) {
      alert('⚠️ Preencha o nome e selecione um emoji!');
      return;
    }

    if (!this.editingCategory.slug && this.editingCategory.name) {
      this.editingCategory.slug = this.generateSlug(this.editingCategory.name);
    }

    const updateData: UpdateCategoryDTO = {
      name: this.editingCategory.name,
      emoji: this.editingCategory.emoji,
      index: Number(this.editingCategory.index) || 0,
      showInMenu: this.editingCategory.showInMenu,
    };

    try {
      const response = await this.categoryService
        .updateCategory(this.editingCategory._id, updateData)
        .toPromise();

      if (response && response.success) {
        alert('✅ Categoria atualizada! Todos os produtos foram atualizados.');
        this.closeEditModal();
        this.loadCategories();
      }
    } catch (error: any) {
      console.error('Erro ao atualizar categoria:', error);
      alert('❌ ' + (error.error?.message || 'Erro ao atualizar categoria'));
    }
  }

  /**
   * Deleta categoria
   */
  async deleteCategory(category: Category): Promise<void> {
    if (category.productCount && category.productCount > 0) {
      alert(
        `❌ Não é possível deletar esta categoria!\n\nExistem ${category.productCount} produto(s) vinculado(s).\n\nPara deletar esta categoria, primeiro mova os produtos para outra categoria.`
      );
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar a categoria "${category.name}"?`)) {
      return;
    }

    try {
      const response = await this.categoryService.deleteCategory(category._id).toPromise();

      if (response && response.success) {
        alert('✅ Categoria deletada com sucesso!');
        this.loadCategories();
      }
    } catch (error: any) {
      console.error('Erro ao deletar categoria:', error);
      alert('❌ ' + (error.error?.message || 'Erro ao deletar categoria'));
    }
  }

  /**
   * Drag and Drop handlers
   */
  onDragStart(event: DragEvent, category: Category): void {
    this.draggedCategory = category;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', category._id);
    }
  }

  onDragOver(event: DragEvent, category: Category): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverCategory = category;
  }

  onDragLeave(event: DragEvent): void {
    this.dragOverCategory = null;
  }

  onDrop(event: DragEvent, targetCategory: Category): void {
    event.preventDefault();

    if (!this.draggedCategory || this.draggedCategory._id === targetCategory._id) {
      this.draggedCategory = null;
      this.dragOverCategory = null;
      return;
    }

    // Encontra os índices
    const draggedIndex = this.categories.findIndex(c => c._id === this.draggedCategory!._id);
    const targetIndex = this.categories.findIndex(c => c._id === targetCategory._id);

    if (draggedIndex === -1 || targetIndex === -1) {
      this.draggedCategory = null;
      this.dragOverCategory = null;
      return;
    }

    // Reordena o array
    const newCategories = [...this.categories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, removed);

    // Atualiza os índices de todas as categorias
    newCategories.forEach((cat, idx) => {
      cat.index = idx;
    });

    this.categories = newCategories;

    // Salva os novos índices no backend
    this.saveAllIndices();

    this.draggedCategory = null;
    this.dragOverCategory = null;
  }

  onDragEnd(): void {
    this.draggedCategory = null;
    this.dragOverCategory = null;
  }

  /**
   * Touch handlers for mobile support
   */
  onTouchStart(event: TouchEvent, category: Category): void {
    // Previne scroll imediato
    const touch = event.touches[0];
    this.touchStartY = touch.clientY;
    this.touchStartX = touch.clientX;
    this.scrolling = false;

    // Pequeno delay para distinguir entre scroll e drag
    setTimeout(() => {
      if (!this.scrolling) {
        this.draggedCategory = category;
      }
    }, 150);
  }

  onTouchMove(event: TouchEvent, categoryElement?: HTMLElement): void {
    if (!this.draggedCategory) {
      // Se moveu muito, é scroll
      const touch = event.touches[0];
      const deltaY = Math.abs(touch.clientY - this.touchStartY);
      const deltaX = Math.abs(touch.clientX - this.touchStartX);

      if (deltaY > 10 || deltaX > 10) {
        this.scrolling = true;
      }
      return;
    }

    event.preventDefault();
    const touch = event.touches[0];

    // Encontra o elemento sob o toque
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!elementBelow) return;

    // Procura o card de categoria mais próximo
    const categoryCard = elementBelow.closest('.category-card');
    if (!categoryCard) {
      this.dragOverCategory = null;
      return;
    }

    // Encontra a categoria correspondente ao card
    const categoryId = categoryCard.getAttribute('data-category-id');
    if (!categoryId) return;

    const targetCategory = this.categories.find(c => c._id === categoryId);
    if (targetCategory && targetCategory._id !== this.draggedCategory._id) {
      this.dragOverCategory = targetCategory;
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.draggedCategory || this.scrolling) {
      this.draggedCategory = null;
      this.dragOverCategory = null;
      this.scrolling = false;
      return;
    }

    event.preventDefault();

    if (this.dragOverCategory && this.draggedCategory._id !== this.dragOverCategory._id) {
      // Encontra os índices
      const draggedIndex = this.categories.findIndex(c => c._id === this.draggedCategory!._id);
      const targetIndex = this.categories.findIndex(c => c._id === this.dragOverCategory!._id);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Reordena o array
        const newCategories = [...this.categories];
        const [removed] = newCategories.splice(draggedIndex, 1);
        newCategories.splice(targetIndex, 0, removed);

        // Atualiza os índices de todas as categorias
        newCategories.forEach((cat, idx) => {
          cat.index = idx;
        });

        this.categories = newCategories;

        // Salva os novos índices no backend
        this.saveAllIndices();
      }
    }

    this.draggedCategory = null;
    this.dragOverCategory = null;
    this.scrolling = false;
  }

  onTouchCancel(): void {
    this.draggedCategory = null;
    this.dragOverCategory = null;
    this.scrolling = false;
  }

  /**
   * Salva os índices de todas as categorias no backend
   */
  private async saveAllIndices(): Promise<void> {
    try {
      // Atualiza cada categoria com seu novo índice
      const updatePromises = this.categories.map(category =>
        this.categoryService.updateCategory(category._id, { index: category.index }).toPromise()
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Erro ao salvar índices:', error);
      alert('❌ Erro ao salvar a nova ordem. Recarregando...');
      this.loadCategories();
    }
  }

  // ============================================
  // GERENCIAMENTO DE DESCONTOS
  // ============================================

  showDiscountsModal = false;
  discountsCategory: Category | null = null;
  discounts: { roleId: string; roleName?: string; discountPercent: number }[] = [];
  availableRoles: Role[] = [];

  /**
   * Abre modal de descontos
   */
  openDiscountsModal(category: Category): void {
    this.discountsCategory = category;
    this.discounts = category.discounts ? [...category.discounts] : [];
    this.loadRoles();
    this.showDiscountsModal = true;
  }

  /**
   * Fecha modal de descontos
   */
  closeDiscountsModal(): void {
    this.showDiscountsModal = false;
    this.discountsCategory = null;
    this.discounts = [];
    this.availableRoles = [];
  }

  /**
   * Carrega os roles disponíveis (apenas clientes)
   */
  private async loadRoles(): Promise<void> {
    try {
      const roles = await this.roleService.getRoles();
      // Filtra apenas roles de clientes (clientLevel > 0)
      this.availableRoles = roles.filter(role => role.clientLevel > 0);
    } catch (error) {
      console.error('Erro ao carregar roles:', error);
      this.availableRoles = [];
    }
  }

  /**
   * Adiciona novo desconto
   */
  addDiscount(): void {
    // Encontra o próximo role disponível
    const usedRoleIds = this.discounts.map(d => d.roleId);
    const nextRole = this.availableRoles.find(role => !usedRoleIds.includes(role._id));

    if (nextRole) {
      this.discounts.push({
        roleId: nextRole._id,
        roleName: nextRole.name,
        discountPercent: 0,
      });
    } else {
      alert('⚠️ Todos os perfis de cliente já possuem descontos configurados');
    }
  }

  /**
   * Remove desconto
   */
  removeDiscount(index: number): void {
    this.discounts.splice(index, 1);
  }

  /**
   * Obtém o nome de um role pelo ID
   */
  getRoleName(roleId: string): string {
    const found = this.availableRoles.find(r => r._id === roleId);
    return found ? found.name : 'Perfil desconhecido';
  }

  /**
   * Salva os descontos da categoria
   */
  async saveDiscounts(): Promise<void> {
    if (!this.discountsCategory) return;

    // Validação
    for (const discount of this.discounts) {
      if (discount.discountPercent < 0 || discount.discountPercent > 100) {
        alert('⚠️ O desconto deve estar entre 0% e 100%');
        return;
      }
    }

    try {
      // Remove o campo roleName antes de enviar (não é necessário no backend)
      const discountsToSave = this.discounts.map(({ roleId, discountPercent }) => ({
        roleId,
        discountPercent,
      }));

      const response = await this.categoryService
        .updateDiscounts(this.discountsCategory._id, discountsToSave)
        .toPromise();

      if (response && response.success) {
        alert('✅ Descontos salvos com sucesso!');
        this.closeDiscountsModal();
        this.loadCategories();
      }
    } catch (error) {
      console.error('Erro ao salvar descontos:', error);
      alert('❌ Erro ao salvar descontos');
    }
  }

  /**
   * Retorna os roles disponíveis para seleção (excluindo já usados)
   */
  getAvailableRolesForSelect(currentRoleId: string): Role[] {
    const usedRoleIds = this.discounts
      .map(d => d.roleId)
      .filter(roleId => roleId !== currentRoleId);

    return this.availableRoles.filter(role => !usedRoleIds.includes(role._id));
  }
}
