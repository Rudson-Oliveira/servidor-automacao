/**
 * Router tRPC para gerenciamento de cache
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { cache } from "../_core/cache";

export const cacheRouter = router({
  /**
   * Obter estatísticas do cache
   */
  stats: protectedProcedure.query(() => {
    return cache.getStats();
  }),
  
  /**
   * Limpar cache por padrão
   */
  invalidate: protectedProcedure
    .input(z.object({
      pattern: z.string(),
    }))
    .mutation(({ input }) => {
      const count = cache.invalidatePattern(input.pattern);
      return {
        success: true,
        invalidated: count,
      };
    }),
  
  /**
   * Limpar todo o cache
   */
  clear: protectedProcedure.mutation(() => {
    cache.clear();
    return {
      success: true,
      message: "Cache limpo com sucesso",
    };
  }),
  
  /**
   * Resetar estatísticas
   */
  resetStats: protectedProcedure.mutation(() => {
    cache.resetStats();
    return {
      success: true,
      message: "Estatísticas resetadas",
    };
  }),
});
