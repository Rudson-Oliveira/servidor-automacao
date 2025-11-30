/**
 * Mock WhatsApp API
 * Simula envio de mensagens sem risco de bloqueio real
 */

export interface WhatsAppMessage {
  to: string;
  message: string;
  timestamp?: number;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  mock: boolean;
}

class WhatsAppMock {
  private messages: WhatsAppMessage[] = [];
  private messageIdCounter = 1;

  /**
   * Simula envio de mensagem WhatsApp
   */
  async sendMessage(to: string, message: string): Promise<WhatsAppResponse> {
    // Simular delay de rede
    await this.delay(100 + Math.random() * 400);

    // Validar número (formato brasileiro)
    if (!this.isValidPhoneNumber(to)) {
      return {
        success: false,
        error: 'Número de telefone inválido',
        mock: true,
      };
    }

    // Simular falha ocasional (5% de chance)
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: 'Erro simulado de conexão',
        mock: true,
      };
    }

    // Armazenar mensagem
    const msg: WhatsAppMessage = {
      to,
      message,
      timestamp: Date.now(),
    };
    this.messages.push(msg);

    // Gerar ID da mensagem
    const messageId = `MOCK_WA_${this.messageIdCounter++}_${Date.now()}`;

    console.log(`[WhatsApp Mock] Mensagem enviada para ${to}: ${message.substring(0, 50)}...`);

    return {
      success: true,
      messageId,
      mock: true,
    };
  }

  /**
   * Obter histórico de mensagens enviadas (apenas para testes)
   */
  getMessageHistory(): WhatsAppMessage[] {
    return [...this.messages];
  }

  /**
   * Limpar histórico
   */
  clearHistory(): void {
    this.messages = [];
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Formato brasileiro: +5511999999999 ou 11999999999
    const regex = /^(\+55)?[1-9]{2}9[0-9]{8}$/;
    return regex.test(phone.replace(/\D/g, ''));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const whatsappMock = new WhatsAppMock();
