import { Router } from "express";
import * as fs from "fs";
import * as path from "path";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

const router = Router();

// Função para rastrear downloads
async function trackDownload(fileName: string) {
  try {
    const db = await getDb();
    if (!db) return;

    // Verificar se já existe registro
    const existing = await db.execute(sql`
      SELECT id, download_count FROM download_analytics WHERE file_name = ${fileName}
    `);

    if (existing.rows && existing.rows.length > 0) {
      // Incrementar contador
      await db.execute(sql`
        UPDATE download_analytics 
        SET download_count = download_count + 1, last_download = NOW()
        WHERE file_name = ${fileName}
      `);
    } else {
      // Criar novo registro
      await db.execute(sql`
        INSERT INTO download_analytics (file_name, download_count) 
        VALUES (${fileName}, 1)
      `);
    }
  } catch (error) {
    console.error('Erro ao rastrear download:', error);
  }
}

/**
 * Rotas para download direto de arquivos do Desktop Agent
 */

// Download cometa.exe (instalador completo)
router.get("/cometa.exe", async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), "downloads", "cometa.exe");
    
    if (!fs.existsSync(filePath)) {
      // Criar diretório se não existir
      const downloadsDir = path.join(process.cwd(), "downloads");
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }
      
      // Criar arquivo placeholder
      const placeholder = `Este é um placeholder para cometa.exe.\n\nPara criar o instalador real:\n1. Compile o Desktop Agent com PyInstaller\n2. Substitua este arquivo pelo .exe gerado\n\nComando: pyinstaller --onefile --windowed --name cometa desktop-agent/agent.py`;
      fs.writeFileSync(filePath, placeholder);
    }

    // Rastrear download
    await trackDownload("cometa.exe");

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", 'attachment; filename="cometa.exe"');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Erro ao servir cometa.exe:", error);
    res.status(500).json({ error: "Erro ao baixar arquivo" });
  }
});

// Download browser-extension.zip
router.get("/browser-extension.zip", async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), "downloads", "browser-extension.zip");
    
    if (!fs.existsSync(filePath)) {
      // Criar diretório se não existir
      const downloadsDir = path.join(process.cwd(), "downloads");
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }
      
      // Criar arquivo placeholder
      const placeholder = `Este é um placeholder para browser-extension.zip.\n\nPara criar a extensão real:\n1. Desenvolva a extensão do navegador\n2. Crie um arquivo ZIP com os arquivos\n3. Substitua este arquivo pelo ZIP gerado`;
      fs.writeFileSync(filePath, placeholder);
    }

    // Rastrear download
    await trackDownload("browser-extension.zip");

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="browser-extension.zip"');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Erro ao servir browser-extension.zip:", error);
    res.status(500).json({ error: "Erro ao baixar arquivo" });
  }
});

// Download agent.py
router.get("/agent.py", (req, res) => {
  try {
    const agentPath = path.join(process.cwd(), "desktop-agent", "agent.py");
    
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

// Estatísticas de downloads
router.get("/stats", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.json({ error: "Database not available" });
    }

    const stats = await db.execute(sql`
      SELECT 
        file_name,
        download_count,
        last_download,
        created_at
      FROM download_analytics
      ORDER BY download_count DESC
    `);

    res.json({
      success: true,
      stats: stats.rows || [],
      total_downloads: stats.rows?.reduce((sum: number, row: any) => sum + (row.download_count || 0), 0) || 0
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

// Rota de informações (JSON)
router.get("/info", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  
  res.json({
    version: "2.0.0",
    downloads: {
      cometa: `${baseUrl}/api/download/cometa.exe`,
      browserExtension: `${baseUrl}/api/download/browser-extension.zip`,
      agent: `${baseUrl}/api/download/agent.py`,
      installerBat: `${baseUrl}/api/download/INSTALAR_DESKTOP_AGENT.bat`,
      installerPy: `${baseUrl}/api/download/instalador_automatico.py`,
      stats: `${baseUrl}/api/download/stats`,
    },
    instructions: {
      windows: "Baixe INSTALAR_DESKTOP_AGENT.bat e execute",
      universal: "Baixe instalador_automatico.py e execute com Python 3.7+",
      manual: "Baixe agent.py e configure manualmente",
    },
  });
});

export default router;
