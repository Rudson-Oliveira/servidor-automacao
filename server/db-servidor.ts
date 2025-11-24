/**
 * Funções de banco de dados para Mentor e Leitor de Endpoints
 * Gerencia servidores, departamentos e arquivos mapeados
 */

import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "./db";
import { 
  servidores, 
  departamentos, 
  arquivosMapeados, 
  logsRaspagem,
  alertasServidor,
  catalogosObsidian,
  type Servidor,
  type Departamento,
  type ArquivoMapeado,
  type LogRaspagem,
  type AlertaServidor,
  type CatalogoObsidian,
  type InsertServidor,
  type InsertDepartamento,
  type InsertArquivoMapeado,
  type InsertLogRaspagem,
  type InsertAlertaServidor,
  type InsertCatalogoObsidian
} from "../drizzle/schema";

// ========================================
// SERVIDORES
// ========================================

/**
 * Registra ou atualiza um servidor
 */
export async function upsertServidor(data: Partial<InsertServidor> & { endereco: string }): Promise<Servidor> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se servidor já existe
  const existing = await db
    .select()
    .from(servidores)
    .where(eq(servidores.endereco, data.endereco))
    .limit(1);

  if (existing.length > 0) {
    // Atualizar
    await db
      .update(servidores)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(servidores.id, existing[0]!.id));
    
    return (await db
      .select()
      .from(servidores)
      .where(eq(servidores.id, existing[0]!.id))
      .limit(1))[0]!;
  } else {
    // Inserir
    const result = await db.insert(servidores).values(data as InsertServidor);
    const insertId = Number(result[0].insertId);
    
    return (await db
      .select()
      .from(servidores)
      .where(eq(servidores.id, insertId))
      .limit(1))[0]!;
  }
}

/**
 * Busca servidor por ID
 */
export async function getServidorById(id: number): Promise<Servidor | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(servidores)
    .where(eq(servidores.id, id))
    .limit(1);

  return result[0];
}

/**
 * Lista todos os servidores
 */
export async function listarServidores(): Promise<Servidor[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(servidores)
    .orderBy(desc(servidores.updatedAt));
}

/**
 * Atualiza status do servidor
 */
export async function atualizarStatusServidor(
  id: number, 
  status: 'online' | 'offline' | 'erro' | 'mapeando' | 'raspando',
  mensagemErro?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(servidores)
    .set({ 
      status, 
      mensagemErro,
      updatedAt: new Date() 
    })
    .where(eq(servidores.id, id));
}

// ========================================
// DEPARTAMENTOS
// ========================================

/**
 * Registra ou atualiza um departamento
 */
export async function upsertDepartamento(data: InsertDepartamento): Promise<Departamento> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se departamento já existe
  const existing = await db
    .select()
    .from(departamentos)
    .where(
      and(
        eq(departamentos.servidorId, data.servidorId),
        eq(departamentos.nome, data.nome)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Atualizar
    await db
      .update(departamentos)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(departamentos.id, existing[0]!.id));
    
    return (await db
      .select()
      .from(departamentos)
      .where(eq(departamentos.id, existing[0]!.id))
      .limit(1))[0]!;
  } else {
    // Inserir
    const result = await db.insert(departamentos).values(data);
    const insertId = Number(result[0].insertId);
    
    return (await db
      .select()
      .from(departamentos)
      .where(eq(departamentos.id, insertId))
      .limit(1))[0]!;
  }
}

/**
 * Lista departamentos de um servidor
 */
export async function listarDepartamentosPorServidor(servidorId: number): Promise<Departamento[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(departamentos)
    .where(eq(departamentos.servidorId, servidorId))
    .orderBy(departamentos.nome);
}

// ========================================
// ARQUIVOS MAPEADOS
// ========================================

/**
 * Insere múltiplos arquivos em lote (otimizado)
 */
export async function inserirArquivosLote(arquivos: InsertArquivoMapeado[]): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (arquivos.length === 0) return 0;

  // Inserir em lotes de 100 para evitar timeout
  const batchSize = 100;
  let totalInseridos = 0;

  for (let i = 0; i < arquivos.length; i += batchSize) {
    const batch = arquivos.slice(i, i + batchSize);
    await db.insert(arquivosMapeados).values(batch);
    totalInseridos += batch.length;
  }

  return totalInseridos;
}

/**
 * Busca arquivo por hash (detectar duplicatas)
 */
export async function buscarArquivoPorHash(hash: string): Promise<ArquivoMapeado | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(arquivosMapeados)
    .where(eq(arquivosMapeados.hash, hash))
    .limit(1);

  return result[0];
}

/**
 * Lista arquivos de um departamento
 */
export async function listarArquivosPorDepartamento(
  departamentoId: number,
  limit: number = 100,
  offset: number = 0
): Promise<ArquivoMapeado[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(arquivosMapeados)
    .where(eq(arquivosMapeados.departamentoId, departamentoId))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(arquivosMapeados.dataModificacao));
}

/**
 * Busca arquivos por nome (busca textual)
 */
export async function buscarArquivosPorNome(
  termo: string,
  limit: number = 50
): Promise<ArquivoMapeado[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(arquivosMapeados)
    .where(sql`${arquivosMapeados.nome} LIKE ${`%${termo}%`}`)
    .limit(limit)
    .orderBy(desc(arquivosMapeados.dataModificacao));
}

// ========================================
// LOGS DE RASPAGEM
// ========================================

/**
 * Cria novo log de raspagem
 */
export async function criarLogRaspagem(data: InsertLogRaspagem): Promise<LogRaspagem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(logsRaspagem).values(data);
  const insertId = Number(result[0].insertId);
  
  return (await db
    .select()
    .from(logsRaspagem)
    .where(eq(logsRaspagem.id, insertId))
    .limit(1))[0]!;
}

/**
 * Atualiza log de raspagem
 */
export async function atualizarLogRaspagem(
  id: number,
  data: Partial<InsertLogRaspagem>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(logsRaspagem)
    .set(data)
    .where(eq(logsRaspagem.id, id));
}

/**
 * Lista logs de raspagem de um servidor
 */
export async function listarLogsRaspagem(
  servidorId: number,
  limit: number = 20
): Promise<LogRaspagem[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(logsRaspagem)
    .where(eq(logsRaspagem.servidorId, servidorId))
    .limit(limit)
    .orderBy(desc(logsRaspagem.dataInicio));
}

// ========================================
// ALERTAS
// ========================================

/**
 * Cria novo alerta
 */
export async function criarAlerta(data: InsertAlertaServidor): Promise<AlertaServidor> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(alertasServidor).values(data);
  const insertId = Number(result[0].insertId);
  
  return (await db
    .select()
    .from(alertasServidor)
    .where(eq(alertasServidor.id, insertId))
    .limit(1))[0]!;
}

/**
 * Lista alertas não resolvidos
 */
export async function listarAlertasPendentes(servidorId?: number): Promise<AlertaServidor[]> {
  const db = await getDb();
  if (!db) return [];

  if (servidorId) {
    return await db
      .select()
      .from(alertasServidor)
      .where(and(
        eq(alertasServidor.resolvido, 0),
        eq(alertasServidor.servidorId, servidorId)
      ))
      .orderBy(desc(alertasServidor.createdAt));
  }

  return await db
    .select()
    .from(alertasServidor)
    .where(eq(alertasServidor.resolvido, 0))
    .orderBy(desc(alertasServidor.createdAt));
}

// ========================================
// ARQUIVOS - FUNÇÕES AUXILIARES
// ========================================

/**
 * Busca arquivo por ID
 */
export async function getArquivoById(id: number): Promise<ArquivoMapeado | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(arquivosMapeados).where(eq(arquivosMapeados.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Atualiza arquivo
 */
export async function atualizarArquivo(
  id: number,
  data: Partial<InsertArquivoMapeado>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(arquivosMapeados).set(data).where(eq(arquivosMapeados.id, id));
}

// ========================================
// CATÁLOGOS OBSIDIAN
// ========================================

/**
 * Registra catálogo gerado
 */
export async function registrarCatalogoObsidian(data: InsertCatalogoObsidian): Promise<CatalogoObsidian> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(catalogosObsidian).values(data);
  const insertId = Number(result[0].insertId);
  
  return (await db
    .select()
    .from(catalogosObsidian)
    .where(eq(catalogosObsidian.id, insertId))
    .limit(1))[0]!;
}

/**
 * Lista catálogos gerados
 */
export async function listarCatalogosObsidian(
  servidorId?: number,
  limit: number = 20
): Promise<CatalogoObsidian[]> {
  const db = await getDb();
  if (!db) return [];

  if (servidorId) {
    return await db
      .select()
      .from(catalogosObsidian)
      .where(eq(catalogosObsidian.servidorId, servidorId))
      .limit(limit)
      .orderBy(desc(catalogosObsidian.createdAt));
  }

  return await db
    .select()
    .from(catalogosObsidian)
    .limit(limit)
    .orderBy(desc(catalogosObsidian.createdAt));
}

// ========================================
// ESTATÍSTICAS
// ========================================

/**
 * Obtém estatísticas de um servidor
 */
export async function getEstatisticasServidor(servidorId: number) {
  const db = await getDb();
  if (!db) return null;

  const servidor = await getServidorById(servidorId);
  if (!servidor) return null;

  const deps = await listarDepartamentosPorServidor(servidorId);
  
  // Contar arquivos por tipo
  const tiposQuery = await db
    .select({
      tipo: arquivosMapeados.tipoArquivo,
      count: sql<number>`count(*)`,
      tamanhoTotal: sql<number>`sum(${arquivosMapeados.tamanho})`
    })
    .from(arquivosMapeados)
    .innerJoin(departamentos, eq(arquivosMapeados.departamentoId, departamentos.id))
    .where(eq(departamentos.servidorId, servidorId))
    .groupBy(arquivosMapeados.tipoArquivo);

  return {
    servidor,
    totalDepartamentos: deps.length,
    totalArquivos: servidor.totalArquivos,
    tamanhoTotal: servidor.tamanhoTotal,
    arquivosPorTipo: tiposQuery,
    departamentos: deps
  };
}
