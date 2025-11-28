import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  createNotification,
  notifyCommandBlocked,
  notifyAgentOffline,
  notifyAgentOnline,
  notifyCommandFailed,
  notifyScreenshotCaptured,
  notifyCommandSuccess,
} from "./_core/notification-service";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Notifications System", () => {
  describe("notification-service", () => {
    it("should create a notification", async () => {
      const notificationId = await createNotification({
        userId: 1,
        type: "command_success",
        severity: "info",
        title: "Test Notification",
        message: "This is a test notification",
      });

      expect(notificationId).toBeGreaterThan(0);
    });

    it("should notify when command is blocked", async () => {
      const notificationId = await notifyCommandBlocked(
        1,
        1,
        1,
        "rm -rf /",
        "Critical command blocked"
      );

      expect(notificationId).toBeGreaterThan(0);
    });

    it("should notify when agent goes offline", async () => {
      const notificationId = await notifyAgentOffline(1, 1, "Test Device");

      expect(notificationId).toBeGreaterThan(0);
    });

    it("should notify when agent comes online", async () => {
      const notificationId = await notifyAgentOnline(1, 1, "Test Device");

      expect(notificationId).toBeGreaterThan(0);
    });

    it("should notify when command fails", async () => {
      const notificationId = await notifyCommandFailed(
        1,
        1,
        1,
        "test command",
        3,
        "Command execution failed"
      );

      expect(notificationId).toBeGreaterThan(0);
    });

    it("should notify when screenshot is captured", async () => {
      const notificationId = await notifyScreenshotCaptured(
        1,
        1,
        1,
        "https://example.com/screenshot.png"
      );

      expect(notificationId).toBeGreaterThan(0);
    });

    it("should notify when command succeeds", async () => {
      const notificationId = await notifyCommandSuccess(
        1,
        1,
        1,
        "ls -la"
      );

      expect(notificationId).toBeGreaterThan(0);
    });
  });

  describe("notifications router", () => {
    it("should list user notifications", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const notifications = await caller.notifications.list({
        limit: 10,
        onlyUnread: false,
      });

      expect(Array.isArray(notifications)).toBe(true);
    });

    it("should count unread notifications", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.countUnread();

      expect(result).toHaveProperty("count");
      expect(typeof result.count).toBe("number");
    });

    it("should mark notification as read", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Criar notificação primeiro
      const notificationId = await createNotification({
        userId: ctx.user!.id,
        type: "command_success",
        severity: "info",
        title: "Test",
        message: "Test message",
      });

      const result = await caller.notifications.markAsRead({
        notificationId,
      });

      expect(result.success).toBe(true);
    });

    it("should mark all notifications as read", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.markAllAsRead();

      expect(result.success).toBe(true);
    });
  });
});
