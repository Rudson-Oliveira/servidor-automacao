import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { validateCommand } from "./command-security";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "e2e-user",
    email: "e2e@example.com",
    name: "E2E Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
      get: (name: string) => undefined,
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Desktop Control - Integração End-to-End", () => {
  it("deve validar fluxo completo: listar agents → enviar comando → validar segurança", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 1. Listar agents
    const agents = await caller.desktopControl.listAgents();
    expect(agents).toBeDefined();
    expect(Array.isArray(agents)).toBe(true);

    // 2. Verificar estatísticas
    const stats = await caller.desktopControl.getStats();
    expect(stats).toBeDefined();
    expect(stats.agents).toHaveProperty("total");
    expect(stats.agents).toHaveProperty("online");
    expect(stats.commands).toHaveProperty("total");
    expect(stats.commands).toHaveProperty("successRate");

    // 3. Validar comando seguro
    const safeCommand = await validateCommand("ls -la", ctx.user.id, 1);
    expect(safeCommand.isAllowed).toBe(true);
    expect(safeCommand.requiresConfirmation).toBe(false);

    // 4. Validar comando perigoso
    const dangerousCommand = await validateCommand("rm -rf /", ctx.user.id, 1);
    expect(dangerousCommand.isAllowed).toBe(false);
    expect(dangerousCommand.severity).toBe("critical");

    // 5. Validar comando que requer confirmação
    const confirmCommand = await validateCommand("rm -r /tmp/test", ctx.user.id, 1);
    expect(confirmCommand.isAllowed).toBe(true);
    expect(confirmCommand.requiresConfirmation).toBe(true);
  });

  it("deve validar fluxo de screenshots", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Listar screenshots
    const screenshots = await caller.desktopControl.listScreenshots({ limit: 10 });
    expect(screenshots).toBeDefined();
    expect(Array.isArray(screenshots)).toBe(true);

    // Verificar estatísticas de screenshots
    const stats = await caller.desktopControl.getStats();
    expect(stats.screenshots).toHaveProperty("total");
    expect(typeof stats.screenshots.total).toBe("number");
  });

  it("deve validar fluxo de logs com filtros", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Listar todos os logs
    const allLogs = await caller.desktopControl.listLogs({ limit: 50 });
    expect(allLogs).toBeDefined();
    expect(Array.isArray(allLogs)).toBe(true);

    // Listar apenas logs de erro
    const errorLogs = await caller.desktopControl.listLogs({
      level: "error",
      limit: 50,
    });
    expect(errorLogs).toBeDefined();
    errorLogs.forEach((log) => {
      expect(log.level).toBe("error");
    });
  });

  it("deve validar fluxo de auditoria de segurança", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Listar auditoria completa
    const audit = await caller.desktopControl.listAudit({ limit: 50 });
    expect(audit).toBeDefined();
    expect(Array.isArray(audit)).toBe(true);

    // Listar apenas comandos bloqueados
    const blockedAudit = await caller.desktopControl.listAudit({
      action: "blocked",
      limit: 50,
    });
    expect(blockedAudit).toBeDefined();
    blockedAudit.forEach((entry) => {
      expect(entry.action).toBe("blocked");
    });
  });

  it("deve validar whitelist e blacklist", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Listar whitelist
    const whitelist = await caller.desktopControl.listWhitelist();
    expect(whitelist).toBeDefined();
    expect(Array.isArray(whitelist)).toBe(true);

    // Listar blacklist
    const blacklist = await caller.desktopControl.listBlacklist();
    expect(blacklist).toBeDefined();
    expect(Array.isArray(blacklist)).toBe(true);
  });

  it("deve validar cálculo de taxa de sucesso", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.desktopControl.getStats();

    // Taxa de sucesso deve estar entre 0 e 100
    expect(stats.commands.successRate).toBeGreaterThanOrEqual(0);
    expect(stats.commands.successRate).toBeLessThanOrEqual(100);

    // Se há comandos executados, taxa de sucesso deve ser calculada corretamente
    const totalExecuted = stats.commands.completed + stats.commands.failed;
    if (totalExecuted > 0) {
      const expectedRate = (stats.commands.completed / totalExecuted) * 100;
      expect(Math.abs(stats.commands.successRate - expectedRate)).toBeLessThan(0.01);
    }
  });

  it("deve validar status online/offline dos agents", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const agents = await caller.desktopControl.listAgents();

    agents.forEach((agent) => {
      // Cada agent deve ter propriedades de status
      expect(agent).toHaveProperty("isOnline");
      expect(agent).toHaveProperty("timeSinceLastPing");
      expect(typeof agent.isOnline).toBe("boolean");
      expect(typeof agent.timeSinceLastPing).toBe("number");

      // timeSinceLastPing deve ser não-negativo
      expect(agent.timeSinceLastPing).toBeGreaterThanOrEqual(0);
    });
  });
});
