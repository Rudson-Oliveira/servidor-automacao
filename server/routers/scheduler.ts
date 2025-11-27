import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createSchedule,
  pauseSchedule,
  resumeSchedule,
  deleteSchedule,
  listUserSchedules,
} from "../_core/scheduler-service";

/**
 * Router de Agendamento de Comandos
 * Endpoints para gerenciar agendamentos
 */
export const schedulerRouter = router({
  /**
   * Cria um novo agendamento
   */
  create: protectedProcedure
    .input(
      z.object({
        agentId: z.number(),
        command: z.string().min(1),
        description: z.string().optional(),
        scheduleType: z.enum(["once", "interval", "cron", "event"]),
        scheduleConfig: z.string(), // JSON string
        maxRetries: z.number().min(0).max(10).optional().default(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const scheduleId = await createSchedule({
        userId: ctx.user.id,
        agentId: input.agentId,
        command: input.command,
        description: input.description,
        scheduleType: input.scheduleType,
        scheduleConfig: input.scheduleConfig,
        maxRetries: input.maxRetries,
      });

      return { scheduleId, success: scheduleId > 0 };
    }),

  /**
   * Lista agendamentos do usuário
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const schedules = await listUserSchedules(ctx.user.id);
    return schedules;
  }),

  /**
   * Pausa um agendamento
   */
  pause: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const success = await pauseSchedule(input.scheduleId, ctx.user.id);
      return { success };
    }),

  /**
   * Retoma um agendamento pausado
   */
  resume: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const success = await resumeSchedule(input.scheduleId, ctx.user.id);
      return { success };
    }),

  /**
   * Deleta um agendamento
   */
  delete: protectedProcedure
    .input(
      z.object({
        scheduleId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const success = await deleteSchedule(input.scheduleId, ctx.user.id);
      return { success };
    }),
});
