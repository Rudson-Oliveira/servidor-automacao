/**
 * 📥 ROTAS DE DOWNLOAD
 * Endpoints para download de instaladores e agentes
 */

import express from "express";
import path from "path";
import fs from "fs";

const router = express.Router();

/**
 * GET /api/download/installer.exe
 * Download do instalador Windows
 */
router.get("/installer.exe", (req, res) => {
  const installerPath = path.join(__dirname, "../../installer/dist/ManusDesktopAgentInstaller.exe");

  // Verificar se arquivo existe
  if (!fs.existsSync(installerPath)) {
    return res.status(404).json({
      error: "Instalador não encontrado",
      message: "O instalador ainda não foi compilado. Execute o script de build primeiro.",
    });
  }

  // Obter informações do arquivo
  const stats = fs.statSync(installerPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  // Headers para download
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", "attachment; filename=ManusDesktopAgentInstaller.exe");
  res.setHeader("Content-Length", stats.size);
  res.setHeader("X-File-Size-MB", fileSizeMB);

  // Stream do arquivo
  const fileStream = fs.createReadStream(installerPath);
  fileStream.pipe(res);

  fileStream.on("error", (error) => {
    console.error("[Download] Erro ao enviar instalador:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Erro ao baixar instalador",
        message: error.message,
      });
    }
  });
});

/**
 * GET /api/download/desktop-agent.py
 * Download do script Python do agente desktop
 */
router.get("/desktop-agent.py", (req, res) => {
  const agentPath = path.join(__dirname, "../../desktop_capture.py");

  if (!fs.existsSync(agentPath)) {
    return res.status(404).json({
      error: "Agente não encontrado",
      message: "Script do agente desktop não está disponível",
    });
  }

  res.setHeader("Content-Type", "text/x-python");
  res.setHeader("Content-Disposition", "attachment; filename=desktop_agent.py");

  const fileStream = fs.createReadStream(agentPath);
  fileStream.pipe(res);

  fileStream.on("error", (error) => {
    console.error("[Download] Erro ao enviar agente:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Erro ao baixar agente",
        message: error.message,
      });
    }
  });
});

/**
 * GET /api/download/browser-extension.zip
 * Download da extensão do navegador
 */
router.get("/browser-extension.zip", (req, res) => {
  const extensionPath = path.join(__dirname, "../../browser-extension/extension.zip");

  if (!fs.existsSync(extensionPath)) {
    return res.status(404).json({
      error: "Extensão não encontrada",
      message: "A extensão do navegador ainda não está disponível para download",
    });
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=manus-browser-extension.zip");

  const fileStream = fs.createReadStream(extensionPath);
  fileStream.pipe(res);

  fileStream.on("error", (error) => {
    console.error("[Download] Erro ao enviar extensão:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Erro ao baixar extensão",
        message: error.message,
      });
    }
  });
});

/**
 * GET /api/download/list
 * Lista todos os downloads disponíveis
 */
router.get("/list", (req, res) => {
  const downloads = [
    {
      name: "Instalador Windows (.exe)",
      filename: "ManusDesktopAgentInstaller.exe",
      url: "/api/download/installer.exe",
      description: "Instalador autocontido para Windows. Não requer conhecimento técnico.",
      available: fs.existsSync(path.join(__dirname, "../../installer/dist/ManusDesktopAgentInstaller.exe")),
    },
    {
      name: "Agente Desktop (Python)",
      filename: "desktop_agent.py",
      url: "/api/download/desktop-agent.py",
      description: "Script Python do agente desktop. Requer Python 3.8+.",
      available: fs.existsSync(path.join(__dirname, "../../desktop_capture.py")),
    },
    {
      name: "Extensão do Navegador",
      filename: "manus-browser-extension.zip",
      url: "/api/download/browser-extension.zip",
      description: "Extensão para Chrome/Edge. Permite controle do navegador pela IA.",
      available: fs.existsSync(path.join(__dirname, "../../browser-extension/extension.zip")),
    },
  ];

  res.json({
    success: true,
    downloads,
    total: downloads.length,
    available: downloads.filter((d) => d.available).length,
  });
});

export default router;
