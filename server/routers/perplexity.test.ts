import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock do fetch global
global.fetch = vi.fn();

function createMockContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("perplexity.consultar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve validar query vazia", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.perplexity.consultar({
        query: "",
        apiKey: "pplx-test-key-1234567890",
      })
    ).rejects.toThrow("Query não pode estar vazia");
  });

  it("deve validar API key muito curta", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.perplexity.consultar({
        query: "Test query",
        apiKey: "short",
      })
    ).rejects.toThrow("API key inválida");
  });

  it("deve validar query muito longa", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const longQuery = "a".repeat(4001);

    await expect(
      caller.perplexity.consultar({
        query: longQuery,
        apiKey: "pplx-test-key-1234567890",
      })
    ).rejects.toThrow("Query muito longa");
  });

  it("deve aceitar modelo válido", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const mockResponse = {
      choices: [
        {
          message: {
            content: "Resposta de teste",
          },
        },
      ],
      citations: ["https://example.com"],
      model: "llama-3.1-sonar-small-128k-online",
      usage: {
        total_tokens: 100,
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await caller.perplexity.consultar({
      query: "Test query",
      apiKey: "pplx-test-key-1234567890",
      model: "llama-3.1-sonar-small-128k-online",
    });

    expect(result.sucesso).toBe(true);
    expect(result.resposta).toBe("Resposta de teste");
    expect(result.citacoes).toEqual(["https://example.com"]);
    expect(result.metadata.modelo).toBe("llama-3.1-sonar-small-128k-online");
    expect(result.metadata.tokensUsados).toBe(100);
  });

  it("deve usar valores padrão quando não especificados", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const mockResponse = {
      choices: [
        {
          message: {
            content: "Resposta de teste",
          },
        },
      ],
      citations: [],
      model: "llama-3.1-sonar-small-128k-online",
      usage: {
        total_tokens: 50,
      },
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await caller.perplexity.consultar({
      query: "Test query",
      apiKey: "pplx-test-key-1234567890",
    });

    expect(result.sucesso).toBe(true);
    expect(result.metadata.temperature).toBe(0.2);
  });

  it("deve tratar erro da API Perplexity", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      statusText: "Unauthorized",
      json: async () => ({
        error: {
          message: "Invalid API key",
        },
      }),
    });

    await expect(
      caller.perplexity.consultar({
        query: "Test query",
        apiKey: "pplx-invalid-key-1234567890",
      })
    ).rejects.toThrow("Erro da API Perplexity: Invalid API key");
  });

  it("deve tratar erro de rede", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network error")
    );

    await expect(
      caller.perplexity.consultar({
        query: "Test query",
        apiKey: "pplx-valid-test-key-1234567890",
      })
    ).rejects.toThrow("Erro ao consultar Perplexity: Network error");
  });

  it("deve validar temperature fora do intervalo", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.perplexity.consultar({
        query: "Test query",
        apiKey: "pplx-test-key-1234567890",
        temperature: 3,
      })
    ).rejects.toThrow();
  });

  it("deve validar maxTokens fora do intervalo", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.perplexity.consultar({
        query: "Test query",
        apiKey: "pplx-test-key-1234567890",
        maxTokens: 5000,
      })
    ).rejects.toThrow();
  });
});

describe("perplexity.testarConexao", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve validar API key muito curta", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.perplexity.testarConexao({
        apiKey: "short",
      })
    ).rejects.toThrow("API key inválida");
  });

  it("deve retornar sucesso quando API key é válida", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "test" } }] }),
    });

    const result = await caller.perplexity.testarConexao({
      apiKey: "pplx-valid-test-key-1234567890123456",
    });

    expect(result.sucesso).toBe(true);
    expect(result.mensagem).toBe("Conexão com Perplexity estabelecida com sucesso!");
  });

  it("deve retornar erro quando API key é inválida", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      statusText: "Unauthorized",
      json: async () => ({
        error: {
          message: "Invalid API key",
        },
      }),
    });

    const result = await caller.perplexity.testarConexao({
      apiKey: "pplx-invalid-key-1234567890123456",
    });

    expect(result.sucesso).toBe(false);
    expect(result.mensagem).toContain("Invalid API key");
  });

  it("deve tratar erro de rede com try-catch", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network error")
    );

    const result = await caller.perplexity.testarConexao({
      apiKey: "pplx-valid-test-key-1234567890123456",
    });

    expect(result.sucesso).toBe(false);
    expect(result.mensagem).toContain("Network error");
  });
});
