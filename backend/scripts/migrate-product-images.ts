import mongoose from 'mongoose';
import sharp from 'sharp';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import Product from '../models/Product';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Configuração do MongoDB
const MONGO_URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/bento-box';

// Diretório base de imagens
const IMAGES_BASE_PATH = path.join(__dirname, '..', '..', 'src', 'assets', 'images');

/**
 * Conecta ao MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Garante que o diretório de imagens do produto existe
 */
function ensureProductDirectory(productId: string): string {
  const productPath = path.join(IMAGES_BASE_PATH, productId);
  if (!fs.existsSync(productPath)) {
    fs.mkdirSync(productPath, { recursive: true });
    console.log(`  📁 Pasta criada: ${productPath}`);
  }
  return productPath;
}

/**
 * Verifica se a URL precisa ser migrada
 * - URLs externas (http/https) precisam
 * - URLs antigas (/uploads/products/) precisam
 * - URLs novas (assets/images/{productId}/) NÃO precisam
 */
function needsMigration(url: string): boolean {
  // Se for externa, precisa migrar
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true;
  }

  // Se for da pasta antiga /uploads/products/, precisa migrar
  if (url.startsWith('/uploads/products/')) {
    return true;
  }

  // Se já estiver na estrutura nova assets/images/{productId}/, não precisa
  return false;
}

/**
 * Faz download de uma imagem externa
 */
async function downloadImage(url: string): Promise<Buffer> {
  try {
    console.log(`  📥 Baixando: ${url}`);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    return Buffer.from(response.data);
  } catch (error: any) {
    console.error(`  ❌ Erro ao baixar ${url}:`, error.message);
    throw error;
  }
}

/**
 * Processa uma imagem: crop quadrado do centro e redimensiona para 800x800
 * Depois converte para AVIF (mesma lógica do upload.ts)
 */
async function processImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const { width = 0, height = 0 } = metadata;

    console.log(`  📐 Dimensões originais: ${width}x${height}`);

    // Calcula o crop quadrado do centro
    const size = Math.min(width, height);
    const left = Math.floor((width - size) / 2);
    const top = Math.floor((height - size) / 2);

    console.log(`  ✂️  Cortando ${size}x${size} do centro (left: ${left}, top: ${top})`);

    // Crop, redimensiona para 800x800 e converte para AVIF
    const processedBuffer = await sharp(imageBuffer)
      .extract({ left, top, width: size, height: size })
      .resize(800, 800, {
        fit: 'cover',
        position: 'center',
      })
      .withMetadata()
      .toFormat('avif', { quality: 60 })
      .toBuffer();

    console.log(`  ✅ Imagem processada: 800x800 AVIF`);
    return processedBuffer;
  } catch (error: any) {
    console.error('  ❌ Erro ao processar imagem:', error.message);
    throw error;
  }
}

/**
 * Salva o buffer da imagem no disco na pasta do produto
 */
function saveImage(imageBuffer: Buffer, productId: string): string {
  const productPath = ensureProductDirectory(productId);
  const timestamp = Date.now();
  const filename = `${timestamp}.avif`;
  const filepath = path.join(productPath, filename);

  fs.writeFileSync(filepath, imageBuffer);
  console.log(`  💾 Imagem salva: ${filename}`);

  return `assets/images/${productId}/${filename}`;
}

/**
 * Processa uma URL de imagem
 */
async function processImageUrl(url: string, productId: string): Promise<string | null> {
  try {
    // Se não precisa migrar, mantém como está
    if (!needsMigration(url)) {
      console.log(`  ⏭️  Pulando (já na estrutura nova): ${url}`);
      return url;
    }

    let imageBuffer: Buffer;

    // Se for URL externa, baixa da internet
    if (url.startsWith('http://') || url.startsWith('https://')) {
      imageBuffer = await downloadImage(url);
    }
    // Se for arquivo local antigo (/uploads/products/), lê do disco
    else if (url.startsWith('/uploads/products/')) {
      const oldPath = path.join(__dirname, '..', '..', 'public', url);
      console.log(`  📂 Lendo arquivo local: ${oldPath}`);

      if (!fs.existsSync(oldPath)) {
        console.log(`  ❌ Arquivo não encontrado: ${oldPath}`);
        return url; // Mantém a URL original
      }

      imageBuffer = fs.readFileSync(oldPath);
    } else {
      console.log(`  ⏭️  URL não reconhecida: ${url}`);
      return url;
    }

    // Processa (crop + resize + convert to AVIF)
    const processedBuffer = await processImage(imageBuffer);

    // Salva no disco na pasta do produto
    const localPath = saveImage(processedBuffer, productId);

    return localPath;
  } catch (error: any) {
    console.error(`  ❌ Falha ao processar ${url}:`, error.message);
    return null; // Mantém a URL original em caso de erro
  }
}

/**
 * Migra as imagens de um produto
 */
async function migrateProductImages(product: any) {
  console.log(`\n🔄 Processando produto: ${product.name} (${product._id})`);
  console.log(`   Imagens atuais: ${product.images.length}`);

  const newImages: string[] = [];
  let changedCount = 0;

  for (let i = 0; i < product.images.length; i++) {
    const url = product.images[i];
    console.log(`\n  [${i + 1}/${product.images.length}] Processando imagem:`);

    const newUrl = await processImageUrl(url, product._id.toString());

    if (newUrl && newUrl !== url) {
      newImages.push(newUrl);
      changedCount++;
      console.log(`  ✅ Substituída por: ${newUrl}`);
    } else {
      newImages.push(url); // Mantém a URL original
      console.log(`  ⏭️  Mantida: ${url}`);
    }
  }

  // Atualiza o produto se houve mudanças
  if (changedCount > 0) {
    // Marca o campo como modificado para garantir que o Mongoose salve
    product.images = newImages;
    product.markModified('images');
    await product.save();
    console.log(`\n✅ Produto atualizado: ${changedCount} imagens migradas`);
  } else {
    console.log(`\n⏭️  Nenhuma imagem para migrar`);
  }

  return changedCount;
}

/**
 * Script principal
 */
async function main() {
  console.log('🚀 Iniciando migração de imagens de produtos...\n');

  await connectDB();

  // Busca todos os produtos
  const products = await Product.find({});
  console.log(`\n📦 Total de produtos encontrados: ${products.length}\n`);

  let totalMigrated = 0;
  let totalProducts = 0;

  for (const product of products) {
    try {
      const count = await migrateProductImages(product);
      if (count > 0) {
        totalMigrated += count;
        totalProducts++;
      }
    } catch (error: any) {
      console.error(`\n❌ Erro ao migrar produto ${product.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA MIGRAÇÃO:');
  console.log('='.repeat(60));
  console.log(`✅ Total de produtos processados: ${products.length}`);
  console.log(`✅ Produtos com imagens migradas: ${totalProducts}`);
  console.log(`✅ Total de imagens migradas: ${totalMigrated}`);
  console.log('='.repeat(60));

  await mongoose.disconnect();
  console.log('\n✅ Migração concluída!');
}

// Executa o script
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
