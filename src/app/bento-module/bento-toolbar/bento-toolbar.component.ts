import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GridItem } from '../../interfaces/bento-box.interface';
import { BentoOptions } from '../../interfaces/bento-options.interface';
import { GridService } from '../../services/grid-service/grid.service';
import { NewItemModalComponent } from '../new-item-modal/new-item-modal.component';
import { StorageService } from '../../services/storage-service/storage.service';
import { ComponentRegistryService } from '../../services/storage-service/component-registry.service';

@Component({
  selector: 'app-bento-toolbar',
  standalone: true,
  imports: [FormsModule, NewItemModalComponent],
  templateUrl: './bento-toolbar.component.html',
  styleUrl: './bento-toolbar.component.scss',
})
export class BentoToolbarComponent {
  @Input() data!: GridItem[];
  @Input() options!: BentoOptions;
  @Input() selectedItem: GridItem | null = null;

  @Output() gridChanged = new EventEmitter<void>();

  public showNewItemModal = false;

  // Backup dos dados originais para cancelamento
  private originalData: GridItem[] = [];

  // Flag para indicar se há mudanças não salvas
  public hasUnsavedChanges = false;

  /**
   * Handler para a largura das células da grade.
   */
  public _cellWidth: number = 0;

  /**
   * Handler para a altura das células da grade.
   */
  public _cellHeight: number = 0;

  constructor(
    private gridService: GridService,
    private storageService: StorageService,
    private componentRegistry: ComponentRegistryService
  ) {}

  ngOnInit(): void {
    this._cellWidth = this.options.cellWidth - 2 * this.options.gridGap;
    this._cellHeight = this.options.cellHeight - 2 * this.options.gridGap;
  }

  onGridChange() {
    this.gridService.emitGridChanged();
  }

  onCellChange() {
    this.options.cellHeight = this._cellHeight + 2 * this.options.gridGap;
    this.options.cellWidth = this._cellWidth + 2 * this.options.gridGap;
    this.onGridChange();
  }

  switchMode() {
    if (this.options.mode === 'autoFill') {
      // Entrando no modo de edição - fazer backup dos dados
      // Usar spread para criar cópia mantendo as referências dos componentes
      this.originalData = this.data.map(item => ({
        ...item,
        inputs: { ...item.inputs },
      }));
      this.hasUnsavedChanges = false;
      this.options.mode = 'edit';
    } else {
      // Saindo do modo de edição - não faz nada aqui, usa saveChanges ou cancelEdit
      this.options.mode = 'autoFill';
    }
    this.onGridChange();
  }

  /**
   * Marca que há mudanças não salvas
   */
  private markAsChanged() {
    this.hasUnsavedChanges = true;
  }

  /**
   * Converte os dados do grid para o formato do servidor
   */
  private prepareDataForSave(items: GridItem[]) {
    return items.map(item => {
      // Obter o nome correto do componente usando o registry
      const componentName = this.componentRegistry.getComponentName(item.component);

      return {
        id: item.id,
        component: componentName,
        inputs: item.inputs,
        colSpan: item.colSpan,
        rowSpan: item.rowSpan,
        row: item.row,
        col: item.col,
      };
    });
  }

  /**
   * Salva as alterações feitas no modo de edição
   */
  saveChanges() {
    const dataToSave = this.prepareDataForSave(this.data);

    // Salvar no servidor
    this.storageService.saveProducts(dataToSave as any).subscribe({
      next: () => {
        console.log('✅ Dados salvos com sucesso!');
        this.originalData = [];
        this.hasUnsavedChanges = false;
        this.options.mode = 'autoFill';
        this.onGridChange();

        // Feedback visual de sucesso
        this.showSuccessMessage('Alterações salvas com sucesso!');
      },
      error: error => {
        console.error('❌ Erro ao salvar dados:', error);
        alert(
          'Erro ao salvar as alterações. Verifique a conexão com o servidor e tente novamente.'
        );
      },
    });
  }

  /**
   * Mostra uma mensagem de sucesso temporária
   */
  private showSuccessMessage(message: string) {
    // Pode ser implementado com um toast/snackbar posteriormente
    console.log(message);
  }

  /**
   * Cancela as alterações e restaura o estado anterior
   */
  cancelEdit() {
    if (this.hasUnsavedChanges) {
      const confirmCancel = confirm('Você tem alterações não salvas. Deseja realmente cancelar?');
      if (!confirmCancel) {
        return;
      }
    }

    if (this.originalData.length > 0) {
      // Restaurar os dados originais
      this.data.length = 0;
      this.data.push(...this.originalData);
      this.originalData = [];
    }

    this.hasUnsavedChanges = false;
    this.options.mode = 'autoFill';
    this.onGridChange();
  }

  /**
   * Abre o modal para criar um novo item
   */
  openNewItemModal() {
    this.showNewItemModal = true;
  }

  /**
   * Fecha o modal de novo item
   */
  closeNewItemModal() {
    this.showNewItemModal = false;
  }

  /**
   * Cria um novo item para o array do grid
   * e o põe na ultima posição
   */
  addNewItem(itemData: any) {
    // Encontrar o próximo ID disponível
    const maxId = this.data.reduce((max, item) => Math.max(max, item.id), 0);

    const newItem: GridItem = {
      id: maxId + 1,
      component: itemData.component,
      inputs: itemData.inputs,
      rowSpan: itemData.rowSpan,
      colSpan: itemData.colSpan,
      row: 0,
      col: 0,
    };

    this.data.push(newItem);
    this.markAsChanged();
    this.onGridChange();
    this.closeNewItemModal();

    // Salvar automaticamente o novo item
    this.autoSaveIfNotInEditMode();
  }

  /**
   * Remove o item selecionado do vetor que forma o grid
   */
  removeItem() {
    if (this.selectedItem) {
      const index = this.data.indexOf(this.selectedItem);
      if (index !== -1) {
        const confirmDelete = confirm(
          `Deseja realmente deletar o item "${this.selectedItem.inputs?.productName || 'ID: ' + this.selectedItem.id}"?`
        );
        if (confirmDelete) {
          this.data.splice(index, 1);
          this.markAsChanged();
          this.onGridChange();

          // Salvar automaticamente após deletar
          this.autoSaveIfNotInEditMode();
        }
      }
    } else {
      console.warn('⚠️ Selecione um item para remover');
    }
  }

  /**
   * Move o item selecionado no vetor que forma o grid
   * @param direction A direção no vetor para o qual o item sera movido
   */
  swapItemPosition(direction: 'left' | 'right') {
    if (this.selectedItem) {
      const index = this.data.findIndex(item => item.id === this.selectedItem?.id);

      if (direction === 'left' && index > 0) {
        [this.data[index - 1], this.data[index]] = [this.data[index], this.data[index - 1]];
        this.markAsChanged();
        this.onGridChange();
        this.autoSaveIfNotInEditMode();
      } else if (direction === 'right' && index < this.data.length - 1) {
        [this.data[index], this.data[index + 1]] = [this.data[index + 1], this.data[index]];
        this.markAsChanged();
        this.onGridChange();
        this.autoSaveIfNotInEditMode();
      } else {
        console.warn('⚠️ Não há como mover o item selecionado para esta direção');
      }
    } else {
      console.warn('⚠️ Selecione um item para mover');
    }
  }

  /**
   * Salva automaticamente se não estiver no modo de edição
   * No modo de edição, as mudanças são acumuladas até o usuário clicar em "Salvar"
   */
  private autoSaveIfNotInEditMode() {
    if (this.options.mode !== 'edit') {
      const dataToSave = this.prepareDataForSave(this.data);

      this.storageService.saveProducts(dataToSave as any).subscribe({
        next: () => {
          console.log('✅ Alteração salva automaticamente');
          this.hasUnsavedChanges = false;
        },
        error: error => {
          console.error('❌ Erro ao salvar automaticamente:', error);
          console.warn(
            'As alterações foram aplicadas localmente, mas não foram salvas no servidor.'
          );
        },
      });
    }
  }
}
