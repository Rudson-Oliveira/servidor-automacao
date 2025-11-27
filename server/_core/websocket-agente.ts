import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

// Tipos de mensagens WebSocket
export type MessageType = 
  | 'ping'
  | 'pong'
  | 'register'
  | 'command'
  | 'result'
  | 'error'
  | 'notification';

export interface WSMessage {
  type: MessageType;
  payload: any;
  timestamp: number;
  messageId?: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  version: string;
  platform: string;
  hostname: string;
  ip: string;
  connectedAt: number;
  lastHeartbeat: number;
  status: 'online' | 'offline' | 'executing';
  ws: WebSocket;
}

class WebSocketAgentServer {
  private wss: WebSocketServer | null = null;
  private agents: Map<string, AgentInfo> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 segundos
  private readonly HEARTBEAT_TIMEOUT = 60000; // 60 segundos

  constructor() {
    console.log('[WebSocket Agent] Inicializando servidor...');
  }

  /**
   * Inicializa o servidor WebSocket
   */
  public initialize(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/agente'
    });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    // Iniciar monitoramento de heartbeat
    this.startHeartbeatMonitor();

    console.log('[WebSocket Agent] Servidor inicializado em /ws/agente');
  }

  /**
   * Manipula nova conexão
   */
  private handleConnection(ws: WebSocket, req: IncomingMessage) {
    const ip = req.socket.remoteAddress || 'unknown';
    console.log(`[WebSocket Agent] Nova conexão de ${ip}`);

    // Aguardar registro do agente
    let registered = false;
    const registrationTimeout = setTimeout(() => {
      if (!registered) {
        console.log(`[WebSocket Agent] Timeout de registro para ${ip}`);
        ws.close(1008, 'Registration timeout');
      }
    }, 10000); // 10 segundos para registrar

    ws.on('message', (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        
        if (message.type === 'register' && !registered) {
          clearTimeout(registrationTimeout);
          this.registerAgent(ws, message.payload, ip);
          registered = true;
        } else if (registered) {
          this.handleMessage(ws, message);
        }
      } catch (error) {
        console.error('[WebSocket Agent] Erro ao processar mensagem:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket Agent] Erro na conexão:', error);
    });
  }

  /**
   * Registra um novo agente
   */
  private registerAgent(ws: WebSocket, payload: any, ip: string) {
    const { id, name, version, platform, hostname } = payload;

    if (!id || !name || !version) {
      this.sendError(ws, 'Missing required fields: id, name, version');
      ws.close(1008, 'Invalid registration');
      return;
    }

    // Verificar versão mínima (exemplo: v1.0.0)
    const minVersion = '1.0.0';
    if (this.compareVersions(version, minVersion) < 0) {
      this.sendError(ws, `Agent version ${version} is too old. Minimum: ${minVersion}`);
      ws.close(1008, 'Version too old');
      return;
    }

    const agentInfo: AgentInfo = {
      id,
      name,
      version,
      platform: platform || 'unknown',
      hostname: hostname || 'unknown',
      ip,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
      status: 'online',
      ws
    };

    this.agents.set(id, agentInfo);
    console.log(`[WebSocket Agent] Agente registrado: ${name} (${id}) v${version}`);

    // Enviar confirmação
    this.send(ws, {
      type: 'notification',
      payload: {
        message: 'Registration successful',
        agentId: id
      },
      timestamp: Date.now()
    });
  }

  /**
   * Manipula mensagens recebidas
   */
  private handleMessage(ws: WebSocket, message: WSMessage) {
    const agent = this.findAgentByWs(ws);
    if (!agent) return;

    switch (message.type) {
      case 'pong':
        agent.lastHeartbeat = Date.now();
        break;

      case 'result':
        console.log(`[WebSocket Agent] Resultado recebido de ${agent.name}:`, message.payload);
        // Aqui você pode salvar o resultado no banco de dados
        break;

      case 'error':
        console.error(`[WebSocket Agent] Erro reportado por ${agent.name}:`, message.payload);
        break;

      default:
        console.warn(`[WebSocket Agent] Tipo de mensagem desconhecido: ${message.type}`);
    }
  }

  /**
   * Manipula desconexão
   */
  private handleDisconnection(ws: WebSocket) {
    const agent = this.findAgentByWs(ws);
    if (agent) {
      console.log(`[WebSocket Agent] Agente desconectado: ${agent.name} (${agent.id})`);
      agent.status = 'offline';
      // Não remover imediatamente, manter histórico
      // this.agents.delete(agent.id);
    }
  }

  /**
   * Inicia monitoramento de heartbeat
   */
  private startHeartbeatMonitor() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      this.agents.forEach((agent) => {
        // Enviar ping para agentes online
        if (agent.status === 'online' && agent.ws.readyState === WebSocket.OPEN) {
          this.send(agent.ws, {
            type: 'ping',
            payload: {},
            timestamp: now
          });
        }

        // Marcar como offline se não responder heartbeat
        if (now - agent.lastHeartbeat > this.HEARTBEAT_TIMEOUT) {
          if (agent.status === 'online') {
            console.log(`[WebSocket Agent] Agente ${agent.name} não responde (timeout)`);
            agent.status = 'offline';
          }
        }
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Envia comando para um agente específico
   */
  public sendCommand(agentId: string, command: string, params: any = {}): boolean {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      console.error(`[WebSocket Agent] Agente ${agentId} não encontrado`);
      return false;
    }

    if (agent.status !== 'online' || agent.ws.readyState !== WebSocket.OPEN) {
      console.error(`[WebSocket Agent] Agente ${agentId} não está online`);
      return false;
    }

    const messageId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.send(agent.ws, {
      type: 'command',
      payload: {
        command,
        params,
        messageId
      },
      timestamp: Date.now(),
      messageId
    });

    agent.status = 'executing';
    console.log(`[WebSocket Agent] Comando enviado para ${agent.name}: ${command}`);
    return true;
  }

  /**
   * Envia mensagem para um WebSocket
   */
  private send(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Envia erro para um WebSocket
   */
  private sendError(ws: WebSocket, errorMessage: string) {
    this.send(ws, {
      type: 'error',
      payload: { error: errorMessage },
      timestamp: Date.now()
    });
  }

  /**
   * Encontra agente por WebSocket
   */
  private findAgentByWs(ws: WebSocket): AgentInfo | undefined {
    let found: AgentInfo | undefined = undefined;
    this.agents.forEach(agent => {
      if (agent.ws === ws) {
        found = agent;
      }
    });
    return found;
  }

  /**
   * Compara versões (semver simplificado)
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  /**
   * Retorna lista de agentes
   */
  public getAgents(): AgentInfo[] {
    const agents: AgentInfo[] = [];
    this.agents.forEach(agent => {
      agents.push({
        ...agent,
        ws: undefined as any // Não expor WebSocket
      });
    });
    return agents;
  }

  /**
   * Retorna agente específico
   */
  public getAgent(agentId: string): AgentInfo | undefined {
    const agent = this.agents.get(agentId);
    if (!agent) return undefined;
    
    return {
      ...agent,
      ws: undefined as any
    };
  }

  /**
   * Broadcast para todos os agentes
   */
  public broadcast(message: WSMessage) {
    this.agents.forEach((agent) => {
      if (agent.status === 'online' && agent.ws.readyState === WebSocket.OPEN) {
        this.send(agent.ws, message);
      }
    });
  }

  /**
   * Desconecta um agente
   */
  public disconnectAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.ws.close(1000, 'Disconnected by server');
    agent.status = 'offline';
    return true;
  }

  /**
   * Limpa recursos
   */
  public shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.agents.forEach((agent) => {
      agent.ws.close(1001, 'Server shutting down');
    });

    if (this.wss) {
      this.wss.close();
    }

    console.log('[WebSocket Agent] Servidor encerrado');
  }
}

// Singleton
export const wsAgentServer = new WebSocketAgentServer();
