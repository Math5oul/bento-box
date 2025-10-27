import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface do Filler
 */
export interface IFiller extends Document {
  type: 'text' | 'image' | 'video';
  content: {
    text?: string; // Para tipo texto
    backgroundColor?: string; // Cor de fundo para tipo texto
    url?: string; // Para imagem ou vídeo
    alt?: string; // Texto alternativo para imagem
    autoplay?: boolean; // Autoplay para vídeo
    controls?: boolean; // Mostrar controles para vídeo
    loop?: boolean; // Loop para vídeo
  };
  categories?: string[]; // Categorias do filler
  formats?: ('1x1' | '1x2' | '2x1' | '2x2')[]; // Formatos válidos para o filler
  gridPosition?: {
    row: number;
    col: number;
    rowSpan: number;
    colSpan: number;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema do Filler
 */
const FillerSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['text', 'image', 'video'],
      required: [true, 'Tipo do filler é obrigatório'],
    },
    content: {
      text: {
        type: String,
        trim: true,
        maxlength: [1000, 'Texto não pode ter mais de 1000 caracteres'],
      },
      backgroundColor: {
        type: String,
        trim: true,
        default: '#ffffff',
      },
      url: {
        type: String,
        trim: true,
      },
      alt: {
        type: String,
        trim: true,
        maxlength: [200, 'Texto alternativo não pode ter mais de 200 caracteres'],
      },
      autoplay: {
        type: Boolean,
        default: false,
      },
      controls: {
        type: Boolean,
        default: true,
      },
      loop: {
        type: Boolean,
        default: false,
      },
    },
    categories: {
      type: [String],
      enum: ['food', 'hot beverage', 'cold beverage', 'dessert', 'alcoholic', 'beverage', 'other'],
      default: [],
    },
    formats: {
      type: [String],
      enum: ['1x1', '1x2', '2x1', '2x2'],
      default: ['1x1'],
    },
    gridPosition: {
      row: { type: Number },
      col: { type: Number },
      rowSpan: { type: Number, default: 1 },
      colSpan: { type: Number, default: 1 },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para melhorar performance
FillerSchema.index({ type: 1, active: 1 });
FillerSchema.index({ 'gridPosition.row': 1, 'gridPosition.col': 1 });

// Validação customizada: se tipo for 'text', deve ter content.text
FillerSchema.pre<IFiller>('save', function (next) {
  if (this.type === 'text' && !this.content?.text) {
    next(new Error('Fillers do tipo texto devem ter conteúdo de texto'));
  } else if ((this.type === 'image' || this.type === 'video') && !this.content?.url) {
    next(new Error('Fillers de imagem/vídeo devem ter uma URL'));
  } else {
    next();
  }
});

export default mongoose.model<IFiller>('Filler', FillerSchema);
