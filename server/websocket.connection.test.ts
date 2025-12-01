import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createServer, Server as HttpServer } from "http";
import express from "express";
import WebSocket from "ws";
import { startDesktopAgentServer, getDesktopAgentServer } from "./services/desktopAgentServer";
import { createAgent } from "./db-desktop-control";

/**
 * Testes de conexão WebSocket
 * 
 * Valida:
 * - HTTP 101 Switching Protocols handshake
 * - Autenticação via token
 * - Heartbeat bidirecional
 * - Logs de auditoria
 */

const TEST_PORT = 3002; // Porta diferente para testes
let testAgentToken: string;
let testAgentId: number;
let httpServer: HttpServer;
let app: express.Application;

beforeAll(async () => {
  // Criar agent de teste no banco
  const agent = await createAgent({ userId: 1, deviceName: "Test Desktop Agent", platform: "windows", version: "1.0.0" });
  testAgentToken = agent.token;
  testAgentId = agent.id;

  // Criar aplicação Express e servidor HTTP
  app = express();
  httpServer = createServer(app);

  // Iniciar servidor WebSocket de teste
  startDesktopAgentServer(httpServer);

  // Iniciar servidor HTTP
  await new Promise<void>((resolve) => {
    httpServer.listen(TEST_PORT, () => {
      console.log(`[Test] HTTP server listening on port ${TEST_PORT}`);
      resolve();
    });
  });
});

afterAll(async () => {
  // Fechar servidor WebSocket
  const server = getDesktopAgentServer();
  if (server) {
    server.close();
  }

  // Fechar servidor HTTP
  await new Promise<void>((resolve) => {
    httpServer.close(() => {
      console.log(`[Test] HTTP server closed`);
      resolve();
    });
  });
});

describe("WebSocket Connection Tests", () => {
  it("deve aceitar conexão WebSocket com HTTP 101 handshake", async () => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/desktop-agent`, {
        headers: {
          'Authorization': `Bearer ${testAgentToken}`
        }
      });

      ws.on("open", () => {
        console.log("✅ Conexão WebSocket estabelecida (HTTP 101)");
        ws.close();
        resolve();
      });

      ws.on("error", (error) => {
        reject(new Error(`Falha no handshake: ${error.message}`));
      });

      // Timeout de 5 segundos
      setTimeout(() => {
        reject(new Error("Timeout: handshake não completado em 5s"));
      }, 5000);
    });
  });

  it("deve receber mensagem de boas-vindas após conexão", async () => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/desktop-agent`, {
        headers: {
          'Authorization': `Bearer ${testAgentToken}`
        }
      });

      ws.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          
          expect(message.type).toBe("welcome");
          expect(message.message).toContain("Desktop Agent Server");
          
          console.log("✅ Mensagem de boas-vindas recebida");
          ws.close();
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      ws.on("error", reject);

      setTimeout(() => {
        reject(new Error("Timeout: mensagem de boas-vindas não recebida"));
      }, 5000);
    });
  });

  it("deve autenticar com token válido", async () => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/desktop-agent`, {
        headers: {
          'Authorization': `Bearer ${testAgentToken}`
        }
      });
      let welcomeReceived = false;

      ws.on("open", () => {
        // Aguardar mensagem de boas-vindas antes de autenticar
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: "auth",
            timestamp: new Date().toISOString(),
            token: testAgentToken,
          }));
        }, 100);
      });

      ws.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === "welcome") {
            welcomeReceived = true;
            return;
          }

          if (message.type === "auth_success") {
            expect(message.agentId).toBe(testAgentId);
            expect(message.message).toContain("Autenticação bem-sucedida");
            
            console.log("✅ Autenticação bem-sucedida");
            ws.close();
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      });

      ws.on("error", reject);

      setTimeout(() => {
        reject(new Error("Timeout: autenticação não completada"));
      }, 15000);
    });
  }, 20000);

  it("deve rejeitar token inválido", async () => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/desktop-agent`);

      ws.on("open", () => {
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: "auth",
            timestamp: new Date().toISOString(),
            token: "token_invalido_12345",
          }));
        }, 100);
      });

      ws.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === "error") {
            expect(message.error).toContain("Token inválido");
            console.log("✅ Token inválido rejeitado corretamente");
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      });

      ws.on("close", () => {
        // Conexão deve ser fechada após erro de autenticação
        resolve();
      });

      ws.on("error", (error) => {
        // Erro esperado
        resolve();
      });

      setTimeout(() => {
        reject(new Error("Timeout: erro de autenticação não recebido"));
      }, 5000);
    });
  });

  it("deve processar heartbeat e responder com heartbeat_ack", async () => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/desktop-agent`, {
        headers: {
          'Authorization': `Bearer ${testAgentToken}`
        }
      });
      let authenticated = false;

      ws.on("open", () => {
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: "auth",
            timestamp: new Date().toISOString(),
            token: testAgentToken,
          }));
        }, 100);
      });

      ws.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === "auth_success") {
            authenticated = true;
            
            // Enviar heartbeat
            ws.send(JSON.stringify({
              type: "heartbeat",
              timestamp: new Date().toISOString(),
            }));
            return;
          }

          if (message.type === "heartbeat_ack") {
            expect(message.timestamp).toBeDefined();
            expect(new Date(message.timestamp).getTime()).toBeGreaterThan(0);
            
            console.log("✅ Heartbeat processado com sucesso");
            ws.close();
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      });

      ws.on("error", reject);

      setTimeout(() => {
        reject(new Error("Timeout: heartbeat_ack não recebido"));
      }, 15000);
    });
  }, 20000);

  it("deve validar formato ISO8601 dos timestamps", async () => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}/desktop-agent`, {
        headers: {
          'Authorization': `Bearer ${testAgentToken}`
        }
      });

      ws.on("open", () => {
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: "auth",
            timestamp: new Date().toISOString(),
            token: testAgentToken,
          }));
        }, 100);
      });

      ws.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === "auth_success") {
            // Enviar heartbeat
            ws.send(JSON.stringify({
              type: "heartbeat",
              timestamp: new Date().toISOString(),
            }));
            return;
          }

          if (message.type === "heartbeat_ack") {
            // Validar formato ISO8601
            const timestamp = message.timestamp;
            expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
            
            // Validar que é uma data válida
            const date = new Date(timestamp);
            expect(date.getTime()).toBeGreaterThan(0);
            
            console.log("✅ Timestamp ISO8601 válido:", timestamp);
            ws.close();
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      });

      ws.on("error", reject);

      setTimeout(() => {
        reject(new Error("Timeout: validação de timestamp não completada"));
      }, 15000);
    });
  }, 20000);
});
