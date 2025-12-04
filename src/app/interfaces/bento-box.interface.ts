import { ProductVariation, ProductSize } from './product.interface';

export interface GridItem {
  id: number;
  component: any;
  inputs?: any;
  colSpan: number;
  rowSpan: number;
  row: number;
  col: number;
  variations?: ProductVariation[]; // Para produtos com variações
  sizes?: ProductSize[]; // Para produtos com tamanhos
  tempId?: string | null; // ID temporário para upload de imagens
}
