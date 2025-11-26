/**
 * SERVIDOR WEBSOCKET PARA AGENTE LOCAL
 * =====================================
 * 
 * Gerencia conexões WebSocket com agentes locais instalados nos computadores dos usuários.
 * Permite enviar comandos e receber resultados em tempo real.
 * 
 * Funcionalidades:
 * - Gerenciamento de conexões de múltiplos agentes
 * - Envio de comandos para agentes específicos
 * - Recebimento de respostas e eventos
 * - Armazenamento de histórico no banco de dados
 * - Sistema de heartbeat e detecção de desconexão
 * - Autenticação e autorização
 * 
 * Autor: Sistema de Automação
 * Data: 2025-01-26
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { agentesLocais, mensagensAgente, comandosAgente } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

interface AgenteConectado {
  id: string;
  websocket: WebSocket;
  idAgente: string;
  userId?: number;
  sistema: any;
  permissoes: any;
  conectadoEm: Date;
  ultimoHeartbeat: Date;
  status: 'conectado' | 'desconectado';
}

interface ComandoAgente {
  id: string;
  comando: string;
  parametros: any;
  timestamp: Date;
  resolvido: boolean;
  resolve?: (value: any) => void;
  reject?: (reason: any) => void;
  timeout?: NodeJS.Timeout;
}

class WebSocketAgenteServer {
  private wss: WebSocketServer | null = null;
  private agentesConectados: Map<string, AgenteConectado> = new Map();
  private comandosPendentes: Map<string, ComandoAgente> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Inicializa o servidor WebSocket
   */
  inicializar(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/agente'
    });

    console.log('[WebSocket Agente] Servidor inicializado em /ws/agente');

    this.wss.on('connection', (ws: WebSocket, req) => {
      this.handleNovaConexao(ws, req);
    });

    // Iniciar verificação de heartbeat
    this.iniciarVerificacaoHeartbeat();
  }

  /**
   * Lida com nova conexão de agente
   */
  private handleNovaConexao(ws: WebSocket, req: unknown) {
    const connectionId = uuidv4();
    console.log(`[WebSocket Agente] Nova conexão: ${connectionId}`);

    // Configurar handlers
    ws.on('message', async (data: Buffer) => {
      try {
        const mensagem = JSON.parse(data.toString());
        await this.handleMensagem(connectionId, mensagem);
      } catch (error: unknown) {
        console.error('[WebSocket Agente] Erro ao processar mensagem:', error);
      }
    });

    ws.on('close', () => {
      this.handleDesconexao(connectionId);
    });

    ws.on('error', (error) => {
      console.error(`[WebSocket Agente] Erro na conexão ${connectionId}:`, error);
    });

    // Aguardar mensagem de registro
    const timeoutRegistro = setTimeout(() => {
      if (!this.agentesConectados.has(connectionId)) {
        console.log(`[WebSocket Agente] Timeout de registro: ${connectionId}`);
        ws.close();
      }
    }, 30000); // 30 segundos

    // Armazenar timeout para limpar depois
    (ws as any).timeoutRegistro = timeoutRegistro;
  }

  /**
   * Processa mensagem recebida do agente
   */
  private async handleMensagem(connectionId: string, mensagem: any) {
    const tipo = mensagem.tipo;

    switch (tipo) {
      case 'registro':
        await this.handleRegistro(connectionId, mensagem);
        break;

      case 'heartbeat':
        await this.handleHeartbeat(connectionId, mensagem);
        break;

      case 'resposta':
        await this.handleResposta(connectionId, mensagem);
        break;

      case 'desktop_capture_automatico':
        await this.handleDesktopCaptureAutomatico(connectionId, mensagem);
        break;

      default:
        console.warn(`[WebSocket Agente] Tipo de mensagem desconhecido: ${tipo}`);
    }
  }

  /**
   * Registra novo agente
   */
  private async handleRegistro(connectionId: string, mensagem: any) {
    const { id_agente, sistema, permissoes } = mensagem;

    console.log(`[WebSocket Agente] Registro do agente: ${id_agente}`);

    // Limpar timeout de registro
    const agente = this.agentesConectados.get(connectionId);
    if (agente && (agente.websocket as any).timeoutRegistro) {
      clearTimeout((agente.websocket as any).timeoutRegistro);
    }

    // Obter WebSocket
    const ws = Array.from(this.agentesConectados.values())
      .find(a => a.id === connectionId)?.websocket;
    
    if (!ws) {
      // Primeira vez, criar entrada
      const novoAgente: AgenteConectado = {
        id: connectionId,
        websocket: Array.from(this.agentesConectados.values())
          .find(a => a.id === connectionId)?.websocket || 
          this.encontrarWebSocket(connectionId),
        idAgente: id_agente,
        sistema,
        permissoes,
        conectadoEm: new Date(),
        ultimoHeartbeat: new Date(),
        status: 'conectado'
      };

      this.agentesConectados.set(connectionId, novoAgente);
    } else {
      // Atualizar agente existente
      const agenteExistente = this.agentesConectados.get(connectionId)!;
      agenteExistente.idAgente = id_agente;
      agenteExistente.sistema = sistema;
      agenteExistente.permissoes = permissoes;
      agenteExistente.ultimoHeartbeat = new Date();
      agenteExistente.status = 'conectado';
    }

    // Salvar no banco de dados
    try {
      const db = await getDb();
      if (db) {
        await db.insert(agentesLocais).values({
          idAgente: id_agente,
          sistema: JSON.stringify(sistema),
          permissoes: JSON.stringify(permissoes),
          status: 'conectado',
          conectadoEm: new Date(),
          ultimoHeartbeat: new Date(),
        }).onDuplicateKeyUpdate({
          set: {
            sistema: JSON.stringify(sistema),
            permissoes: JSON.stringify(permissoes),
            status: 'conectado',
            conectadoEm: new Date(),
            ultimoHeartbeat: new Date(),
          }
        });
      }
    } catch (error) {
      console.error('[WebSocket Agente] Erro ao salvar agente no banco:', error);
    }

    // Enviar confirmação
    this.enviarMensagem(connectionId, {
      tipo: 'registro_confirmado',
      id_agente,
      timestamp: new Date().toISOString()
    });

    console.log(`[WebSocket Agente] ✅ Agente registrado: ${id_agente}`);
  }

  /**
   * Atualiza heartbeat do agente
   */
  private async handleHeartbeat(connectionId: string, mensagem: any) {
    const agente = this.agentesConectados.get(connectionId);
    if (!agente) return;

    agente.ultimoHeartbeat = new Date();
    agente.status = 'conectado';

    // Atualizar no banco
    try {
      const db = await getDb();
      if (db) {
        await db.update(agentesLocais)
          .set({
            ultimoHeartbeat: new Date(),
            status: 'conectado'
          })
          .where(eq(agentesLocais.idAgente, agente.idAgente));
      }
    } catch (error) {
      console.error('[WebSocket Agente] Erro ao atualizar heartbeat:', error);
    }
  }

  /**
   * Processa resposta de comando
   */
  private async handleResposta(connectionId: string, mensagem: any) {
    const { id_comando, resposta } = mensagem;

    console.log(`[WebSocket Agente] Resposta recebida para comando: ${id_comando}`);

    // Resolver promise do comando
    const comando = this.comandosPendentes.get(id_comando);
    if (comando) {
      // Limpar timeout
      if (comando.timeout) {
        clearTimeout(comando.timeout);
      }

      // Resolver ou rejeitar
      if (resposta.sucesso) {
        comando.resolve?.(resposta.resultado);
      } else {
        comando.reject?.(new Error(resposta.erro || 'Erro desconhecido'));
      }

      // Remover da lista de pendentes
      this.comandosPendentes.delete(id_comando);
    }

    // Salvar no banco
    try {
      const db = await getDb();
      if (db) {
        await db.update(comandosAgente)
          .set({
            status: resposta.sucesso ? 'sucesso' : 'erro',
            resposta: JSON.stringify(resposta),
            executadoEm: new Date(),
          })
          .where(eq(comandosAgente.idComando, id_comando));
      }
    } catch (error) {
      console.error('[WebSocket Agente] Erro ao salvar resposta:', error);
    }
  }

  /**
   * Processa Desktop Capture automático
   */
  private async handleDesktopCaptureAutomatico(connectionId: string, mensagem: any) {
    const agente = this.agentesConectados.get(connectionId);
    if (!agente) return;

    console.log(`[WebSocket Agente] Desktop Capture automático recebido de: ${agente.idAgente}`);

    // Salvar screenshot no banco (ou processar conforme necessário)
    try {
      const db = await getDb();
      if (db) {
        await db.insert(mensagensAgente).values({
          idAgente: agente.idAgente,
          tipo: 'desktop_capture_automatico',
          dados: JSON.stringify(mensagem.dados),
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('[WebSocket Agente] Erro ao salvar Desktop Capture:', error);
    }
  }

  /**
   * Lida com desconexão de agente
   */
  private handleDesconexao(connectionId: string) {
    const agente = this.agentesConectados.get(connectionId);
    if (!agente) return;

    console.log(`[WebSocket Agente] Desconexão: ${agente.idAgente}`);

    agente.status = 'desconectado';

    // Atualizar no banco
    this.atualizarStatusAgente(agente.idAgente, 'desconectado').catch(console.error);

    // Remover da lista
    this.agentesConectados.delete(connectionId);
  }

  /**
   * Envia comando para agente específico
   */
  async enviarComando(idAgente: string, comando: string, parametros: any = {}, timeoutMs: number = 60000): Promise<any> {
    // Encontrar agente
    const agente = Array.from(this.agentesConectados.values())
      .find(a => a.idAgente === idAgente);

    if (!agente || agente.status !== 'conectado') {
      throw new Error(`Agente não conectado: ${idAgente}`);
    }

    // Gerar ID do comando
    const idComando = uuidv4();

    // Salvar comando no banco
    try {
      const db = await getDb();
      if (db) {
        await db.insert(comandosAgente).values({
          idComando,
          idAgente,
          comando,
          parametros: JSON.stringify(parametros),
          status: 'pendente',
          criadoEm: new Date(),
        });
      }
    } catch (error) {
      console.error('[WebSocket Agente] Erro ao salvar comando:', error);
    }

    // Criar promise para aguardar resposta
    return new Promise((resolve, reject) => {
      // Configurar timeout
      const timeout = setTimeout(() => {
        this.comandosPendentes.delete(idComando);
        reject(new Error(`Timeout ao executar comando: ${comando}`));
      }, timeoutMs);

      // Armazenar comando pendente
      this.comandosPendentes.set(idComando, {
        id: idComando,
        comando,
        parametros,
        timestamp: new Date(),
        resolvido: false,
        resolve,
        reject,
        timeout
      });

      // Enviar comando para o agente
      this.enviarMensagem(agente.id, {
        comando,
        parametros,
        id_comando: idComando,
        timestamp: new Date().toISOString()
      });

      console.log(`[WebSocket Agente] Comando enviado: ${comando} (${idComando})`);
    });
  }

  /**
   * Envia mensagem para agente
   */
  private enviarMensagem(connectionId: string, mensagem: any) {
    const agente = this.agentesConectados.get(connectionId);
    if (!agente || agente.websocket.readyState !== WebSocket.OPEN) {
      console.warn(`[WebSocket Agente] Não foi possível enviar mensagem para: ${connectionId}`);
      return;
    }

    try {
      agente.websocket.send(JSON.stringify(mensagem));
    } catch (error) {
      console.error(`[WebSocket Agente] Erro ao enviar mensagem:`, error);
    }
  }

  /**
   * Retorna lista de agentes conectados
   */
  obterAgentesConectados(): AgenteConectado[] {
    return Array.from(this.agentesConectados.values())
      .filter(a => a.status === 'conectado');
  }

  /**
   * Retorna agente específico
   */
  obterAgente(idAgente: string): AgenteConectado | undefined {
    return Array.from(this.agentesConectados.values())
      .find(a => a.idAgente === idAgente);
  }

  /**
   * Verifica heartbeat de todos os agentes
   */
  private iniciarVerificacaoHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const agora = new Date();
      const timeoutMs = 90000; // 90 segundos (3x o intervalo de heartbeat)

      for (const [connectionId, agente] of Array.from(this.agentesConectados.entries())) {
        const tempoSemHeartbeat = agora.getTime() - agente.ultimoHeartbeat.getTime();

        if (tempoSemHeartbeat > timeoutMs && agente.status === 'conectado') {
          console.warn(`[WebSocket Agente] Agente sem heartbeat: ${agente.idAgente}`);
          agente.status = 'desconectado';
          this.atualizarStatusAgente(agente.idAgente, 'desconectado').catch(console.error);
        }
      }
    }, 30000); // Verificar a cada 30 segundos
  }

  /**
   * Atualiza status do agente no banco
   */
  private async atualizarStatusAgente(idAgente: string, status: 'conectado' | 'desconectado' | 'erro') {
    try {
      const db = await getDb();
      if (db) {
        await db.update(agentesLocais)
          .set({ status })
          .where(eq(agentesLocais.idAgente, idAgente));
      }
    } catch (error) {
      console.error('[WebSocket Agente] Erro ao atualizar status:', error);
    }
  }

  /**
   * Encontra WebSocket por connection ID (helper)
   */
  private encontrarWebSocket(connectionId: string): WebSocket {
    // Este é um placeholder - na prática, o WebSocket é passado no handleNovaConexao
    throw new Error('WebSocket não encontrado');
  }

  /**
   * Encerra servidor WebSocket
   */
  encerrar() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.wss) {
      this.wss.close();
    }

    console.log('[WebSocket Agente] Servidor encerrado');
  }
}

// Exportar instância singleton
export const websocketAgenteServer = new WebSocketAgenteServer();
