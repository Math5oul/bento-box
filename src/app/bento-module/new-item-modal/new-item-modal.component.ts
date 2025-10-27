import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
} from '@angular/forms';
import { COMPONENT_INPUTS_MAP } from './Components_Inputs_map';
import { ImageUploadService } from '../../services/image-upload/image-upload.service';
import { GridItem } from '../../interfaces/bento-box.interface';

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

  @Output() itemCreated = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();

  availableComponents = Array.from(COMPONENT_INPUTS_MAP.entries()).map(
    ([componentClass, config]) => ({
      component: componentClass,
      name: config.name,
      inputsConfig: config.inputs,
    })
  );

  selectedComponent: any = null;
  showDimensionsForm = false;
  componentForm: FormGroup;

  selectedFiles: File[] = [];
  uploadedImagePaths: string[] = [];
  isUploading = false;
  currentTempId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private imageUploadService: ImageUploadService
  ) {
    this.componentForm = this.fb.group({
      rowSpan: [1],
      colSpan: [1],
      inputs: this.fb.group({}),
    });
  }

  ngOnInit() {
    if (this.editMode && this.itemToEdit) {
      this.loadItemForEditing();
    }
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

      this.componentForm.patchValue({
        rowSpan: this.itemToEdit.rowSpan,
        colSpan: this.itemToEdit.colSpan,
        inputs: this.itemToEdit.inputs,
      });

      if (this.itemToEdit.inputs.categories && Array.isArray(this.itemToEdit.inputs.categories)) {
        const categoriesControl = this.componentForm.get(['inputs', 'categories']);
        if (categoriesControl) {
          categoriesControl.setValue([...this.itemToEdit.inputs.categories]);
        }
      }

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
    this.selectedComponent = component;
    this.showDimensionsForm = true;
    this.initInputsForm(component.inputsConfig);
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
   * Retorna o nome traduzido de uma categoria
   */
  getCategoryDisplayName(category: string): string {
    const categoryNames: { [key: string]: string } = {
      food: '🥐 Pratos',
      'hot beverage': '☕ Bebidas Quentes',
      'cold beverage': '🥤 Bebidas Frias',
      dessert: '🍰 Sobremesas',
      alcoholic: '🍺 Bebidas Alcoólicas',
      beverage: '🍹 Bebidas',
      other: '📦 Outros',
    };
    return categoryNames[category] || category;
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
    this.componentForm.reset({
      rowSpan: 1,
      colSpan: 1,
    });
  }
}
