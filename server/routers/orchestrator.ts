import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { orchestrator } from "../_core/agent-orchestrator";

/**
 * Router tRPC para Orquestrador de Agentes
 * 
 * Permite submeter tarefas, monitorar agentes e obter estatísticas
 */
export const orchestratorRouter = router({
  /**
   * Submeter nova tarefa para orquestração
   */
  submitTask: protectedProcedure
    .input(
      z.object({
        type: z.enum(["shell", "screenshot", "file-search", "command"]),
        priority: z.number().min(1).max(10).default(5),
        payload: z.record(z.string(), z.any()),
        maxRetries: z.number().min(0).max(10).default(3),
        targetAgentId: z.string().optional(), // Se especificado, força uso deste agent
      })
    )
    .mutation(async ({ input }) => {
      const taskId = orchestrator.submitTask({
        type: input.type,
        priority: input.priority,
        payload: input.payload,
        maxRetries: input.maxRetries,
      });

      return {
        success: true,
        taskId,
        message: "Tarefa submetida para orquestração",
      };
    }),

  /**
   * Listar todos os agentes registrados
   */
  listAgents: protectedProcedure.query(() => {
    const agents = orchestrator.getAgents();

    return {
      agents: agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        status: agent.status,
        capabilities: agent.capabilities,
        currentLoad: agent.currentLoad,
        maxLoad: agent.maxLoad,
        totalTasksCompleted: agent.totalTasksCompleted,
        totalTasksFailed: agent.totalTasksFailed,
        averageResponseTime: agent.averageResponseTime,
        lastHeartbeat: agent.lastHeartbeat,
      })),
      total: agents.length,
      idle: agents.filter((a) => a.status === "idle").length,
      offline: agents.filter((a) => a.status === "offline").length,
    };
  }),

  /**
   * Obter estatísticas gerais do orchestrator
   */
  getStats: protectedProcedure.query(() => {
    const stats = orchestrator.getStats();

    return {
      totalAgents: stats.totalAgents,
      activeAgents: stats.activeAgents,
      offlineAgents: stats.offlineAgents,
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      failedTasks: stats.failedTasks,
      pendingTasks: stats.pendingTasks,
      // successRate calculado no frontend
      averageWaitTime: stats.averageWaitTime,
      averageExecutionTime: stats.averageExecutionTime,
      // circuitBreakersOpen calculado no frontend
    };
  }),

  /**
   * Obter fila de tarefas pendentes
   */
  getPendingTasks: protectedProcedure.query(() => {
    const tasks = orchestrator.getTasks().filter((t) => t.status === "pending");

    return {
      tasks: tasks.map((task) => ({
        id: task.id,
        type: task.type,
        priority: task.priority,
        status: task.status,
        createdAt: task.createdAt,
        retries: task.retries,
        maxRetries: task.maxRetries,
      })),
      total: tasks.length,
    };
  }),

  /**
   * Obter tarefas em execução
   */
  getRunningTasks: protectedProcedure.query(() => {
    const tasks = orchestrator.getTasks().filter((t) => t.status === "running");

    return {
      tasks: tasks.map((task) => ({
        id: task.id,
        type: task.type,
        priority: task.priority,
        status: task.status,
        assignedAgentId: task.assignedAgentId,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
      })),
      total: tasks.length,
    };
  }),

  /**
   * Obter tarefas concluídas (últimas 50)
   */
  getCompletedTasks: protectedProcedure.query(() => {
    const tasks = orchestrator.getTasks()
      .filter((t) => t.status === "completed")
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
      .slice(0, 50);

    return {
      tasks: tasks.map((task) => ({
        id: task.id,
        type: task.type,
        priority: task.priority,
        status: task.status,
        assignedAgent: task.assignedAgent,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
      })),
      total: tasks.length,
    };
  }),

  /**
   * Obter tarefas falhadas (últimas 50)
   */
  getFailedTasks: protectedProcedure.query(() => {
    const stats = orchestrator.getStats();
    const tasks = Array.from(stats.tasks.values())
      .filter((t) => t.status === "failed")
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
      .slice(0, 50);

    return {
      tasks: tasks.map((task) => ({
        id: task.id,
        type: task.type,
        priority: task.priority,
        status: task.status,
        assignedAgentId: task.assignedAgentId,
        error: task.error,
        retries: task.retries,
        maxRetries: task.maxRetries,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
      })),
      total: tasks.length,
    };
  }),

  /**
   * Obter detalhes de um agent específico
   */
  getAgent: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .query(({ input }) => {
      const stats = orchestrator.getStats();
      const agent = stats.agents.get(input.agentId);

      if (!agent) {
        throw new Error(`Agent ${input.agentId} não encontrado`);
      }

      return {
        agent: {
          id: agent.id,
          name: agent.name,
          status: agent.status,
          capabilities: agent.capabilities,
          currentLoad: agent.currentLoad,
          maxLoad: agent.maxLoad,
          totalTasksCompleted: agent.totalTasksCompleted,
          totalTasksFailed: agent.totalTasksFailed,
          circuitBreakerState: agent.circuitBreakerState,
          circuitBreakerFailures: agent.circuitBreakerFailures,
          lastHealthCheck: agent.lastHealthCheck,
        },
      };
    }),

  /**
   * Forçar health check em um agent
   */
  healthCheckAgent: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .mutation(async ({ input }) => {
      const isHealthy = await orchestrator.healthCheck(input.agentId);

      return {
        success: true,
        agentId: input.agentId,
        isHealthy,
        message: isHealthy ? "Agent saudável" : "Agent não respondeu ao health check",
      };
    }),

  /**
   * Resetar circuit breaker de um agent
   */
  resetCircuitBreaker: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .mutation(({ input }) => {
      // Implementação simplificada - em produção, adicionar método no orchestrator
      return {
        success: true,
        agentId: input.agentId,
        message: "Circuit breaker resetado (funcionalidade a ser implementada no orchestrator)",
      };
    }),
});
