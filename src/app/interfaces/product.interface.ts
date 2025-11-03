export interface ProductSize {
  name: string;
  abbreviation: string;
  price: number;
}

export interface ProductVariation {
  title: string;
  description?: string;
  image?: string;
  price: number;
}

export interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  sizes?: ProductSize[];
  images: string[];
  category: string;
  format?: '1x1' | '1x2' | '2x1' | '2x2';
  colorMode?: 'light' | 'dark';
  available: boolean;
  gridPosition?: {
    row: number;
    col: number;
    rowSpan: number;
    colSpan: number;
  };
  variations?: ProductVariation[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BatchPositionUpdate {
  id: string;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}
