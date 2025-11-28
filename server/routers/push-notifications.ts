import { z } from "zod";
import webpush from "web-push";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { pushSubscriptions } from "../../drizzle/schema-push";
import { eq, and } from "drizzle-orm";

// Configurar VAPID keys
const VAPID_PUBLIC_KEY = "BOC9YMeQErFYwxanllNh3dl3siNwViGhrYXma4CqRU8ZR8cs1FMAYKxMEyRrsMTXMRmSBmsZaQiko3sr7Q_4ie8";
const VAPID_PRIVATE_KEY = "UWcB2dzzNcCuJOyT_Qlm0FJ9e3IQAsfacBao-pcriq4";
const VAPID_SUBJECT = "mailto:admin@servidor-automacao.com";

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export const pushNotificationsRouter = router({
  /**
   * Obter VAPID public key para o frontend
   */
  getPublicKey: protectedProcedure.query(() => {
    return { publicKey: VAPID_PUBLIC_KEY };
  }),

  /**
   * Registrar subscription de push
   */
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
        userAgent: z.string().optional(),
        deviceName: z.string().optional(),
        enabledEvents: z.array(z.string()).default([
          "whatsapp_message",
          "task_completed",
          "system_alert",
          "desktop_command",
          "obsidian_sync",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se já existe subscription para este endpoint
      const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Atualizar subscription existente
        await db
          .update(pushSubscriptions)
          .set({
            keys: input.keys,
            enabledEvents: input.enabledEvents,
            isActive: 1,
            updatedAt: new Date(),
          })
          .where(eq(pushSubscriptions.id, existing[0]!.id));

        return { success: true, subscriptionId: existing[0]!.id };
      }

      // Criar nova subscription
      const result = await db.insert(pushSubscriptions).values({
        userId: ctx.user.id,
        endpoint: input.endpoint,
        keys: input.keys,
        userAgent: input.userAgent,
        deviceName: input.deviceName,
        enabledEvents: input.enabledEvents,
        isActive: 1,
      });

      return { success: true, subscriptionId: Number(result.insertId) };
    }),

  /**
   * Cancelar subscription
   */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(pushSubscriptions)
        .set({ isActive: 0 })
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        );

      return { success: true };
    }),

  /**
   * Listar subscriptions do usuário
   */
  listSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, ctx.user.id),
          eq(pushSubscriptions.isActive, 1)
        )
      );

    return subs;
  }),

  /**
   * Atualizar eventos habilitados
   */
  updateEnabledEvents: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.number(),
        enabledEvents: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(pushSubscriptions)
        .set({ enabledEvents: input.enabledEvents })
        .where(
          and(
            eq(pushSubscriptions.id, input.subscriptionId),
            eq(pushSubscriptions.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Enviar notificação de teste
   */
  sendTestNotification: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Buscar subscriptions ativas do usuário
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, ctx.user.id),
          eq(pushSubscriptions.isActive, 1)
        )
      );

    if (subs.length === 0) {
      return { success: false, message: "No active subscriptions found" };
    }

    const payload = JSON.stringify({
      title: "🔔 Notificação de Teste",
      body: "Seu sistema de notificações push está funcionando!",
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      data: {
        url: "/",
        type: "test",
      },
    });

    let sentCount = 0;
    let errorCount = 0;

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys as { p256dh: string; auth: string },
          },
          payload
        );

        // Atualizar lastUsedAt
        await db
          .update(pushSubscriptions)
          .set({ lastUsedAt: new Date() })
          .where(eq(pushSubscriptions.id, sub.id));

        sentCount++;
      } catch (error) {
        console.error("Error sending push notification:", error);
        errorCount++;

        // Se erro 410 (Gone), desativar subscription
        if ((error as any).statusCode === 410) {
          await db
            .update(pushSubscriptions)
            .set({ isActive: 0 })
            .where(eq(pushSubscriptions.id, sub.id));
        }
      }
    }

    return {
      success: true,
      sent: sentCount,
      errors: errorCount,
      total: subs.length,
    };
  }),
});

/**
 * Helper para enviar notificação push para um usuário específico
 */
export async function sendPushToUser(
  userId: number,
  eventType: string,
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, any>;
  }
) {
  const db = await getDb();
  if (!db) return { success: false, message: "Database not available" };

  // Buscar subscriptions ativas do usuário que têm este evento habilitado
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.isActive, 1)
      )
    );

  const filteredSubs = subs.filter((sub) => {
    const events = sub.enabledEvents as string[];
    return events.includes(eventType);
  });

  if (filteredSubs.length === 0) {
    return { success: false, message: "No subscriptions with this event enabled" };
  }

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: notification.icon || "/icon-192x192.png",
    badge: notification.badge || "/badge-72x72.png",
    data: notification.data || {},
  });

  let sentCount = 0;
  let errorCount = 0;

  for (const sub of filteredSubs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys as { p256dh: string; auth: string },
        },
        payload
      );

      // Atualizar lastUsedAt
      await db
        .update(pushSubscriptions)
        .set({ lastUsedAt: new Date() })
        .where(eq(pushSubscriptions.id, sub.id));

      sentCount++;
    } catch (error) {
      console.error("Error sending push notification:", error);
      errorCount++;

      // Se erro 410 (Gone), desativar subscription
      if ((error as any).statusCode === 410) {
        await db
          .update(pushSubscriptions)
          .set({ isActive: 0 })
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }

  return {
    success: sentCount > 0,
    sent: sentCount,
    errors: errorCount,
    total: filteredSubs.length,
  };
}
