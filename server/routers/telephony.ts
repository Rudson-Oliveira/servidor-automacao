import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { telephonyService, TelephonyGensparkService } from "../services/telephony-genspark";
import { TRPCError } from "@trpc/server";

/**
 * Router para Telefonia com Genspark
 * Endpoints para gerenciar atendimento telefônico inteligente
 */

const BusinessHoursSchema = z.object({
  enabled: z.boolean(),
  schedule: z.record(
    z.object({
      start: z.string(),
      end: z.string(),
      enabled: z.boolean(),
    })
  ),
});

const TelephonyConfigSchema = z.object({
  phoneNumber: z.string(),
  welcomeMessage: z.string(),
  businessHours: BusinessHoursSchema,
  afterHoursMessage: z.string(),
  maxCallDuration: z.number().min(30).max(3600),
  recordCalls: z.boolean(),
  transferToHuman: z.object({
    enabled: z.boolean(),
    keywords: z.array(z.string()),
    phoneNumber: z.string().optional(),
  }),
});

export const telephonyRouter = router({
  /**
   * Verificar se o serviço está configurado
   */
  isConfigured: publicProcedure.query(() => {
    return {
      configured: telephonyService.isConfigured(),
      phoneNumber: telephonyService.getPhoneNumber(),
    };
  }),

  /**
   * Obter número de telefone
   */
  getPhoneNumber: publicProcedure.query(() => {
    return {
      phoneNumber: telephonyService.getPhoneNumber(),
      formatted: telephonyService.getPhoneNumber(),
    };
  }),

  /**
   * Obter configuração de telefonia
   */
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    // Em produção, buscar do banco de dados por usuário
    // Por enquanto, retornar configuração padrão

    const defaultConfig = {
      phoneNumber: telephonyService.getPhoneNumber(),
      welcomeMessage:
        "Olá! Bem-vindo ao nosso atendimento automatizado. Como posso ajudá-lo hoje?",
      businessHours: {
        enabled: false,
        schedule: {
          monday: { start: "09:00", end: "18:00", enabled: true },
          tuesday: { start: "09:00", end: "18:00", enabled: true },
          wednesday: { start: "09:00", end: "18:00", enabled: true },
          thursday: { start: "09:00", end: "18:00", enabled: true },
          friday: { start: "09:00", end: "18:00", enabled: true },
          saturday: { start: "09:00", end: "13:00", enabled: false },
          sunday: { start: "09:00", end: "13:00", enabled: false },
        },
      },
      afterHoursMessage:
        "Obrigado por ligar. No momento estamos fora do horário de atendimento. Nosso horário de funcionamento é de segunda a sexta, das 9h às 18h.",
      maxCallDuration: 300,
      recordCalls: true,
      transferToHuman: {
        enabled: true,
        keywords: ["atendente", "humano", "pessoa", "falar com alguém", "transferir"],
        phoneNumber: undefined,
      },
    };

    return defaultConfig;
  }),

  /**
   * Atualizar configuração de telefonia
   */
  updateConfig: protectedProcedure
    .input(TelephonyConfigSchema.partial())
    .mutation(async ({ input, ctx }) => {
      // Em produção, salvar no banco de dados

      return {
        success: true,
        config: input,
      };
    }),

  /**
   * Obter histórico de chamadas
   */
  getCallHistory: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      // Em produção, buscar do banco de dados
      // Por enquanto, retornar dados simulados

      const mockCalls = Array.from({ length: input.limit }, (_, i) => ({
        id: `call_${Date.now() - i * 1000}`,
        callSid: `CA${Math.random().toString(36).substring(7)}`,
        from: `+55 11 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
        to: telephonyService.getPhoneNumber(),
        startTime: new Date(Date.now() - i * 3600000).toISOString(),
        endTime: new Date(Date.now() - i * 3600000 + 180000).toISOString(),
        duration: 180 + Math.floor(Math.random() * 120),
        transcript: "Cliente solicitou informações sobre produtos",
        aiResponse: "Forneci informações detalhadas sobre nossos produtos",
        status: ["completed", "transferred", "failed"][Math.floor(Math.random() * 3)] as
          | "completed"
          | "transferred"
          | "failed",
      }));

      return {
        calls: mockCalls,
        total: 150,
        hasMore: input.offset + input.limit < 150,
      };
    }),

  /**
   * Obter estatísticas de chamadas
   */
  getStatistics: protectedProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
      })
    )
    .query(async ({ input }) => {
      const stats = await telephonyService.getCallStatistics({
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      });

      return stats;
    }),

  /**
   * Obter templates de casos de uso
   */
  getUseCaseTemplates: publicProcedure.query(() => {
    return {
      templates: TelephonyGensparkService.getUseCaseTemplates(),
    };
  }),

  /**
   * Aplicar template de caso de uso
   */
  applyTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const templates = TelephonyGensparkService.getUseCaseTemplates();
      const template = templates.find((t) => t.id === input.templateId);

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template não encontrado",
        });
      }

      // Em produção, salvar configuração no banco de dados

      return {
        success: true,
        config: {
          welcomeMessage: template.welcomeMessage,
          transferToHuman: {
            enabled: true,
            keywords: template.keywords,
          },
        },
      };
    }),

  /**
   * Testar chamada (simulação)
   */
  testCall: protectedProcedure
    .input(
      z.object({
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Simular processamento de chamada
      const config = await telephonyService.getCallStatistics({
        startDate: new Date(),
        endDate: new Date(),
      });

      const result = await telephonyService.processTranscript({
        callSid: `TEST_${Date.now()}`,
        transcript: input.message,
        config: {
          phoneNumber: telephonyService.getPhoneNumber(),
          welcomeMessage: "Teste",
          businessHours: { enabled: false, schedule: {} },
          afterHoursMessage: "",
          maxCallDuration: 300,
          recordCalls: false,
          transferToHuman: {
            enabled: true,
            keywords: ["atendente", "humano"],
          },
        },
      });

      return {
        transcript: input.message,
        response: result.response,
        shouldTransfer: result.shouldTransfer,
      };
    }),

  /**
   * Webhook: Processar chamada recebida (público para Twilio)
   */
  webhookIncoming: publicProcedure
    .input(
      z.object({
        CallSid: z.string(),
        From: z.string(),
        To: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Buscar configuração do usuário baseado no número "To"
      // Por enquanto, usar configuração padrão

      const config = {
        phoneNumber: input.To,
        welcomeMessage: "Olá! Como posso ajudá-lo?",
        businessHours: { enabled: false, schedule: {} },
        afterHoursMessage: "",
        maxCallDuration: 300,
        recordCalls: true,
        transferToHuman: {
          enabled: true,
          keywords: ["atendente", "humano"],
        },
      };

      const result = await telephonyService.handleIncomingCall({
        callSid: input.CallSid,
        from: input.From,
        to: input.To,
        config,
      });

      return {
        twiml: result.twiml,
        callId: result.callRecord.id,
      };
    }),

  /**
   * Webhook: Processar transcrição
   */
  webhookProcess: publicProcedure
    .input(
      z.object({
        CallSid: z.string(),
        SpeechResult: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (!input.SpeechResult) {
        return {
          twiml: telephonyService.generateResponseTwiML({
            response: "Desculpe, não consegui entender. Pode repetir?",
            shouldTransfer: false,
            continueConversation: true,
          }),
        };
      }

      const config = {
        phoneNumber: "",
        welcomeMessage: "",
        businessHours: { enabled: false, schedule: {} },
        afterHoursMessage: "",
        maxCallDuration: 300,
        recordCalls: false,
        transferToHuman: {
          enabled: true,
          keywords: ["atendente", "humano", "pessoa"],
        },
      };

      const result = await telephonyService.processTranscript({
        callSid: input.CallSid,
        transcript: input.SpeechResult,
        config,
      });

      return {
        twiml: telephonyService.generateResponseTwiML({
          response: result.response,
          shouldTransfer: result.shouldTransfer,
          transferNumber: config.transferToHuman.phoneNumber,
          continueConversation: !result.shouldTransfer,
        }),
      };
    }),
});
