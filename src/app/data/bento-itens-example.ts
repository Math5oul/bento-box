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
    isFiller: true,
  },
  {
    id: 1,
    component: SimpleTextComponent,
    inputs: {
      text: `<h2 style="color: #000000;">Grand Café</h2>
             <p style="margin-bottom: 8px;">Rejoignez-nous pour l'inauguration de Café Aromático, votre nouveau lieu de prédilection pour le café et les pâtisseries.</p>
             <p style="margin-bottom: 8px;">Découvrez les meilleurs breuvages et délices faits main dans une ambiance chaleureuse.</p>`,
      background: '#F39C12',
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
    isFiller: false,
  },
  {
    id: 2,
    component: SimpleProductComponent,
    inputs: {
      format: "1x2",
      images: ["https://images.unsplash.com/photo-1481391032119-d89fee407e44?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1481391032119-d89fee407e44?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"],
      colorMode: 'dark',
      productName: "Hot Chocolat",
      description: "Boisson chaude composée de chocolat râpé ou fondu et de lait",
      price: 14.99,
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
    isFiller: false,
  },
  {
    id: 3,
    component: SimpleProductComponent,
    inputs: {
      format: "1x1",
      images: ["https://via.placeholder.com/160", "https://via.placeholder.com/160", "https://via.placeholder.com/160"],
      productName: "Expresso",
      description: "Noir comme l'âme de votre propriétaire, venez goûter",
      price: 4.99,
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    isFiller: false,
  },
  {
    id: 4,
    component: SimpleTextComponent,
    inputs: {
      text: `<h4 style="color: #FFFFFF;">Découvrez Notre Menu</h4>
             <p style="color: #FFFFFF; margin-bottom: 8px;">Découvrez nos délicieuses offres, du café aux pâtisseries.</p>`,
      background: '#C70039',
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    isFiller: false,
  },
  {
    id: 5,
    component: SimpleProductComponent,
    inputs: {
      format: "1x1",
      colorMode: 'light',
      images: ["https://via.placeholder.com/160","https://via.placeholder.com/160","https://via.placeholder.com/160"],
      productName: "Latte",
      description: "Le meilleur café au lait de la ville",
      price: 6.99,
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    isFiller: false,
  },
  {
    id: 6,
    component: SimpleImageComponent,
    inputs: {
      url: 'https://images.unsplash.com/photo-1502045856-4882464b27a9?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      width: 160,
      height: 320,
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
    isFiller: false,
  },
  {
    id: 7,
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
    isFiller: false,
  },
  {
    id: 8,
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
    isFiller: false,
  },
  {
    id: 9,
    component: SimpleImageComponent,
    inputs: {
      url: 'https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      width: 160,
      height: 160,
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
    isFiller: false,
  },
  {
    id: 10,
    component: SimpleProductComponent,
    inputs: {
      format: "2x1",
      images: ["https://images.unsplash.com/photo-1494314671902-399b18174975?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1494314671902-399b18174975?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1494314671902-399b18174975?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"],
      colorMode: 'dark',
      productName: "Cappuccino",
      description: "Intense, avec des parts égales de lait et de mousse.",
      price: 11.99,
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
    isFiller: false,
  },
];
