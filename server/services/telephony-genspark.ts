import { TRPCError } from "@trpc/server";

/**
 * Serviço de Telefonia com Genspark
 * Integração completa para atendimento telefônico inteligente via IA
 */

export interface TelephonyConfig {
  phoneNumber: string;
  welcomeMessage: string;
  businessHours: {
    enabled: boolean;
    schedule: {
      [key: string]: { start: string; end: string; enabled: boolean };
    };
  };
  afterHoursMessage: string;
  maxCallDuration: number; // em segundos
  recordCalls: boolean;
  transferToHuman: {
    enabled: boolean;
    keywords: string[];
    phoneNumber?: string;
  };
}

export interface CallRecord {
  id: string;
  callSid: string;
  from: string;
  to: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  transcript: string;
  aiResponse: string;
  recordingUrl?: string;
  status: "in-progress" | "completed" | "failed" | "transferred";
  metadata?: Record<string, any>;
}

export class TelephonyGensparkService {
  private twilioAccountSid: string;
  private twilioAuthToken: string;
  private twilioPhoneNumber: string;
  private gensparkApiKey: string;

  constructor() {
    // Credenciais serão configuradas via env vars
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "";
    this.gensparkApiKey = process.env.GENSPARK_API_KEY || "";
  }

  /**
   * Verificar se as credenciais estão configuradas
   */
  isConfigured(): boolean {
    return !!(
      this.twilioAccountSid &&
      this.twilioAuthToken &&
      this.twilioPhoneNumber &&
      this.gensparkApiKey
    );
  }

  /**
   * Obter número de telefone configurado
   */
  getPhoneNumber(): string {
    if (!this.twilioPhoneNumber) {
      return "+1 (555) 000-0000"; // Número de exemplo
    }
    return this.formatPhoneNumber(this.twilioPhoneNumber);
  }

  /**
   * Formatar número de telefone para exibição
   */
  private formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, "");

    // Formato: +1 (555) 123-4567
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+${cleaned[0]} (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
    }

    return phone;
  }

  /**
   * Processar chamada recebida
   */
  async handleIncomingCall(params: {
    callSid: string;
    from: string;
    to: string;
    config: TelephonyConfig;
  }): Promise<{ twiml: string; callRecord: CallRecord }> {
    const { callSid, from, to, config } = params;

    // Verificar horário de funcionamento
    const isBusinessHours = this.isWithinBusinessHours(config.businessHours);

    // Criar registro de chamada
    const callRecord: CallRecord = {
      id: `call_${Date.now()}`,
      callSid,
      from,
      to,
      startTime: new Date(),
      transcript: "",
      aiResponse: "",
      status: "in-progress",
    };

    // Gerar TwiML para responder a chamada
    let twiml = '<?xml version="1.0" encoding="UTF-8"?><Response>';

    if (!isBusinessHours && config.businessHours.enabled) {
      // Fora do horário de funcionamento
      twiml += `<Say voice="alice" language="pt-BR">${config.afterHoursMessage}</Say>`;
      twiml += "<Hangup/>";
      callRecord.status = "completed";
    } else {
      // Dentro do horário de funcionamento
      twiml += `<Say voice="alice" language="pt-BR">${config.welcomeMessage}</Say>`;

      // Iniciar gravação se configurado
      if (config.recordCalls) {
        twiml += '<Record maxLength="300" transcribe="true" transcribeCallback="/api/telephony/transcribe"/>';
      }

      // Gather (coletar entrada do usuário)
      twiml += '<Gather input="speech" timeout="5" language="pt-BR" speechTimeout="auto" action="/api/telephony/process">';
      twiml += '<Say voice="alice" language="pt-BR">Como posso ajudá-lo?</Say>';
      twiml += "</Gather>";
    }

    twiml += "</Response>";

    return { twiml, callRecord };
  }

  /**
   * Processar transcrição de áudio e gerar resposta com Genspark
   */
  async processTranscript(params: {
    callSid: string;
    transcript: string;
    config: TelephonyConfig;
  }): Promise<{ response: string; shouldTransfer: boolean }> {
    const { transcript, config } = params;

    // Verificar se deve transferir para humano
    const shouldTransfer = this.shouldTransferToHuman(transcript, config.transferToHuman);

    if (shouldTransfer) {
      return {
        response: "Vou transferir você para um de nossos atendentes. Por favor, aguarde.",
        shouldTransfer: true,
      };
    }

    // Processar com Genspark
    try {
      const gensparkResponse = await this.callGensparkAPI(transcript);
      return {
        response: gensparkResponse,
        shouldTransfer: false,
      };
    } catch (error) {
      console.error("Erro ao processar com Genspark:", error);
      return {
        response: "Desculpe, estou com dificuldades técnicas no momento. Tente novamente mais tarde.",
        shouldTransfer: false,
      };
    }
  }

  /**
   * Chamar API do Genspark
   */
  private async callGensparkAPI(transcript: string): Promise<string> {
    // Simulação da chamada à API do Genspark
    // Em produção, fazer requisição HTTP real

    if (!this.gensparkApiKey) {
      throw new Error("Genspark API key não configurada");
    }

    // Exemplo de resposta simulada
    const responses = [
      "Entendo sua solicitação. Vou verificar isso para você imediatamente.",
      "Claro! Posso ajudá-lo com isso. Deixe-me processar sua solicitação.",
      "Obrigado por entrar em contato. Vou resolver isso para você agora.",
      "Perfeito! Estou processando sua solicitação. Um momento, por favor.",
    ];

    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Em produção, fazer:
    // const response = await fetch('https://api.genspark.ai/v1/process', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.gensparkApiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ text: transcript })
    // });
    // return response.json().then(data => data.response);

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Verificar se está dentro do horário de funcionamento
   */
  private isWithinBusinessHours(businessHours: TelephonyConfig["businessHours"]): boolean {
    if (!businessHours.enabled) {
      return true; // Sempre disponível se não houver restrição
    }

    const now = new Date();
    const dayOfWeek = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][now.getDay()];

    const schedule = businessHours.schedule[dayOfWeek];

    if (!schedule || !schedule.enabled) {
      return false;
    }

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = schedule.start.split(":").map(Number);
    const [endHour, endMin] = schedule.end.split(":").map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Verificar se deve transferir para humano
   */
  private shouldTransferToHuman(
    transcript: string,
    transferConfig: TelephonyConfig["transferToHuman"]
  ): boolean {
    if (!transferConfig.enabled) {
      return false;
    }

    const lowerTranscript = transcript.toLowerCase();

    return transferConfig.keywords.some((keyword) =>
      lowerTranscript.includes(keyword.toLowerCase())
    );
  }

  /**
   * Gerar TwiML de resposta
   */
  generateResponseTwiML(params: {
    response: string;
    shouldTransfer: boolean;
    transferNumber?: string;
    continueConversation?: boolean;
  }): string {
    const { response, shouldTransfer, transferNumber, continueConversation = true } = params;

    let twiml = '<?xml version="1.0" encoding="UTF-8"?><Response>';

    // Falar a resposta
    twiml += `<Say voice="alice" language="pt-BR">${response}</Say>`;

    if (shouldTransfer && transferNumber) {
      // Transferir para número humano
      twiml += `<Dial>${transferNumber}</Dial>`;
    } else if (continueConversation) {
      // Continuar conversação
      twiml += '<Gather input="speech" timeout="5" language="pt-BR" speechTimeout="auto" action="/api/telephony/process">';
      twiml += '<Say voice="alice" language="pt-BR">Posso ajudá-lo com mais alguma coisa?</Say>';
      twiml += "</Gather>";
    } else {
      // Encerrar chamada
      twiml += '<Say voice="alice" language="pt-BR">Obrigado por ligar. Tenha um ótimo dia!</Say>';
      twiml += "<Hangup/>";
    }

    twiml += "</Response>";

    return twiml;
  }

  /**
   * Obter estatísticas de chamadas
   */
  async getCallStatistics(params: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalCalls: number;
    completedCalls: number;
    failedCalls: number;
    transferredCalls: number;
    averageDuration: number;
    totalDuration: number;
  }> {
    // Em produção, buscar do banco de dados
    // Por enquanto, retornar dados simulados

    return {
      totalCalls: 150,
      completedCalls: 135,
      failedCalls: 5,
      transferredCalls: 10,
      averageDuration: 180, // 3 minutos
      totalDuration: 27000, // 7.5 horas
    };
  }

  /**
   * Templates de casos de uso
   */
  static getUseCaseTemplates(): Array<{
    id: string;
    name: string;
    description: string;
    welcomeMessage: string;
    keywords: string[];
  }> {
    return [
      {
        id: "customer-support",
        name: "Atendimento ao Cliente 24/7",
        description: "Suporte automatizado para dúvidas frequentes e problemas comuns",
        welcomeMessage:
          "Olá! Bem-vindo ao nosso atendimento automatizado. Estou aqui para ajudá-lo 24 horas por dia, 7 dias por semana.",
        keywords: ["problema", "ajuda", "suporte", "não funciona", "erro"],
      },
      {
        id: "appointment-scheduling",
        name: "Agendamento por Telefone",
        description: "Agende consultas, reuniões e serviços automaticamente",
        welcomeMessage:
          "Olá! Gostaria de agendar um horário? Posso ajudá-lo com isso agora mesmo.",
        keywords: ["agendar", "marcar", "horário", "disponibilidade", "consulta"],
      },
      {
        id: "technical-support",
        name: "Suporte Técnico Automatizado",
        description: "Resolva problemas técnicos com orientação passo a passo",
        welcomeMessage:
          "Bem-vindo ao suporte técnico. Vou ajudá-lo a resolver seu problema técnico.",
        keywords: ["técnico", "instalação", "configuração", "erro", "bug"],
      },
      {
        id: "sales-info",
        name: "Vendas e Informações",
        description: "Forneça informações sobre produtos, preços e disponibilidade",
        welcomeMessage:
          "Olá! Obrigado por ligar. Como posso ajudá-lo com informações sobre nossos produtos e serviços?",
        keywords: ["preço", "comprar", "produto", "disponível", "estoque"],
      },
    ];
  }
}

// Instância singleton
export const telephonyService = new TelephonyGensparkService();
