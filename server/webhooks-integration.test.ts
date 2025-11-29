import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebhookService, WEBHOOK_EVENTS } from './_core/webhook-service';
import { getDb } from './db';
import { webhooks_config, webhooks_logs } from '../drizzle/schema-webhooks';
import { eq } from 'drizzle-orm';
import http from 'http';

/**
 * Testes de Integração do Sistema de Webhooks
 */

describe('🔗 Sistema de Webhooks - Integração Completa', () => {
  let testServer: http.Server;
  let testServerPort: number;
  let receivedPayloads: any[] = [];
  let testWebhookId: number;

  beforeAll(async () => {
    // Criar servidor HTTP de teste para receber webhooks
    testServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        receivedPayloads.push({
          method: req.method,
          headers: req.headers,
          body: JSON.parse(body),
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      });
    });

    // Iniciar servidor em porta aleatória
    await new Promise<void>(resolve => {
      testServer.listen(0, () => {
        const address = testServer.address();
        if (address && typeof address !== 'string') {
          testServerPort = address.port;
        }
        resolve();
      });
    });

    // Criar webhook de teste no banco
    const db = await getDb();
    if (db) {
      const [result] = await db.insert(webhooks_config).values({
        userId: 1,
        name: 'Test Webhook',
        url: `http://localhost:${testServerPort}/webhook`,
        events: [WEBHOOK_EVENTS.WORKFLOW_COMPLETED, WEBHOOK_EVENTS.WORKFLOW_FAILED],
        secret: 'test-secret-123',
        maxRetries: 3,
        retryDelay: 1000,
        isActive: 1,
      });
      testWebhookId = result.insertId;
    }
  });

  afterAll(async () => {
    // Limpar webhook de teste
    const db = await getDb();
    if (db && testWebhookId) {
      await db.delete(webhooks_config).where(eq(webhooks_config.id, testWebhookId));
      await db.delete(webhooks_logs).where(eq(webhooks_logs.webhookId, testWebhookId));
    }

    // Fechar servidor de teste
    await new Promise<void>(resolve => {
      testServer.close(() => resolve());
    });
  });

  it('deve disparar webhook quando tarefa é concluída', async () => {
    receivedPayloads = [];

    await WebhookService.trigger(1, WEBHOOK_EVENTS.WORKFLOW_COMPLETED, {
      taskId: 'test-task-123',
      result: { success: true },
    });

    // Aguardar webhook ser processado
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(receivedPayloads.length).toBeGreaterThan(0);
    const payload = receivedPayloads[0];
    expect(payload.method).toBe('POST');
    expect(payload.body.event).toBe(WEBHOOK_EVENTS.WORKFLOW_COMPLETED);
    expect(payload.body.data.taskId).toBe('test-task-123');
  });

  it('deve incluir assinatura HMAC no header', async () => {
    receivedPayloads = [];

    await WebhookService.trigger(1, WEBHOOK_EVENTS.WORKFLOW_COMPLETED, {
      test: 'signature',
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    expect(receivedPayloads.length).toBeGreaterThan(0);
    const payload = receivedPayloads[0];
    expect(payload.headers['x-webhook-signature']).toBeDefined();
    expect(payload.headers['x-webhook-signature']).toMatch(/^sha256=/);
  });

  it('deve registrar log de webhook enviado', async () => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    await WebhookService.trigger(1, WEBHOOK_EVENTS.WORKFLOW_COMPLETED, {
      logTest: true,
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const logs = await db
      .select()
      .from(webhooks_logs)
      .where(eq(webhooks_logs.webhookId, testWebhookId))
      .limit(1);

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].status).toBe('success');
    expect(logs[0].statusCode).toBe(200);
  });

  it('deve calcular estatísticas corretamente', async () => {
    const stats = await WebhookService.getStats(testWebhookId);

    expect(stats).toBeDefined();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.success).toBeGreaterThan(0);
    expect(stats.successRate).toBeGreaterThan(0);
  });

  it('não deve disparar webhook para evento não configurado', async () => {
    receivedPayloads = [];

    await WebhookService.trigger(1, WEBHOOK_EVENTS.AGENT_OFFLINE, {
      test: 'should-not-trigger',
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Não deve ter recebido payload pois AGENT_OFFLINE não está nos events do webhook
    const relevantPayloads = receivedPayloads.filter(p => 
      p.body.data?.test === 'should-not-trigger'
    );
    expect(relevantPayloads.length).toBe(0);
  });
});

describe('🔗 Webhooks - Eventos Disponíveis', () => {
  it('deve ter todos os eventos documentados', () => {
    expect(WEBHOOK_EVENTS).toBeDefined();
    expect(WEBHOOK_EVENTS.COMMAND_EXECUTED).toBe('command_executed');
    expect(WEBHOOK_EVENTS.COMMAND_FAILED).toBe('command_failed');
    expect(WEBHOOK_EVENTS.AGENT_OFFLINE).toBe('agent_offline');
    expect(WEBHOOK_EVENTS.AGENT_ONLINE).toBe('agent_online');
    expect(WEBHOOK_EVENTS.SCREENSHOT_CAPTURED).toBe('screenshot_captured');
    expect(WEBHOOK_EVENTS.SECURITY_ALERT).toBe('security_alert');
    expect(WEBHOOK_EVENTS.WORKFLOW_COMPLETED).toBe('workflow_completed');
    expect(WEBHOOK_EVENTS.WORKFLOW_FAILED).toBe('workflow_failed');
  });
});
