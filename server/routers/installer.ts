/**
 * Router tRPC para Gerenciamento de Builds do Instalador
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { installerBuilder } from '../_core/installer-builder';
import { z } from 'zod';

export const installerRouter = router({
  /**
   * Retorna informações do instalador atual
   */
  getInfo: publicProcedure.query(async () => {
    const build = installerBuilder.getCurrentBuild();
    const status = installerBuilder.getStatus();

    return {
      available: status.hasInstaller,
      isBuilding: status.isBuilding,
      build: build ? {
        version: build.version,
        buildDate: build.buildDate,
        fileSize: build.fileSize,
        fileSizeMB: (build.fileSize / 1024 / 1024).toFixed(2),
      } : null,
    };
  }),

  /**
   * Retorna status detalhado do sistema de build
   */
  getStatus: protectedProcedure.query(async () => {
    return installerBuilder.getStatus();
  }),

  /**
   * Força recompilação do instalador (apenas admin)
   */
  forceBuild: protectedProcedure.mutation(async ({ ctx }) => {
    // Verificar se usuário é admin
    if (ctx.user.role !== 'admin') {
      throw new Error('Apenas administradores podem forçar rebuild');
    }

    const build = await installerBuilder.forceBuild();

    return {
      success: true,
      build: {
        version: build.version,
        buildDate: build.buildDate,
        fileSize: build.fileSize,
        fileSizeMB: (build.fileSize / 1024 / 1024).toFixed(2),
      },
    };
  }),

  /**
   * Retorna URL de download do instalador
   */
  getDownloadUrl: publicProcedure.query(async () => {
    const build = installerBuilder.getCurrentBuild();

    if (!build) {
      throw new Error('Instalador não disponível');
    }

    // URL relativa para download
    const downloadUrl = `/api/download/installer-windows.exe`;

    return {
      url: downloadUrl,
      version: build.version,
      fileSize: build.fileSize,
      fileSizeMB: (build.fileSize / 1024 / 1024).toFixed(2),
    };
  }),
});
