import { Router, Request, Response } from 'express';
import Product from '../models/Product';
import Category from '../models/Category';
import { authenticate, optionalAuth, requirePermission } from '../middleware/auth';
import { auditLog } from '../middleware/auditLogger';

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

    // Busca todas as categorias para mapear (com fallback se der erro)
    let categoryMap = new Map();
    try {
      const categories = await Category.find({}).lean();
      categories.forEach((cat: any) => {
        categoryMap.set(cat.slug, cat);
      });
    } catch (catError) {
      console.error('Erro ao buscar categorias:', catError);
    }

    const menuItems = products.map(product => {
      let categoryData = null;

      try {
        const category = categoryMap.get(product.category);

        if (category) {
          categoryData = {
            _id: category._id?.toString(),
            name: category.name,
            slug: category.slug,
            discounts: (category.discounts || []).map((d: any) => ({
              roleId: d.roleId?.toString(),
              roleName: d.roleName,
              discountPercent: d.discountPercent,
            })),
          };
        }
      } catch (mapError) {
        console.error('Erro ao mapear categoria:', mapError);
      }

      return {
        id: product._id,
        component: 'SimpleProductComponent',
        inputs: {
          format: product.format,
          images: product.images,
          colorMode: product.colorMode,
          productName: product.name,
          description: product.description,
          price: product.price,
          sizes: product.sizes,
          variations: product.variations,
          category: categoryData,
        },
        colSpan: product.gridPosition?.colSpan || 1,
        rowSpan: product.gridPosition?.rowSpan || 1,
        row: product.gridPosition?.row || 0,
        col: product.gridPosition?.col || 0,
      };
    });

    res.json({
      success: true,
      data: { items: menuItems },
    });
  } catch (error: any) {
    console.error('Erro ao buscar menu:', error);
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
router.get('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params['id'];
    // Verifica se o id é um ObjectId válido
    if (!id || !id.match(/^[a-fA-F0-9]{24}$/)) {
      res.status(400).json({
        success: false,
        message: 'ID de produto inválido',
      });
      return;
    }
    const product = await Product.findById(id);
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
 * Converte formato (ex: '2x1') para rowSpan e colSpan
 */
function getSpansFromFormat(format: string): { rowSpan: number; colSpan: number } {
  const match = format.match(/(\d+)x(\d+)/);
  if (match) {
    return {
      colSpan: parseInt(match[1]), // primeiro número = colunas
      rowSpan: parseInt(match[2]), // segundo número = linhas
    };
  }
  return { rowSpan: 1, colSpan: 1 }; // fallback para 1x1
}

/**
 * POST /api/products
 * Cria novo produto
 */
router.post(
  '/',
  authenticate,
  requirePermission('canManageProducts'),
  auditLog('CREATE_PRODUCT', 'products'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const productData = req.body;

      // Calcula rowSpan e colSpan baseado no formato
      const format = productData.format || '1x1';
      const spans = getSpansFromFormat(format);

      // Garante que gridPosition existe e tem os spans corretos
      if (!productData.gridPosition) {
        productData.gridPosition = {};
      }
      productData.gridPosition.rowSpan = spans.rowSpan;
      productData.gridPosition.colSpan = spans.colSpan;

      const newProduct = new Product(productData);
      await newProduct.save();

      res.status(201).json({
        success: true,
        data: newProduct,
        message: 'Produto criado com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      res.status(400).json({
        success: false,
        message: 'Erro ao criar produto',
        error: error.message,
      });
    }
  }
);

/**
 * PUT /api/products/:id
 * Atualiza produto completo
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('canManageProducts'),
  auditLog('UPDATE_PRODUCT', 'products'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const updateData = { ...req.body };

      // Se o formato for alterado, atualizar gridPosition automaticamente
      if (updateData.format) {
        const spans = getSpansFromFormat(updateData.format);
        if (!updateData.gridPosition) {
          updateData.gridPosition = {};
        }
        updateData.gridPosition.rowSpan = spans.rowSpan;
        updateData.gridPosition.colSpan = spans.colSpan;
      }

      const product = await Product.findByIdAndUpdate(req.params['id'], updateData, {
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
  }
);

/**
 * PATCH /api/products/:id/position
 * Atualiza apenas a posição do grid de um produto
 */
router.patch(
  '/:id/position',
  authenticate,
  requirePermission('canManageProducts'),
  async (req: Request, res: Response): Promise<void> => {
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
  }
);

/**
 * PATCH /api/products/batch/positions
 * Atualiza posições de múltiplos produtos
 */
router.patch(
  '/batch/positions',
  authenticate,
  requirePermission('canManageProducts'),
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
 * Deleta produto e suas imagens
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('canManageProducts'),
  auditLog('DELETE_PRODUCT', 'products'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const productId = req.params['id'];
      const product = await Product.findByIdAndDelete(productId);

      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Produto não encontrado',
        });
        return;
      }

      // Deleta também a pasta de imagens do produto
      try {
        const path = require('path');
        const fs = require('fs');
        const IMAGES_BASE_PATH = path.join(__dirname, '..', '..', 'src', 'assets', 'images');
        const productImageFolder = path.join(IMAGES_BASE_PATH, productId);

        if (fs.existsSync(productImageFolder)) {
          fs.rmSync(productImageFolder, { recursive: true, force: true });
        }
      } catch (imageError: any) {
        console.error('Erro ao deletar pasta de imagens:', imageError);
      }

      res.json({
        success: true,
        message: 'Produto e imagens deletados com sucesso',
        data: product,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Erro ao deletar produto',
        error: error.message,
      });
    }
  }
);

export default router;
