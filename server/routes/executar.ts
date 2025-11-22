import type { Express } from "express";
import { getDb } from "../db";
import { execucoes } from "../../drizzle/schema";

export function registerExecutarRoutes(app: Express) {
  // POST /api/executar - Executa uma tarefa
  app.post("/api/executar", async (req, res) => {
    try {
      const { tarefa, url } = req.body;

      if (!tarefa) {
        return res.status(400).json({
          sucesso: false,
          erro: "Tarefa é obrigatória",
        });
      }

      const inicio = Date.now();

      // Detectar navegador pela URL
      const navegador = detectarNavegador(url);

      // Simular execução (em produção, aqui chamaria o sistema Python)
      const resultado = await executarTarefa(tarefa, navegador);

      const tempoExecucao = Date.now() - inicio;

      // Registrar execução no banco
      const db = await getDb();
      if (db) {
        await db.insert(execucoes).values({
          tarefa,
          navegador,
          planoBAtivado: resultado.planoBAtivado ? 1 : 0,
          sucesso: resultado.sucesso ? 1 : 0,
          tempoExecucao,
          resultado: resultado.mensagem,
          erro: resultado.erro || null,
        });
      }

      res.json({
        sucesso: resultado.sucesso,
        navegador,
        plano_b_ativado: resultado.planoBAtivado,
        tempo: tempoExecucao / 1000,
        resultado: resultado.mensagem,
      });
    } catch (error) {
      console.error("Erro ao executar tarefa:", error);
      res.status(500).json({
        sucesso: false,
        erro: "Erro ao executar tarefa",
      });
    }
  });
}

function detectarNavegador(url?: string): string {
  if (!url) return "desconhecido";

  const urlLower = url.toLowerCase();

  if (urlLower.includes("comet")) return "comet";
  if (urlLower.includes("abacus")) return "abacus";
  if (urlLower.includes("fellou")) return "fellou";
  if (urlLower.includes("genspark")) return "genspark";
  if (urlLower.includes("manus")) return "manus";

  return "desconhecido";
}

async function executarTarefa(
  tarefa: string,
  navegador: string
): Promise<{
  sucesso: boolean;
  planoBAtivado: boolean;
  mensagem: string;
  erro?: string;
}> {
  // Simulação de execução
  // Em produção, aqui chamaria o sistema Python via subprocess ou API

  // Simular sucesso em 95% dos casos
  const sucesso = Math.random() > 0.05;

  if (sucesso) {
    return {
      sucesso: true,
      planoBAtivado: false,
      mensagem: `Tarefa "${tarefa}" executada com sucesso no navegador ${navegador}`,
    };
  } else {
    // Simular erro e ativação do Plano B
    return {
      sucesso: true,
      planoBAtivado: true,
      mensagem: `Tarefa "${tarefa}" executada via Plano B (erro de política detectado e resolvido)`,
    };
  }
}
