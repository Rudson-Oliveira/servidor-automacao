/**
 * Sistema Avançado de Orquestração de Agentes
 * 
 * Gerencia múltiplos agentes de automação com:
 * - Balanceamento de carga inteligente
 * - Priorização de tarefas
 * - Retry automático com backoff exponencial
 * - Circuit breaker para proteção
 * - Métricas em tempo real
 */

import { EventEmitter } from "events";

export interface Agent {
  id: string;
  name: string;
  status: "idle" | "busy" | "offline" | "error";
  capabilities: string[];
  currentLoad: number;
  maxLoad: number;
  lastHeartbeat: number;
  totalTasksCompleted: number;
  totalTasksFailed: number;
  averageResponseTime: number;
}

export interface Task {
  id: string;
  type: string;
  priority: number; // 1-10 (10 = mais alta)
  payload: any;
  retries: number;
  maxRetries: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  assignedAgent?: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  error?: string;
}

export interface OrchestratorStats {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  busyAgents: number;
  offlineAgents: number;
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageWaitTime: number;
  averageExecutionTime: number;
}

class AgentOrchestrator extends EventEmitter {
  private agents = new Map<string, Agent>();
  private tasks = new Map<string, Task>();
  private taskQueue: Task[] = [];
  
  // Circuit breaker
  private circuitBreaker = new Map<string, {
    failures: number;
    lastFailure: number;
    state: "closed" | "open" | "half-open";
  }>();
  
  constructor() {
    super();
    this.startHealthCheck();
    this.startTaskProcessor();
  }
  
  /**
   * Registrar novo agente
   */
  registerAgent(agent: Omit<Agent, "status" | "currentLoad" | "lastHeartbeat" | "totalTasksCompleted" | "totalTasksFailed" | "averageResponseTime">): void {
    const fullAgent: Agent = {
      ...agent,
      status: "idle",
      currentLoad: 0,
      lastHeartbeat: Date.now(),
      totalTasksCompleted: 0,
      totalTasksFailed: 0,
      averageResponseTime: 0,
    };
    
    this.agents.set(agent.id, fullAgent);
    this.emit("agent:registered", fullAgent);
    console.log(`[Orchestrator] Agente registrado: ${agent.name} (${agent.id})`);
  }
  
  /**
   * Atualizar heartbeat do agente
   */
  heartbeat(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastHeartbeat = Date.now();
      if (agent.status === "offline") {
        agent.status = "idle";
        this.emit("agent:online", agent);
      }
    }
  }
  
  /**
   * Submeter nova tarefa
   */
  submitTask(task: Omit<Task, "id" | "retries" | "createdAt" | "status">): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullTask: Task = {
      ...task,
      id: taskId,
      retries: 0,
      createdAt: Date.now(),
      status: "pending",
    };
    
    this.tasks.set(taskId, fullTask);
    this.taskQueue.push(fullTask);
    
    // Ordenar por prioridade (maior primeiro)
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    
    this.emit("task:submitted", fullTask);
    console.log(`[Orchestrator] Tarefa submetida: ${taskId} (prioridade: ${task.priority})`);
    
    return taskId;
  }
  
  /**
   * Selecionar melhor agente para tarefa
   */
  private selectAgent(task: Task): Agent | null {
    const availableAgents = Array.from(this.agents.values()).filter(agent => {
      // Verificar se agente está disponível
      if (agent.status !== "idle" && agent.currentLoad >= agent.maxLoad) {
        return false;
      }
      
      // Verificar se agente tem capacidade necessária
      if (!agent.capabilities.includes(task.type)) {
        return false;
      }
      
      // Verificar circuit breaker
      const cb = this.circuitBreaker.get(agent.id);
      if (cb && cb.state === "open") {
        // Verificar se já passou tempo suficiente para tentar novamente
        if (Date.now() - cb.lastFailure < 60000) { // 1 minuto
          return false;
        }
        // Mudar para half-open
        cb.state = "half-open";
      }
      
      return true;
    });
    
    if (availableAgents.length === 0) {
      return null;
    }
    
    // Selecionar agente com menor carga
    return availableAgents.reduce((best, current) => {
      const bestScore = best.currentLoad / best.maxLoad;
      const currentScore = current.currentLoad / current.maxLoad;
      return currentScore < bestScore ? current : best;
    });
  }
  
  /**
   * Processar fila de tarefas
   */
  private async processTaskQueue(): Promise<void> {
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue[0];
      
      if (!task) break;
      
      const agent = this.selectAgent(task);
      
      if (!agent) {
        // Nenhum agente disponível, aguardar
        break;
      }
      
      // Remover da fila
      this.taskQueue.shift();
      
      // Atribuir ao agente
      task.assignedAgent = agent.id;
      task.status = "running";
      task.startedAt = Date.now();
      
      agent.currentLoad++;
      agent.status = agent.currentLoad >= agent.maxLoad ? "busy" : "idle";
      
      this.emit("task:assigned", { task, agent });
      
      // Executar tarefa (simulado - na prática seria enviado ao agente)
      this.executeTask(task, agent);
    }
  }
  
  /**
   * Executar tarefa no agente
   */
  private async executeTask(task: Task, agent: Agent): Promise<void> {
    try {
      // Simulação de execução
      // Na prática, isso enviaria comando para o agente via WebSocket/HTTP
      
      const startTime = Date.now();
      
      // Simular sucesso/falha baseado em probabilidade
      const success = Math.random() > 0.1; // 90% de sucesso
      
      if (success) {
        task.status = "completed";
        task.completedAt = Date.now();
        
        agent.totalTasksCompleted++;
        
        // Atualizar tempo médio de resposta
        const responseTime = Date.now() - startTime;
        agent.averageResponseTime = 
          (agent.averageResponseTime * (agent.totalTasksCompleted - 1) + responseTime) / 
          agent.totalTasksCompleted;
        
        // Resetar circuit breaker
        this.circuitBreaker.delete(agent.id);
        
        this.emit("task:completed", { task, agent });
      } else {
        throw new Error("Falha simulada na execução");
      }
    } catch (error) {
      await this.handleTaskFailure(task, agent, error);
    } finally {
      // Liberar agente
      agent.currentLoad--;
      agent.status = agent.currentLoad > 0 ? "busy" : "idle";
    }
  }
  
  /**
   * Tratar falha na execução de tarefa
   */
  private async handleTaskFailure(task: Task, agent: Agent, error: any): Promise<void> {
    task.retries++;
    agent.totalTasksFailed++;
    
    // Atualizar circuit breaker
    const cb = this.circuitBreaker.get(agent.id) || {
      failures: 0,
      lastFailure: 0,
      state: "closed" as const,
    };
    
    cb.failures++;
    cb.lastFailure = Date.now();
    
    if (cb.failures >= 3) {
      cb.state = "open";
      agent.status = "error";
      this.emit("agent:circuit-open", agent);
    }
    
    this.circuitBreaker.set(agent.id, cb);
    
    // Verificar se deve tentar novamente
    if (task.retries < task.maxRetries) {
      // Backoff exponencial
      const delay = Math.min(1000 * Math.pow(2, task.retries), 30000);
      
      setTimeout(() => {
        task.status = "pending";
        task.assignedAgent = undefined;
        this.taskQueue.push(task);
        this.taskQueue.sort((a, b) => b.priority - a.priority);
        
        this.emit("task:retry", { task, delay });
      }, delay);
    } else {
      task.status = "failed";
      task.error = error.message;
      this.emit("task:failed", { task, error });
    }
  }
  
  /**
   * Health check periódico dos agentes
   */
  private startHealthCheck(): void {
    setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 segundos
      
      for (const agent of Array.from(this.agents.values())) {
        if (now - agent.lastHeartbeat > timeout && agent.status !== "offline") {
          agent.status = "offline";
          this.emit("agent:offline", agent);
          console.log(`[Orchestrator] Agente offline: ${agent.name} (${agent.id})`);
        }
      }
    }, 10000); // Verificar a cada 10 segundos
  }
  
  /**
   * Processar fila de tarefas periodicamente
   */
  private startTaskProcessor(): void {
    setInterval(() => {
      this.processTaskQueue();
    }, 1000); // Processar a cada 1 segundo
  }
  
  /**
   * Obter estatísticas do orquestrador
   */
  getStats(): OrchestratorStats {
    const agents = Array.from(this.agents.values());
    const tasks = Array.from(this.tasks.values());
    
    const completedTasks = tasks.filter(t => t.status === "completed");
    const averageWaitTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => sum + ((t.startedAt || 0) - t.createdAt), 0) / completedTasks.length
      : 0;
    
    const averageExecutionTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => sum + ((t.completedAt || 0) - (t.startedAt || 0)), 0) / completedTasks.length
      : 0;
    
    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status !== "offline").length,
      idleAgents: agents.filter(a => a.status === "idle").length,
      busyAgents: agents.filter(a => a.status === "busy").length,
      offlineAgents: agents.filter(a => a.status === "offline").length,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === "pending").length,
      runningTasks: tasks.filter(t => t.status === "running").length,
      completedTasks: tasks.filter(t => t.status === "completed").length,
      failedTasks: tasks.filter(t => t.status === "failed").length,
      averageWaitTime: Math.round(averageWaitTime),
      averageExecutionTime: Math.round(averageExecutionTime),
    };
  }
  
  /**
   * Obter lista de agentes
   */
  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Obter lista de tarefas
   */
  getTasks(): Task[] {
    return Array.from(this.tasks.values());
  }
  
  /**
   * Cancelar tarefa
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== "pending") {
      return false;
    }
    
    task.status = "cancelled";
    const index = this.taskQueue.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.taskQueue.splice(index, 1);
    }
    
    this.emit("task:cancelled", task);
    return true;
  }
}

// Instância singleton
export const orchestrator = new AgentOrchestrator();
