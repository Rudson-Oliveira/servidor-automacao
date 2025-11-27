/**
 * MÓDULO: APIs tRPC para Agentes Locais
 * Endpoints para gerenciar tokens, agentes e comandos
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { wsAgentServer } from "../_core/websocket-agente";
import { getDb } from "../db";
import { agenteTokens, agenteExecucoes } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

export const agenteRouter = router({
  /**
   * Gerar novo token de autenticação
   */
  gerarToken: protectedProcedure
    .input(
      z.object({
        nome: z.string().min(1, "Nome obrigatório").max(255),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const token = randomBytes(32).toString("hex");

      await db.insert(agenteTokens).values({
        token,
        nome: input.nome,
        ativo: 1,
      });

      return {
        success: true,
        token,
        nome: input.nome,
        message: `Token gerado para "${input.nome}". Guarde em local seguro!`,
      };
    }),

  /**
   * Listar tokens (sem expor token completo)
   */
  listarTokens: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const tokens = await db
      .select()
      .from(agenteTokens)
      .orderBy(desc(agenteTokens.criadoEm));

    return tokens.map((t) => ({
      id: t.id,
      nome: t.nome,
      tokenParcial: `${t.token.substring(0, 8)}...${t.token.substring(56)}`,
      ativo: t.ativo === 1,
      criadoEm: t.criadoEm,
      ultimoUso: t.ultimoUso,
    }));
  }),

  /**
   * Desativar token
   */
  desativarToken: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(agenteTokens)
        .set({ ativo: 0 })
        .where(eq(agenteTokens.id, input.id));

      return { success: true, message: "Token desativado" };
    }),

  /**
   * Listar agentes conectados
   */
  listarAgentes: protectedProcedure.query(() => {
    return wsAgentServer.getAgents();
  }),

  /**
   * Enviar comando para agente
   */
  enviarComando: protectedProcedure
    .input(
      z.object({
        agenteId: z.string(),
        comando: z.string(),
        parametros: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const success = wsAgentServer.sendCommand(
        input.agenteId,
        input.comando,
        input.parametros || {}
      );

      if (!success) {
        throw new Error("Agente offline ou não encontrado");
      }

      return {
        success: true,
        message: "Comando enviado com sucesso",
      };
    }),

  /**
   * Desconectar agente
   */
  desconectarAgente: protectedProcedure
    .input(z.object({ agenteId: z.string() }))
    .mutation(({ input }) => {
      const success = wsAgentServer.disconnectAgent(input.agenteId);

      if (!success) {
        throw new Error("Agente não encontrado");
      }

      return {
        success: true,
        message: "Agente desconectado",
      };
    }),

  /**
   * Histórico de execuções
   */
  historico: protectedProcedure
    .input(
      z.object({
        agenteId: z.string().optional(),
        limite: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let execucoes;

      if (input.agenteId) {
        execucoes = await db
          .select()
          .from(agenteExecucoes)
          .where(eq(agenteExecucoes.agenteId, input.agenteId))
          .orderBy(desc(agenteExecucoes.executadoEm))
          .limit(input.limite);
      } else {
        execucoes = await db
          .select()
          .from(agenteExecucoes)
          .orderBy(desc(agenteExecucoes.executadoEm))
          .limit(input.limite);
      }

      return execucoes;
    }),

  /**
   * Estatísticas de execuções
   */
  estatisticas: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const execucoes = await db.select().from(agenteExecucoes);

    const total = execucoes.length;
    const sucesso = execucoes.filter((e) => e.status === "sucesso").length;
    const erro = execucoes.filter((e) => e.status === "erro").length;
    const timeout = execucoes.filter((e) => e.status === "timeout").length;

    const duracaoMedia =
      execucoes.reduce((acc, e) => acc + (e.duracaoMs || 0), 0) / (total || 1);

    return {
      total,
      sucesso,
      erro,
      timeout,
      taxaSucesso: total > 0 ? ((sucesso / total) * 100).toFixed(1) : "0.0",
      duracaoMediaMs: Math.round(duracaoMedia),
    };
  }),
});
