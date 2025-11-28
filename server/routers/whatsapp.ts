/**
 * Router de Gestão WhatsApp Anti-Bloqueio
 * Sistema inteligente para recrutamento
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { whatsappRateLimiter, type WhatsAppNumber } from '../_core/whatsapp-rate-limiter';
import { messageHumanizer } from '../_core/message-humanizer';

export const whatsappRouter = router({
  /**
   * Registrar número WhatsApp
   */
  registerNumber: protectedProcedure
    .input(z.object({
      phone: z.string(),
      type: z.enum(['common', 'business', 'business_api']),
    }))
    .mutation(({ input }) => {
      const number: WhatsAppNumber = {
        id: `num_${Date.now()}`,
        phone: input.phone,
        type: input.type,
        createdAt: new Date(),
        status: 'active',
        dailyLimit: 0,
        hourlyLimit: 0,
        minIntervalSeconds: 0,
      };

      whatsappRateLimiter.registerNumber(number);

      return {
        success: true,
        number,
        limits: whatsappRateLimiter.getSafeLimits(number.id),
      };
    }),

  /**
   * Enviar mensagem (adiciona à fila)
   */
  sendMessage: protectedProcedure
    .input(z.object({
      recipient: z.string(),
      templateId: z.string(),
      variables: z.record(z.string(), z.union([z.string(), z.number()])),
      priority: z.enum(['low', 'normal', 'high']).optional(),
      numberId: z.string().optional(), // Se não fornecido, usa melhor número disponível
    }))
    .mutation(({ input }) => {
      // Gerar mensagem humanizada
      const message = messageHumanizer.generateMessage(
        input.templateId,
        input.variables
      );

      // Detectar spam
      const spamCheck = messageHumanizer.detectSpamPatterns(message);
      if (spamCheck.isSpam) {
        return {
          success: false,
          error: 'Mensagem detectada como spam',
          reasons: spamCheck.reasons,
          score: spamCheck.score,
        };
      }

      // Selecionar número
      let numberId = input.numberId;
      if (!numberId) {
        const bestNumber = whatsappRateLimiter.getBestNumberForSending();
        if (!bestNumber) {
          return {
            success: false,
            error: 'Nenhum número disponível no momento',
          };
        }
        numberId = bestNumber;
      }

      // Adicionar à fila
      const messageId = whatsappRateLimiter.queueMessage(
        numberId,
        input.recipient,
        message,
        input.priority || 'normal'
      );

      return {
        success: true,
        messageId,
        numberId,
        message,
        queuePosition: 0, // TODO: calcular posição real
      };
    }),

  /**
   * Obter status de número
   */
  getNumberStatus: protectedProcedure
    .input(z.object({
      numberId: z.string(),
    }))
    .query(({ input }) => {
      const stats = whatsappRateLimiter.getNumberStats(input.numberId);
      const limits = whatsappRateLimiter.getSafeLimits(input.numberId);

      return {
        ...stats,
        limits,
      };
    }),

  /**
   * Obter resumo do sistema
   */
  getSystemSummary: protectedProcedure.query(() => {
    return whatsappRateLimiter.getSystemSummary();
  }),

  /**
   * Listar templates disponíveis
   */
  listTemplates: protectedProcedure
    .input(z.object({
      category: z.enum(['greeting', 'job_offer', 'follow_up', 'interview', 'rejection', 'custom']).optional(),
    }))
    .query(({ input }) => {
      if (input.category) {
        return messageHumanizer.getTemplatesByCategory(input.category);
      }

      return messageHumanizer.getTemplatesByCategory('job_offer');
    }),

  /**
   * Gerar preview de mensagem
   */
  previewMessage: protectedProcedure
    .input(z.object({
      templateId: z.string(),
      variables: z.record(z.string(), z.union([z.string(), z.number()])),
    }))
    .mutation(({ input }) => {
      const message = messageHumanizer.generateMessage(
        input.templateId,
        input.variables,
        false // Variação aleatória para preview
      );

      const spamCheck = messageHumanizer.detectSpamPatterns(message);
      const typingTime = messageHumanizer.simulateTyping(message);

      return {
        message,
        spamCheck,
        typingTime,
        length: message.length,
      };
    }),

  /**
   * Atualizar status de número
   */
  updateNumberStatus: protectedProcedure
    .input(z.object({
      numberId: z.string(),
      status: z.enum(['active', 'warning', 'critical', 'blocked', 'quarantine']),
    }))
    .mutation(({ input }) => {
      whatsappRateLimiter.updateNumberStatus(input.numberId, input.status);

      return {
        success: true,
        numberId: input.numberId,
        newStatus: input.status,
      };
    }),

  /**
   * Obter estatísticas de uso de templates
   */
  getTemplateStats: protectedProcedure.query(() => {
    return messageHumanizer.getUsageStats();
  }),

  /**
   * Validar se pode enviar agora
   */
  canSendNow: protectedProcedure
    .input(z.object({
      numberId: z.string(),
    }))
    .query(({ input }) => {
      return whatsappRateLimiter.canSendNow(input.numberId);
    }),

  /**
   * Obter próxima mensagem da fila
   */
  getNextMessage: protectedProcedure.query(() => {
    const message = whatsappRateLimiter.getNextMessage();

    if (!message) {
      return {
        hasMessage: false,
      };
    }

    return {
      hasMessage: true,
      message,
    };
  }),

  /**
   * Marcar mensagem como enviada
   */
  markAsSent: protectedProcedure
    .input(z.object({
      messageId: z.string(),
    }))
    .mutation(({ input }) => {
      whatsappRateLimiter.markAsSent(input.messageId);

      return {
        success: true,
        messageId: input.messageId,
      };
    }),

  /**
   * Marcar mensagem como falha
   */
  markAsFailed: protectedProcedure
    .input(z.object({
      messageId: z.string(),
      error: z.string(),
    }))
    .mutation(({ input }) => {
      whatsappRateLimiter.markAsFailed(input.messageId, input.error);

      return {
        success: true,
        messageId: input.messageId,
      };
    }),

  /**
   * Criar template customizado
   */
  createTemplate: protectedProcedure
    .input(z.object({
      name: z.string(),
      category: z.enum(['greeting', 'job_offer', 'follow_up', 'interview', 'rejection', 'custom']),
      variations: z.array(z.string()).min(3),
      variables: z.array(z.string()),
    }))
    .mutation(({ input }) => {
      const templateId = `custom_${Date.now()}`;

      messageHumanizer.registerTemplate({
        id: templateId,
        name: input.name,
        category: input.category,
        variations: input.variations,
        variables: input.variables,
      });

      return {
        success: true,
        templateId,
      };
    }),

  /**
   * Gerar variações de texto
   */
  generateVariations: protectedProcedure
    .input(z.object({
      baseText: z.string(),
      count: z.number().min(3).max(10).optional(),
    }))
    .mutation(({ input }) => {
      const variations = messageHumanizer.generateVariation(
        input.baseText,
        input.count || 5
      );

      return {
        variations,
        count: variations.length,
      };
    }),
});
