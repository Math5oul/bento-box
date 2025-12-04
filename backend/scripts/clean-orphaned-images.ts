import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import Product from '../models/Product';

/**
 * Script para limpar imagens órfãs que não pertencem a nenhum produto
 * Uso: npx ts-node --project tsconfig.backend.json backend/scripts/clean-orphaned-images.ts
 *
 * Este script:
 * 1. Remove pastas de imagens que não correspondem a produtos existentes
 * 2. Remove pastas temporárias antigas (mais de 1 hora)
 * 3. Fornece relatório detalhado da limpeza
 */

const IMAGES_BASE_PATH = path.join(__dirname, '..', '..', 'src', 'assets', 'images');

async function cleanOrphanedImages() {
  try {
    // Conecta ao MongoDB
    await mongoose.connect(process.env['MONGODB_URI'] || 'mongodb://localhost:27017/bento-box');
    console.log('📦 Conectado ao MongoDB');

    // Busca todos os produtos
    const products = await Product.find({}, { _id: 1 }).lean();
    const productIds = products.map(p => p._id.toString());
    console.log(`📊 Encontrados ${productIds.length} produtos no banco`);

    // Lista todas as pastas de imagens
    const imageFolders = fs.readdirSync(IMAGES_BASE_PATH).filter(folder => {
      const fullPath = path.join(IMAGES_BASE_PATH, folder);
      return fs.statSync(fullPath).isDirectory();
    });

    console.log(`📁 Encontradas ${imageFolders.length} pastas de imagem`);

    let orphanedFolders = 0;
    let tempFolders = 0;

    for (const folder of imageFolders) {
      // Pula pastas temporárias (serão limpas separadamente)
      if (folder.startsWith('temp-')) {
        tempFolders++;

        // Remove pastas temporárias antigas (mais de 1 hora)
        const folderPath = path.join(IMAGES_BASE_PATH, folder);
        const stats = fs.statSync(folderPath);
        const isOld = Date.now() - stats.birthtime.getTime() > 3600000; // 1 hora

        if (isOld) {
          console.log(`🗑️ Removendo pasta temporária antiga: ${folder}`);
          fs.rmSync(folderPath, { recursive: true, force: true });
          tempFolders--;
        }
        continue;
      }

      // Verifica se a pasta corresponde a um produto existente
      if (!productIds.includes(folder)) {
        const folderPath = path.join(IMAGES_BASE_PATH, folder);
        console.log(`🗑️ Pasta órfã encontrada: ${folder}`);

        // Lista arquivos na pasta órfã
        try {
          const files = fs.readdirSync(folderPath);
          console.log(`   📄 Arquivos: ${files.join(', ')}`);

          // Remove a pasta órfã
          fs.rmSync(folderPath, { recursive: true, force: true });
          console.log(`   ✅ Pasta removida`);
          orphanedFolders++;
        } catch (err) {
          console.error(`   ❌ Erro ao remover pasta: ${err}`);
        }
      }
    }

    console.log('\n📊 Resumo da limpeza:');
    console.log(`   🗑️ Pastas órfãs removidas: ${orphanedFolders}`);
    console.log(`   ⏰ Pastas temporárias restantes: ${tempFolders}`);
    console.log(`   ✅ Pastas válidas: ${imageFolders.length - orphanedFolders - tempFolders}`);
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

cleanOrphanedImages();
