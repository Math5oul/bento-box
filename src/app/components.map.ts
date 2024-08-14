import { Type } from '@angular/core';
import { SimpleImageComponent } from './components/simpleComponents/simple-image/simple-image.component';
import { SimpleProductComponent } from './components/simpleComponents/simple-product/simple-product.component';
import { SimpleTextComponent } from './components/simpleComponents/simple-text/simple-text.component';
import { SimpleVideoComponent } from './components/simpleComponents/simple-video/simple-video.component';

export interface ComponentInputMap {
  component: Type<any>;
  inputs: { name: string; label: string; type: string; options?: string[];}[];
  gridDimensions: string[];
}

export const componentInputsMap: ComponentInputMap[] = [
  {
    component: SimpleTextComponent,
    inputs: [
      { name: 'text', label: 'Texto', type: 'html' },
      { name: 'background', label: 'Cor de fundo', type: 'text' },
    ],
    gridDimensions: ['1x1', '1x2', '2x1', '2x2'],
  },
  {
    component: SimpleImageComponent,
    inputs: [
      { name: 'url', label: 'Image URL', type: 'text' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
    ],
    gridDimensions: ['1x1', '1x2', '2x1', '2x2'],
  },
  {
    component: SimpleVideoComponent,
    inputs: [
      { name: 'videoUrl', label: 'Video URL', type: 'text' },
      { name: 'autoplay', label: 'Autoplay', type: 'boolean' },
      { name: 'controls', label: 'Habilitar controles', type: 'boolean' },
      { name: 'loop', label: 'Loop', type: 'boolean' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
    ],
    gridDimensions: ['1x1', '1x2', '2x1', '2x2'],
  },
  {
    component: SimpleProductComponent,
    inputs: [
      { name: 'productName', label: 'Nome do Produto', type: 'html' },
      { name: 'imageUrl', label: 'Image URL', type: 'text' },
      { name: 'price', label: 'Preço', type: 'html' },
      { name: 'productImage', label: 'URL da imagem', type: 'text' },
      {
        name: 'description',
        label: 'Product Description',
        type: 'html',
      },
      {
        name: 'format',
        label: 'Formato',
        type: 'select',
        options: ['1x1', '1x2', '2x1', '2x2'],
      },

      {
        name: 'colorMode',
        label: 'Color Mode',
        type: 'select',
        options: ['light', 'dark'],
      },
    ],
    gridDimensions: ['1x1', '1x2'],
  },
];
