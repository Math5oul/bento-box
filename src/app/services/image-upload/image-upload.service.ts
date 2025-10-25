import { Injectable } from '@angular/core';
import { StorageService } from '../storage-service/storage.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ImageUploadService {
  constructor(private storageService: StorageService) {}

  /**
   * Faz upload de imagens para um produto específico
   * @param productId ID do produto
   * @param files Array de arquivos de imagem
   * @returns Observable com os caminhos das imagens salvas
   */
  uploadImages(productId: string, files: File[]): Observable<string[]> {
    return this.storageService.uploadProductImages(productId, files).pipe(
      map((response: any) => {
        if (response.files && Array.isArray(response.files)) {
          return response.files;
        }
        return [];
      })
    );
  }

  /**
   * Deleta uma imagem específica
   * @param imagePath Caminho da imagem a deletar
   */
  deleteImage(imagePath: string): Observable<any> {
    return this.storageService.deleteImage(imagePath);
  }

  /**
   * Valida se o arquivo é uma imagem válida
   * @param file Arquivo para validar
   * @returns true se for uma imagem válida
   */
  validateImageFile(file: File): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de arquivo não suportado. Use: JPEG, PNG, GIF, WebP ou AVIF');
      return false;
    }

    if (file.size > maxSize) {
      alert('Arquivo muito grande! Tamanho máximo: 10MB');
      return false;
    }

    return true;
  }

  /**
   * Valida múltiplos arquivos
   * @param files Array de arquivos
   * @returns Array apenas com arquivos válidos
   */
  validateFiles(files: File[]): File[] {
    return files.filter(file => this.validateImageFile(file));
  }
}
