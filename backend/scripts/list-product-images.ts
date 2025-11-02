import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

const MONGO_URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/bento-box';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conectado ao MongoDB\n');

  const products = await Product.find({});

  for (const product of products) {
    console.log(`\n${product.name} (${product._id}):`);
    product.images.forEach((img: string, index: number) => {
      console.log(`  [${index + 1}] ${img}`);
    });
  }

  await mongoose.disconnect();
}

main().catch(console.error);
