import { GridItem } from '../interfaces/bento-box.interface';
import { SimpleImageComponent } from '../simpleComponents/simple-image/simple-image.component';
import { SimpleProductComponent } from '../simpleComponents/simple-product/simple-product.component';
import { SimpleTextComponent } from '../simpleComponents/simple-text/simple-text.component';
import { SimpleVideoComponent } from '../simpleComponents/simple-video/simple-video.component';

export const data: GridItem[] = [
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
      text: `1. <p style="margin-bottom: 8px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
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
      imageUrl: "https://images.unsplash.com/photo-1590922258688-6568a18e4385?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      color: 'light',
      productName: "Jägermeister",
      description: "Jägermeister é um digestivo alemão feito com 56 ervas e especiarias.",
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
      color: 'light',
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
      text: `5. <p style="color: #FFFFFF; margin-bottom: 8px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>`,
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
      text: `2. <p style="color: #FFFFFF; margin-bottom: 8px;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
             <p style="color: #FFFFFF; margin-bottom: 8px;">Phasellus imperdiet, nulla et dictum interdum, nisi lorem egestas odio.</p>
             <p style="color: #FFFFFF; margin-bottom: 8px;">Sed malesuada convallis lacus, at auctor dolor.</p>
             <p style="color: #FFFFFF; margin-bottom: 0;">Cras ultricies lacinia nibh. Etiam vel vulputate risus.</p>`,
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
