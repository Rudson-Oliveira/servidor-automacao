/**
 * Serviço de Integração WhatsApp Web (Simulado para Demo)
 * 
 * NOTA: Esta é uma versão simulada que funciona perfeitamente para demonstração e testes.
 * Em produção, substitua por whatsapp-web-service.ts com whatsapp-web.js real.
 * 
 * Funcionalidades simuladas:
 * - Geração de QR Code
 * - Autenticação e conexão
 * - Envio de mensagens
 * - Captura de status (delivered, read, failed, blocked)
 * - Detecção de bloqueios
 * - Integração completa com sistema de proteção
 */

import { EventEmitter } from 'events';
import { blockProtection } from './whatsapp-block-protection';
import crypto from 'crypto';

export interface WhatsAppSession {
  id: string;
  phone: string;
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'authenticated' | 'ready' | 'error';
  qrCode?: string;
  lastQrUpdate?: Date;
  connectedAt?: Date;
  error?: string;
}

interface QueuedMessage {
  to: string;
  message: string;
  options?: {
    campaign?: string;
    templateId?: string;
  };
}

export class WhatsAppWebService extends EventEmitter {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private messageQueue: Map<string, QueuedMessage[]> = new Map();
  private simulatedConnections: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    console.log('[WhatsApp Web Sim] Serviço inicializado (modo simulação)');
  }

  /**
   * Cria nova sessão WhatsApp Web
   */
  async createSession(sessionId: string, phone: string): Promise<WhatsAppSession> {
    // Verificar se sessão já existe
    if (this.sessions.has(sessionId)) {
      const existing = this.sessions.get(sessionId)!;
      if (existing.status !== 'disconnected' && existing.status !== 'error') {
        console.log(`[WhatsApp Web Sim] Sessão ${sessionId} já existe e está ativa`);
        return existing;
      }
      // Destruir sessão antiga
      await this.destroySession(sessionId);
    }

    console.log(`[WhatsApp Web Sim] Criando nova sessão: ${sessionId} (${phone})`);

    const session: WhatsAppSession = {
      id: sessionId,
      phone,
      status: 'connecting',
    };

    this.sessions.set(sessionId, session);

    // Simular processo de conexão
    this.simulateConnection(session);

    return session;
  }

  /**
   * Simula processo de conexão WhatsApp Web
   */
  private simulateConnection(session: WhatsAppSession): void {
    const { id: sessionId } = session;

    // Passo 1: Gerar QR Code (após 1 segundo)
    setTimeout(() => {
      if (session.status === 'connecting') {
        const qrCode = this.generateQRCode(sessionId);
        session.qrCode = qrCode;
        session.lastQrUpdate = new Date();
        session.status = 'qr_ready';

        console.log(`[WhatsApp Web Sim] QR Code gerado para sessão ${sessionId}`);
        console.log(`\n${qrCode}\n`);

        this.emit('qr_code', { sessionId, qrCode });

        // Passo 2: Simular scan do QR (após 5 segundos)
        setTimeout(() => {
          if (session.status === 'qr_ready') {
            session.status = 'authenticated';
            console.log(`[WhatsApp Web Sim] ✅ Sessão ${sessionId} autenticada`);
            this.emit('authenticated', { sessionId });

            // Passo 3: Pronto para uso (após 2 segundos)
            setTimeout(() => {
              if (session.status === 'authenticated') {
                session.status = 'ready';
                session.connectedAt = new Date();
                session.qrCode = undefined;
                console.log(`[WhatsApp Web Sim] ✅ Sessão ${sessionId} pronta`);
                this.emit('ready', { sessionId });

                // Processar fila de mensagens
                this.processMessageQueue(sessionId);
              }
            }, 2000);
          }
        }, 5000);
      }
    }, 1000);
  }

  /**
   * Gera QR Code simulado
   */
  private generateQRCode(sessionId: string): string {
    const randomData = crypto.randomBytes(32).toString('base64');
    return `
    ████ ▄▄▄▄▄ █▀█ █▄▀▀▀▄█ ▄▄▄▄▄ ████
    ████ █   █ █▀▀▀█ ▄ ▀▄█ █   █ ████
    ████ █▄▄▄█ █▀ █▀▀█▀▀▄█ █▄▄▄█ ████
    ████▄▄▄▄▄▄▄█▄▀ ▀▄█ █▄█▄▄▄▄▄▄▄████
    ████ ▄▀▄  ▄ ▄▀▄▀▀ ▀▄ ▄▄▄  ▀▄▀████
    ████▀ ▀▀▄▀▄▄▀█▄▀▀▄▀▀▀▄█▄█▄▀  ████
    ████ █▄ ▄ ▄▀▀▀▀█▀▀█▀▄▀▄▄▄▀█▀▄████
    ████▄███▄▄▄█▀ █▄▀▀▄▄ ▄▄▄ ▀   ████
    ████ ▄▄▄▄▄ █▄██ ▄▀▀  █▄█ ▄▄▀▄████
    ████ █   █ █  █▀▀█▀▄ ▄▄▄▄▀█▀ ████
    ████ █▄▄▄█ █ ▄▀▄▀▀▄▀▀▀█▄█▄▀  ████
    ████▄▄▄▄▄▄▄█▄▄█▄██▄█▄▄▄█▄▄▄▄▄████
    
    Sessão: ${sessionId}
    Dados: ${randomData.substring(0, 20)}...
    
    Escaneie este QR Code com WhatsApp para conectar
    `;
  }

  /**
   * Envia mensagem via WhatsApp Web (simulado)
   */
  async sendMessage(
    sessionId: string,
    to: string,
    message: string,
    options?: {
      campaign?: string;
      templateId?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        success: false,
        error: 'Sessão não encontrada',
      };
    }

    if (session.status !== 'ready') {
      // Adicionar à fila
      if (!this.messageQueue.has(sessionId)) {
        this.messageQueue.set(sessionId, []);
      }
      this.messageQueue.get(sessionId)!.push({ to, message, options });

      return {
        success: false,
        error: `Sessão não está pronta (status: ${session.status}). Mensagem adicionada à fila.`,
      };
    }

    // Verificar se número está na blacklist
    const isBlacklisted = await blockProtection.isBlacklisted(to);
    if (isBlacklisted) {
      console.warn(`[WhatsApp Web Sim] ⛔ Tentativa de envio para número blacklistado: ${to}`);
      return {
        success: false,
        error: 'Número está na blacklist',
      };
    }

    // Gerar ID de mensagem
    const messageId = `msg_${sessionId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    console.log(`[WhatsApp Web Sim] 📤 Enviando mensagem ${messageId} para ${to}`);

    // Registrar no histórico
    await blockProtection.logMessageSent(
      messageId,
      session.phone,
      to,
      options?.templateId,
      options?.campaign,
      message.substring(0, 500)
    );

    this.emit('message_sent', {
      sessionId,
      messageId,
      to,
      body: message,
    });

    // Simular processo de entrega
    this.simulateMessageDelivery(sessionId, messageId, to, message);

    return {
      success: true,
      messageId,
    };
  }

  /**
   * Simula processo de entrega de mensagem
   */
  private async simulateMessageDelivery(
    sessionId: string,
    messageId: string,
    to: string,
    message: string
  ): Promise<void> {
    // Simular diferentes cenários baseado no número
    const lastDigit = parseInt(to.slice(-1)) || 0;

    // 10% de chance de bloqueio (último dígito 0)
    if (lastDigit === 0) {
      setTimeout(async () => {
        console.warn(`[WhatsApp Web Sim] 🚨 Bloqueio detectado: ${to}`);

        await blockProtection.updateMessageStatus(
          messageId,
          'blocked',
          'BLOCKED_BY_USER',
          'Usuário bloqueou o remetente'
        );

        const detection = await blockProtection.detectBlockFromResponse(
          messageId,
          'BLOCKED_BY_USER',
          'Usuário bloqueou o remetente'
        );

        if (detection.isBlocked) {
          const session = this.sessions.get(sessionId);
          const reason = detection.reason === 'high_failure_rate' ? 'blocked' : (detection.reason || 'blocked');
          await blockProtection.addToBlacklist(
            to,
            reason as 'blocked' | 'reported' | 'invalid' | 'opt_out' | 'manual',
            'Usuário bloqueou o remetente',
            session?.phone
          );

          this.emit('block_detected', {
            sessionId,
            phone: to,
            reason: detection.reason,
          });
        }

        this.emit('message_ack', {
          sessionId,
          messageId,
          ack: -1, // Error
          status: 'blocked',
        });
      }, 2000);
      return;
    }

    // 5% de chance de falha (último dígito 1)
    if (lastDigit === 1) {
      setTimeout(async () => {
        console.warn(`[WhatsApp Web Sim] ❌ Falha no envio: ${to}`);

        await blockProtection.updateMessageStatus(
          messageId,
          'failed',
          'SEND_FAILED',
          'Número inválido ou inexistente'
        );

        this.emit('message_ack', {
          sessionId,
          messageId,
          ack: -1,
          status: 'failed',
        });
      }, 1500);
      return;
    }

    // 85% de sucesso (demais dígitos)
    // Passo 1: Enviado (imediato)
    setTimeout(() => {
      console.log(`[WhatsApp Web Sim] ✅ Mensagem ${messageId} enviada`);
      this.emit('message_ack', {
        sessionId,
        messageId,
        ack: 2, // Server ACK
        status: 'sent',
      });
    }, 500);

    // Passo 2: Entregue (após 1-3 segundos)
    setTimeout(async () => {
      console.log(`[WhatsApp Web Sim] ✅ Mensagem ${messageId} entregue`);

      await blockProtection.updateMessageStatus(messageId, 'delivered');

      this.emit('message_ack', {
        sessionId,
        messageId,
        ack: 3, // Device ACK
        status: 'delivered',
      });
    }, 1000 + Math.random() * 2000);

    // Passo 3: Lida (50% de chance, após 5-10 segundos)
    if (Math.random() > 0.5) {
      setTimeout(async () => {
        console.log(`[WhatsApp Web Sim] ✅ Mensagem ${messageId} lida`);

        await blockProtection.updateMessageStatus(messageId, 'read');

        this.emit('message_ack', {
          sessionId,
          messageId,
          ack: 4, // Read ACK
          status: 'read',
        });
      }, 5000 + Math.random() * 5000);
    }
  }

  /**
   * Processa fila de mensagens pendentes
   */
  private async processMessageQueue(sessionId: string): Promise<void> {
    const queue = this.messageQueue.get(sessionId);
    if (!queue || queue.length === 0) return;

    console.log(`[WhatsApp Web Sim] Processando ${queue.length} mensagens na fila de ${sessionId}`);

    for (const item of queue) {
      await this.sendMessage(sessionId, item.to, item.message, item.options);
      // Delay entre mensagens
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Limpar fila
    this.messageQueue.set(sessionId, []);
  }

  /**
   * Obtém status de uma sessão
   */
  getSession(sessionId: string): WhatsAppSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Lista todas as sessões
   */
  getAllSessions(): WhatsAppSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Destrói uma sessão
   */
  async destroySession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    console.log(`[WhatsApp Web Sim] Destruindo sessão ${sessionId}`);

    // Limpar timers
    const timer = this.simulatedConnections.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.simulatedConnections.delete(sessionId);
    }

    this.sessions.delete(sessionId);
    this.messageQueue.delete(sessionId);
    return true;
  }

  /**
   * Logout de uma sessão
   */
  async logoutSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    console.log(`[WhatsApp Web Sim] Logout da sessão ${sessionId}`);

    session.status = 'disconnected';
    this.emit('disconnected', { sessionId, reason: 'Logout manual' });
    return true;
  }

  /**
   * Obtém informações do número conectado
   */
  async getConnectedNumber(sessionId: string): Promise<string | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'ready') return null;

    return session.phone;
  }
}

// Singleton global
export const whatsappWebService = new WhatsAppWebService();
