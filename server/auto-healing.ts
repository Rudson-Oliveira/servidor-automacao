/**
 * Sistema de Auto-Healing
 * Detecta e corrige erros automaticamente
 * 
 * @author Manus AI Team
 * @audit Sistema crítico para prevenir downtime
 */

import { performHealthCheck, HealthStatus } from './health-monitor';

export interface HealingAction {
  type: 'restart_service' | 'clear_cache' | 'reconnect_db' | 'fallback_mode';
  reason: string;
  timestamp: number;
  success: boolean;
}

const healingHistory: HealingAction[] = [];

/**
 * Limpa cache e libera memória
 */
function clearCache(): boolean {
  try {
    if (global.gc) {
      global.gc();
      console.log('[AutoHealing] Garbage collection triggered');
    }
    return true;
  } catch (error) {
    console.error('[AutoHealing] Failed to clear cache:', error);
    return false;
  }
}

/**
 * Tenta reconectar ao banco de dados
 */
async function reconnectDatabase(): Promise<boolean> {
  try {
    const { getDb } = await import('./db');
    const db = await getDb();
    
    if (db) {
      await db.execute('SELECT 1');
      console.log('[AutoHealing] Database reconnected successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[AutoHealing] Database reconnection failed:', error);
    return false;
  }
}

/**
 * Ativa modo fallback (funcionalidade reduzida mas estável)
 */
function activateFallbackMode(): boolean {
  try {
    // Define flag global para modo fallback
    (global as any).FALLBACK_MODE = true;
    
    console.warn('[AutoHealing] Fallback mode activated - running with reduced functionality');
    return true;
  } catch (error) {
    console.error('[AutoHealing] Failed to activate fallback mode:', error);
    return false;
  }
}

/**
 * Executa ação de healing baseada no problema
 */
async function executeHealing(health: HealthStatus): Promise<HealingAction[]> {
  const actions: HealingAction[] = [];
  
  // Problema de memória
  if (!health.checks.memory) {
    const success = clearCache();
    actions.push({
      type: 'clear_cache',
      reason: 'High memory usage detected',
      timestamp: Date.now(),
      success
    });
  }
  
  // Problema de banco de dados
  if (!health.checks.database) {
    const success = await reconnectDatabase();
    actions.push({
      type: 'reconnect_db',
      reason: 'Database connection lost',
      timestamp: Date.now(),
      success
    });
    
    // Se falhar, ativa fallback
    if (!success) {
      const fallbackSuccess = activateFallbackMode();
      actions.push({
        type: 'fallback_mode',
        reason: 'Database reconnection failed',
        timestamp: Date.now(),
        success: fallbackSuccess
      });
    }
  }
  
  // Problema de dependências
  if (!health.checks.dependencies) {
    const success = activateFallbackMode();
    actions.push({
      type: 'fallback_mode',
      reason: 'Missing critical dependencies',
      timestamp: Date.now(),
      success
    });
  }
  
  return actions;
}

/**
 * Inicia sistema de auto-healing
 */
export async function startAutoHealing() {
  console.log('[AutoHealing] Auto-healing system initialized');
  
  // Verifica saúde a cada 1 minuto
  setInterval(async () => {
    const health = await performHealthCheck();
    
    if (health.status !== 'healthy') {
      console.warn('[AutoHealing] Unhealthy state detected, attempting healing...');
      
      const actions = await executeHealing(health);
      healingHistory.push(...actions);
      
      // Mantém apenas últimas 100 ações
      if (healingHistory.length > 100) {
        healingHistory.splice(0, healingHistory.length - 100);
      }
      
      // Log de sucesso/falha
      const successCount = actions.filter(a => a.success).length;
      console.log(`[AutoHealing] Executed ${actions.length} healing actions, ${successCount} successful`);
    }
  }, 60000); // 1 minuto
}

/**
 * Retorna histórico de healing
 */
export function getHealingHistory(): HealingAction[] {
  return [...healingHistory];
}

/**
 * Verifica se está em modo fallback
 */
export function isInFallbackMode(): boolean {
  return !!(global as any).FALLBACK_MODE;
}
