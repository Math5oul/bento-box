import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ImageUploadService } from '../../../services/image-upload/image-upload.service';
import { StorageService } from '../../../services/storage-service/storage.service';
import { SanitizePipe } from '../../../pipes/sanitize.pipe';
import { CategoryService } from '../../../services/category-service/category.service';
import { Category } from '../../../interfaces/category.interface';
import { NewItemModalComponent } from '../../new-item-modal/new-item-modal.component';
import { GridItem } from '../../../interfaces/bento-box.interface';
import { SimpleTextComponent } from '../../simpleComponents/simple-text/simple-text.component';
import { SimpleImageComponent } from '../../simpleComponents/simple-image/simple-image.component';
import { SimpleVideoComponent } from '../../simpleComponents/simple-video/simple-video.component';

interface FillerContent {
  text?: string;
  backgroundColor?: string;
  url?: string;
  videoUrl?: string;
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
  imports: [CommonModule, FormsModule, RouterModule, SanitizePipe, NewItemModalComponent],
  templateUrl: './fillers-management.component.html',
  styleUrl: './fillers-management.component.scss',
})
export class FillersManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private categoryService = inject(CategoryService);

  fillers: Filler[] = [];
  categories: Category[] = [];
  loading = true;

  // Filtros
  filterCategory = ''; // Filtro por categoria
  filterType = ''; // Filtro por tipo

  // Estatísticas
  totalFillers = 0;
  textFillers = 0;
  imageFillers = 0;
  videoFillers = 0;

  // Modal unificado (new-item-modal)
  showModal = false;
  modalEditMode = false;
  modalItemToEdit: GridItem | null = null;
  currentFillerId: string | null = null; // Armazena o ID do filler sendo editado

  // Opções disponíveis
  availableFormats = ['1x1', '1x2', '2x1', '2x2'];

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCategories();
      this.loadFillers();
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
    this.modalEditMode = false;
    this.modalItemToEdit = null;
    this.currentFillerId = null;
    this.showModal = true;
  }

  /**
   * Abre o modal de edição
   */
  openEditModal(filler: Filler): void {
    // Converte o Filler para GridItem para usar no modal
    const gridItem = this.fillerToGridItem(filler);
    this.modalItemToEdit = gridItem;
    this.modalEditMode = true;
    this.currentFillerId = filler._id;
    this.showModal = true;
  }

  /**
   * Fecha o modal
   */
  closeModal(): void {
    this.showModal = false;
    this.modalEditMode = false;
    this.modalItemToEdit = null;
    this.currentFillerId = null;
  }

  /**
   * Handler para quando um item é criado/editado no modal
   */
  async onItemCreated(gridItem: GridItem): Promise<void> {
    // Converte GridItem para Filler
    const filler = this.gridItemToFiller(gridItem);

    try {
      if (this.modalEditMode && this.currentFillerId) {
        // Atualizar filler existente
        await this.http
          .put(`${environment.apiUrl}/fillers/${this.currentFillerId}`, filler)
          .toPromise();
        alert('✅ Filler atualizado com sucesso!');
      } else {
        // Criar novo filler
        await this.http.post(`${environment.apiUrl}/fillers`, filler).toPromise();
        alert('✅ Filler criado com sucesso!');
      }

      this.closeModal();
      this.loadFillers();
    } catch (error: any) {
      console.error('Erro ao salvar filler:', error);
      alert('❌ Erro ao salvar filler: ' + (error.error?.message || error.message));
    }
  }

  /**
   * Converte um Filler para GridItem
   */
  fillerToGridItem(filler: Filler): GridItem {
    let component;
    let inputs: any = {
      categories: filler.categories,
      formats: filler.formats,
    };

    switch (filler.type) {
      case 'text':
        component = SimpleTextComponent;
        inputs.text = filler.content.text || '';
        inputs.background = filler.content.backgroundColor || '#FFFFFF';
        break;
      case 'image':
        component = SimpleImageComponent;
        inputs.url = filler.content.url || '';
        break;
      case 'video':
        component = SimpleVideoComponent;
        inputs.videoUrl = filler.content.videoUrl || '';
        inputs.autoplay = filler.content.autoplay || false;
        inputs.controls = filler.content.controls !== false;
        inputs.loop = filler.content.loop || false;
        break;
      default:
        component = SimpleTextComponent;
    }

    const defaultFormat = filler.formats[0] || '1x1';

    return {
      id: Date.now(),
      row: 0,
      col: 0,
      component,
      rowSpan: this.getRowSpanFromFormat(defaultFormat),
      colSpan: this.getColSpanFromFormat(defaultFormat),
      inputs,
    };
  }

  /**
   * Converte um GridItem para Filler
   */
  gridItemToFiller(item: GridItem): Partial<Filler> {
    let type: 'text' | 'image' | 'video';
    let content: FillerContent = {};

    if (item.component === SimpleTextComponent) {
      type = 'text';
      content.text = item.inputs.text;
      content.backgroundColor = item.inputs.background;
    } else if (item.component === SimpleImageComponent) {
      type = 'image';
      content.url = item.inputs.url;
    } else if (item.component === SimpleVideoComponent) {
      type = 'video';
      content.videoUrl = item.inputs.videoUrl;
      content.autoplay = item.inputs.autoplay;
      content.controls = item.inputs.controls;
      content.loop = item.inputs.loop;
    } else {
      type = 'text';
    }

    return {
      type,
      content,
      categories: item.inputs.categories || [],
      formats: item.inputs.formats || ['1x1'],
      active: true,
    };
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
   * Retorna os emojis das categorias
   */
  getCategoryEmojis(categories: string[]): string {
    if (!categories || categories.length === 0) return '⚠️ Sem categorias';
    return categories.map(slug => this.getCategoryEmoji(slug)).join(' ');
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
