import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { sistemaPai } from "../_core/sistema-pai";
import { TRPCError } from "@trpc/server";

/**
 * Router para Sistema Pai - Backups e Proteção do Protótipo Original
 */
export const sistemaPaiRouter = router({
  /**
   * Criar backup manual
   */
  createBackup: protectedProcedure
    .input(
      z.object({
        type: z.enum(["daily", "manual", "pre-update", "sistema-pai"]).optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
        isPrototypeOriginal: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Apenas admin pode criar backups
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem criar backups",
        });
      }

      try {
        const backupId = await sistemaPai.createBackup(input);
        return {
          success: true,
          backupId,
          message: "Backup criado com sucesso",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao criar backup",
        });
      }
    }),

  /**
   * Restaurar backup específico
   */
  restoreBackup: protectedProcedure
    .input(
      z.object({
        backupId: z.number(),
        reason: z.enum(["manual", "auto-correction-failed", "critical-error", "rollback-requested"]),
        reasonDetails: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Apenas admin pode restaurar backups
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem restaurar backups",
        });
      }

      try {
        const success = await sistemaPai.restoreBackup(input.backupId, {
          reason: input.reason,
          reasonDetails: input.reasonDetails,
          requestedBy: `user:${ctx.user.name || ctx.user.openId}`,
        });

        return {
          success,
          message: success ? "Backup restaurado com sucesso" : "Falha ao restaurar backup",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao restaurar backup",
        });
      }
    }),

  /**
   * Restaurar protótipo original
   */
  restorePrototype: protectedProcedure
    .input(
      z.object({
        reasonDetails: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Apenas admin pode restaurar protótipo
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem restaurar o protótipo original",
        });
      }

      try {
        const success = await sistemaPai.restorePrototype({
          reasonDetails: input.reasonDetails || "Restauração manual do protótipo original",
          requestedBy: `user:${ctx.user.name || ctx.user.openId}`,
        });

        return {
          success,
          message: success
            ? "⭐ Protótipo original restaurado com sucesso"
            : "Falha ao restaurar protótipo original",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao restaurar protótipo",
        });
      }
    }),

  /**
   * Listar backups disponíveis
   */
  listBackups: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      // Apenas admin pode ver backups
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem visualizar backups",
        });
      }

      try {
        const backups = await sistemaPai.listBackups(input.limit);
        return {
          success: true,
          backups,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao listar backups",
        });
      }
    }),

  /**
   * Obter configuração do Sistema Pai
   */
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    // Apenas admin pode ver configuração
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Apenas administradores podem visualizar configuração",
      });
    }

    try {
      const config = await sistemaPai.getConfig();
      return {
        success: true,
        config,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao obter configuração",
      });
    }
  }),

  /**
   * Atualizar configuração do Sistema Pai
   */
  updateConfig: protectedProcedure
    .input(
      z.object({
        backupEnabled: z.number().optional(),
        backupTime: z.string().optional(),
        maxBackups: z.number().optional(),
        autoRestoreEnabled: z.number().optional(),
        autoRestoreThreshold: z.number().optional(),
        notifyOnBackup: z.number().optional(),
        notifyOnRestore: z.number().optional(),
        notifyEmail: z.string().optional(),
        notifyWhatsapp: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Apenas admin pode atualizar configuração
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem atualizar configuração",
        });
      }

      try {
        await sistemaPai.updateConfig(input);
        return {
          success: true,
          message: "Configuração atualizada com sucesso",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao atualizar configuração",
        });
      }
    }),

  /**
   * Inicializar Sistema Pai
   */
  initialize: protectedProcedure.mutation(async ({ ctx }) => {
    // Apenas admin pode inicializar
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Apenas administradores podem inicializar o Sistema Pai",
      });
    }

    try {
      await sistemaPai.initialize();
      return {
        success: true,
        message: "Sistema Pai inicializado com sucesso",
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao inicializar Sistema Pai",
      });
    }
  }),
});
