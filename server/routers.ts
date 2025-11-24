import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { servidorRouter } from "./routers/servidor";
import { publicProcedure, router } from "./_core/trpc";
import { obsidianRouter } from "./routers/obsidian";
import { integrationRouter } from "./routers/integration";
import { perplexityRouter } from "./routers/perplexity";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  servidor: servidorRouter,
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

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
