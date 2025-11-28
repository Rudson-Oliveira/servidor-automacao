import { eq, and, desc, like, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  obsidianVaults,
  obsidianNotas,
  obsidianNotasHistorico,
  obsidianTags,
  obsidianNotasTags,
  obsidianBacklinks,
  obsidianFluxos,
  obsidianFluxosLog,
  obsidianBackups,
  obsidianSyncConfigs,
  obsidianSearchIndex,
  type ObsidianVault,
  type InsertObsidianVault,
  type ObsidianNota,
  type InsertObsidianNota,
  type InsertObsidianNotaHistorico,
  type InsertObsidianTag,
  type InsertObsidianNotaTag,
  type InsertObsidianBacklink,
  type ObsidianFluxo,
  type InsertObsidianFluxo,
  type InsertObsidianFluxoLog,
  type InsertObsidianBackup,
  type ObsidianSyncConfig,
  type InsertObsidianSyncConfig,
} from "../drizzle/schema";
import crypto from "crypto";

/**
 * 🔗 HELPERS DE BANCO PARA INTEGRAÇÃO OBSIDIAN
 */

// ==================== VAULTS ====================

export async function createVault(userId: number, vault: Omit<InsertObsidianVault, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(obsidianVaults).values({
    ...vault,
    userId,
  });

  return result;
}

export async function getVaultsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const vaults = await db.select().from(obsidianVaults).where(eq(obsidianVaults.userId, userId));
  
  // Adicionar status de auto-sync para cada vault
  const vaultsComSync = await Promise.all(
    vaults.map(async (vault) => {
      const syncConfig = await getSyncConfig(vault.id);
      return {
        ...vault,
        autoSyncAtivo: syncConfig?.syncAutomatico === 1,
      };
    })
  );
  
  return vaultsComSync;
}

export async function getVaultById(vaultId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const [vault] = await db.select().from(obsidianVaults).where(eq(obsidianVaults.id, vaultId)).limit(1);
  return vault;
}

export async function updateVault(vaultId: number, updates: Partial<Omit<ObsidianVault, "id" | "userId" | "createdAt">>) {
  const db = await getDb();
  if (!db) return;

  await db.update(obsidianVaults).set(updates).where(eq(obsidianVaults.id, vaultId));
}

export async function updateVaultStats(vaultId: number, stats: { totalNotas?: number; totalTags?: number; totalBacklinks?: number }) {
  const db = await getDb();
  if (!db) return;

  await db.update(obsidianVaults).set(stats).where(eq(obsidianVaults.id, vaultId));
}

export async function updateVaultSync(vaultId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(obsidianVaults).set({ ultimoSync: new Date() }).where(eq(obsidianVaults.id, vaultId));
}

// ==================== NOTAS ====================

export async function createNota(nota: InsertObsidianNota) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calcular hash do conteúdo
  const hash = crypto.createHash("sha256").update(nota.conteudo).digest("hex");

  // Extrair texto plano (remover markdown básico)
  const plainText = nota.conteudo
    .replace(/#{1,6}\s/g, "") // Headers
    .replace(/\*\*(.+?)\*\*/g, "$1") // Bold
    .replace(/\*(.+?)\*/g, "$1") // Italic
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Links
    .replace(/`(.+?)`/g, "$1"); // Code

  const [result] = await db.insert(obsidianNotas).values({
    ...nota,
    hash,
    conteudoPlainText: plainText,
    tamanho: nota.conteudo.length,
    palavras: nota.conteudo.split(/\s+/).length,
  });

  // Criar primeira versão no histórico
  await createNotaHistorico({
    notaId: result.insertId,
    versao: 1,
    conteudo: nota.conteudo,
    frontmatter: nota.frontmatter,
    hash,
    tamanho: nota.conteudo.length,
    modificadoPor: "sistema",
    tipoMudanca: "criacao",
  });

  return result;
}

export async function getNotasByVault(vaultId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(obsidianNotas).where(eq(obsidianNotas.vaultId, vaultId)).orderBy(desc(obsidianNotas.updatedAt));
}

export async function getNotaById(notaId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const [nota] = await db.select().from(obsidianNotas).where(eq(obsidianNotas.id, notaId)).limit(1);
  return nota;
}

export async function updateNota(notaId: number, updates: Partial<InsertObsidianNota>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Se atualizando conteúdo, recalcular hash e versão
  if (updates.conteudo) {
    const nota = await getNotaById(notaId);
    if (!nota) throw new Error("Nota not found");

    const hash = crypto.createHash("sha256").update(updates.conteudo).digest("hex");
    const plainText = updates.conteudo
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .replace(/`(.+?)`/g, "$1");

    updates.hash = hash;
    updates.conteudoPlainText = plainText;
    updates.tamanho = updates.conteudo.length;
    updates.palavras = updates.conteudo.split(/\s+/).length;
    updates.versao = (nota.versao || 1) + 1;

    // Criar nova versão no histórico
    await createNotaHistorico({
      notaId,
      versao: updates.versao,
      conteudo: updates.conteudo,
      frontmatter: updates.frontmatter || nota.frontmatter,
      hash,
      tamanho: updates.conteudo.length,
      modificadoPor: "usuario",
      tipoMudanca: "edicao",
    });
  }

  await db.update(obsidianNotas).set(updates).where(eq(obsidianNotas.id, notaId));
}

export async function deleteNota(notaId: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(obsidianNotas).where(eq(obsidianNotas.id, notaId));
}

export async function detectChanges(vaultId: number, externalNotes: { caminho: string; hash: string }[]) {
  const db = await getDb();
  if (!db) return { novos: [], modificados: [], deletados: [] };

  const notasAtuais = await getNotasByVault(vaultId);
  const notasMap = new Map(notasAtuais.map(n => [n.caminho, n]));
  const externalMap = new Map(externalNotes.map(n => [n.caminho, n.hash]));

  const novos: string[] = [];
  const modificados: string[] = [];
  const deletados: string[] = [];

  // Detectar novos e modificados
  Array.from(externalMap.entries()).forEach(([caminho, hash]) => {
    const notaAtual = notasMap.get(caminho);
    if (!notaAtual) {
      novos.push(caminho);
    } else if (notaAtual.hash !== hash) {
      modificados.push(caminho);
    }
  });

  // Detectar deletados
  Array.from(notasMap.keys()).forEach((caminho) => {
    if (!externalMap.has(caminho)) {
      deletados.push(caminho);
    }
  });

  return { novos, modificados, deletados };
}

// ==================== HISTÓRICO ====================

export async function createNotaHistorico(historico: InsertObsidianNotaHistorico) {
  const db = await getDb();
  if (!db) return;

  await db.insert(obsidianNotasHistorico).values(historico);
}

export async function getNotaHistorico(notaId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(obsidianNotasHistorico)
    .where(eq(obsidianNotasHistorico.notaId, notaId))
    .orderBy(desc(obsidianNotasHistorico.versao));
}

// ==================== TAGS ====================

export async function createOrGetTag(vaultId: number, tagName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Tentar buscar tag existente
  const [existingTag] = await db
    .select()
    .from(obsidianTags)
    .where(and(eq(obsidianTags.vaultId, vaultId), eq(obsidianTags.tag, tagName)))
    .limit(1);

  if (existingTag) {
    // Incrementar uso
    await db
      .update(obsidianTags)
      .set({ usoCount: (existingTag.usoCount || 0) + 1 })
      .where(eq(obsidianTags.id, existingTag.id));
    return existingTag;
  }

  // Criar nova tag
  const [result] = await db.insert(obsidianTags).values({
    vaultId,
    tag: tagName,
    usoCount: 1,
  });

  return { id: result.insertId, vaultId, tag: tagName, usoCount: 1 };
}

export async function linkNotaTag(notaId: number, tagId: number) {
  const db = await getDb();
  if (!db) return;

  await db.insert(obsidianNotasTags).values({ notaId, tagId });
}

export async function getTagsByNota(notaId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: obsidianTags.id,
      tag: obsidianTags.tag,
      cor: obsidianTags.cor,
    })
    .from(obsidianNotasTags)
    .innerJoin(obsidianTags, eq(obsidianNotasTags.tagId, obsidianTags.id))
    .where(eq(obsidianNotasTags.notaId, notaId));
}

export async function getTagsByVault(vaultId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(obsidianTags).where(eq(obsidianTags.vaultId, vaultId)).orderBy(desc(obsidianTags.usoCount));
}

// ==================== BACKLINKS ====================

export async function createBacklink(backlink: InsertObsidianBacklink) {
  const db = await getDb();
  if (!db) return;

  await db.insert(obsidianBacklinks).values(backlink);
}

export async function getBacklinksByNota(notaId: number) {
  const db = await getDb();
  if (!db) return { incoming: [], outgoing: [] };

  const incoming = await db
    .select({
      id: obsidianBacklinks.id,
      notaId: obsidianBacklinks.notaOrigemId,
      titulo: obsidianNotas.titulo,
      caminho: obsidianNotas.caminho,
      tipoLink: obsidianBacklinks.tipoLink,
      contexto: obsidianBacklinks.contexto,
    })
    .from(obsidianBacklinks)
    .innerJoin(obsidianNotas, eq(obsidianBacklinks.notaOrigemId, obsidianNotas.id))
    .where(eq(obsidianBacklinks.notaDestinoId, notaId));

  const outgoing = await db
    .select({
      id: obsidianBacklinks.id,
      notaId: obsidianBacklinks.notaDestinoId,
      titulo: obsidianNotas.titulo,
      caminho: obsidianNotas.caminho,
      tipoLink: obsidianBacklinks.tipoLink,
      contexto: obsidianBacklinks.contexto,
    })
    .from(obsidianBacklinks)
    .innerJoin(obsidianNotas, eq(obsidianBacklinks.notaDestinoId, obsidianNotas.id))
    .where(eq(obsidianBacklinks.notaOrigemId, notaId));

  return { incoming, outgoing };
}

export async function clearBacklinksFromNota(notaOrigemId: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(obsidianBacklinks).where(eq(obsidianBacklinks.notaOrigemId, notaOrigemId));
}

export async function parseAndCreateBacklinks(notaOrigemId: number, vaultId: number, conteudo: string) {
  const db = await getDb();
  if (!db) return;

  // Extrair wikilinks do conteúdo
  const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
  const matches: Array<{ titulo: string; contexto: string }> = [];
  let match;

  const linhas = conteudo.split('\n');
  linhas.forEach((linha, index) => {
    const regex = new RegExp(wikilinkRegex);
    let m;
    while ((m = regex.exec(linha)) !== null) {
      matches.push({
        titulo: m[1].trim(),
        contexto: `Linha ${index + 1}: ${linha.trim().substring(0, 100)}`,
      });
    }
  });

  // Buscar todas as notas do vault para resolver títulos
  const notasDoVault = await getNotasByVault(vaultId);
  const tituloParaId = new Map<string, number>();
  notasDoVault.forEach(nota => {
    tituloParaId.set(nota.titulo.toLowerCase(), nota.id);
  });

  // Criar backlinks para cada wikilink encontrado
  for (const { titulo, contexto } of matches) {
    const notaDestinoId = tituloParaId.get(titulo.toLowerCase());
    if (notaDestinoId && notaDestinoId !== notaOrigemId) {
      await createBacklink({
        vaultId,
        notaOrigemId,
        notaDestinoId,
        tipoLink: 'wikilink',
        contexto,
      });
    }
  }
}

// ==================== FLUXOS ====================

export async function createFluxo(fluxo: InsertObsidianFluxo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(obsidianFluxos).values(fluxo);
  return result;
}

export async function getFluxosByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(obsidianFluxos).where(eq(obsidianFluxos.userId, userId)).orderBy(desc(obsidianFluxos.updatedAt));
}

export async function getFluxoById(fluxoId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const [fluxo] = await db.select().from(obsidianFluxos).where(eq(obsidianFluxos.id, fluxoId)).limit(1);
  return fluxo;
}

export async function updateFluxo(fluxoId: number, updates: Partial<InsertObsidianFluxo>) {
  const db = await getDb();
  if (!db) return;

  await db.update(obsidianFluxos).set(updates).where(eq(obsidianFluxos.id, fluxoId));
}

export async function logFluxoExecution(log: InsertObsidianFluxoLog) {
  const db = await getDb();
  if (!db) return;

  await db.insert(obsidianFluxosLog).values(log);

  // Atualizar estatísticas do fluxo
  const fluxo = await getFluxoById(log.fluxoId);
  if (fluxo) {
    await db
      .update(obsidianFluxos)
      .set({
        totalExecucoes: (fluxo.totalExecucoes || 0) + 1,
        totalSucessos: log.status === "sucesso" ? (fluxo.totalSucessos || 0) + 1 : fluxo.totalSucessos,
        totalFalhas: log.status === "falha" ? (fluxo.totalFalhas || 0) + 1 : fluxo.totalFalhas,
        ultimaExecucao: new Date(),
      })
      .where(eq(obsidianFluxos.id, log.fluxoId));
  }
}

// ==================== BACKUPS ====================

export async function createBackup(backup: InsertObsidianBackup) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(obsidianBackups).values(backup);
  return result;
}

export async function getBackupsByVault(vaultId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(obsidianBackups).where(eq(obsidianBackups.vaultId, vaultId)).orderBy(desc(obsidianBackups.createdAt));
}

// ==================== SYNC CONFIGS ====================

export async function createOrUpdateSyncConfig(vaultId: number, config: Omit<InsertObsidianSyncConfig, "vaultId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existing] = await db.select().from(obsidianSyncConfigs).where(eq(obsidianSyncConfigs.vaultId, vaultId)).limit(1);

  if (existing) {
    await db.update(obsidianSyncConfigs).set(config).where(eq(obsidianSyncConfigs.vaultId, vaultId));
    return existing;
  }

  const [result] = await db.insert(obsidianSyncConfigs).values({
    ...config,
    vaultId,
  });

  return result;
}

export async function getSyncConfig(vaultId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const [config] = await db.select().from(obsidianSyncConfigs).where(eq(obsidianSyncConfigs.vaultId, vaultId)).limit(1);
  return config;
}

// ==================== BUSCA ====================

export async function searchNotas(vaultId: number, query: string) {
  const db = await getDb();
  if (!db) return [];

  const searchPattern = `%${query}%`;

  return db
    .select()
    .from(obsidianNotas)
    .where(
      and(
        eq(obsidianNotas.vaultId, vaultId),
        sql`(${obsidianNotas.titulo} LIKE ${searchPattern} OR ${obsidianNotas.conteudoPlainText} LIKE ${searchPattern})`
      )
    )
    .limit(50);
}
