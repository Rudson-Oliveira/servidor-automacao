import { vi } from "vitest";
import {
  createMockAgent,
  createMockCommand,
  createMockScreenshot,
  createMockLog,
  findInMockDb,
  findByIdInMockDb,
  updateInMockDb,
  deleteFromMockDb,
  getAllFromMockDb,
} from "./db";
import crypto from "crypto";

/**
 * Mock das funções de db-desktop-control.ts
 * Usa banco de dados em memória ao invés de MySQL real
 */

// ============= AGENT HELPERS =============

export function generateAgentToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createAgent(
  dataOrUserId: { userId: number; deviceName: string; platform: string; version: string } | number,
  deviceName?: string,
  platform?: string,
  version?: string
): Promise<any> {
  const token = generateAgentToken();
  
  // Suportar ambas assinaturas: objeto data OU parâmetros separados
  let userId: number;
  let finalDeviceName: string;
  let finalPlatform: string;
  let finalVersion: string;
  
  if (typeof dataOrUserId === "object") {
    // Assinatura com objeto data
    userId = dataOrUserId.userId;
    finalDeviceName = dataOrUserId.deviceName;
    finalPlatform = dataOrUserId.platform;
    finalVersion = dataOrUserId.version;
  } else {
    // Assinatura com parâmetros separados (legacy)
    userId = dataOrUserId;
    finalDeviceName = deviceName!;
    finalPlatform = platform!;
    finalVersion = version!;
  }
  
  const agent = createMockAgent(userId, {
    deviceName: finalDeviceName,
    platform: finalPlatform,
    version: finalVersion,
    token,
    status: "offline",
  });
  return agent;
}

export async function getAgentByToken(token: string): Promise<any | null> {
  const agents = findInMockDb<any>("desktopAgents", (a) => a.token === token);
  return agents[0] || null;
}

export async function getAgentById(agentId: number): Promise<any | null> {
  return findByIdInMockDb<any>("desktopAgents", agentId);
}

export async function updateAgentStatus(
  agentId: number,
  status: "online" | "offline" | "busy" | "error"
): Promise<void> {
  updateInMockDb("desktopAgents", agentId, { status });
}

export async function updateAgentPing(agentId: number, ipAddress?: string): Promise<void> {
  const updates: any = { lastPing: new Date() };
  if (ipAddress) {
    updates.ipAddress = ipAddress;
  }
  updateInMockDb("desktopAgents", agentId, updates);
}

export async function listUserAgents(userId: number): Promise<any[]> {
  return findInMockDb<any>("desktopAgents", (a) => a.userId === userId);
}

export async function deleteAgent(agentId: number, userId: number): Promise<boolean> {
  // Verificar se o agent pertence ao usuário
  const agent = findByIdInMockDb<any>("desktopAgents", agentId);
  if (!agent || agent.userId !== userId) {
    return false;
  }
  return deleteFromMockDb("desktopAgents", agentId);
}

// ============= COMMAND HELPERS =============

export async function createCommand(
  agentId: number,
  userId: number,
  commandType: string,
  commandData?: Record<string, any>
): Promise<any> {
  const command = createMockCommand(agentId, userId, {
    commandType,
    commandData: commandData ? JSON.stringify(commandData) : null,
    status: "pending",
  });
  return command;
}

export async function updateCommandStatus(
  commandId: number,
  status: "pending" | "completed" | "failed",
  result?: Record<string, any>,
  errorMessage?: string,
  executionTimeMs?: number
): Promise<void> {
  const updates: any = {
    status,
    completedAt: status !== "pending" ? new Date() : null,
  };
  if (result) updates.result = JSON.stringify(result);
  if (errorMessage) updates.errorMessage = errorMessage;
  if (executionTimeMs !== undefined) updates.executionTimeMs = executionTimeMs;

  updateInMockDb("desktopCommands", commandId, updates);
}

export async function getCommandById(commandId: number): Promise<any | null> {
  return findByIdInMockDb<any>("desktopCommands", commandId);
}

export async function getPendingCommands(agentId: number): Promise<any[]> {
  return findInMockDb<any>(
    "desktopCommands",
    (c) => c.agentId === agentId && c.status === "pending"
  );
}

export async function listUserCommands(
  userId: number,
  agentId?: number,
  limit: number = 100
): Promise<any[]> {
  let commands = findInMockDb<any>("desktopCommands", (c) => {
    if (c.userId !== userId) return false;
    if (agentId !== undefined && c.agentId !== agentId) return false;
    return true;
  });

  // Ordenar por createdAt desc
  commands.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Aplicar limite
  return commands.slice(0, limit);
}

// ============= SCREENSHOT HELPERS =============

export async function saveScreenshot(
  agentId: number,
  userId: number,
  url: string,
  s3Key: string,
  width?: number,
  height?: number,
  fileSize?: number,
  format?: string
): Promise<number> {
  const screenshot = createMockScreenshot(agentId, userId, {
    url,
    s3Key,
    width,
    height,
    fileSize,
    format,
  });
  return screenshot.id;
}

export async function listUserScreenshots(
  userId: number,
  agentId?: number,
  limit: number = 50
): Promise<any[]> {
  let screenshots = findInMockDb<any>("desktopScreenshots", (s) => {
    if (s.userId !== userId) return false;
    if (agentId !== undefined && s.agentId !== agentId) return false;
    return true;
  });

  // Ordenar por createdAt desc
  screenshots.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Aplicar limite
  return screenshots.slice(0, limit);
}

// ============= LOG HELPERS =============

export async function addLog(
  agentId: number,
  userId: number,
  level: "debug" | "info" | "warning" | "error",
  message: string,
  commandId?: number,
  metadata?: Record<string, any>
): Promise<void> {
  const log = createMockLog(agentId, userId, {
    level,
    message,
    commandId: commandId || null,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

export async function listUserLogs(
  userId: number,
  agentId?: number,
  level?: string,
  limit: number = 100
): Promise<any[]> {
  let logs = findInMockDb<any>("desktopLogs", (l) => {
    if (l.userId !== userId) return false;
    if (agentId !== undefined && l.agentId !== agentId) return false;
    if (level && l.level !== level) return false;
    return true;
  });

  // Ordenar por createdAt desc
  logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Aplicar limite
  return logs.slice(0, limit);
}
