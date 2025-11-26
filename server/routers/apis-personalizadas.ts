/**
 * Router tRPC para APIs Personalizadas
 * Permite usuários configurarem integrações com APIs externas
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { apisPersonalizadas } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { encrypt, decrypt, maskApiKey } from "../_core/encryption";

// ========================================
// SCHEMAS DE VALIDAÇÃO
// ========================================

const ApiPersonalizadaSchema = z.object({
  nome: z.string().min(1).max(200),
  descricao: z.string().optional(),
  url: z.string().url().max(500),
  metodo: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).default("POST"),
  headers: z.string().optional(), // JSON string
  chaveApi: z.string().max(500).optional(),
  tipoAutenticacao: z.enum(["none", "bearer", "api_key", "basic", "custom"]).default("bearer"),
  parametros: z.string().optional(), // JSON string
  ativa: z.number().int().min(0).max(1).default(1),
});

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

// Criptografia agora usa módulo seguro com AES-256-GCM

/**
 * Testa conexão com API
 */
async function testarConexaoApi(api: {
  url: string;
  metodo: string;
  headers?: string | null;
  chaveApi?: string | null;
  tipoAutenticacao?: string | null;
}): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const headersObj: Record<string, string> = api.headers ? JSON.parse(api.headers) : {};
    
    // SEGURANÇA: Descriptografar chave API de forma segura
    if (api.chaveApi && api.tipoAutenticacao) {
      const chaveDescriptografada = decrypt(api.chaveApi);
      
      switch (api.tipoAutenticacao) {
        case "bearer":
          headersObj["Authorization"] = `Bearer ${chaveDescriptografada}`;
          break;
        case "api_key":
          headersObj["X-API-Key"] = chaveDescriptografada;
          break;
        case "basic":
          headersObj["Authorization"] = `Basic ${Buffer.from(chaveDescriptografada).toString("base64")}`;
          break;
      }
    }
    
    const response = await fetch(api.url, {
      method: api.metodo,
      headers: headersObj,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });
    
    if (response.ok) {
      return {
        sucesso: true,
        mensagem: `Conexão bem-sucedida (${response.status} ${response.statusText})`,
      };
    } else {
      return {
        sucesso: false,
        mensagem: `Erro HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      sucesso: false,
      mensagem: error instanceof Error ? error.message : String(error),
    };
  }
}

// ========================================
// ROUTER
// ========================================

export const apisPersonalizadasRouter = router({
  
  /**
   * Lista todas as APIs personalizadas
   */
  listar: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const apis = await db
        .select()
        .from(apisPersonalizadas)
        .orderBy(desc(apisPersonalizadas.createdAt));
      
      // Mascarar chaves API para exibição segura
      return apis.map(api => {
        let chaveMascarada = null;
        
        if (api.chaveApi) {
          try {
            chaveMascarada = maskApiKey(decrypt(api.chaveApi));
          } catch (error) {
            // Se falhar descriptografia, retornar mascarado genérico
            chaveMascarada = "***ERRO***";
          }
        }
        
        return {
          ...api,
          chaveApi: chaveMascarada,
        };
      });
    }),

  /**
   * Busca API por ID
   */
  buscarPorId: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db
        .select()
        .from(apisPersonalizadas)
        .where(eq(apisPersonalizadas.id, input.id))
        .limit(1);
      
      if (result.length === 0) return null;
      
      const api = result[0]!;
      
      // Mascarar chave API para exibição segura
      let chaveMascarada = null;
      
      if (api.chaveApi) {
        try {
          chaveMascarada = maskApiKey(decrypt(api.chaveApi));
        } catch (error) {
          chaveMascarada = "***ERRO***";
        }
      }
      
      return {
        ...api,
        chaveApi: chaveMascarada,
      };
    }),

  /**
   * Cria nova API personalizada
   */
  criar: protectedProcedure
    .input(ApiPersonalizadaSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // SEGURANÇA: Criptografar chave API com AES-256-GCM
      const chaveCriptografada = input.chaveApi ? encrypt(input.chaveApi) : null;
      
      const result = await db.insert(apisPersonalizadas).values({
        ...input,
        chaveApi: chaveCriptografada,
      });
      
      const insertId = Number(result[0].insertId);
      
      return {
        sucesso: true,
        id: insertId,
        mensagem: "API personalizada criada com sucesso",
      };
    }),

  /**
   * Atualiza API personalizada existente
   */
  atualizar: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      dados: ApiPersonalizadaSchema.partial(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // SEGURANÇA: Criptografar chave API com AES-256-GCM
      const dadosAtualizados: any = { ...input.dados };
      if (input.dados.chaveApi) {
        dadosAtualizados.chaveApi = encrypt(input.dados.chaveApi);
      }
      
      await db
        .update(apisPersonalizadas)
        .set(dadosAtualizados)
        .where(eq(apisPersonalizadas.id, input.id));
      
      return {
        sucesso: true,
        mensagem: "API personalizada atualizada com sucesso",
      };
    }),

  /**
   * Deleta API personalizada
   */
  deletar: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .delete(apisPersonalizadas)
        .where(eq(apisPersonalizadas.id, input.id));
      
      return {
        sucesso: true,
        mensagem: "API personalizada deletada com sucesso",
      };
    }),

  /**
   * Testa conexão com API
   */
  testarConexao: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db
        .select()
        .from(apisPersonalizadas)
        .where(eq(apisPersonalizadas.id, input.id))
        .limit(1);
      
      if (result.length === 0) {
        throw new Error("API não encontrada");
      }
      
      const api = result[0]!;
      const teste = await testarConexaoApi(api);
      
      // Atualizar status do teste no banco
      await db
        .update(apisPersonalizadas)
        .set({
          testeConexao: teste.sucesso ? 1 : 2,
          ultimoTeste: new Date(),
          mensagemErro: teste.sucesso ? null : teste.mensagem,
        })
        .where(eq(apisPersonalizadas.id, input.id));
      
      return teste;
    }),

  /**
   * Ativa/desativa API
   */
  toggleAtiva: protectedProcedure
    .input(z.object({
      id: z.number().int().positive(),
      ativa: z.number().int().min(0).max(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(apisPersonalizadas)
        .set({ ativa: input.ativa })
        .where(eq(apisPersonalizadas.id, input.id));
      
      return {
        sucesso: true,
        mensagem: input.ativa === 1 ? "API ativada" : "API desativada",
      };
    }),
});
