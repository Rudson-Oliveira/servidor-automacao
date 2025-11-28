import { WebhookService, WEBHOOK_EVENTS } from './webhook-service';

/**
 * Integração de Webhooks com Orchestrator
 * Dispara notificações externas quando eventos importantes ocorrem
 */

export class OrchestratorWebhooks {
  /**
   * Notifica quando uma tarefa é concluída com sucesso
   */
  static async onTaskCompleted(taskId: string, result: any, userId: number): Promise<void> {
    await WebhookService.trigger(userId, WEBHOOK_EVENTS.WORKFLOW_COMPLETED, {
      taskId,
      result,
      completedAt: new Date().toISOString(),
    });
  }

  /**
   * Notifica quando uma tarefa falha
   */
  static async onTaskFailed(taskId: string, error: string, userId: number): Promise<void> {
    await WebhookService.trigger(userId, WEBHOOK_EVENTS.WORKFLOW_FAILED, {
      taskId,
      error,
      failedAt: new Date().toISOString(),
    });
  }

  /**
   * Notifica quando um agent fica offline
   */
  static async onAgentOffline(agentId: string, userId: number): Promise<void> {
    await WebhookService.trigger(userId, WEBHOOK_EVENTS.AGENT_OFFLINE, {
      agentId,
      offlineAt: new Date().toISOString(),
    });
  }

  /**
   * Notifica quando um agent volta online
   */
  static async onAgentOnline(agentId: string, userId: number): Promise<void> {
    await WebhookService.trigger(userId, WEBHOOK_EVENTS.AGENT_ONLINE, {
      agentId,
      onlineAt: new Date().toISOString(),
    });
  }

  /**
   * Notifica quando um comando é executado
   */
  static async onCommandExecuted(commandId: number, agentId: string, result: any, userId: number): Promise<void> {
    await WebhookService.trigger(userId, WEBHOOK_EVENTS.COMMAND_EXECUTED, {
      commandId,
      agentId,
      result,
      executedAt: new Date().toISOString(),
    });
  }

  /**
   * Notifica quando um comando falha
   */
  static async onCommandFailed(commandId: number, agentId: string, error: string, userId: number): Promise<void> {
    await WebhookService.trigger(userId, WEBHOOK_EVENTS.COMMAND_FAILED, {
      commandId,
      agentId,
      error,
      failedAt: new Date().toISOString(),
    });
  }

  /**
   * Notifica quando um screenshot é capturado
   */
  static async onScreenshotCaptured(screenshotId: number, agentId: string, imageUrl: string, userId: number): Promise<void> {
    await WebhookService.trigger(userId, WEBHOOK_EVENTS.SCREENSHOT_CAPTURED, {
      screenshotId,
      agentId,
      imageUrl,
      capturedAt: new Date().toISOString(),
    });
  }

  /**
   * Notifica alerta de segurança
   */
  static async onSecurityAlert(alertType: string, details: any, userId: number): Promise<void> {
    await WebhookService.trigger(userId, WEBHOOK_EVENTS.SECURITY_ALERT, {
      alertType,
      details,
      triggeredAt: new Date().toISOString(),
    });
  }
}
