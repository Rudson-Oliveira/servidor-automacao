/**
 * Router tRPC para Webhooks de Governança de IAs
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { webhookService } from '../_core/ai-governance-webhooks';

export const aiGovernanceWebhooksRouter = router({
  /**
   * Registrar webhook
   */
  subscribe: protectedProcedure
    .input(
      z.object({
        aiId: z.string(),
        url: z.string().url(),
        events: z.array(
          z.enum([
            'policy_updated',
            'violation_detected',
            'session_suspended',
            'session_approved',
            'session_expired',
            'trust_score_changed',
          ])
        ),
        secret: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const webhookId = webhookService.subscribe({
        aiId: input.aiId,
        url: input.url,
        events: input.events,
        secret: input.secret,
        active: true,
      });

      return {
        success: true,
        webhookId,
      };
    }),

  /**
   * Remover webhook
   */
  unsubscribe: protectedProcedure
    .input(
      z.object({
        webhookId: z.string(),
      })
    )
    .mutation(({ input }) => {
      const success = webhookService.unsubscribe(input.webhookId);

      return {
        success,
      };
    }),

  /**
   * Atualizar webhook
   */
  update: protectedProcedure
    .input(
      z.object({
        webhookId: z.string(),
        url: z.string().url().optional(),
        events: z
          .array(
            z.enum([
              'policy_updated',
              'violation_detected',
              'session_suspended',
              'session_approved',
              'session_expired',
              'trust_score_changed',
            ])
          )
          .optional(),
        active: z.boolean().optional(),
        secret: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const { webhookId, ...updates } = input;
      const success = webhookService.updateSubscription(webhookId, updates);

      return {
        success,
      };
    }),

  /**
   * Listar webhooks de uma IA
   */
  list: protectedProcedure
    .input(
      z.object({
        aiId: z.string(),
      })
    )
    .query(({ input }) => {
      const subscriptions = webhookService.getSubscriptionsByAI(input.aiId);

      return {
        subscriptions,
      };
    }),

  /**
   * Estatísticas de webhooks
   */
  stats: protectedProcedure.query(() => {
    const stats = webhookService.getStats();

    return stats;
  }),

  /**
   * Limpar webhooks inativos
   */
  cleanup: protectedProcedure.mutation(() => {
    const removed = webhookService.cleanupInactive();

    return {
      removed,
    };
  }),
});
