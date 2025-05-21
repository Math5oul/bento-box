import { Type } from '@angular/core';
import { SimpleTextComponent } from '../simpleComponents/simple-text/simple-text.component';
import { SimpleImageComponent } from '../simpleComponents/simple-image/simple-image.component';
import { SimpleProductComponent } from '../simpleComponents/simple-product/simple-product.component';
import { SimpleVideoComponent } from '../simpleComponents/simple-video/simple-video.component';

// Configuração de cada input de componente
export interface InputConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'textarea' | 'select' | 'checkbox' | 'multiple-text';
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  step?: number;
  options?: string[];
}

// Configuração associada a cada componente
export interface ComponentConfig {
  name: string;
  inputs: InputConfig[];
}

/**
 * Mapeamento de componentes disponíveis e suas configurações de inputs.
 * A chave é o tipo de componente (classe) para uso direto com *ngComponentOutlet.
 */
export const COMPONENT_INPUTS_MAP: Map<Type<any>, ComponentConfig> = new Map<Type<any>, ComponentConfig>([
  [SimpleTextComponent, {
    name: 'Texto',
    inputs: [
      {
        name: 'text',
        label: 'Texto (HTML)',
        type: 'textarea',
        required: true,
        defaultValue: '<p>Insira seu texto aqui</p>'
      },
      {
        name: 'background',
        label: 'Cor de Fundo',
        type: 'color',
        defaultValue: '#FFFFFF'
      }
    ]
  }],
  [SimpleImageComponent, {
    name: 'Imagem',
    inputs: [
      {
        name: 'url',
        label: 'URL da Imagem',
        type: 'text',
        required: true,
        placeholder: 'https://example.com/image.jpg'
      },
      {
        name: 'width',
        label: 'Largura (px)',
        type: 'number',
        defaultValue: 320
      },
      {
        name: 'height',
        label: 'Altura (px)',
        type: 'number',
        defaultValue: 160
      }
    ]
  }],
  [SimpleProductComponent, {
    name: 'Produto',
    inputs: [
      {
        name: 'format',
        label: 'Formato',
        type: 'select',
        options: ['1x1', '1x2', '2x1'],
        defaultValue: '1x1'
      },
      {
        name: 'images',
        label: 'URLs das Imagens',
        type: 'multiple-text',
        placeholder: 'https://example.com/image.jpg',
        defaultValue: ['']
      },
      {
        name: 'colorMode',
        label: 'Tema',
        type: 'select',
        options: ['light', 'dark'],
        defaultValue: 'light'
      },
      {
        name: 'productName',
        label: 'Nome do Produto',
        type: 'text',
        required: true
      },
      {
        name: 'description',
        label: 'Descrição',
        type: 'textarea'
      },
      {
        name: 'price',
        label: 'Preço',
        type: 'number',
        step: 0.01
      }
    ]
  }],
  [SimpleVideoComponent, {
    name: 'Vídeo',
    inputs: [
      {
        name: 'videoUrl',
        label: 'URL do Vídeo',
        type: 'text',
        required: true,
        placeholder: 'https://example.com/video.mp4'
      },
      {
        name: 'width',
        label: 'Largura (px)',
        type: 'number',
        defaultValue: 320
      },
      {
        name: 'height',
        label: 'Altura (px)',
        type: 'number',
        defaultValue: 320
      },
      {
        name: 'autoplay',
        label: 'Reproduzir automaticamente',
        type: 'checkbox',
        defaultValue: false
      },
      {
        name: 'controls',
        label: 'Mostrar controles',
        type: 'checkbox',
        defaultValue: true
      },
      {
        name: 'loop',
        label: 'Repetir',
        type: 'checkbox',
        defaultValue: false
      }
    ]
  }]
]);
