/**
 * Endpoint REST simples de health check
 * Para uso por instaladores e monitoramento externo
 */

import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 * Endpoint super simples que sempre retorna 200 OK
 * Usado pelo instalador para verificar se o servidor está online
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * GET /api/ping
 * Alias ainda mais simples
 */
router.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

export default router;
