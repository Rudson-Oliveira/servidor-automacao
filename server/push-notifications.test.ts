import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema-push";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Push Notifications", () => {
  const testEndpoint = "https://fcm.googleapis.com/fcm/send/test-endpoint-123";
  const testKeys = {
    p256dh: "test-p256dh-key",
    auth: "test-auth-key",
  };

  beforeEach(async () => {
    // Limpar subscriptions de teste
    const db = await getDb();
    if (db) {
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, testEndpoint));
    }
  });

  describe("getPublicKey", () => {
    it("deve retornar a chave pública VAPID", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pushNotifications.getPublicKey();

      expect(result).toHaveProperty("publicKey");
      expect(result.publicKey).toBeTruthy();
      expect(result.publicKey).toMatch(/^B[A-Za-z0-9_-]+$/); // Base64 URL-safe
    });
  });

  describe("subscribe", () => {
    it("deve criar nova subscription com sucesso", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pushNotifications.subscribe({
        endpoint: testEndpoint,
        keys: testKeys,
        userAgent: "Mozilla/5.0 (Test Browser)",
        deviceName: "Test Device",
        enabledEvents: ["whatsapp_message", "task_completed"],
      });

      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBeTypeOf("number");

      // Verificar no banco
      const db = await getDb();
      if (db) {
        const subs = await db
          .select()
          .from(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, testEndpoint));

        expect(subs).toHaveLength(1);
        expect(subs[0]!.userId).toBe(ctx.user.id);
        expect(subs[0]!.deviceName).toBe("Test Device");
        expect(subs[0]!.isActive).toBe(1);
      }
    });

    it("deve atualizar subscription existente", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Primeira subscription
      await caller.pushNotifications.subscribe({
        endpoint: testEndpoint,
        keys: testKeys,
        enabledEvents: ["whatsapp_message"],
      });

      // Segunda subscription (deve atualizar)
      const result = await caller.pushNotifications.subscribe({
        endpoint: testEndpoint,
        keys: { ...testKeys, p256dh: "new-key" },
        enabledEvents: ["whatsapp_message", "task_completed"],
      });

      expect(result.success).toBe(true);

      // Verificar que ainda há apenas 1 subscription
      const db = await getDb();
      if (db) {
        const subs = await db
          .select()
          .from(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, testEndpoint));

        expect(subs).toHaveLength(1);
        const enabledEvents = subs[0]!.enabledEvents as string[];
        expect(enabledEvents).toContain("whatsapp_message");
        expect(enabledEvents).toContain("task_completed");
      }
    });

    it("deve usar eventos padrão se não fornecidos", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.pushNotifications.subscribe({
        endpoint: testEndpoint,
        keys: testKeys,
      });

      const db = await getDb();
      if (db) {
        const subs = await db
          .select()
          .from(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, testEndpoint));

        const enabledEvents = subs[0]!.enabledEvents as string[];
        expect(enabledEvents).toContain("whatsapp_message");
        expect(enabledEvents).toContain("task_completed");
        expect(enabledEvents).toContain("system_alert");
        expect(enabledEvents).toContain("desktop_command");
        expect(enabledEvents).toContain("obsidian_sync");
      }
    });
  });

  describe("unsubscribe", () => {
    it("deve desativar subscription existente", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Criar subscription
      await caller.pushNotifications.subscribe({
        endpoint: testEndpoint,
        keys: testKeys,
      });

      // Desativar
      const result = await caller.pushNotifications.unsubscribe({
        endpoint: testEndpoint,
      });

      expect(result.success).toBe(true);

      // Verificar que foi desativada
      const db = await getDb();
      if (db) {
        const subs = await db
          .select()
          .from(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, testEndpoint));

        expect(subs[0]!.isActive).toBe(0);
      }
    });
  });

  describe("listSubscriptions", () => {
    it("deve listar apenas subscriptions ativas do usuário", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      // Criar 2 subscriptions ativas
      await caller.pushNotifications.subscribe({
        endpoint: testEndpoint,
        keys: testKeys,
        deviceName: "Device 1",
      });

      await caller.pushNotifications.subscribe({
        endpoint: testEndpoint + "-2",
        keys: testKeys,
        deviceName: "Device 2",
      });

      // Desativar uma
      await caller.pushNotifications.unsubscribe({
        endpoint: testEndpoint,
      });

      // Listar
      const result = await caller.pushNotifications.listSubscriptions();

      expect(result).toHaveLength(1);
      expect(result[0]!.deviceName).toBe("Device 2");
      expect(result[0]!.isActive).toBe(1);

      // Limpar
      const db = await getDb();
      if (db) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, testEndpoint + "-2"));
      }
    });

    it("não deve listar subscriptions de outros usuários", async () => {
      const ctx1 = createAuthContext(1);
      const caller1 = appRouter.createCaller(ctx1);

      const ctx2 = createAuthContext(2);
      const caller2 = appRouter.createCaller(ctx2);

      // User 1 cria subscription
      await caller1.pushNotifications.subscribe({
        endpoint: testEndpoint,
        keys: testKeys,
      });

      // User 2 lista (não deve ver do user 1)
      const result = await caller2.pushNotifications.listSubscriptions();

      expect(result).not.toContainEqual(
        expect.objectContaining({ endpoint: testEndpoint })
      );
    });
  });

  describe("updateEnabledEvents", () => {
    it("deve atualizar eventos habilitados", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Criar subscription
      await caller.pushNotifications.subscribe({
        endpoint: testEndpoint,
        keys: testKeys,
        enabledEvents: ["whatsapp_message"],
      });

      // Buscar subscription do banco para pegar ID correto
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const subs = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, testEndpoint));
      
      const subscriptionId = subs[0]!.id;

      // Atualizar eventos
      const result = await caller.pushNotifications.updateEnabledEvents({
        subscriptionId,
        enabledEvents: ["task_completed", "system_alert"],
      });

         expect(result.success).toBe(true);

      // Verificar no banco
      const updatedSubs = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.id, subscriptionId));;

      const enabledEvents = updatedSubs[0]!.enabledEvents as string[];
      expect(enabledEvents).toContain("task_completed");
      expect(enabledEvents).toContain("system_alert");
      expect(enabledEvents).not.toContain("whatsapp_message");
    });
  });

  describe("sendTestNotification", () => {
    it("deve reportar erro se não houver subscriptions", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pushNotifications.sendTestNotification();

      expect(result.success).toBe(false);
      expect(result.message).toBe("No active subscriptions found");
    });

    it("deve tentar enviar para subscriptions ativas", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Criar subscription
      await caller.pushNotifications.subscribe({
        endpoint: testEndpoint,
        keys: testKeys,
      });

      // Enviar teste (vai falhar pois endpoint é fake, mas deve tentar)
      const result = await caller.pushNotifications.sendTestNotification();

      expect(result.success).toBe(true);
      expect(result.total).toBe(1);
      // Pode ter erro pois endpoint é fake
      expect(result.sent + result.errors).toBe(1);
    });
  });
});
