/**
 * ROUTER TRPC PARA AGENTES LOCAIS
 * =================================
 * 
 * Endpoints para gerenciar e controlar agentes locais instalados nos computadores dos usuários.
 * 
 * Funcionalidades:
 * - Listar agentes conectados
 * - Enviar comandos para agentes
 * - Ver histórico de comandos
 * - Atualizar permissões
 * - Ver mensagens recebidas
 * - Obter status de agentes
 * 
 * Autor: Sistema de Automação
 * Data: 2025-01-26
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { websocketAgenteServer } from "../_core/websocket-agente";
import { getDb } from "../db";
import { agentesLocais, comandosAgente, mensagensAgente } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export const agenteLocalRouter = router({
  /**
   * Lista todos os agentes (conectados e desconectados)
   */
  listar: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Banco de dados não disponível");
    }

    const agentes = await db
      .select()
      .from(agentesLocais)
      .orderBy(desc(agentesLocais.ultimoHeartbeat));

      return agentes.map((agente: any) => ({
      ...agente,
      sistema: agente.sistema ? JSON.parse(agente.sistema) : null,
      permissoes: agente.permissoes ? JSON.parse(agente.permissoes) : null,
    }));
  }),

  /**
   * Lista apenas agentes conectados
   */
  listarConectados: protectedProcedure.query(async () => {
    const agentesConectados = websocketAgenteServer.obterAgentesConectados();
    
    return agentesConectados.map(agente => ({
      id: agente.id,
      idAgente: agente.idAgente,
      sistema: agente.sistema,
      permissoes: agente.permissoes,
      conectadoEm: agente.conectadoEm,
      ultimoHeartbeat: agente.ultimoHeartbeat,
      status: agente.status,
    }));
  }),

  /**
   * Obtém detalhes de um agente específico
   */
  obter: protectedProcedure
    .input(z.object({
      idAgente: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Banco de dados não disponível");
      }

      const agentes = await db
        .select()
        .from(agentesLocais)
        .where(eq(agentesLocais.idAgente, input.idAgente))
        .limit(1);

      if (agentes.length === 0) {
        throw new Error("Agente não encontrado");
      }

      const agente = agentes[0];

      return {
        ...agente,
        sistema: agente.sistema ? JSON.parse(agente.sistema) : null,
        permissoes: agente.permissoes ? JSON.parse(agente.permissoes) : null,
      };
    }),

  /**
   * Envia comando para um agente
   */
  enviarComando: protectedProcedure
    .input(z.object({
      idAgente: z.string(),
      comando: z.string(),
      parametros: z.record(z.string(), z.any()).optional(),
      timeoutMs: z.number().optional().default(60000),
    }))
    .mutation(async ({ input }) => {
      try {
        const resultado = await websocketAgenteServer.enviarComando(
          input.idAgente,
          input.comando,
          input.parametros || {},
          input.timeoutMs
        );

        return {
          sucesso: true,
          resultado,
        };
      } catch (error: any) {
        return {
          sucesso: false,
          erro: error.message,
        };
      }
    }),

  /**
   * Lista histórico de comandos de um agente
   */
  historicoComandos: protectedProcedure
    .input(z.object({
      idAgente: z.string(),
      limite: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Banco de dados não disponível");
      }

      const comandos = await db
        .select()
        .from(comandosAgente)
        .where(eq(comandosAgente.idAgente, input.idAgente))
        .orderBy(desc(comandosAgente.criadoEm))
        .limit(input.limite);

      return comandos.map((cmd: any) => ({
        ...cmd,
        parametros: cmd.parametros ? JSON.parse(cmd.parametros) : null,
        resposta: cmd.resposta ? JSON.parse(cmd.resposta) : null,
      }));
    }),

  /**
   * Lista mensagens recebidas de um agente
   */
  mensagens: protectedProcedure
    .input(z.object({
      idAgente: z.string(),
      tipo: z.string().optional(),
      limite: z.number().optional().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Banco de dados não disponível");
      }

      let mensagens;
      
      if (input.tipo) {
        mensagens = await db
          .select()
          .from(mensagensAgente)
          .where(and(
            eq(mensagensAgente.idAgente, input.idAgente),
            eq(mensagensAgente.tipo, input.tipo)
          ))
          .orderBy(desc(mensagensAgente.timestamp))
          .limit(input.limite);
      } else {
        mensagens = await db
          .select()
          .from(mensagensAgente)
          .where(eq(mensagensAgente.idAgente, input.idAgente))
          .orderBy(desc(mensagensAgente.timestamp))
          .limit(input.limite);
      }

      return mensagens.map((msg: any) => ({
        ...msg,
        dados: msg.dados ? JSON.parse(msg.dados) : null,
      }));
    }),

  /**
   * Atualiza permissões de um agente
   */
  atualizarPermissoes: protectedProcedure
    .input(z.object({
      idAgente: z.string(),
      permissoes: z.record(z.string(), z.boolean()),
    }))
    .mutation(async ({ input }) => {
      try {
        const resultado = await websocketAgenteServer.enviarComando(
          input.idAgente,
          "atualizar_permissoes",
          { permissoes: input.permissoes }
        );

        // Atualizar no banco
        const db = await getDb();
        if (db) {
          await db
            .update(agentesLocais)
            .set({
              permissoes: JSON.stringify(input.permissoes),
              updatedAt: new Date(),
            })
            .where(eq(agentesLocais.idAgente, input.idAgente));
        }

        return {
          sucesso: true,
          resultado,
        };
      } catch (error: any) {
        return {
          sucesso: false,
          erro: error.message,
        };
      }
    }),

  /**
   * Captura screenshot do desktop
   */
  capturarTela: protectedProcedure
    .input(z.object({
      idAgente: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const resultado = await websocketAgenteServer.enviarComando(
          input.idAgente,
          "desktop_capture",
          {},
          120000 // 2 minutos (screenshot pode demorar)
        );

        return {
          sucesso: true,
          screenshot: resultado.screenshot,
          largura: resultado.largura,
          altura: resultado.altura,
          timestamp: resultado.timestamp,
        };
      } catch (error: any) {
        return {
          sucesso: false,
          erro: error.message,
        };
      }
    }),

  /**
   * Executa skill Python no agente
   */
  executarSkill: protectedProcedure
    .input(z.object({
      idAgente: z.string(),
      scriptPath: z.string(),
      args: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const resultado = await websocketAgenteServer.enviarComando(
          input.idAgente,
          "executar_skill",
          {
            script_path: input.scriptPath,
            args: input.args || [],
          },
          300000 // 5 minutos
        );

        return {
          sucesso: resultado.sucesso,
          codigoRetorno: resultado.codigo_retorno,
          stdout: resultado.stdout,
          stderr: resultado.stderr,
        };
      } catch (error: any) {
        return {
          sucesso: false,
          erro: error.message,
        };
      }
    }),

  /**
   * Cria nota no Obsidian através do agente
   */
  criarNotaObsidian: protectedProcedure
    .input(z.object({
      idAgente: z.string(),
      titulo: z.string(),
      conteudo: z.string(),
      pasta: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const resultado = await websocketAgenteServer.enviarComando(
          input.idAgente,
          "criar_nota_obsidian",
          {
            titulo: input.titulo,
            conteudo: input.conteudo,
            pasta: input.pasta,
          }
        );

        return {
          sucesso: true,
          caminho: resultado.caminho,
        };
      } catch (error: any) {
        return {
          sucesso: false,
          erro: error.message,
        };
      }
    }),

  /**
   * Obtém informações do sistema do agente
   */
  infoSistema: protectedProcedure
    .input(z.object({
      idAgente: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const resultado = await websocketAgenteServer.enviarComando(
          input.idAgente,
          "info_sistema"
        );

        return {
          sucesso: true,
          info: resultado,
        };
      } catch (error: any) {
        return {
          sucesso: false,
          erro: error.message,
        };
      }
    }),

  /**
   * Lista processos em execução no agente
   */
  listarProcessos: protectedProcedure
    .input(z.object({
      idAgente: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const processos = await websocketAgenteServer.enviarComando(
          input.idAgente,
          "listar_processos"
        );

        return {
          sucesso: true,
          processos,
        };
      } catch (error: any) {
        return {
          sucesso: false,
          erro: error.message,
        };
      }
    }),

  /**
   * Ping para verificar se agente está respondendo
   */
  ping: protectedProcedure
    .input(z.object({
      idAgente: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const resultado = await websocketAgenteServer.enviarComando(
          input.idAgente,
          "ping",
          {},
          5000 // 5 segundos
        );

        return {
          sucesso: true,
          pong: resultado.pong,
          timestamp: resultado.timestamp,
        };
      } catch (error: any) {
        return {
          sucesso: false,
          erro: error.message,
        };
      }
    }),
});
