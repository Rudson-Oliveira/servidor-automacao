/**
 * 🚀 ROUTER DE INSTALAÇÃO
 * Endpoints para instalação programática de agentes desktop
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { desktopAgents } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * Gera token de autenticação para agente
 */
function generateAgentToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Gera ID único para agente
 */
function generateAgentId(): string {
  return `agent_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

export const installRouter = router({
  /**
   * POST /api/install/desktop-agent
   * Registra novo agente desktop e retorna token de autenticação
   */
  desktopAgent: publicProcedure
    .input(
      z.object({
        hostname: z.string().min(1, "Hostname é obrigatório"),
        machine_id: z.string().min(1, "Machine ID é obrigatório"),
        agent_version: z.string().default("1.0.0"),
        os: z.string().default("win32"),
        python_version: z.string().optional(),
        user_email: z.string().email().optional(),
        user_name: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database não disponível",
        });
      }

      try {
        // Verificar se agente já existe (por machine_id)
        const existingAgent = await db
          .select()
          .from(desktopAgents)
          .where(eq(desktopAgents.machineId, input.machine_id))
          .limit(1);

        if (existingAgent.length > 0) {
          // Agente já existe, retornar dados existentes
          const agent = existingAgent[0];
          
          // Atualizar last_seen
          await db
            .update(desktopAgents)
            .set({
              lastSeen: new Date(),
              status: "online",
              version: input.agent_version,
            })
            .where(eq(desktopAgents.id, agent.id));

          return {
            success: true,
            message: "Agente já registrado, token reutilizado",
            agent_id: agent.agentId,
            token: agent.token,
            is_new: false,
          };
        }

        // Criar novo agente
        const agentId = generateAgentId();
        const token = generateAgentToken();

        await db.insert(desktopAgents).values({
          agentId,
          hostname: input.hostname,
          machineId: input.machine_id,
          token,
          status: "online",
          version: input.agent_version,
          os: input.os,
          pythonVersion: input.python_version || null,
          lastSeen: new Date(),
        });

        return {
          success: true,
          message: "Agente registrado com sucesso",
          agent_id: agentId,
          token,
          is_new: true,
        };
      } catch (error) {
        console.error("[Install] Erro ao registrar agente:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao registrar agente",
        });
      }
    }),

  /**
   * POST /api/install/validate
   * Valida se instalação foi bem-sucedida
   */
  validate: publicProcedure
    .input(
      z.object({
        agent_id: z.string(),
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database não disponível",
        });
      }

      try {
        // Buscar agente
        const agent = await db
          .select()
          .from(desktopAgents)
          .where(eq(desktopAgents.agentId, input.agent_id))
          .limit(1);

        if (agent.length === 0) {
          return {
            valid: false,
            message: "Agente não encontrado",
          };
        }

        // Verificar token
        if (agent[0].token !== input.token) {
          return {
            valid: false,
            message: "Token inválido",
          };
        }

        // Atualizar last_seen
        await db
          .update(desktopAgents)
          .set({
            lastSeen: new Date(),
            status: "online",
          })
          .where(eq(desktopAgents.id, agent[0].id));

        return {
          valid: true,
          message: "Instalação validada com sucesso",
          agent: {
            id: agent[0].agentId,
            hostname: agent[0].hostname,
            status: agent[0].status,
            version: agent[0].version,
          },
        };
      } catch (error) {
        console.error("[Install] Erro ao validar instalação:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Falha ao validar instalação",
        });
      }
    }),

  /**
   * GET /api/install/status
   * Retorna status do sistema de instalação
   */
  status: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        available: false,
        message: "Sistema de instalação indisponível",
      };
    }

    try {
      // Contar agentes registrados
      const agents = await db.select().from(desktopAgents);

      return {
        available: true,
        message: "Sistema de instalação operacional",
        stats: {
          total_agents: agents.length,
          online_agents: agents.filter((a) => a.status === "online").length,
          offline_agents: agents.filter((a) => a.status === "offline").length,
        },
      };
    } catch (error) {
      console.error("[Install] Erro ao obter status:", error);
      return {
        available: false,
        message: "Erro ao obter status",
      };
    }
  }),
});
