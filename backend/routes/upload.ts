import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import Product from '../models/Product';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Configuração de pastas
const IMAGES_BASE_PATH = path.join(__dirname, '..', '..', 'src', 'assets', 'images');

// Garante que a pasta de imagens existe
if (!fs.existsSync(IMAGES_BASE_PATH)) {
  fs.mkdirSync(IMAGES_BASE_PATH, { recursive: true });
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
    if (!fs.existsSync(productPath)) {
      fs.mkdirSync(productPath, { recursive: true });
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
    const allowedTypes = /jpeg|jpg|png|gif|webp|avif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPEG, PNG, GIF, WebP, AVIF)!'));
    }
  },
});

/**
 * @route   POST /api/upload/:productId
 * @desc    Upload de múltiplas imagens para um produto
 * @access  Public (temporário - adicionar autenticação depois)
 */
router.post(
  '/:productId',
  optionalAuth,
  upload.array('images', 10),
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

      // Retorna os caminhos relativos para usar no frontend
      const imagePaths = files.map(file => {
        return `assets/images/${productId}/${file.filename}`;
      });

      console.log('✅ Imagens salvas:', imagePaths);

      // Se o produto existe no MongoDB, atualiza o array de imagens
      // Verifica se é um ObjectId válido (não é ID temporário tipo "temp-123456")
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(productId);

      if (isValidObjectId) {
        const product = await Product.findById(productId);
        if (product) {
          console.log('📦 Produto encontrado, atualizando imagens');
          product.images = [...product.images, ...imagePaths];
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

      console.log('📤 Resposta:', { success: true, files: imagePaths });
      res.json({ success: true, files: imagePaths });
    } catch (error: any) {
      console.error('❌ Erro no upload:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route   DELETE /api/upload/image
 * @desc    Deleta uma imagem específica
 * @access  Public (temporário - adicionar autenticação depois)
 */
router.delete('/image', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { imagePath, productId } = req.body;

    if (!imagePath) {
      res.status(400).json({ success: false, error: 'Caminho da imagem não fornecido' });
      return;
    }

    // Remove o prefixo 'assets/images/' para obter o caminho no sistema de arquivos
    const relativePath = imagePath.replace('assets/images/', '');
    const fullPath = path.join(IMAGES_BASE_PATH, relativePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);

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
});

/**
 * @route   DELETE /api/upload/product/:productId
 * @desc    Deleta pasta inteira de imagens de um produto
 * @access  Public (temporário - adicionar autenticação depois)
 */
router.delete('/product/:productId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    console.log('🗑️ Requisição DELETE recebida para productId:', productId);

    const imageFolderPath = path.join(IMAGES_BASE_PATH, productId);
    console.log('📂 Caminho da pasta:', imageFolderPath);
    console.log('📂 Pasta existe?', fs.existsSync(imageFolderPath));

    if (fs.existsSync(imageFolderPath)) {
      fs.rmSync(imageFolderPath, { recursive: true, force: true });
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
});

/**
 * @route   POST /api/upload/:tempId/rename/:newId
 * @desc    Renomeia pasta de imagens de ID temporário para ID definitivo
 * @access  Public (temporário - adicionar autenticação depois)
 */
router.post(
  '/:tempId/rename/:newId',
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { tempId, newId } = req.params;
      console.log(`🔄 Renomeando pasta de ${tempId} para ${newId}`);

      const tempFolderPath = path.join(IMAGES_BASE_PATH, tempId);
      const newFolderPath = path.join(IMAGES_BASE_PATH, newId);

      console.log('📂 Pasta temp existe?', fs.existsSync(tempFolderPath));

      if (!fs.existsSync(tempFolderPath)) {
        console.log('⚠️ Pasta temporária não encontrada - nada a renomear');
        res.status(404).json({ success: false, message: 'Pasta temporária não encontrada' });
        return;
      }

      fs.renameSync(tempFolderPath, newFolderPath);
      console.log(`✅ Pasta renomeada de ${tempId} para ${newId}`);

      // Retornar os novos caminhos das imagens
      const files = fs.readdirSync(newFolderPath);
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
