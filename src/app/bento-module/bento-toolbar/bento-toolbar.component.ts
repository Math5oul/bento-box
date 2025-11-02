import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GridItem } from '../../interfaces/bento-box.interface';
import { BentoOptions } from '../../interfaces/bento-options.interface';
import { GridService } from '../../services/grid-service/grid.service';
import { ItemEditorModalComponent } from '../../components/item-editor-modal/item-editor-modal.component';
import { StorageService } from '../../services/storage-service/storage.service';
import { ComponentRegistryService } from '../../services/storage-service/component-registry.service';
import { FillerService } from '../../services/filler-service/filler.service';
import { COMPONENT_INPUTS_MAP } from '../../components/item-editor-modal/Components_Inputs_map';

@Component({
  selector: 'app-bento-toolbar',
  standalone: true,
  imports: [FormsModule, ItemEditorModalComponent],
  templateUrl: './bento-toolbar.component.html',
  styleUrl: './bento-toolbar.component.scss',
})
export class BentoToolbarComponent {
  @Input() data!: GridItem[];
  @Input() options!: BentoOptions;
  @Input() selectedItem: GridItem | null = null;
  @Input() hideToolbar: boolean = false; // Se true, não renderiza toolbar (ex: role cozinha)

  @Output() gridChanged = new EventEmitter<void>();
  @Output() dataModified = new EventEmitter<void>();
  @Output() editCancelled = new EventEmitter<void>();

  public showNewItemModal = false;
  public showEditItemModal = false;
  public itemToEdit: GridItem | null = null;

  private originalData: GridItem[] = [];
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

  /**
   * Alterna entre modo de edição e visualização
   */
  switchMode() {
    if (this.options.mode === 'autoFill') {
      this.originalData = this.data.map(item => ({
        id: item.id,
        component: item.component,
        inputs: { ...item.inputs },
        rowSpan: item.rowSpan,
        colSpan: item.colSpan,
        row: item.row,
        col: item.col,
      }));

      this.hasUnsavedChanges = false;
      this.options.mode = 'edit';
    } else {
      this.options.mode = 'autoFill';
    }
    this.onGridChange();
  }

  private markAsChanged() {
    this.hasUnsavedChanges = true;
  }

  /**
   * Converte dados do grid para formato do servidor
   */
  private prepareDataForSave(items: GridItem[]) {
    return items.map(item => {
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
   * Salva alterações feitas no modo de edição
   */
  saveChanges() {
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

    if (saveObservables.length === 0) {
      this.originalData = [];
      this.hasUnsavedChanges = false;
      this.options.mode = 'autoFill';
      this.onGridChange();
      return;
    }

    import('rxjs').then(({ forkJoin }) => {
      forkJoin(saveObservables).subscribe({
        next: results => {
          this.originalData = [];
          this.hasUnsavedChanges = false;
          this.options.mode = 'autoFill';
          this.onGridChange();

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

  private showSuccessMessage(message: string) {}

  /**
   * Cancela alterações e restaura estado anterior
   */
  cancelEdit() {
    if (this.hasUnsavedChanges) {
      const confirmCancel = confirm('Você tem alterações não salvas. Deseja realmente cancelar?');
      if (!confirmCancel) {
        return;
      }
    }

    if (this.originalData.length > 0) {
      this.data.length = 0;
      this.data.push(...this.originalData);
      this.originalData = [];
    }

    this.hasUnsavedChanges = false;
    this.options.mode = 'autoFill';

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

  closeEditItemModal() {
    this.showEditItemModal = false;
    this.itemToEdit = null;
  }

  addNewItem(itemData: any) {
    const isFiller = this.isFiller(itemData.component);

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
    if (typeof component === 'string') {
      return component.toLowerCase().includes('filler');
    }

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
    const fillerData: any = {
      type: this.inferFillerType(itemData.component),
      content: this.prepareFillerContent(itemData),
      categories: itemData.inputs.categories || [],
      formats: itemData.inputs.formats || ['1x1'],
      format: itemData.inputs.format || '1x1',
      gridPosition: {
        row: 0,
        col: 0,
        rowSpan: itemData.rowSpan || 1,
        colSpan: itemData.colSpan || 1,
      },
      active: true,
    };

    this.fillerService.createFiller(fillerData).subscribe({
      next: createdFiller => {
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
   * Infere o tipo de Filler baseado no componente
   */
  private inferFillerType(component: any): 'text' | 'image' | 'video' {
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

    return 'text';
  }

  /**
   * Prepara o conteúdo do Filler baseado no tipo
   */
  private prepareFillerContent(itemData: any): any {
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

    this.storageService.createProduct(productData).subscribe({
      next: response => {
        const newProduct = response.data;

        const newItem: GridItem = {
          id: newProduct._id as any,
          component: itemData.component,
          inputs: {
            ...itemData.inputs,
            images: newProduct.images,
          },
          rowSpan: newProduct.gridPosition?.rowSpan || 1,
          colSpan: newProduct.gridPosition?.colSpan || 1,
          row: newProduct.gridPosition?.row || 0,
          col: newProduct.gridPosition?.col || 0,
        };

        if (itemData.tempId && itemData.inputs.images && itemData.inputs.images.length > 0) {
          this.storageService.renameProductFolder(itemData.tempId, newProduct._id).subscribe({
            next: renameResponse => {
              if (renameResponse.newPaths && renameResponse.newPaths.length > 0) {
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

  private finalizeAddItem(newItem: GridItem) {
    this.data.push(newItem);
    this.markAsChanged();
    this.onGridChange();
    this.dataModified.emit();
    this.closeNewItemModal();
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

      if (this.isFiller(this.data[index].component)) {
        const updateData = {
          type: this.inferFillerType(itemData.component),
          content: this.prepareFillerContent(itemData),
          categories: itemData.inputs.categories || [],
          formats: itemData.inputs.formats || ['1x1'],
          format: itemData.inputs.format,
          gridPosition: {
            row: this.data[index].row,
            col: this.data[index].col,
            rowSpan: itemData.rowSpan,
            colSpan: itemData.colSpan,
          },
        };

        this.fillerService.updateFiller(itemId, updateData).subscribe({
          next: () => {
            this.data[index] = {
              ...this.data[index],
              component: itemData.component,
              inputs: itemData.inputs,
              rowSpan: itemData.rowSpan,
              colSpan: itemData.colSpan,
            };

            this.markAsChanged();
            this.onGridChange();
            this.dataModified.emit();
            this.closeEditItemModal();
          },
          error: error => {
            console.error('❌ Erro ao atualizar Filler:', error);
            alert('Erro ao salvar as alterações do Filler. Tente novamente.');
          },
        });
      } else {
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

        this.storageService.updateProduct(itemId, updateData).subscribe({
          next: () => {
            this.data[index] = {
              ...this.data[index],
              component: itemData.component,
              inputs: itemData.inputs,
              rowSpan: itemData.rowSpan,
              colSpan: itemData.colSpan,
            };

            this.markAsChanged();
            this.onGridChange();
            this.dataModified.emit();
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
   * Remove o item selecionado do grid
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

          if (this.isFiller(this.selectedItem.component)) {
            this.fillerService.deleteFiller(itemId).subscribe({
              next: () => {
                this.data.splice(index, 1);
                this.markAsChanged();
                this.onGridChange();
                this.dataModified.emit();
              },
              error: error => {
                console.error('❌ Erro ao deletar Filler:', error);
                alert('Erro ao deletar o Filler. Tente novamente.');
              },
            });
          } else {
            this.storageService.deleteProduct(itemId).subscribe({
              next: () => {
                this.data.splice(index, 1);
                this.markAsChanged();
                this.onGridChange();
                this.dataModified.emit();

                this.storageService.deleteProductWithImages(itemId).subscribe({
                  next: () => {},
                  error: error => {
                    console.error('❌ Erro ao deletar pasta de imagens:', error);
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
    }
  }

  editItem() {
    if (this.selectedItem) {
      this.openEditItemModal(this.selectedItem);
    }
  }

  /**
   * Move o item selecionado no grid
   * @param direction A direção para mover o item
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
        const targetIndex = index - maxCols;
        if (targetIndex >= 0) {
          [this.data[targetIndex], this.data[index]] = [this.data[index], this.data[targetIndex]];
          this.markAsChanged();
          this.onGridChange();
          this.autoSaveIfNotInEditMode();
        }
      } else if (direction === 'down' && index + maxCols < this.data.length) {
        const targetIndex = index + maxCols;
        [this.data[targetIndex], this.data[index]] = [this.data[index], this.data[targetIndex]];
        this.markAsChanged();
        this.onGridChange();
        this.autoSaveIfNotInEditMode();
      }
    }
  }

  /**
   * Salva automaticamente se não estiver no modo de edição
   */
  private autoSaveIfNotInEditMode() {
    if (this.options.mode !== 'edit') {
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
            this.hasUnsavedChanges = false;
          },
          error: error => {
            console.error('❌ Erro ao salvar automaticamente:', error);
          },
        });
      });
    }
  }
}
