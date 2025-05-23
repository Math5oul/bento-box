import { SimpleImageComponent } from "../components/simpleComponents/simple-image/simple-image.component";
import { SimpleProductComponent } from "../components/simpleComponents/simple-product/simple-product.component";
import { SimpleTextComponent } from "../components/simpleComponents/simple-text/simple-text.component";
import { SimpleVideoComponent } from "../components/simpleComponents/simple-video/simple-video.component";
import { GridItem } from "../interfaces/bento-box.interface";

export const dataExamples: GridItem[] = [
  {
    id: 1,
    component: SimpleProductComponent,
    inputs: {
      format: "1x1",
      images: [
        "https://plus.unsplash.com/premium_photo-1723903231073-29e8762d79a8?q=80&w=1780&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://via.placeholder.com/160",
        "https://via.placeholder.com/160",
      ],
      productName: "Expresso",
      description: "Noir comme l'âme de votre propriétaire, venez goûter",
      price: 4.99,
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 3,
    component: SimpleProductComponent,
    inputs: {
      format: "2x1",
      images: [
        "https://images.unsplash.com/photo-1494314671902-399b18174975?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1494314671902-399b18174975?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1494314671902-399b18174975?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      colorMode: "dark",
      productName: "Cappuccino",
      description: "Intense, avec des parts égales de lait et de mousse.",
      price: 11.99,
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 0,
    component: SimpleProductComponent,
    inputs: {
      format: "1x2",
      images: [
        "https://images.unsplash.com/photo-1481391032119-d89fee407e44?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1481391032119-d89fee407e44?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      colorMode: "dark",
      productName: "Hot Chocolat",
      description:
        "Boisson chaude composée de chocolat râpé ou fondu et de lait",
      price: 14.99,
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 20,
    component: SimpleTextComponent,
    inputs: {
      text: `<h2 style="color: #FFFFFF;">Maintenant Ouvert</h2>
             <p style="color: #FFFFFF; margin-bottom: 8px;">Découvrez les riches saveurs de notre café fraîchement préparé au Café Aromático.</p>
             <p style="color: #FFFFFF; margin-bottom: 8px;">Profitez de nos mélanges signature dans une ambiance chaleureuse et accueillante.</p>`,
      background: "#900C3F",
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
      format: "1x1",
      colorMode: "light",
      images: [
        "https://via.placeholder.com/160",
        "https://via.placeholder.com/160",
        "https://via.placeholder.com/160",
      ],
      productName: "Latte",
      description: "Le meilleur café au lait de la ville",
      price: 6.99,
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
      images: [
        'https://images.unsplash.com/photo-1593443320730-2d1d797c26b6?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/200x200/FFB6C1/FFFFFF',
        'https://via.placeholder.com/200x200/FFB6C1/FFFFFF'
      ],
      colorMode: "light",
      productName: "Americano",
      description: "Café espresso diluído em água quente, intenso e encorpado",
      price: 5.99,
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 5,
    component: SimpleProductComponent,
    inputs: {
      format: "1x2",
      images: [
        'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      ],
      colorMode: "dark",
      productName: "Mocha",
      description: "Espresso com chocolate e leite vaporizado, finalizado com chantilly",
      price: 8.50,
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 22,
    component: SimpleImageComponent,
    inputs: {
      url: "https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 21,
    component: SimpleVideoComponent,
    inputs: {
      videoUrl:
        "https://cdn.pixabay.com/video/2024/03/21/205006-926015709_large.mp4",
      autoplay: true,
      controls: true,
      loop: true,
    },
    colSpan: 2,
    rowSpan: 2,
    row: 0,
    col: 0,
  },


  /*




  {
    id: 22,
    component: SimpleImageComponent,
    inputs: {
      url: "https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 6,
    component: SimpleProductComponent,
    inputs: {
      format: "2x1",
      images: [
        'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/400x200/D2B48C/000000',
        'https://via.placeholder.com/400x200/D2B48C/000000'
      ],
      colorMode: "light",
      productName: "Donuts",
      description: "Donuts fresquinhos com cobertura de chocolate e granulado",
      price: 6.75,
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 7,
    component: SimpleProductComponent,
    inputs: {
      format: "1x1",
      images: [
        'https://images.unsplash.com/photo-1587080413959-06b859fb1076?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/200x200/FFE4E1/000000',
        'https://via.placeholder.com/200x200/FFE4E1/000000'
      ],
      colorMode: "dark",
      productName: "Flat White",
      description: "Café cremoso com duplo espresso e leite microespumoso",
      price: 7.25,
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 23,
    component: SimpleImageComponent,
    inputs: {
      url: "https://images.unsplash.com/photo-1502045856-4882464b27a9?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 8,
    component: SimpleProductComponent,
    inputs: {
      format: "1x1",
      images: [
        'https://images.unsplash.com/photo-1596079890744-c1a0462d9ede?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/200x200/F0E68C/000000',
        'https://via.placeholder.com/200x200/F0E68C/000000'
      ],
      colorMode: "light",
      productName: "Croissant",
      description: "Folhado tradicional francês, perfeito para acompanhar seu café",
      price: 4.50,
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 24,
    component: SimpleTextComponent,
    inputs: {
      text: `<h2 style="color: #000000;">Grand Café</h2>
             <p style="margin-bottom: 8px;">Rejoignez-nous pour l'inauguration de Café Aromático, votre nouveau lieu de prédilection pour le café et les pâtisseries.</p>
             <p style="margin-bottom: 8px;">Découvrez les meilleurs breuvages et délices faits main dans une ambiance chaleureuse.</p>`,
      background: "#F39C12",
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 9,
    component: SimpleProductComponent,
    inputs: {
      format: "2x1",
      images: [
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1989&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/400x200/8B0000/FFFFFF',
        'https://via.placeholder.com/400x200/8B0000/FFFFFF'
      ],
      colorMode: "dark",
      productName: "Bolo de Chocolate",
      description: "Fatia generosa de bolo de chocolate com ganache",
      price: 7.99,
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 10,
    component: SimpleProductComponent,
    inputs: {
      format: "1x1",
      images: [
        'https://images.unsplash.com/photo-1594223274513-31dff2d0b0e6?q=80&w=1925&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/200x200/ADD8E6/000000',
        'https://via.placeholder.com/200x200/ADD8E6/000000'
      ],
      colorMode: "light",
      productName: "Chá Latte",
      description: "Chá preto com leite vaporizado e espuma",
      price: 6.25,
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 11,
    component: SimpleProductComponent,
    inputs: {
      format: "1x2",
      images: [
        'https://images.unsplash.com/photo-1519735777090-ec97162dc266?q=80&w=1915&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/200x300/98FB98/000000',
        'https://via.placeholder.com/200x300/98FB98/000000'
      ],
      colorMode: "dark",
      productName: "Matcha Latte",
      description: "Chá verde japonês com leite vaporizado",
      price: 8.75,
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 12,
    component: SimpleProductComponent,
    inputs: {
      format: "1x1",
      images: [
        'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/200x200/FFD700/000000',
        'https://via.placeholder.com/200x200/FFD700/000000'
      ],
      colorMode: "light",
      productName: "Muffin de Blueberry",
      description: "Muffin fofinho com mirtilos frescos",
      price: 5.25,
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 25,
    component: SimpleImageComponent,
    inputs: {
      url: "https://images.unsplash.com/photo-1564367133818-6ac5df7debfc?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 13,
    component: SimpleProductComponent,
    inputs: {
      format: "2x1",
      images: [
        'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=1880&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/400x200/DEB887/000000',
        'https://via.placeholder.com/400x200/DEB887/000000'
      ],
      colorMode: "dark",
      productName: "Sanduíche de Peru",
      description: "Pão integral com peru defumado e vegetais frescos",
      price: 9.50,
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 14,
    component: SimpleProductComponent,
    inputs: {
      format: "1x1",
      images: [
        'https://images.unsplash.com/photo-1627308595184-722d6ed382d4?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/200x200/FFF0F5/000000',
        'https://via.placeholder.com/200x200/FFF0F5/000000'
      ],
      colorMode: "light",
      productName: "Iced Coffee",
      description: "Café gelado com leite e xarope de baunilha",
      price: 6.99,
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 15,
    component: SimpleProductComponent,
    inputs: {
      format: "1x1",
      images: [
        'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1920&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/200x200/E6E6FA/000000',
        'https://via.placeholder.com/200x200/E6E6FA/000000'
      ],
      colorMode: "dark",
      productName: "Cheesecake",
      description: "Fatia de cheesecake clássico com calda de frutas vermelhas",
      price: 8.99,
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 16,
    component: SimpleProductComponent,
    inputs: {
      format: "1x2",
      images: [
        'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=1976&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/200x300/FFA07A/000000',
        'https://via.placeholder.com/200x300/FFA07A/000000'
      ],
      colorMode: "light",
      productName: "Smoothie de Frutas",
      description: "Mistura de frutas frescas com iogurte natural",
      price: 7.50,
    },
    colSpan: 1,
    rowSpan: 2,
    row: 0,
    col: 0,
  },
  {
    id: 17,
    component: SimpleProductComponent,
    inputs: {
      format: "1x1",
      images: [
        'https://images.unsplash.com/photo-1625938144743-9a5c5a22361f?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/200x200/F0FFF0/000000',
        'https://via.placeholder.com/200x200/F0FFF0/000000'
      ],
      colorMode: "dark",
      productName: "Crepes",
      description: "Crepe recheado com Chantilly e morangos frescos",
      price: 6.75,
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 18,
    component: SimpleProductComponent,
    inputs: {
      format: "2x1",
      images: [
        'https://images.unsplash.com/photo-1627308595184-722d6ed382d4?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/400x200/87CEEB/000000',
        'https://via.placeholder.com/400x200/87CEEB/000000'
      ],
      colorMode: "light",
      productName: "Limonada Fresca",
      description: "Limonada natural com hortelã e gelo",
      price: 4.25,
    },
    colSpan: 2,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  {
    id: 19,
    component: SimpleProductComponent,
    inputs: {
      format: "1x1",
      images: [
        'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://via.placeholder.com/200x200/FFFACD/000000',
        'https://via.placeholder.com/200x200/FFFACD/000000'
      ],
      colorMode: "dark",
      productName: "Tiramisu",
      description: "Sobremesa italiana clássica com café e cacau em pó",
      price: 9.25,
    },
    colSpan: 1,
    rowSpan: 1,
    row: 0,
    col: 0,
  },
  */
];
