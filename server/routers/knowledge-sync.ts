import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  telemetryMetrics,
  telemetryAnomalies,
  telemetryPredictions,
  telemetryLearnings,
  telemetryEvents
} from "../../drizzle/schema-telemetry";
import { desc, sql, and, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * API de Conhecimento Compartilhado
 * Permite que diferentes instâncias do sistema sincronizem aprendizados,
 * padrões identificados e melhorias descobertas
 */

interface KnowledgePackage {
  version: string;
  instanceId: string;
  exportedAt: string;
  learnings: unknown[];
  patterns: unknown[];
  improvements: unknown[];
  metadata: {
    totalLearnings: number;
    totalPatterns: number;
    avgConfidence: number;
    timeRange: {
      start: string;
      end: string;
    };
  };
}

export const knowledgeSyncRouter = router({
  /**
   * Exportar conhecimento da instância atual
   * Retorna aprendizados, padrões e melhorias para compartilhar
   */
  export: publicProcedure
    .input(
      z.object({
        instanceId: z.string().optional().default("default"),
        includeMetrics: z.boolean().optional().default(false),
        minConfidence: z.number().min(0).max(100).optional().default(70),
        daysBack: z.number().min(1).max(365).optional().default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const startDate = new Date(Date.now() - input.daysBack * 24 * 60 * 60 * 1000);

      // Exportar aprendizados com alta confiança
      const learnings = await db
        .select()
        .from(telemetryLearnings)
        .where(
          and(
            sql`${telemetryLearnings.confidence} >= ${input.minConfidence}`,
            gte(telemetryLearnings.createdAt, startDate)
          )
        )
        .orderBy(desc(telemetryLearnings.confidence))
        .limit(100);

      // Padrões identificados (learnings com alta ocorrência)
      const patterns = await db
        .select()
        .from(telemetryLearnings)
        .where(
          and(
            sql`${telemetryLearnings.occurrences} >= 5`,
            gte(telemetryLearnings.createdAt, startDate)
          )
        )
        .orderBy(desc(telemetryLearnings.occurrences))
        .limit(50);

      // Melhorias aplicadas com sucesso
      const improvements = await db
        .select()
        .from(telemetryLearnings)
        .where(
          and(
            sql`${telemetryLearnings.applied} = 1`,
            sql`${telemetryLearnings.impact} = 'positive'`,
            gte(telemetryLearnings.createdAt, startDate)
          )
        )
        .orderBy(desc(telemetryLearnings.appliedAt))
        .limit(50);

      // Métricas (opcional)
      let metrics = [];
      if (input.includeMetrics) {
        metrics = await db
          .select()
          .from(telemetryMetrics)
          .where(gte(telemetryMetrics.timestamp, startDate))
          .orderBy(desc(telemetryMetrics.timestamp))
          .limit(1000);
      }

      // Calcular estatísticas
      const avgConfidence = learnings.length > 0
        ? learnings.reduce((sum, l) => sum + parseFloat(l.confidence), 0) / learnings.length
        : 0;

      const knowledgePackage: KnowledgePackage = {
        version: "1.0",
        instanceId: input.instanceId,
        exportedAt: new Date().toISOString(),
        learnings: learnings.map((l) => ({
          ...l,
          // Remover IDs internos para evitar conflitos
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        })),
        patterns: patterns.map((p) => ({
          ...p,
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        })),
        improvements: improvements.map((i) => ({
          ...i,
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          appliedAt: undefined,
        })),
        metadata: {
          totalLearnings: learnings.length,
          totalPatterns: patterns.length,
          avgConfidence: parseFloat(avgConfidence.toFixed(2)),
          timeRange: {
            start: startDate.toISOString(),
            end: new Date().toISOString(),
          },
        },
      };

      return knowledgePackage;
    }),

  /**
   * Importar conhecimento de outra instância
   * Valida e integra aprendizados externos
   */
  import: protectedProcedure
    .input(
      z.object({
        knowledgePackage: z.object({
          version: z.string(),
          instanceId: z.string(),
          exportedAt: z.string(),
          learnings: z.array(z.any()),
          patterns: z.array(z.any()),
          improvements: z.array(z.any()),
          metadata: z.object({
            totalLearnings: z.number(),
            totalPatterns: z.number(),
            avgConfidence: z.number(),
            timeRange: z.object({
              start: z.string(),
              end: z.string(),
            }),
          }),
        }),
        mergeStrategy: z.enum(["replace", "merge", "skip_duplicates"]).optional().default("skip_duplicates"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { knowledgePackage, mergeStrategy } = input;

      // Validar versão do pacote
      if (knowledgePackage.version !== "1.0") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Versão do pacote não suportada: ${knowledgePackage.version}`,
        });
      }

      // Validar confiança mínima
      if (knowledgePackage.metadata.avgConfidence < 60) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Confiança média do pacote muito baixa (< 60%)",
        });
      }

      let imported = 0;
      let skipped = 0;
      let errors = 0;

      // Importar aprendizados
      for (const learning of knowledgePackage.learnings) {
        try {
          if (mergeStrategy === "skip_duplicates") {
            // Verificar se já existe
            const existing = await db
              .select()
              .from(telemetryLearnings)
              .where(sql`${telemetryLearnings.pattern} = ${learning.pattern}`)
              .limit(1);

            if (existing.length > 0) {
              // Atualizar ocorrências se já existe
              await db
                .update(telemetryLearnings)
                .set({
                  occurrences: sql`${telemetryLearnings.occurrences} + 1`,
                  confidence: sql`(${telemetryLearnings.confidence} + ${learning.confidence}) / 2`,
                })
                .where(sql`${telemetryLearnings.pattern} = ${learning.pattern}`);
              skipped++;
              continue;
            }
          }

          // Inserir novo aprendizado
          await db.insert(telemetryLearnings).values({
            category: learning.category,
            pattern: learning.pattern,
            description: learning.description,
            confidence: learning.confidence,
            occurrences: learning.occurrences || 1,
            impact: learning.impact,
            recommendation: learning.recommendation,
            applied: 0, // Não aplicar automaticamente
            metadata: JSON.stringify({
              importedFrom: knowledgePackage.instanceId,
              importedAt: new Date().toISOString(),
              originalData: learning.metadata,
            }),
          });

          imported++;
        } catch (error) {
          console.error("Erro ao importar aprendizado:", error);
          errors++;
        }
      }

      // Registrar evento de sincronização
      await db.insert(telemetryEvents).values({
        name: "knowledge.sync.import",
        severity: "info",
        category: "knowledge_sharing",
        metadata: JSON.stringify({
          sourceInstance: knowledgePackage.instanceId,
          imported,
          skipped,
          errors,
          totalLearnings: knowledgePackage.learnings.length,
          avgConfidence: knowledgePackage.metadata.avgConfidence,
        }),
        timestamp: new Date(),
      });

      return {
        success: true,
        imported,
        skipped,
        errors,
        total: knowledgePackage.learnings.length,
        message: `Importados ${imported} aprendizados de ${knowledgePackage.instanceId}`,
      };
    }),

  /**
   * Sincronizar com outra instância (bidirecional)
   * Exporta conhecimento local e importa conhecimento remoto
   */
  sync: protectedProcedure
    .input(
      z.object({
        remoteInstanceId: z.string(),
        remoteKnowledgePackage: z.object({
          version: z.string(),
          instanceId: z.string(),
          exportedAt: z.string(),
          learnings: z.array(z.any()),
          patterns: z.array(z.any()),
          improvements: z.array(z.any()),
          metadata: z.object({
            totalLearnings: z.number(),
            totalPatterns: z.number(),
            avgConfidence: z.number(),
            timeRange: z.object({
              start: z.string(),
              end: z.string(),
            }),
          }),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Importar conhecimento remoto
      const importResult = await ctx.procedures.knowledgeSync.import({
        knowledgePackage: input.remoteKnowledgePackage,
        mergeStrategy: "skip_duplicates",
      });

      // Exportar conhecimento local
      const exportResult = await ctx.procedures.knowledgeSync.export({
        instanceId: "local",
        includeMetrics: false,
        minConfidence: 70,
        daysBack: 30,
      });

      // Registrar sincronização
      await db.insert(telemetryEvents).values({
        name: "knowledge.sync.bidirectional",
        severity: "info",
        category: "knowledge_sharing",
        metadata: JSON.stringify({
          remoteInstance: input.remoteInstanceId,
          imported: importResult.imported,
          exported: exportResult.metadata.totalLearnings,
          syncedAt: new Date().toISOString(),
        }),
        timestamp: new Date(),
      });

      return {
        success: true,
        import: importResult,
        export: exportResult,
        message: `Sincronização completa com ${input.remoteInstanceId}`,
      };
    }),

  /**
   * Obter histórico de sincronizações
   */
  getSyncHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const syncEvents = await db
        .select()
        .from(telemetryEvents)
        .where(
          sql`${telemetryEvents.category} = 'knowledge_sharing'`
        )
        .orderBy(desc(telemetryEvents.timestamp))
        .limit(input.limit);

      return syncEvents;
    }),

  /**
   * Validar integridade de um pacote de conhecimento
   */
  validatePackage: publicProcedure
    .input(
      z.object({
        knowledgePackage: z.object({
          version: z.string(),
          instanceId: z.string(),
          exportedAt: z.string(),
          learnings: z.array(z.any()),
          patterns: z.array(z.any()),
          improvements: z.array(z.any()),
          metadata: z.object({
            totalLearnings: z.number(),
            totalPatterns: z.number(),
            avgConfidence: z.number(),
            timeRange: z.object({
              start: z.string(),
              end: z.string(),
            }),
          }),
        }),
      })
    )
    .query(({ input }) => {
      const { knowledgePackage } = input;

      const validations = {
        versionValid: knowledgePackage.version === "1.0",
        hasLearnings: knowledgePackage.learnings.length > 0,
        confidenceAcceptable: knowledgePackage.metadata.avgConfidence >= 60,
        dataIntegrity: knowledgePackage.learnings.length === knowledgePackage.metadata.totalLearnings,
        notExpired: new Date(knowledgePackage.exportedAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 dias
      };

      const isValid = Object.values(validations).every((v) => v === true);

      return {
        valid: isValid,
        validations,
        warnings: [
          !validations.versionValid && "Versão não suportada",
          !validations.hasLearnings && "Pacote vazio",
          !validations.confidenceAcceptable && "Confiança muito baixa",
          !validations.dataIntegrity && "Dados inconsistentes",
          !validations.notExpired && "Pacote expirado (> 90 dias)",
        ].filter(Boolean),
      };
    }),
});
