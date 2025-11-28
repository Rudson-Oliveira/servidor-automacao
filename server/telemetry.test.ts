import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { 
  telemetryMetrics, 
  telemetryAnomalies, 
  telemetryPredictions, 
  telemetryLearnings 
} from "../drizzle/schema-telemetry";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Telemetry Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const { ctx } = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("getMetrics", () => {
    it("deve retornar métricas do sistema", async () => {
      const result = await caller.telemetry.getMetrics({ limit: 10 });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it("deve respeitar o limite especificado", async () => {
      const result = await caller.telemetry.getMetrics({ limit: 5 });
      
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getAnomalies", () => {
    it("deve retornar anomalias detectadas", async () => {
      const result = await caller.telemetry.getAnomalies({ limit: 10 });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it("deve filtrar anomalias resolvidas quando especificado", async () => {
      const result = await caller.telemetry.getAnomalies({ 
        limit: 10, 
        resolved: false 
      });
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getPredictions", () => {
    it("deve retornar predições de falhas", async () => {
      const result = await caller.telemetry.getPredictions({ limit: 10 });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe("getPatterns", () => {
    it("deve retornar padrões aprendidos", async () => {
      const result = await caller.telemetry.getPatterns({ limit: 10 });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe("getStats", () => {
    it("deve retornar estatísticas gerais", async () => {
      const result = await caller.telemetry.getStats();
      
      expect(result).toHaveProperty("totalMetrics");
      expect(result).toHaveProperty("totalAnomalies");
      expect(result).toHaveProperty("totalPredictions");
      expect(result).toHaveProperty("totalPatterns");
      
      expect(typeof result.totalMetrics).toBe("number");
      expect(typeof result.totalAnomalies).toBe("number");
      expect(typeof result.totalPredictions).toBe("number");
      expect(typeof result.totalPatterns).toBe("number");
    });
  });

  describe("exportKnowledge", () => {
    it("deve exportar conhecimento do sistema", async () => {
      const result = await caller.telemetry.exportKnowledge();
      
      expect(result).toHaveProperty("version");
      expect(result).toHaveProperty("exportedAt");
      expect(result).toHaveProperty("metrics");
      expect(result).toHaveProperty("anomalies");
      expect(result).toHaveProperty("predictions");
      expect(result).toHaveProperty("patterns");
      
      expect(result.version).toBe("1.0");
      expect(Array.isArray(result.metrics)).toBe(true);
      expect(Array.isArray(result.anomalies)).toBe(true);
      expect(Array.isArray(result.predictions)).toBe(true);
      expect(Array.isArray(result.patterns)).toBe(true);
    });
  });
});

describe("Predictive Healing Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const { ctx } = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("simulateFailure", () => {
    it("deve criar uma predição simulada", async () => {
      const result = await caller.predictiveHealing.simulateFailure({
        type: "memory_leak",
        severity: "high",
        probability: 85,
      });
      
      expect(result.success).toBe(true);
      expect(result).toHaveProperty("predictionId");
      expect(result).toHaveProperty("message");
      expect(result.message).toContain("memory_leak");
    });

    it("deve aceitar diferentes tipos de falha", async () => {
      const types = ["memory_leak", "high_cpu", "disk_full", "database_slow", "api_timeout"] as const;
      
      for (const type of types) {
        const result = await caller.predictiveHealing.simulateFailure({
          type,
          severity: "medium",
          probability: 70,
        });
        
        expect(result.success).toBe(true);
        expect(result.message).toContain(type);
      }
    });
  });

  describe("getHealingHistory", () => {
    it("deve retornar histórico de ações de healing", async () => {
      const result = await caller.predictiveHealing.getHealingHistory({ limit: 10 });
      
      expect(result).toHaveProperty("preventive");
      expect(result).toHaveProperty("reactive");
      expect(result).toHaveProperty("stats");
      
      expect(Array.isArray(result.preventive)).toBe(true);
      expect(Array.isArray(result.reactive)).toBe(true);
      expect(typeof result.stats.totalPreventive).toBe("number");
      expect(typeof result.stats.totalReactive).toBe("number");
      expect(typeof result.stats.preventiveRate).toBe("number");
    });
  });

  describe("getEffectivenessStats", () => {
    it("deve retornar estatísticas de eficácia", async () => {
      const result = await caller.predictiveHealing.getEffectivenessStats();
      
      expect(result).toHaveProperty("prevented");
      expect(result).toHaveProperty("occurred");
      expect(result).toHaveProperty("falsePositives");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("accuracy");
      expect(result).toHaveProperty("preventionRate");
      
      expect(typeof result.prevented).toBe("number");
      expect(typeof result.occurred).toBe("number");
      expect(typeof result.falsePositives).toBe("number");
    });
  });
});

describe("Knowledge Sync Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const { ctx } = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("export", () => {
    it("deve exportar conhecimento da instância", async () => {
      const result = await caller.knowledgeSync.export({
        instanceId: "test-instance",
        includeMetrics: false,
        minConfidence: 70,
        daysBack: 30,
      });
      
      expect(result).toHaveProperty("version");
      expect(result).toHaveProperty("instanceId");
      expect(result).toHaveProperty("exportedAt");
      expect(result).toHaveProperty("learnings");
      expect(result).toHaveProperty("patterns");
      expect(result).toHaveProperty("improvements");
      expect(result).toHaveProperty("metadata");
      
      expect(result.version).toBe("1.0");
      expect(result.instanceId).toBe("test-instance");
      expect(Array.isArray(result.learnings)).toBe(true);
      expect(Array.isArray(result.patterns)).toBe(true);
      expect(Array.isArray(result.improvements)).toBe(true);
    });
  });

  describe("validatePackage", () => {
    it("deve validar um pacote de conhecimento válido", async () => {
      const validPackage = {
        version: "1.0",
        instanceId: "test",
        exportedAt: new Date().toISOString(),
        learnings: [
          {
            category: "performance",
            pattern: "test_pattern",
            description: "Test learning",
            confidence: "80",
            occurrences: 5,
            impact: "positive",
            recommendation: "Test recommendation",
          },
        ],
        patterns: [],
        improvements: [],
        metadata: {
          totalLearnings: 1,
          totalPatterns: 0,
          avgConfidence: 80,
          timeRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString(),
          },
        },
      };
      
      const result = await caller.knowledgeSync.validatePackage({
        knowledgePackage: validPackage,
      });
      
      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("validations");
      expect(result.validations.versionValid).toBe(true);
      expect(result.validations.hasLearnings).toBe(true);
      expect(result.validations.confidenceAcceptable).toBe(true);
    });

    it("deve rejeitar pacote com versão inválida", async () => {
      const invalidPackage = {
        version: "2.0",
        instanceId: "test",
        exportedAt: new Date().toISOString(),
        learnings: [],
        patterns: [],
        improvements: [],
        metadata: {
          totalLearnings: 0,
          totalPatterns: 0,
          avgConfidence: 0,
          timeRange: {
            start: new Date().toISOString(),
            end: new Date().toISOString(),
          },
        },
      };
      
      const result = await caller.knowledgeSync.validatePackage({
        knowledgePackage: invalidPackage,
      });
      
      expect(result.valid).toBe(false);
      expect(result.validations.versionValid).toBe(false);
    });
  });

  describe("getSyncHistory", () => {
    it("deve retornar histórico de sincronizações", async () => {
      const result = await caller.knowledgeSync.getSyncHistory({ limit: 10 });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });
});
