import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GridItem } from '../../interfaces/bento-box.interface';
import { BentoOptions } from '../../interfaces/bento-options.interface';
import { GridService } from '../../services/grid-service/grid.service';
import { NewItemModalComponent } from '../new-item-modal/new-item-modal.component';
import { StorageService } from '../../services/storage-service/storage.service';
import { ComponentRegistryService } from '../../services/storage-service/component-registry.service';
import { FillerService } from '../../services/filler-service/filler.service';
import { COMPONENT_INPUTS_MAP } from '../new-item-modal/Components_Inputs_map';

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
  @Output() dataModified = new EventEmitter<void>(); // Evento quando dados são editados/adicionados/removidos
  @Output() editCancelled = new EventEmitter<void>(); // Evento quando edição é cancelada

  public showNewItemModal = false;
  public showEditItemModal = false;
  public itemToEdit: GridItem | null = null;

  // Backup dos dados originais para cancelamento
  private originalData: GridItem[] = [];

  // Flag para indicar se há mudanças não salvas
  public hasUnsavedChanges = false;

  constructor(
    private gridService: GridService,
    private storageService: StorageService,
    private componentRegistry: ComponentRegistryService,
    private fillerService: FillerService
  ) {}

  onGridChange() {
    this.gridService.emitGridChanged();
  }

  switchMode() {
    if (this.options.mode === 'autoFill') {
      // Entrando no modo de edição - fazer backup profundo dos dados
      this.originalData = this.data.map(item => ({
        id: item.id,
        component: item.component,
        inputs: { ...item.inputs },
        rowSpan: item.rowSpan,
        colSpan: item.colSpan,
        row: item.row,
        col: item.col,
      }));

      console.log('📋 Backup criado com', this.originalData.length, 'itens');
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
    // Separar produtos e fillers
    const products = this.data.filter(item => !this.isFiller(item.component));
    const fillers = this.data.filter(item => this.isFiller(item.component));

    console.log(`💾 Salvando ${products.length} produtos e ${fillers.length} fillers...`);

    // Criar observables para ambos (mesmo que vazios)
    const saveObservables: any[] = [];

    if (products.length > 0) {
      saveObservables.push(this.storageService.saveProducts(products));
    }

    if (fillers.length > 0) {
      // Preparar updates para fillers (atualiza apenas posições)
      const fillerUpdates = fillers.map(filler => ({
        id: String(filler.id),
        gridPosition: {
          row: filler.row,
          col: filler.col,
          rowSpan: filler.rowSpan,
          colSpan: filler.colSpan,
        },
      }));

      saveObservables.push(this.fillerService.updateBatchPositions(fillerUpdates));
    }

    // Se não há nada para salvar
    if (saveObservables.length === 0) {
      console.log('✅ Nada para salvar');
      this.originalData = [];
      this.hasUnsavedChanges = false;
      this.options.mode = 'autoFill';
      this.onGridChange();
      return;
    }

    // Salvar tudo em paralelo
    import('rxjs').then(({ forkJoin }) => {
      forkJoin(saveObservables).subscribe({
        next: results => {
          console.log('✅ Posições salvas com sucesso no MongoDB!', results);
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

    // Restaurar dados originais se existir backup
    if (this.originalData.length > 0) {
      this.data.length = 0;
      this.data.push(...this.originalData);
      this.originalData = [];
    }

    this.hasUnsavedChanges = false;
    this.options.mode = 'autoFill';

    // Emite evento para recarregar os dados do servidor
    this.editCancelled.emit();

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
    console.log('🔍 Detectando tipo de item:', itemData.component);
    console.log('🔍 Component type:', typeof itemData.component);
    console.log('🔍 Component name:', itemData.component?.name);

    // Verifica se é um Filler ou Produto
    const isFiller = this.isFiller(itemData.component);
    console.log('🔍 É Filler?', isFiller);

    if (isFiller) {
      this.addNewFiller(itemData);
    } else {
      this.addNewProduct(itemData);
    }
  }

  /**
   * Verifica se o componente é um Filler
   */
  private isFiller(component: any): boolean {
    // Se for uma string, verifica se contém 'filler'
    if (typeof component === 'string') {
      return component.toLowerCase().includes('filler');
    }

    // Se for um Type/Class, busca no mapa de configuração
    if (component) {
      const config = COMPONENT_INPUTS_MAP.get(component);
      if (config && config.name) {
        return config.name.toLowerCase().includes('filler');
      }
    }

    return false;
  }

  /**
   * Cria um novo Filler no MongoDB
   */
  private addNewFiller(itemData: any) {
    console.log('➕ Criando novo Filler no MongoDB...');
    console.log('📝 Dados do Filler:', itemData);

    // Prepara os dados do Filler
    const fillerData: any = {
      type: this.inferFillerType(itemData.component),
      content: this.prepareFillerContent(itemData),
      categories: itemData.inputs.categories || [], // Adiciona as categorias
      formats: itemData.inputs.formats || ['1x1'], // Formatos válidos
      format: itemData.inputs.format || '1x1',
      gridPosition: {
        row: 0,
        col: 0,
        rowSpan: itemData.rowSpan || 1,
        colSpan: itemData.colSpan || 1,
      },
      active: true,
    };

    console.log('📦 Dados do Filler a serem enviados:', fillerData);

    // Cria o Filler no MongoDB
    this.fillerService.createFiller(fillerData).subscribe({
      next: createdFiller => {
        console.log('✅ Filler criado no MongoDB:', createdFiller);

        // Cria o GridItem com o ID do MongoDB
        const newItem: GridItem = {
          id: createdFiller._id as any,
          component: itemData.component,
          inputs: {
            ...itemData.inputs,
          },
          rowSpan: createdFiller.gridPosition?.rowSpan || 1,
          colSpan: createdFiller.gridPosition?.colSpan || 1,
          row: createdFiller.gridPosition?.row || 0,
          col: createdFiller.gridPosition?.col || 0,
        };

        this.finalizeAddItem(newItem);
      },
      error: error => {
        console.error('❌ Erro ao criar Filler:', error);
        alert('Erro ao criar o Filler. Tente novamente.');
      },
    });
  }

  /**
   * Infere o tipo de Filler baseado no nome do componente
   */
  private inferFillerType(component: any): 'text' | 'image' | 'video' {
    // Busca o nome do componente no mapa de configuração
    let componentName = '';

    if (typeof component === 'string') {
      componentName = component;
    } else if (component) {
      const config = COMPONENT_INPUTS_MAP.get(component);
      if (config) {
        componentName = config.name;
      } else if (component.name) {
        componentName = component.name;
      }
    }

    const nameLower = componentName.toLowerCase();

    if (nameLower.includes('text')) {
      return 'text';
    } else if (nameLower.includes('image') || nameLower.includes('imagem')) {
      return 'image';
    } else if (nameLower.includes('video') || nameLower.includes('vídeo')) {
      return 'video';
    }

    return 'text'; // Default
  }

  /**
   * Prepara o conteúdo do Filler baseado no tipo
   */
  private prepareFillerContent(itemData: any): any {
    // Busca o nome do componente no mapa
    let componentName = '';

    if (typeof itemData.component === 'string') {
      componentName = itemData.component;
    } else if (itemData.component) {
      const config = COMPONENT_INPUTS_MAP.get(itemData.component);
      if (config) {
        componentName = config.name;
      } else if (itemData.component.name) {
        componentName = itemData.component.name;
      }
    }

    const nameLower = componentName.toLowerCase();

    if (nameLower.includes('text')) {
      const backgroundColor =
        itemData.inputs.backgroundColor || itemData.inputs.background || '#ffffff';
      console.log('🎨 Preparando conteúdo de texto:');
      console.log('  - backgroundColor (inputs):', itemData.inputs.backgroundColor);
      console.log('  - background (inputs):', itemData.inputs.background);
      console.log('  - Cor final:', backgroundColor);

      return {
        text: itemData.inputs.text || itemData.inputs.productName || '',
        backgroundColor: backgroundColor,
      };
    } else if (nameLower.includes('image') || nameLower.includes('imagem')) {
      return {
        url: itemData.inputs.url || (itemData.inputs.images && itemData.inputs.images[0]) || '',
        alt: itemData.inputs.alt || itemData.inputs.productName || '',
      };
    } else if (nameLower.includes('video') || nameLower.includes('vídeo')) {
      return {
        url: itemData.inputs.videoUrl || itemData.inputs.url || '',
        alt: itemData.inputs.alt || '',
      };
    }

    return {};
  }

  /**
   * Cria um novo Produto no MongoDB
   */
  private addNewProduct(itemData: any) {
    console.log('➕ Criando novo produto no MongoDB...');
    console.log('📝 Dados recebidos do modal:', itemData);

    // Prepara os dados do produto
    const productData = {
      name: itemData.inputs.productName,
      description: itemData.inputs.description || '',
      price: itemData.inputs.price || 0,
      images: itemData.inputs.images || [],
      category: itemData.inputs.category || this.inferCategory(itemData.inputs.productName),
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

    console.log('📦 Dados do produto a serem enviados:', productData);

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
    this.dataModified.emit(); // Notifica que os dados foram modificados
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
      const itemId = String(this.data[index].id);

      // Verifica se é um Filler ou Produto
      if (this.isFiller(this.data[index].component)) {
        console.log('📝 Atualizando Filler', itemId);

        // Prepara os dados do Filler para atualização
        const updateData = {
          type: this.inferFillerType(itemData.component),
          content: this.prepareFillerContent(itemData),
          categories: itemData.inputs.categories || [], // Adiciona as categorias
          formats: itemData.inputs.formats || ['1x1'], // Formatos válidos
          format: itemData.inputs.format,
          gridPosition: {
            row: this.data[index].row,
            col: this.data[index].col,
            rowSpan: itemData.rowSpan,
            colSpan: itemData.colSpan,
          },
        };

        console.log('📦 Dados de atualização do Filler:', updateData);

        // Atualiza no MongoDB
        this.fillerService.updateFiller(itemId, updateData).subscribe({
          next: () => {
            // Atualiza localmente após sucesso
            this.data[index] = {
              ...this.data[index],
              component: itemData.component,
              inputs: itemData.inputs,
              rowSpan: itemData.rowSpan,
              colSpan: itemData.colSpan,
            };

            console.log('✅ Filler atualizado com sucesso');
            this.markAsChanged();
            this.onGridChange();
            this.dataModified.emit(); // Notifica que os dados foram modificados
            this.closeEditItemModal();
          },
          error: error => {
            console.error('❌ Erro ao atualizar Filler:', error);
            alert('Erro ao salvar as alterações do Filler. Tente novamente.');
          },
        });
      } else {
        // Prepara os dados para atualização de Produto
        const updateData = {
          productName: itemData.inputs.productName,
          description: itemData.inputs.description,
          price: itemData.inputs.price,
          images: itemData.inputs.images || [],
          category: itemData.inputs.category,
          format: itemData.inputs.format,
          colorMode: itemData.inputs.colorMode,
          row: this.data[index].row,
          col: this.data[index].col,
          rowSpan: itemData.rowSpan,
          colSpan: itemData.colSpan,
        };

        console.log('📝 Atualizando produto', itemId, updateData);

        // Atualiza no MongoDB
        this.storageService.updateProduct(itemId, updateData).subscribe({
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
            this.dataModified.emit(); // Notifica que os dados foram modificados
            this.closeEditItemModal();
          },
          error: error => {
            console.error('❌ Erro ao atualizar produto:', error);
            alert('Erro ao salvar as alterações do produto. Tente novamente.');
          },
        });
      }
    }
  }

  /**
   * Remove o item selecionado do vetor que forma o grid
   */
  removeItem() {
    if (this.selectedItem) {
      const index = this.data.indexOf(this.selectedItem);
      if (index !== -1) {
        const itemName =
          this.selectedItem.inputs?.productName ||
          this.selectedItem.inputs?.text ||
          'ID: ' + this.selectedItem.id;

        const confirmDelete = confirm(
          `Deseja realmente deletar o item "${itemName}"?${this.isFiller(this.selectedItem.component) ? '' : '\nIsso também deletará todas as imagens associadas.'}`
        );

        if (confirmDelete) {
          const itemId = String(this.selectedItem.id);

          // Verifica se é um Filler ou Produto
          if (this.isFiller(this.selectedItem.component)) {
            console.log('🗑️ Deletando Filler do MongoDB:', itemId);

            this.fillerService.deleteFiller(itemId).subscribe({
              next: () => {
                console.log(`✅ Filler ${itemId} deletado do MongoDB`);
                this.data.splice(index, 1);
                this.markAsChanged();
                this.onGridChange();
                this.dataModified.emit(); // Notifica que os dados foram modificados
              },
              error: error => {
                console.error('❌ Erro ao deletar Filler:', error);
                alert('Erro ao deletar o Filler. Tente novamente.');
              },
            });
          } else {
            console.log('🗑️ Deletando produto do MongoDB:', itemId);

            // Deletar produto do MongoDB (inclui deleção de imagens via backend)
            this.storageService.deleteProduct(itemId).subscribe({
              next: () => {
                console.log(`✅ Produto ${itemId} deletado do MongoDB`);

                // Remove do array local
                this.data.splice(index, 1);
                this.markAsChanged();
                this.onGridChange();
                this.dataModified.emit(); // Notifica que os dados foram modificados

                // Deletar pasta de imagens
                this.storageService.deleteProductWithImages(itemId).subscribe({
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
      // Separar produtos e fillers
      const products = this.data.filter(item => !this.isFiller(item.component));
      const fillers = this.data.filter(item => this.isFiller(item.component));

      const saveObservables: any[] = [];

      if (products.length > 0) {
        saveObservables.push(this.storageService.saveProducts(products));
      }

      if (fillers.length > 0) {
        const fillerUpdates = fillers.map(filler => ({
          id: String(filler.id),
          gridPosition: {
            row: filler.row,
            col: filler.col,
            rowSpan: filler.rowSpan,
            colSpan: filler.colSpan,
          },
        }));

        saveObservables.push(this.fillerService.updateBatchPositions(fillerUpdates));
      }

      if (saveObservables.length === 0) return;

      import('rxjs').then(({ forkJoin }) => {
        forkJoin(saveObservables).subscribe({
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
      });
    }
  }
}
