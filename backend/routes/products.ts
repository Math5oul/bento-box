import { Router, Request, Response } from 'express';
import Product from '../models/Product';
import { optionalAuth } from '../middleware/auth';
const router = Router();

/**
 * GET /api/products
 * Lista todos os produtos com filtros opcionais
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { category, available, search, sortBy = 'name', order = 'asc' } = req.query;

    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    if (available !== undefined) {
      filter.available = available === 'true';
    }

    if (search) {
      filter.$text = { $search: search as string };
    }

    const products = await Product.find(filter).sort({
      [sortBy as string]: order === 'asc' ? 1 : -1,
    });

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar produtos',
      error: error.message,
    });
  }
});

/**
 * GET /api/products/menu
 * Retorna produtos formatados para o grid do menu
 */
router.get('/menu', optionalAuth, async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ available: true }).sort({
      'gridPosition.row': 1,
      'gridPosition.col': 1,
    });

    const menuItems = products.map(product => ({
      id: product._id,
      component: 'SimpleProductComponent',
      inputs: {
        format: product.format,
        images: product.images,
        colorMode: product.colorMode,
        productName: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
      },
      colSpan: product.gridPosition?.colSpan || 1,
      rowSpan: product.gridPosition?.rowSpan || 1,
      row: product.gridPosition?.row || 0,
      col: product.gridPosition?.col || 0,
    }));

    res.json({
      success: true,
      data: { items: menuItems },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar menu',
      error: error.message,
    });
  }
});

/**
 * GET /api/products/categories
 * Lista todas as categorias com estatísticas
 */
router.get('/categories', optionalAuth, async (req: Request, res: Response) => {
  try {
    const categories = await Product.aggregate([
      { $match: { available: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar categorias',
      error: error.message,
    });
  }
});

/**
 * GET /api/products/:id
 * Busca produto por ID
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params['id']);

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Produto não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar produto',
      error: error.message,
    });
  }
});

/**
 * POST /api/products
 * Cria novo produto
 */
router.post('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const productData = req.body;

    const newProduct = new Product(productData);
    await newProduct.save();

    res.status(201).json({
      success: true,
      data: newProduct,
      message: 'Produto criado com sucesso',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Erro ao criar produto',
      error: error.message,
    });
  }
});

/**
 * PUT /api/products/:id
 * Atualiza produto completo
 */
router.put('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(req.params['id'], req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Produto não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: product,
      message: 'Produto atualizado com sucesso',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Erro ao atualizar produto',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/products/:id/position
 * Atualiza apenas a posição do grid de um produto
 */
router.patch('/:id/position', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { row, col, rowSpan, colSpan } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params['id'],
      {
        $set: {
          'gridPosition.row': row,
          'gridPosition.col': col,
          'gridPosition.rowSpan': rowSpan,
          'gridPosition.colSpan': colSpan,
        },
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Produto não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: product,
      message: 'Posição atualizada com sucesso',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Erro ao atualizar posição',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/products/batch/positions
 * Atualiza posições de múltiplos produtos
 */
router.patch(
  '/batch/positions',
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { products } = req.body;

      if (!Array.isArray(products)) {
        res.status(400).json({
          success: false,
          message: 'Formato inválido. Esperado: { products: [...] }',
        });
        return;
      }

      const updatePromises = products.map(item =>
        Product.findByIdAndUpdate(
          item.id,
          {
            $set: {
              'gridPosition.row': item.row,
              'gridPosition.col': item.col,
              'gridPosition.rowSpan': item.rowSpan,
              'gridPosition.colSpan': item.colSpan,
            },
          },
          { new: true }
        )
      );

      const updatedProducts = await Promise.all(updatePromises);

      res.json({
        success: true,
        data: updatedProducts.filter(p => p !== null),
        message: `${updatedProducts.length} produtos atualizados`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar posições em lote',
        error: error.message,
      });
    }
  }
);

/**
 * DELETE /api/products/:id
 * Deleta produto
 */
router.delete('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params['id']);

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Produto não encontrado',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Produto deletado com sucesso',
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar produto',
      error: error.message,
    });
  }
});

export default router;
