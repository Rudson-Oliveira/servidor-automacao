/**
 * Router tRPC para DeepSite - Análise Inteligente de Documentos
 * 
 * Endpoints para análise de documentos usando IA:
 * - Análise completa de documentos
 * - Extração de entidades
 * - Geração de resumos
 * - Detecção de idioma e sentimento
 * - Busca semântica
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  analisarDocumento,
  extrairEntidades,
  gerarResumo,
  detectarIdioma,
  analisarSentimento,
  testarConexao,
} from "../_core/deepsite";
import {
  getArquivoById,
  atualizarArquivo,
  buscarArquivosPorTermo,
  criarAlerta,
} from "../db-servidor";
import { getDb } from "../db";
import { arquivosMapeados } from "../../drizzle/schema";
import { like, or, sql } from "drizzle-orm";

// ========================================
// SCHEMAS DE VALIDAÇÃO
// ========================================

const AnalisarDocumentoSchema = z.object({
  texto: z.string().min(10).max(100000),
  opcoes: z.object({
    forcarFallback: z.boolean().optional(),
    incluirResumo: z.boolean().optional(),
    incluirEntidades: z.boolean().optional(),
    incluirSentimento: z.boolean().optional(),
  }).optional(),
});

const AnalisarArquivoSchema = z.object({
  arquivoId: z.number().int().positive(),
  forcarReanalise: z.boolean().default(false),
});

const BuscarSemanticaSchema = z.object({
  consulta: z.string().min(1).max(500),
  departamentoId: z.number().int().positive().optional(),
  limite: z.number().int().min(1).max(100).default(20),
});

// ========================================
// ROUTER
// ========================================

export const deepsiteRouter = router({
  
  /**
   * Testa conexão com API DeepSite
   */
  testarConexao: publicProcedure
    .query(async () => {
      return await testarConexao();
    }),

  /**
   * Analisa documento (alias para analisarTexto)
   */
  analisarDocumento: publicProcedure
    .input(AnalisarDocumentoSchema)
    .mutation(async ({ input }) => {
      return await analisarDocumento(input.texto, input.opcoes);
    }),

  /**
   * Analisa texto diretamente (sem salvar)
   */
  analisarTexto: publicProcedure
    .input(AnalisarDocumentoSchema)
    .mutation(async ({ input }) => {
      const analise = await analisarDocumento(input.texto, input.opcoes);
      
      return {
        sucesso: true,
        analise,
      };
    }),

  /**
   * Analisa arquivo do banco de dados
   * 
   * IMPORTANTE: Comet deve enviar o conteúdo do arquivo via outro endpoint
   * Este endpoint apenas processa o texto já armazenado
   */
  analisarArquivo: publicProcedure
    .input(AnalisarArquivoSchema)
    .mutation(async ({ input }) => {
      // 1. Buscar arquivo no banco
      const arquivo = await getArquivoById(input.arquivoId);
      
      if (!arquivo) {
        throw new Error(`Arquivo ${input.arquivoId} não encontrado`);
      }
      
      // 2. Verificar se já foi analisado
      if (arquivo.conteudoIndexado && !input.forcarReanalise) {
        return {
          sucesso: true,
          mensagem: "Arquivo já analisado. Use forcarReanalise=true para reanalisar.",
          analise: {
            resumo: arquivo.conteudoIndexado,
            palavrasChave: arquivo.tags?.split(',') || [],
            categoria: arquivo.tipoArquivo || 'geral',
          },
          jaAnalisado: true,
        };
      }
      
      // 3. Verificar se tem conteúdo para analisar
      if (!arquivo.conteudoIndexado || arquivo.conteudoIndexado.length < 10) {
        return {
          sucesso: false,
          mensagem: "Arquivo não possui conteúdo indexado. Comet deve enviar o conteúdo primeiro.",
          jaAnalisado: false,
        };
      }
      
      // 4. Analisar com DeepSite
      const analise = await analisarDocumento(arquivo.conteudoIndexado);
      
      // 5. Atualizar arquivo com análise
      await atualizarArquivo(input.arquivoId, {
        conteudoIndexado: analise.resumo,
        tags: analise.palavrasChave.join(','),
        tipoArquivo: analise.categoria,
        importante: analise.importancia > 0.7 ? 1 : 0,
        metadados: JSON.stringify({
          entidades: analise.entidades,
          idioma: analise.idioma,
          sentimento: analise.sentimento,
          analisadoEm: new Date().toISOString(),
        }),
      });
      
      // 6. Criar alertas se necessário
      if (analise.alertas && analise.alertas.length > 0) {
        for (const alerta of analise.alertas) {
          // Buscar servidorId do arquivo
          const db = await getDb();
          if (db) {
            const result = await db
              .select({ servidorId: sql<number>`d.servidor_id` })
              .from(arquivosMapeados)
              .leftJoin(sql`departamentos d`, sql`d.id = ${arquivosMapeados.departamentoId}`)
              .where(sql`${arquivosMapeados.id} = ${input.arquivoId}`)
              .limit(1);
            
            if (result.length > 0 && result[0]?.servidorId) {
              await criarAlerta({
                servidorId: result[0].servidorId,
                tipo: alerta.tipo as any,
                severidade: alerta.severidade,
                titulo: alerta.titulo,
                mensagem: `${alerta.mensagem} (Arquivo: ${arquivo.nome})`,
                detalhes: JSON.stringify({ arquivoId: input.arquivoId, arquivo: arquivo.nome }),
              });
            }
          }
        }
      }
      
      return {
        sucesso: true,
        analise,
        jaAnalisado: false,
      };
    }),

  /**
   * Analisa múltiplos arquivos em lote
   */
  analisarLote: publicProcedure
    .input(z.object({
      arquivoIds: z.array(z.number().int().positive()).min(1).max(100),
      forcarReanalise: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const resultados: any[] = [];
      
      for (const arquivoId of input.arquivoIds) {
        try {
          // Processar cada arquivo individualmente
          const arquivo = await getArquivoById(arquivoId);
          
          if (!arquivo) {
            resultados.push({
              arquivoId,
              sucesso: false,
              erro: "Arquivo não encontrado",
            });
            continue;
          }
          
          if (!arquivo.conteudoIndexado || arquivo.conteudoIndexado.length < 10) {
            resultados.push({
              arquivoId,
              sucesso: false,
              erro: "Arquivo sem conteúdo indexado",
            });
            continue;
          }
          
          const analise = await analisarDocumento(arquivo.conteudoIndexado);
          
          await atualizarArquivo(arquivoId, {
            conteudoIndexado: analise.resumo,
            tags: analise.palavrasChave.join(','),
            tipoArquivo: analise.categoria,
            importante: analise.importancia > 0.7 ? 1 : 0,
          });
          
          resultados.push({
            arquivoId,
            sucesso: true,
            analise,
          });
        } catch (error) {
          resultados.push({
            arquivoId,
            sucesso: false,
            erro: error instanceof Error ? error.message : String(error),
          });
        }
      }
      
      const sucessos = resultados.filter(r => r.sucesso).length;
      const falhas = resultados.length - sucessos;
      
      return {
        total: resultados.length,
        sucessos,
        falhas,
        resultados,
      };
    }),

  /**
   * Extrai apenas entidades de um texto
   */
  extrairEntidades: publicProcedure
    .input(z.object({ texto: z.string().min(10).max(50000) }))
    .mutation(async ({ input }) => {
      return await extrairEntidades(input.texto);
    }),

  /**
   * Gera resumo automático
   */
  gerarResumo: publicProcedure
    .input(z.object({
      texto: z.string().min(10).max(50000),
      maxLength: z.number().int().min(50).max(500).default(200),
    }))
    .mutation(async ({ input }) => {
      return await gerarResumo(input.texto, input.maxLength);
    }),

  /**
   * Detecta idioma
   */
  detectarIdioma: publicProcedure
    .input(z.object({ texto: z.string().min(10).max(10000) }))
    .mutation(async ({ input }) => {
      return await detectarIdioma(input.texto);
    }),

  /**
   * Analisa sentimento
   */
  analisarSentimento: publicProcedure
    .input(z.object({ texto: z.string().min(10).max(10000) }))
    .mutation(async ({ input }) => {
      return await analisarSentimento(input.texto);
    }),

  /**
   * Busca semântica por conteúdo
   * 
   * Busca arquivos cujo conteúdo indexado contém termos relacionados à consulta
   */
  buscarPorConteudo: publicProcedure
    .input(BuscarSemanticaSchema)
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      // Busca FULLTEXT (se disponível) ou LIKE
      const termos = input.consulta.split(/\s+/).filter(t => t.length > 2);
      
      if (termos.length === 0) {
        return [];
      }
      
      // Construir query com OR para cada termo
      const condicoes = termos.map(termo => 
        or(
          like(arquivosMapeados.nome, `%${termo}%`),
          like(arquivosMapeados.conteudoIndexado, `%${termo}%`),
          like(arquivosMapeados.tags, `%${termo}%`)
        )
      );
      
      const baseQuery = db
        .select()
        .from(arquivosMapeados)
        .where(or(...condicoes))
        .limit(input.limite);
      
      const resultados = await baseQuery;
      
      return resultados.map(arquivo => ({
        ...arquivo,
        relevancia: termos.filter(t => 
          arquivo.nome.toLowerCase().includes(t) ||
          arquivo.conteudoIndexado?.toLowerCase().includes(t) ||
          arquivo.tags?.toLowerCase().includes(t)
        ).length / termos.length,
      })).sort((a, b) => b.relevancia - a.relevancia);
    }),

  /**
   * Obtém estatísticas de análises
   */
  getEstatisticas: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return null;
      
      const [totalArquivos] = await db
        .select({ count: sql<number>`count(*)` })
        .from(arquivosMapeados);
      
      const [arquivosAnalisados] = await db
        .select({ count: sql<number>`count(*)` })
        .from(arquivosMapeados)
        .where(sql`${arquivosMapeados.conteudoIndexado} IS NOT NULL AND ${arquivosMapeados.conteudoIndexado} != ''`);
      
      const [arquivosImportantes] = await db
        .select({ count: sql<number>`count(*)` })
        .from(arquivosMapeados)
        .where(sql`${arquivosMapeados.importante} = 1`);
      
      return {
        totalArquivos: totalArquivos?.count || 0,
        arquivosAnalisados: arquivosAnalisados?.count || 0,
        arquivosImportantes: arquivosImportantes?.count || 0,
        percentualAnalisado: totalArquivos?.count 
          ? ((arquivosAnalisados?.count || 0) / totalArquivos.count * 100).toFixed(2)
          : '0',
      };
    }),
});
