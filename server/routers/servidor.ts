/**
 * Router tRPC para Mentor e Leitor de Endpoints
 * Endpoints para gerenciar servidores, departamentos e arquivos
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  upsertServidor,
  getServidorById,
  listarServidores,
  atualizarStatusServidor,
  upsertDepartamento,
  listarDepartamentosPorServidor,
  inserirArquivosLote,
  buscarArquivoPorHash,
  listarArquivosPorDepartamento,
  buscarArquivosPorNome,
  criarLogRaspagem,
  atualizarLogRaspagem,
  listarLogsRaspagem,
  criarAlerta,
  listarAlertasPendentes,
  registrarCatalogoObsidian,
  listarCatalogosObsidian,
  getEstatisticasServidor
} from "../db-servidor";

// ========================================
// SCHEMAS DE VALIDAÇÃO
// ========================================

const ServidorSchema = z.object({
  nome: z.string().min(1).max(200),
  endereco: z.string().min(1).max(255),
  tipo: z.enum(['smb', 'ftp', 'sftp', 'http', 'local']).default('smb'),
  descricao: z.string().optional(),
  autenticacaoTipo: z.string().max(50).optional(),
  usuario: z.string().max(255).optional(),
  porta: z.number().int().min(1).max(65535).default(445),
  ativo: z.number().int().min(0).max(1).default(1),
});

const DepartamentoSchema = z.object({
  servidorId: z.number().int().positive(),
  nome: z.string().min(1).max(255),
  caminho: z.string().min(1),
  descricao: z.string().optional(),
  categoria: z.string().max(100).optional(),
  permissoes: z.string().optional(),
  ativo: z.number().int().min(0).max(1).default(1),
});

const ArquivoMapeadoSchema = z.object({
  departamentoId: z.number().int().positive(),
  nome: z.string().min(1).max(500),
  caminhoCompleto: z.string().min(1),
  caminhoRelativo: z.string().optional(),
  extensao: z.string().max(20).optional(),
  tipoArquivo: z.string().max(100).optional(),
  tamanho: z.number().int().min(0).default(0),
  dataCriacao: z.date().optional(),
  dataModificacao: z.date().optional(),
  dataAcesso: z.date().optional(),
  hash: z.string().max(64).optional(),
  conteudoIndexado: z.string().optional(),
  metadados: z.string().optional(),
  tags: z.string().max(500).optional(),
  importante: z.number().int().min(0).max(1).default(0),
  observacoes: z.string().optional(),
});

// ========================================
// ROUTER
// ========================================

export const servidorRouter = router({
  
  // ========================================
  // SERVIDORES
  // ========================================
  
  /**
   * Registra ou atualiza um servidor
   */
  upsertServidor: publicProcedure
    .input(ServidorSchema)
    .mutation(async ({ input }) => {
      return await upsertServidor(input);
    }),

  /**
   * Lista todos os servidores
   */
  listarServidores: publicProcedure
    .query(async () => {
      return await listarServidores();
    }),

  /**
   * Busca servidor por ID
   */
  getServidor: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      return await getServidorById(input.id);
    }),

  /**
   * Atualiza status do servidor
   */
  atualizarStatus: publicProcedure
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(['online', 'offline', 'erro', 'mapeando', 'raspando']),
      mensagemErro: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await atualizarStatusServidor(input.id, input.status, input.mensagemErro);
      return { sucesso: true };
    }),

  /**
   * Obtém estatísticas completas de um servidor
   */
  getEstatisticas: publicProcedure
    .input(z.object({ servidorId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return await getEstatisticasServidor(input.servidorId);
    }),

  // ========================================
  // DEPARTAMENTOS
  // ========================================

  /**
   * Registra ou atualiza um departamento
   */
  upsertDepartamento: publicProcedure
    .input(DepartamentoSchema)
    .mutation(async ({ input }) => {
      return await upsertDepartamento(input);
    }),

  /**
   * Lista departamentos de um servidor
   */
  listarDepartamentos: publicProcedure
    .input(z.object({ servidorId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return await listarDepartamentosPorServidor(input.servidorId);
    }),

  // ========================================
  // ARQUIVOS
  // ========================================

  /**
   * Insere múltiplos arquivos em lote (endpoint principal para Comet)
   */
  inserirArquivosLote: publicProcedure
    .input(z.object({
      departamentoId: z.number().int().positive(),
      arquivos: z.array(ArquivoMapeadoSchema.omit({ departamentoId: true })),
    }))
    .mutation(async ({ input }) => {
      // Adicionar departamentoId a todos os arquivos
      const arquivosComDepartamento = input.arquivos.map(arq => ({
        ...arq,
        departamentoId: input.departamentoId,
      }));

      const totalInseridos = await inserirArquivosLote(arquivosComDepartamento);

      return {
        sucesso: true,
        totalInseridos,
        departamentoId: input.departamentoId,
      };
    }),

  /**
   * Lista arquivos de um departamento
   */
  listarArquivos: publicProcedure
    .input(z.object({
      departamentoId: z.number().int().positive(),
      limit: z.number().int().min(1).max(1000).default(100),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return await listarArquivosPorDepartamento(
        input.departamentoId,
        input.limit,
        input.offset
      );
    }),

  /**
   * Busca arquivos por nome
   */
  buscarArquivos: publicProcedure
    .input(z.object({
      termo: z.string().min(1),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      return await buscarArquivosPorNome(input.termo, input.limit);
    }),

  /**
   * Verifica se arquivo já existe (por hash)
   */
  verificarDuplicata: publicProcedure
    .input(z.object({ hash: z.string().min(1).max(64) }))
    .query(async ({ input }) => {
      const arquivo = await buscarArquivoPorHash(input.hash);
      return {
        existe: !!arquivo,
        arquivo: arquivo || null,
      };
    }),

  // ========================================
  // LOGS DE RASPAGEM
  // ========================================

  /**
   * Inicia novo log de raspagem
   */
  iniciarRaspagem: publicProcedure
    .input(z.object({
      servidorId: z.number().int().positive(),
      tipoOperacao: z.enum(['mapeamento', 'raspagem_completa', 'raspagem_incremental', 'verificacao']),
      iniciadoPor: z.string().max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      return await criarLogRaspagem({
        ...input,
        status: 'iniciado',
        dataInicio: new Date(),
      });
    }),

  /**
   * Atualiza log de raspagem
   */
  atualizarRaspagem: publicProcedure
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(['iniciado', 'em_progresso', 'concluido', 'erro', 'cancelado']).optional(),
      departamentosProcessados: z.number().int().min(0).optional(),
      arquivosNovos: z.number().int().min(0).optional(),
      arquivosAtualizados: z.number().int().min(0).optional(),
      arquivosRemovidos: z.number().int().min(0).optional(),
      errosEncontrados: z.number().int().min(0).optional(),
      tempoExecucao: z.number().int().min(0).optional(),
      detalhes: z.string().optional(),
      mensagemErro: z.string().optional(),
      dataFim: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await atualizarLogRaspagem(id, data);
      return { sucesso: true };
    }),

  /**
   * Lista logs de raspagem
   */
  listarLogs: publicProcedure
    .input(z.object({
      servidorId: z.number().int().positive(),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      return await listarLogsRaspagem(input.servidorId, input.limit);
    }),

  // ========================================
  // ALERTAS
  // ========================================

  /**
   * Cria novo alerta
   */
  criarAlerta: publicProcedure
    .input(z.object({
      servidorId: z.number().int().positive(),
      tipo: z.enum(['espaco_disco', 'arquivo_modificado', 'acesso_negado', 'servidor_offline', 'erro_raspagem', 'arquivo_importante']),
      severidade: z.enum(['info', 'aviso', 'erro', 'critico']).default('info'),
      titulo: z.string().min(1).max(255),
      mensagem: z.string().min(1),
      detalhes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await criarAlerta(input);
    }),

  /**
   * Lista alertas pendentes
   */
  listarAlertas: publicProcedure
    .input(z.object({
      servidorId: z.number().int().positive().optional(),
    }))
    .query(async ({ input }) => {
      return await listarAlertasPendentes(input.servidorId);
    }),

  // ========================================
  // CATÁLOGOS OBSIDIAN
  // ========================================

  /**
   * Registra catálogo gerado
   */
  registrarCatalogo: publicProcedure
    .input(z.object({
      servidorId: z.number().int().positive().optional(),
      departamentoId: z.number().int().positive().optional(),
      titulo: z.string().min(1).max(255),
      tipo: z.enum(['servidor_completo', 'departamento', 'tipo_arquivo', 'personalizado']),
      uri: z.string().min(1),
      nomeArquivo: z.string().min(1).max(255),
      totalLinks: z.number().int().min(0).default(0),
      categorias: z.number().int().min(0).default(0),
      geradoPor: z.string().max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      return await registrarCatalogoObsidian(input);
    }),

  /**
   * Lista catálogos gerados
   */
  listarCatalogos: publicProcedure
    .input(z.object({
      servidorId: z.number().int().positive().optional(),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      return await listarCatalogosObsidian(input.servidorId, input.limit);
    }),
});
