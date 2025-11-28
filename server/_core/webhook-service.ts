import crypto from 'crypto';
import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../db';
import { webhooks_config, webhooks_logs, type WebhookConfig, type InsertWebhookLog } from '../../drizzle/schema-webhooks';

/**
 * Serviço de Webhooks para Integração Externa
 * 
 * Proporciona saída alternativa quando há restrições no sistema,
 * permitindo processar dados externamente via HTTP POST.
 */

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

export class WebhookService {
  /**
   * Dispara webhooks para um evento específico
   */
  static async trigger(userId: number, event: string, data: Record<string, any>): Promise<void> {
    const db = await getDb();
    if (!db) {
      console.error('[Webhook] Database not available');
      return;
    }

    try {
      // Buscar webhooks ativos que escutam este evento
      const webhooks = await db
        .select()
        .from(webhooks_config)
        .where(
          and(
            eq(webhooks_config.userId, userId),
            eq(webhooks_config.isActive, 1)
          )
        );

      const relevantWebhooks = webhooks.filter(webhook => {
        const events = webhook.events as string[];
        return events.includes(event);
      });

      if (relevantWebhooks.length === 0) {
        console.log(`[Webhook] No active webhooks for event: ${event}`);
        return;
      }

      // Disparar cada webhook em paralelo
      const promises = relevantWebhooks.map(webhook =>
        this.sendWebhook(webhook, event, data)
      );

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('[Webhook] Error triggering webhooks:', error);
    }
  }

  /**
   * Envia webhook individual com retry automático
   */
  private static async sendWebhook(
    webhook: WebhookConfig,
    event: string,
    data: Record<string, any>,
    attempt: number = 1
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const logEntry: InsertWebhookLog = {
      webhookId: webhook.id,
      userId: webhook.userId,
      event,
      payload,
      status: 'pending',
      attempt,
      sentAt: new Date(),
    };

    try {
      const startTime = Date.now();

      // Preparar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Manus-Webhook/1.0',
        ...(webhook.headers as Record<string, string> || {}),
      };

      // Adicionar assinatura HMAC se secret configurado
      if (webhook.secret) {
        const signature = this.generateSignature(payload, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      // Enviar requisição
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      const durationMs = Date.now() - startTime;
      const responseBody = await response.text();

      // Atualizar log
      logEntry.statusCode = response.status;
      logEntry.responseBody = responseBody.substring(0, 1000); // Limitar tamanho
      logEntry.status = response.ok ? 'success' : 'failed';
      logEntry.completedAt = new Date();
      logEntry.durationMs = durationMs;

      if (!response.ok) {
        logEntry.errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Retry se não atingiu o máximo
        if (attempt < webhook.maxRetries) {
          logEntry.status = 'retrying';
          await db.insert(webhooks_logs).values(logEntry);
          
          // Aguardar com backoff exponencial
          const delay = webhook.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Tentar novamente
          return this.sendWebhook(webhook, event, data, attempt + 1);
        }
      }

      // Salvar log
      await db.insert(webhooks_logs).values(logEntry);

      // Atualizar lastTriggeredAt
      await db
        .update(webhooks_config)
        .set({ lastTriggeredAt: new Date() })
        .where(eq(webhooks_config.id, webhook.id));

      console.log(`[Webhook] ${webhook.name} - ${event} - ${logEntry.status} (${durationMs}ms)`);
    } catch (error: any) {
      logEntry.status = 'failed';
      logEntry.errorMessage = error.message;
      logEntry.completedAt = new Date();
      logEntry.durationMs = logEntry.sentAt ? Date.now() - logEntry.sentAt.getTime() : 0;

      await db.insert(webhooks_logs).values(logEntry);

      // Retry se não atingiu o máximo
      if (attempt < webhook.maxRetries) {
        const delay = webhook.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWebhook(webhook, event, data, attempt + 1);
      }

      console.error(`[Webhook] ${webhook.name} failed after ${attempt} attempts:`, error.message);
    }
  }

  /**
   * Gera assinatura HMAC SHA-256 do payload
   */
  private static generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Verifica assinatura HMAC de um webhook recebido
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const receivedSignature = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    );
  }

  /**
   * Lista logs de um webhook específico
   */
  static async getLogs(webhookId: number, limit: number = 50): Promise<typeof webhooks_logs.$inferSelect[]> {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(webhooks_logs)
      .where(eq(webhooks_logs.webhookId, webhookId))
      .orderBy(desc(webhooks_logs.sentAt))
      .limit(limit);
  }

  /**
   * Obtém estatísticas de um webhook
   */
  static async getStats(webhookId: number): Promise<{
    total: number;
    success: number;
    failed: number;
    successRate: number;
    avgDuration: number;
  }> {
    const db = await getDb();
    if (!db) {
      return { total: 0, success: 0, failed: 0, successRate: 0, avgDuration: 0 };
    }

    const logs = await db
      .select()
      .from(webhooks_logs)
      .where(eq(webhooks_logs.webhookId, webhookId));

    const total = logs.length;
    const success = logs.filter(log => log.status === 'success').length;
    const failed = logs.filter(log => log.status === 'failed').length;
    const successRate = total > 0 ? (success / total) * 100 : 0;
    
    const durations = logs
      .filter(log => log.durationMs !== null)
      .map(log => log.durationMs!);
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return { total, success, failed, successRate, avgDuration };
  }
}

// Eventos disponíveis para webhooks
export const WEBHOOK_EVENTS = {
  COMMAND_EXECUTED: 'command_executed',
  COMMAND_FAILED: 'command_failed',
  AGENT_OFFLINE: 'agent_offline',
  AGENT_ONLINE: 'agent_online',
  SCREENSHOT_CAPTURED: 'screenshot_captured',
  SECURITY_ALERT: 'security_alert',
  WORKFLOW_COMPLETED: 'workflow_completed',
  WORKFLOW_FAILED: 'workflow_failed',
} as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];
