import type { Express } from "express";
import { getDb } from "../db";
import { conversas } from "../../drizzle/schema";
import { desc } from "drizzle-orm";

export function registerHistoricoRoutes(app: Express) {
  // GET /api/historico - Retorna histórico de conversas com paginação
  app.get("/api/historico", async (req, res) => {
    try {
      const db = await getDb();
      
      if (!db) {
        return res.json({
          sucesso: true,
          historico: [],
          paginacao: {
            pagina: 1,
            limite: 50,
            total: 0,
            totalPaginas: 0,
          },
        });
      }

      // Parâmetros de paginação
      const pagina = Math.max(1, parseInt(req.query.page as string) || 1);
      const limite = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
      const offset = (pagina - 1) * limite;

      // Contar total de registros
      const [countResult] = await db
        .select({ count: conversas.id })
        .from(conversas);
      const total = countResult?.count || 0;
      const totalPaginas = Math.ceil(total / limite);

      // Buscar conversas com paginação
      const resultado = await db
        .select()
        .from(conversas)
        .orderBy(desc(conversas.createdAt))
        .limit(limite)
        .offset(offset);

      res.json({
        sucesso: true,
        historico: resultado.map((c) => ({
          timestamp: c.createdAt,
          tipo: c.tipo,
          mensagem: c.mensagem,
        })),
        paginacao: {
          pagina,
          limite,
          total,
          totalPaginas,
          temProxima: pagina < totalPaginas,
          temAnterior: pagina > 1,
        },
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
