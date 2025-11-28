import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * 🔒 TESTES DE VALIDAÇÃO DE PERMISSÕES EM ENDPOINTS DE ESCRITA
 * 
 * Garante que usuários não autorizados não podem modificar dados de outros usuários
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

describe("🔒 Validação de Permissões em Endpoints de Escrita", () => {
  
  describe("createNota", () => {
    it("deve retornar FORBIDDEN ao tentar criar nota em vault de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      // Tentar criar nota no vault ID 1 (que pertence a outro usuário)
      await expect(
        caller.obsidianAdvanced.createNota({
          vaultId: 1,
          titulo: "Nota Maliciosa",
          caminho: "/hack.md",
          conteudo: "Tentativa de invasão",
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("permissão"),
      });
    });
  });

  describe("importNotas", () => {
    it("deve retornar FORBIDDEN ao tentar importar notas em vault de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.obsidianAdvanced.importNotas({
          vaultId: 1,
          notas: [
            {
              titulo: "Nota Importada Maliciosa",
              caminho: "/imported-hack.md",
              conteudo: "Tentativa de invasão via import",
            },
          ],
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("permissão"),
      });
    });
  });

  describe("createBackup", () => {
    it("deve retornar FORBIDDEN ao tentar criar backup de vault de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.obsidianAdvanced.createBackup({
          vaultId: 1,
          nome: "Backup não autorizado",
          descricao: "Tentativa de exfiltração de dados",
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("permissão"),
      });
    });
  });

  describe("updateSyncConfig", () => {
    it("deve retornar FORBIDDEN ao tentar modificar config de sync de vault de outro usuário", async () => {
      const { ctx } = createAuthContext(999, "unauthorized-user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.obsidianAdvanced.updateSyncConfig({
          vaultId: 1,
          syncAutomatico: 0,
          resolucaoConflito: "local_vence",
        })
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: expect.stringContaining("permissão"),
      });
    });
  });
});
