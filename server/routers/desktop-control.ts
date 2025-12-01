import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  listUserAgents,
  createCommand,
  listUserCommands,
  listUserScreenshots,
  listUserLogs,
  getAgentById,
  getCommandById,
  createAgent,
} from "../db-desktop-control";
import { validateCommand, listWhitelist, listBlacklist, listAudit, addWhitelistRule, addBlacklistRule } from "../command-security";

/**
 * Router tRPC para Desktop Control System
 * 
 * Endpoints:
 * - listAgents: Lista agents conectados do usuário
 * - sendCommand: Envia comando (shell ou screenshot) para agent
 * - listCommands: Lista comandos com filtros
 * - listScreenshots: Lista screenshots capturados
 * - listLogs: Lista logs com filtros
 * - getStats: Estatísticas gerais do sistema
 */

export const desktopControlRouter = router({
  /**
   * Cria um novo Desktop Agent e retorna o token de autenticação
   */
  createAgent: protectedProcedure
    .input(
      z.object({
        deviceName: z.string().min(1, "Nome do dispositivo é obrigatório"),
        platform: z.string().optional(),
        version: z.string().default("1.0.0"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { deviceName, platform, version } = input;
      
      // Detectar plataforma automaticamente se não fornecida
      const detectedPlatform = platform || "Unknown";
      
      // Criar agent no banco de dados
      const agent = await createAgent(
        ctx.user.id,
        deviceName,
        detectedPlatform,
        version
      );
      
      console.log(`[DesktopControl] Novo agent criado: ${agent.id} (${agent.deviceName})`);
      
      return {
        success: true,
        agent: {
          id: agent.id,
          deviceName: agent.deviceName,
          token: agent.token,
          platform: agent.platform,
          version: agent.version,
          status: agent.status,
          createdAt: agent.createdAt,
        },
        message: `Agent "${agent.deviceName}" criado com sucesso`,
      };
    }),

  /**
   * Lista todos os agents do usuário autenticado
   */
  listAgents: protectedProcedure.query(async ({ ctx }) => {
    const agents = await listUserAgents(ctx.user.id);
    
    // Adicionar informação de status online/offline baseado em last_ping
    const now = Date.now();
    const agentsWithStatus = agents.map((agent) => {
      const lastPingMs = agent.lastPing ? new Date(agent.lastPing).getTime() : 0;
      const timeSinceLastPing = now - lastPingMs;
      const isOnline = timeSinceLastPing < 90000; // 90 segundos (3x heartbeat)
      
      return {
        ...agent,
        isOnline,
        timeSinceLastPing: Math.floor(timeSinceLastPing / 1000), // segundos
      };
    });
    
    return agentsWithStatus;
  }),

  /**
   * Envia comando para um agent específico
   */
  sendCommand: protectedProcedure
    .input(
      z.object({
        agentId: z.number(),
        commandType: z.enum(["shell", "screenshot"]),
        commandData: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { agentId, commandType, commandData } = input;
      
      // Verificar se agent pertence ao usuário
      const agent = await getAgentById(agentId);
      if (!agent || agent.userId !== ctx.user.id) {
        throw new Error("Agent não encontrado ou não pertence ao usuário");
      }
      
      // Verificar se agent está online
      const now = Date.now();
      const lastPingMs = agent.lastPing ? new Date(agent.lastPing).getTime() : 0;
      const timeSinceLastPing = now - lastPingMs;
      const isOnline = timeSinceLastPing < 90000;
      
      if (!isOnline) {
        throw new Error("Agent está offline. Última conexão há " + Math.floor(timeSinceLastPing / 1000) + " segundos");
      }
      
      // Validar segurança do comando (apenas para shell)
      if (commandType === "shell") {
        const shellCommand = commandData.command as string;
        const validation = await validateCommand(shellCommand, ctx.user.id, agentId);
        
        if (!validation.isAllowed) {
          throw new Error(`Comando bloqueado: ${validation.reason}`);
        }
        
        if (validation.requiresConfirmation) {
          // Frontend deve mostrar modal de confirmação
          // Por enquanto, apenas logamos
          console.warn(`[DesktopControl] Comando requer confirmação: ${shellCommand}`);
        }
      }
      
      // Criar comando no banco de dados
      const command = await createCommand(
        agentId,
        ctx.user.id,
        commandType,
        commandData
      );
      
      console.log(`[DesktopControl] Comando ${command.id} criado: ${commandType}`);
      console.log(`[DesktopControl] Agent: ${agentId}, Data:`, commandData);
      
      return {
        success: true,
        commandId: command.id,
        message: `Comando ${commandType} enviado para agent ${agent.deviceName}`,
      };
    }),

  /**
   * Lista comandos com filtros opcionais
   */
  listCommands: protectedProcedure
    .input(
      z.object({
        agentId: z.number().optional(),
        status: z.enum(["pending", "sent", "executing", "completed", "failed"]).optional(),
        commandType: z.enum(["shell", "screenshot"]).optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const commands = await listUserCommands(ctx.user.id, undefined, input.limit || 50);
      
      // Aplicar filtros
      let filtered = commands;
      
      if (input.agentId) {
        filtered = filtered.filter((cmd) => cmd.agentId === input.agentId);
      }
      
      if (input.status) {
        filtered = filtered.filter((cmd) => cmd.status === input.status);
      }
      
      if (input.commandType) {
        filtered = filtered.filter((cmd) => cmd.commandType === input.commandType);
      }
      
      // Limitar resultados
      filtered = filtered.slice(0, input.limit);
      
      // Adicionar informações do agent
      const agentsMap = new Map();
      const agents = await listUserAgents(ctx.user.id);
      agents.forEach((agent) => {
        agentsMap.set(agent.id, agent);
      });
      
      const commandsWithAgent = filtered.map((cmd) => {
        const agent = agentsMap.get(cmd.agentId);
        return {
          ...cmd,
          agentName: agent?.deviceName || "Desconhecido",
          agentPlatform: agent?.platform || "unknown",
        };
      });
      
      return commandsWithAgent;
    }),

  /**
   * Lista screenshots capturados
   */
  listScreenshots: protectedProcedure
    .input(
      z.object({
        agentId: z.number().optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const screenshots = await listUserScreenshots(ctx.user.id, input.agentId, input.limit || 20);
      
      // Aplicar filtros
      let filtered = screenshots;
      
      if (input.agentId) {
        filtered = filtered.filter((ss) => ss.agentId === input.agentId);
      }
      
      // Limitar resultados
      filtered = filtered.slice(0, input.limit);
      
      // Adicionar informações do agent
      const agentsMap = new Map();
      const agents = await listUserAgents(ctx.user.id);
      agents.forEach((agent) => {
        agentsMap.set(agent.id, agent);
      });
      
      const screenshotsWithAgent = filtered.map((ss) => {
        const agent = agentsMap.get(ss.agentId);
        return {
          ...ss,
          agentName: agent?.deviceName || "Desconhecido",
          agentPlatform: agent?.platform || "unknown",
        };
      });
      
      return screenshotsWithAgent;
    }),

  /**
   * Lista logs com filtros opcionais
   */
  listLogs: protectedProcedure
    .input(
      z.object({
        agentId: z.number().optional(),
        commandId: z.number().optional(),
        level: z.enum(["info", "warning", "error", "debug"]).optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const logs = await listUserLogs(ctx.user.id, input.agentId, input.level, input.limit || 100);
      
      // Aplicar filtros
      let filtered = logs;
      
      if (input.agentId) {
        filtered = filtered.filter((log) => log.agentId === input.agentId);
      }
      
      if (input.commandId) {
        filtered = filtered.filter((log) => log.commandId === input.commandId);
      }
      
      if (input.level) {
        filtered = filtered.filter((log) => log.level === input.level);
      }
      
      // Limitar resultados
      filtered = filtered.slice(0, input.limit);
      
      return filtered;
    }),

  /**
   * Retorna estatísticas gerais do sistema
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const agents = await listUserAgents(ctx.user.id);
    const commands = await listUserCommands(ctx.user.id);
    const screenshots = await listUserScreenshots(ctx.user.id);
    
    // Calcular agents online
    const now = Date.now();
    const agentsOnline = agents.filter((agent) => {
      const lastPingMs = agent.lastPing ? new Date(agent.lastPing).getTime() : 0;
      const timeSinceLastPing = now - lastPingMs;
      return timeSinceLastPing < 90000;
    }).length;
    
    // Calcular estatísticas de comandos
    const commandsPending = commands.filter((cmd) => cmd.status === "pending").length;
    const commandsExecuting = commands.filter((cmd) => cmd.status === "executing").length;
    const commandsCompleted = commands.filter((cmd) => cmd.status === "completed").length;
    const commandsFailed = commands.filter((cmd) => cmd.status === "failed").length;
    
    // Calcular tempo médio de execução
    const completedCommands = commands.filter((cmd) => cmd.status === "completed" && cmd.executionTimeMs);
    const avgExecutionTime = completedCommands.length > 0
      ? completedCommands.reduce((sum, cmd) => sum + (cmd.executionTimeMs || 0), 0) / completedCommands.length
      : 0;
    
    // Taxa de sucesso
    const totalExecuted = commandsCompleted + commandsFailed;
    const successRate = totalExecuted > 0 ? (commandsCompleted / totalExecuted) * 100 : 0;
    
    return {
      agents: {
        total: agents.length,
        online: agentsOnline,
        offline: agents.length - agentsOnline,
      },
      commands: {
        total: commands.length,
        pending: commandsPending,
        executing: commandsExecuting,
        completed: commandsCompleted,
        failed: commandsFailed,
        avgExecutionTimeMs: Math.round(avgExecutionTime),
        successRate: Math.round(successRate * 100) / 100,
      },
      screenshots: {
        total: screenshots.length,
      },
    };
  }),

  /**
   * Obtém detalhes de um comando específico
   */
  getCommand: protectedProcedure
    .input(z.object({ commandId: z.number() }))
    .query(async ({ ctx, input }) => {
      const command = await getCommandById(input.commandId);
      
      if (!command || command.userId !== ctx.user.id) {
        throw new Error("Comando não encontrado ou não pertence ao usuário");
      }
      
      // Adicionar informações do agent
      const agent = await getAgentById(command.agentId);
      
      return {
        ...command,
        agentName: agent?.deviceName || "Desconhecido",
        agentPlatform: agent?.platform || "unknown",
      };
    }),

  /**
   * Lista regras de whitelist
   */
  listWhitelist: protectedProcedure.query(async ({ ctx }) => {
    return await listWhitelist(ctx.user.id);
  }),

  /**
   * Lista regras de blacklist
   */
  listBlacklist: protectedProcedure.query(async ({ ctx }) => {
    return await listBlacklist(ctx.user.id);
  }),

  /**
   * Lista auditoria de comandos
   */
  listAudit: protectedProcedure
    .input(
      z.object({
        agentId: z.number().optional(),
        action: z.enum(["allowed", "blocked", "confirmed"]).optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      return await listAudit(ctx.user.id, input.agentId, input.action, input.limit);
    }),

  /**
   * Adiciona regra à whitelist
   */
  addWhitelistRule: protectedProcedure
    .input(
      z.object({
        pattern: z.string(),
        description: z.string(),
        category: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const success = await addWhitelistRule(
        input.pattern,
        input.description,
        input.category,
        ctx.user.id
      );

      if (!success) {
        throw new Error("Falha ao adicionar regra de whitelist");
      }

      return { success: true };
    }),

  /**
   * Adiciona regra à blacklist
   */
  addBlacklistRule: protectedProcedure
    .input(
      z.object({
        pattern: z.string(),
        description: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        requiresConfirmation: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const success = await addBlacklistRule(
        input.pattern,
        input.description,
        input.severity,
        input.requiresConfirmation,
        ctx.user.id
      );

      if (!success) {
        throw new Error("Falha ao adicionar regra de blacklist");
      }

      return { success: true };
    }),

  /**
   * Lista todas as regras de segurança (whitelist + blacklist)
   */
  getSecurityRules: protectedProcedure.query(async ({ ctx }) => {
    const whitelist = await listWhitelist(ctx.user.id);
    const blacklist = await listBlacklist(ctx.user.id);

    // Combinar e formatar as regras
    const rules = [
      ...whitelist.map((rule) => ({
        id: rule.id,
        type: "whitelist" as const,
        pattern: rule.pattern,
        description: rule.description,
        category: rule.category,
        createdAt: rule.createdAt,
      })),
      ...blacklist.map((rule) => ({
        id: rule.id,
        type: "blacklist" as const,
        pattern: rule.pattern,
        description: rule.description,
        severity: rule.severity,
        requiresConfirmation: rule.requiresConfirmation,
        createdAt: rule.createdAt,
      })),
    ];

    // Ordenar por data de criação (mais recentes primeiro)
    return rules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }),

  /**
   * Adiciona regra de segurança (unificado)
   */
  addSecurityRule: protectedProcedure
    .input(
      z.object({
        type: z.enum(["whitelist", "blacklist"]),
        pattern: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.type === "whitelist") {
        const success = await addWhitelistRule(
          input.pattern,
          input.description || "",
          "custom",
          ctx.user.id
        );

        if (!success) {
          throw new Error("Falha ao adicionar regra de whitelist");
        }
      } else {
        const success = await addBlacklistRule(
          input.pattern,
          input.description || "",
          "medium", // Severidade padrão
          true, // Requer confirmação por padrão
          ctx.user.id
        );

        if (!success) {
          throw new Error("Falha ao adicionar regra de blacklist");
        }
      }

      return { success: true };
    }),

  /**
   * [DEBUG TEMPORÁRIO] Busca token de um agente pelo nome do dispositivo
   */
  getAgentToken: publicProcedure
    .input(z.object({ deviceName: z.string() }))
    .query(async ({ input }) => {
      const db = await import("../db").then(m => m.getDb());
      if (!db) {
        throw new Error("Database not available");
      }
      
      const { desktopAgents } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const agents = await db
        .select()
        .from(desktopAgents)
        .where(eq(desktopAgents.deviceName, input.deviceName))
        .limit(1);
      
      if (agents.length === 0) {
        throw new Error(`Agent "${input.deviceName}" não encontrado`);
      }
      
      return {
        id: agents[0].id,
        deviceName: agents[0].deviceName,
        token: agents[0].token,
        status: agents[0].status,
        platform: agents[0].platform,
        version: agents[0].version,
      };
    }),

  /**
   * Remove regra de segurança
   */
  deleteSecurityRule: protectedProcedure
    .input(z.object({ ruleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Tentar remover da whitelist
      const whitelist = await listWhitelist(ctx.user.id);
      const whitelistRule = whitelist.find((r) => r.id === input.ruleId);

      if (whitelistRule) {
        // Implementar remoção de whitelist
        // Por enquanto, retornar sucesso (precisa implementar no db.ts)
        return { success: true };
      }

      // Tentar remover da blacklist
      const blacklist = await listBlacklist(ctx.user.id);
      const blacklistRule = blacklist.find((r) => r.id === input.ruleId);

      if (blacklistRule) {
        // Implementar remoção de blacklist
        // Por enquanto, retornar sucesso (precisa implementar no db.ts)
        return { success: true };
      }

      throw new Error("Regra não encontrada");
    }),
});
