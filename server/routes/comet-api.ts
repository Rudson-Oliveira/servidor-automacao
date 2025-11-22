import { Express, Request, Response } from "express";
import { getDb } from "../db";
import { cometContexto, cometArquivos, cometPreferencias, skills } from "../../drizzle/schema";
import { eq, like, and, desc, sql } from "drizzle-orm";

/**
 * API REST de integração com Comet
 * Permite ao Comet processar pedidos, buscar arquivos, gerenciar contexto
 */

export function registerCometApiRoutes(app: Express) {
  
  /**
   * POST /api/comet/processar
   * Processa um pedido do Comet com contexto e skills
   */
  app.post("/api/comet/processar", async (req: Request, res: Response) => {
    try {
      const { sessionId, mensagem, contextoAnterior } = req.body;

      if (!sessionId || !mensagem) {
        return res.status(400).json({
          sucesso: false,
          erro: "sessionId e mensagem são obrigatórios"
        });
      }

      const db = await getDb();
      if (!db) {
        return res.status(500).json({
          sucesso: false,
          erro: "Banco de dados não disponível"
        });
      }

      // 1. Buscar skills relevantes baseado na mensagem
      const palavrasChave = mensagem.toLowerCase().split(' ').filter((p: string) => p.length > 3);
      const skillsRelevantes = await db
        .select()
        .from(skills)
        .where(
          sql`LOWER(${skills.nome}) LIKE '%${palavrasChave[0]}%' OR 
              LOWER(${skills.descricao}) LIKE '%${palavrasChave[0]}%' OR
              LOWER(${skills.tags}) LIKE '%${palavrasChave[0]}%'`
        )
        .limit(3);

      // 2. Buscar contexto anterior da sessão
      const contextosAnteriores = await db
        .select()
        .from(cometContexto)
        .where(eq(cometContexto.sessionId, sessionId))
        .orderBy(desc(cometContexto.timestamp))
        .limit(5);

      // 3. Buscar preferências do usuário
      const preferencias = await db
        .select()
        .from(cometPreferencias)
        .where(sql`${cometPreferencias.confianca} > 70`)
        .orderBy(desc(cometPreferencias.confianca));

      // 4. Salvar contexto atual
      await db.insert(cometContexto).values({
        sessionId,
        mensagemUsuario: mensagem,
        contexto: JSON.stringify({
          contextoAnterior: contextoAnterior || {},
          skillsEncontradas: skillsRelevantes.length,
          timestamp: new Date().toISOString()
        })
      });

      // 5. Retornar resposta estruturada
      res.json({
        sucesso: true,
        dados: {
          skillsRelevantes: skillsRelevantes.map(s => ({
            nome: s.nome,
            descricao: s.descricao,
            instrucoes: s.instrucoes,
            exemplo: s.exemplo,
            autonomiaNivel: s.autonomiaNivel,
            taxaSucesso: s.sucessoCount && s.usoCount 
              ? Math.round((s.sucessoCount / s.usoCount) * 100) 
              : 0
          })),
          contexto: {
            mensagensAnteriores: contextosAnteriores.map(c => ({
              mensagemUsuario: c.mensagemUsuario,
              mensagemComet: c.mensagemComet,
              timestamp: c.timestamp
            })),
            preferencias: preferencias.map(p => ({
              chave: p.chave,
              valor: p.valor,
              tipo: p.tipo,
              categoria: p.categoria,
              confianca: p.confianca
            }))
          },
          recomendacoes: {
            usarSkill: skillsRelevantes.length > 0,
            skillRecomendada: skillsRelevantes[0]?.nome,
            autonomia: skillsRelevantes[0]?.autonomiaNivel || "media"
          }
        }
      });

    } catch (error) {
      console.error("[Comet API] Erro ao processar:", error);
      res.status(500).json({
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  /**
   * POST /api/comet/buscar-arquivos
   * Busca arquivos em todo o computador com filtros avançados
   */
  app.post("/api/comet/buscar-arquivos", async (req: Request, res: Response) => {
    try {
      const { query, tipo, tamanhoMin, tamanhoMax, dataInicio, dataFim, limite = 50 } = req.body;

      const db = await getDb();
      if (!db) {
        return res.status(500).json({
          sucesso: false,
          erro: "Banco de dados não disponível"
        });
      }

      // Construir query dinâmica
      let conditions = [];
      
      if (query) {
        conditions.push(
          sql`LOWER(${cometArquivos.nome}) LIKE '%${query.toLowerCase()}%' OR 
              LOWER(${cometArquivos.conteudoIndexado}) LIKE '%${query.toLowerCase()}%'`
        );
      }
      
      if (tipo) {
        conditions.push(eq(cometArquivos.tipo, tipo));
      }
      
      if (tamanhoMin) {
        conditions.push(sql`${cometArquivos.tamanho} >= ${tamanhoMin}`);
      }
      
      if (tamanhoMax) {
        conditions.push(sql`${cometArquivos.tamanho} <= ${tamanhoMax}`);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const arquivos = await db
        .select()
        .from(cometArquivos)
        .where(whereClause)
        .limit(limite);

      res.json({
        sucesso: true,
        dados: {
          total: arquivos.length,
          arquivos: arquivos.map(a => ({
            caminho: a.caminho,
            nome: a.nome,
            tipo: a.tipo,
            tamanho: a.tamanho,
            dataModificacao: a.dataModificacao,
            preview: a.conteudoIndexado?.substring(0, 200)
          }))
        }
      });

    } catch (error) {
      console.error("[Comet API] Erro ao buscar arquivos:", error);
      res.status(500).json({
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  /**
   * POST /api/comet/atualizar-contexto
   * Atualiza o contexto de uma conversa com a resposta do Comet
   */
  app.post("/api/comet/atualizar-contexto", async (req: Request, res: Response) => {
    try {
      const { sessionId, mensagemComet, sucesso = true } = req.body;

      if (!sessionId || !mensagemComet) {
        return res.status(400).json({
          sucesso: false,
          erro: "sessionId e mensagemComet são obrigatórios"
        });
      }

      const db = await getDb();
      if (!db) {
        return res.status(500).json({
          sucesso: false,
          erro: "Banco de dados não disponível"
        });
      }

      // Atualizar última mensagem da sessão
      const ultimoContexto = await db
        .select()
        .from(cometContexto)
        .where(eq(cometContexto.sessionId, sessionId))
        .orderBy(desc(cometContexto.timestamp))
        .limit(1);

      if (ultimoContexto.length > 0) {
        await db
          .update(cometContexto)
          .set({ 
            mensagemComet,
            contexto: JSON.stringify({
              ...JSON.parse(ultimoContexto[0].contexto || '{}'),
              sucesso,
              respondidoEm: new Date().toISOString()
            })
          })
          .where(eq(cometContexto.id, ultimoContexto[0].id));
      }

      res.json({
        sucesso: true,
        mensagem: "Contexto atualizado com sucesso"
      });

    } catch (error) {
      console.error("[Comet API] Erro ao atualizar contexto:", error);
      res.status(500).json({
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  /**
   * POST /api/comet/aprender
   * Registra uma preferência ou padrão aprendido
   */
  app.post("/api/comet/aprender", async (req: Request, res: Response) => {
    try {
      const { chave, valor, tipo, categoria, aumentarConfianca = true } = req.body;

      if (!chave || !valor || !tipo) {
        return res.status(400).json({
          sucesso: false,
          erro: "chave, valor e tipo são obrigatórios"
        });
      }

      const db = await getDb();
      if (!db) {
        return res.status(500).json({
          sucesso: false,
          erro: "Banco de dados não disponível"
        });
      }

      // Verificar se preferência já existe
      const existente = await db
        .select()
        .from(cometPreferencias)
        .where(eq(cometPreferencias.chave, chave))
        .limit(1);

      if (existente.length > 0) {
        // Atualizar e aumentar confiança
        const novaConfianca = aumentarConfianca 
          ? Math.min(100, (existente[0].confianca || 50) + 10)
          : Math.max(0, (existente[0].confianca || 50) - 10);

        await db
          .update(cometPreferencias)
          .set({
            valor,
            confianca: novaConfianca,
            ultimaAtualizacao: new Date()
          })
          .where(eq(cometPreferencias.id, existente[0].id));

        res.json({
          sucesso: true,
          mensagem: "Preferência atualizada",
          confianca: novaConfianca
        });
      } else {
        // Criar nova preferência
        await db.insert(cometPreferencias).values({
          chave,
          valor,
          tipo,
          categoria: categoria || 'geral',
          confianca: 50
        });

        res.json({
          sucesso: true,
          mensagem: "Preferência criada",
          confianca: 50
        });
      }

    } catch (error) {
      console.error("[Comet API] Erro ao aprender:", error);
      res.status(500).json({
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  /**
   * GET /api/comet/status
   * Retorna status do sistema e estatísticas
   */
  app.get("/api/comet/status", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.status(500).json({
          sucesso: false,
          erro: "Banco de dados não disponível"
        });
      }

      // Estatísticas gerais
      const totalSkills = await db.select({ count: sql<number>`count(*)` }).from(skills);
      const totalContextos = await db.select({ count: sql<number>`count(*)` }).from(cometContexto);
      const totalArquivos = await db.select({ count: sql<number>`count(*)` }).from(cometArquivos);
      const totalPreferencias = await db.select({ count: sql<number>`count(*)` }).from(cometPreferencias);

      res.json({
        sucesso: true,
        status: "online",
        versao: "2.0.0",
        estatisticas: {
          skills: totalSkills[0]?.count || 0,
          contextos: totalContextos[0]?.count || 0,
          arquivosIndexados: totalArquivos[0]?.count || 0,
          preferenciasAprendidas: totalPreferencias[0]?.count || 0
        },
        capacidades: {
          processarPedidos: true,
          buscarArquivos: true,
          gerenciarContexto: true,
          aprenderPreferencias: true,
          usarSkills: true
        }
      });

    } catch (error) {
      console.error("[Comet API] Erro ao obter status:", error);
      res.status(500).json({
        sucesso: false,
        erro: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  console.log("[Comet API] Rotas registradas com sucesso");
}
