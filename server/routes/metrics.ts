/**
 * 📊 ENDPOINT DE MÉTRICAS PROMETHEUS
 * 
 * Rota: GET /api/metrics
 * Formato: OpenMetrics/Prometheus text format
 * 
 * Este endpoint expõe todas as métricas coletadas pelo sistema
 * para scraping pelo Prometheus ou visualização manual.
 * 
 * Data de implementação: 2025-12-01
 * Auditor: Manus AI
 */

import express from 'express';
import { getMetrics } from '../_core/metrics';
import { loggers } from '../_core/logger';

const router = express.Router();

/**
 * GET /api/metrics
 * Retorna métricas em formato Prometheus
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await getMetrics();
    
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
    
    loggers.metrics.debug('Metrics scraped successfully');
  } catch (error) {
    loggers.metrics.error({ err: error }, 'Failed to generate metrics');
    res.status(500).send('Error generating metrics');
  }
});

export default router;
