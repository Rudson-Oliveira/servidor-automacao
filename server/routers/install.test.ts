/**
 * 🧪 TESTES - API DE INSTALAÇÃO
 * Testes unitários para endpoints de instalação de agentes
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock local do db.ts para este arquivo de teste
vi.mock("../db", () => import("../__mocks__/db.full"));

// Mock context
function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      get: () => "localhost",
    } as any,
    res: {
      clearCookie: () => {},
    } as any,
  };
}

describe("Install Router", () => {
  describe("install.desktopAgent", () => {
    it("deve registrar novo agente com sucesso", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.install.desktopAgent({
        hostname: "TEST-DESKTOP",
        machine_id: "test-machine-123",
        agent_version: "1.0.0",
        os: "win32",
        python_version: "3.11.0",
      });

      expect(result.success).toBe(true);
      expect(result.agent_id).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.is_new).toBe(true);
    });

    it("deve reutilizar token de agente existente", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // Primeiro registro
      const first = await caller.install.desktopAgent({
        hostname: "TEST-DESKTOP-2",
        machine_id: "test-machine-456",
        agent_version: "1.0.0",
        os: "win32",
      });

      // Segundo registro com mesmo machine_id
      const second = await caller.install.desktopAgent({
        hostname: "TEST-DESKTOP-2",
        machine_id: "test-machine-456",
        agent_version: "1.0.1",
        os: "win32",
      });

      expect(second.success).toBe(true);
      expect(second.agent_id).toBe(first.agent_id);
      expect(second.token).toBe(first.token);
      expect(second.is_new).toBe(false);
    });

    it("deve rejeitar registro sem hostname", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.install.desktopAgent({
          hostname: "",
          machine_id: "test-machine-789",
          agent_version: "1.0.0",
          os: "win32",
        })
      ).rejects.toThrow();
    });

    it("deve rejeitar registro sem machine_id", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.install.desktopAgent({
          hostname: "TEST-DESKTOP",
          machine_id: "",
          agent_version: "1.0.0",
          os: "win32",
        })
      ).rejects.toThrow();
    });
  });

  describe("install.validate", () => {
    it("deve validar agente registrado", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // Registrar agente
      const registered = await caller.install.desktopAgent({
        hostname: "TEST-DESKTOP-3",
        machine_id: "test-machine-999",
        agent_version: "1.0.0",
        os: "win32",
      });

      // Validar
      const validation = await caller.install.validate({
        agent_id: registered.agent_id,
        token: registered.token,
      });

      expect(validation.valid).toBe(true);
      expect(validation.agent).toBeDefined();
      expect(validation.agent?.id).toBe(registered.agent_id);
    });

    it("deve rejeitar token inválido", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // Registrar agente
      const registered = await caller.install.desktopAgent({
        hostname: "TEST-DESKTOP-4",
        machine_id: "test-machine-888",
        agent_version: "1.0.0",
        os: "win32",
      });

      // Validar com token errado
      const validation = await caller.install.validate({
        agent_id: registered.agent_id,
        token: "invalid-token-123",
      });

      expect(validation.valid).toBe(false);
    });

    it("deve rejeitar agent_id inexistente", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const validation = await caller.install.validate({
        agent_id: "agent_nonexistent_123",
        token: "any-token",
      });

      expect(validation.valid).toBe(false);
    });
  });

  describe("install.status", () => {
    it("deve retornar status do sistema", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const status = await caller.install.status();

      expect(status.available).toBeDefined();
      expect(status.message).toBeDefined();
      
      if (status.available) {
        expect(status.stats).toBeDefined();
        expect(status.stats?.total_agents).toBeGreaterThanOrEqual(0);
        expect(status.stats?.online_agents).toBeGreaterThanOrEqual(0);
        expect(status.stats?.offline_agents).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
