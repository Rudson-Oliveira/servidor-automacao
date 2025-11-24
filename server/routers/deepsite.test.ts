import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
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

describe("DeepSite Integration", () => {
  describe("analisarDocumento", () => {
    it("deve analisar texto e retornar estrutura válida", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const texto = `
        Contrato de Fornecimento de Medicamentos
        
        Fornecedor: MedSupply Ltda
        Valor: R$ 450.000,00
        Validade: 31/12/2025
        
        Este contrato estabelece as condições de fornecimento de medicamentos
        para o Hospital XYZ, incluindo cláusulas de reajuste anual e multa
        por atraso na entrega.
      `;

      const resultado = await caller.deepsite.analisarDocumento({ texto });

      // Validar estrutura básica
      expect(resultado).toBeDefined();
      expect(typeof resultado).toBe("object");
      
      // Validar campos obrigatórios
      expect(resultado).toHaveProperty("resumo");
      expect(resultado).toHaveProperty("palavrasChave");
      expect(resultado).toHaveProperty("categoria");
      expect(resultado).toHaveProperty("importancia");
      
      // Validar tipos
      expect(typeof resultado.resumo).toBe("string");
      expect(Array.isArray(resultado.palavrasChave)).toBe(true);
      expect(typeof resultado.categoria).toBe("string");
      expect(typeof resultado.importancia).toBe("number");
      
      // Validar valores
      expect(resultado.resumo.length).toBeGreaterThan(0);
      expect(resultado.importancia).toBeGreaterThanOrEqual(0);
      expect(resultado.importancia).toBeLessThanOrEqual(1);
    });

    it("deve rejeitar texto vazio", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.deepsite.analisarDocumento({ texto: "" })
      ).rejects.toThrow();
    });

    it("deve rejeitar texto muito curto", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.deepsite.analisarDocumento({ texto: "abc" })
      ).rejects.toThrow();
    });
  });

  describe("extrairEntidades", () => {
    it("deve retornar estrutura válida de entidades", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const texto = "O contrato com MedSupply Ltda no valor de R$ 450.000,00 vence em 31/12/2025.";

      const resultado = await caller.deepsite.extrairEntidades({ texto });

      expect(resultado).toBeDefined();
      expect(resultado).toHaveProperty("entidades");
      expect(Array.isArray(resultado.entidades)).toBe(true);
    });
  });

  describe("analisarLote", () => {
    it("deve validar array vazio", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.deepsite.analisarLote({
          arquivoIds: [],
          forcarReanalise: false,
        })
      ).rejects.toThrow();
    });

    it("deve validar array com muitos itens", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const muitosIds = Array.from({ length: 101 }, (_, i) => i + 1);
      
      await expect(
        caller.deepsite.analisarLote({
          arquivoIds: muitosIds,
          forcarReanalise: false,
        })
      ).rejects.toThrow();
    });

    it("deve processar array válido e retornar estrutura correta", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const resultado = await caller.deepsite.analisarLote({
        arquivoIds: [999991, 999992],
        forcarReanalise: false,
      });

      expect(resultado).toBeDefined();
      expect(resultado).toHaveProperty("total");
      expect(resultado).toHaveProperty("sucessos");
      expect(resultado).toHaveProperty("falhas");
      expect(resultado).toHaveProperty("resultados");
      
      expect(resultado.total).toBe(2);
      expect(Array.isArray(resultado.resultados)).toBe(true);
      expect(resultado.resultados.length).toBe(2);
    });
  });

  describe("buscarInteligente", () => {
    it("deve validar termo vazio", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.deepsite.buscarInteligente({
          termo: "",
          limite: 10,
        })
      ).rejects.toThrow();
    });

    it("deve validar limite inválido", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.deepsite.buscarInteligente({
          termo: "teste",
          limite: 0,
        })
      ).rejects.toThrow();

      await expect(
        caller.deepsite.buscarInteligente({
          termo: "teste",
          limite: 1001,
        })
      ).rejects.toThrow();
    });

    it("deve executar busca com parâmetros válidos", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const resultado = await caller.deepsite.buscarInteligente({
        termo: "teste",
        limite: 10,
      });

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBeLessThanOrEqual(10);
    });
  });

  describe("getEstatisticas", () => {
    it("deve retornar estatísticas válidas", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const resultado = await caller.deepsite.getEstatisticas();

      if (resultado) {
        expect(resultado).toHaveProperty("totalArquivos");
        expect(resultado).toHaveProperty("arquivosAnalisados");
        expect(resultado).toHaveProperty("arquivosImportantes");
        expect(resultado).toHaveProperty("percentualAnalisado");
        
        expect(typeof resultado.totalArquivos).toBe("number");
        expect(typeof resultado.arquivosAnalisados).toBe("number");
        expect(typeof resultado.arquivosImportantes).toBe("number");
        expect(typeof resultado.percentualAnalisado).toBe("string");
      }
    });
  });
});
