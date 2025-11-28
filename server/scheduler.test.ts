import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  createSchedule,
  pauseSchedule,
  resumeSchedule,
  deleteSchedule,
  listUserSchedules,
} from "./_core/scheduler-service";

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

describe("Scheduler System", () => {
  describe("scheduler-service", () => {
    it("should create a schedule (once)", async () => {
      const scheduleId = await createSchedule({
        userId: 1,
        agentId: 1,
        command: "echo 'test'",
        description: "Test schedule",
        scheduleType: "once",
        scheduleConfig: JSON.stringify({
          executeAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      });

      expect(scheduleId).toBeGreaterThan(0);
    });

    it("should create a schedule (interval)", async () => {
      const scheduleId = await createSchedule({
        userId: 1,
        agentId: 1,
        command: "echo 'interval test'",
        description: "Interval test",
        scheduleType: "interval",
        scheduleConfig: JSON.stringify({
          intervalMinutes: 60,
          startAt: new Date().toISOString(),
        }),
      });

      expect(scheduleId).toBeGreaterThan(0);
    });

    it("should create a schedule (cron)", async () => {
      const scheduleId = await createSchedule({
        userId: 1,
        agentId: 1,
        command: "echo 'cron test'",
        description: "Cron test",
        scheduleType: "cron",
        scheduleConfig: JSON.stringify({
          cronExpression: "0 2 * * *",
        }),
      });

      expect(scheduleId).toBeGreaterThan(0);
    });

    it("should list user schedules", async () => {
      const schedules = await listUserSchedules(1);

      expect(Array.isArray(schedules)).toBe(true);
    });

    it("should pause a schedule", async () => {
      // Criar schedule primeiro
      const scheduleId = await createSchedule({
        userId: 1,
        agentId: 1,
        command: "echo 'pause test'",
        scheduleType: "once",
        scheduleConfig: JSON.stringify({
          executeAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      });

      const success = await pauseSchedule(scheduleId, 1);
      expect(success).toBe(true);
    });

    it("should resume a schedule", async () => {
      // Criar e pausar schedule primeiro
      const scheduleId = await createSchedule({
        userId: 1,
        agentId: 1,
        command: "echo 'resume test'",
        scheduleType: "once",
        scheduleConfig: JSON.stringify({
          executeAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      });

      await pauseSchedule(scheduleId, 1);
      const success = await resumeSchedule(scheduleId, 1);
      expect(success).toBe(true);
    });

    it("should delete a schedule", async () => {
      // Criar schedule primeiro
      const scheduleId = await createSchedule({
        userId: 1,
        agentId: 1,
        command: "echo 'delete test'",
        scheduleType: "once",
        scheduleConfig: JSON.stringify({
          executeAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      });

      const success = await deleteSchedule(scheduleId, 1);
      expect(success).toBe(true);
    });
  });

  describe("scheduler router", () => {
    it("should create schedule via tRPC", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.scheduler.create({
        agentId: 1,
        command: "echo 'tRPC test'",
        description: "tRPC schedule test",
        scheduleType: "once",
        scheduleConfig: JSON.stringify({
          executeAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      });

      expect(result.success).toBe(true);
      expect(result.scheduleId).toBeGreaterThan(0);
    });

    it("should list schedules via tRPC", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const schedules = await caller.scheduler.list();

      expect(Array.isArray(schedules)).toBe(true);
    });

    it("should pause schedule via tRPC", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Criar schedule primeiro
      const createResult = await caller.scheduler.create({
        agentId: 1,
        command: "echo 'pause test'",
        scheduleType: "once",
        scheduleConfig: JSON.stringify({
          executeAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      });

      const result = await caller.scheduler.pause({
        scheduleId: createResult.scheduleId,
      });

      expect(result.success).toBe(true);
    });

    it("should resume schedule via tRPC", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Criar e pausar schedule primeiro
      const createResult = await caller.scheduler.create({
        agentId: 1,
        command: "echo 'resume test'",
        scheduleType: "once",
        scheduleConfig: JSON.stringify({
          executeAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      });

      await caller.scheduler.pause({ scheduleId: createResult.scheduleId });

      const result = await caller.scheduler.resume({
        scheduleId: createResult.scheduleId,
      });

      expect(result.success).toBe(true);
    });

    it("should delete schedule via tRPC", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Criar schedule primeiro
      const createResult = await caller.scheduler.create({
        agentId: 1,
        command: "echo 'delete test'",
        scheduleType: "once",
        scheduleConfig: JSON.stringify({
          executeAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      });

      const result = await caller.scheduler.delete({
        scheduleId: createResult.scheduleId,
      });

      expect(result.success).toBe(true);
    });
  });
});
