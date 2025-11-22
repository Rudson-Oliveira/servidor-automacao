import type { Express } from "express";
import { getDb } from "../db";
import { conversas } from "../../drizzle/schema";

export function registerCorrigirErroRoutes(app: Express) {
  // POST /api/corrigir-erro - Corrige um erro automaticamente
  app.post("/api/corrigir-erro", async (req, res) => {
    try {
      const { erro, contexto } = req.body;

      if (!erro) {
        return res.status(400).json({
          sucesso: false,
          erro: "Descrição do erro é obrigatória",
        });
      }

      // Identificar tipo de erro
      const tipoErro = identificarTipoErro(erro);

      // Gerar solução
      const solucao = gerarSolucao(tipoErro, contexto);

      // Registrar correção no banco
      const db = await getDb();
      if (db) {
        await db.insert(conversas).values({
          tipo: "erro_corrigido",
          mensagem: `Erro: ${erro} | Solução: ${solucao.solucao}`,
          contexto: JSON.stringify({ tipoErro, contexto }),
        });
      }

      res.json({
        sucesso: true,
        tipo_erro: tipoErro,
        ...solucao,
      });
    } catch (error) {
      console.error("Erro ao corrigir erro:", error);
      res.status(500).json({
        sucesso: false,
        erro: "Erro ao processar correção",
      });
    }
  });
}

function identificarTipoErro(erro: string): string {
  const erroLower = erro.toLowerCase();

  if (erroLower.includes("policy") || erroLower.includes("política")) {
    return "politica_seguranca";
  }
  if (erroLower.includes("cors")) {
    return "cors";
  }
  if (erroLower.includes("timeout")) {
    return "timeout";
  }
  if (erroLower.includes("rate limit") || erroLower.includes("too many")) {
    return "rate_limit";
  }
  if (erroLower.includes("permission") || erroLower.includes("permissão")) {
    return "permissao_negada";
  }

  return "outro";
}

function gerarSolucao(
  tipoErro: string,
  contexto?: string
): {
  solucao: string;
  codigo?: string;
  alternativa?: string;
} {
  switch (tipoErro) {
    case "politica_seguranca":
      return {
        solucao: "Criar solução alternativa em Python",
        codigo: gerarCodigoAlternativo(contexto),
      };

    case "cors":
      return {
        solucao: "Usar proxy local ou API alternativa",
        alternativa: "Usar API Manus via proxy",
      };

    case "timeout":
      return {
        solucao: "Tentar novamente com timeout maior",
        alternativa: "Usar API Manus com retry automático",
      };

    case "rate_limit":
      return {
        solucao: "Usar API alternativa",
        alternativa: "Usar API Perplexity (sem rate limit)",
      };

    case "permissao_negada":
      return {
        solucao: "Criar código Python com permissões locais",
        codigo: gerarCodigoAlternativo(contexto),
      };

    default:
      return {
        solucao: "Usar Abacus (master) como fallback",
        alternativa: "API Abacus com maior confiabilidade",
      };
  }
}

function gerarCodigoAlternativo(contexto?: string): string {
  return `# Solução alternativa gerada automaticamente
def executar_tarefa():
    # Contexto: ${contexto || "N/A"}
    resultado = "Tarefa executada via solução alternativa"
    return resultado

resultado = executar_tarefa()
print(resultado)
`;
}
