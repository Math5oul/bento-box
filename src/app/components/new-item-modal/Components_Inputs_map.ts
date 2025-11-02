import { Type } from '@angular/core';
import { SimpleImageComponent } from '../simpleComponents/simple-image/simple-image.component';
import { SimpleProductComponent } from '../simpleComponents/simple-product/simple-product.component';
import { SimpleTextComponent } from '../simpleComponents/simple-text/simple-text.component';
import { SimpleVideoComponent } from '../simpleComponents/simple-video/simple-video.component';

export interface InputConfig {
  name: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'color'
    | 'richtext'
    | 'select'
    | 'checkbox'
    | 'multiple-text'
    | 'multi-select'
    | 'product-sizes';
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  step?: number;
  options?: string[] | readonly string[];
}

export interface ComponentConfig {
  name: string;
  inputs: InputConfig[];
}

/**
 * Mapeamento de componentes disponíveis e suas configurações de inputs
 * Ordem: Produto primeiro, depois Fillers (Texto, Imagem, Vídeo)
 */
export const COMPONENT_INPUTS_MAP: Map<Type<any>, ComponentConfig> = new Map<
  Type<any>,
  ComponentConfig
>([
  [
    SimpleProductComponent,
    {
      name: 'Produto',
      inputs: [
        {
          name: 'images',
          label: 'Imagens do Produto',
          type: 'multiple-text',
          placeholder: 'Faça upload das imagens abaixo',
          defaultValue: [''],
        },
        {
          name: 'format',
          label: 'Formato do Produto',
          type: 'select',
          options: ['1x1', '1x2', '2x1', '2x2'],
          defaultValue: '1x1',
          required: true,
        },
        {
          name: 'category',
          label: 'Categoria',
          type: 'select',
          options: [], // Será preenchido dinamicamente com as categorias do banco
          defaultValue: '',
          required: true,
        },
        {
          name: 'colorMode',
          label: 'Tema',
          type: 'select',
          options: ['light', 'dark'],
          defaultValue: 'light',
        },
        {
          name: 'productName',
          label: 'Nome do Produto',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          label: 'Descrição',
          type: 'richtext',
        },
        {
          name: 'price',
          label: 'Preço Base',
          type: 'number',
          step: 0.01,
        },
        {
          name: 'sizes',
          label: 'Tamanhos Disponíveis',
          type: 'product-sizes',
          defaultValue: [],
        },
      ],
    },
  ],
  [
    SimpleTextComponent,
    {
      name: 'Texto (Filler)',
      inputs: [
        {
          name: 'text',
          label: 'Texto (HTML)',
          type: 'richtext',
          required: true,
          defaultValue: '<p>Insira seu texto aqui</p>',
        },
        {
          name: 'background',
          label: 'Cor de Fundo',
          type: 'color',
          defaultValue: '#FFFFFF',
        },
        {
          name: 'categories',
          label: 'Categorias onde pode ser exibido',
          type: 'multi-select',
          options: [], // Será preenchido dinamicamente com as categorias do banco
          defaultValue: [],
        },
        {
          name: 'formats',
          label: 'Formatos válidos',
          type: 'multi-select',
          options: ['1x1', '1x2', '2x1', '2x2'],
          defaultValue: ['1x1'],
        },
      ],
    },
  ],
  [
    SimpleImageComponent,
    {
      name: 'Imagem (Filler)',
      inputs: [
        {
          name: 'url',
          label: 'Imagem',
          type: 'text',
          required: false,
          defaultValue: '',
          placeholder: 'Faça upload da imagem abaixo',
        },
        {
          name: 'categories',
          label: 'Categorias onde pode ser exibido',
          type: 'multi-select',
          options: [], // Será preenchido dinamicamente com as categorias do banco
          defaultValue: [],
        },
        {
          name: 'formats',
          label: 'Formatos válidos',
          type: 'multi-select',
          options: ['1x1', '1x2', '2x1', '2x2'],
          defaultValue: ['1x1'],
        },
      ],
    },
  ],
  [
    SimpleVideoComponent,
    {
      name: 'Vídeo (Filler)',
      inputs: [
        {
          name: 'videoUrl',
          label: 'URL do Vídeo',
          type: 'text',
          required: true,
          placeholder: 'https://example.com/video.mp4',
        },
        {
          name: 'autoplay',
          label: 'Reproduzir automaticamente',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'controls',
          label: 'Mostrar controles',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'loop',
          label: 'Repetir',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'categories',
          label: 'Categorias onde pode ser exibido',
          type: 'multi-select',
          options: [], // Será preenchido dinamicamente com as categorias do banco
          defaultValue: [],
        },
        {
          name: 'formats',
          label: 'Formatos válidos',
          type: 'multi-select',
          options: ['1x1', '1x2', '2x1', '2x2'],
          defaultValue: ['1x1'],
        },
      ],
    },
  ],
]);
