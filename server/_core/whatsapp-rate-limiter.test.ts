import { describe, expect, it, beforeEach } from 'vitest';
import { WhatsAppRateLimiter, type WhatsAppNumber } from './whatsapp-rate-limiter';

describe('WhatsAppRateLimiter', () => {
  let limiter: WhatsAppRateLimiter;

  beforeEach(() => {
    limiter = new WhatsAppRateLimiter();
  });

  describe('registerNumber', () => {
    it('deve registrar número corretamente', () => {
      const number: WhatsAppNumber = {
        id: 'num_1',
        phone: '+5511999999999',
        type: 'business',
        createdAt: new Date(),
        status: 'active',
        dailyLimit: 150,
        hourlyLimit: 30,
        minIntervalSeconds: 120,
      };

      limiter.registerNumber(number);

      const stats = limiter.getNumberStats('num_1');
      expect(stats.status).toBe('active');
    });
  });

  describe('getSafeLimits', () => {
    it('deve retornar limites corretos para WhatsApp Business novo', () => {
      const number: WhatsAppNumber = {
        id: 'num_business_new',
        phone: '+5511999999999',
        type: 'business',
        createdAt: new Date(), // Criado agora (< 7 dias)
        status: 'active',
        dailyLimit: 0,
        hourlyLimit: 0,
        minIntervalSeconds: 0,
      };

      limiter.registerNumber(number);
      const limits = limiter.getSafeLimits('num_business_new');

      expect(limits.dailyLimit).toBe(40);
      expect(limits.hourlyLimit).toBe(10);
      expect(limits.minIntervalSeconds).toBe(300); // 5 minutos
    });

    it('deve retornar limites corretos para WhatsApp Business estabelecido', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 35);

      const number: WhatsAppNumber = {
        id: 'num_business_old',
        phone: '+5511999999999',
        type: 'business',
        createdAt: thirtyDaysAgo,
        status: 'active',
        dailyLimit: 0,
        hourlyLimit: 0,
        minIntervalSeconds: 0,
      };

      limiter.registerNumber(number);
      const limits = limiter.getSafeLimits('num_business_old');

      expect(limits.dailyLimit).toBe(150);
      expect(limits.hourlyLimit).toBe(30);
      expect(limits.minIntervalSeconds).toBe(120); // 2 minutos
    });

    it('deve retornar limites corretos para WhatsApp Business API', () => {
      const number: WhatsAppNumber = {
        id: 'num_api',
        phone: '+5511999999999',
        type: 'business_api',
        createdAt: new Date(),
        status: 'active',
        dailyLimit: 0,
        hourlyLimit: 0,
        minIntervalSeconds: 0,
      };

      limiter.registerNumber(number);
      const limits = limiter.getSafeLimits('num_api');

      expect(limits.dailyLimit).toBe(1000);
      expect(limits.hourlyLimit).toBe(100);
      expect(limits.minIntervalSeconds).toBe(30);
    });
  });

  describe('canSendNow', () => {
    it('deve permitir envio quando não há histórico', () => {
      const number: WhatsAppNumber = {
        id: 'num_test',
        phone: '+5511999999999',
        type: 'business',
        createdAt: new Date(),
        status: 'active',
        dailyLimit: 150,
        hourlyLimit: 30,
        minIntervalSeconds: 120,
      };

      limiter.registerNumber(number);

      // Mock da hora para estar dentro do horário comercial
      const originalDate = Date;
      const mockDate = new Date('2025-01-26T10:00:00');
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;

      const result = limiter.canSendNow('num_test');

      global.Date = originalDate;

      expect(result.allowed).toBe(true);
    });

    it('deve bloquear número em status blocked', () => {
      const number: WhatsAppNumber = {
        id: 'num_blocked',
        phone: '+5511999999999',
        type: 'business',
        createdAt: new Date(),
        status: 'blocked',
        dailyLimit: 150,
        hourlyLimit: 30,
        minIntervalSeconds: 120,
      };

      limiter.registerNumber(number);

      const result = limiter.canSendNow('num_blocked');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('blocked');
    });
  });

  describe('queueMessage', () => {
    it('deve adicionar mensagem à fila', () => {
      const number: WhatsAppNumber = {
        id: 'num_queue',
        phone: '+5511999999999',
        type: 'business',
        createdAt: new Date(),
        status: 'active',
        dailyLimit: 150,
        hourlyLimit: 30,
        minIntervalSeconds: 120,
      };

      limiter.registerNumber(number);

      const messageId = limiter.queueMessage(
        'num_queue',
        '+5511888888888',
        'Olá! Temos uma vaga.',
        'normal'
      );

      expect(messageId).toContain('msg_');
    });

    it('deve priorizar mensagens high', () => {
      const number: WhatsAppNumber = {
        id: 'num_priority',
        phone: '+5511999999999',
        type: 'business',
        createdAt: new Date(),
        status: 'active',
        dailyLimit: 150,
        hourlyLimit: 30,
        minIntervalSeconds: 120,
      };

      limiter.registerNumber(number);

      limiter.queueMessage('num_priority', '+5511111111111', 'Mensagem normal', 'normal');
      limiter.queueMessage('num_priority', '+5511222222222', 'Mensagem urgente', 'high');
      limiter.queueMessage('num_priority', '+5511333333333', 'Mensagem baixa', 'low');

      // A próxima mensagem deve ser a de alta prioridade
      const next = limiter.getNextMessage();

      expect(next?.message).toBe('Mensagem urgente');
    });
  });

  describe('markAsSent', () => {
    it('deve registrar mensagem como enviada', () => {
      const number: WhatsAppNumber = {
        id: 'num_sent',
        phone: '+5511999999999',
        type: 'business',
        createdAt: new Date(),
        status: 'active',
        dailyLimit: 150,
        hourlyLimit: 30,
        minIntervalSeconds: 120,
      };

      limiter.registerNumber(number);

      const messageId = limiter.queueMessage(
        'num_sent',
        '+5511888888888',
        'Teste',
        'normal'
      );

      limiter.markAsSent(messageId);

      const stats = limiter.getNumberStats('num_sent');
      expect(stats.today.sent).toBe(1);
    });
  });

  describe('getBestNumberForSending', () => {
    it('deve selecionar número com menor uso', () => {
      const number1: WhatsAppNumber = {
        id: 'num_1',
        phone: '+5511111111111',
        type: 'business',
        createdAt: new Date(),
        status: 'active',
        dailyLimit: 150,
        hourlyLimit: 30,
        minIntervalSeconds: 120,
      };

      const number2: WhatsAppNumber = {
        id: 'num_2',
        phone: '+5511222222222',
        type: 'business',
        createdAt: new Date(),
        status: 'active',
        dailyLimit: 150,
        hourlyLimit: 30,
        minIntervalSeconds: 120,
      };

      limiter.registerNumber(number1);
      limiter.registerNumber(number2);

      // Enviar mensagens pelo número 1
      const msg1 = limiter.queueMessage('num_1', '+5511999999999', 'Teste 1', 'normal');
      limiter.markAsSent(msg1);

      // Mock da hora para estar dentro do horário comercial
      const originalDate = Date;
      const mockDate = new Date('2025-01-26T10:00:00');
      global.Date = class extends originalDate {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
        getHours() {
          return 10;
        }
      } as any;

      // Melhor número deve ser o 2 (sem uso)
      const bestNumber = limiter.getBestNumberForSending();

      global.Date = originalDate;

      expect(bestNumber).toBe('num_2');
    });
  });

  describe('getSystemSummary', () => {
    it('deve retornar resumo correto do sistema', () => {
      const number1: WhatsAppNumber = {
        id: 'num_summary_1',
        phone: '+5511111111111',
        type: 'business',
        createdAt: new Date(),
        status: 'active',
        dailyLimit: 150,
        hourlyLimit: 30,
        minIntervalSeconds: 120,
      };

      const number2: WhatsAppNumber = {
        id: 'num_summary_2',
        phone: '+5511222222222',
        type: 'business',
        createdAt: new Date(),
        status: 'blocked',
        dailyLimit: 150,
        hourlyLimit: 30,
        minIntervalSeconds: 120,
      };

      limiter.registerNumber(number1);
      limiter.registerNumber(number2);

      limiter.queueMessage('num_summary_1', '+5511999999999', 'Teste', 'normal');

      const summary = limiter.getSystemSummary();

      expect(summary.totalNumbers).toBe(2);
      expect(summary.activeNumbers).toBe(1);
      expect(summary.blockedNumbers).toBe(1);
      expect(summary.queuedMessages).toBe(1);
    });
  });

  describe('getRandomDelay', () => {
    it('deve gerar delay dentro do intervalo esperado', () => {
      const number: WhatsAppNumber = {
        id: 'num_delay',
        phone: '+5511999999999',
        type: 'business',
        createdAt: new Date(),
        status: 'active',
        dailyLimit: 150,
        hourlyLimit: 30,
        minIntervalSeconds: 120,
      };

      limiter.registerNumber(number);

      const delay = limiter.getRandomDelay('num_delay');

      // Delay deve estar entre minInterval e minInterval * 1.5
      // Para business novo: 300s a 450s
      expect(delay).toBeGreaterThanOrEqual(300);
      expect(delay).toBeLessThanOrEqual(450);
    });
  });
});
