import { GridItem } from '../interfaces/bento-box.interface';
import { SimpleTextComponent } from '../simpleComponents/simple-text/simple-text.component';

export const fillerOptions: GridItem[] = [
  // 2x2 Fillers
  {
    id: 1,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x2 - 1',
      background: '#A9A9A9' // DarkGray
    },
    colSpan: 2,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 2,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x2 - 2',
      background: '#BEBEBE' // Gray
    },
    colSpan: 2,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 3,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x2 - 3',
      background: '#C0C0C0' // Silver
    },
    colSpan: 2,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 4,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x2 - 4',
      background: '#D3D3D3' // LightGray
    },
    colSpan: 2,
    rowSpan: 2,
    row: 0,
    col: 0,
  },

  // 2x1 Fillers
  {
    id: 5,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x1 - 1',
      background: '#DCDCDC' // Gainsboro
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 6,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x1 - 2',
      background: '#E0E0E0' // LightGray (slightly different)
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 7,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x1 - 3',
      background: '#A9A9A9' // DarkGray (slightly darker)
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 8,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x1 - 4',
      background: '#BEBEBE' // Gray (slightly different)
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
  },

  // 1x2 Fillers
  {
    id: 9,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x2 - 1',
      background: '#C0C0C0' // Silver
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 10,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x2 - 2',
      background: '#D3D3D3' // LightGray
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 11,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x2 - 3',
      background: '#DCDCDC' // Gainsboro
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 12,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x2 - 4',
      background: '#E0E0E0' // LightGray (slightly different)
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
  },

  // 1x1 Fillers
  {
    id: 13,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x1 - 1',
      background: '#A9A9A9' // DarkGray
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 14,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x1 - 2',
      background: '#BEBEBE' // Gray
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 15,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x1 - 3',
      background: '#C0C0C0' // Silver
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 16,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x1 - 4',
      background: '#D3D3D3' // LightGray
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
];
