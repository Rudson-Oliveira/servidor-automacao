import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  desktopAgents,
  desktopCommands,
  desktopScreenshots,
  desktopLogs,
  type InsertDesktopAgent,
  type InsertDesktopCommand,
  type InsertDesktopScreenshot,
  type InsertDesktopLog,
  type DesktopAgent,
  type DesktopCommand,
} from "../drizzle/schema-desktop-control";
import crypto from "crypto";

/**
 * Gera um token único de 64 caracteres para autenticação do Desktop Agent
 */
export function generateAgentToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Cria um novo Desktop Agent no banco de dados
 * @returns Agent criado com token gerado automaticamente
 */
export async function createAgent(data: {
  userId: number;
  deviceName: string;
  platform: string;
  version: string;
}): Promise<DesktopAgent> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const token = generateAgentToken();

  const [agent] = await db
    .insert(desktopAgents)
    .values({
      userId: data.userId,
      token,
      deviceName: data.deviceName,
      platform: data.platform,
      version: data.version,
      status: "offline",
      lastPing: new Date(),
    })
    .$returningId();

  // Buscar o agent recém-criado
  const [createdAgent] = await db
    .select()
    .from(desktopAgents)
    .where(eq(desktopAgents.id, agent.id))
    .limit(1);

  if (!createdAgent) {
    throw new Error("Failed to create agent");
  }

  return createdAgent;
}

/**
 * Busca um Desktop Agent pelo token de autenticação
 */
export async function getAgentByToken(token: string): Promise<DesktopAgent | null> {
  const db = await getDb();
  if (!db) return null;

  const [agent] = await db
    .select()
    .from(desktopAgents)
    .where(eq(desktopAgents.token, token))
    .limit(1);

  return agent || null;
}

/**
 * Busca um Desktop Agent pelo ID
 */
export async function getAgentById(agentId: number): Promise<DesktopAgent | null> {
  const db = await getDb();
  if (!db) return null;

  const [agent] = await db
    .select()
    .from(desktopAgents)
    .where(eq(desktopAgents.id, agentId))
    .limit(1);

  return agent || null;
}

/**
 * Atualiza o status de um Desktop Agent
 */
export async function updateAgentStatus(
  agentId: number,
  status: "online" | "offline" | "busy" | "error"
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(desktopAgents)
    .set({ status, updatedAt: new Date() })
    .where(eq(desktopAgents.id, agentId));
}

/**
 * Atualiza o último ping de um Desktop Agent
 */
export async function updateAgentPing(agentId: number, ipAddress?: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: { lastPing: Date; ipAddress?: string; updatedAt: Date } = {
    lastPing: new Date(),
    updatedAt: new Date(),
  };

  if (ipAddress) {
    updateData.ipAddress = ipAddress;
  }

  await db.update(desktopAgents).set(updateData).where(eq(desktopAgents.id, agentId));
}

/**
 * Lista todos os Desktop Agents de um usuário
 */
export async function listUserAgents(userId: number): Promise<DesktopAgent[]> {
  const db = await getDb();
  if (!db) return [];

  const agents = await db
    .select()
    .from(desktopAgents)
    .where(eq(desktopAgents.userId, userId))
    .orderBy(desc(desktopAgents.createdAt));

  return agents;
}

/**
 * Deleta um Desktop Agent (apenas se pertencer ao usuário)
 */
export async function deleteAgent(agentId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .delete(desktopAgents)
    .where(and(eq(desktopAgents.id, agentId), eq(desktopAgents.userId, userId)));

  // Drizzle retorna array vazio quando deleta com sucesso
  // Verificar se agent existia antes de deletar
  const agent = await db
    .select()
    .from(desktopAgents)
    .where(eq(desktopAgents.id, agentId))
    .limit(1);

  // Se não existe mais, foi deletado com sucesso
  return agent.length === 0;
}

/**
 * Cria um novo comando para ser executado pelo Desktop Agent
 */
export async function createCommand(
  agentId: number,
  userId: number,
  commandType: string,
  commandData?: Record<string, any>
): Promise<DesktopCommand> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [command] = await db
    .insert(desktopCommands)
    .values({
      agentId,
      userId,
      commandType,
      commandData: commandData ? JSON.stringify(commandData) : null,
      status: "pending",
      sentAt: new Date(),
    })
    .$returningId();

  // Buscar o comando recém-criado
  const [createdCommand] = await db
    .select()
    .from(desktopCommands)
    .where(eq(desktopCommands.id, command.id))
    .limit(1);

  if (!createdCommand) {
    throw new Error("Failed to create command");
  }

  return createdCommand;
}

/**
 * Atualiza o status de um comando
 */
export async function updateCommandStatus(
  commandId: number,
  status: "pending" | "sent" | "executing" | "completed" | "failed",
  result?: any,
  errorMessage?: string,
  executionTimeMs?: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: any = {
    status,
  };

  if (result !== undefined) {
    updateData.result = typeof result === "string" ? result : JSON.stringify(result);
  }

  if (errorMessage !== undefined) {
    updateData.errorMessage = errorMessage;
  }

  if (executionTimeMs !== undefined) {
    updateData.executionTimeMs = executionTimeMs;
  }

  if (status === "completed" || status === "failed") {
    updateData.completedAt = new Date();
  }

  await db.update(desktopCommands).set(updateData).where(eq(desktopCommands.id, commandId));
}

/**
 * Busca um comando pelo ID
 */
export async function getCommandById(commandId: number): Promise<DesktopCommand | null> {
  const db = await getDb();
  if (!db) return null;

  const [command] = await db
    .select()
    .from(desktopCommands)
    .where(eq(desktopCommands.id, commandId))
    .limit(1);

  return command || null;
}

/**
 * Busca comandos pendentes para um Desktop Agent
 */
export async function getPendingCommands(agentId: number): Promise<DesktopCommand[]> {
  const db = await getDb();
  if (!db) return [];

  const commands = await db
    .select()
    .from(desktopCommands)
    .where(and(eq(desktopCommands.agentId, agentId), eq(desktopCommands.status, "pending")))
    .orderBy(desktopCommands.createdAt);

  return commands;
}

/**
 * Lista comandos de um usuário com filtros opcionais
 */
export async function listUserCommands(
  userId: number,
  agentId?: number,
  limit: number = 50
): Promise<DesktopCommand[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(desktopCommands.userId, userId)];
  
  if (agentId !== undefined) {
    conditions.push(eq(desktopCommands.agentId, agentId));
  }

  const commands = await db
    .select()
    .from(desktopCommands)
    .where(and(...conditions))
    .orderBy(desc(desktopCommands.createdAt))
    .limit(limit);

  return commands;
}

/**
 * Salva um screenshot capturado pelo Desktop Agent
 */
export async function saveScreenshot(
  agentId: number,
  userId: number,
  imageUrl: string,
  imageKey: string,
  width?: number,
  height?: number,
  fileSize?: number,
  format: string = "png"
): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [screenshot] = await db
    .insert(desktopScreenshots)
    .values({
      agentId,
      userId,
      imageUrl,
      imageKey,
      width,
      height,
      fileSize,
      format,
    })
    .$returningId();

  return screenshot.id;
}

/**
 * Lista screenshots de um usuário
 */
export async function listUserScreenshots(
  userId: number,
  agentId?: number,
  limit: number = 20
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(desktopScreenshots.userId, userId)];
  
  if (agentId !== undefined) {
    conditions.push(eq(desktopScreenshots.agentId, agentId));
  }

  const screenshots = await db
    .select()
    .from(desktopScreenshots)
    .where(and(...conditions))
    .orderBy(desc(desktopScreenshots.createdAt))
    .limit(limit);

  return screenshots;
}

/**
 * Adiciona um log de execução
 */
export async function addLog(
  agentId: number,
  userId: number,
  level: "debug" | "info" | "warning" | "error",
  message: string,
  commandId?: number,
  metadata?: Record<string, any>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(desktopLogs).values({
    commandId: commandId || null,
    agentId,
    userId,
    level,
    message,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

/**
 * Lista logs de um usuário com filtros opcionais
 */
export async function listUserLogs(
  userId: number,
  agentId?: number,
  level?: "debug" | "info" | "warning" | "error",
  limit: number = 100
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(desktopLogs.userId, userId)];
  
  if (agentId !== undefined) {
    conditions.push(eq(desktopLogs.agentId, agentId));
  }
  
  if (level !== undefined) {
    conditions.push(eq(desktopLogs.level, level));
  }

  const logs = await db
    .select()
    .from(desktopLogs)
    .where(and(...conditions))
    .orderBy(desc(desktopLogs.createdAt))
    .limit(limit);

  return logs;
}
