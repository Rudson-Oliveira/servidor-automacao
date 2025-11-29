import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Testes do Sistema de Alertas Proativos
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

describe("Sistema de Alertas", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx = createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  it("deve buscar ou criar configuração de alertas", async () => {
    const config = await caller.alerts.getConfig();

    expect(config).toBeDefined();
    expect(config?.userId).toBe(1);
    expect(config?.emailEnabled).toBeDefined();
    expect(config?.minSeverity).toBeDefined();
  });

  it("deve atualizar configuração de alertas", async () => {
    const result = await caller.alerts.updateConfig({
      emailEnabled: true,
      minSeverity: "high",
      throttleMinutes: 30,
    });

    expect(result.success).toBe(true);
  });

  it("deve listar templates de alertas", async () => {
    const templates = await caller.alerts.templates.list();

    expect(Array.isArray(templates)).toBe(true);
  });

  it("deve enviar alerta de teste", async () => {
    const result = await caller.alerts.test({});

    expect(result).toBeDefined();
    // Pode falhar se SMTP não estiver configurado, mas não deve dar erro
  });

  it("deve buscar histórico de alertas", async () => {
    const history = await caller.alerts.getHistory({ limit: 10 });

    expect(Array.isArray(history)).toBe(true);
  });
});

describe("Configuração de Alertas", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx = createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  it("deve validar severidade mínima", async () => {
    const result = await caller.alerts.updateConfig({
      minSeverity: "critical",
    });

    expect(result.success).toBe(true);

    const config = await caller.alerts.getConfig();
    expect(config?.minSeverity).toBe("critical");
  });

  it("deve validar throttling", async () => {
    const result = await caller.alerts.updateConfig({
      throttleMinutes: 60,
    });

    expect(result.success).toBe(true);

    const config = await caller.alerts.getConfig();
    expect(config?.throttleMinutes).toBe(60);
  });

  it("deve configurar horários permitidos", async () => {
    const result = await caller.alerts.updateConfig({
      allowedHours: {
        start: "09:00",
        end: "18:00",
      },
    });

    expect(result.success).toBe(true);

    const config = await caller.alerts.getConfig();
    expect(config?.allowedHours).toEqual({
      start: "09:00",
      end: "18:00",
    });
  });

  it("deve configurar dias permitidos", async () => {
    const result = await caller.alerts.updateConfig({
      allowedDays: [1, 2, 3, 4, 5], // Segunda a sexta
    });

    expect(result.success).toBe(true);

    const config = await caller.alerts.getConfig();
    expect(config?.allowedDays).toEqual([1, 2, 3, 4, 5]);
  });
});
