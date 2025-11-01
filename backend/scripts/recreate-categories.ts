import mongoose from 'mongoose';
import Category from '../models/Category';
import { connectDB } from '../config/database';

const defaultCategories = [
  { name: 'Pratos', emoji: '🥐', slug: 'pratos' },
  { name: 'Bebidas Quentes', emoji: '☕', slug: 'bebidas-quentes' },
  { name: 'Bebidas Frias', emoji: '🥤', slug: 'bebidas-frias' },
  { name: 'Sobremesas', emoji: '🍰', slug: 'sobremesas' },
  { name: 'Bebidas Alcoolicas', emoji: '🍺', slug: 'bebidas-alcoolicas' },
  { name: 'Bebidas', emoji: '🍹', slug: 'bebidas' },
  { name: 'Outros', emoji: '📦', slug: 'outros' },
];

async function recreateCategories() {
  try {
    console.log('🔗 Conectando ao banco de dados...');
    await connectDB();

    console.log('🗑️  Deletando categorias existentes...');
    const deleteResult = await Category.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount} categorias deletadas`);

    console.log('\n📝 Criando novas categorias...');

    for (const cat of defaultCategories) {
      const newCategory = new Category(cat);
      await newCategory.save();
      console.log(`✅ Criada: ${cat.emoji} ${cat.name} (${cat.slug})`);
    }

    console.log('\n🔍 Verificando categorias criadas...');
    const categories = await Category.find({});
    console.log(`\n📊 Total de categorias: ${categories.length}`);

    console.log('\n📋 Categorias no banco:');
    categories.forEach(cat => {
      console.log(`   ${cat.emoji} ${cat.name} (${cat.slug})`);
    });

    console.log('\n✅ Recriação concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao recriar categorias:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com o banco de dados encerrada.');
  }
}

recreateCategories();
