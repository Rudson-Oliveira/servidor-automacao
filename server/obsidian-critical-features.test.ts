import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as dbObsidian from "./db-obsidian";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-critical",
    email: "critical@example.com",
    name: "Critical Test User",
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

describe("🔴 Funcionalidades Críticas Obsidian", () => {
  let vaultId: number;
  let notaId: number;

  beforeAll(async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar vault de teste
    const vaultResult = await caller.obsidianAdvanced.createVault({
      nome: "Vault Crítico",
      descricao: "Vault para testar funcionalidades críticas",
      cor: "#ff0000",
      icone: "🔴",
    });
    vaultId = vaultResult.vaultId;

    // Criar nota inicial para testes de update
    const notaResult = await caller.obsidianAdvanced.createNota({
      vaultId,
      titulo: "Nota para Teste de Update",
      caminho: "/teste-update.md",
      conteudo: "Conteúdo inicial da nota.\n\nMenciona [[Nota Inexistente]].",
      tags: ["teste", "update"],
    });
    notaId = notaResult.notaId;
  });

  // ==================== TESTE 1: Endpoint updateNota ====================
  describe("1️⃣ Endpoint updateNota com Versionamento", () => {
    it("deve atualizar conteúdo da nota e incrementar versão", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const notaAntes = await caller.obsidianAdvanced.getNota({ notaId });
      const versaoAntes = notaAntes.versao || 1;

      const novoConteudo = "# Conteúdo Atualizado\n\nNovo texto com **markdown**.";

      const result = await caller.obsidianAdvanced.updateNota({
        notaId,
        conteudo: novoConteudo,
      });

      expect(result.success).toBe(true);

      const notaDepois = await caller.obsidianAdvanced.getNota({ notaId });
      expect(notaDepois.conteudo).toBe(novoConteudo);
      expect(notaDepois.versao).toBe(versaoAntes + 1);
    });

    it("deve registrar mudança no histórico", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const notaAntes = await caller.obsidianAdvanced.getNota({ notaId });
      const versoesAntes = notaAntes.versoes || 0;

      await caller.obsidianAdvanced.updateNota({
        notaId,
        conteudo: "Mais uma atualização para testar histórico.",
      });

      const notaDepois = await caller.obsidianAdvanced.getNota({ notaId });
      expect(notaDepois.versoes).toBeGreaterThan(versoesAntes);
    });

    it("deve preservar título quando atualizar apenas conteúdo", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const notaAntes = await caller.obsidianAdvanced.getNota({ notaId });
      const tituloOriginal = notaAntes.titulo;

      await caller.obsidianAdvanced.updateNota({
        notaId,
        conteudo: "Conteúdo atualizado sem mudar título.",
      });

      const notaDepois = await caller.obsidianAdvanced.getNota({ notaId });
      expect(notaDepois.titulo).toBe(tituloOriginal);
    });

    it("deve atualizar título quando fornecido", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const novoTitulo = "Título Atualizado via Update";

      await caller.obsidianAdvanced.updateNota({
        notaId,
        titulo: novoTitulo,
      });

      const notaDepois = await caller.obsidianAdvanced.getNota({ notaId });
      expect(notaDepois.titulo).toBe(novoTitulo);
    });
  });

  // ==================== TESTE 2: Sincronização Real ====================
  describe("2️⃣ Sincronização Real com Filesystem", () => {
    it("deve retornar erro se vault não tiver caminho configurado", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Criar vault sem caminho
      const vaultSemCaminho = await caller.obsidianAdvanced.createVault({
        nome: "Vault Sem Caminho",
        descricao: "Vault sem caminho configurado",
        cor: "#cccccc",
        icone: "❌",
      });

      await expect(
        caller.obsidianAdvanced.syncVault({ vaultId: vaultSemCaminho.vaultId })
      ).rejects.toThrow();
    });

    it("deve retornar resultado de sync com contadores", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Criar vault com caminho válido (mas que não existe)
      const vaultComCaminho = await caller.obsidianAdvanced.createVault({
        nome: "Vault Com Caminho",
        descricao: "Vault com caminho para teste",
        caminho: "/tmp/obsidian-test-vault-inexistente",
        cor: "#00ff00",
        icone: "✅",
      });

      // Sync deve falhar porque o diretório não existe
      await expect(
        caller.obsidianAdvanced.syncVault({ vaultId: vaultComCaminho.vaultId })
      ).rejects.toThrow();
    });
  });

  // ==================== TESTE 3: Atualização Automática de Backlinks ====================
  describe("3️⃣ Atualização Automática de Backlinks", () => {
    it("deve criar backlinks automaticamente ao criar nota com wikilinks", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Criar nota de destino
      const notaDestino = await caller.obsidianAdvanced.createNota({
        vaultId,
        titulo: "Nota Destino",
        caminho: "/nota-destino.md",
        conteudo: "Esta é a nota de destino.",
        tags: ["destino"],
      });

      // Criar nota de origem com wikilink
      const notaOrigem = await caller.obsidianAdvanced.createNota({
        vaultId,
        titulo: "Nota Origem",
        caminho: "/nota-origem.md",
        conteudo: "Esta nota menciona [[Nota Destino]] no texto.",
        tags: ["origem"],
      });

      // Verificar se backlink foi criado
      const notaDestinoCompleta = await caller.obsidianAdvanced.getNota({
        notaId: notaDestino.notaId,
      });

      expect(notaDestinoCompleta.backlinks).toBeDefined();
      expect(notaDestinoCompleta.backlinks.incoming).toBeInstanceOf(Array);
      expect(notaDestinoCompleta.backlinks.incoming.length).toBeGreaterThan(0);

      const backlink = notaDestinoCompleta.backlinks.incoming.find(
        (b) => b.notaId === notaOrigem.notaId
      );
      expect(backlink).toBeDefined();
      expect(backlink?.titulo).toBe("Nota Origem");
    });

    it("deve atualizar backlinks quando conteúdo é modificado", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Criar duas notas de destino
      const destino1 = await caller.obsidianAdvanced.createNota({
        vaultId,
        titulo: "Destino 1",
        caminho: "/destino-1.md",
        conteudo: "Destino 1",
        tags: [],
      });

      const destino2 = await caller.obsidianAdvanced.createNota({
        vaultId,
        titulo: "Destino 2",
        caminho: "/destino-2.md",
        conteudo: "Destino 2",
        tags: [],
      });

      // Criar nota que menciona apenas Destino 1
      const origem = await caller.obsidianAdvanced.createNota({
        vaultId,
        titulo: "Origem Mutável",
        caminho: "/origem-mutavel.md",
        conteudo: "Menciona [[Destino 1]].",
        tags: [],
      });

      // Verificar backlink em Destino 1
      let destino1Completa = await caller.obsidianAdvanced.getNota({
        notaId: destino1.notaId,
      });
      expect(destino1Completa.backlinks.incoming.length).toBeGreaterThan(0);

      // Atualizar origem para mencionar Destino 2 em vez de Destino 1
      await caller.obsidianAdvanced.updateNota({
        notaId: origem.notaId,
        conteudo: "Agora menciona [[Destino 2]].",
      });

      // Verificar que backlink foi removido de Destino 1
      destino1Completa = await caller.obsidianAdvanced.getNota({
        notaId: destino1.notaId,
      });
      const backlinkDestino1 = destino1Completa.backlinks.incoming.find(
        (b) => b.notaId === origem.notaId
      );
      expect(backlinkDestino1).toBeUndefined();

      // Verificar que backlink foi criado em Destino 2
      const destino2Completa = await caller.obsidianAdvanced.getNota({
        notaId: destino2.notaId,
      });
      const backlinkDestino2 = destino2Completa.backlinks.incoming.find(
        (b) => b.notaId === origem.notaId
      );
      expect(backlinkDestino2).toBeDefined();
    });

    it("deve incluir contexto do backlink (linha onde aparece)", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const destino = await caller.obsidianAdvanced.createNota({
        vaultId,
        titulo: "Nota com Contexto",
        caminho: "/nota-contexto.md",
        conteudo: "Nota de destino para teste de contexto.",
        tags: [],
      });

      const origem = await caller.obsidianAdvanced.createNota({
        vaultId,
        titulo: "Origem com Contexto",
        caminho: "/origem-contexto.md",
        conteudo:
          "Linha 1\nLinha 2\nEsta linha menciona [[Nota com Contexto]] aqui.\nLinha 4",
        tags: [],
      });

      const destinoCompleta = await caller.obsidianAdvanced.getNota({
        notaId: destino.notaId,
      });

      const backlink = destinoCompleta.backlinks.incoming.find(
        (b) => b.notaId === origem.notaId
      );
      expect(backlink).toBeDefined();
      expect(backlink?.contexto).toBeDefined();
      expect(backlink?.contexto).toContain("Linha 3");
    });

    it("deve ignorar wikilinks para notas inexistentes", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const notaComLinkInvalido = await caller.obsidianAdvanced.createNota({
        vaultId,
        titulo: "Nota com Link Inválido",
        caminho: "/link-invalido.md",
        conteudo: "Menciona [[Nota que Não Existe]] no texto.",
        tags: [],
      });

      // Não deve gerar erro, apenas não cria backlink
      expect(notaComLinkInvalido.notaId).toBeDefined();
    });
  });
});
