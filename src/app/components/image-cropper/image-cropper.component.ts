import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CropResult {
  blob: Blob;
  dataUrl: string;
}

@Component({
  selector: 'app-image-cropper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-cropper.component.html',
  styleUrls: ['./image-cropper.component.scss'],
})
export class ImageCropperComponent implements OnInit, OnDestroy {
  @Input() imageFile: File | null = null;
  @Input() currentIndex: number = 1;
  @Input() totalImages: number = 1;

  @Output() cropped = new EventEmitter<CropResult>();
  @Output() cancelled = new EventEmitter<void>();

  // Aspect ratio fixo 1:1 para produtos
  readonly aspectRatio = 1;

  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  imageUrl: string = '';
  private image: HTMLImageElement | null = null;
  isLoading = true;

  // Crop area
  cropX = 0;
  cropY = 0;
  cropWidth = 200;
  cropHeight = 200;

  // Canvas dimensions
  canvasWidth = 0;
  canvasHeight = 0;

  // Drag state
  isDragging = false;
  isResizing = false;
  dragStartX = 0;
  dragStartY = 0;
  resizeHandle: string | null = null;

  ngOnInit() {
    if (this.imageFile) {
      this.loadImage();
    }
  }

  ngOnDestroy() {
    this.image = null;
    this.imageUrl = '';
  }

  private loadImage() {
    if (!this.imageFile) return;
    this.isLoading = true;
    const reader = new FileReader();
    reader.onload = e => {
      this.imageUrl = e.target?.result as string;
      this.image = new Image();
      this.image.onload = () => {
        this.isLoading = false;
        this.initializeCrop();
      };
      this.image.onerror = () => {
        console.error('❌ Erro ao carregar imagem');
        this.isLoading = false;
        alert('Erro ao carregar imagem. Tente novamente.');
        this.cancel();
      };
      this.image.src = this.imageUrl;
    };
    reader.onerror = () => {
      console.error('❌ Erro ao ler arquivo');
      this.isLoading = false;
      alert('Erro ao ler arquivo. Tente novamente.');
      this.cancel();
    };
    reader.readAsDataURL(this.imageFile);
  }

  private initializeCrop() {
    if (!this.image) return;

    // Define canvas size para caber na tela
    const maxWidth = 600;
    const maxHeight = 500;

    let width = this.image.width;
    let height = this.image.height;

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    this.canvasWidth = Math.floor(width);
    this.canvasHeight = Math.floor(height);

    // Inicializa área de crop ocupando o máximo possível (quadrado)
    const maxSize = Math.min(width * 0.9, height * 0.9);
    this.cropWidth = maxSize;
    this.cropHeight = maxSize;

    this.cropX = (width - maxSize) / 2;
    this.cropY = (height - maxSize) / 2;

    // Aguarda o canvas estar pronto no DOM
    setTimeout(() => {
      this.drawCanvas();
    }, 50);
  }

  private drawCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpa canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha imagem
    ctx.drawImage(this.image, 0, 0, this.canvasWidth, this.canvasHeight);

    // Desenha overlay escuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Limpa área de crop (mostra imagem original)
    ctx.clearRect(this.cropX, this.cropY, this.cropWidth, this.cropHeight);
    ctx.drawImage(
      this.image,
      (this.cropX / this.canvasWidth) * this.image.width,
      (this.cropY / this.canvasHeight) * this.image.height,
      (this.cropWidth / this.canvasWidth) * this.image.width,
      (this.cropHeight / this.canvasHeight) * this.image.height,
      this.cropX,
      this.cropY,
      this.cropWidth,
      this.cropHeight
    );

    // Desenha borda da área de crop
    ctx.strokeStyle = '#00b894';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.cropX, this.cropY, this.cropWidth, this.cropHeight);

    // Desenha handles de resize
    this.drawHandles(ctx);
  }

  private drawHandles(ctx: CanvasRenderingContext2D) {
    const handleSize = 10;
    ctx.fillStyle = '#00b894';

    // Cantos
    ctx.fillRect(this.cropX - handleSize / 2, this.cropY - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(
      this.cropX + this.cropWidth - handleSize / 2,
      this.cropY - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.fillRect(
      this.cropX - handleSize / 2,
      this.cropY + this.cropHeight - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.fillRect(
      this.cropX + this.cropWidth - handleSize / 2,
      this.cropY + this.cropHeight - handleSize / 2,
      handleSize,
      handleSize
    );
  }

  onMouseDown(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.handleInteractionStart(x, y);
  }

  onMouseMove(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.isDragging || this.isResizing) {
      this.handleInteractionMove(x, y);
    } else {
      // Atualiza cursor hover baseado na posição
      this.updateHoverCursor(x, y);
    }
  }

  private updateHoverCursor(x: number, y: number) {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    // Remove todas as classes de cursor
    canvas.classList.remove('resizing-tl', 'resizing-tr', 'resizing-bl', 'resizing-br');

    const handleSize = 10;

    // Verifica se está próximo de algum handle e muda o cursor
    if (this.isNearHandle(x, y, this.cropX, this.cropY, handleSize)) {
      canvas.classList.add('resizing-tl');
    } else if (this.isNearHandle(x, y, this.cropX + this.cropWidth, this.cropY, handleSize)) {
      canvas.classList.add('resizing-tr');
    } else if (this.isNearHandle(x, y, this.cropX, this.cropY + this.cropHeight, handleSize)) {
      canvas.classList.add('resizing-bl');
    } else if (
      this.isNearHandle(x, y, this.cropX + this.cropWidth, this.cropY + this.cropHeight, handleSize)
    ) {
      canvas.classList.add('resizing-br');
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.updateCanvasCursor();
  }

  private updateCanvasCursor() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    // Remove todas as classes de cursor
    canvas.classList.remove('dragging', 'resizing-tl', 'resizing-tr', 'resizing-bl', 'resizing-br');

    // Adiciona a classe apropriada baseada no estado
    if (this.isDragging) {
      canvas.classList.add('dragging');
    } else if (this.isResizing && this.resizeHandle) {
      canvas.classList.add(`resizing-${this.resizeHandle}`);
    }
  }

  onTouchStart(event: TouchEvent) {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Simula mousedown
      this.handleInteractionStart(x, y);
    }
  }

  onTouchMove(event: TouchEvent) {
    event.preventDefault();
    if (event.touches.length === 1 && (this.isDragging || this.isResizing)) {
      const touch = event.touches[0];
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Simula mousemove
      this.handleInteractionMove(x, y);
    }
  }

  private handleInteractionStart(x: number, y: number) {
    const handleSize = 10;
    if (this.isNearHandle(x, y, this.cropX, this.cropY, handleSize)) {
      this.isResizing = true;
      this.resizeHandle = 'tl';
    } else if (this.isNearHandle(x, y, this.cropX + this.cropWidth, this.cropY, handleSize)) {
      this.isResizing = true;
      this.resizeHandle = 'tr';
    } else if (this.isNearHandle(x, y, this.cropX, this.cropY + this.cropHeight, handleSize)) {
      this.isResizing = true;
      this.resizeHandle = 'bl';
    } else if (
      this.isNearHandle(x, y, this.cropX + this.cropWidth, this.cropY + this.cropHeight, handleSize)
    ) {
      this.isResizing = true;
      this.resizeHandle = 'br';
    } else if (
      x >= this.cropX &&
      x <= this.cropX + this.cropWidth &&
      y >= this.cropY &&
      y <= this.cropY + this.cropHeight
    ) {
      this.isDragging = true;
      this.dragStartX = x - this.cropX;
      this.dragStartY = y - this.cropY;
    }

    // Atualiza o cursor
    this.updateCanvasCursor();
  }

  private handleInteractionMove(x: number, y: number) {
    if (this.isDragging) {
      this.cropX = Math.max(0, Math.min(x - this.dragStartX, this.canvasWidth - this.cropWidth));
      this.cropY = Math.max(0, Math.min(y - this.dragStartY, this.canvasHeight - this.cropHeight));
    } else if (this.isResizing && this.resizeHandle) {
      this.handleResize(x, y);
    }

    this.drawCanvas();
  }

  private isNearHandle(x: number, y: number, hx: number, hy: number, size: number): boolean {
    return Math.abs(x - hx) <= size && Math.abs(y - hy) <= size;
  }

  private handleResize(x: number, y: number) {
    const minSize = 30; // Tamanho mínimo reduzido para permitir crops menores

    switch (this.resizeHandle) {
      case 'br': // Bottom-right - mantém quadrado
        const newSize = Math.max(minSize, Math.min(x - this.cropX, y - this.cropY));
        this.cropWidth = Math.min(
          newSize,
          this.canvasWidth - this.cropX,
          this.canvasHeight - this.cropY
        );
        this.cropHeight = this.cropWidth; // Força quadrado
        break;

      case 'tl': // Top-left - mantém quadrado
        const dx = this.cropX - x;
        const dy = this.cropY - y;
        const delta = Math.max(dx, dy);

        const potentialSize = this.cropWidth + delta;
        const potentialX = this.cropX - delta;
        const potentialY = this.cropY - delta;

        if (potentialSize >= minSize && potentialX >= 0 && potentialY >= 0) {
          this.cropX = potentialX;
          this.cropY = potentialY;
          this.cropWidth = potentialSize;
          this.cropHeight = potentialSize; // Força quadrado
        }
        break;

      case 'tr': // Top-right - mantém quadrado
        const dxTR = x - this.cropX;
        const dyTR = this.cropY + this.cropHeight - y;
        const deltaTR = Math.max(dxTR, dyTR);

        const potentialSizeTR = deltaTR;
        const potentialYTR = this.cropY + this.cropHeight - deltaTR;

        if (
          potentialSizeTR >= minSize &&
          potentialYTR >= 0 &&
          this.cropX + potentialSizeTR <= this.canvasWidth
        ) {
          this.cropY = potentialYTR;
          this.cropWidth = potentialSizeTR;
          this.cropHeight = potentialSizeTR; // Força quadrado
        }
        break;

      case 'bl': // Bottom-left - mantém quadrado
        const dxBL = this.cropX + this.cropWidth - x;
        const dyBL = y - this.cropY;
        const deltaBL = Math.max(dxBL, dyBL);

        const potentialSizeBL = deltaBL;
        const potentialXBL = this.cropX + this.cropWidth - deltaBL;

        if (
          potentialSizeBL >= minSize &&
          potentialXBL >= 0 &&
          this.cropY + potentialSizeBL <= this.canvasHeight
        ) {
          this.cropX = potentialXBL;
          this.cropWidth = potentialSizeBL;
          this.cropHeight = potentialSizeBL; // Força quadrado
        }
        break;
    }
  }

  async cropImage() {
    if (!this.image) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Tamanho fixo 500x500 para produtos
    canvas.width = 500;
    canvas.height = 500;

    // Calcula coordenadas na imagem original
    const scaleX = this.image.width / this.canvasWidth;
    const scaleY = this.image.height / this.canvasHeight;

    const sourceX = this.cropX * scaleX;
    const sourceY = this.cropY * scaleY;
    const sourceWidth = this.cropWidth * scaleX;
    const sourceHeight = this.cropHeight * scaleY;

    // Desenha imagem cortada
    ctx.drawImage(
      this.image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Converte para blob
    canvas.toBlob(
      blob => {
        if (blob) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          this.cropped.emit({ blob, dataUrl });
        } else {
          console.error('❌ Falha ao criar blob');
        }
      },
      'image/jpeg',
      0.9
    );
  }

  cancel() {
    this.cancelled.emit();
  }
}
