import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-test-upload',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './test-upload.component.html',
  styleUrl: './test-upload.component.scss',
})
export class TestUploadComponent {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadProgress = 0;
  uploadMessage = '';
  uploadedImageUrl = '';
  isUploading = false;
  productId = 'test-upload-' + Date.now(); // ID de teste único

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];

      // Criar preview
      if (isPlatformBrowser(this.platformId)) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrl = e.target.result;
        };
        reader.readAsDataURL(this.selectedFile);
      }
    }
  }

  async uploadImage(): Promise<void> {
    if (!this.selectedFile) {
      this.uploadMessage = 'Selecione uma imagem primeiro';
      return;
    }

    const formData = new FormData();
    formData.append('images', this.selectedFile); // 'images' para corresponder ao backend

    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadMessage = '';
    this.uploadedImageUrl = '';

    try {
      // Usar o endpoint correto com productId
      const response: any = await this.http
        .post(`/api/upload/${this.productId}`, formData)
        .toPromise();

      if (response.success && response.files && response.files.length > 0) {
        this.uploadMessage = '✅ Upload concluído com sucesso!';
        this.uploadedImageUrl = '/' + response.files[0]; // Adiciona / no início
        this.uploadProgress = 100;
      } else {
        this.uploadMessage = '❌ Erro: Resposta inesperada do servidor';
      }
    } catch (error: any) {
      console.error('Erro no upload:', error);
      this.uploadMessage = `❌ Erro no upload: ${error.error?.error || error.message}`;
      this.uploadProgress = 0;
    } finally {
      this.isUploading = false;
    }
  }

  clearSelection(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.uploadProgress = 0;
    this.uploadMessage = '';
    this.uploadedImageUrl = '';
    this.productId = 'test-upload-' + Date.now(); // Gera novo ID para próximo teste
  }
}
