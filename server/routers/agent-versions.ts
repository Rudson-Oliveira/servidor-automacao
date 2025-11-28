import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { eq, desc, and } from "drizzle-orm";

/**
 * Router para gerenciamento de versões do Desktop Agent
 */
export const agentVersionsRouter = router({
  /**
   * Obter última versão disponível (público - usado pelo agent)
   */
  getLatestVersion: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const result = await db.execute(`
      SELECT version, changelog, download_url, installer_url, exe_url, 
             file_hash, file_size, min_python_version, release_date
      FROM agent_versions
      WHERE is_active = TRUE AND is_stable = TRUE
      ORDER BY release_date DESC
      LIMIT 1
    `);

    const rows = result.rows as any[];
    if (rows.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No active version found" });
    }

    return rows[0];
  }),

  /**
   * Listar todas as versões
   */
  listVersions: publicProcedure
    .input(z.object({
      includeInactive: z.boolean().optional().default(false),
      includeBeta: z.boolean().optional().default(false),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let query = `
        SELECT id, version, changelog, download_url, installer_url, exe_url,
               file_hash, file_size, is_stable, is_active, min_python_version, 
               release_date, created_at
        FROM agent_versions
        WHERE 1=1
      `;

      if (!input.includeInactive) {
        query += " AND is_active = TRUE";
      }

      if (!input.includeBeta) {
        query += " AND is_stable = TRUE";
      }

      query += " ORDER BY release_date DESC";

      const result = await db.execute(query);
      return result.rows;
    }),

  /**
   * Obter detalhes de uma versão específica
   */
  getVersion: publicProcedure
    .input(z.object({
      version: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db.execute(`
        SELECT * FROM agent_versions WHERE version = ?
      `, [input.version]);

      const rows = result.rows as any[];
      if (rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
      }

      return rows[0];
    }),

  /**
   * Criar nova versão (protegido - apenas admin)
   */
  createVersion: protectedProcedure
    .input(z.object({
      version: z.string(),
      changelog: z.string(),
      downloadUrl: z.string().optional(),
      installerUrl: z.string().optional(),
      exeUrl: z.string().optional(),
      fileHash: z.string().optional(),
      fileSize: z.number().optional(),
      isStable: z.boolean().default(true),
      isActive: z.boolean().default(true),
      minPythonVersion: z.string().default("3.11"),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se é admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create versions" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        await db.execute(`
          INSERT INTO agent_versions 
          (version, changelog, download_url, installer_url, exe_url, file_hash, file_size, is_stable, is_active, min_python_version)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          input.version,
          input.changelog,
          input.downloadUrl || null,
          input.installerUrl || null,
          input.exeUrl || null,
          input.fileHash || null,
          input.fileSize || null,
          input.isStable,
          input.isActive,
          input.minPythonVersion,
        ]);

        return { success: true, version: input.version };
      } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
          throw new TRPCError({ code: "CONFLICT", message: "Version already exists" });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }
    }),

  /**
   * Atualizar versão existente
   */
  updateVersion: protectedProcedure
    .input(z.object({
      version: z.string(),
      changelog: z.string().optional(),
      downloadUrl: z.string().optional(),
      installerUrl: z.string().optional(),
      exeUrl: z.string().optional(),
      fileHash: z.string().optional(),
      fileSize: z.number().optional(),
      isStable: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can update versions" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updates: string[] = [];
      const values: any[] = [];

      if (input.changelog !== undefined) {
        updates.push("changelog = ?");
        values.push(input.changelog);
      }
      if (input.downloadUrl !== undefined) {
        updates.push("download_url = ?");
        values.push(input.downloadUrl);
      }
      if (input.installerUrl !== undefined) {
        updates.push("installer_url = ?");
        values.push(input.installerUrl);
      }
      if (input.exeUrl !== undefined) {
        updates.push("exe_url = ?");
        values.push(input.exeUrl);
      }
      if (input.fileHash !== undefined) {
        updates.push("file_hash = ?");
        values.push(input.fileHash);
      }
      if (input.fileSize !== undefined) {
        updates.push("file_size = ?");
        values.push(input.fileSize);
      }
      if (input.isStable !== undefined) {
        updates.push("is_stable = ?");
        values.push(input.isStable);
      }
      if (input.isActive !== undefined) {
        updates.push("is_active = ?");
        values.push(input.isActive);
      }

      if (updates.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No fields to update" });
      }

      values.push(input.version);

      await db.execute(`
        UPDATE agent_versions 
        SET ${updates.join(", ")}
        WHERE version = ?
      `, values);

      return { success: true, version: input.version };
    }),

  /**
   * Deletar versão
   */
  deleteVersion: protectedProcedure
    .input(z.object({
      version: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete versions" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.execute(`
        DELETE FROM agent_versions WHERE version = ?
      `, [input.version]);

      return { success: true };
    }),

  /**
   * Obter estatísticas de versões
   */
  getVersionStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view stats" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Contar agents por versão
    const versionCounts = await db.execute(`
      SELECT version, COUNT(*) as count
      FROM agent_telemetry
      WHERE last_heartbeat > DATE_SUB(NOW(), INTERVAL 1 HOUR)
      GROUP BY version
      ORDER BY count DESC
    `);

    // Total de agents ativos
    const totalActive = await db.execute(`
      SELECT COUNT(DISTINCT agent_id) as total
      FROM agent_telemetry
      WHERE last_heartbeat > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    // Atualizações recentes
    const recentUpdates = await db.execute(`
      SELECT 
        from_version,
        to_version,
        update_status,
        COUNT(*) as count
      FROM agent_update_history
      WHERE started_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY from_version, to_version, update_status
    `);

    return {
      versionDistribution: versionCounts.rows,
      totalActiveAgents: (totalActive.rows as any[])[0]?.total || 0,
      recentUpdates: recentUpdates.rows,
    };
  }),

  /**
   * Registrar telemetria do agent
   */
  reportTelemetry: publicProcedure
    .input(z.object({
      agentId: z.string(),
      version: z.string(),
      platform: z.string(),
      deviceName: z.string(),
      cpuUsage: z.number().optional(),
      memoryUsage: z.number().optional(),
      uptimeSeconds: z.number().optional(),
      errorCount: z.number().optional(),
      commandCount: z.number().optional(),
      pluginsInstalled: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.execute(`
        INSERT INTO agent_telemetry 
        (agent_id, version, platform, device_name, cpu_usage, memory_usage, uptime_seconds, error_count, command_count, plugins_installed, last_heartbeat)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          version = VALUES(version),
          platform = VALUES(platform),
          device_name = VALUES(device_name),
          cpu_usage = VALUES(cpu_usage),
          memory_usage = VALUES(memory_usage),
          uptime_seconds = VALUES(uptime_seconds),
          error_count = VALUES(error_count),
          command_count = VALUES(command_count),
          plugins_installed = VALUES(plugins_installed),
          last_heartbeat = NOW()
      `, [
        input.agentId,
        input.version,
        input.platform,
        input.deviceName,
        input.cpuUsage || null,
        input.memoryUsage || null,
        input.uptimeSeconds || null,
        input.errorCount || 0,
        input.commandCount || 0,
        input.pluginsInstalled ? JSON.stringify(input.pluginsInstalled) : null,
      ]);

      return { success: true };
    }),
});
