/**
 * Health Check Endpoint
 * Expõe métricas de saúde do sistema
 * 
 * @author Manus AI Team
 * @audit Endpoint público para monitoramento
 */

import { Router } from 'express';
import { performHealthCheck } from '../health-monitor';
import { getHealingHistory, isInFallbackMode } from '../auto-healing';
import { getLearningStats } from '../llm-learning';

const router = Router();

/**
 * GET /api/health
 * Retorna status de saúde completo do sistema
 */
router.get('/', async (req, res) => {
  try {
    const health = await performHealthCheck();
    const healingHistory = getHealingHistory();
    const learningStats = await getLearningStats();
    const fallbackMode = isInFallbackMode();
    
    res.json({
      ...health,
      fallbackMode,
      healing: {
        recentActions: healingHistory.slice(-10), // Últimas 10 ações
        totalActions: healingHistory.length
      },
      learning: learningStats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/health/simple
 * Retorna apenas status simples (para health checks do Render)
 */
router.get('/simple', async (req, res) => {
  try {
    const health = await performHealthCheck();
    
    if (health.status === 'healthy' || health.status === 'degraded') {
      res.status(200).json({ status: 'ok' });
    } else {
      res.status(503).json({ status: 'unhealthy' });
    }
  } catch (error) {
    res.status(503).json({ status: 'error' });
  }
});

export default router;
