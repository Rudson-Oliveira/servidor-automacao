import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { TRPCError } from "@trpc/server";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1, openId: string = "test-user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
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

describe("🔒 Funcionalidades Críticas de Segurança Obsidian", () => {
  let user1VaultId: number;
  let user1NotaId: number;
  let user2VaultId: number;

  beforeAll(async () => {
    // Criar vault e nota para User 1
    const ctx1 = createAuthContext(1, "user-1");
    const caller1 = appRouter.createCaller(ctx1);

    const vault1 = await caller1.obsidianAdvanced.createVault({
      nome: "Vault User 1",
      descricao: "Vault privado do usuário 1",
      cor: "#ff0000",
      icone: "🔒",
    });
    user1VaultId = vault1.vaultId;

    const nota1 = await caller1.obsidianAdvanced.createNota({
      vaultId: user1VaultId,
      titulo: "Nota Privada User 1",
      caminho: "/privada.md",
      conteudo: "Conteúdo confidencial do usuário 1.",
      tags: ["privado"],
    });
    user1NotaId = nota1.notaId;

    // Criar vault para User 2
    const ctx2 = createAuthContext(2, "user-2");
    const caller2 = appRouter.createCaller(ctx2);

    const vault2 = await caller2.obsidianAdvanced.createVault({
      nome: "Vault User 2",
      descricao: "Vault privado do usuário 2",
      cor: "#00ff00",
      icone: "🔐",
    });
    user2VaultId = vault2.vaultId;
  });

  // ==================== TESTE 1: Validação de Permissões ====================
  describe("1️⃣ Validação de Permissões em updateNota", () => {
    it("deve permitir que o dono do vault edite sua própria nota", async () => {
      const ctx1 = createAuthContext(1, "user-1");
      const caller1 = appRouter.createCaller(ctx1);

      const result = await caller1.obsidianAdvanced.updateNota({
        notaId: user1NotaId,
        conteudo: "Conteúdo atualizado pelo próprio dono.",
      });

      expect(result.success).toBe(true);
    });

    it("deve bloquear edição de nota por usuário não autorizado", async () => {
      const ctx2 = createAuthContext(2, "user-2");
      const caller2 = appRouter.createCaller(ctx2);

      await expect(
        caller2.obsidianAdvanced.updateNota({
          notaId: user1NotaId,
          conteudo: "Tentativa de edição maliciosa.",
        })
      ).rejects.toThrow(TRPCError);

      await expect(
        caller2.obsidianAdvanced.updateNota({
          notaId: user1NotaId,
          conteudo: "Tentativa de edição maliciosa.",
        })
      ).rejects.toThrow("Você não tem permissão para editar esta nota");
    });

    it("deve retornar erro FORBIDDEN ao tentar editar nota de outro usuário", async () => {
      const ctx2 = createAuthContext(2, "user-2");
      const caller2 = appRouter.createCaller(ctx2);

      try {
        await caller2.obsidianAdvanced.updateNota({
          notaId: user1NotaId,
          titulo: "Título hackeado",
        });
        expect.fail("Deveria ter lançado TRPCError");
      } catch (error: any) {
        expect(error).toBeInstanceOf(TRPCError);
        expect(error.code).toBe("FORBIDDEN");
      }
    });
  });

  describe("2️⃣ Validação de Permissões em deleteNota", () => {
    it("deve bloquear deleção de nota por usuário não autorizado", async () => {
      const ctx2 = createAuthContext(2, "user-2");
      const caller2 = appRouter.createCaller(ctx2);

      await expect(
        caller2.obsidianAdvanced.deleteNota({
          notaId: user1NotaId,
        })
      ).rejects.toThrow(TRPCError);

      await expect(
        caller2.obsidianAdvanced.deleteNota({
          notaId: user1NotaId,
        })
      ).rejects.toThrow("Você não tem permissão para deletar esta nota");
    });

    it("deve retornar erro FORBIDDEN ao tentar deletar nota de outro usuário", async () => {
      const ctx2 = createAuthContext(2, "user-2");
      const caller2 = appRouter.createCaller(ctx2);

      try {
        await caller2.obsidianAdvanced.deleteNota({
          notaId: user1NotaId,
        });
        expect.fail("Deveria ter lançado TRPCError");
      } catch (error: any) {
        expect(error).toBeInstanceOf(TRPCError);
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("deve permitir que o dono do vault delete sua própria nota", async () => {
      const ctx1 = createAuthContext(1, "user-1");
      const caller1 = appRouter.createCaller(ctx1);

      // Criar nova nota para deletar
      const notaParaDeletar = await caller1.obsidianAdvanced.createNota({
        vaultId: user1VaultId,
        titulo: "Nota para Deletar",
        caminho: "/deletar.md",
        conteudo: "Esta nota será deletada.",
        tags: [],
      });

      const result = await caller1.obsidianAdvanced.deleteNota({
        notaId: notaParaDeletar.notaId,
      });

      expect(result.success).toBe(true);

      // Verificar que nota foi deletada
      await expect(
        caller1.obsidianAdvanced.getNota({ notaId: notaParaDeletar.notaId })
      ).rejects.toThrow("Nota não encontrada");
    });
  });

  // ==================== TESTE 3: Sincronização Bidirecional ====================
  describe("3️⃣ Sincronização Bidirecional (Banco → Filesystem)", () => {
    it("deve retornar erro se vault não tiver caminho configurado", async () => {
      const ctx1 = createAuthContext(1, "user-1");
      const caller1 = appRouter.createCaller(ctx1);

      // Vault sem caminho já existe (user1VaultId)
      await expect(
        caller1.obsidianAdvanced.syncVault({ vaultId: user1VaultId })
      ).rejects.toThrow();
    });

    it("deve validar permissões antes de sincronizar vault", async () => {
      const ctx2 = createAuthContext(2, "user-2");
      const caller2 = appRouter.createCaller(ctx2);

      // Tentar sincronizar vault do User 1 com credenciais do User 2
      await expect(
        caller2.obsidianAdvanced.syncVault({ vaultId: user1VaultId })
      ).rejects.toThrow();
    });
  });
});
