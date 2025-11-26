import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { whatsappCampaigns, whatsappCampaignContacts, whatsappTemplates } from '../../drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { antiBlockEngine } from '../_core/anti-block-engine';
import { whatsappWebService } from '../_core/whatsapp-web-service';
import { TRPCError } from '@trpc/server';

export const bulkSendRouter = router({
  /**
   * Criar nova campanha de envio em massa
   */
  createCampaign: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        templateId: z.number().optional(),
        sessionId: z.string(),
        scheduledStart: z.date().optional(),
        scheduledEnd: z.date().optional(),
        allowedHoursStart: z.number().min(0).max(23).default(9),
        allowedHoursEnd: z.number().min(0).max(23).default(18),
        maxMessagesPerHour: z.number().default(40),
        maxMessagesPerDay: z.number().default(300),
        autoPauseEnabled: z.boolean().default(true),
        autoPauseThreshold: z.number().default(5),
        contacts: z.array(
          z.object({
            phone: z.string(),
            name: z.string().optional(),
            variables: z.record(z.string(), z.string()).optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Criar campanha
      const campaignResult = await db.insert(whatsappCampaigns).values({
        name: input.name,
        description: input.description,
        templateId: input.templateId,
        sessionId: input.sessionId,
        status: input.scheduledStart ? 'scheduled' : 'draft',
        scheduledStart: input.scheduledStart,
        scheduledEnd: input.scheduledEnd,
        allowedHoursStart: input.allowedHoursStart,
        allowedHoursEnd: input.allowedHoursEnd,
        maxMessagesPerHour: input.maxMessagesPerHour,
        maxMessagesPerDay: input.maxMessagesPerDay,
        autoPauseEnabled: input.autoPauseEnabled,
        autoPauseThreshold: input.autoPauseThreshold,
        totalContacts: input.contacts.length,
      });

      const campaignId = campaignResult[0]?.insertId ?? 0;

      // Adicionar contatos
      if (input.contacts.length > 0) {
        await db.insert(whatsappCampaignContacts).values(
          input.contacts.map(contact => ({
            campaignId: Number(campaignId),
            phone: contact.phone,
            name: contact.name,
            variables: contact.variables as Record<string, string> | null | undefined,
            status: 'pending' as const,
          }))
        );
      }

      return { campaignId: Number(campaignId), success: true };
    }),

  /**
   * Iniciar envio de campanha
   */
  startCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Buscar campanha
      const campaigns = await db
        .select()
        .from(whatsappCampaigns)
        .where(eq(whatsappCampaigns.id, input.campaignId));

      if (campaigns.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Campanha não encontrada' });
      }

      const campaign = campaigns[0]!;

      // Verificar se sessão está pronta
      const session = whatsappWebService.getSession(campaign.sessionId);
      if (!session || session.status !== 'ready') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Sessão WhatsApp não está pronta',
        });
      }

      // Verificar risco de bloqueio
      const riskAssessment = await antiBlockEngine.assessRisk(session.phone);
      if (riskAssessment.shouldPause) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Modo anti-bloqueio acionado. Aguarde ${Math.floor(riskAssessment.pauseDuration / 60)} minutos antes de continuar.`,
        });
      }

      // Atualizar status
      await db
        .update(whatsappCampaigns)
        .set({
          status: 'running',
          startedAt: new Date(),
        })
        .where(eq(whatsappCampaigns.id, input.campaignId));

      return { success: true, message: 'Campanha iniciada' };
    }),

  /**
   * Pausar campanha
   */
  pauseCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      await db
        .update(whatsappCampaigns)
        .set({
          status: 'paused',
          pausedAt: new Date(),
          pauseReason: input.reason,
        })
        .where(eq(whatsappCampaigns.id, input.campaignId));

      return { success: true };
    }),

  /**
   * Retomar campanha
   */
  resumeCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      await db
        .update(whatsappCampaigns)
        .set({
          status: 'running',
          pausedAt: null,
          pauseReason: null,
        })
        .where(eq(whatsappCampaigns.id, input.campaignId));

      return { success: true };
    }),

  /**
   * Cancelar campanha
   */
  cancelCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      await db
        .update(whatsappCampaigns)
        .set({
          status: 'cancelled',
          completedAt: new Date(),
        })
        .where(eq(whatsappCampaigns.id, input.campaignId));

      return { success: true };
    }),

  /**
   * Obter detalhes de campanha
   */
  getCampaign: publicProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const campaigns = await db
        .select()
        .from(whatsappCampaigns)
        .where(eq(whatsappCampaigns.id, input.campaignId));

      if (campaigns.length === 0) {
        return { found: false };
      }

      return { found: true, campaign: campaigns[0] };
    }),

  /**
   * Listar campanhas
   */
  listCampaigns: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { campaigns: [], count: 0 };

    const campaigns = await db.select().from(whatsappCampaigns);

    return { campaigns, count: campaigns.length };
  }),

  /**
   * Obter progresso de campanha em tempo real
   */
  getCampaignProgress: publicProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const campaigns = await db
        .select()
        .from(whatsappCampaigns)
        .where(eq(whatsappCampaigns.id, input.campaignId));

      if (campaigns.length === 0) {
        return { found: false };
      }

      const campaign = campaigns[0]!;

      // Buscar contatos pendentes
      const pendingContacts = await db
        .select()
        .from(whatsappCampaignContacts)
        .where(
          and(
            eq(whatsappCampaignContacts.campaignId, input.campaignId),
            eq(whatsappCampaignContacts.status, 'pending')
          )
        );

      return {
        found: true,
        campaign,
        progress: {
          total: campaign.totalContacts,
          sent: campaign.messagesSent,
          delivered: campaign.messagesDelivered,
          read: campaign.messagesRead,
          failed: campaign.messagesFailed,
          blocked: campaign.messagesBlocked,
          pending: pendingContacts.length,
          percentComplete:
            (campaign.totalContacts ?? 0) > 0
              ? Math.round(((campaign.messagesSent ?? 0) / (campaign.totalContacts ?? 0)) * 100)
              : 0,
        },
      };
    }),

  /**
   * Avaliar risco de bloqueio para sessão
   */
  assessRisk: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const session = whatsappWebService.getSession(input.sessionId);
      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Sessão não encontrada' });
      }

      const assessment = await antiBlockEngine.assessRisk(session.phone);
      return assessment;
    }),
});
