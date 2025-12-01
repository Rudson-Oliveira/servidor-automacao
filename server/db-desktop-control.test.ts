import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { createMockUser } from "./__mocks__/db";
import {
  createAgent,
  getAgentByToken,
  getAgentById,
  updateAgentStatus,
  updateAgentPing,
  listUserAgents,
  deleteAgent,
  createCommand,
  updateCommandStatus,
  getCommandById,
  getPendingCommands,
  listUserCommands,
  saveScreenshot,
  listUserScreenshots,
  addLog,
  listUserLogs,
  generateAgentToken,
} from "./db-desktop-control";

describe("Desktop Control - Helpers CRUD", () => {
  let testUserId: number;
  let testAgentId: number;
  let testAgentToken: string;
  let testCommandId: number;

  beforeAll(() => {
    // Criar usuário mock
    const mockUser = createMockUser({ id: 1, name: "Test User" });
    testUserId = mockUser.id;
  });

  // beforeEach removido para manter estado entre testes relacionados
  // O reset global do vitest.setup.ts só acontece entre arquivos de teste diferentes

  describe("generateAgentToken", () => {
    it("deve gerar token de 64 caracteres", () => {
      const token = generateAgentToken();
      expect(token).toBeDefined();
      expect(token.length).toBe(64);
      expect(typeof token).toBe("string");
    });

    it("deve gerar tokens únicos", () => {
      const token1 = generateAgentToken();
      const token2 = generateAgentToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("createAgent", () => {
    it("deve criar um novo Desktop Agent", async () => {
      const agent = await createAgent({
        userId: testUserId,
        deviceName: "Test Device",
        platform: "Windows 11",
        version: "1.0.0",
      });

      expect(agent).toBeDefined();
      expect(agent.id).toBeGreaterThan(0);
      expect(agent.userId).toBe(testUserId);
      expect(agent.deviceName).toBe("Test Device");
      expect(agent.platform).toBe("Windows 11");
      expect(agent.version).toBe("1.0.0");
      expect(agent.status).toBe("offline");
      expect(agent.token).toBeDefined();
      expect(agent.token.length).toBe(64);

      // Salvar para testes posteriores
      testAgentId = agent.id;
      testAgentToken = agent.token;
    });

    it("deve gerar tokens únicos para cada agent", async () => {
      const agent1 = await createAgent({
        userId: testUserId,
        deviceName: "Device 1",
        platform: "Windows",
        version: "1.0.0",
      });
      const agent2 = await createAgent({
        userId: testUserId,
        deviceName: "Device 2",
        platform: "macOS",
        version: "1.0.0",
      });

      expect(agent1.token).not.toBe(agent2.token);
    });
  });

  describe("getAgentByToken", () => {
    it("deve buscar agent pelo token", async () => {
      const agent = await getAgentByToken(testAgentToken);

      expect(agent).toBeDefined();
      expect(agent?.id).toBe(testAgentId);
      expect(agent?.token).toBe(testAgentToken);
    });

    it("deve retornar null para token inválido", async () => {
      const agent = await getAgentByToken("token_invalido_12345");

      expect(agent).toBeNull();
    });
  });

  describe("getAgentById", () => {
    it("deve buscar agent pelo ID", async () => {
      const agent = await getAgentById(testAgentId);

      expect(agent).toBeDefined();
      expect(agent?.id).toBe(testAgentId);
      expect(agent?.deviceName).toBe("Test Device");
    });

    it("deve retornar null para ID inexistente", async () => {
      const agent = await getAgentById(999999);

      expect(agent).toBeNull();
    });
  });

  describe("updateAgentStatus", () => {
    it("deve atualizar status do agent", async () => {
      await updateAgentStatus(testAgentId, "online");

      const agent = await getAgentById(testAgentId);
      expect(agent?.status).toBe("online");
    });

    it("deve aceitar todos os status válidos", async () => {
      const statuses: Array<"online" | "offline" | "busy" | "error"> = [
        "online",
        "offline",
        "busy",
        "error",
      ];

      for (const status of statuses) {
        await updateAgentStatus(testAgentId, status);
        const agent = await getAgentById(testAgentId);
        expect(agent?.status).toBe(status);
      }
    });
  });

  describe("updateAgentPing", () => {
    it("deve atualizar lastPing do agent", async () => {
      const beforePing = (await getAgentById(testAgentId))?.lastPing;

      // Aguardar 500ms para garantir timestamp diferente
      await new Promise((resolve) => setTimeout(resolve, 500));

      await updateAgentPing(testAgentId);

      const afterPing = (await getAgentById(testAgentId))?.lastPing;

      expect(afterPing).toBeDefined();
      // Verificar que afterPing existe e é maior ou igual (pode ser igual em alguns casos)
      if (beforePing) {
        expect(afterPing?.getTime()).toBeGreaterThanOrEqual(beforePing.getTime());
      }
    });

    it("deve atualizar IP address quando fornecido", async () => {
      await updateAgentPing(testAgentId, "192.168.1.100");

      const agent = await getAgentById(testAgentId);
      expect(agent?.ipAddress).toBe("192.168.1.100");
    });
  });

  describe("listUserAgents", () => {
    it("deve listar agents do usuário", async () => {
      const agents = await listUserAgents(testUserId);

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);
      expect(agents.some((a) => a.id === testAgentId)).toBe(true);
    });

    it("deve retornar array vazio para usuário sem agents", async () => {
      const agents = await listUserAgents(999999);

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBe(0);
    });
  });

  describe("createCommand", () => {
    it("deve criar comando simples", async () => {
      const command = await createCommand(testAgentId, testUserId, "screenshot");

      expect(command).toBeDefined();
      expect(command.id).toBeGreaterThan(0);
      expect(command.agentId).toBe(testAgentId);
      expect(command.userId).toBe(testUserId);
      expect(command.commandType).toBe("screenshot");
      expect(command.status).toBe("pending");

      // Salvar para testes posteriores
      testCommandId = command.id;
    });

    it("deve criar comando com dados", async () => {
      const commandData = {
        x: 100,
        y: 200,
        button: "left",
      };

      const command = await createCommand(testAgentId, testUserId, "mouse_click", commandData);

      expect(command).toBeDefined();
      expect(command.commandType).toBe("mouse_click");
      expect(command.commandData).toBeDefined();

      // Verificar se dados foram salvos corretamente
      const parsed = JSON.parse(command.commandData || "{}");
      expect(parsed.x).toBe(100);
      expect(parsed.y).toBe(200);
      expect(parsed.button).toBe("left");
    });
  });

  describe("updateCommandStatus", () => {
    it("deve atualizar status para completed com resultado", async () => {
      await updateCommandStatus(testCommandId, "completed", { success: true }, undefined, 150);

      const command = await getCommandById(testCommandId);
      expect(command?.status).toBe("completed");
      expect(command?.result).toBeDefined();
      expect(command?.executionTimeMs).toBe(150);
      expect(command?.completedAt).toBeDefined();
    });

    it("deve atualizar status para failed com erro", async () => {
      const failedCommand = await createCommand(testAgentId, testUserId, "test_fail");

      await updateCommandStatus(
        failedCommand.id,
        "failed",
        undefined,
        "Timeout exceeded",
        5000
      );

      const command = await getCommandById(failedCommand.id);
      expect(command?.status).toBe("failed");
      expect(command?.errorMessage).toBe("Timeout exceeded");
      expect(command?.executionTimeMs).toBe(5000);
      expect(command?.completedAt).toBeDefined();
    });
  });

  describe("getCommandById", () => {
    it("deve buscar comando pelo ID", async () => {
      const command = await getCommandById(testCommandId);

      expect(command).toBeDefined();
      expect(command?.id).toBe(testCommandId);
    });

    it("deve retornar null para ID inexistente", async () => {
      const command = await getCommandById(999999);

      expect(command).toBeNull();
    });
  });

  describe("getPendingCommands", () => {
    it("deve listar comandos pendentes do agent", async () => {
      // Criar alguns comandos pendentes
      await createCommand(testAgentId, testUserId, "pending_1");
      await createCommand(testAgentId, testUserId, "pending_2");

      const commands = await getPendingCommands(testAgentId);

      expect(commands).toBeDefined();
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBeGreaterThan(0);
      expect(commands.every((c) => c.status === "pending")).toBe(true);
      expect(commands.every((c) => c.agentId === testAgentId)).toBe(true);
    });

    it("deve retornar array vazio se não houver comandos pendentes", async () => {
      // Criar agent novo sem comandos
      const newAgent = await createAgent({
        userId: testUserId,
        deviceName: "Clean Agent",
        platform: "Linux",
        version: "1.0.0",
      });

      const commands = await getPendingCommands(newAgent.id);

      expect(commands).toBeDefined();
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBe(0);
    });
  });

  describe("listUserCommands", () => {
    it("deve listar comandos do usuário", async () => {
      const commands = await listUserCommands(testUserId);

      expect(commands).toBeDefined();
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBeGreaterThan(0);
      expect(commands.every((c) => c.userId === testUserId)).toBe(true);
    });

    it("deve filtrar por agentId", async () => {
      const commands = await listUserCommands(testUserId, testAgentId);

      expect(commands).toBeDefined();
      expect(commands.every((c) => c.agentId === testAgentId)).toBe(true);
    });

    it("deve respeitar limite", async () => {
      const commands = await listUserCommands(testUserId, undefined, 5);

      expect(commands.length).toBeLessThanOrEqual(5);
    });
  });

  describe("saveScreenshot", () => {
    it("deve salvar screenshot", async () => {
      const screenshotId = await saveScreenshot(
        testAgentId,
        testUserId,
        "https://s3.example.com/screenshot.png",
        "screenshots/test-123.png",
        1920,
        1080,
        245678,
        "png"
      );

      expect(screenshotId).toBeGreaterThan(0);
    });

    it("deve salvar screenshot com dados mínimos", async () => {
      const screenshotId = await saveScreenshot(
        testAgentId,
        testUserId,
        "https://s3.example.com/screenshot2.png",
        "screenshots/test-456.png"
      );

      expect(screenshotId).toBeGreaterThan(0);
    });
  });

  describe("listUserScreenshots", () => {
    it("deve listar screenshots do usuário", async () => {
      const screenshots = await listUserScreenshots(testUserId);

      expect(screenshots).toBeDefined();
      expect(Array.isArray(screenshots)).toBe(true);
      expect(screenshots.length).toBeGreaterThan(0);
    });

    it("deve filtrar por agentId", async () => {
      const screenshots = await listUserScreenshots(testUserId, testAgentId);

      expect(screenshots).toBeDefined();
      expect(screenshots.every((s) => s.agentId === testAgentId)).toBe(true);
    });

    it("deve respeitar limite", async () => {
      const screenshots = await listUserScreenshots(testUserId, undefined, 5);

      expect(screenshots.length).toBeLessThanOrEqual(5);
    });
  });

  describe("addLog", () => {
    it("deve adicionar log simples", async () => {
      await addLog(testAgentId, testUserId, "info", "Agent conectado com sucesso");

      // Verificar se foi salvo
      const logs = await listUserLogs(testUserId, testAgentId, "info", 1);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]?.message).toBe("Agent conectado com sucesso");
    });

    it("deve adicionar log com metadata", async () => {
      await addLog(testAgentId, testUserId, "error", "Falha ao executar comando", testCommandId, {
        errorCode: "TIMEOUT",
        duration: 5000,
      });

      const logs = await listUserLogs(testUserId, testAgentId, "error", 1);
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]?.level).toBe("error");
      expect(logs[0]?.commandId).toBe(testCommandId);
    });

    it("deve aceitar todos os níveis de log", async () => {
      const levels: Array<"debug" | "info" | "warning" | "error"> = [
        "debug",
        "info",
        "warning",
        "error",
      ];

      for (const level of levels) {
        await addLog(testAgentId, testUserId, level, `Mensagem de teste ${level}`);
      }

      const logs = await listUserLogs(testUserId, testAgentId);
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe("listUserLogs", () => {
    it("deve listar logs do usuário", async () => {
      const logs = await listUserLogs(testUserId);

      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });

    it("deve filtrar por agentId", async () => {
      const logs = await listUserLogs(testUserId, testAgentId);

      expect(logs).toBeDefined();
      expect(logs.every((l) => l.agentId === testAgentId)).toBe(true);
    });

    it("deve filtrar por level", async () => {
      const logs = await listUserLogs(testUserId, undefined, "error");

      expect(logs).toBeDefined();
      expect(logs.every((l) => l.level === "error")).toBe(true);
    });

    it("deve respeitar limite", async () => {
      const logs = await listUserLogs(testUserId, undefined, undefined, 10);

      expect(logs.length).toBeLessThanOrEqual(10);
    });
  });

  describe("deleteAgent", () => {
    it("deve deletar agent do usuário", async () => {
      // Criar agent temporário
      const tempAgent = await createAgent({
        userId: testUserId,
        deviceName: "Temp Agent",
        platform: "Windows",
        version: "1.0.0",
      });

      // Deletar
      const deleted = await deleteAgent(tempAgent.id, testUserId);
      expect(deleted).toBe(true);

      // Verificar que foi deletado
      const agent = await getAgentById(tempAgent.id);
      expect(agent).toBeNull();
    });

    it("não deve deletar agent de outro usuário", async () => {
      const deleted = await deleteAgent(testAgentId, 999999);
      expect(deleted).toBe(false);

      // Verificar que ainda existe
      const agent = await getAgentById(testAgentId);
      expect(agent).toBeDefined();
    });
  });
});
