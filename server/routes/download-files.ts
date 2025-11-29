import { Router } from "express";
import * as fs from "fs";
import * as path from "path";

const router = Router();

/**
 * Rotas para download direto de arquivos do Desktop Agent
 */

// Download agent.py
router.get("/agent.py", (req, res) => {
  try {
    const agentPath = path.join(process.cwd(), "desktop-agent", "agent_v2.py");
    
    if (!fs.existsSync(agentPath)) {
      return res.status(404).json({ error: "Agent não encontrado" });
    }

    res.setHeader("Content-Type", "text/x-python");
    res.setHeader("Content-Disposition", 'attachment; filename="agent.py"');
    
    const fileStream = fs.createReadStream(agentPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Erro ao servir agent.py:", error);
    res.status(500).json({ error: "Erro ao baixar arquivo" });
  }
});

// Download instalador BAT
router.get("/INSTALAR_DESKTOP_AGENT.bat", (req, res) => {
  try {
    const batPath = path.join(process.cwd(), "desktop-agent", "INSTALAR_DESKTOP_AGENT.bat");
    
    if (!fs.existsSync(batPath)) {
      return res.status(404).json({ error: "Instalador BAT não encontrado" });
    }

    res.setHeader("Content-Type", "application/x-bat");
    res.setHeader("Content-Disposition", 'attachment; filename="INSTALAR_DESKTOP_AGENT.bat"');
    
    const fileStream = fs.createReadStream(batPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Erro ao servir BAT:", error);
    res.status(500).json({ error: "Erro ao baixar arquivo" });
  }
});

// Download instalador Python universal
router.get("/instalador_automatico.py", (req, res) => {
  try {
    const pyPath = path.join(process.cwd(), "desktop-agent", "instalador_automatico.py");
    
    if (!fs.existsSync(pyPath)) {
      return res.status(404).json({ error: "Instalador Python não encontrado" });
    }

    res.setHeader("Content-Type", "text/x-python");
    res.setHeader("Content-Disposition", 'attachment; filename="instalador_automatico.py"');
    
    const fileStream = fs.createReadStream(pyPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Erro ao servir instalador Python:", error);
    res.status(500).json({ error: "Erro ao baixar arquivo" });
  }
});

// Rota de informações (JSON)
router.get("/info", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  
  res.json({
    version: "2.0.0",
    downloads: {
      agent: `${baseUrl}/api/download/agent.py`,
      installerBat: `${baseUrl}/api/download/INSTALAR_DESKTOP_AGENT.bat`,
      installerPy: `${baseUrl}/api/download/instalador_automatico.py`,
    },
    instructions: {
      windows: "Baixe INSTALAR_DESKTOP_AGENT.bat e execute",
      universal: "Baixe instalador_automatico.py e execute com Python 3.7+",
      manual: "Baixe agent.py e configure manualmente",
    },
  });
});

export default router;
