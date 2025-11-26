/**
 * Sistema de Rate Limiting Inteligente para WhatsApp
 * Evita bloqueios através de controle rigoroso de taxa de envio
 */

export interface WhatsAppNumber {
  id: string;
  phone: string;
  type: 'common' | 'business' | 'business_api';
  createdAt: Date;
  status: 'active' | 'warning' | 'critical' | 'blocked' | 'quarantine';
  dailyLimit: number;
  hourlyLimit: number;
  minIntervalSeconds: number;
}

export interface MessageQueueItem {
  id: string;
  numberId: string;
  recipient: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  scheduledFor?: Date;
  createdAt: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sentAt?: Date;
  error?: string;
}

export interface SendStats {
  numberId: string;
  date: string; // YYYY-MM-DD
  hour: number; // 0-23
  messagesSent: number;
  messagesBlocked: number;
  messagesDelivered: number;
  avgResponseTime: number;
}

export class WhatsAppRateLimiter {
  private numbers: Map<string, WhatsAppNumber> = new Map();
  private messageQueue: MessageQueueItem[] = [];
  private sendHistory: Map<string, Date[]> = new Map(); // numberId -> timestamps
  private stats: Map<string, SendStats[]> = new Map(); // numberId -> stats

  /**
   * Registra um número WhatsApp no sistema
   */
  registerNumber(number: WhatsAppNumber): void {
    this.numbers.set(number.id, number);
    this.sendHistory.set(number.id, []);
    this.stats.set(number.id, []);
  }

  /**
   * Obtém limites seguros baseados no tipo e idade do número
   */
  getSafeLimits(numberId: string): {
    dailyLimit: number;
    hourlyLimit: number;
    minIntervalSeconds: number;
  } {
    const number = this.numbers.get(numberId);
    if (!number) {
      throw new Error(`Número ${numberId} não encontrado`);
    }

    const ageInDays = Math.floor(
      (Date.now() - number.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Limites baseados em tipo e idade
    if (number.type === 'business_api') {
      return {
        dailyLimit: 1000,
        hourlyLimit: 100,
        minIntervalSeconds: 30,
      };
    } else if (number.type === 'business') {
      if (ageInDays < 7) {
        return {
          dailyLimit: 40,
          hourlyLimit: 10,
          minIntervalSeconds: 300, // 5 minutos
        };
      } else if (ageInDays < 30) {
        return {
          dailyLimit: 100,
          hourlyLimit: 20,
          minIntervalSeconds: 180, // 3 minutos
        };
      } else {
        return {
          dailyLimit: 150,
          hourlyLimit: 30,
          minIntervalSeconds: 120, // 2 minutos
        };
      }
    } else {
      // common
      if (ageInDays < 7) {
        return {
          dailyLimit: 15,
          hourlyLimit: 5,
          minIntervalSeconds: 300, // 5 minutos
        };
      } else if (ageInDays < 30) {
        return {
          dailyLimit: 40,
          hourlyLimit: 10,
          minIntervalSeconds: 180, // 3 minutos
        };
      } else {
        return {
          dailyLimit: 80,
          hourlyLimit: 15,
          minIntervalSeconds: 120, // 2 minutos
        };
      }
    }
  }

  /**
   * Verifica se número pode enviar mensagem agora
   */
  canSendNow(numberId: string): {
    allowed: boolean;
    reason?: string;
    waitSeconds?: number;
  } {
    const number = this.numbers.get(numberId);
    if (!number) {
      return { allowed: false, reason: 'Número não encontrado' };
    }

    if (number.status === 'blocked' || number.status === 'quarantine') {
      return { allowed: false, reason: `Número em status: ${number.status}` };
    }

    const limits = this.getSafeLimits(numberId);
    const history = this.sendHistory.get(numberId) || [];
    const now = Date.now();

    // Verificar intervalo mínimo desde última mensagem
    if (history.length > 0) {
      const lastSent = history[history.length - 1]!.getTime();
      const secondsSinceLastSent = (now - lastSent) / 1000;

      if (secondsSinceLastSent < limits.minIntervalSeconds) {
        const waitSeconds = Math.ceil(limits.minIntervalSeconds - secondsSinceLastSent);
        return {
          allowed: false,
          reason: 'Intervalo mínimo não atingido',
          waitSeconds,
        };
      }
    }

    // Verificar limite horário
    const oneHourAgo = now - 60 * 60 * 1000;
    const sentLastHour = history.filter(ts => ts.getTime() > oneHourAgo).length;

    if (sentLastHour >= limits.hourlyLimit) {
      return {
        allowed: false,
        reason: 'Limite horário atingido',
        waitSeconds: 3600,
      };
    }

    // Verificar limite diário
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sentLastDay = history.filter(ts => ts.getTime() > oneDayAgo).length;

    if (sentLastDay >= limits.dailyLimit) {
      return {
        allowed: false,
        reason: 'Limite diário atingido',
        waitSeconds: 86400,
      };
    }

    // Verificar horário comercial (8h-21h)
    const hour = new Date().getHours();
    if (hour < 8 || hour >= 21) {
      return {
        allowed: false,
        reason: 'Fora do horário comercial (8h-21h)',
        waitSeconds: 3600,
      };
    }

    return { allowed: true };
  }

  /**
   * Adiciona mensagem à fila
   */
  queueMessage(
    numberId: string,
    recipient: string,
    message: string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): string {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const queueItem: MessageQueueItem = {
      id: messageId,
      numberId,
      recipient,
      message,
      priority,
      createdAt: new Date(),
      status: 'pending',
    };

    this.messageQueue.push(queueItem);

    // Ordenar fila por prioridade
    this.messageQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return messageId;
  }

  /**
   * Obtém próxima mensagem da fila que pode ser enviada
   */
  getNextMessage(): MessageQueueItem | null {
    // Tentar cada número disponível
    for (const number of Array.from(this.numbers.values())) {
      if (number.status === 'blocked' || number.status === 'quarantine') {
        continue;
      }

      const canSend = this.canSendNow(number.id);
      if (!canSend.allowed) {
        continue;
      }

      // Buscar mensagem pendente para este número
      const message = this.messageQueue.find(
        msg => msg.numberId === number.id && msg.status === 'pending'
      );

      if (message) {
        return message;
      }
    }

    return null;
  }

  /**
   * Marca mensagem como enviada
   */
  markAsSent(messageId: string): void {
    const message = this.messageQueue.find(msg => msg.id === messageId);
    if (!message) {
      throw new Error(`Mensagem ${messageId} não encontrada`);
    }

    message.status = 'sent';
    message.sentAt = new Date();

    // Registrar no histórico
    const history = this.sendHistory.get(message.numberId) || [];
    history.push(new Date());
    this.sendHistory.set(message.numberId, history);

    // Atualizar estatísticas
    this.updateStats(message.numberId, 'sent');
  }

  /**
   * Marca mensagem como falha
   */
  markAsFailed(messageId: string, error: string): void {
    const message = this.messageQueue.find(msg => msg.id === messageId);
    if (!message) {
      throw new Error(`Mensagem ${messageId} não encontrada`);
    }

    message.status = 'failed';
    message.error = error;

    // Atualizar estatísticas
    this.updateStats(message.numberId, 'failed');

    // Se erro indica bloqueio, atualizar status do número
    if (error.includes('blocked') || error.includes('spam')) {
      this.updateNumberStatus(message.numberId, 'critical');
    }
  }

  /**
   * Atualiza estatísticas de envio
   */
  private updateStats(numberId: string, type: 'sent' | 'failed' | 'delivered'): void {
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0]!;
    const hour = now.getHours();

    const numberStats = this.stats.get(numberId) || [];
    let stat = numberStats.find(s => s.date === dateKey && s.hour === hour);

    if (!stat) {
      stat = {
        numberId,
        date: dateKey,
        hour,
        messagesSent: 0,
        messagesBlocked: 0,
        messagesDelivered: 0,
        avgResponseTime: 0,
      };
      numberStats.push(stat);
    }

    if (type === 'sent') {
      stat.messagesSent++;
    } else if (type === 'failed') {
      stat.messagesBlocked++;
    } else if (type === 'delivered') {
      stat.messagesDelivered++;
    }

    this.stats.set(numberId, numberStats);
  }

  /**
   * Atualiza status do número
   */
  updateNumberStatus(
    numberId: string,
    status: 'active' | 'warning' | 'critical' | 'blocked' | 'quarantine'
  ): void {
    const number = this.numbers.get(numberId);
    if (!number) {
      throw new Error(`Número ${numberId} não encontrado`);
    }

    number.status = status;
    this.numbers.set(numberId, number);
  }

  /**
   * Obtém estatísticas de um número
   */
  getNumberStats(numberId: string): {
    today: { sent: number; failed: number; limit: number };
    thisHour: { sent: number; failed: number; limit: number };
    status: string;
    canSendNow: boolean;
    nextAvailableIn?: number;
  } {
    const number = this.numbers.get(numberId);
    if (!number) {
      throw new Error(`Número ${numberId} não encontrado`);
    }

    const limits = this.getSafeLimits(numberId);
    const history = this.sendHistory.get(numberId) || [];
    const now = Date.now();

    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sentToday = history.filter(ts => ts.getTime() > oneDayAgo).length;

    const oneHourAgo = now - 60 * 60 * 1000;
    const sentThisHour = history.filter(ts => ts.getTime() > oneHourAgo).length;

    const canSend = this.canSendNow(numberId);

    return {
      today: {
        sent: sentToday,
        failed: 0, // TODO: calcular de stats
        limit: limits.dailyLimit,
      },
      thisHour: {
        sent: sentThisHour,
        failed: 0,
        limit: limits.hourlyLimit,
      },
      status: number.status,
      canSendNow: canSend.allowed,
      nextAvailableIn: canSend.waitSeconds,
    };
  }

  /**
   * Obtém número ideal para enviar mensagem
   */
  getBestNumberForSending(): string | null {
    let bestNumber: WhatsAppNumber | null = null;
    let lowestUsage = Infinity;

    for (const number of Array.from(this.numbers.values())) {
      if (number.status === 'blocked' || number.status === 'quarantine') {
        continue;
      }

      const canSend = this.canSendNow(number.id);
      if (!canSend.allowed) {
        continue;
      }

      const stats = this.getNumberStats(number.id);
      const usage = stats.today.sent / stats.today.limit;

      if (usage < lowestUsage) {
        lowestUsage = usage;
        bestNumber = number;
      }
    }

    return bestNumber?.id || null;
  }

  /**
   * Gera delay aleatório entre mensagens (humanização)
   */
  getRandomDelay(numberId: string): number {
    const limits = this.getSafeLimits(numberId);
    const minDelay = limits.minIntervalSeconds;
    const maxDelay = minDelay * 1.5;

    return Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);
  }

  /**
   * Limpa histórico antigo (>7 dias)
   */
  cleanOldHistory(): void {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const [numberId, history] of Array.from(this.sendHistory.entries())) {
      const filtered = history.filter((ts: Date) => ts.getTime() > sevenDaysAgo);
      this.sendHistory.set(numberId, filtered);
    }

    // Limpar mensagens antigas da fila
    this.messageQueue = this.messageQueue.filter(
      msg =>
        msg.status === 'pending' ||
        (msg.sentAt && msg.sentAt.getTime() > sevenDaysAgo)
    );
  }

  /**
   * Obtém resumo geral do sistema
   */
  getSystemSummary(): {
    totalNumbers: number;
    activeNumbers: number;
    blockedNumbers: number;
    queuedMessages: number;
    sentToday: number;
    failedToday: number;
  } {
    const activeNumbers = Array.from(this.numbers.values()).filter(
      n => n.status === 'active' || n.status === 'warning'
    ).length;

    const blockedNumbers = Array.from(this.numbers.values()).filter(
      n => n.status === 'blocked' || n.status === 'quarantine'
    ).length;

    const queuedMessages = this.messageQueue.filter(msg => msg.status === 'pending')
      .length;

    const today = new Date().toISOString().split('T')[0]!;
    let sentToday = 0;
    let failedToday = 0;

    for (const numberStats of Array.from(this.stats.values())) {
      const todayStats = numberStats.filter((s: SendStats) => s.date === today);
      sentToday += todayStats.reduce((sum: number, s: SendStats) => sum + s.messagesSent, 0);
      failedToday += todayStats.reduce((sum: number, s: SendStats) => sum + s.messagesBlocked, 0);
    }

    return {
      totalNumbers: this.numbers.size,
      activeNumbers,
      blockedNumbers,
      queuedMessages,
      sentToday,
      failedToday,
    };
  }
}

// Singleton global
export const whatsappRateLimiter = new WhatsAppRateLimiter();
