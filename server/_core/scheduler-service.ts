import cron from "node-cron";
import { getDb } from "../db";
import {
  desktopScheduledCommands,
  type InsertDesktopScheduledCommand,
} from "../../drizzle/schema";
import { eq, and, lte } from "drizzle-orm";
import { getDesktopAgentServer } from "../services/desktopAgentServer";

/**
 * Serviço de Agendamento de Comandos
 * Gerencia execução de comandos em horários específicos ou intervalos
 */

// Mapa de tarefas cron ativas
const activeCronJobs = new Map<number, ReturnType<typeof cron.schedule>>();

// Mapa de timers de intervalo
const activeIntervalTimers = new Map<number, NodeJS.Timeout>();

/**
 * Inicializa o serviço de agendamento
 * Carrega todos os agendamentos ativos do banco
 */
export async function initSchedulerService() {
  console.log("[Scheduler] Initializing scheduler service...");
  
  const db = await getDb();
  if (!db) {
    console.error("[Scheduler] Database not available");
    return;
  }

  try {
    // Carregar todos os agendamentos ativos
    const schedules = await db
      .select()
      .from(desktopScheduledCommands)
      .where(eq(desktopScheduledCommands.status, "active"));

    console.log(`[Scheduler] Found ${schedules.length} active schedules`);

    // Registrar cada agendamento
    for (const schedule of schedules) {
      await registerSchedule(schedule);
    }

    // Iniciar verificação periódica de agendamentos "once" que devem ser executados
    startOnceScheduleChecker();

    console.log("[Scheduler] Scheduler service initialized successfully");
  } catch (error) {
    console.error("[Scheduler] Error initializing scheduler:", error);
  }
}

/**
 * Cria um novo agendamento
 */
export async function createSchedule(data: InsertDesktopScheduledCommand): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.error("[Scheduler] Database not available");
    return 0;
  }

  try {
    // Calcular nextExecutionAt baseado no tipo de agendamento
    const config = JSON.parse(data.scheduleConfig);
    let nextExecutionAt: Date | undefined;

    if (data.scheduleType === "once") {
      nextExecutionAt = new Date(config.executeAt);
    } else if (data.scheduleType === "interval") {
      const startAt = config.startAt ? new Date(config.startAt) : new Date();
      nextExecutionAt = new Date(startAt.getTime() + config.intervalMinutes * 60000);
    } else if (data.scheduleType === "cron") {
      // Para cron, calcular próxima execução baseado na expressão
      nextExecutionAt = getNextCronExecution(config.cronExpression);
    }

    // Inserir no banco
    const result = await db.insert(desktopScheduledCommands).values({
      ...data,
      nextExecutionAt,
    });

    const scheduleId = result[0].insertId;

    // Buscar agendamento completo
    const schedule = await db
      .select()
      .from(desktopScheduledCommands)
      .where(eq(desktopScheduledCommands.id, scheduleId))
      .limit(1);

    if (schedule.length > 0) {
      // Registrar agendamento
      await registerSchedule(schedule[0]);
    }

    console.log(`[Scheduler] Created schedule ${scheduleId}`);
    return scheduleId;
  } catch (error) {
    console.error("[Scheduler] Error creating schedule:", error);
    return 0;
  }
}

/**
 * Registra um agendamento para execução
 */
async function registerSchedule(schedule: any) {
  const config = JSON.parse(schedule.scheduleConfig);

  if (schedule.scheduleType === "cron") {
    // Validar expressão cron
    if (!cron.validate(config.cronExpression)) {
      console.error(`[Scheduler] Invalid cron expression: ${config.cronExpression}`);
      return;
    }

    // Criar tarefa cron
    const task = cron.schedule(config.cronExpression, async () => {
      await executeScheduledCommand(schedule.id);
    });

    activeCronJobs.set(schedule.id, task);
    console.log(`[Scheduler] Registered cron schedule ${schedule.id}: ${config.cronExpression}`);
  } else if (schedule.scheduleType === "interval") {
    // Criar timer de intervalo
    const intervalMs = config.intervalMinutes * 60000;
    
    const timer = setInterval(async () => {
      await executeScheduledCommand(schedule.id);
    }, intervalMs);

    activeIntervalTimers.set(schedule.id, timer);
    console.log(`[Scheduler] Registered interval schedule ${schedule.id}: ${config.intervalMinutes}min`);
  }
  // "once" e "event" são tratados de forma diferente (verificação periódica e eventos)
}

/**
 * Executa um comando agendado
 */
async function executeScheduledCommand(scheduleId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    // Buscar agendamento
    const schedules = await db
      .select()
      .from(desktopScheduledCommands)
      .where(eq(desktopScheduledCommands.id, scheduleId))
      .limit(1);

    if (schedules.length === 0) {
      console.error(`[Scheduler] Schedule ${scheduleId} not found`);
      return;
    }

    const schedule = schedules[0];

    // Verificar se está ativo
    if (schedule.status !== "active") {
      console.log(`[Scheduler] Schedule ${scheduleId} is not active, skipping`);
      return;
    }

    console.log(`[Scheduler] Executing schedule ${scheduleId}: ${schedule.command}`);

    // Enviar comando para o agent
    const server = getDesktopAgentServer();
    if (!server) {
      throw new Error("Desktop Agent Server not available");
    }
    
    // Criar comando no banco primeiro (usando helper do desktop-control)
    const { createCommand } = await import("../db-desktop-control");
    const command = await createCommand(
      schedule.agentId,
      schedule.userId,
      "shell",
      { command: schedule.command }
    );
    
    const success = await server.sendCommand(schedule.agentId, command.id, "shell", { command: schedule.command });

    // Atualizar agendamento
    const updateData: any = {
      lastExecutedAt: new Date(),
      currentRetries: 0, // Reset retries em caso de sucesso
    };

    if (success) {
      updateData.lastResult = "Command sent successfully";
      updateData.lastError = null;

      // Se for "once", marcar como completed
      if (schedule.scheduleType === "once") {
        updateData.status = "completed";
        // Remover da lista de agendamentos ativos
        unregisterSchedule(scheduleId);
      } else {
        // Calcular próxima execução
        updateData.nextExecutionAt = calculateNextExecution(schedule);
      }
    } else {
      // Comando falhou
      updateData.lastError = "Failed to send command";
      updateData.currentRetries = schedule.currentRetries + 1;

      // Verificar se atingiu o máximo de retries
      if (updateData.currentRetries >= schedule.maxRetries) {
        updateData.status = "failed";
        unregisterSchedule(scheduleId);
        console.error(`[Scheduler] Schedule ${scheduleId} failed after ${schedule.maxRetries} retries`);
      }
    }

    await db
      .update(desktopScheduledCommands)
      .set(updateData)
      .where(eq(desktopScheduledCommands.id, scheduleId));

    console.log(`[Scheduler] Schedule ${scheduleId} executed successfully`);
  } catch (error) {
    console.error(`[Scheduler] Error executing schedule ${scheduleId}:`, error);
    
    // Atualizar com erro
    await db
      .update(desktopScheduledCommands)
      .set({
        lastError: String(error),
        currentRetries: (await db
          .select()
          .from(desktopScheduledCommands)
          .where(eq(desktopScheduledCommands.id, scheduleId))
          .limit(1))[0].currentRetries + 1,
      })
      .where(eq(desktopScheduledCommands.id, scheduleId));
  }
}

/**
 * Calcula próxima execução baseado no tipo de agendamento
 */
function calculateNextExecution(schedule: any): Date {
  const config = JSON.parse(schedule.scheduleConfig);
  const now = new Date();

  if (schedule.scheduleType === "interval") {
    return new Date(now.getTime() + config.intervalMinutes * 60000);
  } else if (schedule.scheduleType === "cron") {
    return getNextCronExecution(config.cronExpression);
  }

  return now;
}

/**
 * Calcula próxima execução de uma expressão cron
 */
function getNextCronExecution(cronExpression: string): Date {
  // Implementação simplificada - retorna próxima hora
  // Em produção, usar biblioteca como cron-parser
  const now = new Date();
  return new Date(now.getTime() + 3600000); // +1 hora
}

/**
 * Remove um agendamento da execução
 */
function unregisterSchedule(scheduleId: number) {
  // Parar cron job
  const cronJob = activeCronJobs.get(scheduleId);
  if (cronJob) {
    cronJob.stop();
    activeCronJobs.delete(scheduleId);
    console.log(`[Scheduler] Unregistered cron schedule ${scheduleId}`);
  }

  // Parar timer de intervalo
  const timer = activeIntervalTimers.get(scheduleId);
  if (timer) {
    clearInterval(timer);
    activeIntervalTimers.delete(scheduleId);
    console.log(`[Scheduler] Unregistered interval schedule ${scheduleId}`);
  }
}

/**
 * Pausa um agendamento
 */
export async function pauseSchedule(scheduleId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(desktopScheduledCommands)
      .set({ status: "paused" })
      .where(
        and(
          eq(desktopScheduledCommands.id, scheduleId),
          eq(desktopScheduledCommands.userId, userId)
        )
      );

    unregisterSchedule(scheduleId);
    console.log(`[Scheduler] Paused schedule ${scheduleId}`);
    return true;
  } catch (error) {
    console.error(`[Scheduler] Error pausing schedule:`, error);
    return false;
  }
}

/**
 * Retoma um agendamento pausado
 */
export async function resumeSchedule(scheduleId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(desktopScheduledCommands)
      .set({ status: "active" })
      .where(
        and(
          eq(desktopScheduledCommands.id, scheduleId),
          eq(desktopScheduledCommands.userId, userId)
        )
      );

    // Buscar agendamento e registrar novamente
    const schedules = await db
      .select()
      .from(desktopScheduledCommands)
      .where(eq(desktopScheduledCommands.id, scheduleId))
      .limit(1);

    if (schedules.length > 0) {
      await registerSchedule(schedules[0]);
    }

    console.log(`[Scheduler] Resumed schedule ${scheduleId}`);
    return true;
  } catch (error) {
    console.error(`[Scheduler] Error resuming schedule:`, error);
    return false;
  }
}

/**
 * Deleta um agendamento
 */
export async function deleteSchedule(scheduleId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    unregisterSchedule(scheduleId);

    await db
      .delete(desktopScheduledCommands)
      .where(
        and(
          eq(desktopScheduledCommands.id, scheduleId),
          eq(desktopScheduledCommands.userId, userId)
        )
      );

    console.log(`[Scheduler] Deleted schedule ${scheduleId}`);
    return true;
  } catch (error) {
    console.error(`[Scheduler] Error deleting schedule:`, error);
    return false;
  }
}

/**
 * Lista agendamentos de um usuário
 */
export async function listUserSchedules(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(desktopScheduledCommands)
      .where(eq(desktopScheduledCommands.userId, userId));
  } catch (error) {
    console.error("[Scheduler] Error listing schedules:", error);
    return [];
  }
}

/**
 * Verifica periodicamente agendamentos "once" que devem ser executados
 */
function startOnceScheduleChecker() {
  setInterval(async () => {
    const db = await getDb();
    if (!db) return;

    try {
      const now = new Date();
      
      // Buscar agendamentos "once" ativos que devem ser executados
      const schedules = await db
        .select()
        .from(desktopScheduledCommands)
        .where(
          and(
            eq(desktopScheduledCommands.scheduleType, "once"),
            eq(desktopScheduledCommands.status, "active"),
            lte(desktopScheduledCommands.nextExecutionAt, now)
          )
        );

      for (const schedule of schedules) {
        await executeScheduledCommand(schedule.id);
      }
    } catch (error) {
      console.error("[Scheduler] Error in once schedule checker:", error);
    }
  }, 60000); // Verificar a cada 1 minuto
}
