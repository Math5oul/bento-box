import mongoose from 'mongoose';
import Product from '../models/Product';
import { connectDB } from '../config/database';

const categoryMapping: { [key: string]: string } = {
  food: 'pratos',
  'hot beverage': 'bebidas-quentes',
  'cold beverage': 'bebidas-frias',
  dessert: 'sobremesas',
  alcoholic: 'bebidas-alcoolicas',
  beverage: 'bebidas',
  other: 'outros',
};

async function migrateCategories() {
  try {
    console.log('🔗 Conectando ao banco de dados...');
    await connectDB();

    console.log('📊 Buscando produtos com categorias antigas...');
    const products = await Product.find({});
    console.log(`✅ Encontrados ${products.length} produtos`);

    let migrated = 0;
    let skipped = 0;

    for (const product of products) {
      const oldCategory = product.category;
      const newCategory = categoryMapping[oldCategory];

      if (newCategory) {
        product.category = newCategory;
        await product.save();
        console.log(`✅ ${product.name}: "${oldCategory}" → "${newCategory}"`);
        migrated++;
      } else if (oldCategory.includes('-')) {
        // Já está no novo formato
        console.log(`⏭️  ${product.name}: já usa slug "${oldCategory}"`);
        skipped++;
      } else {
        console.log(`⚠️  ${product.name}: categoria desconhecida "${oldCategory}"`);
        skipped++;
      }
    }

    console.log('\n📈 Resumo da migração:');
    console.log(`   ✅ Migrados: ${migrated}`);
    console.log(`   ⏭️  Pulados: ${skipped}`);
    console.log(`   📦 Total: ${products.length}`);

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao migrar categorias:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexão com o banco de dados encerrada.');
  }
}

migrateCategories();
