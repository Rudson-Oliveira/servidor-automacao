import express, { type Request, type Response } from "express";
import { promises as fs } from "fs";
import * as fsSync from "fs";
import path from "path";
import { installerBuilder } from '../_core/installer-builder';

const router = express.Router();

/**
 * Rota para download do instalador Windows
 * 
 * GET /api/download/installer-windows.exe
 * GET /api/download/installer-windows?version=1.0.0
 */
router.get("/installer-windows.exe", async (req, res) => {
  try {
    console.log('[Download] Solicitação de download do instalador recebida');

    // Garantir que o instalador existe (compila se necessário)
    const build = await installerBuilder.ensureInstaller();

    const fileName = `servidor-automacao-v${build.version}.exe`;

    // Headers para download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', build.fileSize);
    res.setHeader('X-File-Version', build.version);

    // Stream do arquivo
    const fileStream = fsSync.createReadStream(build.filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('[Download] Erro ao enviar arquivo:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Erro ao fazer download',
          message: error.message,
        });
      }
    });

    // Log do download
    console.log(`[Download] ✅ Instalador Windows v${build.version} baixado (${(build.fileSize / 1024 / 1024).toFixed(2)} MB)`);

  } catch (error: any) {
    console.error('[Download] ❌ Erro:', error);
    res.status(500).json({
      error: 'Erro ao gerar instalador',
      message: error.message,
      details: 'O sistema está tentando compilar o instalador. Isso pode levar alguns minutos. Por favor, tente novamente em breve.',
    });
  }
});

/**
 * Rota alternativa sem .exe na URL
 */
router.get("/installer-windows", async (req, res) => {
  // Redirecionar para rota com .exe
  const version = req.query.version ? `?version=${req.query.version}` : "";
  res.redirect(`/api/download/installer-windows.exe${version}`);
});

/**
 * Rota para download de scripts Python
 * 
 * GET /api/download/scripts/python
 */
router.get("/scripts/python", async (req, res) => {
  try {
    const scriptsPath = path.join(process.cwd(), "scripts", "python");
    
    // Verificar se diretório existe
    if (!fsSync.existsSync(scriptsPath)) {
      return res.status(404).json({
        error: "Scripts não disponíveis",
        message: "Os scripts Python não foram encontrados.",
      });
    }

    // Criar ZIP dos scripts (TODO: implementar compactação)
    res.status(501).json({
      error: "Funcionalidade em desenvolvimento",
      message: "Download de scripts Python será implementado em breve.",
      alternative: "Entre em contato para receber os scripts por email.",
    });

  } catch (error) {
    console.error("[Download] Erro ao servir scripts:", error);
    res.status(500).json({
      error: "Erro ao baixar scripts",
      message: "Ocorreu um erro ao processar o download.",
    });
  }
});

export default router;
