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
  public showEditItemModal = false;
  public itemToEdit: GridItem | null = null;

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
    // Salvar as posições no MongoDB usando batch update
    this.storageService.saveProducts(this.data).subscribe({
      next: () => {
        console.log('✅ Posições salvas com sucesso no MongoDB!');
        this.originalData = [];
        this.hasUnsavedChanges = false;
        this.options.mode = 'autoFill';
        this.onGridChange();

        // Feedback visual de sucesso
        this.showSuccessMessage('Alterações salvas com sucesso!');
      },
      error: error => {
        console.error('❌ Erro ao salvar posições:', error);
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
   * Abre o modal para editar um item existente
   */
  openEditItemModal(item: GridItem) {
    this.itemToEdit = item;
    this.showEditItemModal = true;
  }

  /**
   * Fecha o modal de edição
   */
  closeEditItemModal() {
    this.showEditItemModal = false;
    this.itemToEdit = null;
  }

  /**
   * Cria um novo item para o array do grid
   * e o põe na ultima posição
   */
  addNewItem(itemData: any) {
    console.log('➕ Criando novo produto no MongoDB...');

    // Prepara os dados do produto
    const productData = {
      name: itemData.inputs.productName,
      description: itemData.inputs.description,
      price: itemData.inputs.price,
      images: itemData.inputs.images || [],
      category: this.inferCategory(itemData.inputs.productName),
      format: itemData.inputs.format || '1x1',
      colorMode: itemData.inputs.colorMode || 'light',
      available: true,
      gridPosition: {
        row: 0,
        col: 0,
        rowSpan: itemData.rowSpan || 1,
        colSpan: itemData.colSpan || 1,
      },
    };

    // Cria o produto no MongoDB
    this.storageService.createProduct(productData).subscribe({
      next: response => {
        console.log('✅ Produto criado no MongoDB:', response.data);

        const newProduct = response.data;

        // Cria o GridItem com o ID do MongoDB
        const newItem: GridItem = {
          id: newProduct._id as any, // Usa o _id do MongoDB
          component: itemData.component,
          inputs: {
            ...itemData.inputs,
            images: newProduct.images, // Usa as imagens do produto criado
          },
          rowSpan: newProduct.gridPosition?.rowSpan || 1,
          colSpan: newProduct.gridPosition?.colSpan || 1,
          row: newProduct.gridPosition?.row || 0,
          col: newProduct.gridPosition?.col || 0,
        };

        // Se tinha ID temporário e imagens, renomear pasta
        if (itemData.tempId && itemData.inputs.images && itemData.inputs.images.length > 0) {
          console.log(`🔄 Renomeando pasta de ${itemData.tempId} para ${newProduct._id}`);

          this.storageService.renameProductFolder(itemData.tempId, newProduct._id).subscribe({
            next: renameResponse => {
              if (renameResponse.newPaths && renameResponse.newPaths.length > 0) {
                console.log('✅ Pasta renomeada, atualizando imagens no MongoDB');

                // Atualiza as imagens no produto
                this.storageService
                  .updateProduct(newProduct._id, { images: renameResponse.newPaths })
                  .subscribe({
                    next: () => {
                      newItem.inputs.images = renameResponse.newPaths;
                      this.finalizeAddItem(newItem);
                    },
                    error: err => {
                      console.warn('⚠️ Erro ao atualizar imagens:', err);
                      this.finalizeAddItem(newItem);
                    },
                  });
              } else {
                this.finalizeAddItem(newItem);
              }
            },
            error: err => {
              console.warn('⚠️ Erro ao renomear pasta:', err);
              this.finalizeAddItem(newItem);
            },
          });
        } else {
          this.finalizeAddItem(newItem);
        }
      },
      error: error => {
        console.error('❌ Erro ao criar produto:', error);
        alert('Erro ao criar o produto. Tente novamente.');
      },
    });
  }

  /**
   * Finaliza a adição do item ao grid
   */
  private finalizeAddItem(newItem: GridItem) {
    this.data.push(newItem);
    this.markAsChanged();
    this.onGridChange();
    this.closeNewItemModal();
    console.log('✅ Item adicionado ao grid');
  }

  /**
   * Infere a categoria do produto baseado no nome
   */
  private inferCategory(name: string): 'beverage' | 'food' | 'dessert' | 'other' {
    const nameLower = name.toLowerCase();

    if (
      nameLower.includes('café') ||
      nameLower.includes('coffee') ||
      nameLower.includes('chá') ||
      nameLower.includes('tea') ||
      nameLower.includes('suco') ||
      nameLower.includes('juice') ||
      nameLower.includes('smoothie') ||
      nameLower.includes('latte') ||
      nameLower.includes('cappuccino')
    ) {
      return 'beverage';
    }

    if (
      nameLower.includes('bolo') ||
      nameLower.includes('cake') ||
      nameLower.includes('donut') ||
      nameLower.includes('torta') ||
      nameLower.includes('pie') ||
      nameLower.includes('sobremesa') ||
      nameLower.includes('dessert')
    ) {
      return 'dessert';
    }

    if (
      nameLower.includes('sanduíche') ||
      nameLower.includes('sandwich') ||
      nameLower.includes('pão') ||
      nameLower.includes('bread') ||
      nameLower.includes('pizza') ||
      nameLower.includes('hamburguer')
    ) {
      return 'food';
    }

    return 'other';
  }

  /**
   * Atualiza um item existente com os novos dados
   */
  updateItem(itemData: any) {
    if (!this.itemToEdit) return;

    const index = this.data.indexOf(this.itemToEdit);
    if (index !== -1) {
      const productId = String(this.data[index].id);

      // Prepara os dados para atualização
      const updateData = {
        productName: itemData.inputs.productName,
        description: itemData.inputs.description,
        price: itemData.inputs.price,
        images: itemData.inputs.images || [],
        format: itemData.inputs.format,
        colorMode: itemData.inputs.colorMode,
        row: this.data[index].row,
        col: this.data[index].col,
        rowSpan: itemData.rowSpan,
        colSpan: itemData.colSpan,
      };

      console.log('📝 Atualizando produto', productId, updateData);

      // Atualiza no MongoDB
      this.storageService.updateProduct(productId, updateData).subscribe({
        next: () => {
          // Atualiza localmente após sucesso
          this.data[index] = {
            ...this.data[index],
            component: itemData.component,
            inputs: itemData.inputs,
            rowSpan: itemData.rowSpan,
            colSpan: itemData.colSpan,
          };

          console.log('✅ Produto atualizado com sucesso');
          this.markAsChanged();
          this.onGridChange();
          this.closeEditItemModal();
        },
        error: error => {
          console.error('❌ Erro ao atualizar produto:', error);
          alert('Erro ao salvar as alterações do produto. Tente novamente.');
        },
      });
    }
  }

  /**
   * Remove o item selecionado do vetor que forma o grid
   */
  removeItem() {
    if (this.selectedItem) {
      const index = this.data.indexOf(this.selectedItem);
      if (index !== -1) {
        const confirmDelete = confirm(
          `Deseja realmente deletar o item "${this.selectedItem.inputs?.productName || 'ID: ' + this.selectedItem.id}"?\nIsso também deletará todas as imagens associadas.`
        );
        if (confirmDelete) {
          const productId = String(this.selectedItem.id);

          console.log('🗑️ Deletando produto do MongoDB:', productId);

          // Deletar produto do MongoDB (inclui deleção de imagens via backend)
          this.storageService.deleteProduct(productId).subscribe({
            next: () => {
              console.log(`✅ Produto ${productId} deletado do MongoDB`);

              // Remove do array local
              this.data.splice(index, 1);
              this.markAsChanged();
              this.onGridChange();

              // Deletar pasta de imagens
              this.storageService.deleteProductWithImages(productId).subscribe({
                next: response => {
                  console.log('✅ Pasta de imagens deletada:', response);
                },
                error: error => {
                  console.warn('⚠️ Erro ao deletar pasta de imagens:', error);
                },
              });
            },
            error: error => {
              console.error('❌ Erro ao deletar produto:', error);
              alert('Erro ao deletar o produto. Tente novamente.');
            },
          });
        }
      }
    } else {
      console.warn('⚠️ Selecione um item para remover');
    }
  }

  /**
   * Abre o modal de edição para o item selecionado
   */
  editItem() {
    if (this.selectedItem) {
      this.openEditItemModal(this.selectedItem);
    } else {
      console.warn('⚠️ Selecione um item para editar');
    }
  }

  /**
   * Move o item selecionado no vetor que forma o grid
   * @param direction A direção no vetor para o qual o item sera movido
   */
  swapItemPosition(direction: 'left' | 'right' | 'up' | 'down') {
    if (this.selectedItem) {
      const index = this.data.findIndex(item => item.id === this.selectedItem?.id);
      const maxCols = this.options.maxCols || 6;

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
      } else if (direction === 'up' && index >= maxCols) {
        // Move uma "linha" acima (troca com o item maxCols posições antes)
        const targetIndex = index - maxCols;
        if (targetIndex >= 0) {
          [this.data[targetIndex], this.data[index]] = [this.data[index], this.data[targetIndex]];
          this.markAsChanged();
          this.onGridChange();
          this.autoSaveIfNotInEditMode();
        }
      } else if (direction === 'down' && index + maxCols < this.data.length) {
        // Move uma "linha" abaixo (troca com o item maxCols posições depois)
        const targetIndex = index + maxCols;
        [this.data[targetIndex], this.data[index]] = [this.data[index], this.data[targetIndex]];
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
      this.storageService.saveProducts(this.data).subscribe({
        next: () => {
          console.log('✅ Alteração salva automaticamente no MongoDB');
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
