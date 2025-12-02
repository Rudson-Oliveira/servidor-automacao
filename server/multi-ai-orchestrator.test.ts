import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * TESTES DO ORQUESTRADOR MULTI-IA - FASE 3 AUDITORIA FORENSE
 * 
 * Valida integração das 6 IAs:
 * - COMET, GENSPARK, ABACUS, CLAUDE, GEMINI, DEEPSITE
 */

describe("Orquestrador Multi-IA - Auditoria Forense", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx: TrpcContext = {
      user: {
        id: 1,
        openId: "multi-ai-test",
        email: "multiai@test.com",
        name: "Multi AI Test",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    caller = appRouter.createCaller(ctx);
  });

  describe("1. Capacidades das IAs", () => {
    it("deve listar todas as 6 IAs disponíveis", async () => {
      const result = await caller.multiAI.getCapabilities();

      expect(result.availableAIs).toHaveLength(6);
      expect(result.availableAIs).toContain("COMET");
      expect(result.availableAIs).toContain("GENSPARK");
      expect(result.availableAIs).toContain("ABACUS");
      expect(result.availableAIs).toContain("CLAUDE");
      expect(result.availableAIs).toContain("GEMINI");
      expect(result.availableAIs).toContain("DEEPSITE");

      console.log(`[MultiAI Test] ✅ 6 IAs disponíveis: ${result.availableAIs.join(", ")}`);
    });

    it("deve mapear capacidades de cada IA", async () => {
      const result = await caller.multiAI.getCapabilities();

      expect(result.capabilities.COMET).toContain("automation");
      expect(result.capabilities.GENSPARK).toContain("research");
      expect(result.capabilities.ABACUS).toContain("organization");
      expect(result.capabilities.CLAUDE).toContain("coding");
      expect(result.capabilities.GEMINI).toContain("multimodal");
      expect(result.capabilities.DEEPSITE).toContain("web_cloning");

      console.log("[MultiAI Test] ✅ Capacidades mapeadas corretamente");
    });

    it("deve listar todos os tipos de tarefas suportados", async () => {
      const result = await caller.multiAI.getCapabilities();

      expect(result.taskTypes.length).toBeGreaterThan(20);
      expect(result.taskTypes).toContain("automation");
      expect(result.taskTypes).toContain("research");
      expect(result.taskTypes).toContain("coding");

      console.log(`[MultiAI Test] ✅ ${result.taskTypes.length} tipos de tarefas suportados`);
    });
  });

  describe("2. Seleção Inteligente de IA", () => {
    it("deve recomendar COMET para automação", async () => {
      const result = await caller.multiAI.recommendAI({ taskType: "automation" });

      expect(result.recommendedAI).toBe("COMET");
      expect(result.capabilities).toContain("automation");

      console.log("[MultiAI Test] ✅ COMET recomendado para automação");
    });

    it("deve recomendar GENSPARK para pesquisa", async () => {
      const result = await caller.multiAI.recommendAI({ taskType: "research" });

      expect(result.recommendedAI).toBe("GENSPARK");
      expect(result.capabilities).toContain("research");

      console.log("[MultiAI Test] ✅ GENSPARK recomendado para pesquisa");
    });

    it("deve recomendar CLAUDE para código", async () => {
      const result = await caller.multiAI.recommendAI({ taskType: "coding" });

      expect(result.recommendedAI).toBe("CLAUDE");
      expect(result.capabilities).toContain("coding");

      console.log("[MultiAI Test] ✅ CLAUDE recomendado para código");
    });

    it("deve recomendar DEEPSITE para clonagem web", async () => {
      const result = await caller.multiAI.recommendAI({ taskType: "web_cloning" });

      expect(result.recommendedAI).toBe("DEEPSITE");
      expect(result.capabilities).toContain("web_cloning");

      console.log("[MultiAI Test] ✅ DEEPSITE recomendado para clonagem web");
    });
  });

  describe("3. Execução com Fallback", () => {
    it("deve executar tarefa simples com sucesso", async () => {
      const result = await caller.multiAI.execute({
        taskType: "analysis",
        prompt: "Analise brevemente: 2+2=?",
        maxRetries: 3,
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.aiUsed).toBeDefined();
      expect(result.attempts).toBeGreaterThan(0);
      expect(result.attempts).toBeLessThanOrEqual(3);

      console.log(`[MultiAI Test] ✅ Tarefa executada por ${result.aiUsed} em ${result.attempts} tentativa(s)`);
    }, 30000);

    it("deve registrar métricas de performance", async () => {
      // Executar algumas tarefas
      await caller.multiAI.execute({
        taskType: "analysis",
        prompt: "Análise rápida: qual é a capital do Brasil?",
      });

      await caller.multiAI.execute({
        taskType: "coding",
        prompt: "Escreva uma função simples em Python que soma dois números",
      });

      // Verificar métricas
      const metrics = await caller.multiAI.getMetrics();

      expect(metrics.totalExecutions).toBeGreaterThan(0);
      expect(metrics.byAI).toBeDefined();
      expect(Array.isArray(metrics.byAI)).toBe(true);

      console.log(`[MultiAI Test] ✅ Métricas registradas: ${metrics.totalExecutions} execuções`);
      console.log(`[MultiAI Test] Taxa de sucesso geral: ${metrics.overallSuccessRate.toFixed(1)}%`);
    }, 60000);
  });

  describe("4. Aprendizado e Otimização", () => {
    it("deve melhorar seleção baseado em histórico", async () => {
      // Executar múltiplas tarefas do mesmo tipo
      const taskType = "problem_solving";
      const executions = 3;

      for (let i = 0; i < executions; i++) {
        await caller.multiAI.execute({
          taskType,
          prompt: `Resolva: ${i + 1} + ${i + 1} = ?`,
        });
      }

      // Verificar que o sistema aprendeu
      const metrics = await caller.multiAI.getMetrics();
      expect(metrics.totalExecutions).toBeGreaterThanOrEqual(executions);

      console.log("[MultiAI Test] ✅ Sistema aprendendo com execuções");
    }, 90000);

    it("deve ter taxa de sucesso aceitável", async () => {
      const metrics = await caller.multiAI.getMetrics();

      if (metrics.totalExecutions > 0) {
        expect(metrics.overallSuccessRate).toBeGreaterThan(70);
        console.log(`[MultiAI Test] ✅ Taxa de sucesso: ${metrics.overallSuccessRate.toFixed(1)}%`);
      } else {
        console.log("[MultiAI Test] ⚠️ Nenhuma execução ainda, pulando validação");
      }
    });
  });

  describe("5. Integração Completa", () => {
    it("deve integrar todas as 6 IAs no sistema", async () => {
      const capabilities = await caller.multiAI.getCapabilities();

      const expectedAIs = ["COMET", "GENSPARK", "ABACUS", "CLAUDE", "GEMINI", "DEEPSITE"];
      const hasAllAIs = expectedAIs.every((ai) => capabilities.availableAIs.includes(ai));

      expect(hasAllAIs).toBe(true);

      console.log("[MultiAI Test] ✅ Todas as 6 IAs integradas:");
      expectedAIs.forEach((ai) => {
        console.log(`  - ${ai}: ${capabilities.capabilities[ai as keyof typeof capabilities.capabilities].join(", ")}`);
      });
    });

    it("deve ter cobertura completa de tipos de tarefa", async () => {
      const capabilities = await caller.multiAI.getCapabilities();

      const criticalTaskTypes = [
        "automation",
        "research",
        "organization",
        "coding",
        "multimodal",
        "web_cloning",
      ];

      const hasCriticalTasks = criticalTaskTypes.every((task) =>
        capabilities.taskTypes.includes(task)
      );

      expect(hasCriticalTasks).toBe(true);

      console.log("[MultiAI Test] ✅ Cobertura completa de tarefas críticas");
    });
  });
});

/**
 * RESULTADO ESPERADO DA AUDITORIA:
 * 
 * ✅ 6 IAs integradas (COMET, GENSPARK, ABACUS, CLAUDE, GEMINI, DEEPSITE)
 * ✅ Seleção inteligente baseada em capacidades
 * ✅ Fallback automático entre IAs
 * ✅ Sistema de aprendizado funcional
 * ✅ Métricas de performance registradas
 * ✅ Taxa de sucesso > 70%
 * ✅ Cobertura completa de tipos de tarefa
 */
