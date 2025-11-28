/**
 * Router de URI Schemes Genéricos
 * Endpoints para gerar URIs de programas locais
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import {
  generateURI,
  generateObsidianNewNote,
  generateVSCodeOpenFile,
  generateSlackChannel,
  generateSpotifyTrack,
  generateZoomJoin,
  isURISafe,
  getSupportedPrograms,
  getProgramTemplate,
  type URISchemeConfig,
} from '../_core/uri-schemes';

export const uriSchemesRouter = router({
  /**
   * GET /api/trpc/uriSchemes.listPrograms
   * Lista todos os programas suportados
   */
  listPrograms: publicProcedure.query(() => {
    return getSupportedPrograms();
  }),

  /**
   * GET /api/trpc/uriSchemes.getProgram
   * Obtém template de um programa específico
   */
  getProgram: publicProcedure
    .input(z.object({
      programName: z.string(),
    }))
    .query(({ input }) => {
      const template = getProgramTemplate(input.programName);
      
      if (!template) {
        throw new Error(`Programa "${input.programName}" não suportado`);
      }

      return template;
    }),

  /**
   * POST /api/trpc/uriSchemes.generate
   * Gera URI genérica para qualquer programa
   */
  generate: publicProcedure
    .input(z.object({
      scheme: z.string(),
      action: z.string().optional(),
      params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    }))
    .mutation(({ input }) => {
      const config: URISchemeConfig = {
        scheme: input.scheme,
        action: input.action,
        params: input.params as Record<string, string | number | boolean> | undefined,
      };

      const uri = generateURI(config);

      // Validar segurança
      if (!isURISafe(uri)) {
        throw new Error('URI gerada contém padrões inseguros');
      }

      return {
        uri,
        safe: true,
        program: input.scheme,
      };
    }),

  /**
   * POST /api/trpc/uriSchemes.obsidianNewNote
   * Gera URI para criar nota no Obsidian
   */
  obsidianNewNote: publicProcedure
    .input(z.object({
      vault: z.string(),
      fileName: z.string(),
      content: z.string(),
      silent: z.boolean().optional(),
      append: z.boolean().optional(),
      overwrite: z.boolean().optional(),
    }))
    .mutation(({ input }) => {
      const uri = generateObsidianNewNote(
        input.vault,
        input.fileName,
        input.content,
        {
          silent: input.silent,
          append: input.append,
          overwrite: input.overwrite,
        }
      );

      return {
        uri,
        safe: true,
        program: 'obsidian',
        action: 'new',
      };
    }),

  /**
   * POST /api/trpc/uriSchemes.vscodeOpenFile
   * Gera URI para abrir arquivo no VSCode
   */
  vscodeOpenFile: publicProcedure
    .input(z.object({
      filePath: z.string(),
      line: z.number().optional(),
      column: z.number().optional(),
    }))
    .mutation(({ input }) => {
      const uri = generateVSCodeOpenFile(
        input.filePath,
        input.line,
        input.column
      );

      return {
        uri,
        safe: true,
        program: 'vscode',
        action: 'open',
      };
    }),

  /**
   * POST /api/trpc/uriSchemes.slackChannel
   * Gera URI para abrir canal do Slack
   */
  slackChannel: publicProcedure
    .input(z.object({
      teamId: z.string(),
      channelId: z.string(),
    }))
    .mutation(({ input }) => {
      const uri = generateSlackChannel(input.teamId, input.channelId);

      return {
        uri,
        safe: true,
        program: 'slack',
        action: 'channel',
      };
    }),

  /**
   * POST /api/trpc/uriSchemes.spotifyTrack
   * Gera URI para tocar música no Spotify
   */
  spotifyTrack: publicProcedure
    .input(z.object({
      trackId: z.string(),
    }))
    .mutation(({ input }) => {
      const uri = generateSpotifyTrack(input.trackId);

      return {
        uri,
        safe: true,
        program: 'spotify',
        action: 'track',
      };
    }),

  /**
   * POST /api/trpc/uriSchemes.zoomJoin
   * Gera URI para entrar em reunião do Zoom
   */
  zoomJoin: publicProcedure
    .input(z.object({
      meetingId: z.string(),
      password: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const uri = generateZoomJoin(input.meetingId, input.password);

      return {
        uri,
        safe: true,
        program: 'zoom',
        action: 'join',
      };
    }),

  /**
   * POST /api/trpc/uriSchemes.validate
   * Valida se URI é segura
   */
  validate: publicProcedure
    .input(z.object({
      uri: z.string(),
    }))
    .mutation(({ input }) => {
      const safe = isURISafe(input.uri);

      return {
        uri: input.uri,
        safe,
        message: safe
          ? 'URI válida e segura'
          : 'URI contém padrões potencialmente inseguros',
      };
    }),
});
