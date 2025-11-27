import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as dbObsidian from "../db-obsidian";
import { TRPCError } from "@trpc/server";
import AdmZip from "adm-zip";
import matter from "gray-matter";
import crypto from "crypto";
import obsidianSync from "../services/obsidianSync";

/**
 * 🔗 ROUTER TRPC PARA INTEGRAÇÃO OBSIDIAN AVANÇADA
 * 
 * Gerenciamento completo de vaults, notas, sincronização e backups
 * Complementa o obsidianRouter existente (geração de scripts)
 */

export const obsidianAdvancedRouter = router({
  // ==================== VAULTS ====================

  createVault: protectedProcedure
    .input(
      z.object({
        nome: z.string().min(1).max(255),
        descricao: z.string().optional(),
        cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        icone: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await dbObsidian.createVault(ctx.user.id, input);
      
      // Criar config de sync padrão
      await dbObsidian.createOrUpdateSyncConfig(result.insertId, {
        syncAutomatico: 1,
        intervaloSync: 300,
        resolucaoConflito: "manual",
        incluirExtensoes: ".md,.txt",
        backupAntes: 1,
        backupIntervalo: 86400,
        backupRetencao: 30,
      });

      return {
        success: true,
        vaultId: result.insertId,
      };
    }),

  listVaults: protectedProcedure.query(async ({ ctx }) => {
    const vaults = await dbObsidian.getVaultsByUser(ctx.user.id);
    return {
      vaults,
      count: vaults.length,
    };
  }),

  getVault: protectedProcedure
    .input(z.object({ vaultId: z.number() }))
    .query(async ({ input }) => {
      const vault = await dbObsidian.getVaultById(input.vaultId);
      if (!vault) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vault não encontrado",
        });
      }
      return vault;
    }),

  // ==================== NOTAS ====================

  createNota: protectedProcedure
    .input(
      z.object({
        vaultId: z.number(),
        titulo: z.string().min(1).max(500),
        caminho: z.string().min(1).max(1000),
        conteudo: z.string(),
        frontmatter: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { tags, ...notaData } = input;

      const result = await dbObsidian.createNota({
        ...notaData,
        ultimaModificacao: new Date(),
        ultimoSync: new Date(),
      });

      const notaId = result.insertId;

      // Processar tags
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          const tag = await dbObsidian.createOrGetTag(input.vaultId, tagName);
          await dbObsidian.linkNotaTag(notaId, tag.id);
        }
      }

      // Atualizar estatísticas do vault
      const notas = await dbObsidian.getNotasByVault(input.vaultId);
      await dbObsidian.updateVaultStats(input.vaultId, {
        totalNotas: notas.length,
      });

      return {
        success: true,
        notaId,
      };
    }),

  listNotas: protectedProcedure
    .input(z.object({ vaultId: z.number() }))
    .query(async ({ input }) => {
      const notas = await dbObsidian.getNotasByVault(input.vaultId);
      
      // Buscar tags para cada nota
      const notasComTags = await Promise.all(
        notas.map(async (nota) => {
          const tags = await dbObsidian.getTagsByNota(nota.id);
          return {
            ...nota,
            tags: tags.map(t => t.tag),
          };
        })
      );

      return {
        notas: notasComTags,
        count: notas.length,
      };
    }),

  getNota: protectedProcedure
    .input(z.object({ notaId: z.number() }))
    .query(async ({ input }) => {
      const nota = await dbObsidian.getNotaById(input.notaId);
      if (!nota) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nota não encontrada",
        });
      }

      const tags = await dbObsidian.getTagsByNota(input.notaId);
      const backlinks = await dbObsidian.getBacklinksByNota(input.notaId);
      const historico = await dbObsidian.getNotaHistorico(input.notaId);

      return {
        ...nota,
        tags: tags.map(t => t.tag),
        backlinks,
        versoes: historico.length,
      };
    }),

  updateNota: protectedProcedure
    .input(
      z.object({
        notaId: z.number(),
        titulo: z.string().min(1).max(500).optional(),
        conteudo: z.string().optional(),
        frontmatter: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { notaId, tags, ...updates } = input;

      await dbObsidian.updateNota(notaId, {
        ...updates,
        ultimaModificacao: new Date(),
        ultimoSync: new Date(),
      });

      // Atualizar tags se fornecidas
      if (tags) {
        const nota = await dbObsidian.getNotaById(notaId);
        if (nota) {
          // TODO: Remover tags antigas e adicionar novas
          for (const tagName of tags) {
            const tag = await dbObsidian.createOrGetTag(nota.vaultId, tagName);
            await dbObsidian.linkNotaTag(notaId, tag.id);
          }
        }
      }

      return {
        success: true,
      };
    }),

  deleteNota: protectedProcedure
    .input(z.object({ notaId: z.number() }))
    .mutation(async ({ input }) => {
      const nota = await dbObsidian.getNotaById(input.notaId);
      if (!nota) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nota não encontrada",
        });
      }

      await dbObsidian.deleteNota(input.notaId);

      // Atualizar estatísticas do vault
      const notas = await dbObsidian.getNotasByVault(nota.vaultId);
      await dbObsidian.updateVaultStats(nota.vaultId, {
        totalNotas: notas.length,
      });

      return {
        success: true,
      };
    }),

  // ==================== BUSCA ====================

  searchNotas: protectedProcedure
    .input(
      z.object({
        vaultId: z.number(),
        query: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const resultados = await dbObsidian.searchNotas(input.vaultId, input.query);

      return {
        resultados,
        count: resultados.length,
      };
    }),

  // ==================== TAGS ====================

  listTags: protectedProcedure
    .input(z.object({ vaultId: z.number() }))
    .query(async ({ input }) => {
      const tags = await dbObsidian.getTagsByVault(input.vaultId);
      return {
        tags,
        count: tags.length,
      };
    }),

  // ==================== HISTÓRICO ====================

  getNotaHistorico: protectedProcedure
    .input(z.object({ notaId: z.number() }))
    .query(async ({ input }) => {
      const historico = await dbObsidian.getNotaHistorico(input.notaId);
      return {
        historico,
        count: historico.length,
      };
    }),

  // ==================== BACKLINKS ====================

  getBacklinks: protectedProcedure
    .input(z.object({ notaId: z.number() }))
    .query(async ({ input }) => {
      const backlinks = await dbObsidian.getBacklinksByNota(input.notaId);
      return backlinks;
    }),

  // ==================== IMPORTAÇÃO ====================

  uploadVaultZip: protectedProcedure
    .input(z.object({
      vaultId: z.number(),
      zipBase64: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { vaultId, zipBase64 } = input;

      const vaults = await dbObsidian.getVaultsByUser(ctx.user.id);
      const vault = vaults.find(v => v.id === vaultId);
      if (!vault || vault.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Vault não encontrado" });
      }

      const zipBuffer = Buffer.from(zipBase64, "base64");
      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries();

      const notasImportadas: any[] = [];
      let erros = 0;

      for (const entry of entries) {
        if (entry.isDirectory || !entry.entryName.endsWith(".md")) continue;

        try {
          const conteudo = entry.getData().toString("utf8");
          const caminho = entry.entryName;
          const parsed = matter(conteudo);
          const frontmatter = parsed.data;
          const conteudoSemFrontmatter = parsed.content;
          const titulo = frontmatter.title || caminho.split("/").pop()?.replace(".md", "") || "Sem título";

          let tags: string[] = [];
          if (frontmatter.tags) {
            tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags];
          }
          const tagMatches = conteudoSemFrontmatter.match(/#([a-zA-Z0-9_-]+)/g);
          if (tagMatches) {
            const contentTags = tagMatches.map(t => t.substring(1));
            tags = Array.from(new Set([...tags, ...contentTags]));
          }

          const hash = crypto.createHash("sha256").update(conteudo).digest("hex");
          const notaResult = await dbObsidian.createNota({
            vaultId,
            titulo,
            caminho,
            conteudo,
            hash,
            ultimaModificacao: new Date(),
            frontmatter: Object.keys(frontmatter).length > 0 ? JSON.stringify(frontmatter) : null,
            tamanho: conteudo.length,
            palavras: conteudo.split(/\s+/).length,
          });

          const notaId = notaResult.insertId;

          if (tags.length > 0) {
            for (const tag of tags) {
              const tagResult = await dbObsidian.createOrGetTag(vaultId, tag);
              const tagId = tagResult.id;
              await dbObsidian.linkNotaTag(notaId, tagId);
            }
          }

          notasImportadas.push({ id: notaId, titulo, caminho });
        } catch (error) {
          console.error(`Erro ao importar ${entry.entryName}:`, error);
          erros++;
        }
      }

      return { success: true, importadas: notasImportadas.length, erros, notas: notasImportadas };
    }),

  importVault: protectedProcedure
    .input(
      z.object({
        vaultId: z.number(),
        notas: z.array(
          z.object({
            titulo: z.string(),
            caminho: z.string(),
            conteudo: z.string(),
            frontmatter: z.string().optional(),
            tags: z.array(z.string()).optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      let importadas = 0;
      let erros = 0;

      for (const notaData of input.notas) {
        try {
          const { tags, ...nota } = notaData;

          const result = await dbObsidian.createNota({
            vaultId: input.vaultId,
            ...nota,
            ultimaModificacao: new Date(),
            ultimoSync: new Date(),
          });

          // Processar tags
          if (tags && tags.length > 0) {
            for (const tagName of tags) {
              const tag = await dbObsidian.createOrGetTag(input.vaultId, tagName);
              await dbObsidian.linkNotaTag(result.insertId, tag.id);
            }
          }

          importadas++;
        } catch (error) {
          console.error("Erro ao importar nota:", error);
          erros++;
        }
      }

      // Atualizar estatísticas do vault
      const notas = await dbObsidian.getNotasByVault(input.vaultId);
      const tags = await dbObsidian.getTagsByVault(input.vaultId);
      await dbObsidian.updateVaultStats(input.vaultId, {
        totalNotas: notas.length,
        totalTags: tags.length,
      });

      return {
        success: true,
        importadas,
        erros,
        total: input.notas.length,
      };
    }),

  // ==================== EXPORTAÇÃO ====================

  exportVault: protectedProcedure
    .input(z.object({ vaultId: z.number() }))
    .query(async ({ input }) => {
      const vault = await dbObsidian.getVaultById(input.vaultId);
      if (!vault) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vault não encontrado",
        });
      }

      const notas = await dbObsidian.getNotasByVault(input.vaultId);

      // Buscar tags para cada nota
      const notasComTags = await Promise.all(
        notas.map(async (nota) => {
          const tags = await dbObsidian.getTagsByNota(nota.id);
          return {
            titulo: nota.titulo,
            caminho: nota.caminho,
            conteudo: nota.conteudo,
            frontmatter: nota.frontmatter,
            tags: tags.map(t => t.tag),
            ultimaModificacao: nota.ultimaModificacao,
          };
        })
      );

      return {
        vault: {
          nome: vault.nome,
          descricao: vault.descricao,
        },
        notas: notasComTags,
        totalNotas: notas.length,
      };
    }),

  // ==================== SINCRONIZAÇÃO ====================

  syncVault: protectedProcedure
    .input(z.object({ vaultId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const vaults = await dbObsidian.getVaultsByUser(ctx.user.id);
      const vault = vaults.find(v => v.id === input.vaultId);
      if (!vault) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Vault não encontrado" });
      }

      const result = await obsidianSync.syncVault(input.vaultId);
      return result;
    }),

  startAutoSync: protectedProcedure
    .input(z.object({ vaultId: z.number(), intervalMinutes: z.number().min(1).max(60).optional() }))
    .mutation(async ({ ctx, input }) => {
      const vaults = await dbObsidian.getVaultsByUser(ctx.user.id);
      const vault = vaults.find(v => v.id === input.vaultId);
      if (!vault) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Vault não encontrado" });
      }

      obsidianSync.startAutoSync(input.vaultId, input.intervalMinutes || 5);
      return { success: true, message: "Auto-sync iniciado" };
    }),

  stopAutoSync: protectedProcedure
    .input(z.object({ vaultId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const vaults = await dbObsidian.getVaultsByUser(ctx.user.id);
      const vault = vaults.find(v => v.id === input.vaultId);
      if (!vault) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Vault não encontrado" });
      }

      obsidianSync.stopAutoSync(input.vaultId);
      return { success: true, message: "Auto-sync parado" };
    }),

  getSyncStatus: protectedProcedure
    .input(z.object({ vaultId: z.number() }))
    .query(async ({ ctx, input }) => {
      const vaults = await dbObsidian.getVaultsByUser(ctx.user.id);
      const vault = vaults.find(v => v.id === input.vaultId);
      if (!vault) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Vault não encontrado" });
      }

      return obsidianSync.getSyncStatus(input.vaultId);
    }),

  // ==================== BACKUPS ====================

  createBackup: protectedProcedure
    .input(
      z.object({
        vaultId: z.number(),
        nome: z.string().min(1).max(255),
        descricao: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Implementar criação real de backup (zip + upload S3)
      const notas = await dbObsidian.getNotasByVault(input.vaultId);

      const result = await dbObsidian.createBackup({
        vaultId: input.vaultId,
        nome: input.nome,
        descricao: input.descricao,
        tipoBackup: "manual",
        caminhoArquivo: `/backups/vault-${input.vaultId}-${Date.now()}.zip`,
        urlDownload: "",
        tamanho: 0,
        totalNotas: notas.length,
      });

      return {
        success: true,
        backupId: result.insertId,
      };
    }),

  listBackups: protectedProcedure
    .input(z.object({ vaultId: z.number() }))
    .query(async ({ input }) => {
      const backups = await dbObsidian.getBackupsByVault(input.vaultId);
      return {
        backups,
        count: backups.length,
      };
    }),

  // ==================== SYNC CONFIG ====================

  getSyncConfig: protectedProcedure
    .input(z.object({ vaultId: z.number() }))
    .query(async ({ input }) => {
      const config = await dbObsidian.getSyncConfig(input.vaultId);
      return config;
    }),

  updateSyncConfig: protectedProcedure
    .input(
      z.object({
        vaultId: z.number(),
        syncAutomatico: z.number().optional(),
        intervaloSync: z.number().optional(),
        resolucaoConflito: z.enum(["manual", "local_vence", "remoto_vence", "mais_recente_vence", "mesclar"]).optional(),
        backupAntes: z.number().optional(),
        backupIntervalo: z.number().optional(),
        backupRetencao: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { vaultId, ...config } = input;
      await dbObsidian.createOrUpdateSyncConfig(vaultId, config);

      return {
        success: true,
      };
    }),

  // ==================== GRAPH VIEW ====================

  getGraphData: protectedProcedure
    .input(z.object({ vaultId: z.number() }))
    .query(async ({ ctx, input }) => {
      const vaults = await dbObsidian.getVaultsByUser(ctx.user.id);
      const vault = vaults.find(v => v.id === input.vaultId);
      if (!vault) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Vault não encontrado" });
      }

      const notas = await dbObsidian.getNotasByVault(input.vaultId);

      // Buscar tags para cada nota
      const notasComTags = await Promise.all(
        notas.map(async (nota) => {
          const tags = await dbObsidian.getTagsByNota(nota.id);
          return {
            ...nota,
            tags: tags.map(t => t.tag),
          };
        })
      );

      // Parser de wikilinks: extrair [[nota]] do conteúdo
      const parseWikilinks = (content: string): string[] => {
        const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
        const matches: string[] = [];
        let match;
        while ((match = wikilinkRegex.exec(content)) !== null) {
          matches.push(match[1].trim());
        }
        return matches;
      };

      // Criar mapa de título -> ID para resolução de links
      const tituloParaId = new Map<string, number>();
      notasComTags.forEach(nota => {
        tituloParaId.set(nota.titulo.toLowerCase(), nota.id);
        // Suportar links com alias [[titulo|alias]]
        const aliasMatch = nota.titulo.match(/([^|]+)/);
        if (aliasMatch) {
          tituloParaId.set(aliasMatch[1].toLowerCase().trim(), nota.id);
        }
      });

      // Construir links a partir de wikilinks
      const linksMap = new Map<string, { source: number; target: number }>();
      
      notasComTags.forEach(nota => {
        const wikilinks = parseWikilinks(nota.conteudo);
        wikilinks.forEach(linkTitulo => {
          const targetId = tituloParaId.get(linkTitulo.toLowerCase());
          if (targetId && targetId !== nota.id) {
            // Criar link bidirecional (chave única para evitar duplicatas)
            const linkKey = [nota.id, targetId].sort().join('-');
            linksMap.set(linkKey, {
              source: nota.id,
              target: targetId,
            });
          }
        });
      });

      // Preparar nodes para o grafo
      const nodes = notasComTags.map(nota => ({
        id: nota.id,
        titulo: nota.titulo,
        tags: nota.tags,
        tamanho: nota.tamanho || 0,
      }));

      // Converter links para array
      const links = Array.from(linksMap.values());

      return {
        nodes,
        links,
        totalNotas: nodes.length,
        totalLinks: links.length,
      };
    }),
});
