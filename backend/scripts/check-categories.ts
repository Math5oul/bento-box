/**
 * Script para verificar categorias e seus descontos
 */
import '../config/database';
import Category from '../models/Category';

async function checkCategories() {
  try {
    console.log('🔍 Verificando categorias...\n');

    const categories = await Category.find({});

    console.log(`✅ ${categories.length} categorias encontradas:\n`);

    categories.forEach((cat: any) => {
      console.log(`📂 Categoria: ${cat.name} (slug: ${cat.slug})`);
      console.log(`   ID: ${cat._id}`);

      if (cat.discounts && cat.discounts.length > 0) {
        console.log(`   💰 ${cat.discounts.length} desconto(s):`);
        cat.discounts.forEach((discount: any) => {
          console.log(`      - Role ID: ${discount.roleId}`);
          console.log(`        Desconto: ${discount.discountPercent}%`);
          if (discount.roleName) {
            console.log(`        Nome: ${discount.roleName}`);
          }
        });
      } else {
        console.log(`   ⚠️  Sem descontos configurados`);
      }
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkCategories();
