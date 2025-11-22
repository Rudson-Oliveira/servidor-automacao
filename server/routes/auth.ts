import express from "express";
import { criarApiKey, listarApiKeys, desativarApiKey, reativarApiKey } from "../apiKeys";

const router = express.Router();

/**
 * POST /api/auth/generate-key
 * Gera uma nova chave API para uma IA
 */
router.post("/generate-key", async (req, res) => {
  try {
    const { nome, descricao } = req.body;

    // Validação
    if (!nome || typeof nome !== "string" || nome.trim() === "") {
      return res.status(400).json({
        sucesso: false,
        erro: "Campo 'nome' é obrigatório",
      });
    }

    // Criar chave
    const novaChave = await criarApiKey({
      nome: nome.trim(),
      descricao: descricao || "",
    });

    if (!novaChave) {
      return res.status(503).json({
        sucesso: false,
        erro: "Banco de dados indisponível",
      });
    }

    res.status(201).json({
      sucesso: true,
      mensagem: "Chave API criada com sucesso",
      dados: {
        id: novaChave.id,
        chave: novaChave.chave,
        nome: novaChave.nome,
        descricao: novaChave.descricao,
        ativa: novaChave.ativa === 1,
        createdAt: novaChave.createdAt,
      },
    });
  } catch (erro) {
    console.error("[Auth] Erro ao gerar chave:", erro);
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao gerar chave API",
    });
  }
});

/**
 * GET /api/auth/keys
 * Lista todas as chaves API
 */
router.get("/keys", async (req, res) => {
  try {
    const chaves = await listarApiKeys();

    res.json({
      sucesso: true,
      dados: {
        chaves: chaves.map((chave) => ({
          id: chave.id,
          nome: chave.nome,
          descricao: chave.descricao,
          ativa: chave.ativa === 1,
          ultimoUso: chave.ultimoUso,
          totalRequisicoes: chave.totalRequisicoes,
          createdAt: chave.createdAt,
          // NÃO retornar a chave completa por segurança
          chaveParcial: chave.chave.substring(0, 20) + "...",
        })),
        total: chaves.length,
      },
    });
  } catch (erro) {
    console.error("[Auth] Erro ao listar chaves:", erro);
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao listar chaves API",
    });
  }
});

/**
 * POST /api/auth/keys/:id/deactivate
 * Desativa uma chave API
 */
router.post("/keys/:id/deactivate", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        sucesso: false,
        erro: "ID inválido",
      });
    }

    const sucesso = await desativarApiKey(id);

    if (!sucesso) {
      return res.status(500).json({
        sucesso: false,
        erro: "Erro ao desativar chave",
      });
    }

    res.json({
      sucesso: true,
      mensagem: "Chave desativada com sucesso",
    });
  } catch (erro) {
    console.error("[Auth] Erro ao desativar chave:", erro);
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao desativar chave API",
    });
  }
});

/**
 * POST /api/auth/keys/:id/reactivate
 * Reativa uma chave API
 */
router.post("/keys/:id/reactivate", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        sucesso: false,
        erro: "ID inválido",
      });
    }

    const sucesso = await reativarApiKey(id);

    if (!sucesso) {
      return res.status(500).json({
        sucesso: false,
        erro: "Erro ao reativar chave",
      });
    }

    res.json({
      sucesso: true,
      mensagem: "Chave reativada com sucesso",
    });
  } catch (erro) {
    console.error("[Auth] Erro ao reativar chave:", erro);
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao reativar chave API",
    });
  }
});

export default router;
