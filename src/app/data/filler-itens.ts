import { SimpleImageComponent } from '../components/simpleComponents/simple-image/simple-image.component';
import { SimpleTextComponent } from '../components/simpleComponents/simple-text/simple-text.component';
import { SimpleVideoComponent } from '../components/simpleComponents/simple-video/simple-video.component';
import { GridItem } from '../interfaces/bento-box.interface';

export const fillerExamples: GridItem[] = [
  {
    id: 22,
    component: SimpleImageComponent,
    inputs: {
      url: 'https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 21,
    component: SimpleVideoComponent,
    inputs: {
      videoUrl:
        'https://cdn.pixabay.com/video/2024/03/21/205006-926015709_large.mp4',
      autoplay: true,
      controls: true,
      loop: true,
    },
    colSpan: 2,
    rowSpan: 2,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 20,
    component: SimpleTextComponent,
    inputs: {
      text: `<h2 style="color: #FFFFFF;">Maintenant Ouvert</h2>
                 <p style="color: #FFFFFF; margin-bottom: 8px;">Découvrez les riches saveurs de notre café fraîchement préparé au Café Aromático.</p>
                 <p style="color: #FFFFFF; margin-bottom: 8px;">Profitez de nos mélanges signature dans une ambiance chaleureuse et accueillante.</p>`,
      background: '#900C3F',
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
    category: '',
  },

  {
    id: 22,
    component: SimpleImageComponent,
    inputs: {
      url: 'https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?q=80&w=1740&auto=format&fit=crop',
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
    category: 'coffee',
  },
  {
    id: 21,
    component: SimpleVideoComponent,
    inputs: {
      videoUrl:
        'https://cdn.pixabay.com/video/2024/03/21/205006-926015709_large.mp4',
      autoplay: true,
      controls: true,
      loop: true,
    },
    colSpan: 2,
    rowSpan: 2,
    row: 0,
    col: 0,
    category: 'promo',
  },
  {
    id: 20,
    component: SimpleTextComponent,
    inputs: {
      text: `<h2 style="color: #FFFFFF;">Maintenant Ouvert</h2>
             <p style="color: #FFFFFF; margin-bottom: 8px;">Découvrez les riches saveurs de notre café fraîchement préparé au Café Aromático.</p>
             <p style="color: #FFFFFF; margin-bottom: 8px;">Profitez de nos mélanges signature dans une ambiance chaleureuse et accueillante.</p>`,
      background: '#900C3F',
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
    category: 'announcement',
  },

  // --- Novos fillers de texto ---

  {
    id: 30,
    component: SimpleTextComponent,
    inputs: {
      text: `<h3 style="margin:0;color:#FFFFFF;">Promo Especial</h3>
             <p style="margin:0;color:#FFFFFF;">Compre 1 café e ganhe outro grátis!</p>`,
      background: '#FF6F61',
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: 'promo',
  },
  {
    id: 31,
    component: SimpleTextComponent,
    inputs: {
      text: `<h3 style="margin:0;color:#000000;">Novidade</h3>
             <p style="margin:0;color:#000000;">Torta de maçã caseira fresquinha 🍏</p>`,
      background: '#FAD02E',
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: 'menu',
  },
  {
    id: 32,
    component: SimpleTextComponent,
    inputs: {
      text: `<h3 style="margin:0;color:#FFFFFF;">Horário Especial</h3>
             <p style="margin:0;color:#FFFFFF;">Aberto até as 22h neste sábado</p>`,
      background: '#1E3D59',
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: 'info',
  },
  {
    id: 33,
    component: SimpleTextComponent,
    inputs: {
      text: `<h3 style="margin:0;color:#FFFFFF;">Wi-Fi Grátis</h3>
             <p style="margin:0;color:#FFFFFF;">Peça a senha no balcão</p>`,
      background: '#4CAF50',
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: 'service',
  },
  {
    id: 34,
    component: SimpleTextComponent,
    inputs: {
      text: `<h3 style="margin:0;color:#000000;">Sugestão do Dia</h3>
             <p style="margin:0;color:#000000;">Cappuccino com canela ☕</p>`,
      background: '#F0E68C',
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: 'menu',
  },
  {
    id: 35,
    component: SimpleTextComponent,
    inputs: {
      text: `<h3 style="margin:0;color:#FFFFFF;">Peça pelo App</h3>
             <p style="margin:0;color:#FFFFFF;">Retire sem filas</p>`,
      background: '#FF4500',
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: 'order',
  },
  // 2x2 Fillers
  {
    id: 1,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x2 - 1',
      background: '#A9A9A9', // DarkGray
    },
    colSpan: 2,
    rowSpan: 2,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 2,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x2 - 2',
      background: '#BEBEBE', // Gray
    },
    colSpan: 2,
    rowSpan: 2,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 3,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x2 - 3',
      background: '#C0C0C0', // Silver
    },
    colSpan: 2,
    rowSpan: 2,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 4,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x2 - 4',
      background: '#D3D3D3', // LightGray
    },
    colSpan: 2,
    rowSpan: 2,
    row: 0,
    col: 0,
    category: '',
  },

  // 2x1 Fillers
  {
    id: 5,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x1 - 1',
      background: '#DCDCDC', // Gainsboro
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 6,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x1 - 2',
      background: '#E0E0E0', // LightGray (slightly different)
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 7,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x1 - 3',
      background: '#A9A9A9', // DarkGray (slightly darker)
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 8,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 2x1 - 4',
      background: '#BEBEBE', // Gray (slightly different)
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: '',
  },

  // 1x2 Fillers
  {
    id: 9,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x2 - 1',
      background: '#C0C0C0', // Silver
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 10,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x2 - 2',
      background: '#D3D3D3', // LightGray
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 11,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x2 - 3',
      background: '#DCDCDC', // Gainsboro
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 12,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x2 - 4',
      background: '#E0E0E0', // LightGray (slightly different)
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
    category: '',
  },

  // 1x1 Fillers
  {
    id: 13,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x1 - 1',
      background: '#A9A9A9', // DarkGray
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 14,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x1 - 2',
      background: '#BEBEBE', // Gray
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 15,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x1 - 3',
      background: '#C0C0C0', // Silver
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 16,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x1 - 4',
      background: '#D3D3D3', // LightGray
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 17,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x1 - 5',
      background: '#D8D8D8', // Light Gray
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 18,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x1 - 6',
      background: '#E0E0E0', // Gainsboro
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 19,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x1 - 7',
      background: '#E8E8E8', // Bright Gray
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: '',
  },
  {
    id: 20,
    component: SimpleTextComponent,
    inputs: {
      text: 'Filler 1x1 - 8',
      background: '#F0F0F0', // White Smoke
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    category: '',
  },
];
