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
  @Input() editMode = false; // Indica se está em modo de edição
  @Input() itemToEdit: GridItem | null = null; // Item a ser editado

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

  // Upload de imagens
  selectedFiles: File[] = [];
  uploadedImagePaths: string[] = [];
  isUploading = false;
  currentTempId: string | null = null; // Guarda o ID temporário usado no upload

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
    // Se estiver em modo de edição, inicializa com os dados do item
    if (this.editMode && this.itemToEdit) {
      this.loadItemForEditing();
    }
  }

  /**
   * Carrega os dados do item para edição
   */
  private loadItemForEditing() {
    if (!this.itemToEdit) return;

    console.log('🔧 Carregando item para edição:', this.itemToEdit);
    console.log('📋 Inputs do item:', this.itemToEdit.inputs);

    // Encontra o componente correspondente
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

      console.log('🔧 Componente selecionado:', this.selectedComponent.name);
      console.log('🔧 Config de inputs:', config.inputs);

      this.showDimensionsForm = true;

      // Inicializa o formulário com os dados existentes
      this.initInputsForm(config.inputs);

      // Popula os valores
      this.componentForm.patchValue({
        rowSpan: this.itemToEdit.rowSpan,
        colSpan: this.itemToEdit.colSpan,
        inputs: this.itemToEdit.inputs,
      });

      console.log('📝 Formulário populado com valores:', this.componentForm.value);

      // Se tem categorias (multi-select), garante que são carregadas corretamente
      if (this.itemToEdit.inputs.categories && Array.isArray(this.itemToEdit.inputs.categories)) {
        const categoriesControl = this.componentForm.get(['inputs', 'categories']);
        if (categoriesControl) {
          categoriesControl.setValue([...this.itemToEdit.inputs.categories]);
          console.log('📋 Categorias carregadas para edição:', this.itemToEdit.inputs.categories);
          console.log('📋 Valor do control após setValue:', categoriesControl.value);
        } else {
          console.warn('⚠️ Control de categorias não encontrado no formulário');
        }
      } else {
        console.log('📋 Item não possui categorias ou não é um array');
      }

      // Se tem imagens/url, adiciona aos uploadedImagePaths para exibir preview
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
   * Inicializa o formulário de inputs baseado na configuração fornecida pelo componente selecionado.
   * @param inputsConfig Array de configurações dos inputs, contendo nome, tipo e valor padrão.
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
        // Para multi-select, inicializa com array vazio ou valor padrão
        inputsGroup.addControl(input.name, this.fb.control(input.defaultValue || []));
      } else {
        inputsGroup.addControl(input.name, this.fb.control(input.defaultValue || ''));
      }
    });

    this.componentForm.setControl('inputs', inputsGroup);
  }

  /**
   * Getter para acessar os controles individuais do grupo de inputs do formulário.
   * @returns Um objeto com os controles do formulário de inputs.
   */
  get inputControls() {
    return (this.componentForm.get('inputs') as FormGroup).controls;
  }

  /**
   * Recupera o `FormArray` correspondente a um input do tipo múltiplo (ex: múltiplos textos).
   * @param inputName Nome do input que corresponde a um `FormArray`.
   * @returns O `FormArray` associado ao nome fornecido.
   */
  getMultipleInputControl(inputName: string): FormArray {
    return this.componentForm.get(['inputs', inputName]) as FormArray;
  }

  /**
   * Adiciona um novo controle de texto ao `FormArray` de um input múltiplo.
   * @param inputName Nome do input múltiplo ao qual será adicionado um novo item.
   */
  addMultipleInputItem(inputName: string) {
    this.getMultipleInputControl(inputName).push(this.fb.control(''));
  }

  /**
   * Remove um item específico de um `FormArray` de um input múltiplo com base no índice.
   * @param inputName Nome do input múltiplo.
   * @param index Índice do item a ser removido.
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

  /**
   * Verifica se uma categoria está selecionada no multi-select
   */
  isCategorySelected(inputName: string, category: string): boolean {
    const control = this.componentForm.get(['inputs', inputName]);
    if (!control) {
      console.log(`🔍 Control não encontrado para ${inputName}`);
      return false;
    }

    const currentValue: string[] = control.value || [];
    const isSelected = currentValue.includes(category);

    // Log apenas em modo de edição para não poluir o console
    if (this.editMode) {
      console.log(
        `🔍 isCategorySelected(${inputName}, ${category}):`,
        isSelected,
        'valores:',
        currentValue
      );
    }

    return isSelected;
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
   * Cria um novo item com base nos valores do formulário e emite o evento `itemCreated`.
   * Se houver o campo format ele preenche utilizando o valor de rowSpan e colSpan.
   * Em seguida, fecha o modal.
   */
  createItem() {
    // Se há arquivos selecionados mas não enviados, faz upload primeiro
    if (this.selectedFiles.length > 0 && this.uploadedImagePaths.length === 0) {
      console.log('⏳ Fazendo upload das imagens antes de criar o item...');
      this.isUploading = true;

      const tempId = this.generateTempProductId();
      this.currentTempId = tempId; // Salva o ID temporário

      this.imageUploadService.uploadImages(tempId, this.selectedFiles).subscribe({
        next: paths => {
          this.uploadedImagePaths = paths;
          this.isUploading = false;
          console.log('✅ Upload concluído automaticamente:', paths);

          // Agora cria o item com as imagens
          this.finalizeItemCreation();
        },
        error: err => {
          this.isUploading = false;
          console.error('❌ Erro no upload:', err);
          alert('Erro ao fazer upload das imagens. Tente novamente.');
        },
      });
    } else {
      // Se já tem imagens ou não tem arquivos, cria diretamente
      this.finalizeItemCreation();
    }
  }

  /**
   * Finaliza a criação do item após upload (se necessário)
   */
  private finalizeItemCreation() {
    const formValue = this.componentForm.value;

    // Formato correto: colSpan x rowSpan (largura x altura)
    const calculatedFormat = `${formValue.colSpan}x${formValue.rowSpan}`;

    // Prepara os inputs baseado no tipo de componente
    const inputs = {
      ...formValue.inputs,
      format: calculatedFormat,
    };

    // Se há imagens enviadas via upload, usa elas
    if (this.uploadedImagePaths.length > 0) {
      // Para SimpleImageComponent, usa apenas a primeira imagem no campo 'url'
      if (this.hasInput('url') && !this.hasInput('images')) {
        inputs.url = this.uploadedImagePaths[0];
      }
      // Para SimpleProductComponent, usa array de imagens
      else if (this.hasInput('images')) {
        inputs.images = this.uploadedImagePaths;
      }
    }

    const newItem = {
      component: this.selectedComponent.component,
      rowSpan: formValue.rowSpan,
      colSpan: formValue.colSpan,
      inputs: inputs,
      tempId: this.uploadedImagePaths.length > 0 ? this.currentTempId : null, // Adiciona o ID temporário se houver upload
    };

    this.itemCreated.emit(newItem);
    this.closeModal();
  }

  /**
   * Handler para seleção de arquivos de imagem
   */
  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    console.log('📁 Input multiple:', input.multiple);
    console.log('📁 Arquivos selecionados:', input.files?.length || 0);

    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);

      // Valida os arquivos
      const validFiles = this.imageUploadService.validateFiles(files);

      if (validFiles.length > 0) {
        this.selectedFiles = validFiles;
        console.log(`✅ ${validFiles.length} arquivo(s) selecionado(s)`);
      }
    }
  }

  /**
   * Faz upload das imagens selecionadas
   */
  uploadImages(productId: string) {
    if (this.selectedFiles.length === 0) {
      return;
    }

    this.isUploading = true;

    this.imageUploadService.uploadImages(productId, this.selectedFiles).subscribe({
      next: paths => {
        this.uploadedImagePaths = paths;
        this.isUploading = false;
        console.log('✅ Upload concluído:', paths);

        // Atualiza o form control de images se existir
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
   * Remove uma imagem da lista de uploads
   */
  removeUploadedImage(index: number) {
    const imagePath = this.uploadedImagePaths[index];

    const confirmDelete = confirm('Deseja remover esta imagem?');
    if (!confirmDelete) return;

    // Deleta do servidor
    this.imageUploadService.deleteImage(imagePath).subscribe({
      next: () => {
        this.uploadedImagePaths.splice(index, 1);
        console.log('✅ Imagem removida');
      },
      error: err => {
        console.error('❌ Erro ao remover imagem:', err);
      },
    });
  }

  /**
   * Verifica se o componente selecionado suporta upload de imagens
   */
  supportsImageUpload(): boolean {
    if (!this.selectedComponent) return false;

    // Verifica se o componente tem um input chamado 'images' ou 'url' (para imagem única)
    return this.selectedComponent.inputsConfig.some(
      (input: any) => input.name === 'images' || input.name === 'url'
    );
  }

  /**
   * Verifica se o componente tem um input específico
   */
  hasInput(inputName: string): boolean {
    if (!this.selectedComponent) return false;
    const result = this.selectedComponent.inputsConfig.some(
      (input: any) => input.name === inputName
    );
    console.log(`🔍 hasInput('${inputName}'):`, result);
    return result;
  }

  /**
   * Gera um ID temporário para o produto (será substituído pelo ID real)
   */
  generateTempProductId(): string {
    return `temp-${Date.now()}`;
  }

  closeModal() {
    this.modalClosed.emit();
    this.resetForm();
  }

  /**
   * Reseta o formulário, limpando o componente selecionado e restaurando os valores padrão.
   * Essa função é chamada internamente ao fechar o modal.
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
