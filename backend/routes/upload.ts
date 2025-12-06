import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import sharp from 'sharp';
import { fileTypeFromFile } from 'file-type';
import Product from '../models/Product';
import { authenticate, requirePermission } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import { auditLog } from '../middleware/auditLogger';

const router = Router();

// Configuração de pastas
const IMAGES_BASE_PATH = path.join(__dirname, '..', '..', 'src', 'assets', 'images');

// Garante que a pasta de imagens existe
if (!fsSync.existsSync(IMAGES_BASE_PATH)) {
  fsSync.mkdirSync(IMAGES_BASE_PATH, { recursive: true });
}

// Configuração do multer para upload
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const productId = req.params['productId'] || req.body['productId'];
    const productPath = path.join(IMAGES_BASE_PATH, productId);

    // Cria a pasta do produto se não existir
    if (!fsSync.existsSync(productPath)) {
      fsSync.mkdirSync(productPath, { recursive: true });
    }

    cb(null, productPath);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    // Mantém a extensão original
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Aceita HEIC/HEIF além dos outros formatos comuns
    const allowedTypes = /jpeg|jpg|png|gif|webp|avif|heic|heif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    // Aceita se EXTENSÃO OU MIMETYPE corresponderem — isso evita rejeitar uploads de alguns celulares
    if (extname || mimetype) {
      cb(null, true);
    } else {
      // Inclui informações do arquivo na mensagem de erro para facilitar debugging no frontend
      const msg = `Apenas imagens são permitidas (JPEG, PNG, GIF, WebP, AVIF, HEIC/HEIF). Arquivo: ${file.originalname} (${file.mimetype}). Se estiver usando iPhone, prefira "Mais compatíveis" nas configurações da câmera.`;
      cb(new Error(msg));
    }
  },
});

/**
 * @route   POST /api/upload/:productId
 * @desc    Upload de múltiplas imagens para um produto
 * @access  Private - Requer canManageProducts
 */
router.post(
  '/:productId',
  authenticate,
  requirePermission('canManageProducts'),
  uploadLimiter,
  upload.array('images', 10),
  auditLog('UPLOAD_PRODUCT_IMAGE', 'upload'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const files = (req as any).files as Express.Multer.File[];

      console.log('📤 Upload recebido para productId:', productId);
      console.log('📁 Número de arquivos:', files?.length || 0);

      if (!files || files.length === 0) {
        console.log('⚠️ Nenhum arquivo recebido');
        res.status(400).json({ success: false, error: 'Nenhuma imagem foi enviada' });
        return;
      }

      // Processa conversões (ex.: HEIC/HEIF -> AVIF) e monta os caminhos finais
      const processedImagePaths: string[] = [];

      for (const file of files) {
        try {
          const originalFilename = file.filename;
          const originalExt = path.extname(originalFilename).toLowerCase();
          const folderPath = path.join(IMAGES_BASE_PATH, productId);
          const originalFullPath = path.join(folderPath, originalFilename);

          // 🔒 VALIDAÇÃO DE SEGURANÇA: Verifica o magic number do arquivo
          const fileType = await fileTypeFromFile(originalFullPath);
          const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/avif',
            'image/heic',
            'image/heif',
          ];

          if (!fileType || !allowedMimes.includes(fileType.mime)) {
            console.warn(
              `⚠️ Arquivo rejeitado por magic number inválido: ${originalFilename} (detectado: ${fileType?.mime || 'desconhecido'})`
            );
            // Remove o arquivo inválido
            fsSync.unlinkSync(originalFullPath);
            continue; // Pula este arquivo
          }

          console.log(`✅ Magic number válido: ${originalFilename} (${fileType.mime})`);

          // Skip conversion for GIFs (animated) and already-AVIF files
          if (originalExt === '.gif' || originalExt === '.avif') {
            processedImagePaths.push(`assets/images/${productId}/${originalFilename}`);
            continue;
          }

          // Tenta converter para AVIF (menor tamanho, boa qualidade). Se falhar, mantém o original.
          const baseName = path.basename(originalFilename, originalExt);
          const convertedFilename = `${baseName}.avif`;
          const convertedFullPath = path.join(folderPath, convertedFilename);

          // Usamos sharp para converter — se não suportar o formato (ou falhar), caímos no catch
          await sharp(originalFullPath)
            .withMetadata()
            .toFormat('avif', { quality: 60 })
            .toFile(convertedFullPath);

          // Se a conversão teve sucesso, removemos o original para economizar espaço
          try {
            fsSync.unlinkSync(originalFullPath);
          } catch (unlinkErr) {
            console.warn('Não foi possível remover o arquivo original após conversão:', unlinkErr);
          }

          processedImagePaths.push(`assets/images/${productId}/${convertedFilename}`);
        } catch (convErr: any) {
          console.warn(
            'Conversão falhou (mantendo arquivo original):',
            convErr?.message || convErr
          );
          // Em caso de erro, usa o arquivo original
          processedImagePaths.push(`assets/images/${productId}/${file.filename}`);
        }
      }

      console.log('✅ Imagens salvas (após processamento):', processedImagePaths);

      // Se o produto existe no MongoDB, atualiza o array de imagens com os caminhos processados
      // Verifica se é um ObjectId válido (não é ID temporário tipo "temp-123456")
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(productId);

      if (isValidObjectId) {
        const product = await Product.findById(productId);
        if (product) {
          console.log('📦 Produto encontrado, atualizando imagens');
          product.images = [...product.images, ...processedImagePaths];
          // Limita a 5 imagens
          if (product.images.length > 5) {
            product.images = product.images.slice(0, 5);
          }
          await product.save();
          console.log('💾 Produto atualizado com imagens');
        } else {
          console.log('⚠️ Produto não encontrado no MongoDB');
        }
      } else {
        console.log('⚠️ ID temporário detectado, pulando atualização no MongoDB');
      }

      console.log('📤 Resposta:', { success: true, files: processedImagePaths });
      res.json({ success: true, files: processedImagePaths });
    } catch (error: any) {
      console.error('❌ Erro no upload:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/upload/image
 * @desc    Deleta uma imagem específica
 * @access  Private - Requer canManageProducts
 */
router.delete(
  '/image',
  authenticate,
  requirePermission('canManageProducts'),
  auditLog('DELETE_IMAGE', 'upload'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { imagePath, productId } = req.body;

      if (!imagePath) {
        res.status(400).json({ success: false, error: 'Caminho da imagem não fornecido' });
        return;
      }

      // Remove o prefixo 'assets/images/' para obter o caminho no sistema de arquivos
      const relativePath = imagePath.replace('assets/images/', '');
      const fullPath = path.join(IMAGES_BASE_PATH, relativePath);

      if (fsSync.existsSync(fullPath)) {
        fsSync.unlinkSync(fullPath);

        // Se productId foi fornecido, remove do array de imagens no MongoDB
        if (productId) {
          const product = await Product.findById(productId);
          if (product) {
            product.images = product.images.filter(img => img !== imagePath);
            await product.save();
          }
        }

        res.json({ success: true, message: 'Imagem deletada com sucesso' });
      } else {
        res.status(404).json({ success: false, error: 'Imagem não encontrada' });
      }
    } catch (error: any) {
      console.error('❌ Erro ao deletar imagem:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/upload/product/:productId
 * @desc    Deleta pasta inteira de imagens de um produto
 * @access  Private - Requer canManageProducts
 */
router.delete(
  '/product/:productId',
  authenticate,
  requirePermission('canManageProducts'),
  auditLog('DELETE_PRODUCT_IMAGES', 'upload'),
  async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      console.log('🗑️ Requisição DELETE recebida para productId:', productId);

      const imageFolderPath = path.join(IMAGES_BASE_PATH, productId);
      console.log('📂 Caminho da pasta:', imageFolderPath);
      console.log('📂 Pasta existe?', fsSync.existsSync(imageFolderPath));

      if (fsSync.existsSync(imageFolderPath)) {
        fsSync.rmSync(imageFolderPath, { recursive: true, force: true });
        console.log(`✅ Pasta de imagens do produto ${productId} deletada`);

        // Remove imagens do produto no MongoDB
        const product = await Product.findById(productId);
        if (product) {
          product.images = [];
          await product.save();
        }

        res.json({ success: true, message: 'Pasta de imagens deletada com sucesso' });
      } else {
        console.log('⚠️ Pasta não encontrada');
        res.status(404).json({ success: false, message: 'Pasta de imagens não encontrada' });
      }
    } catch (error: any) {
      console.error('❌ Erro ao deletar pasta:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   POST /api/upload/:tempId/rename/:newId
 * @desc    Renomeia pasta de imagens de ID temporário para ID definitivo
 * @access  Private - Requer canManageProducts
 */
router.post(
  '/:tempId/rename/:newId',
  authenticate,
  requirePermission('canManageProducts'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tempId, newId } = req.params;
      console.log(`🔄 Renomeando pasta de ${tempId} para ${newId}`);

      const tempFolderPath = path.join(IMAGES_BASE_PATH, tempId);
      const newFolderPath = path.join(IMAGES_BASE_PATH, newId);

      console.log('📂 Pasta temp existe?', fsSync.existsSync(tempFolderPath));

      if (!fsSync.existsSync(tempFolderPath)) {
        console.log('⚠️ Pasta temporária não encontrada - nada a renomear');
        res.status(404).json({ success: false, message: 'Pasta temporária não encontrada' });
        return;
      }

      fsSync.renameSync(tempFolderPath, newFolderPath);
      console.log(`✅ Pasta renomeada de ${tempId} para ${newId}`);

      // Retornar os novos caminhos das imagens
      const files = fsSync.readdirSync(newFolderPath);
      const newPaths = files.map(file => `assets/images/${newId}/${file}`);

      // Atualiza os caminhos no produto MongoDB
      const product = await Product.findById(newId);
      if (product) {
        product.images = newPaths;
        await product.save();
      }

      res.json({ success: true, newPaths });
    } catch (error: any) {
      console.error('❌ Erro ao renomear pasta:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;
