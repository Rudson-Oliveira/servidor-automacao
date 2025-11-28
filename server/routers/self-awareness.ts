/**
 * Router de Auto-Conhecimento
 * Endpoints para análise e evolução autônoma do sistema
 */

import { router, protectedProcedure } from "../_core/trpc";
import { 
  runSelfAwarenessAnalysis,
  analyzeCodebase,
  analyzePerformance,
  generateOptimizationSuggestions
} from "../services/self-awareness-service";

export const selfAwarenessRouter = router({
  /**
   * Executa análise completa de auto-conhecimento
   */
  runAnalysis: protectedProcedure.mutation(async () => {
    const result = await runSelfAwarenessAnalysis();
    return result;
  }),

  /**
   * Analisa apenas código-fonte
   */
  analyzeCode: protectedProcedure.query(async () => {
    const analysis = await analyzeCodebase();
    return analysis;
  }),

  /**
   * Analisa apenas performance
   */
  analyzePerformance: protectedProcedure.query(async () => {
    const insights = await analyzePerformance(7);
    return insights;
  }),

  /**
   * Gera sugestões de otimização
   */
  getSuggestions: protectedProcedure.mutation(async () => {
    const codeAnalysis = await analyzeCodebase();
    const performanceInsights = await analyzePerformance(7);
    const suggestions = await generateOptimizationSuggestions(codeAnalysis, performanceInsights);
    return suggestions;
  }),
});
