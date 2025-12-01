import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, Server as HttpServer } from "http";
import { z } from "zod";
import {
  getAgentByToken,
  updateAgentStatus,
  updateAgentPing,
  getPendingCommands,
  updateCommandStatus,
  addLog,
} from "../db-desktop-control";
import { storagePut } from "../storage";
import { orchestrator } from "../_core/agent-orchestrator";

// ============================================================================
// SCHEMAS DE VALIDAÇÃO (ZOD)
// ============================================================================

const MessageSchema = z.object({
  type: z.enum(['auth', 'heartbeat', 'command_result', 'log', 'poll_commands', 'command_status', 'ping', 'pong']),
  timestamp: z.string().refine((t) => !isNaN(Date.parse(t)), {
    message: 'Invalid ISO8601 timestamp'
  }).optional(),
  device_id: z.string().optional(),
  payload: z.any().optional(),
  correlationId: z.string().optional(),
});

const AuthMessageSchema = MessageSchema.extend({
  type: z.literal('auth'),
  token: z.string().min(1),
});

const HeartbeatMessageSchema = MessageSchema.extend({
  type: z.literal('heartbeat'),
  timestamp: z.string().refine((t) => !isNaN(Date.parse(t))),
});

const CommandResultMessageSchema = MessageSchema.extend({
  type: z.literal('command_result'),
  timestamp: z.string().refine((t) => !isNaN(Date.parse(t))),
  commandId: z.number(),
  success: z.boolean(),
  result: z.any().optional(),
  error: z.string().optional(),
  executionTimeMs: z.number().optional(),
});

const LogMessageSchema = MessageSchema.extend({
  type: z.literal('log'),
  timestamp: z.string().refine((t) => !isNaN(Date.parse(t))),
  level: z.enum(['debug', 'info', 'warning', 'error']),
  message: z.string(),
  metadata: z.any().optional(),
});

// ============================================================================
// INTERFACES
// ============================================================================

interface AuthenticatedWebSocket extends WebSocket {
  agentId?: number;
  userId?: number;
  token?: string;
  isAlive?: boolean;
  heartbeatInterval?: NodeJS.Timeout;
  clientId?: string; // IP do cliente para rate limiting
}

interface WebSocketMessage {
  type: string;
  timestamp?: string;
  device_id?: string;
  data?: any;
}

interface CommandMessage {
  type: "command";
  timestamp: string;
  device_id?: string;
  commandId: number;
  commandType: string;
  commandData?: any;
}

interface CommandResultMessage {
  type: "command_result";
  timestamp: string;
  device_id?: string;
  commandId: number;
  success: boolean;
  result?: any;
  error?: string;
  executionTimeMs?: number;
}

interface HeartbeatMessage {
  type: "heartbeat";
  timestamp: string;
  device_id?: string;
}

interface AuthMessage {
  type: "auth";
  timestamp: string;
  device_id?: string;
  token: string;
}

interface LogMessage {
  type: "log";
  timestamp: string;
  device_id?: string;
  level: "debug" | "info" | "warning" | "error";
  message: string;
  metadata?: any;
}

interface ClientConnection {
  ws: AuthenticatedWebSocket;
  messages: number[]; // Timestamps das mensagens
  connected: number; // Timestamp de conexão
}

// ============================================================================
// SERVIDOR DESKTOP AGENT
// ============================================================================

export class DesktopAgentServer {
  private wss: WebSocketServer;
  private clients: Map<number, AuthenticatedWebSocket> = new Map();
  private activeConnections: Map<string, ClientConnection> = new Map();
  private heartbeatInterval: number = 30000; // 30 segundos
  private orchestratorEnabled: boolean = true;
  
  // Limites de proteção DoS
  private readonly MAX_CONNECTIONS = 100;
  private readonly RATE_LIMIT = { max: 10, window: 1000 }; // 10 msg/segundo
  private readonly MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB

  constructor(httpServer: HttpServer) {
    // Criar WebSocket Server sem porta própria (usa HTTP upgrade)
    this.wss = new WebSocketServer({ noServer: true });

    // Handler de upgrade HTTP → WebSocket
    httpServer.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
      
      if (pathname === '/desktop-agent') {
        // Autenticar ANTES do upgrade
        const token = request.headers['authorization']?.replace('Bearer ', '');
        
        if (!token) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          console.log('[DesktopAgent] Upgrade rejeitado: token ausente');
          return;
        }

        // Validar token de forma síncrona (busca no banco)
        this.validateTokenSync(token)
          .then((isValid) => {
            if (!isValid) {
              socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
              socket.destroy();
              console.log('[DesktopAgent] Upgrade rejeitado: token inválido');
              return;
            }

            // Upgrade para WebSocket
            this.wss.handleUpgrade(request, socket, head, (ws) => {
              this.wss.emit('connection', ws, request);
            });
          })
          .catch((error) => {
            console.error('[DesktopAgent] Erro ao validar token:', error);
            socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
            socket.destroy();
          });
      } else {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
      }
    });

    // Handler de conexão WebSocket
    this.wss.on("connection", (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      const clientId = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      ws.clientId = clientId;

      console.log(`[DesktopAgent] Nova conexão de ${clientId}`);

      // Limitar conexões simultâneas
      if (this.activeConnections.size >= this.MAX_CONNECTIONS) {
        ws.close(1008, 'Server capacity reached');
        console.log(`[DesktopAgent] Conexão rejeitada: capacidade máxima atingida (${this.MAX_CONNECTIONS})`);
        return;
      }

      // Registrar conexão
      this.activeConnections.set(clientId, {
        ws,
        messages: [],
        connected: Date.now()
      });

      // Marcar como vivo
      ws.isAlive = true;

      // Handler de mensagens
      ws.on("message", async (data: Buffer) => {
        try {
          // Validar tamanho da mensagem (máx 1MB)
          if (data.length > this.MAX_MESSAGE_SIZE) {
            ws.close(1009, 'Message too large');
            console.log(`[DesktopAgent] Mensagem rejeitada: tamanho ${data.length} bytes excede ${this.MAX_MESSAGE_SIZE}`);
            return;
          }

          // Rate limiting
          const client = this.activeConnections.get(clientId);
          if (client) {
            const now = Date.now();
            client.messages = client.messages.filter(t => now - t < this.RATE_LIMIT.window);
            
            if (client.messages.length >= this.RATE_LIMIT.max) {
              ws.send(JSON.stringify({
                type: 'error',
                error: 'Rate limit exceeded',
                timestamp: new Date().toISOString()
              }));
              console.log(`[DesktopAgent] Rate limit excedido para ${clientId}`);
              return;
            }
            
            client.messages.push(now);
          }

          // Parse e validação com Zod
          const parsed = JSON.parse(data.toString());
          const validated = MessageSchema.parse(parsed);

          await this.handleMessage(ws, validated as WebSocketMessage, req);
        } catch (error) {
          console.error("[DesktopAgent] Erro ao processar mensagem:", error);
          
          if (error instanceof z.ZodError) {
            const errorMessages = error.errors?.map(e => e.message).join(', ') || 'Validation failed';
            this.sendError(ws, "Invalid message format: " + errorMessages);
          } else if (error instanceof SyntaxError) {
            this.sendError(ws, "JSON parse error");
          } else {
            this.sendError(ws, "Invalid message format");
          }
        }
      });

      // Handler de pong (resposta ao ping)
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      // Handler de desconexão
      ws.on("close", async () => {
        await this.handleDisconnect(ws);
        this.activeConnections.delete(clientId);
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

    console.log(`[DesktopAgent] Servidor WebSocket configurado no path /desktop-agent`);
  }

  /**
   * Valida token de forma síncrona (para uso no upgrade handler)
   */
  private async validateTokenSync(token: string): Promise<boolean> {
    try {
      const agent = await getAgentByToken(token);
      return agent !== undefined;
    } catch (error) {
      console.error('[DesktopAgent] Erro ao validar token:', error);
      return false;
    }
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

      case "poll_commands":
        await this.handlePollCommands(ws);
        break;

      case "command_status":
        await this.handleCommandStatus(ws, message as any);
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
    console.log("[DesktopAgent] [DEBUG] handleAuth iniciado");
    console.log("[DesktopAgent] [DEBUG] Mensagem recebida:", JSON.stringify(message));
    
    const { token } = message;

    if (!token) {
      console.log("[DesktopAgent] [ERROR] Token não fornecido na mensagem");
      this.sendError(ws, "Token não fornecido");
      ws.close();
      return;
    }

    console.log("[DesktopAgent] [DEBUG] Token recebido (primeiros 16 chars):", token.substring(0, 16) + "...");
    console.log("[DesktopAgent] [DEBUG] Buscando agent no banco de dados...");
    
    // Buscar agent pelo token
    let agent;
    try {
      agent = await getAgentByToken(token);
      console.log("[DesktopAgent] [DEBUG] Resultado da busca:", agent ? `Agent ID ${agent.id} encontrado` : "Agent não encontrado");
    } catch (error) {
      console.error("[DesktopAgent] [ERROR] Erro ao buscar agent:", error);
      this.sendError(ws, "Erro interno ao validar token");
      ws.close();
      return;
    }

    if (!agent) {
      console.log("[DesktopAgent] [ERROR] Token inválido - agent não encontrado no banco");
      this.sendError(ws, "Token inválido");
      ws.close();
      return;
    }

    console.log("[DesktopAgent] [DEBUG] Agent validado:", {
      id: agent.id,
      deviceName: agent.deviceName,
      platform: agent.platform,
      status: agent.status
    });

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

    // Registrar no orchestrator se habilitado
    if (this.orchestratorEnabled) {
      try {
        orchestrator.registerAgent({
          id: `desktop-${agent.id}`,
          name: agent.deviceName || `Desktop Agent ${agent.id}`,
          capabilities: ["shell", "screenshot", "file-search", "command"],
          maxLoad: 5,
        });
        console.log(`[Orchestrator] Agent ${agent.id} registrado no orchestrator`);
      } catch (error) {
        console.error(`[Orchestrator] Erro ao registrar agent ${agent.id}:`, error);
      }
    }

    // Iniciar heartbeat
    this.startHeartbeat(ws);

    console.log(`[DesktopAgent] Verificando comandos pendentes...`);
    
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
      timestamp: new Date().toISOString(),
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

    console.log(`[DesktopAgent] 📦 Resultado recebido do comando ${commandId}`);
    console.log(`[DesktopAgent]    Sucesso: ${success}`);
    console.log(`[DesktopAgent]    Tempo: ${executionTimeMs}ms`);
    if (error) {
      console.log(`[DesktopAgent]    Erro: ${error}`);
    }

    let processedResult = result;

    // Se o resultado contém screenshot, fazer upload para S3
    if (success && result?.image_base64) {
      try {
        console.log(`[DesktopAgent] Processando screenshot do comando ${commandId}...`);
        
        const imageBuffer = Buffer.from(result.image_base64, 'base64');
        const format = result.format || 'png';
        const extension = format === 'jpg' || format === 'jpeg' ? 'jpg' : 'png';
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileName = `screenshots/${ws.agentId}/${timestamp}-${randomSuffix}.${extension}`;
        
        const { url } = await storagePut(
          fileName,
          imageBuffer,
          `image/${extension}`
        );
        
        console.log(`[DesktopAgent] Screenshot salvo em S3: ${url}`);
        
        processedResult = {
          ...result,
          image_base64: undefined,
          image_url: url,
          image_format: format,
        };
      } catch (uploadError) {
        console.error(`[DesktopAgent] Erro ao fazer upload do screenshot:`, uploadError);
      }
    }

    // Atualizar status do comando
    await updateCommandStatus(
      commandId,
      success ? "completed" : "failed",
      processedResult,
      error
    );

    // Log do resultado
    await addLog(
      ws.agentId,
      ws.userId!,
      success ? "info" : "error",
      `Comando ${commandId} ${success ? "executado" : "falhou"}`,
      commandId,
      {
        executionTimeMs,
        error: error || undefined,
      }
    );

    // Enviar confirmação
    this.send(ws, {
      type: "command_result_ack",
      commandId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Processa log do agent
   */
  private async handleLog(
    ws: AuthenticatedWebSocket,
    message: LogMessage
  ): Promise<void> {
    if (!ws.agentId) {
      this.sendError(ws, "Não autenticado");
      return;
    }

    const { level, message: logMessage, metadata } = message;

    await addLog(ws.agentId, ws.userId!, level, logMessage, undefined, metadata);

    console.log(`[DesktopAgent] Log do agent ${ws.agentId} [${level}]: ${logMessage}`);
  }

  /**
   * Processa poll de comandos pendentes
   */
  private async handlePollCommands(ws: AuthenticatedWebSocket): Promise<void> {
    if (!ws.agentId) {
      this.sendError(ws, "Não autenticado");
      return;
    }

    await this.sendPendingCommands(ws);
  }

  /**
   * Processa atualização de status de comando
   */
  private async handleCommandStatus(
    ws: AuthenticatedWebSocket,
    message: any
  ): Promise<void> {
    if (!ws.agentId) {
      this.sendError(ws, "Não autenticado");
      return;
    }

    const { commandId, status } = message;

    if (!commandId || !status) {
      this.sendError(ws, "commandId e status são obrigatórios");
      return;
    }

    await updateCommandStatus(commandId, status);

    console.log(`[DesktopAgent] Status do comando ${commandId} atualizado para ${status}`);
  }

  /**
   * Envia comandos pendentes para um agent
   */
  private async sendPendingCommands(ws: AuthenticatedWebSocket): Promise<void> {
    if (!ws.agentId) {
      return;
    }

    const pendingCommands = await getPendingCommands(ws.agentId);

    console.log(`[DesktopAgent] Encontrados ${pendingCommands.length} comandos pendentes para agent ${ws.agentId}`);

    for (const command of pendingCommands) {
      const commandMessage: CommandMessage = {
        type: "command",
        timestamp: new Date().toISOString(),
        commandId: command.id,
        commandType: command.commandType,
        commandData: command.commandData,
      };

      this.send(ws, commandMessage);

      await updateCommandStatus(command.id, "sent");

      console.log(`[DesktopAgent] Comando ${command.id} (${command.commandType}) enviado`);
    }
  }

  /**
   * Inicia heartbeat para um cliente
   */
  private startHeartbeat(ws: AuthenticatedWebSocket): void {
    ws.heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.isAlive = false;
        ws.ping();
      }
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

      this.clients.delete(ws.agentId);

      if (this.orchestratorEnabled) {
        try {
          orchestrator.markAgentOffline(`desktop-${ws.agentId}`);
          console.log(`[Orchestrator] Agent ${ws.agentId} marcado como offline no orchestrator`);
        } catch (error) {
          console.error(`[Orchestrator] Erro ao marcar agent ${ws.agentId} offline:`, error);
        }
      }

      await updateAgentStatus(ws.agentId, "offline");
      await addLog(ws.agentId, ws.userId!, "info", "Desktop Agent desconectado");

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
      timestamp: new Date().toISOString(),
      commandId,
      commandType,
      commandData,
    };

    this.send(ws, commandMessage);
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
   * Retorna número de conexões ativas (incluindo não autenticadas)
   */
  public getActiveConnectionsCount(): number {
    return this.activeConnections.size;
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
 * Inicia o servidor WebSocket usando o servidor HTTP existente
 */
export function startDesktopAgentServer(httpServer: HttpServer): DesktopAgentServer {
  if (!desktopAgentServer) {
    desktopAgentServer = new DesktopAgentServer(httpServer);
  }
  return desktopAgentServer;
}

/**
 * Retorna a instância do servidor (se existir)
 */
export function getDesktopAgentServer(): DesktopAgentServer | null {
  return desktopAgentServer;
}
