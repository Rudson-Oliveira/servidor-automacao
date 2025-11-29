import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

describe("desktopControl.createAgent", () => {
  it("deve criar um novo agent com token válido", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.desktopControl.createAgent({
      deviceName: "Test Desktop Agent",
      platform: "Windows 11",
      version: "1.0.0",
    });

    expect(result.success).toBe(true);
    expect(result.agent).toBeDefined();
    expect(result.agent.deviceName).toBe("Test Desktop Agent");
    expect(result.agent.platform).toBe("Windows 11");
    expect(result.agent.version).toBe("1.0.0");
    expect(result.agent.token).toBeDefined();
    expect(result.agent.token.length).toBe(64); // Token deve ter 64 caracteres
    expect(result.agent.status).toBe("offline"); // Novo agent começa offline
    expect(result.message).toContain("criado com sucesso");
  });

  it("deve criar agent sem plataforma especificada", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.desktopControl.createAgent({
      deviceName: "My Computer",
      version: "1.0.0",
    });

    expect(result.success).toBe(true);
    expect(result.agent.platform).toBe("Unknown"); // Plataforma padrão quando não especificada
  });

  it("deve rejeitar nome de dispositivo vazio", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.desktopControl.createAgent({
        deviceName: "",
        version: "1.0.0",
      })
    ).rejects.toThrow();
  });

  it("deve gerar tokens únicos para cada agent", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result1 = await caller.desktopControl.createAgent({
      deviceName: "Agent 1",
      version: "1.0.0",
    });

    const result2 = await caller.desktopControl.createAgent({
      deviceName: "Agent 2",
      version: "1.0.0",
    });

    expect(result1.agent.token).not.toBe(result2.agent.token);
    expect(result1.agent.id).not.toBe(result2.agent.id);
  });
});
