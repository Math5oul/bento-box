import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
} from '@angular/forms';
import { COMPONENT_INPUTS_MAP } from './Components_Inputs_map';

@Component({
  selector: 'app-new-item-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './new-item-modal.component.html',
  styleUrls: ['./new-item-modal.component.scss'],
})
export class NewItemModalComponent {
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

  constructor(private fb: FormBuilder) {
    this.componentForm = this.fb.group({
      rowSpan: [1],
      colSpan: [1],
      inputs: this.fb.group({}),
    });
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

    inputsConfig.forEach((input) => {
      if (input.type === 'multiple-text') {
        const arrayControls = input.defaultValue.map((defaultVal: string) =>
          this.fb.control(defaultVal)
        );
        inputsGroup.addControl(input.name, this.fb.array(arrayControls));
      } else {
        inputsGroup.addControl(
          input.name,
          this.fb.control(input.defaultValue || '')
        );
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
   * Cria um novo item com base nos valores do formulário e emite o evento `itemCreated`.
   * Em seguida, fecha o modal.
   */
  createItem() {
    const formValue = this.componentForm.value;
    const newItem = {
      component: this.selectedComponent.component,
      rowSpan: formValue.rowSpan,
      colSpan: formValue.colSpan,
      inputs: formValue.inputs,
    };
    this.itemCreated.emit(newItem);
    this.closeModal();
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
    this.componentForm.reset({
      rowSpan: 1,
      colSpan: 1,
    });
  }
}
