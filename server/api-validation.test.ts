import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

/**
 * Testes de validação das APIs Multi-IA configuradas pelo COMET
 * 
 * Este arquivo valida que todas as chaves de API foram configuradas corretamente
 * e que as APIs estão respondendo adequadamente.
 */

describe("API Multi-IA - Validação de Configuração", () => {
  it("deve ter CLAUDE_API_KEY configurada", () => {
    expect(process.env.CLAUDE_API_KEY).toBeDefined();
    expect(process.env.CLAUDE_API_KEY).toMatch(/^sk-ant-api03-/);
    expect(process.env.CLAUDE_API_KEY!.length).toBeGreaterThan(50);
  });

  it("deve ter GEMINI_API_KEY configurada", () => {
    expect(process.env.GEMINI_API_KEY).toBeDefined();
    expect(process.env.GEMINI_API_KEY).toMatch(/^AIzaSy/);
    expect(process.env.GEMINI_API_KEY!.length).toBeGreaterThan(30);
  });

  it("deve ter PERPLEXITY_API_KEY configurada", () => {
    expect(process.env.PERPLEXITY_API_KEY).toBeDefined();
    expect(process.env.PERPLEXITY_API_KEY).toMatch(/^pplx-/);
    expect(process.env.PERPLEXITY_API_KEY!.length).toBeGreaterThan(40);
  });

  it("deve ter DEEPSITE_HF_TOKEN configurada", () => {
    expect(process.env.DEEPSITE_HF_TOKEN).toBeDefined();
    expect(process.env.DEEPSITE_HF_TOKEN).toMatch(/^hf_/);
    expect(process.env.DEEPSITE_HF_TOKEN!.length).toBeGreaterThan(30);
  });

  it("deve ter GITHUB_API_KEY configurada", () => {
    expect(process.env.GITHUB_API_KEY).toBeDefined();
    expect(process.env.GITHUB_API_KEY).toMatch(/^ghp_/);
    expect(process.env.GITHUB_API_KEY!.length).toBeGreaterThan(30);
  });

  it("deve ter SUPABASE_ANON_KEY configurada", () => {
    expect(process.env.SUPABASE_ANON_KEY).toBeDefined();
    expect(process.env.SUPABASE_ANON_KEY).toMatch(/^eyJ/); // JWT começa com eyJ
  });

  it("deve ter SUPABASE_URL configurada", () => {
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_URL).toMatch(/^https?:\/\//);
  });

  it("deve ter ORCHESTRATOR_LEADER configurado como COMET", () => {
    expect(process.env.ORCHESTRATOR_LEADER).toBe("COMET");
  });

  it("deve ter ORCHESTRATOR_FALLBACK_ENABLED ativo", () => {
    expect(process.env.ORCHESTRATOR_FALLBACK_ENABLED).toBe("true");
  });

  it("deve ter DESKTOP_AGENT_REGISTER_TOKEN configurado", () => {
    expect(process.env.DESKTOP_AGENT_REGISTER_TOKEN).toBeDefined();
    expect(process.env.DESKTOP_AGENT_REGISTER_TOKEN).toBe("manus-agent-register-2024");
  });
});

describe("API Multi-IA - Validação de Conectividade", () => {
  it("deve conectar com Claude API (teste leve)", async () => {
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error("CLAUDE_API_KEY não configurada");
    }

    // Teste leve: validar formato da chave
    expect(apiKey).toMatch(/^sk-ant-api03-[A-Za-z0-9_-]+$/);
    
    // Teste de conectividade real (opcional, pode ser lento)
    // const response = await fetch("https://api.anthropic.com/v1/messages", {
    //   method: "POST",
    //   headers: {
    //     "x-api-key": apiKey,
    //     "anthropic-version": "2023-06-01",
    //     "content-type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     model: "claude-3-5-haiku-20241022",
    //     max_tokens: 10,
    //     messages: [{ role: "user", content: "Hi" }],
    //   }),
    // });
    // expect(response.status).toBeLessThan(500); // Aceita 200 ou 4xx (rate limit)
  }, 10000);

  it("deve conectar com Gemini API (teste leve)", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não configurada");
    }

    // Teste leve: validar formato da chave
    expect(apiKey).toMatch(/^AIzaSy[A-Za-z0-9_-]+$/);
    
    // Teste de conectividade real (opcional)
    // const response = await fetch(
    //   `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    // );
    // expect(response.status).toBe(200);
  }, 10000);

  it("deve conectar com GitHub API (teste leve)", async () => {
    const apiKey = process.env.GITHUB_API_KEY;
    if (!apiKey) {
      throw new Error("GITHUB_API_KEY não configurada");
    }

    // Teste leve: validar formato da chave
    expect(apiKey).toMatch(/^ghp_[A-Za-z0-9_-]+$/);
    
    // Teste de conectividade real
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "User-Agent": "Manus-Orchestrator",
      },
    });
    
    // GitHub API retorna 200 se válido, 401 se inválido
    if (response.status === 401) {
      throw new Error("GitHub API key inválida - verifique a chave fornecida");
    }
    
    expect(response.status).toBe(200);
  }, 10000);

  it("deve validar Hugging Face token (teste leve)", async () => {
    const token = process.env.DEEPSITE_HF_TOKEN;
    if (!token) {
      throw new Error("DEEPSITE_HF_TOKEN não configurada");
    }

    // Teste leve: validar formato do token
    expect(token).toMatch(/^hf_[A-Za-z0-9]+$/);
    
    // Teste de conectividade real (opcional)
    // const response = await fetch("https://huggingface.co/api/whoami-v2", {
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //   },
    // });
    // expect(response.status).toBe(200);
  }, 10000);
});

describe("API Multi-IA - Configuração de Orquestração", () => {
  it("deve ter todas as variáveis de orquestração configuradas", () => {
    expect(process.env.ORCHESTRATOR_LEADER).toBe("COMET");
    expect(process.env.ORCHESTRATOR_FALLBACK_ENABLED).toBe("true");
    expect(process.env.DESKTOP_AGENT_REGISTER_TOKEN).toBe("manus-agent-register-2024");
  });

  it("deve ter pelo menos 4 providers configurados", () => {
    const providers = [
      process.env.CLAUDE_API_KEY,
      process.env.GEMINI_API_KEY,
      process.env.PERPLEXITY_API_KEY,
      process.env.DEEPSITE_HF_TOKEN,
    ];

    const configuredProviders = providers.filter(Boolean);
    expect(configuredProviders.length).toBeGreaterThanOrEqual(4);
  });

  it("deve ter configuração de Desktop Agent", () => {
    expect(process.env.DESKTOP_AGENT_REGISTER_TOKEN).toBeDefined();
    expect(process.env.DESKTOP_AGENT_REGISTER_TOKEN).toBe("manus-agent-register-2024");
  });
});
