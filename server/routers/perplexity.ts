import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

/**
 * Router para integração com Perplexity AI
 * 
 * Perplexity é uma IA de busca e pesquisa que fornece respostas
 * contextualizadas com fontes verificadas.
 */

// Schema de validação para consulta
const consultarSchema = z.object({
  query: z.string().min(1, "Query não pode estar vazia").max(4000, "Query muito longa (máx 4000 caracteres)"),
  apiKey: z.string().min(20, "API key inválida (mínimo 20 caracteres)"),
  model: z.enum([
    "llama-3.1-sonar-small-128k-online",
    "llama-3.1-sonar-large-128k-online",
    "llama-3.1-sonar-huge-128k-online"
  ]).optional().default("llama-3.1-sonar-small-128k-online"),
  temperature: z.number().min(0).max(2).optional().default(0.2),
  maxTokens: z.number().min(1).max(4000).optional().default(1000),
});

export const perplexityRouter = router({
  /**
   * Consultar Perplexity AI
   * 
   * Envia uma query para a API Perplexity e retorna a resposta
   * com fontes e citações.
   */
  consultar: publicProcedure
    .input(consultarSchema)
    .mutation(async ({ input }) => {
      const { query, apiKey, model, temperature, maxTokens } = input;

      try {
        // Fazer requisição para API Perplexity
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content: "Você é um assistente de pesquisa preciso e detalhado. Sempre cite suas fontes."
              },
              {
                role: "user",
                content: query
              }
            ],
            temperature,
            max_tokens: maxTokens,
            return_citations: true,
            return_images: false,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Erro da API Perplexity: ${errorData.error?.message || response.statusText}`,
          });
        }

        const data = await response.json();

        // Extrair resposta e citações
        const resposta = data.choices?.[0]?.message?.content || "";
        const citacoes = data.citations || [];
        const modelo = data.model || model;
        const tokensUsados = data.usage?.total_tokens || 0;

        return {
          sucesso: true,
          resposta,
          citacoes,
          metadata: {
            modelo,
            tokensUsados,
            temperature,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao consultar Perplexity: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        });
      }
    }),

  /**
   * Testar conexão com Perplexity
   * 
   * Valida se a API key está funcionando
   */
  testarConexao: publicProcedure
    .input(z.object({
      apiKey: z.string().min(20, "API key inválida"),
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${input.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-sonar-small-128k-online",
            messages: [
              {
                role: "user",
                content: "Test"
              }
            ],
            max_tokens: 10,
          }),
        });

        if (response.ok) {
          return {
            sucesso: true,
            mensagem: "Conexão com Perplexity estabelecida com sucesso!",
          };
        } else {
          const errorData = await response.json().catch(() => ({}));
          return {
            sucesso: false,
            mensagem: `Erro: ${errorData.error?.message || response.statusText}`,
          };
        }
      } catch (error) {
        return {
          sucesso: false,
          mensagem: `Erro de conexão: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        };
      }
    }),
});
