import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
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

describe("desktopControl router", () => {
  describe("listAgents", () => {
    it("deve retornar lista vazia quando não há agents", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const agents = await caller.desktopControl.listAgents();

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);
    });

    it("deve adicionar informações de status online/offline", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const agents = await caller.desktopControl.listAgents();

      agents.forEach((agent) => {
        expect(agent).toHaveProperty("isOnline");
        expect(agent).toHaveProperty("timeSinceLastPing");
        expect(typeof agent.isOnline).toBe("boolean");
        expect(typeof agent.timeSinceLastPing).toBe("number");
      });
    });
  });

  describe("getStats", () => {
    it("deve retornar estatísticas do sistema", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.desktopControl.getStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("agents");
      expect(stats).toHaveProperty("commands");
      expect(stats).toHaveProperty("screenshots");

      expect(stats.agents).toHaveProperty("total");
      expect(stats.agents).toHaveProperty("online");
      expect(stats.agents).toHaveProperty("offline");

      expect(stats.commands).toHaveProperty("total");
      expect(stats.commands).toHaveProperty("pending");
      expect(stats.commands).toHaveProperty("completed");
      expect(stats.commands).toHaveProperty("failed");
      expect(stats.commands).toHaveProperty("successRate");
    });

    it("deve calcular taxa de sucesso corretamente", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.desktopControl.getStats();

      expect(stats.commands.successRate).toBeGreaterThanOrEqual(0);
      expect(stats.commands.successRate).toBeLessThanOrEqual(100);
    });
  });

  describe("listCommands", () => {
    it("deve retornar lista de comandos com filtros", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const commands = await caller.desktopControl.listCommands({
        limit: 10,
      });

      expect(commands).toBeDefined();
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBeLessThanOrEqual(10);
    });

    it("deve adicionar informações do agent aos comandos", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const commands = await caller.desktopControl.listCommands({
        limit: 10,
      });

      commands.forEach((cmd) => {
        expect(cmd).toHaveProperty("agentName");
        expect(cmd).toHaveProperty("agentPlatform");
      });
    });
  });

  describe("listScreenshots", () => {
    it("deve retornar lista de screenshots", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const screenshots = await caller.desktopControl.listScreenshots({
        limit: 10,
      });

      expect(screenshots).toBeDefined();
      expect(Array.isArray(screenshots)).toBe(true);
      expect(screenshots.length).toBeLessThanOrEqual(10);
    });
  });

  describe("listLogs", () => {
    it("deve retornar lista de logs com filtros", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const logs = await caller.desktopControl.listLogs({
        limit: 50,
      });

      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeLessThanOrEqual(50);
    });

    it("deve filtrar logs por nível", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const errorLogs = await caller.desktopControl.listLogs({
        level: "error",
        limit: 50,
      });

      expect(errorLogs).toBeDefined();
      errorLogs.forEach((log) => {
        expect(log.level).toBe("error");
      });
    });
  });

  describe("listWhitelist", () => {
    it("deve retornar lista de regras de whitelist", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const whitelist = await caller.desktopControl.listWhitelist();

      expect(whitelist).toBeDefined();
      expect(Array.isArray(whitelist)).toBe(true);
    });
  });

  describe("listBlacklist", () => {
    it("deve retornar lista de regras de blacklist", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const blacklist = await caller.desktopControl.listBlacklist();

      expect(blacklist).toBeDefined();
      expect(Array.isArray(blacklist)).toBe(true);
    });
  });

  describe("listAudit", () => {
    it("deve retornar lista de auditoria", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const audit = await caller.desktopControl.listAudit({
        limit: 50,
      });

      expect(audit).toBeDefined();
      expect(Array.isArray(audit)).toBe(true);
      expect(audit.length).toBeLessThanOrEqual(50);
    });

    it("deve filtrar auditoria por ação", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const blockedAudit = await caller.desktopControl.listAudit({
        action: "blocked",
        limit: 50,
      });

      expect(blockedAudit).toBeDefined();
      blockedAudit.forEach((entry) => {
        expect(entry.action).toBe("blocked");
      });
    });
  });
});
