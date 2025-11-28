/**
 * Sistema de Health Checks
 * Verifica saúde de componentes críticos do sistema
 */

import { getDb } from '../db';

export interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  message: string;
  timestamp: Date;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheckResult[];
  uptime: number;
  timestamp: Date;
}

export class HealthChecker {
  private lastCheck: SystemHealth | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Inicia verificações periódicas de saúde
   */
  startPeriodicChecks(intervalMs: number = 30000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    console.log(`[Health Checks] Iniciando verificações periódicas (intervalo: ${intervalMs}ms)`);
    
    // Primeira verificação imediata
    this.performHealthCheck().catch(err => {
      console.error('[Health Checks] Erro na verificação inicial:', err);
    });

    // Verificações periódicas
    this.checkInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (err) {
        console.error('[Health Checks] Erro na verificação periódica:', err);
      }
    }, intervalMs);
  }

  /**
   * Para verificações periódicas
   */
  stopPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[Health Checks] Verificações periódicas paradas');
    }
  }

  /**
   * Executa verificação completa de saúde
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const checks: HealthCheckResult[] = [];

    // Check 1: Banco de Dados
    checks.push(await this.checkDatabase());

    // Check 2: Memória
    checks.push(await this.checkMemory());

    // Check 3: CPU
    checks.push(await this.checkCPU());

    // Check 4: Disco
    checks.push(await this.checkDisk());

    // Determinar saúde geral
    const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
    const hasDegraded = checks.some(c => c.status === 'degraded');
    
    const overall: 'healthy' | 'degraded' | 'unhealthy' = 
      hasUnhealthy ? 'unhealthy' : 
      hasDegraded ? 'degraded' : 
      'healthy';

    const health: SystemHealth = {
      overall,
      checks,
      uptime: process.uptime(),
      timestamp: new Date(),
    };

    this.lastCheck = health;

    // Log se houver problemas
    if (overall !== 'healthy') {
      console.warn(`[Health Checks] Sistema ${overall}:`, 
        checks.filter(c => c.status !== 'healthy').map(c => c.component).join(', ')
      );
    }

    return health;
  }

  /**
   * Retorna último resultado de health check
   */
  getLastCheck(): SystemHealth | null {
    return this.lastCheck;
  }

  /**
   * Verifica saúde do banco de dados
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const db = await getDb();
      
      if (!db) {
        return {
          component: 'database',
          status: 'unhealthy',
          responseTime: Date.now() - start,
          message: 'Banco de dados não disponível',
          timestamp: new Date(),
        };
      }

      // Tentar query simples
      await db.execute('SELECT 1');
      
      const responseTime = Date.now() - start;
      
      return {
        component: 'database',
        status: responseTime < 100 ? 'healthy' : 'degraded',
        responseTime,
        message: responseTime < 100 ? 'Conectado' : 'Lento (>100ms)',
        timestamp: new Date(),
      };
    } catch (err) {
      return {
        component: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: err instanceof Error ? err.message : 'Erro desconhecido',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Verifica uso de memória
   */
  private async checkMemory(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const usage = process.memoryUsage();
      const heapUsedMB = usage.heapUsed / 1024 / 1024;
      const heapTotalMB = usage.heapTotal / 1024 / 1024;
      const percentUsed = (heapUsedMB / heapTotalMB) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = `${heapUsedMB.toFixed(0)}MB / ${heapTotalMB.toFixed(0)}MB (${percentUsed.toFixed(1)}%)`;

      if (percentUsed > 90) {
        status = 'unhealthy';
        message += ' - CRÍTICO';
      } else if (percentUsed > 75) {
        status = 'degraded';
        message += ' - Alto';
      }

      return {
        component: 'memory',
        status,
        responseTime: Date.now() - start,
        message,
        timestamp: new Date(),
      };
    } catch (err) {
      return {
        component: 'memory',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: err instanceof Error ? err.message : 'Erro ao verificar memória',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Verifica uso de CPU
   */
  private async checkCPU(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const usage = process.cpuUsage();
      const totalUsage = (usage.user + usage.system) / 1000000; // converter para segundos

      // Estimativa simplificada de % CPU
      const uptime = process.uptime();
      const cpuPercent = (totalUsage / uptime) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = `${cpuPercent.toFixed(1)}% uso médio`;

      if (cpuPercent > 80) {
        status = 'unhealthy';
        message += ' - CRÍTICO';
      } else if (cpuPercent > 60) {
        status = 'degraded';
        message += ' - Alto';
      }

      return {
        component: 'cpu',
        status,
        responseTime: Date.now() - start,
        message,
        timestamp: new Date(),
      };
    } catch (err) {
      return {
        component: 'cpu',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        message: err instanceof Error ? err.message : 'Erro ao verificar CPU',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Verifica espaço em disco
   */
  private async checkDisk(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    try {
      const { execSync } = require('child_process');
      
      // df -h retorna uso de disco
      const dfOutput = execSync('df -h / | tail -1', { encoding: 'utf-8' });
      const parts = dfOutput.trim().split(/\s+/);
      const percentUsed = parseInt(parts[4]); // coluna "Use%"

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = `${percentUsed}% usado`;

      if (percentUsed > 90) {
        status = 'unhealthy';
        message += ' - CRÍTICO';
      } else if (percentUsed > 80) {
        status = 'degraded';
        message += ' - Alto';
      }

      return {
        component: 'disk',
        status,
        responseTime: Date.now() - start,
        message,
        timestamp: new Date(),
      };
    } catch (err) {
      return {
        component: 'disk',
        status: 'degraded',
        responseTime: Date.now() - start,
        message: 'Não foi possível verificar disco',
        timestamp: new Date(),
      };
    }
  }
}

// Instância singleton
export const healthChecker = new HealthChecker();
