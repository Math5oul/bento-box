export interface BentoOptions {
  createFillers: boolean;
  cellWidth: number;
  cellHeight: number;
  gridGap: number;
  maxCols: number;
  maxWidth: number;
  mode: 'autoFill' | 'edit';
}
