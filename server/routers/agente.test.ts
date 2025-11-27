import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
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

describe("agente.gerarToken", () => {
  it("deve gerar token com nome válido", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const resultado = await caller.agente.gerarToken({
      nome: "Desktop Teste",
    });

    expect(resultado.success).toBe(true);
    expect(resultado.token).toBeDefined();
    expect(resultado.token.length).toBe(64); // 32 bytes em hex = 64 caracteres
    expect(resultado.nome).toBe("Desktop Teste");
  });

  it("deve rejeitar nome vazio", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.agente.gerarToken({
        nome: "",
      })
    ).rejects.toThrow();
  });
});

describe("agente.listarTokens", () => {
  it("deve listar tokens sem expor token completo", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Gerar um token primeiro
    await caller.agente.gerarToken({
      nome: "Desktop Teste",
    });

    const tokens = await caller.agente.listarTokens();

    expect(Array.isArray(tokens)).toBe(true);
    if (tokens.length > 0) {
      const token = tokens[0];
      expect(token.id).toBeDefined();
      expect(token.nome).toBeDefined();
      expect(token.tokenParcial).toBeDefined();
      expect(token.tokenParcial).toContain("...");
      expect(token.ativo).toBeDefined();
    }
  });
});

describe("agente.listarAgentes", () => {
  it("deve retornar lista de agentes (pode estar vazia)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const agentes = await caller.agente.listarAgentes();

    expect(Array.isArray(agentes)).toBe(true);
  });
});

describe("agente.historico", () => {
  it("deve retornar histórico com limite padrão", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const historico = await caller.agente.historico({});

    expect(Array.isArray(historico)).toBe(true);
  });

  it("deve respeitar limite customizado", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const historico = await caller.agente.historico({
      limite: 10,
    });

    expect(Array.isArray(historico)).toBe(true);
    expect(historico.length).toBeLessThanOrEqual(10);
  });
});

describe("agente.estatisticas", () => {
  it("deve retornar estatísticas válidas", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.agente.estatisticas();

    expect(stats.total).toBeGreaterThanOrEqual(0);
    expect(stats.sucesso).toBeGreaterThanOrEqual(0);
    expect(stats.erro).toBeGreaterThanOrEqual(0);
    expect(stats.timeout).toBeGreaterThanOrEqual(0);
    expect(stats.taxaSucesso).toBeDefined();
    expect(stats.duracaoMediaMs).toBeGreaterThanOrEqual(0);
  });
});

describe("agente.enviarComando", () => {
  it("deve rejeitar comando para agente inexistente", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.agente.enviarComando({
        agenteId: "agente-inexistente",
        comando: "teste",
      })
    ).rejects.toThrow();
  });
});
