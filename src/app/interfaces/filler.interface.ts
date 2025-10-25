/**
 * Interface para elementos Filler do grid
 */
export interface Filler {
  _id?: string;
  type: 'text' | 'image' | 'video';
  content: FillerContent;
  format?: '1x1' | '1x2' | '2x1' | '2x2';
  gridPosition?: GridPosition;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface para o conteúdo do Filler (varia por tipo)
 */
export interface FillerContent {
  text?: string; // Para tipo texto (HTML)
  url?: string; // Para imagem ou vídeo
  alt?: string; // Texto alternativo para imagem
}

/**
 * Interface para posição no grid
 */
export interface GridPosition {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}
