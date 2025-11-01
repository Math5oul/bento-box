import mongoose from 'mongoose';
import Filler from '../models/Filler';
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

async function migrateFillerCategories() {
  try {
    console.log('🔗 Conectando ao banco de dados...');
    await connectDB();

    console.log('📊 Buscando fillers com categorias antigas...');
    const fillers = await Filler.find({});
    console.log(`✅ Encontrados ${fillers.length} fillers`);

    let migrated = 0;
    let skipped = 0;
    let categoriesUpdated = 0;

    for (const filler of fillers) {
      let hasChanges = false;
      const oldCategories = filler.categories || [];
      const newCategories: string[] = [];

      for (const oldCat of oldCategories) {
        const newCat = categoryMapping[oldCat];
        if (newCat) {
          newCategories.push(newCat);
          hasChanges = true;
          categoriesUpdated++;
        } else if (oldCat.includes('-')) {
          // Já está no novo formato (slug)
          newCategories.push(oldCat);
        } else {
          console.log(`⚠️  Categoria desconhecida em filler ${filler._id}: "${oldCat}"`);
          newCategories.push(oldCat);
        }
      }

      if (hasChanges) {
        filler.categories = newCategories;
        await filler.save();
        console.log(
          `✅ Filler ${filler._id} (${filler.type}): ${oldCategories.join(', ')} → ${newCategories.join(', ')}`
        );
        migrated++;
      } else {
        console.log(`⏭️  Filler ${filler._id}: sem mudanças necessárias`);
        skipped++;
      }
    }

    console.log('\n📈 Resumo da migração:');
    console.log(`   ✅ Fillers migrados: ${migrated}`);
    console.log(`   ⏭️  Fillers pulados: ${skipped}`);
    console.log(`   🏷️  Categorias atualizadas: ${categoriesUpdated}`);
    console.log(`   📦 Total de fillers: ${fillers.length}`);

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao migrar categorias de fillers:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexão com o banco de dados encerrada.');
  }
}

migrateFillerCategories();
