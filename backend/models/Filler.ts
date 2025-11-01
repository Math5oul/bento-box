import mongoose, { Schema, Document } from 'mongoose';

export interface IFiller extends Document {
  type: 'text' | 'image' | 'video';
  content: {
    text?: string;
    backgroundColor?: string;
    url?: string;
    alt?: string;
    autoplay?: boolean;
    controls?: boolean;
    loop?: boolean;
  };
  categories?: string[];
  formats?: ('1x1' | '1x2' | '2x1' | '2x2')[];
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

FillerSchema.index({ type: 1, active: 1 });
FillerSchema.index({ 'gridPosition.row': 1, 'gridPosition.col': 1 });

/**
 * Valida que fillers do tipo 'text' tenham content.text,
 * e fillers de 'image'/'video' tenham content.url
 */
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
