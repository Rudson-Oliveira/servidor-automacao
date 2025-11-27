import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  listUserNotifications,
  markAsRead,
  markAllAsRead,
  countUnreadNotifications,
} from "../_core/notification-service";

/**
 * Router de Notificações
 * Endpoints para gerenciar notificações do usuário
 */
export const notificationsRouter = router({
  /**
   * Lista notificações do usuário atual
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        onlyUnread: z.boolean().optional().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const notifications = await listUserNotifications(
        ctx.user.id,
        input.limit,
        input.onlyUnread
      );
      return notifications;
    }),

  /**
   * Conta notificações não lidas
   */
  countUnread: protectedProcedure.query(async ({ ctx }) => {
    const count = await countUnreadNotifications(ctx.user.id);
    return { count };
  }),

  /**
   * Marca notificação como lida
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const success = await markAsRead(input.notificationId, ctx.user.id);
      return { success };
    }),

  /**
   * Marca todas as notificações como lidas
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const success = await markAllAsRead(ctx.user.id);
    return { success };
  }),
});
