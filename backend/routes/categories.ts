import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
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
    const { name, emoji, slug, index } = req.body;

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

    const newCategory = new Category({ name, emoji, slug, index });
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
    const { name, emoji, slug, index } = req.body;
    const categoryId = req.params['id'];

    const category = await Category.findById(categoryId);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Categoria não encontrada',
      });
      return;
    }

    // Atualiza a categoria
    if (name !== undefined) {
      category.name = name;
    }

    if (emoji !== undefined) {
      category.emoji = emoji;
    }

    if (index !== undefined) {
      category.set('index', index);
    }

    // Se o slug foi fornecido e é diferente, atualizar produtos
    if (slug !== undefined && slug !== category.slug) {
      const oldSlug = category.slug;
      await Product.updateMany({ category: oldSlug }, { $set: { category: slug } });
      category.slug = slug;
    }

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
 * PUT /api/categories/:id/discounts
 * Atualiza descontos por role de usuário de uma categoria
 */
router.put('/:id/discounts', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryId = req.params['id'];
    const { discounts } = req.body; // Array de { roleId: string, discountPercent: number }

    if (!Array.isArray(discounts)) {
      res.status(400).json({
        success: false,
        message: 'Discounts deve ser um array',
      });
      return;
    }

    const category = await Category.findById(categoryId);

    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Categoria não encontrada',
      });
      return;
    }

    // Validar descontos
    for (const discount of discounts) {
      if (!discount.roleId || typeof discount.roleId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'roleId é obrigatório e deve ser uma string',
        });
        return;
      }

      // Validar se o roleId é um ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(discount.roleId)) {
        res.status(400).json({
          success: false,
          message: 'roleId deve ser um ObjectId válido',
        });
        return;
      }

      if (
        typeof discount.discountPercent !== 'number' ||
        discount.discountPercent < 0 ||
        discount.discountPercent > 100
      ) {
        res.status(400).json({
          success: false,
          message: 'Discount percent deve ser um número entre 0 e 100',
        });
        return;
      }
    }

    // Atualizar descontos
    category.discounts = discounts;
    await category.save();

    res.json({
      success: true,
      data: category,
      message: 'Descontos atualizados com sucesso',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Erro ao atualizar descontos',
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
