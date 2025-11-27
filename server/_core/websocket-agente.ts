/**
 * MÓDULO: WebSocket para Agentes Locais
 * Servidor WebSocket isolado para comunicação com agentes
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

// Tipos
interface AgentInfo {
  id: string;
  name: string;
  version: string;
  platform: string;
  hostname: string;
  ip: string;
  ws: WebSocket;
  connectedAt: number;
  lastHeartbeat: number;
  status: "online" | "executing" | "offline";
}

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

class WebSocketAgentServer {
  private wss: WebSocketServer | null = null;
  private agents: Map<string, AgentInfo> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Inicializa servidor WebSocket
   */
  init(server: Server) {
    console.log("[WebSocket Agent] Inicializando servidor...");

    this.wss = new WebSocketServer({
      server,
      path: "/ws/agente",
    });

    this.wss.on("connection", (ws, req) => {
      const ip = req.socket.remoteAddress || "unknown";
      console.log(`[WebSocket Agent] Nova conexão de ${ip}`);

      ws.on("message", (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("[WebSocket Agent] Erro ao processar mensagem:", error);
        }
      });

      ws.on("close", () => {
        const agent = this.findAgentByWs(ws);
        if (agent) {
          console.log(`[WebSocket Agent] Agente desconectado: ${agent.name}`);
          this.agents.delete(agent.id);
        }
      });

      ws.on("error", (error) => {
        console.error("[WebSocket Agent] Erro:", error);
      });
    });

    // Heartbeat a cada 30s
    this.startHeartbeat();

    console.log("[WebSocket Agent] Servidor inicializado em /ws/agente");
  }

  /**
   * Processa mensagens recebidas
   */
  private handleMessage(ws: WebSocket, message: WebSocketMessage) {
    const { type, payload } = message;

    switch (type) {
      case "register":
        this.registerAgent(ws, payload);
        break;

      case "pong":
        this.updateHeartbeat(ws);
        break;

      case "result":
      case "error":
        // Resultados de comandos (será implementado depois)
        console.log(`[WebSocket Agent] Recebido ${type}:`, payload);
        break;

      default:
        console.warn(`[WebSocket Agent] Tipo desconhecido: ${type}`);
    }
  }

  /**
   * Registra novo agente
   */
  private registerAgent(ws: WebSocket, payload: any) {
    const { id, name, version, platform, hostname } = payload;

    const agent: AgentInfo = {
      id,
      name,
      version,
      platform,
      hostname,
      ip: "unknown",
      ws,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
      status: "online",
    };

    this.agents.set(id, agent);
    console.log(`[WebSocket Agent] Agente registrado: ${name} (${id})`);

    // Confirmar registro
    this.sendToAgent(id, {
      type: "registered",
      payload: { success: true },
      timestamp: Date.now(),
    });
  }

  /**
   * Atualiza heartbeat do agente
   */
  private updateHeartbeat(ws: WebSocket) {
    const agent = this.findAgentByWs(ws);
    if (agent) {
      agent.lastHeartbeat = Date.now();
    }
  }

  /**
   * Encontra agente por WebSocket
   */
  private findAgentByWs(ws: WebSocket): AgentInfo | undefined {
    const agentsArray = Array.from(this.agents.values());
    return agentsArray.find(agent => agent.ws === ws);
  }

  /**
   * Envia mensagem para agente específico
   */
  sendToAgent(agentId: string, message: WebSocketMessage): boolean {
    const agent = this.agents.get(agentId);
    if (!agent || agent.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      agent.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`[WebSocket Agent] Erro ao enviar para ${agentId}:`, error);
      return false;
    }
  }

  /**
   * Envia comando para agente
   */
  sendCommand(agentId: string, comando: string, parametros: any): boolean {
    return this.sendToAgent(agentId, {
      type: "command",
      payload: {
        messageId: `cmd_${Date.now()}`,
        command: comando,
        params: parametros,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Desconecta agente
   */
  disconnectAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    agent.ws.close();
    this.agents.delete(agentId);
    return true;
  }

  /**
   * Lista agentes conectados
   */
  getAgents(): AgentInfo[] {
    return Array.from(this.agents.values()).map((agent) => ({
      id: agent.id,
      name: agent.name,
      version: agent.version,
      platform: agent.platform,
      hostname: agent.hostname,
      ip: agent.ip,
      connectedAt: agent.connectedAt,
      lastHeartbeat: agent.lastHeartbeat,
      status: agent.status,
      ws: undefined as any, // Não expor WebSocket
    }));
  }

  /**
   * Inicia heartbeat periódico
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const agentsArray = Array.from(this.agents.entries());

      for (const [id, agent] of agentsArray) {
        // Verificar timeout (60s)
        if (now - agent.lastHeartbeat > 60000) {
          console.log(`[WebSocket Agent] Timeout: ${agent.name}`);
          agent.ws.close();
          this.agents.delete(id);
          continue;
        }

        // Enviar ping
        if (agent.ws.readyState === WebSocket.OPEN) {
          this.sendToAgent(id, {
            type: "ping",
            payload: {},
            timestamp: now,
          });
        }
      }
    }, 30000); // 30s
  }

  /**
   * Para servidor
   */
  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    const agentsArray = Array.from(this.agents.values());
    for (const agent of agentsArray) {
      agent.ws.close();
    }

    this.agents.clear();

    if (this.wss) {
      this.wss.close();
    }

    console.log("[WebSocket Agent] Servidor parado");
  }
}

// Singleton
export const wsAgentServer = new WebSocketAgentServer();
