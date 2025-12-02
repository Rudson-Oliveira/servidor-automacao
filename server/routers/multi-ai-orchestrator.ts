import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

/**
 * ORQUESTRADOR MULTI-IA - FASE 3 AUDITORIA FORENSE
 * 
 * Integra 6 IAs com fallback automático e aprendizado:
 * 1. COMET - Automação e controle desktop
 * 2. GENSPARK - Pesquisa e análise de dados
 * 3. ABACUS - Organização e conhecimento
 * 4. CLAUDE - Raciocínio complexo e código
 * 5. GEMINI - Multimodal e visão computacional
 * 6. DEEPSITE - Clonagem e análise web
 */

// Tipos de tarefas que cada IA pode executar
const AI_CAPABILITIES = {
  COMET: ["automation", "desktop_control", "file_management", "system_tasks"],
  GENSPARK: ["research", "data_analysis", "web_search", "information_gathering"],
  ABACUS: ["organization", "knowledge_management", "documentation", "planning"],
  CLAUDE: ["coding", "complex_reasoning", "analysis", "problem_solving"],
  GEMINI: ["multimodal", "vision", "image_analysis", "creative_tasks"],
  DEEPSITE: ["web_cloning", "ui_analysis", "website_generation", "design"],
} as const;

type AIName = keyof typeof AI_CAPABILITIES;
type TaskType = (typeof AI_CAPABILITIES)[AIName][number];

interface AIPerformanceMetric {
  aiName: AIName;
  taskType: TaskType;
  successCount: number;
  failureCount: number;
  avgResponseTime: number;
  lastUsed: Date;
}

// Armazenamento em memória das métricas (em produção, usar banco de dados)
const performanceMetrics = new Map<string, AIPerformanceMetric>();

/**
 * Seleciona a melhor IA para uma tarefa baseado em:
 * 1. Capacidades da IA
 * 2. Histórico de performance
 * 3. Taxa de sucesso
 * 4. Tempo de resposta médio
 */
function selectBestAI(taskType: TaskType): AIName {
  const capableAIs = Object.entries(AI_CAPABILITIES)
    .filter(([_, capabilities]) => capabilities.includes(taskType as any))
    .map(([name]) => name as AIName);

  if (capableAIs.length === 0) {
    // Fallback para CLAUDE (mais versátil)
    return "CLAUDE";
  }

  if (capableAIs.length === 1) {
    return capableAIs[0];
  }

  // Selecionar baseado em métricas de performance
  let bestAI = capableAIs[0];
  let bestScore = 0;

  for (const aiName of capableAIs) {
    const metricKey = `${aiName}:${taskType}`;
    const metric = performanceMetrics.get(metricKey);

    if (!metric) {
      // IA nunca usada para esta tarefa, dar chance
      continue;
    }

    // Calcular score baseado em taxa de sucesso e tempo de resposta
    const successRate = metric.successCount / (metric.successCount + metric.failureCount);
    const responseScore = 1000 / (metric.avgResponseTime + 1); // Menor tempo = melhor
    const score = successRate * 0.7 + responseScore * 0.3;

    if (score > bestScore) {
      bestScore = score;
      bestAI = aiName;
    }
  }

  return bestAI;
}

/**
 * Registra resultado de execução para aprendizado
 */
function recordPerformance(
  aiName: AIName,
  taskType: TaskType,
  success: boolean,
  responseTime: number
) {
  const metricKey = `${aiName}:${taskType}`;
  const existing = performanceMetrics.get(metricKey);

  if (existing) {
    const totalExecutions = existing.successCount + existing.failureCount;
    const newAvgResponseTime =
      (existing.avgResponseTime * totalExecutions + responseTime) / (totalExecutions + 1);

    performanceMetrics.set(metricKey, {
      ...existing,
      successCount: existing.successCount + (success ? 1 : 0),
      failureCount: existing.failureCount + (success ? 0 : 1),
      avgResponseTime: newAvgResponseTime,
      lastUsed: new Date(),
    });
  } else {
    performanceMetrics.set(metricKey, {
      aiName,
      taskType,
      successCount: success ? 1 : 0,
      failureCount: success ? 0 : 1,
      avgResponseTime: responseTime,
      lastUsed: new Date(),
    });
  }
}

/**
 * Executa tarefa com fallback automático
 */
async function executeWithFallback(
  taskType: TaskType,
  prompt: string,
  maxRetries: number = 3
): Promise<{ result: string; aiUsed: AIName; attempts: number }> {
  let attempts = 0;
  const triedAIs = new Set<AIName>();

  while (attempts < maxRetries) {
    attempts++;
    const aiName = selectBestAI(taskType);

    // Evitar tentar a mesma IA duas vezes
    if (triedAIs.has(aiName) && triedAIs.size < Object.keys(AI_CAPABILITIES).length) {
      // Tentar próxima melhor IA
      const capableAIs = Object.entries(AI_CAPABILITIES)
        .filter(([name, capabilities]) => 
          capabilities.includes(taskType as any) && !triedAIs.has(name as AIName)
        )
        .map(([name]) => name as AIName);

      if (capableAIs.length > 0) {
        const nextAI = capableAIs[0];
        triedAIs.add(nextAI);

        try {
          const startTime = Date.now();
          const result = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Você é ${nextAI}, especialista em ${AI_CAPABILITIES[nextAI].join(", ")}.`,
              },
              { role: "user", content: prompt },
            ],
          });

          const responseTime = Date.now() - startTime;
          const content = result.choices[0]?.message?.content || "";

          recordPerformance(nextAI, taskType, true, responseTime);

          return {
            result: content,
            aiUsed: nextAI,
            attempts,
          };
        } catch (error) {
          const responseTime = Date.now() - startTime;
          recordPerformance(nextAI, taskType, false, responseTime);
          console.error(`[MultiAI] ${nextAI} falhou:`, error);
          continue;
        }
      }
    }

    triedAIs.add(aiName);

    try {
      const startTime = Date.now();
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é ${aiName}, especialista em ${AI_CAPABILITIES[aiName].join(", ")}.`,
          },
          { role: "user", content: prompt },
        ],
      });

      const responseTime = Date.now() - startTime;
      const content = result.choices[0]?.message?.content || "";

      recordPerformance(aiName, taskType, true, responseTime);

      return {
        result: content,
        aiUsed: aiName,
        attempts,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      recordPerformance(aiName, taskType, false, responseTime);
      console.error(`[MultiAI] ${aiName} falhou (tentativa ${attempts}):`, error);

      if (attempts >= maxRetries) {
        throw new Error(`Todas as ${maxRetries} tentativas falharam. Última IA: ${aiName}`);
      }
    }
  }

  throw new Error("Falha ao executar tarefa após múltiplas tentativas");
}

export const multiAIRouter = router({
  /**
   * Executa uma tarefa usando a melhor IA disponível
   */
  execute: protectedProcedure
    .input(
      z.object({
        taskType: z.enum([
          "automation",
          "desktop_control",
          "file_management",
          "system_tasks",
          "research",
          "data_analysis",
          "web_search",
          "information_gathering",
          "organization",
          "knowledge_management",
          "documentation",
          "planning",
          "coding",
          "complex_reasoning",
          "analysis",
          "problem_solving",
          "multimodal",
          "vision",
          "image_analysis",
          "creative_tasks",
          "web_cloning",
          "ui_analysis",
          "website_generation",
          "design",
        ]),
        prompt: z.string().min(1).max(10000),
        maxRetries: z.number().min(1).max(5).optional().default(3),
      })
    )
    .mutation(async ({ input }) => {
      const { result, aiUsed, attempts } = await executeWithFallback(
        input.taskType,
        input.prompt,
        input.maxRetries
      );

      return {
        success: true,
        result,
        aiUsed,
        attempts,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * Obtém métricas de performance das IAs
   */
  getMetrics: protectedProcedure.query(() => {
    const metrics = Array.from(performanceMetrics.values());

    // Agrupar por IA
    const byAI = metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.aiName]) {
          acc[metric.aiName] = {
            aiName: metric.aiName,
            totalTasks: 0,
            successRate: 0,
            avgResponseTime: 0,
            taskTypes: [],
          };
        }

        const total = metric.successCount + metric.failureCount;
        acc[metric.aiName].totalTasks += total;
        acc[metric.aiName].successRate +=
          (metric.successCount / total) * total;
        acc[metric.aiName].avgResponseTime += metric.avgResponseTime * total;
        acc[metric.aiName].taskTypes.push(metric.taskType);

        return acc;
      },
      {} as Record<string, any>
    );

    // Calcular médias
    Object.values(byAI).forEach((ai: any) => {
      ai.successRate = (ai.successRate / ai.totalTasks) * 100;
      ai.avgResponseTime = ai.avgResponseTime / ai.totalTasks;
    });

    return {
      byAI: Object.values(byAI),
      totalExecutions: metrics.reduce(
        (sum, m) => sum + m.successCount + m.failureCount,
        0
      ),
      overallSuccessRate:
        (metrics.reduce((sum, m) => sum + m.successCount, 0) /
          metrics.reduce((sum, m) => sum + m.successCount + m.failureCount, 0)) *
        100,
    };
  }),

  /**
   * Obtém capacidades de cada IA
   */
  getCapabilities: protectedProcedure.query(() => {
    return {
      capabilities: AI_CAPABILITIES,
      availableAIs: Object.keys(AI_CAPABILITIES),
      taskTypes: Array.from(
        new Set(Object.values(AI_CAPABILITIES).flat())
      ).sort(),
    };
  }),

  /**
   * Recomenda a melhor IA para uma tarefa
   */
  recommendAI: protectedProcedure
    .input(
      z.object({
        taskType: z.string(),
      })
    )
    .query(({ input }) => {
      const bestAI = selectBestAI(input.taskType as TaskType);
      const metricKey = `${bestAI}:${input.taskType}`;
      const metric = performanceMetrics.get(metricKey);

      return {
        recommendedAI: bestAI,
        capabilities: AI_CAPABILITIES[bestAI],
        performance: metric
          ? {
              successRate:
                (metric.successCount /
                  (metric.successCount + metric.failureCount)) *
                100,
              avgResponseTime: metric.avgResponseTime,
              totalExecutions: metric.successCount + metric.failureCount,
            }
          : null,
      };
    }),
});
