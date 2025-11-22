import { Router } from 'express';
import { getDb } from '../db';
import { cometVisionAnalyses, cometVisionValidations, cometVisionScreenshots } from '../../drizzle/schema';
import { desc, eq, count, sql } from 'drizzle-orm';

const router = Router();

/**
 * GET /api/dashboard/analyses
 * Listar todas as análises
 */
router.get('/analyses', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ sucesso: false, erro: 'Banco de dados indisponível' });
    }

    const analyses = await db
      .select()
      .from(cometVisionAnalyses)
      .orderBy(desc(cometVisionAnalyses.createdAt))
      .limit(50);

    res.json({
      sucesso: true,
      dados: analyses,
      total: analyses.length
    });
  } catch (error) {
    console.error('[Dashboard] Erro ao listar análises:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro ao listar análises' });
  }
});

/**
 * GET /api/dashboard/analyses/:id
 * Detalhes de uma análise específica
 */
router.get('/analyses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ sucesso: false, erro: 'Banco de dados indisponível' });
    }

    const analysis = await db
      .select()
      .from(cometVisionAnalyses)
      .where(eq(cometVisionAnalyses.id, parseInt(id)))
      .limit(1);

    if (analysis.length === 0) {
      return res.status(404).json({ sucesso: false, erro: 'Análise não encontrada' });
    }

    // Buscar screenshots relacionados
    const screenshots = await db
      .select()
      .from(cometVisionScreenshots)
      .where(eq(cometVisionScreenshots.analysisId, parseInt(id)));

    // Buscar validações relacionadas
    const validations = await db
      .select()
      .from(cometVisionValidations)
      .where(eq(cometVisionValidations.analysisId, parseInt(id)));

    res.json({
      sucesso: true,
      dados: {
        ...analysis[0],
        screenshots,
        validations
      }
    });
  } catch (error) {
    console.error('[Dashboard] Erro ao buscar análise:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro ao buscar análise' });
  }
});

/**
 * GET /api/dashboard/validations
 * Listar todas as validações
 */
router.get('/validations', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ sucesso: false, erro: 'Banco de dados indisponível' });
    }

    const validations = await db
      .select()
      .from(cometVisionValidations)
      .orderBy(desc(cometVisionValidations.createdAt))
      .limit(50);

    res.json({
      sucesso: true,
      dados: validations,
      total: validations.length
    });
  } catch (error) {
    console.error('[Dashboard] Erro ao listar validações:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro ao listar validações' });
  }
});

/**
 * GET /api/dashboard/metrics
 * Métricas agregadas
 */
router.get('/metrics', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ sucesso: false, erro: 'Banco de dados indisponível' });
    }

    // Total de análises
    const totalAnalyses = await db
      .select({ count: count() })
      .from(cometVisionAnalyses);

    // Total de validações
    const totalValidations = await db
      .select({ count: count() })
      .from(cometVisionValidations);

    // Validações aprovadas
    const approvedValidations = await db
      .select({ count: count() })
      .from(cometVisionValidations)
      .where(eq(cometVisionValidations.aprovado, 1));

    // Média de similaridade
    const avgSimilarity = await db
      .select({
        avg: sql<number>`AVG(${cometVisionValidations.similaridadeGeral})`
      })
      .from(cometVisionValidations);

    res.json({
      sucesso: true,
      dados: {
        totalAnalyses: totalAnalyses[0]?.count || 0,
        totalValidations: totalValidations[0]?.count || 0,
        approvedValidations: approvedValidations[0]?.count || 0,
        avgSimilarity: Math.round(avgSimilarity[0]?.avg || 0),
        approvalRate: totalValidations[0]?.count > 0
          ? Math.round(((approvedValidations[0]?.count || 0) / totalValidations[0].count) * 100)
          : 0
      }
    });
  } catch (error) {
    console.error('[Dashboard] Erro ao calcular métricas:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro ao calcular métricas' });
  }
});

/**
 * DELETE /api/dashboard/analyses/:id
 * Deletar uma análise
 */
router.delete('/analyses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ sucesso: false, erro: 'Banco de dados indisponível' });
    }

    // Deletar screenshots relacionados
    await db
      .delete(cometVisionScreenshots)
      .where(eq(cometVisionScreenshots.analysisId, parseInt(id)));

    // Deletar validações relacionadas
    await db
      .delete(cometVisionValidations)
      .where(eq(cometVisionValidations.analysisId, parseInt(id)));

    // Deletar análise
    await db
      .delete(cometVisionAnalyses)
      .where(eq(cometVisionAnalyses.id, parseInt(id)));

    res.json({
      sucesso: true,
      mensagem: 'Análise deletada com sucesso'
    });
  } catch (error) {
    console.error('[Dashboard] Erro ao deletar análise:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro ao deletar análise' });
  }
});

export default router;
