/**
 * Router de WhatsApp Web
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { whatsappWebService } from '../_core/whatsapp-web-service';

export const whatsappWebRouter = router({
  /**
   * Criar nova sessão WhatsApp Web
   */
  createSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      phone: z.string(),
    }))
    .mutation(async ({ input }) => {
      const session = await whatsappWebService.createSession(input.sessionId, input.phone);

      return {
        success: true,
        session: {
          id: session.id,
          phone: session.phone,
          status: session.status,
          qrCode: session.qrCode,
        },
      };
    }),

  /**
   * Obter status de uma sessão
   */
  getSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ input }) => {
      const session = whatsappWebService.getSession(input.sessionId);

      if (!session) {
        return {
          found: false,
        };
      }

      return {
        found: true,
        session: {
          id: session.id,
          phone: session.phone,
          status: session.status,
          qrCode: session.qrCode,
          lastQrUpdate: session.lastQrUpdate,
          connectedAt: session.connectedAt,
          error: session.error,
        },
      };
    }),

  /**
   * Listar todas as sessões
   */
  listSessions: protectedProcedure.query(async () => {
    const sessions = whatsappWebService.getAllSessions();

    return {
      sessions: sessions.map(s => ({
        id: s.id,
        phone: s.phone,
        status: s.status,
        connectedAt: s.connectedAt,
        error: s.error,
      })),
      count: sessions.length,
    };
  }),

  /**
   * Enviar mensagem via WhatsApp Web
   */
  sendMessage: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      to: z.string(),
      message: z.string(),
      campaign: z.string().optional(),
      templateId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await whatsappWebService.sendMessage(
        input.sessionId,
        input.to,
        input.message,
        {
          campaign: input.campaign,
          templateId: input.templateId,
        }
      );

      return result;
    }),

  /**
   * Destruir sessão
   */
  destroySession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const success = await whatsappWebService.destroySession(input.sessionId);

      return {
        success,
        sessionId: input.sessionId,
      };
    }),

  /**
   * Logout de sessão
   */
  logoutSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const success = await whatsappWebService.logoutSession(input.sessionId);

      return {
        success,
        sessionId: input.sessionId,
      };
    }),

  /**
   * Obter número conectado
   */
  getConnectedNumber: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ input }) => {
      const number = await whatsappWebService.getConnectedNumber(input.sessionId);

      return {
        sessionId: input.sessionId,
        number,
      };
    }),

  /**
   * Subscribe para eventos de sessão (QR code, status, etc)
   */
  subscribeToEvents: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .subscription(async function* ({ input }) {
      // Criar canal de eventos
      const eventQueue: any[] = [];
      let resolve: ((value: any) => void) | null = null;

      const handlers = {
        qr_code: (data: any) => {
          if (data.sessionId === input.sessionId) {
            const event = { type: 'qr_code', data };
            if (resolve) {
              resolve(event);
              resolve = null;
            } else {
              eventQueue.push(event);
            }
          }
        },
        authenticated: (data: any) => {
          if (data.sessionId === input.sessionId) {
            const event = { type: 'authenticated', data };
            if (resolve) {
              resolve(event);
              resolve = null;
            } else {
              eventQueue.push(event);
            }
          }
        },
        ready: (data: any) => {
          if (data.sessionId === input.sessionId) {
            const event = { type: 'ready', data };
            if (resolve) {
              resolve(event);
              resolve = null;
            } else {
              eventQueue.push(event);
            }
          }
        },
        disconnected: (data: any) => {
          if (data.sessionId === input.sessionId) {
            const event = { type: 'disconnected', data };
            if (resolve) {
              resolve(event);
              resolve = null;
            } else {
              eventQueue.push(event);
            }
          }
        },
      };

      // Registrar listeners
      whatsappWebService.on('qr_code', handlers.qr_code);
      whatsappWebService.on('authenticated', handlers.authenticated);
      whatsappWebService.on('ready', handlers.ready);
      whatsappWebService.on('disconnected', handlers.disconnected);

      try {
        // Yield eventos
        while (true) {
          if (eventQueue.length > 0) {
            yield eventQueue.shift();
          } else {
            await new Promise<any>(r => {
              resolve = r;
            });
            if (eventQueue.length > 0) {
              yield eventQueue.shift();
            }
          }
        }
      } finally {
        // Cleanup
        whatsappWebService.off('qr_code', handlers.qr_code);
        whatsappWebService.off('authenticated', handlers.authenticated);
        whatsappWebService.off('ready', handlers.ready);
        whatsappWebService.off('disconnected', handlers.disconnected);
      }
    }),
});
