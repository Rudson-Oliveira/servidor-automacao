import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import {
  getAgentByToken,
  updateAgentStatus,
  updateAgentPing,
  getPendingCommands,
  updateCommandStatus,
  addLog,
} from "../db-desktop-control";
import { storagePut } from "../storage";

interface AuthenticatedWebSocket extends WebSocket {
  agentId?: number;
  userId?: number;
  token?: string;
  isAlive?: boolean;
  heartbeatInterval?: NodeJS.Timeout;
}

interface WebSocketMessage {
  type: string;
  data?: any;
}

interface CommandMessage {
  type: "command";
  commandId: number;
  commandType: string;
  commandData?: any;
}

interface CommandResultMessage {
  type: "command_result";
  commandId: number;
  success: boolean;
  result?: any;
  error?: string;
  executionTimeMs?: number;
}

interface HeartbeatMessage {
  type: "heartbeat";
  timestamp: number;
}

interface AuthMessage {
  type: "auth";
  token: string;
}

interface LogMessage {
  type: "log";
  level: "debug" | "info" | "warning" | "error";
  message: string;
  metadata?: any;
}

export class DesktopAgentServer {
  private wss: WebSocketServer;
  private clients: Map<number, AuthenticatedWebSocket> = new Map();
  private heartbeatInterval: number = 30000; // 30 segundos

  constructor(port: number = 3001) {
    this.wss = new WebSocketServer({ port });

    this.wss.on("connection", (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      console.log(`[DesktopAgent] Nova conexão de ${req.socket.remoteAddress}`);

      // Marcar como vivo
      ws.isAlive = true;

      // Handler de mensagens
      ws.on("message", async (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message, req);
        } catch (error) {
          console.error("[DesktopAgent] Erro ao processar mensagem:", error);
          this.sendError(ws, "Invalid message format");
        }
      });

      // Handler de pong (resposta ao ping)
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      // Handler de desconexão
      ws.on("close", async () => {
        await this.handleDisconnect(ws);
      });

      // Handler de erro
      ws.on("error", (error) => {
        console.error("[DesktopAgent] Erro no WebSocket:", error);
      });

      // Enviar mensagem de boas-vindas
      this.send(ws, {
        type: "welcome",
        message: "Desktop Agent Server - Autentique-se enviando { type: 'auth', token: 'seu_token' }",
      });
    });

    // Iniciar heartbeat checker
    this.startHeartbeatChecker();

    console.log(`[DesktopAgent] Servidor WebSocket rodando na porta ${port}`);
  }

  /**
   * Processa mensagens recebidas dos clientes
   */
  private async handleMessage(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage,
    req: IncomingMessage
  ): Promise<void> {
    switch (message.type) {
      case "auth":
        await this.handleAuth(ws, message as AuthMessage, req);
        break;

      case "heartbeat":
        await this.handleHeartbeat(ws, message as HeartbeatMessage);
        break;

      case "command_result":
        await this.handleCommandResult(ws, message as CommandResultMessage);
        break;

      case "log":
        await this.handleLog(ws, message as LogMessage);
        break;

      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  /**
   * Autentica um Desktop Agent pelo token
   */
  private async handleAuth(
    ws: AuthenticatedWebSocket,
    message: AuthMessage,
    req: IncomingMessage
  ): Promise<void> {
    const { token } = message;

    if (!token) {
      this.sendError(ws, "Token não fornecido");
      ws.close();
      return;
    }

    // Buscar agent pelo token
    const agent = await getAgentByToken(token);

    if (!agent) {
      this.sendError(ws, "Token inválido");
      ws.close();
      return;
    }

    // Autenticar WebSocket
    ws.agentId = agent.id;
    ws.userId = agent.userId;
    ws.token = token;

    // Salvar cliente autenticado
    this.clients.set(agent.id, ws);

    // Atualizar status para online
    await updateAgentStatus(agent.id, "online");

    // Atualizar IP e ping
    const ipAddress = req.socket.remoteAddress || undefined;
    await updateAgentPing(agent.id, ipAddress);

    // Log de conexão
    await addLog(agent.id, agent.userId, "info", "Desktop Agent conectado via WebSocket", undefined, {
      ipAddress,
      platform: agent.platform,
      version: agent.version,
    });

    // Enviar confirmação
    this.send(ws, {
      type: "auth_success",
      agentId: agent.id,
      deviceName: agent.deviceName,
      message: "Autenticação bem-sucedida",
    });

    console.log(`[DesktopAgent] Agent ${agent.id} (${agent.deviceName}) autenticado`);

    // Iniciar heartbeat
    this.startHeartbeat(ws);

    // Enviar comandos pendentes
    await this.sendPendingCommands(ws);
  }

  /**
   * Processa heartbeat do agent
   */
  private async handleHeartbeat(
    ws: AuthenticatedWebSocket,
    message: HeartbeatMessage
  ): Promise<void> {
    if (!ws.agentId) {
      this.sendError(ws, "Não autenticado");
      return;
    }

    // Atualizar ping
    await updateAgentPing(ws.agentId);

    // Marcar como vivo
    ws.isAlive = true;

    // Responder com pong
    this.send(ws, {
      type: "heartbeat_ack",
      timestamp: Date.now(),
    });
  }

  /**
   * Processa resultado de comando executado
   */
  private async handleCommandResult(
    ws: AuthenticatedWebSocket,
    message: CommandResultMessage
  ): Promise<void> {
    if (!ws.agentId) {
      this.sendError(ws, "Não autenticado");
      return;
    }

    const { commandId, success, result, error, executionTimeMs } = message;

    let processedResult = result;

    // Se o resultado contém screenshot, fazer upload para S3
    if (success && result?.image_base64) {
      try {
        console.log(`[DesktopAgent] Processando screenshot do comando ${commandId}...`);
        
        // Converter base64 para Buffer
        const imageBuffer = Buffer.from(result.image_base64, 'base64');
        
        // Determinar extensão baseado no formato
        const format = result.format || 'png';
        const extension = format === 'jpg' || format === 'jpeg' ? 'jpg' : 'png';
        
        // Gerar nome único para o arquivo
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileName = `screenshots/${ws.agentId}/${timestamp}-${randomSuffix}.${extension}`;
        
        // Upload para S3
        const { url } = await storagePut(
          fileName,
          imageBuffer,
          `image/${extension}`
        );
        
        console.log(`[DesktopAgent] Screenshot salvo em S3: ${url}`);
        
        // Substituir base64 pela URL do S3
        processedResult = {
          ...result,
          image_base64: undefined, // Remover base64 para economizar espaço no DB
          screenshot_url: url,
          screenshot_path: fileName,
        };
        
      } catch (uploadError) {
        console.error(`[DesktopAgent] Erro ao fazer upload do screenshot:`, uploadError);
        // Continuar mesmo se o upload falhar
        processedResult = {
          ...result,
          image_base64: undefined,
          upload_error: 'Falha ao fazer upload do screenshot',
        };
      }
    }

    // Atualizar status do comando
    await updateCommandStatus(
      commandId,
      success ? "completed" : "failed",
      processedResult,
      error,
      executionTimeMs
    );

    // Log
    await addLog(
      ws.agentId,
      ws.userId!,
      success ? "info" : "error",
      `Comando ${commandId} ${success ? "completado" : "falhou"}`,
      commandId,
      { result: processedResult, error, executionTimeMs }
    );

    console.log(
      `[DesktopAgent] Comando ${commandId} ${success ? "completado" : "falhou"} (${executionTimeMs}ms)`
    );
  }

  /**
   * Processa log enviado pelo agent
   */
  private async handleLog(ws: AuthenticatedWebSocket, message: LogMessage): Promise<void> {
    if (!ws.agentId) {
      this.sendError(ws, "Não autenticado");
      return;
    }

    const { level, message: logMessage, metadata } = message;

    await addLog(ws.agentId, ws.userId!, level, logMessage, undefined, metadata);
  }

  /**
   * Envia comandos pendentes para o agent
   */
  private async sendPendingCommands(ws: AuthenticatedWebSocket): Promise<void> {
    if (!ws.agentId) return;

    const commands = await getPendingCommands(ws.agentId);

    for (const command of commands) {
      // Marcar como enviado
      await updateCommandStatus(command.id, "sent");

      // Enviar comando
      const commandMessage: CommandMessage = {
        type: "command",
        commandId: command.id,
        commandType: command.commandType,
        commandData: command.commandData ? JSON.parse(command.commandData) : undefined,
      };

      this.send(ws, commandMessage);

      console.log(`[DesktopAgent] Comando ${command.id} (${command.commandType}) enviado para agent ${ws.agentId}`);
    }
  }

  /**
   * Inicia heartbeat periódico para o agent
   */
  private startHeartbeat(ws: AuthenticatedWebSocket): void {
    if (ws.heartbeatInterval) {
      clearInterval(ws.heartbeatInterval);
    }

    ws.heartbeatInterval = setInterval(() => {
      if (!ws.isAlive) {
        console.log(`[DesktopAgent] Agent ${ws.agentId} não respondeu ao ping, desconectando...`);
        ws.terminate();
        return;
      }

      ws.isAlive = false;
      ws.ping();
    }, this.heartbeatInterval);
  }

  /**
   * Verifica heartbeat de todos os clientes
   */
  private startHeartbeatChecker(): void {
    setInterval(() => {
      this.clients.forEach((ws, agentId) => {
        if (!ws.isAlive) {
          console.log(`[DesktopAgent] Agent ${agentId} inativo, removendo...`);
          this.clients.delete(agentId);
          ws.terminate();
        }
      });
    }, this.heartbeatInterval);
  }

  /**
   * Handler de desconexão
   */
  private async handleDisconnect(ws: AuthenticatedWebSocket): Promise<void> {
    if (ws.agentId) {
      console.log(`[DesktopAgent] Agent ${ws.agentId} desconectado`);

      // Remover cliente
      this.clients.delete(ws.agentId);

      // Atualizar status para offline
      await updateAgentStatus(ws.agentId, "offline");

      // Log de desconexão
      await addLog(ws.agentId, ws.userId!, "info", "Desktop Agent desconectado");

      // Limpar heartbeat
      if (ws.heartbeatInterval) {
        clearInterval(ws.heartbeatInterval);
      }
    }
  }

  /**
   * Envia mensagem para um WebSocket
   */
  private send(ws: WebSocket, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Envia erro para um WebSocket
   */
  private sendError(ws: WebSocket, error: string): void {
    this.send(ws, {
      type: "error",
      error,
    });
  }

  /**
   * Envia comando para um agent específico
   */
  public async sendCommand(
    agentId: number,
    commandId: number,
    commandType: string,
    commandData?: any
  ): Promise<boolean> {
    const ws = this.clients.get(agentId);

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log(`[DesktopAgent] Agent ${agentId} não está conectado`);
      return false;
    }

    const commandMessage: CommandMessage = {
      type: "command",
      commandId,
      commandType,
      commandData,
    };

    this.send(ws, commandMessage);

    // Marcar como enviado
    await updateCommandStatus(commandId, "sent");

    console.log(`[DesktopAgent] Comando ${commandId} (${commandType}) enviado para agent ${agentId}`);

    return true;
  }

  /**
   * Verifica se um agent está conectado
   */
  public isAgentConnected(agentId: number): boolean {
    const ws = this.clients.get(agentId);
    return ws !== undefined && ws.readyState === WebSocket.OPEN;
  }

  /**
   * Retorna número de agents conectados
   */
  public getConnectedAgentsCount(): number {
    return this.clients.size;
  }

  /**
   * Fecha o servidor
   */
  public close(): void {
    this.clients.forEach((ws) => {
      ws.close();
    });
    this.wss.close();
    console.log("[DesktopAgent] Servidor WebSocket fechado");
  }
}

// Singleton instance
let desktopAgentServer: DesktopAgentServer | null = null;

/**
 * Inicia o servidor WebSocket (apenas uma vez)
 */
export function startDesktopAgentServer(port: number = 3001): DesktopAgentServer {
  if (!desktopAgentServer) {
    desktopAgentServer = new DesktopAgentServer(port);
  }
  return desktopAgentServer;
}

/**
 * Retorna a instância do servidor (se existir)
 */
export function getDesktopAgentServer(): DesktopAgentServer | null {
  return desktopAgentServer;
}
