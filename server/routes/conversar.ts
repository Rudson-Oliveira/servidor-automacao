import type { Express } from "express";
import { getDb } from "../db";
import { conversas } from "../../drizzle/schema";

export function registerConversarRoutes(app: Express) {
  // POST /api/conversar - Conversa com o sistema
  app.post("/api/conversar", async (req, res) => {
    try {
      const { mensagem } = req.body;

      if (!mensagem) {
        return res.status(400).json({
          sucesso: false,
          erro: "Mensagem é obrigatória",
        });
      }

      const db = await getDb();

      // Registrar mensagem do usuário
      if (db) {
        await db.insert(conversas).values({
          tipo: "usuario",
          mensagem,
          contexto: null,
        });
      }

      // Processar mensagem
      const resposta = processarMensagem(mensagem);

      // Registrar resposta do sistema
      if (db) {
        await db.insert(conversas).values({
          tipo: "sistema",
          mensagem: resposta,
          contexto: null,
        });
      }

      res.json({
        sucesso: true,
        resposta,
      });
    } catch (error) {
      console.error("Erro ao conversar:", error);
      res.status(500).json({
        sucesso: false,
        erro: "Erro ao processar mensagem",
      });
    }
  });
}

function processarMensagem(mensagem: string): string {
  const mensagemLower = mensagem.toLowerCase();

  // Comandos
  if (mensagemLower.includes("status")) {
    return "✅ Sistema online | Versão 1.0.0 | Pronto para executar tarefas";
  }

  if (mensagemLower.includes("executar") || mensagemLower.includes("execute")) {
    return "Para executar uma tarefa, use o endpoint POST /api/executar com: {\"tarefa\": \"sua tarefa\", \"url\": \"url do navegador\"}";
  }

  if (mensagemLower.includes("erro")) {
    return "Para corrigir um erro, use POST /api/corrigir-erro com: {\"erro\": \"descrição do erro\", \"contexto\": \"contexto\"}";
  }

  if (mensagemLower.includes("ajuda") || mensagemLower.includes("help")) {
    return `📚 Comandos disponíveis:
- status: Ver status do sistema
- executar: Executar uma tarefa
- corrigir erro: Corrigir um erro automaticamente
- ajustar: Ajustar configurações
- histórico: Ver histórico de conversas
- ajuda: Ver esta mensagem`;
  }

  if (mensagemLower.includes("olá") || mensagemLower.includes("oi")) {
    return "👋 Olá! Como posso ajudar? Digite 'ajuda' para ver os comandos disponíveis.";
  }

  return `Recebi sua mensagem: "${mensagem}". Digite 'ajuda' para ver os comandos disponíveis.`;
}
