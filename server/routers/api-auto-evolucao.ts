import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { apiAutoEvolucao } from "../_core/api-auto-evolucao";
import { TRPCError } from "@trpc/server";

/**
 * Router para API de Auto-Evolução
 * Permite IAs externas conhecerem o sistema e enviarem melhorias
 */
export const apiAutoEvolucaoRouter = router({
  /**
   * Obter conhecimento sobre o sistema (público para IAs)
   */
  getKnowledge: publicProcedure
    .input(
      z.object({
        module: z.string().optional(),
        tags: z.array(z.string()).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const knowledge = await apiAutoEvolucao.getKnowledge(input);
        return {
          success: true,
          knowledge,
          total: knowledge.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao buscar conhecimento",
        });
      }
    }),

  /**
   * Submeter contribuição (público para IAs com API key)
   */
  submitContribution: publicProcedure
    .input(
      z.object({
        aiSource: z.string(),
        aiApiKey: z.string(),
        contributionType: z.enum(["bug-fix", "feature", "optimization", "documentation"]),
        title: z.string(),
        description: z.string(),
        targetModule: z.string(),
        targetFile: z.string().optional(),
        proposedCode: z.string().optional(),
        diffPatch: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await apiAutoEvolucao.submitContribution(input);
        return {
          success: true,
          ...result,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao submeter contribuição",
        });
      }
    }),

  /**
   * Listar contribuições pendentes (apenas admin)
   */
  listPendingContributions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Apenas administradores podem visualizar contribuições",
      });
    }

    try {
      const contributions = await apiAutoEvolucao.listPendingContributions();
      return {
        success: true,
        contributions,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao listar contribuições",
      });
    }
  }),

  /**
   * Aplicar contribuição manualmente (apenas admin)
   */
  applyContribution: protectedProcedure
    .input(
      z.object({
        contributionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem aplicar contribuições",
        });
      }

      try {
        const success = await apiAutoEvolucao.applyContribution(input.contributionId);
        return {
          success,
          message: success ? "Contribuição aplicada com sucesso" : "Falha ao aplicar contribuição",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao aplicar contribuição",
        });
      }
    }),

  /**
   * Obter feedback de uma contribuição (público para IAs)
   */
  getFeedback: publicProcedure
    .input(
      z.object({
        contributionId: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const feedback = await apiAutoEvolucao.getFeedback(input.contributionId);
        return {
          success: true,
          feedback,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao buscar feedback",
        });
      }
    }),

  /**
   * Popular base de conhecimento (apenas admin)
   */
  populateKnowledgeBase: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Apenas administradores podem popular base de conhecimento",
      });
    }

    try {
      await apiAutoEvolucao.populateKnowledgeBase();
      return {
        success: true,
        message: "Base de conhecimento populada com sucesso",
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao popular base de conhecimento",
      });
    }
  }),
});
