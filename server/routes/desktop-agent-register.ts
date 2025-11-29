/**
 * Desktop Agent - REST API para Auto-Registro
 * Endpoint REST simples para o instalador Python chamar
 */

import { Router } from "express";
import crypto from "crypto";
import { getDb } from "../db";
import { desktopAgents } from "../../drizzle/schema";

const router = Router();

/**
 * POST /api/desktop-agent/register
 * Endpoint público REST para auto-registro de agents
 */
router.post("/register", async (req, res) => {
  try {
    const { deviceName, platform, version } = req.body;

    // Validação básica
    if (!deviceName || typeof deviceName !== "string" || deviceName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "deviceName é obrigatório",
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Banco de dados não disponível",
      });
    }

    // Gerar token seguro
    const token = crypto.randomBytes(32).toString("hex");

    // Criar agent no banco (userId = 1 para agents públicos)
    const [result] = await db
      .insert(desktopAgents)
      .values({
        userId: 1, // Agent público (sem autenticação de usuário)
        deviceName: deviceName.trim(),
        token,
        status: "offline",
        platform: platform || "unknown",
        version: version || "1.0.0",
      })
      .$returningId();

    const agentId = result.id;

    console.log(`[Desktop Agent Register] Agent criado: ${deviceName} (ID: ${agentId})`);

    return res.status(200).json({
      success: true,
      agentId,
      token,
      deviceName: deviceName.trim(),
      message: "Agent criado com sucesso! Use o token para conectar.",
    });
  } catch (error) {
    console.error("[Desktop Agent Register] Erro ao criar agent:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao criar agent",
    });
  }
});

export default router;
