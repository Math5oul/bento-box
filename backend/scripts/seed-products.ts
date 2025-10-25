import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import Product from '../models/Product';
import menuData from '../../src/assets/data/menu-data.json';

// Carrega variáveis de ambiente
dotenv.config();

/**
 * Mapeia categoria baseado no nome do produto
 */
function getCategoryFromName(name: string): 'beverage' | 'food' | 'dessert' | 'other' {
  const nameLower = name.toLowerCase();

  // Bebidas
  if (
    nameLower.includes('café') ||
    nameLower.includes('espresso') ||
    nameLower.includes('latte') ||
    nameLower.includes('cappuccino') ||
    nameLower.includes('americano') ||
    nameLower.includes('mocha') ||
    nameLower.includes('chá') ||
    nameLower.includes('coffee') ||
    nameLower.includes('smoothie') ||
    nameLower.includes('limonada') ||
    nameLower.includes('chocolat')
  ) {
    return 'beverage';
  }

  // Sobremesas
  if (
    nameLower.includes('bolo') ||
    nameLower.includes('donut') ||
    nameLower.includes('muffin') ||
    nameLower.includes('cheesecake') ||
    nameLower.includes('tiramisu') ||
    nameLower.includes('crepe')
  ) {
    return 'dessert';
  }

  // Comidas
  if (
    nameLower.includes('croissant') ||
    nameLower.includes('sanduíche') ||
    nameLower.includes('sandwich')
  ) {
    return 'food';
  }

  return 'other';
}

/**
 * Seed de Produtos
 */
async function seedProducts() {
  try {
    console.log('🌱 Iniciando seed de produtos...');

    // Conecta ao MongoDB
    await connectDB();

    // Limpa produtos existentes
    const deleteResult = await Product.deleteMany({});
    console.log(`🗑️  ${deleteResult.deletedCount} produtos removidos`);

    // Filtra apenas os produtos (SimpleProductComponent)
    const productsToSeed = menuData.items
      .filter((item: any) => item.component === 'SimpleProductComponent')
      .map((item: any) => ({
        name: item.inputs.productName,
        description: item.inputs.description,
        price: item.inputs.price,
        images: item.inputs.images || [],
        category: getCategoryFromName(item.inputs.productName),
        format: item.inputs.format || '1x1',
        colorMode: item.inputs.colorMode || 'light',
        available: true,
        gridPosition: {
          row: item.row,
          col: item.col,
          rowSpan: item.rowSpan || 1,
          colSpan: item.colSpan || 1,
        },
      }));

    // Insere produtos
    const insertedProducts = await Product.insertMany(productsToSeed);

    console.log(`✅ ${insertedProducts.length} produtos inseridos com sucesso!`);

    // Mostra resumo por categoria
    const categories = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log('\n📊 Resumo por Categoria:');
    categories.forEach(cat => {
      console.log(
        `   ${cat._id}: ${cat.count} produtos (preço médio: $${cat.avgPrice.toFixed(2)})`
      );
    });

    console.log('\n🎉 Seed concluído!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  }
}

// Executa o seed
seedProducts();
