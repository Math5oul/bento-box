import { SimpleImageComponent } from '../components/simpleComponents/simple-image/simple-image.component';
import { SimpleProductComponent } from '../components/simpleComponents/simple-product/simple-product.component';
import { SimpleTextComponent } from '../components/simpleComponents/simple-text/simple-text.component';
import { SimpleVideoComponent } from '../components/simpleComponents/simple-video/simple-video.component';
import { GridItem } from '../interfaces/bento-box.interface';

export const dataExamples: GridItem[] = [
  {
    id: 0,
    component: SimpleImageComponent,
    inputs: {
      url: 'https://images.unsplash.com/photo-1564367133818-6ac5df7debfc?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      width: 320,
      height: 160,
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 1,
    component: SimpleTextComponent,
    inputs: {
      text: `<h2 style="color: #000000;">Lorem ipsum dolor</h2>
             <p style="margin-bottom: 8px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
             <p style="margin-bottom: 8px;">Phasellus imperdiet, nulla et dictum interdum.</p>
             <p style="margin-bottom: 0;">Cras pulvinar ornare justo, et aliquet ipsum tincidunt sit amet.</p>`,
      background: '#F39C12',
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 2,
    component: SimpleProductComponent,
    inputs: {
      format: "1x2",
      imageUrl: "https://images.unsplash.com/photo-1678358605468-e675edee820a?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      colorMode: 'dark',
      productName: "Anaë Gin",
      description: "Créé au sein du groupe familial Bollinger",
      price: "R$99.99",
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 3,
    component: SimpleProductComponent,
    inputs: {
      format: "1x1",
      imageUrl: "https://via.placeholder.com/160",
      productName: "Escuridão",
      description: "Capturado diretamente de um super apagão",
      price: "R$19.99",
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 4,
    component: SimpleProductComponent,
    inputs: {
      format: "1x1",
      colorMode: 'light',
      imageUrl: "https://via.placeholder.com/160",
      productName: "Clareza",
      description: "Contém o brilho de milhões de sois",
      price: "R$24.99",
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 5,
    component: SimpleTextComponent,
    inputs: {
      text: `<h3 style="color: #FFFFFF;">Lorem ipsum dolor</h3>
             <p style="color: #FFFFFF; margin-bottom: 8px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>`,
      background: '#C70039',
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 6,
    component: SimpleVideoComponent,
    inputs: {
      videoUrl: 'https://cdn.pixabay.com/video/2024/03/21/205006-926015709_large.mp4',
      width: 320,
      height: 320,
      autoplay: true,
      controls: true,
      loop: true,
    },
    colSpan: 2,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 7,
    component: SimpleTextComponent,
    inputs: {
      text: `<h2 style="color: #FFFFFF;">Lorem ipsum dolor</h2>
             <p style="color: #FFFFFF; margin-bottom: 8px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
             <p style="color: #FFFFFF; margin-bottom: 8px;">Phasellus imperdiet, nulla et dictum interdum, nisi lorem egestas odio.</p>
             <p style="color: #FFFFFF; margin-bottom: 8px;">Sed malesuada convallis lacus, at auctor dolor.</p>`,
      background: '#900C3F',
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 9,
    component: SimpleImageComponent,
    inputs: {
      url: 'https://images.unsplash.com/photo-1527761939622-9119094630cf?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      width: 160,
      height: 160,
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
];
