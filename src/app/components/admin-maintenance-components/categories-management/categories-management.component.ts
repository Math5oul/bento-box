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

@Component({
  selector: 'app-categories-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './categories-management.component.html',
  styleUrl: './categories-management.component.scss',
})
export class CategoriesManagementComponent implements OnInit {
  private categoryService = inject(CategoryService);

  categories: Category[] = [];
  loading = true;
  searchTerm = '';

  // Modal de criação
  showCreateModal = false;
  newCategory: CreateCategoryDTO = {
    name: '',
    emoji: '📦',
    slug: '',
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
        this.categories = response.data;
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
   * Abre modal de criação
   */
  openCreateModal(): void {
    this.newCategory = {
      name: '',
      emoji: '📦',
      slug: '',
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
      const response = await this.categoryService.createCategory(this.newCategory).toPromise();

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
      slug: this.editingCategory.slug,
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
}
