import { Router, Request, Response } from 'express';
import Product from '../models/Product';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/products
 * Lista todos os produtos disponíveis
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { category, available, search, sortBy = 'name', order = 'asc' } = req.query;

    // Constrói filtros
    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    if (available !== undefined) {
      filter.available = available === 'true';
    }

    // Busca por texto
    if (search) {
      filter.$text = { $search: search as string };
    }

    // Busca produtos
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

    // Formata para o formato esperado pelo frontend
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
 * Lista todas as categorias com contagem
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

export default router;
