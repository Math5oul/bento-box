import { Router, Request, Response } from 'express';
import { ReportCategory } from '../models/ReportCategory';
import { Bill } from '../models/Bill';
import mongoose from 'mongoose';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticate);

/**
 * GET /api/reports/categories
 * Listar todas as categorias de relatório
 */
router.get(
  '/categories',
  requirePermission('canViewReports'),
  async (req: Request, res: Response) => {
    try {
      const categories = await ReportCategory.find()
        .populate('productIds', 'name price')
        .sort({ name: 1 });

      res.json({ categories });
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      res.status(500).json({ error: 'Erro ao buscar categorias de relatório' });
    }
  }
);

/**
 * POST /api/reports/categories
 * Criar nova categoria de relatório
 */
router.post(
  '/categories',
  requirePermission('canManageSystemSettings'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, color, productIds } = req.body;

      // Validar dados
      if (!name || !name.trim()) {
        res.status(400).json({ error: 'Nome é obrigatório' });
        return;
      }

      // Verificar se já existe
      const existing = await ReportCategory.findOne({ name: name.trim() });
      if (existing) {
        res.status(400).json({ error: 'Já existe uma categoria com este nome' });
        return;
      }

      // Remover produtos desta categoria de outras categorias
      if (productIds && productIds.length > 0) {
        await ReportCategory.updateMany(
          { productIds: { $in: productIds } },
          { $pull: { productIds: { $in: productIds } } }
        );
      }

      const category = new ReportCategory({
        name: name.trim(),
        description: description?.trim(),
        color: color || '#3b82f6',
        productIds: productIds || [],
      });

      await category.save();
      await category.populate('productIds', 'name price');

      res.status(201).json({ category });
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      res.status(500).json({ error: 'Erro ao criar categoria de relatório' });
    }
  }
);

/**
 * PUT /api/reports/categories/:id
 * Atualizar categoria de relatório
 */
router.put(
  '/categories/:id',
  requirePermission('canManageSystemSettings'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, description, color, productIds } = req.body;

      const category = await ReportCategory.findById(id);
      if (!category) {
        res.status(404).json({ error: 'Categoria não encontrada' });
        return;
      }

      // Validar nome
      if (name && name.trim()) {
        const existing = await ReportCategory.findOne({
          name: name.trim(),
          _id: { $ne: id },
        });
        if (existing) {
          res.status(400).json({ error: 'Já existe uma categoria com este nome' });
          return;
        }
        category.name = name.trim();
      }

      if (description !== undefined) category.description = description?.trim();
      if (color) category.color = color;

      // Remover produtos desta categoria de outras categorias
      if (productIds) {
        await ReportCategory.updateMany(
          { _id: { $ne: id }, productIds: { $in: productIds } },
          { $pull: { productIds: { $in: productIds } } }
        );
        category.productIds = productIds;
      }

      await category.save();
      await category.populate('productIds', 'name price');

      res.json({ category });
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      res.status(500).json({ error: 'Erro ao atualizar categoria' });
    }
  }
);

/**
 * DELETE /api/reports/categories/:id
 * Deletar categoria de relatório
 */
router.delete(
  '/categories/:id',
  requirePermission('canManageSystemSettings'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const category = await ReportCategory.findByIdAndDelete(id);
      if (!category) {
        res.status(404).json({ error: 'Categoria não encontrada' });
        return;
      }

      res.json({ message: 'Categoria deletada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      res.status(500).json({ error: 'Erro ao deletar categoria' });
    }
  }
);

/**
 * POST /api/reports/sales
 * Gerar relatório de vendas por período
 */
router.post(
  '/sales',
  requirePermission('canViewReports'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate, categoryIds, productIds, paymentMethods } = req.body;

      console.log('Received report request:', {
        startDate,
        endDate,
        categoryIds,
        productIds,
        paymentMethods,
      });

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Datas de início e fim são obrigatórias' });
        return;
      }

      // Mapear métodos de pagamento para incluir variantes online
      const expandPaymentMethods = (methods: string[]): string[] => {
        const expanded: string[] = [];

        methods.forEach(method => {
          expanded.push(method); // Adiciona o método original

          // Adiciona variantes online correspondentes
          switch (method) {
            case 'credit_card':
              expanded.push('online_credit');
              break;
            case 'debit_card':
              expanded.push('online_debit');
              break;
            case 'pix':
              expanded.push('online_pix');
              break;
          }
        });

        return expanded;
      };

      // Construir query para Bills
      const query: any = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        status: 'paid', // Apenas contas pagas
      };

      if (paymentMethods && paymentMethods.length > 0) {
        const expandedMethods = expandPaymentMethods(paymentMethods);
        query.paymentMethod = { $in: expandedMethods };
      }

      // Buscar Bills do período
      const bills = await Bill.find(query)
        .populate('items.productId', 'name price')
        .sort({ createdAt: 1 });

      console.log(`Found ${bills.length} bills`);

      // Buscar categorias de relatório
      const categories = await ReportCategory.find().populate('productIds');

      console.log(`Found ${categories.length} categories`);

      // Processar dados
      console.log('Starting to process sales data...');
      const report = processSalesData(bills, categories, { categoryIds, productIds });
      console.log('Sales data processed successfully');

      res.json(report);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Error details:', JSON.stringify(error, null, 2));
      res.status(500).json({ error: 'Erro ao gerar relatório de vendas' });
    }
  }
);

/**
 * Função auxiliar para processar dados de vendas
 */
function processSalesData(bills: any[], categories: any[], filters: any) {
  const salesByCategory: Map<string, any> = new Map();
  const salesByProduct: Map<string, any> = new Map();
  const salesByPaymentMethod: Map<string, any> = new Map();
  const dailySales: Map<string, any> = new Map();

  let totalSales = 0;
  let totalRevenue = 0;

  // Criar map de produto -> categoria
  const productToCategoryMap = new Map<string, any>();
  categories.forEach(cat => {
    if (cat.productIds && Array.isArray(cat.productIds)) {
      cat.productIds.forEach((prod: any) => {
        if (prod && prod._id) {
          productToCategoryMap.set(prod._id.toString(), {
            id: cat._id.toString(),
            name: cat.name,
            color: cat.color,
          });
        }
      });
    }
  });

  bills.forEach(bill => {
    const billDate = new Date(bill.createdAt).toISOString().split('T')[0];
    const billTotal = bill.finalTotal || bill.total || 0;

    totalSales++;
    totalRevenue += billTotal;

    // Vendas por método de pagamento - normalizar métodos online
    let method = bill.paymentMethod || 'unknown';
    // Mapear métodos online para seus equivalentes locais
    if (method === 'online_credit') method = 'credit_card';
    if (method === 'online_debit') method = 'debit_card';
    if (method === 'online_pix') method = 'pix';

    if (!salesByPaymentMethod.has(method)) {
      salesByPaymentMethod.set(method, { method, count: 0, revenue: 0 });
    }
    const methodData = salesByPaymentMethod.get(method)!;
    methodData.count++;
    methodData.revenue += billTotal;

    // Vendas diárias
    if (!dailySales.has(billDate)) {
      dailySales.set(billDate, { date: billDate, sales: 0, revenue: 0 });
    }
    const dayData = dailySales.get(billDate)!;
    dayData.sales++;
    dayData.revenue += billTotal;

    // Processar itens
    if (bill.items && Array.isArray(bill.items)) {
      bill.items.forEach((item: any) => {
        // Bill items já têm productName e unitPrice salvos
        if (!item.productId) return;

        const productId = item.productId._id
          ? item.productId._id.toString()
          : item.productId.toString();
        const productName = item.productId.name || item.productName || 'Produto sem nome';
        // Usar finalPrice que já considera descontos, ou calcular de subtotal
        const itemRevenue =
          item.finalPrice || item.subtotal || item.quantity * (item.unitPrice || 0);

        // Aplicar filtros
        if (filters.productIds && !filters.productIds.includes(productId)) return;

        // Vendas por produto
        if (!salesByProduct.has(productId)) {
          salesByProduct.set(productId, {
            productId,
            productName,
            quantity: 0,
            revenue: 0,
          });
        }
        const prodData = salesByProduct.get(productId)!;
        prodData.quantity += item.quantity;
        prodData.revenue += itemRevenue;

        // Vendas por categoria
        const category = productToCategoryMap.get(productId);
        if (category) {
          if (filters.categoryIds && !filters.categoryIds.includes(category.id)) return;

          if (!salesByCategory.has(category.id)) {
            salesByCategory.set(category.id, {
              categoryId: category.id,
              categoryName: category.name,
              color: category.color,
              quantity: 0,
              revenue: 0,
              products: new Map(),
            });
          }
          const catData = salesByCategory.get(category.id)!;
          catData.quantity += item.quantity;
          catData.revenue += itemRevenue;

          if (!catData.products.has(productId)) {
            catData.products.set(productId, {
              productId,
              productName,
              quantity: 0,
              revenue: 0,
            });
          }
          const catProdData = catData.products.get(productId)!;
          catProdData.quantity += item.quantity;
          catProdData.revenue += itemRevenue;
        }
      });
    }
  });

  // Converter Maps para arrays e calcular percentuais
  const categoriesArray = Array.from(salesByCategory.values()).map(cat => ({
    ...cat,
    products: Array.from(cat.products.values()).map((prod: any) => ({
      ...prod,
      averagePrice: prod.revenue / prod.quantity,
    })),
    percentage: totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0,
  }));

  const productsArray = Array.from(salesByProduct.values()).map(prod => ({
    ...prod,
    averagePrice: prod.revenue / prod.quantity,
  }));

  const paymentMethodsArray = Array.from(salesByPaymentMethod.values()).map(method => ({
    ...method,
    percentage: totalRevenue > 0 ? (method.revenue / totalRevenue) * 100 : 0,
  }));

  const dailySalesArray = Array.from(dailySales.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return {
    startDate: bills.length > 0 ? bills[0].createdAt : new Date(),
    endDate: bills.length > 0 ? bills[bills.length - 1].createdAt : new Date(),
    totalSales,
    totalRevenue,
    salesByCategory: categoriesArray,
    salesByProduct: productsArray,
    salesByPaymentMethod: paymentMethodsArray,
    dailySales: dailySalesArray,
  };
}

export default router;
