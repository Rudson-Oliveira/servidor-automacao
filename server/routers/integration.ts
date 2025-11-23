import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

/**
 * Router para integração com APIs externas (IAs)
 * Testa conexão com diferentes serviços
 */
export const integrationRouter = router({
  /**
   * Testa conexão com uma IA específica
   */
  testConnection: publicProcedure
    .input(
      z.object({
        iaId: z.string().min(1, "ID da IA é obrigatório"),
        apiKey: z.string().min(1, "API Key é obrigatória"),
        nome: z.string().min(1, "Nome da IA é obrigatório"),
        // Campos opcionais para Obsidian
        porta: z.number().optional(),
        usarHttps: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { iaId, apiKey, nome, porta, usarHttps } = input;

      try {
        // Teste específico para Obsidian (API Local)
        if (iaId === "obsidian") {
          return await testarObsidian(apiKey, porta || 27123, usarHttps || false);
        }

        // Teste para Perplexity
        if (iaId === "perplexity") {
          return await testarPerplexity(apiKey);
        }

        // Teste para Manus
        if (iaId === "manus") {
          return await testarManus(apiKey);
        }

        // Teste para Abacus.ai
        if (iaId === "abacus") {
          return await testarAbacus(apiKey);
        }

        // Teste para DeepAgente
        if (iaId === "deepagente") {
          return await testarDeepAgente(apiKey);
        }

        // IA não suportada
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `IA "${nome}" não possui teste de conexão implementado`,
        });
      } catch (error: any) {
        console.error(`[Integration] Erro ao testar ${nome}:`, error);

        // Se for erro do TRPCError, propagar
        if (error instanceof TRPCError) {
          throw error;
        }

        // Outros erros
        return {
          sucesso: false,
          erro: error.message || "Erro desconhecido ao testar conexão",
        };
      }
    }),
});

/**
 * Testa conexão com Obsidian Local REST API
 */
async function testarObsidian(
  apiKey: string,
  porta: number,
  usarHttps: boolean
): Promise<{ sucesso: boolean; erro?: string; mensagem?: string }> {
  const protocolo = usarHttps ? "https" : "http";
  const url = `${protocolo}://127.0.0.1:${porta}/`;

  try {
    // IMPORTANTE: Não podemos testar 127.0.0.1 do servidor (cloud)
    // Apenas validamos se os parâmetros estão corretos
    
    // Validar API key (deve ter pelo menos 32 caracteres)
    if (apiKey.length < 32) {
      return {
        sucesso: false,
        erro: "API Key do Obsidian parece inválida (muito curta). Verifique se copiou corretamente.",
      };
    }

    // Validar porta
    if (porta < 1 || porta > 65535) {
      return {
        sucesso: false,
        erro: "Porta inválida. Deve estar entre 1 e 65535.",
      };
    }

    // Como não podemos testar 127.0.0.1 remotamente, retornamos sucesso
    // com instruções para o usuário testar localmente
    return {
      sucesso: true,
      mensagem: `✅ Configuração validada! URL: ${url}\n\n⚠️ IMPORTANTE: Como o Obsidian roda localmente (127.0.0.1), não podemos testar a conexão remotamente.\n\nPara confirmar que está funcionando:\n1. Abra o Obsidian\n2. Ative o plugin "Local REST API"\n3. Acesse no navegador: ${url}\n4. Se aparecer informações da API, está funcionando!`,
    };
  } catch (error: any) {
    return {
      sucesso: false,
      erro: error.message || "Erro ao validar configuração do Obsidian",
    };
  }
}

/**
 * Testa conexão com Perplexity API
 */
async function testarPerplexity(apiKey: string): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "user",
            content: "teste",
          },
        ],
        max_tokens: 1,
      }),
    });

    if (response.ok) {
      return { sucesso: true };
    }

    const errorData = await response.json().catch(() => ({}));
    return {
      sucesso: false,
      erro: errorData.error?.message || `Erro ${response.status}: ${response.statusText}`,
    };
  } catch (error: any) {
    return {
      sucesso: false,
      erro: error.message || "Erro ao conectar com Perplexity",
    };
  }
}

/**
 * Testa conexão com Manus API
 */
async function testarManus(apiKey: string): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    // Endpoint de teste da API Manus (ajustar conforme documentação real)
    const response = await fetch("https://api.manus.im/v1/test", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { sucesso: true };
    }

    return {
      sucesso: false,
      erro: `Erro ${response.status}: API key inválida ou serviço indisponível`,
    };
  } catch (error: any) {
    return {
      sucesso: false,
      erro: error.message || "Erro ao conectar com Manus",
    };
  }
}

/**
 * Testa conexão com Abacus.ai API
 */
async function testarAbacus(apiKey: string): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    // Endpoint de teste da API Abacus (ajustar conforme documentação real)
    const response = await fetch("https://api.abacus.ai/v1/deployments", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { sucesso: true };
    }

    return {
      sucesso: false,
      erro: `Erro ${response.status}: API key inválida ou serviço indisponível`,
    };
  } catch (error: any) {
    return {
      sucesso: false,
      erro: error.message || "Erro ao conectar com Abacus.ai",
    };
  }
}

/**
 * Testa conexão com DeepAgente API
 */
async function testarDeepAgente(apiKey: string): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    // Endpoint de teste da API DeepAgente (ajustar conforme documentação real)
    const response = await fetch("https://api.deepagente.com/v1/agents", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { sucesso: true };
    }

    return {
      sucesso: false,
      erro: `Erro ${response.status}: API key inválida ou serviço indisponível`,
    };
  } catch (error: any) {
    return {
      sucesso: false,
      erro: error.message || "Erro ao conectar com DeepAgente",
    };
  }
}
