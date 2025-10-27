import { Router, Request, Response } from 'express';
import Filler from '../models/Filler';

const router = Router();

/**
 * GET /api/fillers
 * Lista todos os fillers ativos
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const fillers = await Filler.find({ active: true }).sort({ createdAt: -1 });
    res.json(fillers);
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao buscar fillers', error: error.message });
  }
});

/**
 * GET /api/fillers/:id
 * Busca um filler específico por ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const filler = await Filler.findById(req.params['id']);
    if (!filler) {
      res.status(404).json({ message: 'Filler não encontrado' });
      return;
    }
    res.json(filler);
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao buscar filler', error: error.message });
  }
});

/**
 * POST /api/fillers
 * Cria um novo filler
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const filler = new Filler(req.body);
    const savedFiller = await filler.save();
    res.status(201).json(savedFiller);
  } catch (error: any) {
    console.error('❌ Erro ao criar filler:', error);
    res.status(400).json({ message: 'Erro ao criar filler', error: error.message });
  }
});

/**
 * PUT /api/fillers/:id
 * Atualiza um filler existente
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const filler = await Filler.findByIdAndUpdate(req.params['id'], req.body, {
      new: true,
      runValidators: true,
    });

    if (!filler) {
      res.status(404).json({ message: 'Filler não encontrado' });
      return;
    }

    res.json(filler);
  } catch (error: any) {
    console.error('❌ Erro ao atualizar filler:', error);
    res.status(400).json({ message: 'Erro ao atualizar filler', error: error.message });
  }
});

/**
 * DELETE /api/fillers/:id
 * Remove permanentemente um filler do banco de dados
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const filler = await Filler.findByIdAndDelete(req.params['id']);
    if (!filler) {
      res.status(404).json({ message: 'Filler não encontrado' });
      return;
    }
    res.json({ message: 'Filler deletado permanentemente com sucesso', filler });
  } catch (error: any) {
    res.status(500).json({ message: 'Erro ao deletar filler', error: error.message });
  }
});

/**
 * PATCH /api/fillers/:id/position
 * Atualiza apenas a posição de um filler no grid
 */
router.patch('/:id/position', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gridPosition } = req.body;
    const filler = await Filler.findByIdAndUpdate(
      req.params['id'],
      { gridPosition },
      { new: true, runValidators: true }
    );
    if (!filler) {
      res.status(404).json({ message: 'Filler não encontrado' });
      return;
    }
    res.json(filler);
  } catch (error: any) {
    res.status(400).json({ message: 'Erro ao atualizar posição', error: error.message });
  }
});

/**
 * PATCH /api/fillers/batch/positions
 * Atualiza posições de múltiplos fillers de uma vez
 */
router.patch('/batch/positions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      res.status(400).json({ message: 'Updates deve ser um array' });
      return;
    }

    const promises = updates.map(({ id, gridPosition }: any) =>
      Filler.findByIdAndUpdate(id, { gridPosition }, { new: true })
    );

    const updatedFillers = await Promise.all(promises);
    res.json(updatedFillers);
  } catch (error: any) {
    res.status(400).json({ message: 'Erro ao atualizar posições', error: error.message });
  }
});

export default router;
