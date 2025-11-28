import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Testes do Sistema de Machine Learning Preditivo
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Machine Learning Preditivo", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx = createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  it("deve listar métricas disponíveis para treinamento", async () => {
    const metrics = await caller.ml.getAvailableMetrics();

    expect(Array.isArray(metrics)).toBe(true);
  });

  it("deve buscar dashboard de ML", async () => {
    const dashboard = await caller.ml.getDashboard();

    expect(dashboard).toBeDefined();
    expect(dashboard.totalPredictions).toBeDefined();
    expect(dashboard.anomaliesDetected).toBeDefined();
    expect(dashboard.accuracy).toBeDefined();
  });

  it("deve buscar predições recentes", async () => {
    const predictions = await caller.ml.getPredictions({
      limit: 10,
      hoursAgo: 24,
    });

    expect(Array.isArray(predictions)).toBe(true);
  });

  // Teste de treinamento (pode demorar, então skip por padrão)
  it.skip("deve treinar modelo com dados históricos", async () => {
    // Requer dados suficientes no banco
    const result = await caller.ml.train({
      metricName: "cpu_usage",
      component: "system",
    });

    expect(result.success).toBe(true);
    expect(result.metrics).toBeDefined();
    expect(result.metrics.accuracy).toBeGreaterThan(0);
  }, 60000); // 60s timeout

  // Teste de predição (requer modelo treinado)
  it.skip("deve fazer predição", async () => {
    const result = await caller.ml.predict({
      metricName: "cpu_usage",
      component: "system",
    });

    expect(result.success).toBe(true);
    expect(Array.isArray(result.predictions)).toBe(true);
  });

  it("deve calcular acurácia do modelo", async () => {
    const accuracy = await caller.ml.getAccuracy({
      metricName: "cpu_usage",
      component: "system",
      hoursAgo: 24,
    });

    expect(accuracy).toBeDefined();
    expect(accuracy.total).toBeGreaterThanOrEqual(0);
    expect(accuracy.accuracy).toBeGreaterThanOrEqual(0);
  });
});

describe("Retreinamento Automático", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx = createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  it("deve verificar necessidade de retreinamento", async () => {
    const result = await caller.ml.autoRetrain({
      metricName: "cpu_usage",
      component: "system",
    });

    expect(result.success).toBe(true);
    expect(result.retrained).toBeDefined();
    expect(result.message).toBeDefined();
  });
});
