import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis de ambiente do diretório raiz
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Função para gerar data aleatória no último mês
function getRandomDateInLastMonth(): Date {
  const now = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(now.getMonth() - 1);

  const timestamp = oneMonthAgo.getTime() + Math.random() * (now.getTime() - oneMonthAgo.getTime());
  return new Date(timestamp);
}

// Função para gerar hora aleatória (10h-23h)
function getRandomHour(): number {
  return Math.floor(Math.random() * 13) + 10; // 10-22
}

// Métodos de pagamento com distribuição realista
const paymentMethods = [
  { method: 'cash', weight: 0.15 },
  { method: 'credit_card', weight: 0.25 },
  { method: 'debit_card', weight: 0.2 },
  { method: 'pix', weight: 0.25 },
  { method: 'online_credit', weight: 0.08 },
  { method: 'online_debit', weight: 0.05 },
  { method: 'online_pix', weight: 0.02 },
];

function getRandomPaymentMethod(): string {
  const random = Math.random();
  let cumulative = 0;

  for (const pm of paymentMethods) {
    cumulative += pm.weight;
    if (random <= cumulative) {
      return pm.method;
    }
  }

  return 'cash';
}

// Função para selecionar produtos aleatórios
function selectRandomProducts(products: any[], min: number = 1, max: number = 5): any[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const selected = [];
  const available = [...products];

  for (let i = 0; i < count && available.length > 0; i++) {
    const index = Math.floor(Math.random() * available.length);
    selected.push(available.splice(index, 1)[0]);
  }

  return selected;
}

async function seedBills() {
  try {
    console.log('🔗 Conectando ao banco de dados...');
    await mongoose.connect(process.env['MONGODB_URI']!);
    console.log('✅ Conectado ao MongoDB');

    console.log('📦 Buscando produtos...');
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const products = await Product.find();

    if (products.length === 0) {
      console.error('❌ Nenhum produto encontrado! Execute seed-products.ts primeiro.');
      process.exit(1);
    }

    console.log(`✅ Encontrados ${products.length} produtos`);
    console.log(
      'Produtos:',
      products.map((p: any) => ({ name: p.name, price: p.price, category: p.category }))
    );

    console.log('\n🔍 Buscando usuário e mesa...');
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Table = mongoose.model('Table', new mongoose.Schema({}, { strict: false }));

    const user = await User.findOne();
    let table = await Table.findOne();

    if (!table) {
      console.log('📝 Criando mesa...');
      table = await Table.create({
        number: 1,
        capacity: 4,
        status: 'available',
      });
    }

    console.log(`✅ Usando usuário: ${user?._id || 'anônimo'}`);
    console.log(`✅ Usando mesa: ${(table as any).number}`);

    // Gerar 100 bills distribuídas no último mês
    const numberOfBills = 100;
    const bills = [];

    console.log(`\n📝 Gerando ${numberOfBills} bills...`);

    for (let i = 0; i < numberOfBills; i++) {
      const date = getRandomDateInLastMonth();
      const selectedProducts = selectRandomProducts(products, 1, 5);

      const items = selectedProducts.map(product => {
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 unidades
        const unitPrice = product.price;
        const subtotal = unitPrice * quantity;

        // 20% de chance de ter desconto (5-20%)
        const hasDiscount = Math.random() < 0.2;
        const discount = hasDiscount ? subtotal * (Math.random() * 0.15 + 0.05) : 0;
        const finalPrice = subtotal - discount;

        return {
          productId: product._id,
          name: product.name,
          quantity,
          unitPrice,
          subtotal,
          discount,
          finalPrice,
          notes: hasDiscount ? 'Desconto aplicado' : '',
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
      const finalTotal = subtotal - totalDiscount;

      const paymentMethod = getRandomPaymentMethod();

      const bill = {
        tableId: table._id,
        userId: user?._id,
        items,
        subtotal,
        discount: totalDiscount,
        finalTotal,
        paymentMethod,
        status: 'paid',
        createdAt: date,
        updatedAt: date,
        paidAt: new Date(date.getTime() + Math.random() * 3600000), // Pago até 1h depois
      };

      bills.push(bill);

      if ((i + 1) % 20 === 0) {
        console.log(`   Geradas ${i + 1}/${numberOfBills} bills...`);
      }
    }

    console.log('\n💾 Salvando bills no banco de dados...');
    const Bill = mongoose.model('Bill', new mongoose.Schema({}, { strict: false }));
    await Bill.insertMany(bills);

    console.log('✅ Bills criadas com sucesso!');

    // Estatísticas
    console.log('\n📊 Estatísticas:');
    console.log(`   Total de bills: ${bills.length}`);
    console.log(
      `   Receita total: R$ ${bills.reduce((sum, b) => sum + b.finalTotal, 0).toFixed(2)}`
    );
    console.log(
      `   Ticket médio: R$ ${(bills.reduce((sum, b) => sum + b.finalTotal, 0) / bills.length).toFixed(2)}`
    );

    const paymentStats = bills.reduce(
      (acc, b) => {
        acc[b.paymentMethod] = (acc[b.paymentMethod] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log('\n   Distribuição por método de pagamento:');
    Object.entries(paymentStats).forEach(([method, count]) => {
      console.log(`   - ${method}: ${count} (${((count / bills.length) * 100).toFixed(1)}%)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar bills:', error);
    process.exit(1);
  }
}

seedBills();
