import { describe, expect, it, beforeAll } from "vitest";
import {
  createAgent,
  createCommand,
  getCommandById,
  updateCommandStatus,
} from "./db-desktop-control";

/**
 * Testes para comandos shell e screenshots do Desktop Control
 * 
 * Valida:
 * - Criação de comandos shell
 * - Criação de comandos screenshot
 * - Validação de parâmetros
 * - Processamento de resultados com S3
 */

describe("🔧 Desktop Control - Shell Commands", () => {
  let testUserId: number;
  let testAgentId: number;

  beforeAll(async () => {
    testUserId = 1;
    
    // Criar agent de teste
    const agent = await createAgent(testUserId, "Test Shell Device", "Linux", "1.0.0");
    testAgentId = agent.id;
  });

  describe("createCommand - shell", () => {
    it("deve criar comando shell com parâmetros válidos", async () => {
      const commandData = {
        command: "echo 'Hello World'",
        timeout: 10,
      };

      const command = await createCommand(
        testAgentId,
        testUserId,
        "shell",
        commandData
      );

      expect(command).toBeDefined();
      expect(command.id).toBeGreaterThan(0);
      expect(command.agentId).toBe(testAgentId);
      expect(command.userId).toBe(testUserId);
      expect(command.commandType).toBe("shell");
      expect(command.status).toBe("pending");
      expect(command.commandData).toBeDefined();

      const parsedData = JSON.parse(command.commandData!);
      expect(parsedData).toMatchObject({
        command: "echo 'Hello World'",
        timeout: 10,
      });
    });

    it("deve criar comando shell com cwd customizado", async () => {
      const commandData = {
        command: "ls -la",
        timeout: 30,
        cwd: "/home/user",
      };

      const command = await createCommand(
        testAgentId,
        testUserId,
        "shell",
        commandData
      );

      const parsedData = JSON.parse(command.commandData!);
      expect(parsedData.cwd).toBe("/home/user");
    });

    it("deve aceitar comando shell sem timeout (usa padrão)", async () => {
      const commandData = {
        command: "pwd",
      };

      const command = await createCommand(
        testAgentId,
        testUserId,
        "shell",
        commandData
      );

      expect(command.commandType).toBe("shell");
      const parsedData = JSON.parse(command.commandData!);
      expect(parsedData.command).toBe("pwd");
    });
  });

  describe("updateCommandStatus - shell result", () => {
    it("deve atualizar comando shell com resultado de sucesso", async () => {
      const command = await createCommand(
        testAgentId,
        testUserId,
        "shell",
        { command: "echo test" }
      );

      const result = {
        stdout: "test\n",
        stderr: "",
        returncode: 0,
        command: "echo test",
      };

      await updateCommandStatus(command.id, "completed", result, undefined, 150);

      const updated = await getCommandById(command.id);
      expect(updated?.status).toBe("completed");
      expect(updated?.result).toBeDefined();
      
      const parsedResult = JSON.parse(updated!.result!);
      expect(parsedResult.stdout).toBe("test\n");
      expect(parsedResult.returncode).toBe(0);
      expect(updated?.executionTimeMs).toBe(150);
    });

    it("deve atualizar comando shell com erro", async () => {
      const command = await createCommand(
        testAgentId,
        testUserId,
        "shell",
        { command: "invalid_command" }
      );

      const result = {
        stdout: "",
        stderr: "command not found",
        returncode: 127,
        command: "invalid_command",
      };

      await updateCommandStatus(
        command.id,
        "failed",
        result,
        "command not found",
        50
      );

      const updated = await getCommandById(command.id);
      expect(updated?.status).toBe("failed");
      expect(updated?.errorMessage).toBe("command not found");
    });
  });
});

describe("📸 Desktop Control - Screenshots", () => {
  let testUserId: number;
  let testAgentId: number;

  beforeAll(async () => {
    testUserId = 1;
    
    // Criar agent de teste
    const agent = await createAgent(testUserId, "Test Screenshot Device", "Windows", "1.0.0");
    testAgentId = agent.id;
  });

  describe("createCommand - screenshot", () => {
    it("deve criar comando screenshot com formato PNG", async () => {
      const commandData = {
        format: "png",
      };

      const command = await createCommand(
        testAgentId,
        testUserId,
        "screenshot",
        commandData
      );

      expect(command.commandType).toBe("screenshot");
      const parsedData = JSON.parse(command.commandData!);
      expect(parsedData.format).toBe("png");
    });

    it("deve criar comando screenshot com formato JPEG e qualidade", async () => {
      const commandData = {
        format: "jpg",
        quality: 90,
      };

      const command = await createCommand(
        testAgentId,
        testUserId,
        "screenshot",
        commandData
      );

      const parsedData = JSON.parse(command.commandData!);
      expect(parsedData).toMatchObject({
        format: "jpg",
        quality: 90,
      });
    });

    it("deve criar comando screenshot sem parâmetros", async () => {
      const command = await createCommand(
        testAgentId,
        testUserId,
        "screenshot",
        {}
      );

      expect(command.commandType).toBe("screenshot");
    });
  });

  describe("updateCommandStatus - screenshot result", () => {
    it("deve processar resultado de screenshot com URL do S3", async () => {
      const command = await createCommand(
        testAgentId,
        testUserId,
        "screenshot",
        { format: "png" }
      );

      // Simular resultado processado (após upload S3)
      const result = {
        screenshot_url: "https://s3.example.com/screenshots/1/1732723456-abc123.png",
        screenshot_path: "screenshots/1/1732723456-abc123.png",
        width: 1920,
        height: 1080,
        format: "png",
        size_bytes: 245678,
      };

      await updateCommandStatus(command.id, "completed", result, undefined, 2500);

      const updated = await getCommandById(command.id);
      expect(updated?.status).toBe("completed");
      expect(updated?.result).toBeDefined();
      
      const parsedResult = JSON.parse(updated!.result!);
      expect(parsedResult.screenshot_url).toContain("screenshots/");
      expect(parsedResult.width).toBe(1920);
      expect(parsedResult.height).toBe(1080);
      expect(parsedResult.format).toBe("png");
      expect(updated?.executionTimeMs).toBe(2500);
    });

    it("deve processar screenshot JPEG com qualidade", async () => {
      const command = await createCommand(
        testAgentId,
        testUserId,
        "screenshot",
        { format: "jpg", quality: 85 }
      );

      const result = {
        screenshot_url: "https://s3.example.com/screenshots/1/1732723457-def456.jpg",
        screenshot_path: "screenshots/1/1732723457-def456.jpg",
        width: 2560,
        height: 1440,
        format: "jpg",
        size_bytes: 180000,
      };

      await updateCommandStatus(command.id, "completed", result, undefined, 1800);

      const updated = await getCommandById(command.id);
      const parsedResult = JSON.parse(updated!.result!);
      expect(parsedResult.format).toBe("jpg");
      expect(parsedResult.screenshot_url).toContain(".jpg");
    });

    it("deve tratar erro ao capturar screenshot", async () => {
      const command = await createCommand(
        testAgentId,
        testUserId,
        "screenshot",
        { format: "png" }
      );

      await updateCommandStatus(
        command.id,
        "failed",
        undefined,
        "Pillow não está instalado",
        100
      );

      const updated = await getCommandById(command.id);
      expect(updated?.status).toBe("failed");
      expect(updated?.errorMessage).toBeDefined();
      expect(updated?.errorMessage).toContain("Pillow");
    });
  });
});

describe("⚡ Desktop Control - Validações", () => {
  let testUserId: number;
  let testAgentId: number;

  beforeAll(async () => {
    testUserId = 1;
    const agent = await createAgent(testUserId, "Validation Device", "Linux", "1.0.0");
    testAgentId = agent.id;
  });

  describe("createCommand - validações", () => {
    it("deve aceitar commandType válido: shell", async () => {
      const command = await createCommand(
        testAgentId,
        testUserId,
        "shell",
        { command: "whoami" }
      );

      expect(command.commandType).toBe("shell");
    });

    it("deve aceitar commandType válido: screenshot", async () => {
      const command = await createCommand(
        testAgentId,
        testUserId,
        "screenshot",
        { format: "png" }
      );

      expect(command.commandType).toBe("screenshot");
    });

    it("deve criar comando com commandData vazio", async () => {
      const command = await createCommand(
        testAgentId,
        testUserId,
        "screenshot",
        {}
      );

      expect(command.commandData).toBeDefined();
      const parsed = JSON.parse(command.commandData!);
      expect(parsed).toEqual({});
    });
  });

  describe("getCommandById - busca", () => {
    it("deve retornar comando existente", async () => {
      const created = await createCommand(
        testAgentId,
        testUserId,
        "shell",
        { command: "date" }
      );

      const found = await getCommandById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.commandType).toBe("shell");
    });

    it("deve retornar null para comando inexistente", async () => {
      const found = await getCommandById(999999);
      expect(found).toBeNull();
    });
  });
});
