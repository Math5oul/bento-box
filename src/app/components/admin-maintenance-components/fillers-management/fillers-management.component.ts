import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ImageUploadService } from '../../../services/image-upload/image-upload.service';
import { StorageService } from '../../../services/storage-service/storage.service';
import { SanitizePipe } from '../../../pipes/sanitize.pipe';

interface FillerContent {
  text?: string;
  backgroundColor?: string;
  url?: string;
  alt?: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
}

interface GridPosition {
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
}

interface Filler {
  _id: string;
  type: 'text' | 'image' | 'video';
  content: FillerContent;
  categories: string[];
  formats: string[];
  active: boolean;
  gridPosition?: GridPosition;
}

@Component({
  selector: 'app-fillers-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SanitizePipe],
  templateUrl: './fillers-management.component.html',
  styleUrl: './fillers-management.component.scss',
})
export class FillersManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  fillers: Filler[] = [];
  loading = true;

  // Filtros
  filterCategory = ''; // Filtro por categoria
  filterType = ''; // Filtro por tipo

  // Estatísticas
  totalFillers = 0;
  textFillers = 0;
  imageFillers = 0;
  videoFillers = 0;

  // Modal de edição
  showEditModal = false;
  editingFiller: Partial<Filler> = {};
  editFormats: string[] = [];
  editCategories: string[] = [];

  // Modal de criação
  showCreateModal = false;
  newFiller: Partial<Filler> = {
    type: 'text',
    active: true,
    categories: [],
    formats: ['1x1'],
  };
  createFormats: string[] = ['1x1'];
  createCategories: string[] = [];

  // Opções disponíveis
  availableFormats = ['1x1', '1x2', '2x1', '2x2'];
  availableCategories = [
    { value: 'food', label: '🥐 Pratos' },
    { value: 'hot beverage', label: '☕ Bebidas Quentes' },
    { value: 'cold beverage', label: '🥤 Bebidas Frias' },
    { value: 'dessert', label: '🍰 Sobremesas' },
    { value: 'alcoholic', label: '🍺 Bebidas Alcoólicas' },
    { value: 'beverage', label: '🍹 Bebidas' },
    { value: 'other', label: '📦 Outros' },
  ];

  categoryEmojis: { [key: string]: string } = {
    food: '🥐',
    'hot beverage': '☕',
    'cold beverage': '🥤',
    dessert: '🍰',
    alcoholic: '🍺',
    beverage: '🍹',
    other: '📦',
  };

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFillers();
    }
  }

  /**
   * Retorna fillers filtrados por categoria e tipo
   */
  get filteredFillers(): Filler[] {
    let filtered = this.fillers;

    // Filtrar por categoria
    if (this.filterCategory) {
      filtered = filtered.filter(filler => filler.categories.includes(this.filterCategory));
    }

    // Filtrar por tipo
    if (this.filterType) {
      filtered = filtered.filter(filler => filler.type === this.filterType);
    }

    return filtered;
  }

  /**
   * Carrega todos os fillers do backend
   */
  async loadFillers(): Promise<void> {
    this.loading = true;
    try {
      this.fillers =
        (await this.http.get<Filler[]>(`${environment.apiUrl}/fillers`).toPromise()) || [];

      // Atualiza estatísticas
      this.totalFillers = this.fillers.length;
      this.textFillers = this.fillers.filter(f => f.type === 'text').length;
      this.imageFillers = this.fillers.filter(f => f.type === 'image').length;
      this.videoFillers = this.fillers.filter(f => f.type === 'video').length;

      this.loading = false;
    } catch (error) {
      console.error('Erro ao carregar fillers:', error);
      this.loading = false;
    }
  }

  /**
   * Abre o modal de criação
   */
  openCreateModal(): void {
    this.newFiller = {
      type: 'text',
      active: true,
      categories: [],
      formats: ['1x1'],
      content: { backgroundColor: '#ffffff' },
    };
    this.createFormats = ['1x1'];
    this.createCategories = [];
    this.showCreateModal = true;
  }

  /**
   * Fecha o modal de criação
   */
  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  /**
   * Abre o modal de edição
   */
  openEditModal(filler: Filler): void {
    this.editingFiller = { ...filler, content: { ...filler.content } };
    this.editFormats = [...(filler.formats || ['1x1'])];
    this.editCategories = [...(filler.categories || [])];
    this.showEditModal = true;
  }

  /**
   * Fecha o modal de edição
   */
  closeEditModal(): void {
    this.showEditModal = false;
  }

  /**
   * Cria um novo filler
   */
  async createFiller(): Promise<void> {
    if (!this.newFiller.type) {
      alert('⚠️ Selecione um tipo de filler!');
      return;
    }

    if (this.createCategories.length === 0) {
      alert('⚠️ Selecione pelo menos uma categoria!');
      return;
    }

    if (this.createFormats.length === 0) {
      alert('⚠️ Selecione pelo menos um formato!');
      return;
    }

    // Valida campos obrigatórios por tipo
    if (this.newFiller.type === 'text' && !this.newFiller.content?.text) {
      alert('⚠️ O campo de texto é obrigatório!');
      return;
    }

    if (this.newFiller.type === 'image' && !this.newFiller.content?.url) {
      alert('⚠️ A URL da imagem é obrigatória!');
      return;
    }

    if (this.newFiller.type === 'video' && !this.newFiller.content?.url) {
      alert('⚠️ A URL do vídeo é obrigatória!');
      return;
    }

    // Processa texto para centralização
    if (this.newFiller.type === 'text' && this.newFiller.content?.text) {
      this.newFiller.content.text = this.ensureCenteredText(this.newFiller.content.text);
    }

    const fillerData: Partial<Filler> = {
      type: this.newFiller.type,
      content: this.newFiller.content,
      categories: this.createCategories,
      formats: this.createFormats,
      active: this.newFiller.active || true,
      gridPosition: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
    };

    try {
      await this.http.post(`${environment.apiUrl}/fillers`, fillerData).toPromise();
      alert('✅ Filler criado com sucesso!');
      this.closeCreateModal();
      this.loadFillers();
    } catch (error: any) {
      console.error('Erro ao criar filler:', error);
      alert('❌ Erro ao criar filler: ' + (error.error?.message || error.message));
    }
  }

  /**
   * Atualiza um filler existente
   */
  async updateFiller(): Promise<void> {
    if (!this.editingFiller._id) return;

    if (this.editCategories.length === 0) {
      alert('⚠️ Selecione pelo menos uma categoria!');
      return;
    }

    if (this.editFormats.length === 0) {
      alert('⚠️ Selecione pelo menos um formato!');
      return;
    }

    // Processa texto para centralização
    if (this.editingFiller.type === 'text' && this.editingFiller.content?.text) {
      this.editingFiller.content.text = this.ensureCenteredText(this.editingFiller.content.text);
    }

    const updateData: Partial<Filler> = {
      type: this.editingFiller.type,
      content: this.editingFiller.content,
      categories: this.editCategories,
      formats: this.editFormats,
      active: this.editingFiller.active,
    };

    try {
      await this.http
        .put(`${environment.apiUrl}/fillers/${this.editingFiller._id}`, updateData)
        .toPromise();
      alert('✅ Filler atualizado com sucesso!');
      this.closeEditModal();
      this.loadFillers();
    } catch (error: any) {
      console.error('Erro ao atualizar filler:', error);
      alert('❌ Erro ao atualizar filler: ' + (error.error?.message || error.message));
    }
  }

  /**
   * Deleta um filler
   */
  async deleteFiller(fillerId: string): Promise<void> {
    if (!confirm('Tem certeza que deseja deletar este filler?')) {
      return;
    }

    try {
      await this.http.delete(`${environment.apiUrl}/fillers/${fillerId}`).toPromise();
      alert('✅ Filler deletado com sucesso!');
      this.loadFillers();
    } catch (error: any) {
      console.error('Erro ao deletar filler:', error);
      alert('❌ Erro ao deletar filler: ' + (error.error?.message || error.message));
    }
  }

  /**
   * Garante que o texto tenha formatação centralizada
   */
  private ensureCenteredText(text: string): string {
    if (!text) return text;

    let processedText = text
      .replace(/text-align:\s*left/gi, 'text-align: center')
      .replace(/text-align:\s*right/gi, 'text-align: center')
      .replace(/text-align:\s*justify/gi, 'text-align: center');

    if (!processedText.includes('text-align') && !processedText.includes('style=')) {
      processedText = processedText
        .replace(/<p>/gi, '<p style="text-align: center;">')
        .replace(/<h1>/gi, '<h1 style="text-align: center;">')
        .replace(/<h2>/gi, '<h2 style="text-align: center;">')
        .replace(/<h3>/gi, '<h3 style="text-align: center;">')
        .replace(/<h4>/gi, '<h4 style="text-align: center;">')
        .replace(/<h5>/gi, '<h5 style="text-align: center;">')
        .replace(/<h6>/gi, '<h6 style="text-align: center;">');

      if (!processedText.includes('<')) {
        processedText = `<div style="text-align: center;">${processedText}</div>`;
      }
    }

    return processedText;
  }

  /**
   * Toggle de seleção de formato
   */
  toggleFormat(format: string, mode: 'create' | 'edit'): void {
    const formats = mode === 'create' ? this.createFormats : this.editFormats;
    const index = formats.indexOf(format);

    if (index > -1) {
      formats.splice(index, 1);
    } else {
      formats.push(format);
    }
  }

  /**
   * Verifica se um formato está selecionado
   */
  isFormatSelected(format: string, mode: 'create' | 'edit'): boolean {
    const formats = mode === 'create' ? this.createFormats : this.editFormats;
    return formats.includes(format);
  }

  /**
   * Toggle de seleção de categoria
   */
  toggleCategory(category: string, mode: 'create' | 'edit'): void {
    const categories = mode === 'create' ? this.createCategories : this.editCategories;
    const index = categories.indexOf(category);

    if (index > -1) {
      categories.splice(index, 1);
    } else {
      categories.push(category);
    }
  }

  /**
   * Verifica se uma categoria está selecionada
   */
  isCategorySelected(category: string, mode: 'create' | 'edit'): boolean {
    const categories = mode === 'create' ? this.createCategories : this.editCategories;
    return categories.includes(category);
  }

  /**
   * Retorna o emoji da categoria
   */
  getCategoryEmojis(categories: string[]): string {
    if (!categories || categories.length === 0) return '⚠️ Sem categorias';
    return categories.map(cat => this.categoryEmojis[cat] || '📦').join(' ');
  }

  /**
   * Retorna o emoji do tipo de filler
   */
  getTypeEmoji(type: string): string {
    const emojis: { [key: string]: string } = {
      text: '📝',
      image: '🖼️',
      video: '🎥',
    };
    return emojis[type] || '📦';
  }

  /**
   * Trunca texto longo
   */
  truncateText(text: string, maxLength: number = 100): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  /**
   * Handler para mudança de cor
   */
  onColorChange(event: Event, mode: 'create' | 'edit'): void {
    const input = event.target as HTMLInputElement;
    const color = input.value;

    if (mode === 'create' && this.newFiller.content) {
      this.newFiller.content.backgroundColor = color;
    } else if (mode === 'edit' && this.editingFiller.content) {
      this.editingFiller.content.backgroundColor = color;
    }
  }

  /**
   * Handler para erro ao carregar imagem
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  /**
   * Handler para erro ao carregar vídeo
   */
  onVideoError(event: Event): void {
    const video = event.target as HTMLVideoElement;
    video.style.display = 'none';
  }
}
