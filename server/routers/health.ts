/**
 * Router de Health Checks
 * Endpoints para verificar saúde do sistema
 */

import { publicProcedure, router } from '../_core/trpc';
import { healthChecker } from '../_core/health-checks';

export const healthRouter = router({
  /**
   * GET /api/trpc/health.check
   * Executa verificação de saúde completa
   */
  check: publicProcedure.query(async () => {
    const health = await healthChecker.performHealthCheck();
    return health;
  }),

  /**
   * GET /api/trpc/health.status
   * Retorna último resultado de health check (cache)
   */
  status: publicProcedure.query(() => {
    const lastCheck = healthChecker.getLastCheck();
    
    if (!lastCheck) {
      return {
        overall: 'unknown' as const,
        message: 'Nenhuma verificação realizada ainda',
        uptime: process.uptime(),
        timestamp: new Date(),
      };
    }

    return lastCheck;
  }),

  /**
   * GET /api/trpc/health.simple
   * Endpoint simples de health check (para load balancers)
   */
  simple: publicProcedure.query(() => {
    const lastCheck = healthChecker.getLastCheck();
    const isHealthy = !lastCheck || lastCheck.overall === 'healthy';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date(),
    };
  }),
});
