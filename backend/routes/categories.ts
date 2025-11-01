import { Router, Request, Response } from 'express';
import { Category } from '../models/Category';
import Product from '../models/Product';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/categories
 * Lista todas as categorias
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    // Conta produtos por categoria
    const categoriesWithCount = await Promise.all(
      categories.map(async category => {
        const productCount = await Product.countDocuments({ category: category.slug });
        return {
          ...category.toObject(),
          productCount,
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCount,
      count: categories.length,
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
 * GET /api/categories/:id
 * Busca categoria por ID
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params['id']);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Categoria não encontrada',
      });
      return;
    }

    const productCount = await Product.countDocuments({ category: category.slug });

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        productCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar categoria',
      error: error.message,
    });
  }
});

/**
 * POST /api/categories
 * Cria nova categoria
 */
router.post('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, emoji, slug } = req.body;

    // Verifica se já existe categoria com esse nome ou slug
    const existingCategory = await Category.findOne({
      $or: [{ name }, { slug }],
    });

    if (existingCategory) {
      res.status(400).json({
        success: false,
        message: 'Já existe uma categoria com esse nome ou slug',
      });
      return;
    }

    const newCategory = new Category({ name, emoji, slug });
    await newCategory.save();

    res.status(201).json({
      success: true,
      data: newCategory,
      message: 'Categoria criada com sucesso',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Erro ao criar categoria',
      error: error.message,
    });
  }
});

/**
 * PUT /api/categories/:id
 * Atualiza categoria (renomear)
 */
router.put('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, emoji, slug } = req.body;
    const categoryId = req.params['id'];

    const category = await Category.findById(categoryId);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Categoria não encontrada',
      });
      return;
    }

    const oldSlug = category.slug;
    const newSlug = slug || category.slug;

    // Se o slug mudou, atualizar todos os produtos com a categoria antiga
    if (oldSlug !== newSlug) {
      await Product.updateMany({ category: oldSlug }, { $set: { category: newSlug } });
    }

    // Atualiza a categoria
    category.name = name || category.name;
    category.emoji = emoji || category.emoji;
    category.slug = newSlug;

    await category.save();

    res.json({
      success: true,
      data: category,
      message: 'Categoria atualizada com sucesso',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Erro ao atualizar categoria',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/categories/:id
 * Deleta categoria (somente se não houver produtos)
 */
router.delete('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryId = req.params['id'];

    const category = await Category.findById(categoryId);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Categoria não encontrada',
      });
      return;
    }

    // Verifica se há produtos usando essa categoria
    const productCount = await Product.countDocuments({ category: category.slug });

    if (productCount > 0) {
      res.status(400).json({
        success: false,
        message: `Não é possível deletar esta categoria. Existem ${productCount} produto(s) vinculado(s).`,
      });
      return;
    }

    await Category.findByIdAndDelete(categoryId);

    res.json({
      success: true,
      message: 'Categoria deletada com sucesso',
      data: category,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar categoria',
      error: error.message,
    });
  }
});

export default router;
