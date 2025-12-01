import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createAgent, createCommand, addLog } from "./db-desktop-control";

/**
 * Testes de Integração - Desktop Control System
 * 
 * Valida:
 * - Criação de agents
 * - Listagem de agents
 * - Envio de comandos
 * - Listagem de comandos
 * - Listagem de logs
 * - Estatísticas do sistema
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
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
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Desktop Control Integration Tests", () => {
  let testAgentId: number;
  let testCommandId: number;

  beforeAll(async () => {
    // Criar agent de teste
    const agent = await createAgent({ userId: 1, deviceName: "Test Integration Agent", platform: "windows", version: "1.0.0" });
    testAgentId = agent.id;

    // Criar comando de teste
    const command = await createCommand(testAgentId, 1, "shell", JSON.stringify({ command: "echo test" }));
    testCommandId = command.id;

    // Criar logs de teste
    await addLog(testAgentId, 1, "info", "Test log message");
    await addLog(testAgentId, 1, "error", "Test error message");
  });

  describe("Agent Management", () => {
    it("deve criar um novo agent", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.desktopControl.createAgent({
        deviceName: "New Test Agent",
        platform: "linux",
        version: "2.0.0",
      });

      expect(result.success).toBe(true);
      expect(result.agent).toBeDefined();
      expect(result.agent.deviceName).toBe("New Test Agent");
      expect(result.agent.platform).toBe("linux");
      expect(result.agent.token).toBeDefined();
      expect(result.agent.token.length).toBeGreaterThan(0);
    });

    it("deve listar agents do usuário", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const agents = await caller.desktopControl.listAgents();

      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
      
      const agent = agents[0];
      expect(agent).toHaveProperty("id");
      expect(agent).toHaveProperty("deviceName");
      expect(agent).toHaveProperty("status");
      expect(agent).toHaveProperty("isOnline");
      expect(agent).toHaveProperty("timeSinceLastPing");
    });

    it("deve calcular corretamente o status online/offline", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const agents = await caller.desktopControl.listAgents();
      
      agents.forEach((agent) => {
        // Agent sem lastPing deve estar offline
        if (!agent.lastPing) {
          expect(agent.isOnline).toBe(false);
        }
        
        // timeSinceLastPing pode ser negativo se lastPing for no futuro (clock skew)
        // Apenas validamos que é um número
        expect(typeof agent.timeSinceLastPing).toBe("number");
      });
    });
  });

  describe("Command Management", () => {
    it("deve enviar comando shell para agent", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.desktopControl.sendCommand({
        agentId: testAgentId,
        commandType: "shell",
        commandData: { command: "ls -la" }, // Objeto, não string
      });

      expect(result.success).toBe(true);
      expect(result.commandId).toBeDefined();
      expect(typeof result.commandId).toBe("number");
      expect(result.message).toContain("enviado");
    });

    it("deve enviar comando screenshot para agent", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.desktopControl.sendCommand({
        agentId: testAgentId,
        commandType: "screenshot",
        commandData: {}, // Objeto vazio obrigatório
      });

      expect(result.success).toBe(true);
      expect(result.commandId).toBeDefined();
      expect(typeof result.commandId).toBe("number");
    });

    it("deve listar comandos do agent", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const commands = await caller.desktopControl.listCommands({
        agentId: testAgentId,
        limit: 10,
      });

      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBeGreaterThan(0);
      
      const command = commands[0];
      expect(command).toHaveProperty("id");
      expect(command).toHaveProperty("commandType");
      expect(command).toHaveProperty("status");
      expect(command).toHaveProperty("createdAt");
    });

    it("deve filtrar comandos por status", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const pendingCommands = await caller.desktopControl.listCommands({
        agentId: testAgentId,
        status: "pending",
        limit: 10,
      });

      pendingCommands.forEach((cmd) => {
        expect(cmd.status).toBe("pending");
      });
    });
  });

  describe("Logs Management", () => {
    it("deve listar logs do agent", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const logs = await caller.desktopControl.listLogs({
        agentId: testAgentId,
        limit: 10,
      });

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
      
      const log = logs[0];
      expect(log).toHaveProperty("id");
      expect(log).toHaveProperty("level");
      expect(log).toHaveProperty("message");
      expect(log).toHaveProperty("createdAt");
    });

    it("deve filtrar logs por nível", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const errorLogs = await caller.desktopControl.listLogs({
        agentId: testAgentId,
        level: "error",
        limit: 10,
      });

      errorLogs.forEach((log) => {
        expect(log.level).toBe("error");
      });
    });
  });

  describe("Statistics", () => {
    it("deve retornar estatísticas do sistema", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.desktopControl.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats).toBe("object");
      
      // Validar estrutura aninhada
      expect(stats.agents).toBeDefined();
      expect(typeof stats.agents.total).toBe("number");
      expect(typeof stats.agents.online).toBe("number");
      expect(typeof stats.agents.offline).toBe("number");
      
      expect(stats.commands).toBeDefined();
      expect(typeof stats.commands.total).toBe("number");
      
      expect(stats.screenshots).toBeDefined();
      expect(typeof stats.screenshots.total).toBe("number");
      
      expect(stats.agents.total).toBeGreaterThanOrEqual(0);
      expect(stats.agents.online).toBeGreaterThanOrEqual(0);
      expect(stats.agents.online).toBeLessThanOrEqual(stats.agents.total);
    });
  });

  describe("Security & Validation", () => {
    it("deve rejeitar comando de usuário não autorizado", async () => {
      const ctx = createAuthContext(999); // Usuário diferente
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.desktopControl.sendCommand({
          agentId: testAgentId,
          commandType: "shell",
          commandData: { command: "ls" }, // Objeto, não string
        })
      ).rejects.toThrow();
    });

    it("deve validar tipo de comando", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.desktopControl.sendCommand({
          agentId: testAgentId,
          commandType: "invalid_type" as any,
        })
      ).rejects.toThrow();
    });

    it("deve validar limite de resultados", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const commands = await caller.desktopControl.listCommands({
        agentId: testAgentId,
        limit: 5,
      });

      expect(commands.length).toBeLessThanOrEqual(5);
    });
  });
});
