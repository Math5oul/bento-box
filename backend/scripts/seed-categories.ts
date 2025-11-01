import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Category } from '../models/Category';

dotenv.config();

const defaultCategories = [
  { name: 'Pratos', emoji: '🥐', slug: 'pratos' },
  { name: 'Bebidas Quentes', emoji: '☕', slug: 'bebidas-quentes' },
  { name: 'Bebidas Frias', emoji: '🥤', slug: 'bebidas-frias' },
  { name: 'Sobremesas', emoji: '🍰', slug: 'sobremesas' },
  { name: 'Bebidas Alcoólicas', emoji: '🍺', slug: 'bebidas-alcoolicas' },
  { name: 'Bebidas', emoji: '🍹', slug: 'bebidas' },
  { name: 'Outros', emoji: '📦', slug: 'outros' },
];

async function seedCategories() {
  try {
    const mongoUri = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/bento-box';
    await mongoose.connect(mongoUri);

    console.log('✅ Conectado ao MongoDB');

    // Limpa categorias existentes
    await Category.deleteMany({});
    console.log('🗑️  Categorias antigas removidas');

    // Insere categorias padrão
    const categories = await Category.insertMany(defaultCategories);
    console.log(`✅ ${categories.length} categorias criadas com sucesso!`);

    categories.forEach(cat => {
      console.log(`   ${cat.emoji} ${cat.name} (${cat.slug})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao popular categorias:', error);
    process.exit(1);
  }
}

seedCategories();
