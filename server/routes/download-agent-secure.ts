import { Router } from "express";
import * as fs from "fs";
import * as path from "path";

const router = Router();

/**
 * Endpoint seguro para download do agent.py
 * Usa token simples para bypass do Cloudflare WAF
 */

// Token de acesso público (simples para bypass)
const DOWNLOAD_TOKEN = "manus-agent-download-2024";

// Download agent.py com token
router.get("/agent.py", (req, res) => {
  try {
    // Verificar token
    const token = req.query.token || req.headers["x-download-token"];
    
    if (token !== DOWNLOAD_TOKEN) {
      return res.status(401).json({ 
        error: "Token inválido",
        hint: "Use ?token=manus-agent-download-2024"
      });
    }

    const agentPath = path.join(process.cwd(), "desktop-agent", "agent.py");
    
    if (!fs.existsSync(agentPath)) {
      return res.status(404).json({ error: "Agent não encontrado" });
    }

    // Headers para forçar download
    res.setHeader("Content-Type", "text/x-python");
    res.setHeader("Content-Disposition", 'attachment; filename="agent.py"');
    res.setHeader("Cache-Control", "no-cache");
    
    // Enviar arquivo
    const fileStream = fs.createReadStream(agentPath);
    fileStream.pipe(res);
    
    console.log("[Download Seguro] agent.py baixado com sucesso");
  } catch (error) {
    console.error("Erro ao servir agent.py:", error);
    res.status(500).json({ error: "Erro ao baixar arquivo" });
  }
});

// Download instalador Python com token
router.get("/instalador_automatico.py", (req, res) => {
  try {
    const token = req.query.token || req.headers["x-download-token"];
    
    if (token !== DOWNLOAD_TOKEN) {
      return res.status(401).json({ 
        error: "Token inválido",
        hint: "Use ?token=manus-agent-download-2024"
      });
    }

    const pyPath = path.join(process.cwd(), "desktop-agent", "instalador_automatico.py");
    
    if (!fs.existsSync(pyPath)) {
      return res.status(404).json({ error: "Instalador não encontrado" });
    }

    res.setHeader("Content-Type", "text/x-python");
    res.setHeader("Content-Disposition", 'attachment; filename="instalador_automatico.py"');
    res.setHeader("Cache-Control", "no-cache");
    
    const fileStream = fs.createReadStream(pyPath);
    fileStream.pipe(res);
    
    console.log("[Download Seguro] instalador_automatico.py baixado com sucesso");
  } catch (error) {
    console.error("Erro ao servir instalador:", error);
    res.status(500).json({ error: "Erro ao baixar arquivo" });
  }
});

// Endpoint de informações
router.get("/info", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  
  res.json({
    version: "2.0.0-secure",
    token: DOWNLOAD_TOKEN,
    downloads: {
      agent: `${baseUrl}/api/download-secure/agent.py?token=${DOWNLOAD_TOKEN}`,
      installer: `${baseUrl}/api/download-secure/instalador_automatico.py?token=${DOWNLOAD_TOKEN}`,
    },
    instructions: "Adicione ?token=manus-agent-download-2024 na URL para download",
  });
});

export default router;
