/**
 * Router de Proteção Contra Bloqueios WhatsApp
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { blockProtection } from '../_core/whatsapp-block-protection';
import { getDb } from '../db';
import { whatsappBlacklist, whatsappBlockAlerts, whatsappSendHistory } from '../../drizzle/schema';
import { eq, desc, gte, and } from 'drizzle-orm';

export const whatsappProtectionRouter = router({
  /**
   * Verificar se número está na blacklist
   */
  isBlacklisted: protectedProcedure
    .input(z.object({
      phone: z.string(),
    }))
    .query(async ({ input }) => {
      const isBlacklisted = await blockProtection.isBlacklisted(input.phone);

      return {
        isBlacklisted,
        phone: input.phone,
      };
    }),

  /**
   * Adicionar número à blacklist
   */
  addToBlacklist: protectedProcedure
    .input(z.object({
      phone: z.string(),
      reason: z.enum(['blocked', 'reported', 'invalid', 'opt_out', 'manual']),
      details: z.string().optional(),
      blockedNumber: z.string().optional(),
      contactName: z.string().optional(),
      lastCampaign: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await blockProtection.addToBlacklist(
        input.phone,
        input.reason,
        input.details,
        input.blockedNumber,
        input.contactName,
        input.lastCampaign
      );

      return {
        success: true,
        phone: input.phone,
        reason: input.reason,
      };
    }),

  /**
   * Remover número da blacklist
   */
  removeFromBlacklist: protectedProcedure
    .input(z.object({
      phone: z.string(),
    }))
    .mutation(async ({ input }) => {
      const success = await blockProtection.removeFromBlacklist(input.phone);

      return {
        success,
        phone: input.phone,
      };
    }),

  /**
   * Calcular score de risco de um contato
   */
  calculateRiskScore: protectedProcedure
    .input(z.object({
      phone: z.string(),
    }))
    .query(async ({ input }) => {
      const riskScore = await blockProtection.calculateRiskScore(input.phone);

      return riskScore;
    }),

  /**
   * Obter estatísticas de bloqueios
   */
  getBlockStats: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).optional(),
    }))
    .query(async ({ input }) => {
      const stats = await blockProtection.getBlockStats(input.days || 7);

      return stats;
    }),

  /**
   * Listar blacklist
   */
  listBlacklist: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
      reason: z.enum(['blocked', 'reported', 'invalid', 'opt_out', 'manual']).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return {
          items: [],
          total: 0,
        };
      }

      let query = db
        .select()
        .from(whatsappBlacklist)
        .orderBy(desc(whatsappBlacklist.blockedAt));

      if (input.reason) {
        query = query.where(eq(whatsappBlacklist.reason, input.reason)) as any;
      }

      const items = await query.limit(input.limit || 50).offset(input.offset || 0);

      // Contar total
      const totalResult = await db.select().from(whatsappBlacklist);

      return {
        items,
        total: totalResult.length,
        limit: input.limit || 50,
        offset: input.offset || 0,
      };
    }),

  /**
   * Listar alertas ativos
   */
  listActiveAlerts: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        alerts: [],
        count: 0,
      };
    }

    const alerts = await db
      .select()
      .from(whatsappBlockAlerts)
      .where(eq(whatsappBlockAlerts.status, 'active'))
      .orderBy(desc(whatsappBlockAlerts.createdAt));

    return {
      alerts,
      count: alerts.length,
    };
  }),

  /**
   * Resolver alerta
   */
  resolveAlert: protectedProcedure
    .input(z.object({
      alertId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return { success: false };
      }

      await db
        .update(whatsappBlockAlerts)
        .set({
          status: 'resolved',
          resolvedAt: new Date(),
        })
        .where(eq(whatsappBlockAlerts.id, input.alertId));

      return {
        success: true,
        alertId: input.alertId,
      };
    }),

  /**
   * Obter histórico de envios de um contato
   */
  getContactHistory: protectedProcedure
    .input(z.object({
      phone: z.string(),
      limit: z.number().min(1).max(50).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return {
          history: [],
          total: 0,
        };
      }

      const history = await db
        .select()
        .from(whatsappSendHistory)
        .where(eq(whatsappSendHistory.recipientPhone, input.phone))
        .orderBy(desc(whatsappSendHistory.createdAt))
        .limit(input.limit || 20);

      return {
        history,
        total: history.length,
      };
    }),

  /**
   * Detectar bloqueios de um número específico
   */
  detectNumberBlocks: protectedProcedure
    .input(z.object({
      affectedNumber: z.string(),
      periodHours: z.number().min(1).max(168).optional(),
    }))
    .mutation(async ({ input }) => {
      const hasMultipleBlocks = await blockProtection.detectMultipleBlocks(
        input.affectedNumber,
        input.periodHours || 24
      );

      return {
        hasMultipleBlocks,
        affectedNumber: input.affectedNumber,
        periodHours: input.periodHours || 24,
      };
    }),

  /**
   * Registrar feedback de mensagem (delivered, read, failed, blocked)
   */
  reportMessageStatus: protectedProcedure
    .input(z.object({
      messageId: z.string(),
      status: z.enum(['delivered', 'read', 'failed', 'blocked']),
      errorCode: z.string().optional(),
      errorMessage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await blockProtection.updateMessageStatus(
        input.messageId,
        input.status,
        input.errorCode,
        input.errorMessage
      );

      // Se bloqueado, detectar padrão
      if (input.status === 'blocked' && input.errorMessage) {
        const detection = await blockProtection.detectBlockFromResponse(
          input.messageId,
          input.errorCode,
          input.errorMessage
        );

        return {
          success: true,
          messageId: input.messageId,
          status: input.status,
          blockDetected: detection.isBlocked,
          blacklisted: detection.shouldBlacklist,
        };
      }

      return {
        success: true,
        messageId: input.messageId,
        status: input.status,
      };
    }),

  /**
   * Limpar opt-outs antigos
   */
  cleanOldOptOuts: protectedProcedure
    .input(z.object({
      daysOld: z.number().min(30).max(365).optional(),
    }))
    .mutation(async ({ input }) => {
      const removed = await blockProtection.cleanOldOptOuts(input.daysOld || 90);

      return {
        success: true,
        removed,
        daysOld: input.daysOld || 90,
      };
    }),
});
