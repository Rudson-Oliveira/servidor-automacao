import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { webhooks_config } from '../../drizzle/schema-webhooks';
import { eq, and } from 'drizzle-orm';
import { WebhookService, WEBHOOK_EVENTS } from '../_core/webhook-service';
import crypto from 'crypto';

export const webhooksRouter = router({
  /**
   * Listar webhooks do usuário
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const webhooks = await db
      .select()
      .from(webhooks_config)
      .where(eq(webhooks_config.userId, ctx.user.id));

    // Buscar estatísticas para cada webhook
    const webhooksWithStats = await Promise.all(
      webhooks.map(async (webhook) => {
        const stats = await WebhookService.getStats(webhook.id);
        return { ...webhook, stats };
      })
    );

    return webhooksWithStats;
  }),

  /**
   * Criar novo webhook
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        url: z.string().url(),
        events: z.array(z.string()).min(1),
        secret: z.string().optional(),
        headers: z.record(z.string()).optional(),
        maxRetries: z.number().int().min(0).max(10).default(3),
        retryDelay: z.number().int().min(1000).max(60000).default(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Gerar secret se não fornecido
      const secret = input.secret || crypto.randomBytes(32).toString('hex');

      const [webhook] = await db.insert(webhooks_config).values({
        userId: ctx.user.id,
        name: input.name,
        url: input.url,
        events: input.events,
        secret,
        headers: input.headers,
        maxRetries: input.maxRetries,
        retryDelay: input.retryDelay,
        isActive: 1,
      });

      return {
        success: true,
        webhookId: webhook.insertId,
        secret, // Retornar secret apenas na criação
      };
    }),

  /**
   * Atualizar webhook
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        url: z.string().url().optional(),
        events: z.array(z.string()).min(1).optional(),
        headers: z.record(z.string()).optional(),
        maxRetries: z.number().int().min(0).max(10).optional(),
        retryDelay: z.number().int().min(1000).max(60000).optional(),
        isActive: z.number().int().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Verificar propriedade
      const [webhook] = await db
        .select()
        .from(webhooks_config)
        .where(
          and(
            eq(webhooks_config.id, input.id),
            eq(webhooks_config.userId, ctx.user.id)
          )
        );

      if (!webhook) {
        throw new Error('Webhook not found or access denied');
      }

      const { id, ...updateData } = input;

      await db
        .update(webhooks_config)
        .set(updateData)
        .where(eq(webhooks_config.id, input.id));

      return { success: true };
    }),

  /**
   * Deletar webhook
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Verificar propriedade
      const [webhook] = await db
        .select()
        .from(webhooks_config)
        .where(
          and(
            eq(webhooks_config.id, input.id),
            eq(webhooks_config.userId, ctx.user.id)
          )
        );

      if (!webhook) {
        throw new Error('Webhook not found or access denied');
      }

      await db
        .delete(webhooks_config)
        .where(eq(webhooks_config.id, input.id));

      return { success: true };
    }),

  /**
   * Testar webhook (envia evento de teste)
   */
  test: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Verificar propriedade
      const [webhook] = await db
        .select()
        .from(webhooks_config)
        .where(
          and(
            eq(webhooks_config.id, input.id),
            eq(webhooks_config.userId, ctx.user.id)
          )
        );

      if (!webhook) {
        throw new Error('Webhook not found or access denied');
      }

      // Enviar evento de teste
      await WebhookService.trigger(ctx.user.id, 'test_event', {
        message: 'This is a test webhook',
        webhookId: webhook.id,
        webhookName: webhook.name,
        timestamp: new Date().toISOString(),
      });

      return { success: true, message: 'Test webhook sent' };
    }),

  /**
   * Obter logs de um webhook
   */
  getLogs: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      // Verificar propriedade
      const [webhook] = await db
        .select()
        .from(webhooks_config)
        .where(
          and(
            eq(webhooks_config.id, input.id),
            eq(webhooks_config.userId, ctx.user.id)
          )
        );

      if (!webhook) {
        throw new Error('Webhook not found or access denied');
      }

      return WebhookService.getLogs(input.id, input.limit);
    }),

  /**
   * Obter estatísticas de um webhook
   */
  getStats: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return { total: 0, success: 0, failed: 0, successRate: 0, avgDuration: 0 };
      }

      // Verificar propriedade
      const [webhook] = await db
        .select()
        .from(webhooks_config)
        .where(
          and(
            eq(webhooks_config.id, input.id),
            eq(webhooks_config.userId, ctx.user.id)
          )
        );

      if (!webhook) {
        throw new Error('Webhook not found or access denied');
      }

      return WebhookService.getStats(input.id);
    }),

  /**
   * Listar eventos disponíveis
   */
  listEvents: protectedProcedure.query(() => {
    return Object.entries(WEBHOOK_EVENTS).map(([key, value]) => ({
      key,
      value,
      description: getEventDescription(value),
    }));
  }),
});

function getEventDescription(event: string): string {
  const descriptions: Record<string, string> = {
    command_executed: 'Disparado quando um comando é executado com sucesso',
    command_failed: 'Disparado quando um comando falha',
    agent_offline: 'Disparado quando um agente fica offline',
    agent_online: 'Disparado quando um agente fica online',
    screenshot_captured: 'Disparado quando um screenshot é capturado',
    security_alert: 'Disparado quando há um alerta de segurança',
    workflow_completed: 'Disparado quando um workflow é concluído',
    workflow_failed: 'Disparado quando um workflow falha',
  };

  return descriptions[event] || 'Evento customizado';
}
