/**
 * Desktop Agent - Auto Registration Endpoint
 * Permite que o instalador gere tokens automaticamente
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { getDb } from "../db";
import { desktopAgents } from "../../drizzle/schema";

const autoRegisterSchema = z.object({
  deviceName: z.string().min(1, "Nome do dispositivo é obrigatório"),
  platform: z.string().optional(),
  version: z.string().optional(),
});

export const desktopAuthRouter = router({
  /**
   * Endpoint público para auto-registro de agents
   * Usado pelo instalador automático
   */
  autoRegister: publicProcedure
    .input(autoRegisterSchema)
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados não disponível",
          });
        }

        // Gerar token seguro
        const token = crypto.randomBytes(32).toString("hex");

        // Criar agent no banco (userId = 1 para agents públicos)
        const [result] = await db
          .insert(desktopAgents)
          .values({
            userId: 1, // Agent público (sem autenticação de usuário)
            deviceName: input.deviceName,
            token,
            status: "offline",
            platform: input.platform || "unknown",
            version: input.version || "1.0.0",
          })
          .$returningId();

        const agentId = result.id;

        return {
          success: true,
          agentId,
          token,
          deviceName: input.deviceName,
          message: "Agent criado com sucesso! Use o token para conectar.",
        };
      } catch (error) {
        console.error("[Desktop Auth] Erro ao criar agent:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar agent",
        });
      }
    }),
});
