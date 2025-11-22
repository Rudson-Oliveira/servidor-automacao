import { describe, it, expect } from "vitest";

describe("API de Status", () => {
  it("deve retornar status online", async () => {
    const response = await fetch("http://localhost:3000/api/status");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.online).toBe(true);
    expect(data.versao).toBe("1.0.0");
    expect(data).toHaveProperty("total_requisicoes");
    expect(data).toHaveProperty("erros_corrigidos");
  });

  it("deve ter estrutura correta", async () => {
    const response = await fetch("http://localhost:3000/api/status");
    const data = await response.json();

    expect(data).toMatchObject({
      online: expect.any(Boolean),
      versao: expect.any(String),
      ultima_atualizacao: expect.any(String),
      total_requisicoes: expect.any(Number),
      erros_corrigidos: expect.any(Number),
    });
  });
});
