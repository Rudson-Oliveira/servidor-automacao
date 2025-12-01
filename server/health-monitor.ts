/**
 * Sistema de Health Check Inteligente
 * Monitora saúde do sistema e detecta problemas antes de falhar
 * 
 * @author Manus AI Team
 * @audit Implementado para prevenir erros 502 em produção
 */

import { getDb } from './db';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  checks: {
    database: boolean;
    memory: boolean;
    disk: boolean;
    dependencies: boolean;
  };
  metrics: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  errors: string[];
}

/**
 * Verifica saúde do banco de dados
 */
async function checkDatabase(): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    
    // Tenta fazer uma query simples
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('[HealthCheck] Database check failed:', error);
    return false;
  }
}

/**
 * Verifica uso de memória
 */
function checkMemory(): boolean {
  const usage = process.memoryUsage();
  const heapUsedMB = usage.heapUsed / 1024 / 1024;
  const heapTotalMB = usage.heapTotal / 1024 / 1024;
  
  // Alerta se usar mais de 80% da heap
  const usagePercent = (heapUsedMB / heapTotalMB) * 100;
  
  if (usagePercent > 80) {
    console.warn(`[HealthCheck] High memory usage: ${usagePercent.toFixed(2)}%`);
    return false;
  }
  
  return true;
}

/**
 * Verifica dependências críticas
 */
function checkDependencies(): boolean {
  const critical = [
    'express',
    'drizzle-orm',
    'trpc/server'
  ];
  
  try {
    for (const dep of critical) {
      require.resolve(dep);
    }
    return true;
  } catch (error) {
    console.error('[HealthCheck] Missing critical dependency:', error);
    return false;
  }
}

/**
 * Executa health check completo
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const errors: string[] = [];
  
  // Verificações
  const dbCheck = await checkDatabase();
  const memCheck = checkMemory();
  const depCheck = checkDependencies();
  
  if (!dbCheck) errors.push('Database connection failed');
  if (!memCheck) errors.push('High memory usage detected');
  if (!depCheck) errors.push('Missing critical dependencies');
  
  // Métricas
  const usage = process.memoryUsage();
  const uptime = process.uptime();
  
  // Determinar status geral
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (errors.length > 0) {
    status = errors.length >= 2 ? 'unhealthy' : 'degraded';
  }
  
  return {
    status,
    timestamp: Date.now(),
    checks: {
      database: dbCheck,
      memory: memCheck,
      disk: true, // TODO: Implementar check de disco
      dependencies: depCheck
    },
    metrics: {
      uptime,
      memoryUsage: usage.heapUsed / 1024 / 1024,
      cpuUsage: process.cpuUsage().user / 1000000 // Convert to seconds
    },
    errors
  };
}

/**
 * Inicia monitoramento contínuo
 */
export function startHealthMonitoring(intervalMs: number = 30000) {
  console.log('[HealthMonitor] Starting continuous health monitoring...');
  
  setInterval(async () => {
    const health = await performHealthCheck();
    
    if (health.status !== 'healthy') {
      console.warn('[HealthMonitor] System health degraded:', health);
      
      // TODO: Enviar alerta para owner
      // TODO: Tentar auto-healing
    }
  }, intervalMs);
}
