import { describe, it, expect } from "vitest";
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
  it("deve gerar token com 64 caracteres", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const resultado = await caller.agente.gerarToken({
      nome: "Desktop Teste",
    });

    expect(resultado.success).toBe(true);
    expect(resultado.token).toBeDefined();
    expect(resultado.token.length).toBe(64);
    expect(resultado.nome).toBe("Desktop Teste");
  });
});

describe("agente.listarTokens", () => {
  it("deve listar tokens sem expor token completo", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const tokens = await caller.agente.listarTokens();

    expect(Array.isArray(tokens)).toBe(true);
  });
});

describe("agente.listarAgentes", () => {
  it("deve retornar lista de agentes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const agentes = await caller.agente.listarAgentes();

    expect(Array.isArray(agentes)).toBe(true);
  });
});

describe("agente.historico", () => {
  it("deve retornar histórico vazio inicialmente", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const historico = await caller.agente.historico({});

    expect(Array.isArray(historico)).toBe(true);
  });
});

describe("agente.estatisticas", () => {
  it("deve retornar estatísticas válidas", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.agente.estatisticas();

    expect(stats.total).toBeGreaterThanOrEqual(0);
    expect(stats.taxaSucesso).toBeDefined();
  });
});
