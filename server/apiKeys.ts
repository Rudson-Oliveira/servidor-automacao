import { eq } from "drizzle-orm";
import { apiKeys, InsertApiKey } from "../drizzle/schema";
import { getDb } from "./db";
import crypto from "crypto";

/**
 * Gerar uma chave API única e segura
 */
export function gerarChaveAPI(): string {
  const prefixo = "COMET_API_KEY";
  const randomBytes = crypto.randomBytes(32).toString("hex");
  return `${prefixo}_${randomBytes}`;
}

/**
 * Criar uma nova chave API
 */
export async function criarApiKey(dados: Omit<InsertApiKey, "chave">): Promise<ApiKey | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[API Keys] Banco de dados indisponível");
    return null;
  }

  try {
    const chave = gerarChaveAPI();
    
    const novaChave: InsertApiKey = {
      ...dados,
      chave,
      ativa: 1,
      totalRequisicoes: 0,
    };

    const resultado = await db.insert(apiKeys).values(novaChave);
    
    // Buscar a chave criada
    const chaveCriada = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.chave, chave))
      .limit(1);

    return chaveCriada[0] || null;
  } catch (erro) {
    console.error("[API Keys] Erro ao criar chave:", erro);
    return null;
  }
}

/**
 * Validar uma chave API
 */
export async function validarApiKey(chave: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const resultado = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.chave, chave))
      .limit(1);

    if (resultado.length === 0) return false;

    const apiKey = resultado[0];
    
    // Verificar se está ativa
    if (apiKey.ativa !== 1) return false;

    // Atualizar último uso e contador
    await db
      .update(apiKeys)
      .set({
        ultimoUso: new Date(),
        totalRequisicoes: (apiKey.totalRequisicoes || 0) + 1,
      })
      .where(eq(apiKeys.id, apiKey.id));

    return true;
  } catch (erro) {
    console.error("[API Keys] Erro ao validar chave:", erro);
    return false;
  }
}

/**
 * Listar todas as chaves API
 */
export async function listarApiKeys(): Promise<ApiKey[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const chaves = await db.select().from(apiKeys);
    return chaves;
  } catch (erro) {
    console.error("[API Keys] Erro ao listar chaves:", erro);
    return [];
  }
}

/**
 * Desativar uma chave API
 */
export async function desativarApiKey(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(apiKeys)
      .set({ ativa: 0 })
      .where(eq(apiKeys.id, id));
    
    return true;
  } catch (erro) {
    console.error("[API Keys] Erro ao desativar chave:", erro);
    return false;
  }
}

/**
 * Reativar uma chave API
 */
export async function reativarApiKey(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(apiKeys)
      .set({ ativa: 1 })
      .where(eq(apiKeys.id, id));
    
    return true;
  } catch (erro) {
    console.error("[API Keys] Erro ao reativar chave:", erro);
    return false;
  }
}

// Tipos exportados
import type { ApiKey } from "../drizzle/schema";
export type { ApiKey };
