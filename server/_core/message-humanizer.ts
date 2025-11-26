/**
 * Sistema de Humanização de Mensagens WhatsApp
 * Gera variações de mensagens para evitar detecção de spam
 */

export interface MessageTemplate {
  id: string;
  name: string;
  category: 'greeting' | 'job_offer' | 'follow_up' | 'interview' | 'rejection' | 'custom';
  variations: string[];
  variables: string[]; // Ex: ['nome', 'cargo', 'salario']
}

export interface MessageVariables {
  [key: string]: string | number;
}

export class MessageHumanizer {
  private templates: Map<string, MessageTemplate> = new Map();
  private usageHistory: Map<string, number> = new Map(); // templateId -> usage count

  constructor() {
    this.loadDefaultTemplates();
  }

  /**
   * Carrega templates padrão para recrutamento
   */
  private loadDefaultTemplates(): void {
    // Templates de Saudação
    this.registerTemplate({
      id: 'greeting_1',
      name: 'Saudação Formal',
      category: 'greeting',
      variables: ['nome'],
      variations: [
        'Olá {nome}, tudo bem?',
        'Oi {nome}! Como vai?',
        'Olá {nome}, como você está?',
        'Oi {nome}, tudo certo?',
        'Olá {nome}! Espero que esteja bem.',
        'Oi {nome}! Tudo tranquilo?',
        'Olá {nome}, bom dia/tarde!',
        'Oi {nome}! Prazer em contato.',
      ],
    });

    // Templates de Oferta de Vaga
    this.registerTemplate({
      id: 'job_offer_1',
      name: 'Oferta de Vaga - Direta',
      category: 'job_offer',
      variables: ['nome', 'cargo', 'local'],
      variations: [
        '{nome}, somos do RH da Hospitalar e temos uma vaga de {cargo} em {local}. Você teria interesse?',
        'Oi {nome}! Aqui é do setor de recrutamento da Hospitalar. Estamos com uma oportunidade de {cargo} em {local}. Gostaria de saber mais?',
        '{nome}, vimos seu perfil e achamos que você se encaixaria perfeitamente na vaga de {cargo} que temos em {local}. Podemos conversar?',
        'Olá {nome}! Temos uma vaga de {cargo} na Hospitalar ({local}) e achamos seu perfil interessante. Você está disponível para novas oportunidades?',
        '{nome}, estamos recrutando para {cargo} em {local} e seu perfil chamou nossa atenção. Você teria interesse em conhecer a vaga?',
        'Oi {nome}! A Hospitalar está com uma posição aberta de {cargo} em {local}. Seu perfil é bem alinhado com o que buscamos. Podemos conversar?',
        '{nome}, que tal uma nova oportunidade? Temos uma vaga de {cargo} em {local} na Hospitalar. Você estaria disponível?',
        'Olá {nome}! Estou entrando em contato porque temos uma vaga de {cargo} em {local} que combina com seu perfil. Você teria interesse?',
      ],
    });

    // Templates de Oferta com Salário
    this.registerTemplate({
      id: 'job_offer_salary',
      name: 'Oferta de Vaga - Com Salário',
      category: 'job_offer',
      variables: ['nome', 'cargo', 'local', 'salario'],
      variations: [
        '{nome}, temos uma vaga de {cargo} em {local} com salário de R$ {salario}. Você teria interesse?',
        'Oi {nome}! Vaga de {cargo} na Hospitalar ({local}), salário R$ {salario}. Seu perfil é bem alinhado. Podemos conversar?',
        '{nome}, oportunidade de {cargo} em {local}, remuneração de R$ {salario}. Gostaria de saber mais detalhes?',
        'Olá {nome}! Estamos com vaga de {cargo} ({local}), oferecendo R$ {salario}. Você estaria disponível?',
        '{nome}, que tal {cargo} em {local}? Salário de R$ {salario} + benefícios. Tem interesse?',
      ],
    });

    // Templates de Follow-up
    this.registerTemplate({
      id: 'follow_up_1',
      name: 'Follow-up Gentil',
      category: 'follow_up',
      variables: ['nome'],
      variations: [
        '{nome}, conseguiu ver minha mensagem anterior sobre a vaga?',
        'Oi {nome}! Só passando para saber se você viu a oportunidade que te enviei.',
        '{nome}, você teve chance de avaliar a vaga que comentei?',
        'Olá {nome}! Ficou com alguma dúvida sobre a vaga?',
        '{nome}, gostaria de saber se você tem interesse na oportunidade que mencionei.',
        'Oi {nome}! Ainda está disponível para novas oportunidades?',
      ],
    });

    // Templates de Agendamento de Entrevista
    this.registerTemplate({
      id: 'interview_1',
      name: 'Agendamento de Entrevista',
      category: 'interview',
      variables: ['nome', 'data', 'horario'],
      variations: [
        '{nome}, que ótimo que você tem interesse! Podemos agendar uma entrevista para {data} às {horario}?',
        'Oi {nome}! Vamos marcar então? Que tal {data} às {horario}?',
        '{nome}, perfeito! Consegue comparecer {data} às {horario} para conversarmos?',
        'Olá {nome}! Tenho disponibilidade {data} às {horario}. Funciona para você?',
        '{nome}, ótimo! Podemos fazer a entrevista {data} às {horario}?',
      ],
    });

    // Templates de Rejeição Gentil
    this.registerTemplate({
      id: 'rejection_1',
      name: 'Rejeição Respeitosa',
      category: 'rejection',
      variables: ['nome'],
      variations: [
        '{nome}, agradecemos muito seu interesse! Infelizmente, para esta vaga específica, optamos por outro perfil. Mas vamos manter seu contato para futuras oportunidades.',
        'Oi {nome}! Obrigado por participar do processo. Desta vez não avançamos, mas seu currículo ficará em nosso banco de talentos.',
        '{nome}, agradecemos sua participação. Para esta posição, seguimos com outro candidato, mas certamente entraremos em contato em novas oportunidades.',
        'Olá {nome}! Obrigado pelo interesse. Não foi desta vez, mas vamos te considerar em futuras vagas.',
      ],
    });
  }

  /**
   * Registra um template customizado
   */
  registerTemplate(template: MessageTemplate): void {
    this.templates.set(template.id, template);
    this.usageHistory.set(template.id, 0);
  }

  /**
   * Gera mensagem humanizada a partir de template
   */
  generateMessage(
    templateId: string,
    variables: MessageVariables,
    preferLeastUsed: boolean = true
  ): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} não encontrado`);
    }

    // Selecionar variação
    let variation: string;

    if (preferLeastUsed) {
      // Usar variação menos usada (distribuição uniforme)
      const usageCount = this.usageHistory.get(templateId) || 0;
      const variationIndex = usageCount % template.variations.length;
      variation = template.variations[variationIndex]!;
    } else {
      // Variação aleatória
      const randomIndex = Math.floor(Math.random() * template.variations.length);
      variation = template.variations[randomIndex]!;
    }

    // Substituir variáveis
    let message = variation;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Adicionar variações de pontuação/emojis aleatoriamente
    message = this.addRandomTouches(message);

    // Incrementar uso
    this.usageHistory.set(templateId, (this.usageHistory.get(templateId) || 0) + 1);

    return message;
  }

  /**
   * Adiciona toques humanos aleatórios (emojis, pontuação)
   */
  private addRandomTouches(message: string): string {
    const random = Math.random();

    // 30% de chance de adicionar emoji no final
    if (random < 0.3) {
      const emojis = ['😊', '👍', '✨', '💼', '🎯'];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      message += ` ${emoji}`;
    }

    // 20% de chance de adicionar exclamação extra
    if (random > 0.8 && !message.endsWith('!')) {
      message = message.replace(/\.$/, '!');
    }

    return message;
  }

  /**
   * Gera saudação baseada no horário
   */
  generateTimeBasedGreeting(nome: string): string {
    const hour = new Date().getHours();

    let greeting: string;
    if (hour < 12) {
      greeting = 'Bom dia';
    } else if (hour < 18) {
      greeting = 'Boa tarde';
    } else {
      greeting = 'Boa noite';
    }

    const variations = [
      `${greeting}, ${nome}!`,
      `${greeting} ${nome}, tudo bem?`,
      `Olá ${nome}, ${greeting.toLowerCase()}!`,
      `${greeting}! ${nome}, como vai?`,
    ];

    return variations[Math.floor(Math.random() * variations.length)]!;
  }

  /**
   * Gera variação de texto simples (sem template)
   */
  generateVariation(baseText: string, variationCount: number = 5): string[] {
    const variations: string[] = [baseText];

    // Variações de pontuação
    variations.push(baseText.replace(/\./g, '!'));
    variations.push(baseText.replace(/\?/g, '?!'));

    // Variações de palavras comuns
    const replacements: Record<string, string[]> = {
      'temos': ['estamos com', 'temos disponível', 'há'],
      'você': ['vc', 'você'],
      'gostaria': ['gostaria', 'teria interesse', 'quer'],
      'olá': ['oi', 'olá', 'e aí'],
      'obrigado': ['obrigado', 'muito obrigado', 'agradecemos'],
    };

    for (const [original, alternatives] of Object.entries(replacements)) {
      const regex = new RegExp(`\\b${original}\\b`, 'gi');
      for (const alt of alternatives) {
        if (variations.length >= variationCount) break;
        const varied = baseText.replace(regex, alt);
        if (!variations.includes(varied)) {
          variations.push(varied);
        }
      }
    }

    return variations.slice(0, variationCount);
  }

  /**
   * Simula digitação humana (retorna delays em ms)
   */
  simulateTyping(message: string): number {
    // Velocidade média de digitação: 40-60 palavras por minuto
    // = ~200-300 caracteres por minuto = ~3-5 caracteres por segundo

    const charCount = message.length;
    const avgCharsPerSecond = 4; // Conservador
    const baseTime = (charCount / avgCharsPerSecond) * 1000;

    // Adicionar variação aleatória (±30%)
    const variation = baseTime * 0.3;
    const randomVariation = (Math.random() - 0.5) * 2 * variation;

    return Math.max(1000, Math.floor(baseTime + randomVariation));
  }

  /**
   * Obtém templates por categoria
   */
  getTemplatesByCategory(category: MessageTemplate['category']): MessageTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  /**
   * Obtém estatísticas de uso de templates
   */
  getUsageStats(): Array<{ templateId: string; name: string; usageCount: number }> {
    return Array.from(this.templates.entries()).map(([id, template]) => ({
      templateId: id,
      name: template.name,
      usageCount: this.usageHistory.get(id) || 0,
    }));
  }

  /**
   * Reseta contadores de uso
   */
  resetUsageHistory(): void {
    for (const templateId of Array.from(this.templates.keys())) {
      this.usageHistory.set(templateId, 0);
    }
  }

  /**
   * Valida se mensagem parece spam
   */
  detectSpamPatterns(message: string): {
    isSpam: boolean;
    reasons: string[];
    score: number;
  } {
    const reasons: string[] = [];
    let score = 0;

    // Palavras-gatilho de spam
    const spamWords = [
      'ganhe dinheiro',
      'clique aqui',
      'urgente',
      'promoção imperdível',
      'grátis',
      'oferta limitada',
      'não perca',
      'últimas vagas',
    ];

    const lowerMessage = message.toLowerCase();
    for (const word of spamWords) {
      if (lowerMessage.includes(word)) {
        reasons.push(`Contém palavra-gatilho: "${word}"`);
        score += 20;
      }
    }

    // Excesso de maiúsculas
    const upperCaseCount = (message.match(/[A-Z]/g) || []).length;
    const upperCaseRatio = upperCaseCount / message.length;
    if (upperCaseRatio > 0.3) {
      reasons.push('Excesso de letras maiúsculas');
      score += 15;
    }

    // Excesso de pontuação
    const punctuationCount = (message.match(/[!?]{2,}/g) || []).length;
    if (punctuationCount > 2) {
      reasons.push('Excesso de pontuação (!!!, ???)');
      score += 10;
    }

    // Links encurtados
    const shortLinks = ['bit.ly', 'tinyurl', 'goo.gl', 't.co'];
    for (const link of shortLinks) {
      if (message.includes(link)) {
        reasons.push(`Link encurtado detectado: ${link}`);
        score += 25;
      }
    }

    // Mensagem muito curta (< 20 caracteres)
    if (message.length < 20) {
      reasons.push('Mensagem muito curta');
      score += 5;
    }

    // Mensagem muito longa (> 500 caracteres)
    if (message.length > 500) {
      reasons.push('Mensagem muito longa');
      score += 10;
    }

    return {
      isSpam: score >= 50,
      reasons,
      score,
    };
  }
}

// Singleton global
export const messageHumanizer = new MessageHumanizer();
