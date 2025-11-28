import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import path from "path";
import fs from "fs";

/**
 * Router de Download
 * 
 * Gerencia downloads de instaladores e arquivos do sistema
 */

export const downloadRouter = router({
  /**
   * Obter informações sobre o instalador Windows
   */
  getInstallerInfo: publicProcedure.query(async () => {
    const installerPath = path.join(process.cwd(), "dist", "installers", "servidor-automacao-setup.exe");
    
    let fileExists = false;
    let fileSize = 0;
    let version = "1.0.0";

    try {
      const stats = fs.statSync(installerPath);
      fileExists = true;
      fileSize = stats.size;
    } catch (error) {
      // Arquivo não existe ainda
      fileExists = false;
    }

    return {
      available: fileExists,
      version,
      fileSize,
      fileName: "servidor-automacao-setup.exe",
      downloadUrl: "/api/download/installer-windows",
      requirements: {
        os: "Windows 10/11",
        ram: "4GB",
        disk: "500MB",
      },
      features: [
        "Instalação com 1 clique",
        "Roda em segundo plano",
        "Acesso local (localhost:3000)",
        "Atualizações automáticas",
        "100% privado (dados no seu PC)",
      ],
    };
  }),

  /**
   * Obter lista de todas as versões disponíveis
   */
  getVersions: publicProcedure.query(async () => {
    return {
      latest: "1.0.0",
      versions: [
        {
          version: "1.0.0",
          releaseDate: "2025-11-28",
          changes: [
            "Lançamento inicial",
            "Sistema de automação completo",
            "Integração com WhatsApp, Obsidian, Desktop",
            "Auto-healing e ML preditivo",
            "402 testes automatizados (100% aprovação)",
          ],
          downloadUrl: "/api/download/installer-windows?version=1.0.0",
        },
      ],
    };
  }),

  /**
   * Registrar download (analytics)
   */
  registerDownload: publicProcedure
    .input(
      z.object({
        type: z.enum(["exe", "web", "api"]),
        version: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Salvar no banco de dados para analytics
      console.log(`[Download] Tipo: ${input.type}, Versão: ${input.version || "latest"}`);

      return {
        success: true,
        downloadId: `dl_${Date.now()}`,
        message: "Download registrado com sucesso",
      };
    }),
});
