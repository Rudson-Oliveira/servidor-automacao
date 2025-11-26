/**
 * Router tRPC para Controle Remoto do Obsidian
 * Expõe API para interface web controlar agentes locais
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import { getObsidianWebSocket } from '../_core/obsidian-websocket';

export const obsidianRemoteRouter = router({
  /**
   * Lista todos os agentes conectados
   */
  listAgents: publicProcedure.query(async () => {
    const wsServer = getObsidianWebSocket();
    const clients = wsServer.listClients();
    
    return {
      agents: clients.map((client) => ({
        id: client.id,
        vaultPath: client.vaultPath,
        connectedAt: client.connectedAt.toISOString(),
        lastActivity: client.lastActivity.toISOString(),
        status: 'connected',
      })),
      total: clients.length,
    };
  }),

  /**
   * Lista arquivos do vault
   */
  listFiles: publicProcedure
    .input(z.object({
      agentId: z.string(),
    }))
    .query(async ({ input }) => {
      const wsServer = getObsidianWebSocket();
      
      const result = await wsServer.sendCommand(input.agentId, {
        command: 'list_files',
        params: {},
      });
      
      return result;
    }),

  /**
   * Lê conteúdo de um arquivo
   */
  readFile: publicProcedure
    .input(z.object({
      agentId: z.string(),
      path: z.string(),
    }))
    .query(async ({ input }) => {
      const wsServer = getObsidianWebSocket();
      
      const result = await wsServer.sendCommand(input.agentId, {
        command: 'read_file',
        params: { path: input.path },
      });
      
      return result;
    }),

  /**
   * Cria novo arquivo
   */
  createFile: publicProcedure
    .input(z.object({
      agentId: z.string(),
      path: z.string(),
      content: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const wsServer = getObsidianWebSocket();
      
      const result = await wsServer.sendCommand(input.agentId, {
        command: 'create_file',
        params: {
          path: input.path,
          content: input.content || '',
        },
      });
      
      return result;
    }),

  /**
   * Edita arquivo existente
   */
  writeFile: publicProcedure
    .input(z.object({
      agentId: z.string(),
      path: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ input }) => {
      const wsServer = getObsidianWebSocket();
      
      const result = await wsServer.sendCommand(input.agentId, {
        command: 'write_file',
        params: {
          path: input.path,
          content: input.content,
        },
      });
      
      return result;
    }),

  /**
   * Deleta arquivo
   */
  deleteFile: publicProcedure
    .input(z.object({
      agentId: z.string(),
      path: z.string(),
    }))
    .mutation(async ({ input }) => {
      const wsServer = getObsidianWebSocket();
      
      const result = await wsServer.sendCommand(input.agentId, {
        command: 'delete_file',
        params: { path: input.path },
      });
      
      return result;
    }),

  /**
   * Busca texto em todos os arquivos
   */
  search: publicProcedure
    .input(z.object({
      agentId: z.string(),
      query: z.string(),
    }))
    .query(async ({ input }) => {
      const wsServer = getObsidianWebSocket();
      
      const result = await wsServer.sendCommand(input.agentId, {
        command: 'search',
        params: { query: input.query },
      });
      
      return result;
    }),

  /**
   * Obtém estrutura de pastas do vault
   */
  getStructure: publicProcedure
    .input(z.object({
      agentId: z.string(),
    }))
    .query(async ({ input }) => {
      const wsServer = getObsidianWebSocket();
      
      const result = await wsServer.sendCommand(input.agentId, {
        command: 'get_structure',
        params: {},
      });
      
      return result;
    }),
});
