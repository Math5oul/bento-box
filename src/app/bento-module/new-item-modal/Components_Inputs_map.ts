import { Type } from '@angular/core';
import { SimpleImageComponent } from '../../components/simpleComponents/simple-image/simple-image.component';
import { SimpleProductComponent } from '../../components/simpleComponents/simple-product/simple-product.component';
import { SimpleTextComponent } from '../../components/simpleComponents/simple-text/simple-text.component';
import { SimpleVideoComponent } from '../../components/simpleComponents/simple-video/simple-video.component';

/**
 * Lista de categorias disponíveis para produtos e fillers
 */
export const PRODUCT_CATEGORIES = [
  'food',
  'hot beverage',
  'cold beverage',
  'dessert',
  'alcoholic',
  'beverage',
  'other',
] as const;

// Configuração de cada input de componente
export interface InputConfig {
  name: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'color'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'multiple-text'
    | 'multi-select';
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  step?: number;
  options?: string[] | readonly string[];
}

// Configuração associada a cada componente
export interface ComponentConfig {
  name: string;
  inputs: InputConfig[];
}

/**
 * Mapeamento de componentes disponíveis e suas configurações de inputs.
 * A chave é o tipo de componente (classe) para uso direto com *ngComponentOutlet.
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
          name: 'category',
          label: 'Categoria',
          type: 'select',
          options: PRODUCT_CATEGORIES,
          defaultValue: 'food',
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
          type: 'textarea',
        },
        {
          name: 'price',
          label: 'Preço',
          type: 'number',
          step: 0.01,
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
          type: 'textarea',
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
          options: PRODUCT_CATEGORIES,
          defaultValue: [],
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
          options: PRODUCT_CATEGORIES,
          defaultValue: [],
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
          options: PRODUCT_CATEGORIES,
          defaultValue: [],
        },
      ],
    },
  ],
]);
