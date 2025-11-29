import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { desktopAgents } from "../drizzle/schema";
import { eq } from "drizzle-orm";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("desktopAuth.autoRegister", () => {
  beforeAll(async () => {
    // Limpar agents de teste anteriores
    const db = await getDb();
    if (db) {
      await db.delete(desktopAgents).where(eq(desktopAgents.deviceName, "TestDevice-AutoRegister"));
    }
  });

  it("deve criar um agent com token automaticamente", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.desktopAuth.autoRegister({
      deviceName: "TestDevice-AutoRegister",
      platform: "Windows",
      version: "1.0.0",
    });

    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.token).toHaveLength(64); // 32 bytes em hex = 64 caracteres
    expect(result.agentId).toBeGreaterThan(0);
    expect(result.deviceName).toBe("TestDevice-AutoRegister");
  });

  it("deve criar token único para cada agent", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result1 = await caller.desktopAuth.autoRegister({
      deviceName: "TestDevice-1",
      platform: "Windows",
      version: "1.0.0",
    });

    const result2 = await caller.desktopAuth.autoRegister({
      deviceName: "TestDevice-2",
      platform: "Linux",
      version: "1.0.0",
    });

    expect(result1.token).not.toBe(result2.token);
    expect(result1.agentId).not.toBe(result2.agentId);
  });

  it("deve validar que deviceName é obrigatório", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.desktopAuth.autoRegister({
        deviceName: "",
        platform: "Windows",
        version: "1.0.0",
      })
    ).rejects.toThrow();
  });

  it("deve salvar agent no banco de dados com status offline", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.desktopAuth.autoRegister({
      deviceName: "TestDevice-DBCheck",
      platform: "macOS",
      version: "1.0.0",
    });

    expect(result.agentId).toBeGreaterThan(0);

    // Verificar no banco usando token (mais confiável que ID)
    const db = await getDb();
    if (db) {
      const agents = await db
        .select()
        .from(desktopAgents)
        .where(eq(desktopAgents.token, result.token));

      expect(agents).toHaveLength(1);
      expect(agents[0]?.deviceName).toBe("TestDevice-DBCheck");
      expect(agents[0]?.status).toBe("offline");
      expect(agents[0]?.platform).toBe("macOS");
      expect(agents[0]?.token).toBe(result.token);
      expect(agents[0]?.userId).toBe(1);
    }
  });
});
