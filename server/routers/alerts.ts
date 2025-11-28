import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { alertConfigs, alertTemplates } from "../../drizzle/schema";
import {
  sendAlert,
  getAlertHistory,
  createDefaultAlertConfig,
  type AlertPayload,
} from "../services/alert-service";

/**
 * Router de Alertas Proativos
 * 
 * Endpoints:
 * - alerts.getConfig - Buscar configuração do usuário
 * - alerts.updateConfig - Atualizar configuração
 * - alerts.getHistory - Buscar histórico de alertas
 * - alerts.send - Enviar alerta manualmente
 * - alerts.test - Testar envio de alerta
 * - alerts.templates.list - Listar templates
 * - alerts.templates.create - Criar template
 */

export const alertsRouter = router({
  // Buscar configuração de alertas do usuário
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database não disponível");

    const configs = await db
      .select()
      .from(alertConfigs)
      .where(eq(alertConfigs.userId, ctx.user.id))
      .limit(1);

    if (configs.length === 0) {
      // Criar configuração padrão
      await createDefaultAlertConfig(ctx.user.id, ctx.user.email || undefined);
      
      const newConfigs = await db
        .select()
        .from(alertConfigs)
        .where(eq(alertConfigs.userId, ctx.user.id))
        .limit(1);

      return newConfigs[0] || null;
    }

    return configs[0];
  }),

  // Atualizar configuração de alertas
  updateConfig: protectedProcedure
    .input(
      z.object({
        emailEnabled: z.boolean().optional(),
        emailAddress: z.string().email().optional().nullable(),
        whatsappEnabled: z.boolean().optional(),
        whatsappNumber: z.string().optional().nullable(),
        pushEnabled: z.boolean().optional(),
        minSeverity: z.enum(["low", "medium", "high", "critical"]).optional(),
        anomalyAlerts: z.boolean().optional(),
        predictionAlerts: z.boolean().optional(),
        errorAlerts: z.boolean().optional(),
        performanceAlerts: z.boolean().optional(),
        throttleMinutes: z.number().min(1).max(1440).optional(),
        allowedHours: z
          .object({
            start: z.string().regex(/^\d{2}:\d{2}$/),
            end: z.string().regex(/^\d{2}:\d{2}$/),
          })
          .optional()
          .nullable(),
        allowedDays: z.array(z.number().min(0).max(6)).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      // Verificar se configuração existe
      const existing = await db
        .select()
        .from(alertConfigs)
        .where(eq(alertConfigs.userId, ctx.user.id))
        .limit(1);

      if (existing.length === 0) {
        // Criar nova configuração
        await db.insert(alertConfigs).values({
          userId: ctx.user.id,
          ...input,
        });
      } else {
        // Atualizar existente
        await db
          .update(alertConfigs)
          .set(input)
          .where(eq(alertConfigs.userId, ctx.user.id));
      }

      return { success: true };
    }),

  // Buscar histórico de alertas
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return await getAlertHistory(ctx.user.id, input.limit);
    }),

  // Enviar alerta manualmente
  send: protectedProcedure
    .input(
      z.object({
        type: z.enum(["anomaly", "prediction", "error", "performance", "custom"]),
        severity: z.enum(["low", "medium", "high", "critical"]),
        title: z.string().min(1).max(255),
        message: z.string().min(1),
        metadata: z.record(z.any()).optional(),
        sourceType: z.string().optional(),
        sourceId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payload: AlertPayload = {
        userId: ctx.user.id,
        ...input,
      };

      return await sendAlert(payload);
    }),

  // Testar envio de alerta (envia alerta de teste)
  test: protectedProcedure
    .input(
      z.object({
        channel: z.enum(["email", "whatsapp", "push"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payload: AlertPayload = {
        userId: ctx.user.id,
        type: "custom",
        severity: "low",
        title: "🧪 Teste de Alerta",
        message: `Este é um alerta de teste enviado em ${new Date().toLocaleString("pt-BR")}. Se você recebeu esta mensagem, o sistema de alertas está funcionando corretamente!`,
        metadata: {
          testChannel: input.channel || "all",
          timestamp: new Date().toISOString(),
        },
      };

      return await sendAlert(payload);
    }),

  // Templates
  templates: router({
    // Listar templates
    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database não disponível");

      return await db.select().from(alertTemplates).where(eq(alertTemplates.isActive, true));
    }),

    // Criar template
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          type: z.enum(["anomaly", "prediction", "error", "performance", "custom"]),
          severity: z.enum(["low", "medium", "high", "critical"]),
          emailSubject: z.string().optional(),
          emailBody: z.string().optional(),
          emailHtml: z.string().optional(),
          whatsappMessage: z.string().optional(),
          pushTitle: z.string().optional(),
          pushBody: z.string().optional(),
          variables: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database não disponível");

        await db.insert(alertTemplates).values({
          ...input,
          isSystem: false,
        });

        return { success: true };
      }),

    // Atualizar template
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          emailSubject: z.string().optional(),
          emailBody: z.string().optional(),
          emailHtml: z.string().optional(),
          whatsappMessage: z.string().optional(),
          pushTitle: z.string().optional(),
          pushBody: z.string().optional(),
          variables: z.array(z.string()).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database não disponível");

        const { id, ...updates } = input;

        await db.update(alertTemplates).set(updates).where(eq(alertTemplates.id, id));

        return { success: true };
      }),

    // Deletar template (apenas não-sistema)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database não disponível");

        // Verificar se não é template do sistema
        const templates = await db
          .select()
          .from(alertTemplates)
          .where(eq(alertTemplates.id, input.id))
          .limit(1);

        if (templates.length === 0) {
          throw new Error("Template não encontrado");
        }

        if (templates[0].isSystem) {
          throw new Error("Templates do sistema não podem ser deletados");
        }

        await db.update(alertTemplates).set({ isActive: false }).where(eq(alertTemplates.id, input.id));

        return { success: true };
      }),
  }),
});
