/**
 * Sistema de Webhooks para Governança de IAs
 * Notifica IAs externas sobre eventos importantes
 */

export interface WebhookEvent {
  type: 'policy_updated' | 'violation_detected' | 'session_suspended' | 'session_approved' | 'session_expired' | 'trust_score_changed';
  timestamp: Date;
  aiId: string;
  data: Record<string, unknown>;
}

export interface WebhookSubscription {
  id: string;
  aiId: string;
  url: string;
  events: WebhookEvent['type'][];
  secret?: string; // Para validação HMAC
  active: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  failureCount: number;
}

export class AIGovernanceWebhookService {
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private processing: boolean = false;

  /**
   * Registra webhook para uma IA
   */
  subscribe(subscription: Omit<WebhookSubscription, 'id' | 'createdAt' | 'failureCount'>): string {
    const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullSubscription: WebhookSubscription = {
      ...subscription,
      id,
      createdAt: new Date(),
      failureCount: 0,
    };

    this.subscriptions.set(id, fullSubscription);
    return id;
  }

  /**
   * Remove webhook
   */
  unsubscribe(webhookId: string): boolean {
    return this.subscriptions.delete(webhookId);
  }

  /**
   * Atualiza webhook
   */
  updateSubscription(webhookId: string, updates: Partial<WebhookSubscription>): boolean {
    const subscription = this.subscriptions.get(webhookId);
    if (!subscription) {
      return false;
    }

    Object.assign(subscription, updates);
    this.subscriptions.set(webhookId, subscription);
    return true;
  }

  /**
   * Lista webhooks de uma IA
   */
  getSubscriptionsByAI(aiId: string): WebhookSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.aiId === aiId);
  }

  /**
   * Emite evento para webhooks relevantes
   */
  async emitEvent(event: WebhookEvent): Promise<void> {
    this.eventQueue.push(event);
    
    if (!this.processing) {
      await this.processQueue();
    }
  }

  /**
   * Processa fila de eventos
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.eventQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (!event) continue;

      await this.deliverEvent(event);
    }

    this.processing = false;
  }

  /**
   * Entrega evento para webhooks inscritos
   */
  private async deliverEvent(event: WebhookEvent): Promise<void> {
    const relevantSubscriptions = Array.from(this.subscriptions.values()).filter(
      sub => sub.active && sub.aiId === event.aiId && sub.events.includes(event.type)
    );

    const deliveryPromises = relevantSubscriptions.map(sub => this.sendWebhook(sub, event));
    await Promise.allSettled(deliveryPromises);
  }

  /**
   * Envia webhook para URL
   */
  private async sendWebhook(subscription: WebhookSubscription, event: WebhookEvent): Promise<void> {
    try {
      const payload = {
        event: event.type,
        timestamp: event.timestamp.toISOString(),
        aiId: event.aiId,
        data: event.data,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Governance-Webhook/1.0',
      };

      // Adicionar assinatura HMAC se secret estiver configurado
      if (subscription.secret) {
        const signature = await this.generateSignature(JSON.stringify(payload), subscription.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await fetch(subscription.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Sucesso - resetar contador de falhas
      subscription.failureCount = 0;
      subscription.lastTriggered = new Date();
      this.subscriptions.set(subscription.id, subscription);

    } catch (error) {
      subscription.failureCount++;
      
      // Desativar webhook após 5 falhas consecutivas
      if (subscription.failureCount >= 5) {
        subscription.active = false;
        console.error(`[Webhook] Desativado após 5 falhas: ${subscription.id}`, error);
      }

      this.subscriptions.set(subscription.id, subscription);
      console.error(`[Webhook] Falha ao enviar para ${subscription.url}:`, error);
    }
  }

  /**
   * Gera assinatura HMAC SHA-256
   */
  private async generateSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Estatísticas de webhooks
   */
  getStats(): {
    total: number;
    active: number;
    inactive: number;
    byAI: Record<string, number>;
    queueSize: number;
  } {
    const subscriptions = Array.from(this.subscriptions.values());
    
    const byAI: Record<string, number> = {};
    subscriptions.forEach(sub => {
      byAI[sub.aiId] = (byAI[sub.aiId] || 0) + 1;
    });

    return {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.active).length,
      inactive: subscriptions.filter(s => !s.active).length,
      byAI,
      queueSize: this.eventQueue.length,
    };
  }

  /**
   * Limpa webhooks inativos antigos (>30 dias)
   */
  cleanupInactive(): number {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let removed = 0;

    for (const [id, sub] of Array.from(this.subscriptions.entries())) {
      if (!sub.active && sub.createdAt.getTime() < thirtyDaysAgo) {
        this.subscriptions.delete(id);
        removed++;
      }
    }

    return removed;
  }
}

// Instância singleton
export const webhookService = new AIGovernanceWebhookService();
