import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
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

describe("apisPersonalizadas", () => {
  it("deve criar uma nova API personalizada", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.apisPersonalizadas.criar({
      nome: "OpenAI Test",
      descricao: "API de teste para OpenAI",
      url: "https://api.openai.com/v1/chat/completions",
      metodo: "POST",
      chaveApi: "sk-test-123456",
      tipoAutenticacao: "bearer",
      ativa: 1,
    });

    expect(result.sucesso).toBe(true);
    expect(result.id).toBeGreaterThan(0);
    expect(result.mensagem).toBe("API personalizada criada com sucesso");
  });

  it("deve listar APIs personalizadas sem expor chaves", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar uma API primeiro
    await caller.apisPersonalizadas.criar({
      nome: "Test API",
      url: "https://api.test.com",
      metodo: "POST",
      chaveApi: "secret-key-123",
      tipoAutenticacao: "bearer",
      ativa: 1,
    });

    const apis = await caller.apisPersonalizadas.listar();

    expect(Array.isArray(apis)).toBe(true);
    
    // Verificar que chaves estão mascaradas (formato: sk-t...e-123)
    const apiComChave = apis.find(api => api.chaveApi);
    if (apiComChave) {
      // Chave deve estar mascarada, não em texto plano
      expect(apiComChave.chaveApi).not.toBe("secret-key-123");
      // Deve conter "..." indicando mascaramento
      expect(apiComChave.chaveApi).toContain("...");
    }
  });

  it("deve validar URL obrigatória", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.apisPersonalizadas.criar({
        nome: "Test",
        url: "", // URL vazia
        metodo: "POST",
        tipoAutenticacao: "none",
        ativa: 1,
      })
    ).rejects.toThrow();
  });

  it("deve validar método HTTP válido", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.apisPersonalizadas.criar({
        nome: "Test",
        url: "https://api.test.com",
        metodo: "INVALID" as any, // Método inválido
        tipoAutenticacao: "none",
        ativa: 1,
      })
    ).rejects.toThrow();
  });
});
