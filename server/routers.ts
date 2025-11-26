import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { servidorRouter } from "./routers/servidor";
import { deepsiteRouter } from "./routers/deepsite";
import { publicProcedure, router } from "./_core/trpc";
import { obsidianRouter } from "./routers/obsidian";
import { integrationRouter } from "./routers/integration";
import { perplexityRouter } from "./routers/perplexity";
import { apisPersonalizadasRouter } from "./routers/apis-personalizadas";
import { desktopRouter } from "./routers/desktop";
import { autoHealingRouter } from "./routers/auto-healing";
import { healthRouter } from "./routers/health";
import { uriSchemesRouter } from "./routers/uri-schemes";
import { whatsappRouter } from './routers/whatsapp';
import { whatsappProtectionRouter } from './routers/whatsapp-protection';
import { whatsappWebRouter } from './routers/whatsapp-web';

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  servidor: servidorRouter,
  deepsite: deepsiteRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Integração com Obsidian
  obsidian: obsidianRouter,

  // Integração com IAs externas
  integration: integrationRouter,

  // Integração com Perplexity AI
  perplexity: perplexityRouter,

  // APIs Personalizadas
  apisPersonalizadas: apisPersonalizadasRouter,

  // Desktop Captures (Comet Vision)
  desktop: desktopRouter,

  // Auto-Healing (Auto-Diagnóstico e Auto-Correção)
  autoHealing: autoHealingRouter,

  // Health Checks (Verificações de Saúde)
  health: healthRouter,

  // URI Schemes (Integração com Programas Locais)
  uriSchemes: uriSchemesRouter,

  // WhatsApp Anti-Bloqueio (Recrutamento)
  whatsapp: whatsappRouter,
  whatsappProtection: whatsappProtectionRouter,
  whatsappWeb: whatsappWebRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
