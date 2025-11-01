import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
} from '@angular/forms';
import { COMPONENT_INPUTS_MAP, ProductSize } from './Components_Inputs_map';
import { ImageUploadService } from '../../services/image-upload/image-upload.service';
import { CategoryService } from '../../services/category-service/category.service';
import { GridItem } from '../../interfaces/bento-box.interface';
import { Category } from '../../interfaces/category.interface';
import { SimpleProductComponent } from '../simpleComponents/simple-product/simple-product.component';
import { SimpleTextComponent } from '../simpleComponents/simple-text/simple-text.component';
import { SimpleImageComponent } from '../simpleComponents/simple-image/simple-image.component';
import { SimpleVideoComponent } from '../simpleComponents/simple-video/simple-video.component';

// Interfaces locais para Product e Filler (compatível com os gerenciadores)
interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  sizes?: ProductSize[];
  images: string[];
  category: string;
  format?: '1x1' | '1x2' | '2x1' | '2x2';
  colorMode?: 'light' | 'dark';
  available?: boolean;
}

interface FillerContent {
  text?: string;
  backgroundColor?: string;
  url?: string;
  videoUrl?: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
}

interface Filler {
  _id?: string;
  type: 'text' | 'image' | 'video';
  content: FillerContent;
  categories: string[];
  formats: string[];
  active?: boolean;
}

@Component({
  selector: 'app-new-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './new-item-modal.component.html',
  styleUrls: ['./new-item-modal.component.scss'],
})
export class NewItemModalComponent implements OnInit {
  @Input() editMode = false;
  @Input() itemToEdit: GridItem | null = null;
  @Input() mode: 'product' | 'filler' | 'grid' = 'grid'; // Controla quais componentes são exibidos

  @Output() itemCreated = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();

  availableComponents = Array.from(COMPONENT_INPUTS_MAP.entries()).map(
    ([componentClass, config]) => ({
      component: componentClass,
      name: config.name,
      inputsConfig: config.inputs,
    })
  );

  // Componentes filtrados pelo modo
  get filteredComponents() {
    if (this.mode === 'product') {
      // Mostra apenas SimpleProductComponent
      return this.availableComponents.filter(comp => comp.name === 'Produto');
    } else if (this.mode === 'filler') {
      // Mostra apenas Text, Image e Video (fillers)
      return this.availableComponents.filter(comp => comp.name.includes('Filler'));
    } else {
      // Modo 'grid': mostra todos
      return this.availableComponents;
    }
  }

  selectedComponent: any = null;
  showDimensionsForm = false;
  componentForm: FormGroup;

  selectedFiles: File[] = [];
  uploadedImagePaths: string[] = [];
  isUploading = false;
  currentTempId: string | null = null;

  // Gerenciamento de tamanhos de produtos
  editingSizeIndex: number | null = null;
  tempSize: ProductSize = { name: '', abbreviation: '', price: 0 };

  // Categorias dinâmicas
  categories: Category[] = [];
  categoryOptions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private imageUploadService: ImageUploadService,
    private categoryService: CategoryService
  ) {
    this.componentForm = this.fb.group({
      rowSpan: [1],
      colSpan: [1],
      inputs: this.fb.group({}),
    });
  }

  ngOnInit() {
    // Carregar categorias do banco
    this.loadCategories();

    // Aguardar um momento para as categorias carregarem antes de editar
    if (this.editMode && this.itemToEdit) {
      // Se já temos categorias em cache, carregar imediatamente
      const cachedCategories = this.categoryService.getCurrentCategories();
      if (cachedCategories && cachedCategories.length > 0) {
        this.categories = cachedCategories;
        this.categoryOptions = cachedCategories.map(cat => cat.slug);
        this.updateCategoryOptions();
        this.loadItemForEditing();
      } else {
        // Caso contrário, aguardar o carregamento
        setTimeout(() => this.loadItemForEditing(), 200);
      }
    }
  }

  /**
   * Carrega as categorias do banco de dados
   */
  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: response => {
        if (response.success) {
          this.categories = response.data;
          this.categoryOptions = response.data.map(cat => cat.slug);

          // Atualizar as opções de categoria em todos os componentes
          this.updateCategoryOptions();
        }
      },
      error: error => {
        console.error('Erro ao carregar categorias:', error);
      },
    });
  }

  /**
   * Atualiza as opções de categoria nos componentes disponíveis
   */
  updateCategoryOptions() {
    this.availableComponents.forEach(comp => {
      comp.inputsConfig.forEach(input => {
        if (input.name === 'category' || input.name === 'categories') {
          input.options = this.categoryOptions;
        }
      });
    });
  }

  /**
   * Carrega os dados do item para edição
   */
  private loadItemForEditing() {
    if (!this.itemToEdit) return;

    const componentEntry = Array.from(COMPONENT_INPUTS_MAP.entries()).find(
      ([componentClass]) => componentClass === this.itemToEdit!.component
    );

    if (componentEntry) {
      const [componentClass, config] = componentEntry;
      this.selectedComponent = {
        component: componentClass,
        name: config.name,
        inputsConfig: config.inputs,
      };

      this.showDimensionsForm = true;

      this.initInputsForm(config.inputs);

      // Primeiro, definimos rowSpan e colSpan
      this.componentForm.patchValue({
        rowSpan: this.itemToEdit.rowSpan,
        colSpan: this.itemToEdit.colSpan,
      });

      // Depois carregamos os inputs um por um para garantir que sejam aplicados corretamente
      const inputsFormGroup = this.componentForm.get('inputs') as FormGroup;

      if (this.itemToEdit && this.itemToEdit.inputs) {
        Object.keys(this.itemToEdit.inputs).forEach(key => {
          const control = inputsFormGroup.get(key);
          const value = this.itemToEdit!.inputs[key];

          if (control) {
            // Para arrays (como images, categories, formats, sizes), precisamos tratar diferente
            if (Array.isArray(value)) {
              // Se for um FormArray (como images)
              if (control instanceof FormArray) {
                control.clear();
                value.forEach((item: any) => {
                  control.push(this.fb.control(item));
                });
              } else {
                // Se for um control normal que aceita array (como categories, formats, sizes)
                control.setValue(value);
              }
            } else {
              // Para valores simples
              control.setValue(value);
            }
          }
        });
      }

      // Carregar imagens
      if (this.itemToEdit.inputs.images && Array.isArray(this.itemToEdit.inputs.images)) {
        this.uploadedImagePaths = [...this.itemToEdit.inputs.images];
      } else if (this.itemToEdit.inputs.url) {
        this.uploadedImagePaths = [this.itemToEdit.inputs.url];
      }
    }
  }

  /**
   * Seleciona um componente da lista disponível e inicializa o formulário de inputs com base na configuração do componente.
   * @param component O componente selecionado, contendo informações como nome e configuração de inputs.
   */
  selectComponent(component: any) {
    console.log('Componente selecionado:', component);
    this.selectedComponent = component;
    this.showDimensionsForm = true;
    this.initInputsForm(component.inputsConfig);
    console.log('Formulário inicializado:', this.componentForm.value);
  }

  /**
   * Inicializa o formulário de inputs baseado na configuração fornecida
   * @param inputsConfig Array de configurações dos inputs
   */
  initInputsForm(inputsConfig: any[]) {
    const inputsGroup = this.fb.group({});

    inputsConfig.forEach(input => {
      if (input.type === 'multiple-text') {
        const arrayControls = input.defaultValue.map((defaultVal: string) =>
          this.fb.control(defaultVal)
        );
        inputsGroup.addControl(input.name, this.fb.array(arrayControls));
      } else if (input.type === 'multi-select') {
        inputsGroup.addControl(input.name, this.fb.control(input.defaultValue || []));
      } else if (input.type === 'product-sizes') {
        inputsGroup.addControl(input.name, this.fb.control(input.defaultValue || []));
      } else {
        inputsGroup.addControl(input.name, this.fb.control(input.defaultValue || ''));
      }
    });

    this.componentForm.setControl('inputs', inputsGroup);
  }

  /**
   * Getter para acessar os controles do formulário de inputs
   */
  get inputControls() {
    return (this.componentForm.get('inputs') as FormGroup).controls;
  }

  /**
   * Recupera o FormArray de um input múltiplo
   * @param inputName Nome do input
   */
  getMultipleInputControl(inputName: string): FormArray {
    return this.componentForm.get(['inputs', inputName]) as FormArray;
  }

  /**
   * Adiciona um novo item ao FormArray de um input múltiplo
   * @param inputName Nome do input
   */
  addMultipleInputItem(inputName: string) {
    this.getMultipleInputControl(inputName).push(this.fb.control(''));
  }

  /**
   * Remove um item de um FormArray de input múltiplo
   * @param inputName Nome do input
   * @param index Índice do item a ser removido
   */
  removeMultipleInputItem(inputName: string, index: number) {
    this.getMultipleInputControl(inputName).removeAt(index);
  }

  /**
   * Alterna a seleção de uma categoria no multi-select
   */
  toggleCategorySelection(inputName: string, category: string) {
    const control = this.componentForm.get(['inputs', inputName]);
    if (!control) return;

    const currentValue: string[] = control.value || [];
    const index = currentValue.indexOf(category);

    if (index > -1) {
      // Remove se já está selecionado
      currentValue.splice(index, 1);
    } else {
      // Adiciona se não está selecionado
      currentValue.push(category);
    }

    control.setValue([...currentValue]);
  }

  isCategorySelected(inputName: string, category: string): boolean {
    const control = this.componentForm.get(['inputs', inputName]);
    if (!control) {
      return false;
    }

    const currentValue: string[] = control.value || [];
    return currentValue.includes(category);
  }

  /**
   * Retorna o nome formatado de uma categoria (emoji + nome)
   */
  getCategoryDisplayName(categorySlug: string): string {
    const category = this.categories.find(cat => cat.slug === categorySlug);
    if (category) {
      return `${category.emoji} ${category.name}`;
    }
    // Fallback se não encontrar a categoria
    return categorySlug;
  }

  /**
   * Retorna o nome descritivo de um formato
   */
  getFormatDisplayName(format: string): string {
    const formatNames: { [key: string]: string } = {
      '1x1': '📐 1x1 - Quadrado (1 célula)',
      '1x2': '📏 1x2 - Retângulo Vertical (2 células de altura)',
      '2x1': '📏 2x1 - Retângulo Horizontal (2 células de largura)',
      '2x2': '📦 2x2 - Grande (4 células)',
    };
    return formatNames[format] || format;
  }

  /**
   * Cria um novo item com base nos valores do formulário
   */
  createItem() {
    if (this.selectedFiles.length > 0 && this.uploadedImagePaths.length === 0) {
      this.isUploading = true;

      const tempId = this.generateTempProductId();
      this.currentTempId = tempId;

      this.imageUploadService.uploadImages(tempId, this.selectedFiles).subscribe({
        next: paths => {
          this.uploadedImagePaths = paths;
          this.isUploading = false;

          this.finalizeItemCreation();
        },
        error: err => {
          this.isUploading = false;
          console.error('❌ Erro no upload:', err);
          alert('Erro ao fazer upload das imagens. Tente novamente.');
        },
      });
    } else {
      this.finalizeItemCreation();
    }
  }

  private finalizeItemCreation() {
    const formValue = this.componentForm.value;

    let rowSpan = formValue.rowSpan || 1;
    let colSpan = formValue.colSpan || 1;
    let format = formValue.inputs?.format || '1x1';

    if (formValue.inputs?.format && !this.selectedComponent.name.includes('Filler')) {
      const [cols, rows] = formValue.inputs.format.split('x').map(Number);
      colSpan = cols;
      rowSpan = rows;
      format = formValue.inputs.format;
    }

    const inputs = {
      ...formValue.inputs,
      format: format,
    };

    if (this.uploadedImagePaths.length > 0) {
      if (this.hasInput('url') && !this.hasInput('images')) {
        inputs.url = this.uploadedImagePaths[0];
      } else if (this.hasInput('images')) {
        inputs.images = this.uploadedImagePaths;
      }
    }

    const newItem = {
      component: this.selectedComponent.component,
      rowSpan: rowSpan,
      colSpan: colSpan,
      inputs: inputs,
      tempId: this.uploadedImagePaths.length > 0 ? this.currentTempId : null,
    };

    this.itemCreated.emit(newItem);
    this.closeModal();
  }

  /**
   * Handler para seleção de arquivos de imagem
   */
  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);

      const validFiles = this.imageUploadService.validateFiles(files);

      if (validFiles.length > 0) {
        this.selectedFiles = validFiles;
      }
    }
  }

  uploadImages(productId: string) {
    if (this.selectedFiles.length === 0) {
      return;
    }

    this.isUploading = true;

    this.imageUploadService.uploadImages(productId, this.selectedFiles).subscribe({
      next: paths => {
        this.uploadedImagePaths = paths;
        this.isUploading = false;

        const imagesControl = this.componentForm.get(['inputs', 'images']);
        if (imagesControl) {
          imagesControl.setValue(paths);
        }
      },
      error: err => {
        this.isUploading = false;
        console.error('❌ Erro no upload:', err);
        alert('Erro ao fazer upload das imagens. Tente novamente.');
      },
    });
  }

  /**
   * Remove uma imagem da lista
   */
  removeUploadedImage(index: number) {
    const imagePath = this.uploadedImagePaths[index];

    const confirmDelete = confirm('Deseja remover esta imagem?');
    if (!confirmDelete) return;

    this.imageUploadService.deleteImage(imagePath).subscribe({
      next: () => {
        this.uploadedImagePaths.splice(index, 1);
      },
      error: err => {
        console.error('❌ Erro ao remover imagem:', err);
      },
    });
  }

  /**
   * Verifica se o componente suporta upload de imagens
   */
  supportsImageUpload(): boolean {
    if (!this.selectedComponent) return false;

    return this.selectedComponent.inputsConfig.some(
      (input: any) => input.name === 'images' || input.name === 'url'
    );
  }

  /**
   * Verifica se o componente tem um input específico
   */
  hasInput(inputName: string): boolean {
    if (!this.selectedComponent) return false;
    return this.selectedComponent.inputsConfig.some((input: any) => input.name === inputName);
  }

  /**
   * Gera um ID temporário para o produto
   */
  generateTempProductId(): string {
    return `temp-${Date.now()}`;
  }

  // ===== Gerenciamento de Tamanhos de Produtos =====

  /**
   * Retorna o array de tamanhos do produto
   */
  getProductSizes(): ProductSize[] {
    const sizesControl = this.componentForm.get(['inputs', 'sizes']);
    return sizesControl?.value || [];
  }

  /**
   * Adiciona um novo tamanho ao produto
   */
  addProductSize() {
    if (!this.tempSize.name || !this.tempSize.abbreviation || this.tempSize.price <= 0) {
      alert('Preencha todos os campos do tamanho');
      return;
    }

    const sizesControl = this.componentForm.get(['inputs', 'sizes']);
    if (!sizesControl) return;

    const currentSizes: ProductSize[] = sizesControl.value || [];
    currentSizes.push({ ...this.tempSize });
    sizesControl.setValue(currentSizes);

    // Reseta o formulário temporário
    this.tempSize = { name: '', abbreviation: '', price: 0 };
  }

  /**
   * Inicia a edição de um tamanho
   */
  startEditSize(index: number) {
    const sizes = this.getProductSizes();
    this.editingSizeIndex = index;
    this.tempSize = { ...sizes[index] };
  }

  /**
   * Salva as alterações de um tamanho editado
   */
  saveEditSize() {
    if (this.editingSizeIndex === null) return;

    if (!this.tempSize.name || !this.tempSize.abbreviation || this.tempSize.price <= 0) {
      alert('Preencha todos os campos do tamanho');
      return;
    }

    const sizesControl = this.componentForm.get(['inputs', 'sizes']);
    if (!sizesControl) return;

    const currentSizes: ProductSize[] = [...(sizesControl.value || [])];
    currentSizes[this.editingSizeIndex] = { ...this.tempSize };
    sizesControl.setValue(currentSizes);

    this.cancelEditSize();
  }

  /**
   * Cancela a edição de um tamanho
   */
  cancelEditSize() {
    this.editingSizeIndex = null;
    this.tempSize = { name: '', abbreviation: '', price: 0 };
  }

  /**
   * Remove um tamanho da lista
   */
  removeProductSize(index: number) {
    if (!confirm('Deseja remover este tamanho?')) return;

    const sizesControl = this.componentForm.get(['inputs', 'sizes']);
    if (!sizesControl) return;

    const currentSizes: ProductSize[] = [...(sizesControl.value || [])];
    currentSizes.splice(index, 1);
    sizesControl.setValue(currentSizes);
  }

  /**
   * Converte um Product para GridItem
   */
  productToGridItem(product: Product): GridItem {
    return {
      id: Date.now(), // ID temporário
      row: 0,
      col: 0,
      component: SimpleProductComponent,
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
      },
    };
  }

  /**
   * Converte um GridItem para Product
   */
  gridItemToProduct(item: GridItem): Product {
    return {
      name: item.inputs.productName,
      description: item.inputs.description,
      price: item.inputs.price,
      sizes: item.inputs.sizes,
      images: item.inputs.images,
      category: item.inputs.category,
      format: item.inputs.format,
      colorMode: item.inputs.colorMode,
      available: true,
    };
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

    // Usa o primeiro formato como padrão para rowSpan/colSpan
    const defaultFormat = filler.formats[0] || '1x1';

    return {
      id: Date.now(), // ID temporário
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
  gridItemToFiller(item: GridItem): Filler {
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

  closeModal() {
    this.modalClosed.emit();
    this.resetForm();
  }

  /**
   * Reseta o formulário ao fechar o modal
   */
  private resetForm() {
    this.selectedComponent = null;
    this.showDimensionsForm = false;
    this.selectedFiles = [];
    this.uploadedImagePaths = [];
    this.isUploading = false;
    this.currentTempId = null;
    this.editingSizeIndex = null;
    this.tempSize = { name: '', abbreviation: '', price: 0 };
    this.componentForm.reset({
      rowSpan: 1,
      colSpan: 1,
    });
  }
}
