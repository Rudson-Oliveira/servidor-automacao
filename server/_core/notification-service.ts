import { getDb } from "../db";
import { desktopNotifications, type InsertDesktopNotification } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { WebSocketServer } from "ws";

/**
 * Serviço de Notificações em Tempo Real
 * Gerencia notificações push via WebSocket e armazenamento no banco
 */

// WebSocket Server para notificações (porta separada ou reutilizar existente)
let notificationWss: WebSocketServer | null = null;

// Mapa de conexões WebSocket por userId
const userConnections = new Map<number, Set<any>>();

/**
 * Inicializa o servidor WebSocket de notificações
 */
export function initNotificationWebSocket(wss: WebSocketServer) {
  notificationWss = wss;
  console.log("[Notifications] WebSocket server initialized");
}

/**
 * Registra conexão de um usuário
 */
export function registerUserConnection(userId: number, ws: any) {
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set());
  }
  userConnections.get(userId)!.add(ws);
  console.log(`[Notifications] User ${userId} connected (total connections: ${userConnections.get(userId)!.size})`);
}

/**
 * Remove conexão de um usuário
 */
export function unregisterUserConnection(userId: number, ws: any) {
  const connections = userConnections.get(userId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      userConnections.delete(userId);
    }
    console.log(`[Notifications] User ${userId} disconnected`);
  }
}

/**
 * Envia notificação push para um usuário específico
 */
function sendPushNotification(userId: number, notification: any) {
  const connections = userConnections.get(userId);
  if (connections && connections.size > 0) {
    const message = JSON.stringify({
      type: "notification",
      data: notification,
    });
    
    connections.forEach((ws) => {
      if (ws.readyState === 1) { // OPEN
        ws.send(message);
      }
    });
    
    console.log(`[Notifications] Sent push notification to user ${userId} (${connections.size} connections)`);
  }
}

/**
 * Cria uma nova notificação e envia push em tempo real
 */
export async function createNotification(data: InsertDesktopNotification): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.error("[Notifications] Database not available");
    return 0;
  }

  try {
    // Inserir no banco
    const result = await db.insert(desktopNotifications).values(data);
    const notificationId = result[0].insertId;

    // Buscar notificação completa para enviar push
    const notification = await db
      .select()
      .from(desktopNotifications)
      .where(eq(desktopNotifications.id, notificationId))
      .limit(1);

    if (notification.length > 0) {
      // Enviar push em tempo real
      sendPushNotification(data.userId, notification[0]);
    }

    console.log(`[Notifications] Created notification ${notificationId} for user ${data.userId}`);
    return notificationId;
  } catch (error) {
    console.error("[Notifications] Error creating notification:", error);
    return 0;
  }
}

/**
 * Notifica quando comando crítico é bloqueado
 */
export async function notifyCommandBlocked(
  userId: number,
  agentId: number,
  commandId: number,
  command: string,
  reason: string
) {
  return createNotification({
    userId,
    agentId,
    commandId,
    type: "command_blocked",
    severity: "critical",
    title: "Comando Bloqueado",
    message: `O comando "${command}" foi bloqueado por segurança. Motivo: ${reason}`,
    metadata: JSON.stringify({ command, reason }),
  });
}

/**
 * Notifica quando agent fica offline
 */
export async function notifyAgentOffline(
  userId: number,
  agentId: number,
  deviceName: string
) {
  return createNotification({
    userId,
    agentId,
    type: "agent_offline",
    severity: "warning",
    title: "Agent Desconectado",
    message: `O agent "${deviceName}" ficou offline.`,
    metadata: JSON.stringify({ deviceName }),
  });
}

/**
 * Notifica quando agent volta online
 */
export async function notifyAgentOnline(
  userId: number,
  agentId: number,
  deviceName: string
) {
  return createNotification({
    userId,
    agentId,
    type: "agent_online",
    severity: "info",
    title: "Agent Conectado",
    message: `O agent "${deviceName}" voltou online.`,
    metadata: JSON.stringify({ deviceName }),
  });
}

/**
 * Notifica quando comando falha após múltiplas tentativas
 */
export async function notifyCommandFailed(
  userId: number,
  agentId: number,
  commandId: number,
  command: string,
  attempts: number,
  error: string
) {
  return createNotification({
    userId,
    agentId,
    commandId,
    type: "command_failed",
    severity: "error",
    title: "Comando Falhou",
    message: `O comando "${command}" falhou após ${attempts} tentativas. Erro: ${error}`,
    metadata: JSON.stringify({ command, attempts, error }),
  });
}

/**
 * Notifica quando screenshot é capturado
 */
export async function notifyScreenshotCaptured(
  userId: number,
  agentId: number,
  screenshotId: number,
  imageUrl: string
) {
  return createNotification({
    userId,
    agentId,
    type: "screenshot_captured",
    severity: "info",
    title: "Screenshot Capturado",
    message: "Um novo screenshot foi capturado com sucesso.",
    metadata: JSON.stringify({ screenshotId, imageUrl }),
  });
}

/**
 * Notifica quando comando é executado com sucesso
 */
export async function notifyCommandSuccess(
  userId: number,
  agentId: number,
  commandId: number,
  command: string
) {
  return createNotification({
    userId,
    agentId,
    commandId,
    type: "command_success",
    severity: "info",
    title: "Comando Executado",
    message: `O comando "${command}" foi executado com sucesso.`,
    metadata: JSON.stringify({ command }),
  });
}

/**
 * Lista notificações de um usuário
 */
export async function listUserNotifications(
  userId: number,
  limit: number = 50,
  onlyUnread: boolean = false
) {
  const db = await getDb();
  if (!db) return [];

  try {
    let query = db
      .select()
      .from(desktopNotifications)
      .where(eq(desktopNotifications.userId, userId))
      .orderBy(desc(desktopNotifications.createdAt))
      .limit(limit);

    if (onlyUnread) {
      query = db
        .select()
        .from(desktopNotifications)
        .where(
          and(
            eq(desktopNotifications.userId, userId),
            eq(desktopNotifications.isRead, 0)
          )
        )
        .orderBy(desc(desktopNotifications.createdAt))
        .limit(limit);
    }

    return await query;
  } catch (error) {
    console.error("[Notifications] Error listing notifications:", error);
    return [];
  }
}

/**
 * Marca notificação como lida
 */
export async function markAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(desktopNotifications)
      .set({ isRead: 1, readAt: new Date() })
      .where(
        and(
          eq(desktopNotifications.id, notificationId),
          eq(desktopNotifications.userId, userId)
        )
      );
    return true;
  } catch (error) {
    console.error("[Notifications] Error marking as read:", error);
    return false;
  }
}

/**
 * Marca todas as notificações como lidas
 */
export async function markAllAsRead(userId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(desktopNotifications)
      .set({ isRead: 1, readAt: new Date() })
      .where(
        and(
          eq(desktopNotifications.userId, userId),
          eq(desktopNotifications.isRead, 0)
        )
      );
    return true;
  } catch (error) {
    console.error("[Notifications] Error marking all as read:", error);
    return false;
  }
}

/**
 * Conta notificações não lidas
 */
export async function countUnreadNotifications(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db
      .select()
      .from(desktopNotifications)
      .where(
        and(
          eq(desktopNotifications.userId, userId),
          eq(desktopNotifications.isRead, 0)
        )
      );
    return result.length;
  } catch (error) {
    console.error("[Notifications] Error counting unread:", error);
    return 0;
  }
}
