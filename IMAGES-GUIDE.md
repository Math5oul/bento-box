# Sistema de Gerenciamento de Imagens

## 📁 Estrutura de Pastas

Cada produto terá sua própria pasta dentro de `src/assets/images/`:

```
src/assets/images/
├── product-1/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── image3.webp
├── product-2/
│   ├── photo1.png
│   └── photo2.jpg
└── banner-1/
    └── banner.jpg
```

## 🎨 Interface de Upload no Modal

### Como usar ao criar um novo produto:

1. **Abra o modal** de criação de item
2. **Selecione o componente** (ex: SimpleProductComponent)
3. **Preencha os campos** do formulário
4. **Na seção "📸 Upload de Imagens"**:
   - Clique em "Clique para selecionar imagens"
   - Escolha uma ou múltiplas imagens (max 10MB cada)
   - Clique em "⬆️ Enviar Imagens"
   - Aguarde o upload (aparecerá "⏳ Enviando...")
5. **Visualize as imagens** enviadas no grid de preview
6. **Remova imagens** se necessário (botão × em cada imagem)
7. **Clique em "Criar Item"** - as imagens já estarão vinculadas!

### Validações Automáticas:

- ✅ Apenas imagens (JPEG, PNG, GIF, WebP, AVIF)
- ✅ Tamanho máximo: 10MB por arquivo
- ✅ Preview em tempo real
- ✅ Remoção individual de imagens

## 🔄 Fluxo Automático

### Ao Criar um Produto:

1. O sistema cria automaticamente uma pasta com o ID do produto
2. As imagens enviadas são salvas nessa pasta
3. Os caminhos são salvos no formato: `assets/images/product-id/image.jpg`

### Ao Deletar um Produto:

1. O sistema deleta o produto do `menu-data.json`
2. **Automaticamente** deleta toda a pasta do produto
3. Todas as imagens dentro da pasta são removidas

## 🚀 Como Usar

### Backend (já configurado):

```javascript
// Upload de imagens
POST /api/upload/:productId
// Body: FormData com campo 'images' (múltiplos arquivos)

// Deletar produto e imagens
DELETE /api/product/:productId

// Deletar imagem específica
DELETE /api/image
// Body: { imagePath: "assets/images/product-1/image.jpg" }
```

### Frontend:

#### 1. Injetar o serviço:

```typescript
constructor(private imageUploadService: ImageUploadService) {}
```

#### 2. Upload de imagens:

```typescript
const files: File[] = [...]; // Array de arquivos do input
const productId = 'product-1';

this.imageUploadService.uploadImages(productId, files).subscribe({
  next: (imagePaths) => {
    console.log('Imagens salvas:', imagePaths);
    // imagePaths = ['assets/images/product-1/1234567890.jpg', ...]

    // Adicionar ao produto
    product.inputs.images = imagePaths;
  },
  error: (err) => console.error('Erro no upload:', err)
});
```

#### 3. Deletar produto (já implementado):

```typescript
// Ao deletar um produto na toolbar, automaticamente:
// - Remove do menu-data.json
// - Deleta pasta assets/images/product-id/
// - Remove todas as imagens
```

## 📝 Exemplo Completo

### HTML (input de arquivo):

```html
<input type="file" multiple accept="image/*" (change)="onFileSelected($event)" />
```

### TypeScript (componente):

```typescript
onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;

  if (input.files) {
    const files = Array.from(input.files);
    const productId = this.newProduct.id;

    this.imageUploadService.uploadImages(productId, files).subscribe({
      next: (paths) => {
        this.newProduct.inputs.images = paths;
        console.log('✅ Upload concluído!');
      },
      error: (err) => console.error('❌ Erro:', err)
    });
  }
}
```

## 🎯 Validações Automáticas

- ✅ Apenas imagens (JPEG, PNG, GIF, WebP, AVIF)
- ✅ Tamanho máximo: 10MB por arquivo
- ✅ Pasta criada automaticamente
- ✅ Nome único com timestamp
- ✅ Deleção automática ao remover produto

## 🔗 URLs das Imagens

Use caminhos relativos no `menu-data.json`:

```json
{
  "id": "product-1",
  "component": "SimpleProductComponent",
  "inputs": {
    "productName": "Produto Exemplo",
    "images": ["assets/images/product-1/1698765432.jpg", "assets/images/product-1/1698765433.jpg"]
  }
}
```

O Angular resolve automaticamente para: `/assets/images/product-1/1698765432.jpg`

## 🛠️ Próximos Passos

Para integrar upload no modal de novo produto:

1. Adicionar input de arquivo no `new-item-modal.component.html`
2. Usar `ImageUploadService` no componente
3. Upload antes de salvar o produto
4. Adicionar os caminhos retornados ao `inputs.images`
