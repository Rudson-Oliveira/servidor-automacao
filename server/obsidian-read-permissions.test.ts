import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

/**
 * 🔒 TESTES DE VALIDAÇÃO DE PERMISSÕES EM ENDPOINTS DE LEITURA
 * 
 * Garante que usuários não autorizados não podem acessar dados de outros usuários
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number, openId: string): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: openId,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
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

  return { ctx };
}

describe("🔒 Validação de Permissões em Endpoints de Leitura", () => {
  
  describe("getVault", () => {
    it("deve retornar FORBIDDEN ao tentar acessar vault de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      // Tentar acessar vault ID 1 (que pertence a outro usuário)
      await expect(
        caller.obsidianAdvanced.getVault({ vaultId: 1 })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("permissão"),
      });
    });
  });

  describe("getNota", () => {
    it("deve retornar FORBIDDEN ao tentar acessar nota de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      // Tentar acessar nota ID 1 (que pertence a outro usuário)
      await expect(
        caller.obsidianAdvanced.getNota({ notaId: 1 })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("permissão"),
      });
    });
  });

  describe("listNotas", () => {
    it("deve retornar FORBIDDEN ao tentar listar notas de vault de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.obsidianAdvanced.listNotas({ vaultId: 1 })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("permissão"),
      });
    });
  });

  describe("searchNotas", () => {
    it("deve retornar FORBIDDEN ao tentar buscar em vault de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.obsidianAdvanced.searchNotas({ 
          vaultId: 1, 
          query: "test" 
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("permissão"),
      });
    });
  });

  describe("listTags", () => {
    it("deve retornar FORBIDDEN ao tentar listar tags de vault de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.obsidianAdvanced.listTags({ vaultId: 1 })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("permissão"),
      });
    });
  });

  describe("getNotaHistorico", () => {
    it("deve retornar FORBIDDEN ao tentar acessar histórico de nota de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.obsidianAdvanced.getNotaHistorico({ notaId: 1 })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("permissão"),
      });
    });
  });

  describe("getBacklinks", () => {
    it("deve retornar FORBIDDEN ao tentar acessar backlinks de nota de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.obsidianAdvanced.getBacklinks({ notaId: 1 })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("permissão"),
      });
    });
  });

  describe("exportVault", () => {
    it("deve retornar FORBIDDEN ao tentar exportar vault de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.obsidianAdvanced.exportVault({ vaultId: 1 })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("permissão"),
      });
    });
  });

  describe("listBackups", () => {
    it("deve retornar FORBIDDEN ao tentar listar backups de vault de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.obsidianAdvanced.listBackups({ vaultId: 1 })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("permissão"),
      });
    });
  });

  describe("getSyncConfig", () => {
    it("deve retornar FORBIDDEN ao tentar acessar config de sync de vault de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.obsidianAdvanced.getSyncConfig({ vaultId: 1 })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("permissão"),
      });
    });
  });

  describe("getGraphData", () => {
    it("deve retornar FORBIDDEN ao tentar acessar graph data de vault de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.obsidianAdvanced.getGraphData({ vaultId: 1 })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("Vault não encontrado"),
      });
    });
  });
});
