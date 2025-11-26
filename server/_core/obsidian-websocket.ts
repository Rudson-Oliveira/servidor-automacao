/**
 * Servidor WebSocket para Controle Remoto do Obsidian
 * Inspirado na arquitetura do Vercept (Vy)
 * 
 * Permite que agentes locais se conectem e recebam comandos da interface web
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';

interface ObsidianClient {
  ws: WebSocket;
  vaultPath: string;
  connectedAt: Date;
  lastActivity: Date;
  userId?: string;
}

interface ObsidianCommand {
  command: string;
  params: Record<string, unknown>;
  requestId?: string;
}

interface ObsidianResponse {
  type: 'response' | 'file_changed' | 'handshake';
  command?: string;
  success?: boolean;
  data?: unknown;
  error?: string;
  requestId?: string;
}

export class ObsidianWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, ObsidianClient> = new Map();
  private pendingRequests: Map<string, {
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/obsidian'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('[Obsidian WS] Servidor WebSocket iniciado em /ws/obsidian');
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    const clientId = this.generateClientId();
    console.log(`[Obsidian WS] Nova conexão: ${clientId}`);

    const client: ObsidianClient = {
      ws,
      vaultPath: '',
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.clients.set(clientId, client);

    ws.on('message', (data: Buffer) => {
      try {
        const message: ObsidianResponse = JSON.parse(data.toString());
        this.handleMessage(clientId, message);
      } catch (error) {
        console.error('[Obsidian WS] Erro ao processar mensagem:', error);
      }
    });

    ws.on('close', () => {
      console.log(`[Obsidian WS] Conexão fechada: ${clientId}`);
      this.clients.delete(clientId);
    });

    ws.on('error', (error) => {
      console.error(`[Obsidian WS] Erro na conexão ${clientId}:`, error);
    });

    // Ping/pong para manter conexão viva
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  }

  private handleMessage(clientId: string, message: ObsidianResponse) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = new Date();

    if (message.type === 'handshake') {
      // Handshake inicial do agente
      const data = message.data as { vault_path?: string };
      if (data?.vault_path) {
        client.vaultPath = data.vault_path;
        console.log(`[Obsidian WS] Cliente ${clientId} conectado ao vault: ${client.vaultPath}`);
      }
    } else if (message.type === 'response' && message.requestId) {
      // Resposta a um comando enviado
      const pending = this.pendingRequests.get(message.requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.requestId);

        if (message.success) {
          pending.resolve(message.data);
        } else {
          pending.reject(new Error(message.error || 'Comando falhou'));
        }
      }
    } else if (message.type === 'file_changed') {
      // Notificação de mudança de arquivo (broadcast para outros clientes)
      console.log(`[Obsidian WS] Arquivo modificado: ${JSON.stringify(message.data)}`);
      // TODO: Broadcast para interface web
    }
  }

  /**
   * Envia comando para um cliente específico e aguarda resposta
   */
  public async sendCommand(
    clientId: string,
    command: ObsidianCommand,
    timeout: number = 30000
  ): Promise<unknown> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Cliente não encontrado: ${clientId}`);
    }

    if (client.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Cliente desconectado: ${clientId}`);
    }

    const requestId = this.generateRequestId();
    const message = {
      ...command,
      requestId,
    };

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Timeout: comando não respondido'));
      }, timeout);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      client.ws.send(JSON.stringify(message));
    });
  }

  /**
   * Lista todos os clientes conectados
   */
  public listClients(): Array<{
    id: string;
    vaultPath: string;
    connectedAt: Date;
    lastActivity: Date;
  }> {
    const result: Array<{
      id: string;
      vaultPath: string;
      connectedAt: Date;
      lastActivity: Date;
    }> = [];

    this.clients.forEach((client, id) => {
      result.push({
        id,
        vaultPath: client.vaultPath,
        connectedAt: client.connectedAt,
        lastActivity: client.lastActivity,
      });
    });

    return result;
  }

  /**
   * Obtém cliente por ID
   */
  public getClient(clientId: string): ObsidianClient | undefined {
    return this.clients.get(clientId);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let obsidianWsServer: ObsidianWebSocketServer | null = null;

export function initObsidianWebSocket(server: Server): ObsidianWebSocketServer {
  if (!obsidianWsServer) {
    obsidianWsServer = new ObsidianWebSocketServer(server);
  }
  return obsidianWsServer;
}

export function getObsidianWebSocket(): ObsidianWebSocketServer {
  if (!obsidianWsServer) {
    throw new Error('ObsidianWebSocketServer não foi inicializado');
  }
  return obsidianWsServer;
}
