import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

/**
 * Router para integração Obsidian com IA
 * Gera conteúdo inteligente para notas usando múltiplos LLMs
 */

const AIModel = z.enum(["gemini", "gpt", "claude", "perplexity"]);

export const obsidianAIRouter = router({
  /**
   * Gerar conteúdo completo para nota Obsidian
   */
  generateNote: publicProcedure
    .input(
      z.object({
        prompt: z.string().min(1, "Prompt não pode estar vazio"),
        model: AIModel.default("gemini"),
        vault: z.string().optional(),
        includeMetadata: z.boolean().default(true),
        includeTags: z.boolean().default(true),
        includeLinks: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const systemPrompt = `Você é um assistente especializado em criar notas para Obsidian.

INSTRUÇÕES:
1. Gere uma nota completa e bem estruturada em Markdown
2. ${input.includeMetadata ? "Inclua frontmatter YAML no início com: title, date, tags, aliases" : "Não inclua frontmatter"}
3. ${input.includeTags ? "Adicione tags relevantes usando #tag" : "Não adicione tags"}
4. ${input.includeLinks ? "Crie links internos usando [[Nome da Nota]]" : "Não crie links internos"}
5. Use formatação Markdown apropriada (títulos, listas, negrito, itálico)
6. Seja conciso mas completo
7. Use linguagem clara e objetiva

FORMATO ESPERADO:
${input.includeMetadata ? `---
title: "Título da Nota"
date: ${new Date().toISOString().split('T')[0]}
tags: [tag1, tag2, tag3]
aliases: []
---

` : ""}# Título Principal

Conteúdo da nota aqui...

## Seção 1

Detalhes...

## Seção 2

Mais detalhes...

${input.includeLinks ? "## Links Relacionados\n\n- [[Nota Relacionada 1]]\n- [[Nota Relacionada 2]]" : ""}

${input.includeTags ? "## Tags\n\n#tag1 #tag2 #tag3" : ""}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.prompt },
          ],
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao gerar conteúdo",
          });
        }

        // Extrair metadados do frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        const frontmatter = frontmatterMatch ? frontmatterMatch[1] : null;
        
        // Extrair título
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : "Nova Nota";

        // Extrair tags
        const tags: string[] = [];
        if (input.includeTags) {
          const tagMatches = content.matchAll(/#(\w+)/g);
          for (const match of tagMatches) {
            if (!tags.includes(match[1])) {
              tags.push(match[1]);
            }
          }
        }

        // Extrair links internos
        const links: string[] = [];
        if (input.includeLinks) {
          const linkMatches = content.matchAll(/\[\[([^\]]+)\]\]/g);
          for (const match of linkMatches) {
            if (!links.includes(match[1])) {
              links.push(match[1]);
            }
          }
        }

        return {
          content,
          metadata: {
            title,
            tags,
            links,
            frontmatter,
            model: input.model,
            generatedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error("Erro ao gerar nota:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao gerar nota",
        });
      }
    }),

  /**
   * Gerar tags inteligentes baseadas no conteúdo
   */
  generateTags: publicProcedure
    .input(
      z.object({
        content: z.string().min(1),
        maxTags: z.number().min(1).max(20).default(5),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em categorização de conteúdo.
Analise o texto fornecido e sugira tags relevantes para Obsidian.
Retorne APENAS as tags, separadas por vírgula, sem explicações.
Máximo de ${input.maxTags} tags.
Use palavras-chave concisas e relevantes.`,
            },
            { role: "user", content: input.content },
          ],
        });

        const tagsText = response.choices[0]?.message?.content || "";
        const tags = tagsText
          .split(",")
          .map((tag) => tag.trim().replace(/^#/, ""))
          .filter((tag) => tag.length > 0)
          .slice(0, input.maxTags);

        return { tags };
      } catch (error) {
        console.error("Erro ao gerar tags:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar tags",
        });
      }
    }),

  /**
   * Sugerir links relacionados baseados no conteúdo
   */
  suggestLinks: publicProcedure
    .input(
      z.object({
        content: z.string().min(1),
        existingNotes: z.array(z.string()).optional(),
        maxLinks: z.number().min(1).max(10).default(5),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const notesContext = input.existingNotes
          ? `\n\nNotas existentes no vault:\n${input.existingNotes.join("\n")}`
          : "";

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em organização de conhecimento.
Analise o conteúdo e sugira notas relacionadas que deveriam ser linkadas.
${input.existingNotes ? "Priorize links para notas existentes quando relevante." : ""}
Retorne APENAS os nomes das notas, uma por linha, sem explicações.
Máximo de ${input.maxLinks} sugestões.
Use nomes descritivos e concisos.${notesContext}`,
            },
            { role: "user", content: input.content },
          ],
        });

        const linksText = response.choices[0]?.message?.content || "";
        const links = linksText
          .split("\n")
          .map((link) => link.trim().replace(/^-\s*/, ""))
          .filter((link) => link.length > 0)
          .slice(0, input.maxLinks);

        return { links };
      } catch (error) {
        console.error("Erro ao sugerir links:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao sugerir links",
        });
      }
    }),

  /**
   * Gerar frontmatter YAML inteligente
   */
  generateFrontmatter: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em metadados para Obsidian.
Gere um frontmatter YAML completo baseado no título e conteúdo.
Inclua: title, date, tags, aliases, category, status.
Retorne APENAS o YAML, sem explicações ou markdown.`,
            },
            {
              role: "user",
              content: `Título: ${input.title}\n\nConteúdo:\n${input.content.substring(0, 500)}...${input.tags ? `\n\nTags sugeridas: ${input.tags.join(", ")}` : ""}`,
            },
          ],
        });

        const frontmatter = response.choices[0]?.message?.content || "";

        return {
          frontmatter: frontmatter.replace(/^```ya?ml\n?/, "").replace(/\n?```$/, ""),
        };
      } catch (error) {
        console.error("Erro ao gerar frontmatter:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar frontmatter",
        });
      }
    }),

  /**
   * Gerar queries Dataview prontas
   */
  generateDataviewQuery: publicProcedure
    .input(
      z.object({
        description: z.string().min(1),
        queryType: z.enum(["table", "list", "task", "calendar"]).default("list"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um especialista em Dataview queries para Obsidian.
Gere uma query Dataview do tipo ${input.queryType} baseada na descrição.
Retorne APENAS a query, sem explicações.
Use sintaxe Dataview correta.`,
            },
            { role: "user", content: input.description },
          ],
        });

        const query = response.choices[0]?.message?.content || "";

        return {
          query: query.replace(/^```dataview\n?/, "").replace(/\n?```$/, ""),
          type: input.queryType,
        };
      } catch (error) {
        console.error("Erro ao gerar query Dataview:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar query Dataview",
        });
      }
    }),
});
