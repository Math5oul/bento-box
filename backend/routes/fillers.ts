import { Router, Request, Response } from 'express';
import Filler from '../models/Filler';

const router = Router();

/**
 * Converte formato (ex: "2x1") para rowSpan/colSpan
 */
function getSpansFromFormat(format: string): { rowSpan: number; colSpan: number } {
  const match = format.match(/^(\d+)x(\d+)$/);
  if (match) {
    const colSpan = parseInt(match[1]);
    const rowSpan = parseInt(match[2]);
    return { rowSpan, colSpan };
  }
  return { rowSpan: 1, colSpan: 1 };
}

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
    const fillerData = { ...req.body };

    // Se o filler tem formatos, usar o primeiro para calcular gridPosition
    if (fillerData.formats && fillerData.formats.length > 0) {
      const primaryFormat = fillerData.formats[0];
      const spans = getSpansFromFormat(primaryFormat);

      if (!fillerData.gridPosition) {
        fillerData.gridPosition = {};
      }
      fillerData.gridPosition.rowSpan = spans.rowSpan;
      fillerData.gridPosition.colSpan = spans.colSpan;

      console.log(
        `📐 Filler formato primário '${primaryFormat}' convertido para rowSpan: ${spans.rowSpan}, colSpan: ${spans.colSpan}`
      );
    }

    const filler = new Filler(fillerData);
    const savedFiller = await filler.save();

    console.log('✅ Filler salvo:', JSON.stringify(savedFiller.toObject(), null, 2));

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
    const updateData = { ...req.body };

    // Se os formatos forem alterados, atualizar gridPosition baseado no primeiro formato
    if (updateData.formats && updateData.formats.length > 0) {
      const primaryFormat = updateData.formats[0];
      const spans = getSpansFromFormat(primaryFormat);

      if (!updateData.gridPosition) {
        updateData.gridPosition = {};
      }
      updateData.gridPosition.rowSpan = spans.rowSpan;
      updateData.gridPosition.colSpan = spans.colSpan;

      console.log(
        `🔧 Filler atualizado - formato primário '${primaryFormat}' convertido para rowSpan: ${spans.rowSpan}, colSpan: ${spans.colSpan}`
      );
    }

    const filler = await Filler.findByIdAndUpdate(req.params['id'], updateData, {
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
