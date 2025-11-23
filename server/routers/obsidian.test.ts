import { describe, expect, it } from "vitest";
import { obsidianRouter } from "./obsidian";

describe("Obsidian Router", () => {
  describe("gerarScriptCriacao", () => {
    it("deve gerar script Python com sucesso", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      const resultado = await caller.gerarScriptCriacao({
        nomeArquivo: "teste.md",
        conteudo: "# Teste\n\nConteúdo de teste",
        caminho: "",
        apiKey: "test-api-key-123",
        porta: 27123,
        usarHttps: false,
      });

      expect(resultado.sucesso).toBe(true);
      expect(resultado.arquivoFinal).toBe("teste.md");
      expect(resultado.url).toContain("http://127.0.0.1:27123");
      expect(resultado.scripts.python).toContain("import requests");
      expect(resultado.scripts.python).toContain("test-api-key-123");
      expect(resultado.scripts.powershell).toContain("Invoke-WebRequest");
    });

    it("deve adicionar extensão .md se não existir", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      const resultado = await caller.gerarScriptCriacao({
        nomeArquivo: "teste",
        conteudo: "Conteúdo",
        caminho: "",
        apiKey: "test-key",
      });

      expect(resultado.arquivoFinal).toBe("teste.md");
    });

    it("deve incluir caminho no arquivo final", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      const resultado = await caller.gerarScriptCriacao({
        nomeArquivo: "teste.md",
        conteudo: "Conteúdo",
        caminho: "pasta/subpasta",
        apiKey: "test-key",
      });

      expect(resultado.arquivoFinal).toBe("pasta/subpasta/teste.md");
      expect(resultado.url).toContain("pasta%2Fsubpasta%2Fteste.md");
    });

    it("deve usar HTTPS quando solicitado", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      const resultado = await caller.gerarScriptCriacao({
        nomeArquivo: "teste.md",
        conteudo: "Conteúdo",
        caminho: "",
        apiKey: "test-key",
        usarHttps: true,
      });

      expect(resultado.url).toContain("https://127.0.0.1");
    });

    it("deve usar porta customizada", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      const resultado = await caller.gerarScriptCriacao({
        nomeArquivo: "teste.md",
        conteudo: "Conteúdo",
        caminho: "",
        apiKey: "test-key",
        porta: 8080,
      });

      expect(resultado.url).toContain(":8080");
    });

    it("deve escapar aspas no conteúdo do script Python", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      const resultado = await caller.gerarScriptCriacao({
        nomeArquivo: "teste.md",
        conteudo: 'Texto com "aspas"',
        caminho: "",
        apiKey: "test-key",
      });

      expect(resultado.scripts.python).toContain('\\"aspas\\"');
    });

    it("deve incluir instruções para Windows e Linux/Mac", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      const resultado = await caller.gerarScriptCriacao({
        nomeArquivo: "teste.md",
        conteudo: "Conteúdo",
        caminho: "",
        apiKey: "test-key",
      });

      expect(resultado.instrucoes.windows).toBeDefined();
      expect(resultado.instrucoes.linux_mac).toBeDefined();
      expect(resultado.instrucoes.windows.length).toBeGreaterThan(0);
      expect(resultado.instrucoes.linux_mac.length).toBeGreaterThan(0);
    });

    it("deve incluir observações importantes", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      const resultado = await caller.gerarScriptCriacao({
        nomeArquivo: "teste.md",
        conteudo: "Conteúdo",
        caminho: "",
        apiKey: "test-key",
      });

      expect(resultado.observacoes).toBeDefined();
      expect(resultado.observacoes.length).toBeGreaterThan(0);
      expect(resultado.observacoes.some(obs => obs.includes("Obsidian"))).toBe(true);
    });
  });

  describe("criarArquivoTesteComet", () => {
    it("deve gerar arquivo de teste com nome correto", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      const resultado = await caller.criarArquivoTesteComet({
        apiKey: "test-api-key-123",
        porta: 27123,
        usarHttps: false,
      });

      expect(resultado.sucesso).toBe(true);
      expect(resultado.arquivoFinal).toBe("08_TESTE_Comet_Manus.md");
      expect(resultado.mensagemComet).toContain("Script de teste gerado");
    });

    it("deve incluir conteúdo de teste com checklist", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      const resultado = await caller.criarArquivoTesteComet({
        apiKey: "test-key",
      });

      expect(resultado.scripts.python).toContain("Checklist de Teste");
      expect(resultado.scripts.python).toContain("- [x]");
      expect(resultado.scripts.python).toContain("- [ ]");
    });

    it("deve incluir informações técnicas no conteúdo", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      const resultado = await caller.criarArquivoTesteComet({
        apiKey: "test-key",
        porta: 8080,
        usarHttps: true,
      });

      expect(resultado.scripts.python).toContain("8080");
      expect(resultado.scripts.python).toContain("HTTPS");
    });

    it("deve incluir mensagem específica para o Comet", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      const resultado = await caller.criarArquivoTesteComet({
        apiKey: "test-key",
      });

      expect(resultado.mensagemComet).toBeDefined();
      expect(resultado.mensagemComet).toContain("Script de teste");
    });
  });

  describe("Validação de entrada", () => {
    it("deve rejeitar nome de arquivo vazio", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      await expect(
        caller.gerarScriptCriacao({
          nomeArquivo: "",
          conteudo: "Conteúdo",
          caminho: "",
          apiKey: "test-key",
        })
      ).rejects.toThrow();
    });

    it("deve rejeitar conteúdo vazio", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      await expect(
        caller.gerarScriptCriacao({
          nomeArquivo: "teste.md",
          conteudo: "",
          caminho: "",
          apiKey: "test-key",
        })
      ).rejects.toThrow();
    });

    it("deve rejeitar API key vazia", async () => {
      const caller = obsidianRouter.createCaller({} as any);

      await expect(
        caller.gerarScriptCriacao({
          nomeArquivo: "teste.md",
          conteudo: "Conteúdo",
          caminho: "",
          apiKey: "",
        })
      ).rejects.toThrow();
    });
  });
});
