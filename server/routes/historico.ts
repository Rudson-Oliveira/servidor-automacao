import type { Express } from "express";
import { getDb } from "../db";
import { conversas } from "../../drizzle/schema";
import { desc } from "drizzle-orm";

export function registerHistoricoRoutes(app: Express) {
  // GET /api/historico - Retorna histórico de conversas
  app.get("/api/historico", async (req, res) => {
    try {
      const db = await getDb();
      
      if (!db) {
        return res.json({
          sucesso: true,
          historico: [],
        });
      }

      // Buscar últimas 50 conversas
      const resultado = await db
        .select()
        .from(conversas)
        .orderBy(desc(conversas.createdAt))
        .limit(50);

      res.json({
        sucesso: true,
        historico: resultado.map((c) => ({
          timestamp: c.createdAt,
          tipo: c.tipo,
          mensagem: c.mensagem,
        })),
      });
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      res.status(500).json({
        sucesso: false,
        erro: "Erro ao buscar histórico",
      });
    }
  });
}
