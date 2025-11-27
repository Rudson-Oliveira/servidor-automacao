import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as dbObsidian from "./db-obsidian";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("🎯 3 Melhorias Obsidian - Testes de Integração", () => {
  let vaultId: number;
  let notaId1: number;
  let notaId2: number;
  let notaId3: number;

  beforeAll(async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar vault de teste
    const vaultResult = await caller.obsidianAdvanced.createVault({
      nome: "Test Vault - Melhorias",
      descricao: "Vault para testar as 3 melhorias",
      cor: "#8b5cf6",
      icone: "🧪",
    });
    vaultId = vaultResult.vaultId;

    // Criar notas com wikilinks para testar Graph View
    const nota1 = await caller.obsidianAdvanced.createNota({
      vaultId,
      titulo: "Nota Principal",
      caminho: "/nota-principal.md",
      conteudo: "Esta nota menciona [[Nota Secundária]] e [[Nota Terciária]].",
      tags: ["teste", "principal"],
    });
    notaId1 = nota1.notaId;

    const nota2 = await caller.obsidianAdvanced.createNota({
      vaultId,
      titulo: "Nota Secundária",
      caminho: "/nota-secundaria.md",
      conteudo: "Esta nota volta para [[Nota Principal]].",
      tags: ["teste", "secundaria"],
    });
    notaId2 = nota2.notaId;

    const nota3 = await caller.obsidianAdvanced.createNota({
      vaultId,
      titulo: "Nota Terciária",
      caminho: "/nota-terciaria.md",
      conteudo: "Nota isolada sem wikilinks.",
      tags: ["teste"],
    });
    notaId3 = nota3.notaId;
  });

  // ==================== TESTE 1: Monaco Editor Integration ====================
  describe("1️⃣ Monaco Editor - Edição de Notas", () => {
    it("deve permitir buscar nota para edição no Monaco Editor", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const nota = await caller.obsidianAdvanced.getNota({ notaId: notaId1 });

      expect(nota).toBeDefined();
      expect(nota.id).toBe(notaId1);
      expect(nota.titulo).toBe("Nota Principal");
      expect(nota.conteudo).toContain("[[Nota Secundária]]");
      expect(nota.conteudo).toContain("[[Nota Terciária]]");
    });

    it("deve listar notas de um vault para seleção no editor", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.obsidianAdvanced.listNotas({ vaultId });

      expect(result.notas).toBeInstanceOf(Array);
      expect(result.notas.length).toBeGreaterThanOrEqual(3);
      expect(result.notas.some(n => n.titulo === "Nota Principal")).toBe(true);
    });
  });

  // ==================== TESTE 2: UI de Sincronização ====================
  describe("2️⃣ UI de Sincronização - Sync Manual e Auto-Sync", () => {
    it("deve executar sincronização manual do vault", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.obsidianAdvanced.syncVault({ vaultId });

      expect(result).toHaveProperty("vaultId");
      expect(result).toHaveProperty("novos");
      expect(result).toHaveProperty("modificados");
      expect(result).toHaveProperty("deletados");
      expect(result).toHaveProperty("conflitos");
      expect(result.vaultId).toBe(vaultId);
    });

    it("deve ativar auto-sync para o vault", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.obsidianAdvanced.startAutoSync({
        vaultId,
        intervalMinutes: 5,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("Auto-sync iniciado");

      // Verificar se config foi atualizada
      const config = await caller.obsidianAdvanced.getSyncConfig({ vaultId });
      expect(config?.syncAutomatico).toBe(1);
    });

    it("deve desativar auto-sync para o vault", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.obsidianAdvanced.stopAutoSync({ vaultId });

      expect(result.success).toBe(true);
      expect(result.message).toContain("Auto-sync parado");
    });

    it("deve retornar status de auto-sync nos vaults listados", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.obsidianAdvanced.listVaults();

      expect(result.vaults).toBeInstanceOf(Array);
      const vault = result.vaults.find(v => v.id === vaultId);
      expect(vault).toBeDefined();
      expect(vault).toHaveProperty("autoSyncAtivo");
      expect(typeof vault?.autoSyncAtivo).toBe("boolean");
    });
  });

  // ==================== TESTE 3: Parser de Wikilinks ====================
  describe("3️⃣ Parser de Wikilinks - Graph View com Backlinks Reais", () => {
    it("deve extrair wikilinks e construir grafo de notas", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.obsidianAdvanced.getGraphData({ vaultId });

      expect(result).toHaveProperty("nodes");
      expect(result).toHaveProperty("links");
      expect(result).toHaveProperty("totalNotas");
      expect(result).toHaveProperty("totalLinks");

      expect(result.nodes).toBeInstanceOf(Array);
      expect(result.links).toBeInstanceOf(Array);
      expect(result.totalNotas).toBeGreaterThanOrEqual(3);
    });

    it("deve criar links bidirecionais entre notas conectadas", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.obsidianAdvanced.getGraphData({ vaultId });

      // Nota Principal -> Nota Secundária
      const linkPrincipalParaSecundaria = result.links.find(
        link =>
          (link.source === notaId1 && link.target === notaId2) ||
          (link.source === notaId2 && link.target === notaId1)
      );
      expect(linkPrincipalParaSecundaria).toBeDefined();

      // Nota Principal -> Nota Terciária (apenas ida, pois Terciária não menciona Principal)
      const linkPrincipalParaTerciaria = result.links.find(
        link =>
          (link.source === notaId1 && link.target === notaId3) ||
          (link.source === notaId3 && link.target === notaId1)
      );
      expect(linkPrincipalParaTerciaria).toBeDefined(); // Link existe porque Principal menciona Terciária
    });

    it("deve incluir tags nos nodes do grafo", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.obsidianAdvanced.getGraphData({ vaultId });

      const nodePrincipal = result.nodes.find(n => n.id === notaId1);
      expect(nodePrincipal).toBeDefined();
      expect(nodePrincipal?.tags).toBeInstanceOf(Array);
      expect(nodePrincipal?.tags).toContain("teste");
      expect(nodePrincipal?.tags).toContain("principal");
    });

    it("deve ignorar wikilinks para notas inexistentes", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Criar nota com wikilink para nota inexistente
      const notaComLinkInvalido = await caller.obsidianAdvanced.createNota({
        vaultId,
        titulo: "Nota com Link Inválido",
        caminho: "/nota-link-invalido.md",
        conteudo: "Esta nota menciona [[Nota Inexistente]] que não existe.",
        tags: ["teste"],
      });

      const result = await caller.obsidianAdvanced.getGraphData({ vaultId });

      // Não deve criar link para nota inexistente
      const linkInvalido = result.links.find(
        link => link.source === notaComLinkInvalido.notaId || link.target === notaComLinkInvalido.notaId
      );
      expect(linkInvalido).toBeUndefined();
    });

    it("deve evitar links duplicados no grafo", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.obsidianAdvanced.getGraphData({ vaultId });

      // Verificar se não há links duplicados
      const linkKeys = new Set<string>();
      result.links.forEach(link => {
        const key = [link.source, link.target].sort().join("-");
        expect(linkKeys.has(key)).toBe(false);
        linkKeys.add(key);
      });
    });
  });
});
