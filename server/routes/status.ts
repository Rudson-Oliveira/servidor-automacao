import type { Express } from "express";
import { getDb } from "../db";
import { conversas } from "../../drizzle/schema";
import { count, eq, sql } from "drizzle-orm";

export function registerStatusRoutes(app: Express) {
  // GET /api/status - Retorna status do sistema
  app.get("/api/status", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        return res.json({
          online: true,
          versao: "1.0.0",
          ultima_atualizacao: new Date().toISOString(),
          total_requisicoes: 0,
          erros_corrigidos: 0,
        });
      }

      // Buscar estatísticas do banco
      const totalRequests = await db
        .select({ count: count() })
        .from(conversas);

      const errorsFixed = await db
        .select({ count: count() })
        .from(conversas)
        .where(eq(conversas.tipo, "erro_corrigido"));

      res.json({
        online: true,
        versao: "1.0.0",
        ultima_atualizacao: new Date().toISOString(),
        total_requisicoes: totalRequests[0]?.count || 0,
        erros_corrigidos: errorsFixed[0]?.count || 0,
      });
    } catch (error) {
      console.error("Erro ao buscar status:", error);
      res.status(500).json({
        online: false,
        erro: "Erro ao buscar status do sistema",
      });
    }
  });
}
