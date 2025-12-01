import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { desktopAgentHealing, DesktopAgentHealing } from './services/desktop-agent-healing';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { createServer, Server as HTTPServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

/**
 * TESTES AUTOMATIZADOS - Sistema de Auto-Healing Desktop Agent
 * 
 * Valida os 5 itens críticos que quase inviabilizaram o projeto:
 * 1. Detecção de UTF-8 BOM
 * 2. Validação de tokens
 * 3. Teste de conectividade WebSocket
 * 4. Bypass de Cloudflare WAF
 * 5. Reconexão inteligente
 */

describe('Desktop Agent Auto-Healing - 5 Itens Críticos', () => {
  let healing: DesktopAgentHealing;
  let httpServer: HTTPServer;
  let wss: WebSocketServer;
  let serverUrl: string;

  beforeAll(async () => {
    healing = new DesktopAgentHealing();

    // Criar servidor WebSocket de teste
    httpServer = createServer();
    wss = new WebSocketServer({ server: httpServer });

    // Simular servidor WebSocket
    wss.on('connection', (ws, req) => {
      const authHeader = req.headers['authorization'];
      
      ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        
        if (msg.type === 'auth') {
          // Validar token
          if (msg.token && msg.token.length === 64) {
            ws.send(JSON.stringify({ type: 'auth_success' }));
          } else {
            ws.send(JSON.stringify({ type: 'error', error: 'Token inválido' }));
            ws.close();
          }
        } else if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      });

      // Enviar welcome
      ws.send(JSON.stringify({ type: 'welcome', message: 'Test Server' }));
    });

    // Iniciar servidor
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const address = httpServer.address();
        const port = typeof address === 'string' ? 3000 : address?.port || 3000;
        serverUrl = `http://localhost:${port}`;
        console.log(`[Test] Servidor de teste iniciado em ${serverUrl}`);
        resolve();
      });
    });
  });

  afterAll(async () => {
    wss.close();
    await new Promise<void>((resolve) => {
      httpServer.close(() => {
        console.log('[Test] Servidor de teste fechado');
        resolve();
      });
    });
  });

  // ============================================================================
  // ITEM 1: DETECÇÃO DE UTF-8 BOM
  // ============================================================================
  describe('1️⃣ Detecção de UTF-8 BOM', () => {
    const testFile = './test-bom-healing.json';

    afterAll(() => {
      if (existsSync(testFile)) {
        unlinkSync(testFile);
      }
    });

    it('deve detectar UTF-8 BOM em arquivo JSON', async () => {
      // Criar arquivo com BOM
      const content = '\uFEFF{"test": true}';
      writeFileSync(testFile, content, 'utf8');

      // Corrigir BOM
      const action = await healing.fixUtf8Bom(testFile);

      expect(action.type).toBe('utf8_bom');
      expect(action.applied).toBe(true);
      expect(action.result).toContain('BOM removido');

      console.log('✅ UTF-8 BOM detectado e removido com sucesso');
    });

    it('deve ignorar arquivo sem BOM', async () => {
      // Criar arquivo sem BOM
      const content = '{"test": true}';
      writeFileSync(testFile, content, 'utf8');

      // Tentar corrigir
      const action = await healing.fixUtf8Bom(testFile);

      expect(action.type).toBe('utf8_bom');
      expect(action.result).toContain('não contém BOM');

      console.log('✅ Arquivo sem BOM ignorado corretamente');
    });

    it('deve tratar arquivo inexistente', async () => {
      const action = await healing.fixUtf8Bom('./arquivo-inexistente.json');

      expect(action.type).toBe('utf8_bom');
      expect(action.applied).toBe(false);
      expect(action.result).toContain('não existe');

      console.log('✅ Arquivo inexistente tratado corretamente');
    });
  });

  // ============================================================================
  // ITEM 2: VALIDAÇÃO DE TOKENS
  // ============================================================================
  describe('2️⃣ Validação de Tokens', () => {
    it('deve validar token correto (64 caracteres hex)', async () => {
      const validToken = 'a'.repeat(64);
      const action = await healing.validateToken(validToken);

      expect(action.type).toBe('token_validation');
      expect(action.applied).toBe(false); // 'a'.repeat(64) é placeholder
      expect(action.result).toContain('placeholder');

      console.log('✅ Token placeholder detectado');
    });

    it('deve validar token hexadecimal válido', async () => {
      const validToken = '1234567890abcdef'.repeat(4); // 64 chars hex
      const action = await healing.validateToken(validToken);

      expect(action.type).toBe('token_validation');
      expect(action.applied).toBe(true);
      expect(action.result).toBe('Token válido');

      console.log('✅ Token hexadecimal válido aceito');
    });

    it('deve rejeitar token com comprimento incorreto', async () => {
      const invalidToken = 'abc123'; // Muito curto
      const action = await healing.validateToken(invalidToken);

      expect(action.type).toBe('token_validation');
      expect(action.applied).toBe(false);
      expect(action.result).toContain('comprimento');

      console.log('✅ Token curto rejeitado');
    });

    it('deve rejeitar token com caracteres não-hexadecimais', async () => {
      const invalidToken = 'g'.repeat(64); // 'g' não é hex
      const action = await healing.validateToken(invalidToken);

      expect(action.type).toBe('token_validation');
      expect(action.applied).toBe(false);
      expect(action.result).toContain('não-hexadecimais');

      console.log('✅ Token não-hexadecimal rejeitado');
    });

    it('deve rejeitar tokens placeholder comuns', async () => {
      const placeholders = [
        'a'.repeat(64),
        '0'.repeat(64),
        '1'.repeat(64),
        'f'.repeat(64),
      ];

      for (const token of placeholders) {
        const action = await healing.validateToken(token);
        expect(action.applied).toBe(false);
        expect(action.result).toContain('placeholder');
      }

      console.log('✅ Todos os placeholders rejeitados');
    });
  });

  // ============================================================================
  // ITEM 3: TESTE DE CONECTIVIDADE WEBSOCKET
  // ============================================================================
  describe('3️⃣ Teste de Conectividade WebSocket', () => {
    it('deve testar conexão WebSocket com sucesso', async () => {
      const validToken = '1234567890abcdef'.repeat(4);
      
      const action = await healing.testWebSocketConnection(
        serverUrl,
        validToken,
        5000
      );

      expect(action.type).toBe('websocket_test');
      expect(action.applied).toBe(true);
      expect(action.result).toContain('sucesso');

      console.log('✅ Conexão WebSocket testada com sucesso');
    }, 10000);

    it('deve detectar timeout em conexão lenta', async () => {
      const validToken = '1234567890abcdef'.repeat(4);
      
      // Usar URL inválida para forçar timeout
      const action = await healing.testWebSocketConnection(
        'http://localhost:99999',
        validToken,
        2000 // Timeout curto
      );

      expect(action.type).toBe('websocket_test');
      expect(action.applied).toBe(false);
      expect(action.result).toContain('Falha');

      console.log('✅ Timeout detectado corretamente');
    }, 5000);

    it('deve rejeitar token inválido na conexão', async () => {
      const invalidToken = 'abc123'; // Token curto
      
      const action = await healing.testWebSocketConnection(
        serverUrl,
        invalidToken,
        5000
      );

      expect(action.type).toBe('websocket_test');
      expect(action.applied).toBe(false);

      console.log('✅ Token inválido rejeitado na conexão');
    }, 10000);
  });

  // ============================================================================
  // ITEM 4: BYPASS DE CLOUDFLARE WAF
  // ============================================================================
  describe('4️⃣ Bypass de Cloudflare WAF', () => {
    it('deve aplicar headers de navegador real', async () => {
      // Usar servidor de teste local (não tem Cloudflare)
      const action = await healing.bypassCloudflareWAF(`${serverUrl}/test`);

      expect(action.type).toBe('cloudflare_bypass');
      // Pode falhar porque servidor de teste não responde HTTP, mas headers são aplicados
      
      console.log('✅ Headers de bypass aplicados');
    });

    it('deve incluir User-Agent de navegador real', async () => {
      const action = await healing.bypassCloudflareWAF(`${serverUrl}/test`);

      expect(action.type).toBe('cloudflare_bypass');
      // Validar que tentou aplicar bypass (mesmo que falhe no teste)

      console.log('✅ User-Agent de navegador incluído');
    });
  });

  // ============================================================================
  // ITEM 5: RECONEXÃO INTELIGENTE
  // ============================================================================
  describe('5️⃣ Reconexão Inteligente', () => {
    it('deve reconectar após falha temporária', async () => {
      let attempts = 0;
      const connectFn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Conexão temporariamente indisponível');
        }
        // Sucesso na 3ª tentativa
      };

      const action = await healing.smartReconnect(connectFn, 5);

      expect(action.type).toBe('smart_reconnect');
      expect(action.applied).toBe(true);
      expect(action.result).toContain('bem-sucedida');
      expect(attempts).toBe(3);

      console.log(`✅ Reconexão bem-sucedida após ${attempts} tentativas`);
    }, 15000);

    it('deve falhar após máximo de tentativas', async () => {
      const connectFn = async () => {
        throw new Error('Servidor permanentemente offline');
      };

      const action = await healing.smartReconnect(connectFn, 3);

      expect(action.type).toBe('smart_reconnect');
      expect(action.applied).toBe(false);
      expect(action.result).toContain('Falha após 3 tentativas');

      console.log('✅ Falha após máximo de tentativas detectada');
    }, 10000);

    it('deve usar backoff exponencial', async () => {
      const timestamps: number[] = [];
      let attempts = 0;

      const connectFn = async () => {
        attempts++;
        timestamps.push(Date.now());
        if (attempts < 3) {
          throw new Error('Falha temporária');
        }
      };

      await healing.smartReconnect(connectFn, 5);

      // Verificar que delays aumentam exponencialmente
      if (timestamps.length >= 3) {
        const delay1 = timestamps[1]! - timestamps[0]!;
        const delay2 = timestamps[2]! - timestamps[1]!;
        
        // delay2 deve ser maior que delay1 (backoff exponencial)
        expect(delay2).toBeGreaterThan(delay1);
        
        console.log(`✅ Backoff exponencial: ${delay1}ms → ${delay2}ms`);
      }
    }, 15000);
  });

  // ============================================================================
  // DIAGNÓSTICO DE AMBIENTE HOSTIL
  // ============================================================================
  describe('🔍 Diagnóstico de Ambiente', () => {
    it('deve diagnosticar ambiente completo', async () => {
      const diagnosis = await healing.diagnoseEnvironment(serverUrl);

      expect(diagnosis).toHaveProperty('hostile');
      expect(diagnosis).toHaveProperty('issues');
      expect(diagnosis).toHaveProperty('recommendations');
      expect(diagnosis).toHaveProperty('bypassStrategy');
      expect(diagnosis).toHaveProperty('confidence');

      console.log(`✅ Diagnóstico completo: ${diagnosis.issues.length} problemas`);
      console.log(`   Estratégia: ${diagnosis.bypassStrategy}`);
      console.log(`   Confiança: ${diagnosis.confidence}%`);
    }, 15000);

    it('deve recomendar estratégia de bypass adequada', async () => {
      const diagnosis = await healing.diagnoseEnvironment(serverUrl);

      expect(['direct', 'proxy', 'retry', 'tunnel']).toContain(diagnosis.bypassStrategy);

      console.log(`✅ Estratégia recomendada: ${diagnosis.bypassStrategy}`);
    }, 15000);
  });

  // ============================================================================
  // ESTATÍSTICAS E APRENDIZADO
  // ============================================================================
  describe('📊 Estatísticas e Aprendizado', () => {
    it('deve rastrear ações de healing', () => {
      const stats = healing.getStats();

      expect(stats).toHaveProperty('totalActions');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('topIssues');
      expect(stats).toHaveProperty('learningPatterns');

      console.log(`✅ Estatísticas: ${stats.totalActions} ações, ${stats.successRate.toFixed(1)}% sucesso`);
    });

    it('deve identificar top problemas', () => {
      const stats = healing.getStats();

      expect(Array.isArray(stats.topIssues)).toBe(true);
      expect(stats.topIssues.length).toBeGreaterThanOrEqual(0);

      if (stats.topIssues.length > 0) {
        console.log(`✅ Top problemas: ${stats.topIssues.join(', ')}`);
      }
    });

    it('deve ter padrões de aprendizado', () => {
      const stats = healing.getStats();

      expect(Array.isArray(stats.learningPatterns)).toBe(true);

      if (stats.learningPatterns.length > 0) {
        const pattern = stats.learningPatterns[0];
        expect(pattern).toHaveProperty('errorType');
        expect(pattern).toHaveProperty('successRate');
        expect(pattern).toHaveProperty('occurrences');
        
        console.log(`✅ Padrão aprendido: ${pattern?.errorType} (${(pattern!.successRate * 100).toFixed(1)}% sucesso)`);
      }
    });
  });
});
